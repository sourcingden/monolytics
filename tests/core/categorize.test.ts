import { describe, it, expect } from 'vitest'
import type { Transaction } from '../../src/core/types'
import { categorizeTransaction, categorizeAll } from '../../src/core/categorize'
import { createIdRule } from '../../src/core/categorize/rules'
import { matchStructuralPattern } from '../../src/core/categorize/structuralPatterns'
import { matchTransferPattern } from '../../src/core/categorize/transfers'
import { matchMerchant } from '../../src/core/categorize/merchants'
import { mccToCategory } from '../../src/core/categorize/mcc'

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: 'tx1',
    date: new Date('2025-06-01T12:00:00'),
    description: 'Test',
    merchant: 'Test',
    mcc: null,
    amount: -100,
    currency: 'UAH',
    opAmount: null,
    opCurrency: null,
    rate: null,
    commission: 0,
    cashback: 0,
    balanceAfter: null,
    accountId: 'acc',
    category: 'uncategorized',
    categorySource: 'fallback',
    kind: 'spend',
    ...overrides,
  }
}

describe('structural patterns', () => {
  it('detects a cash withdrawal regardless of MCC', () => {
    const match = matchStructuralPattern(tx({ description: 'Видача готівки NOVUS', mcc: 5411 }))
    expect(match?.kind).toBe('cash_withdrawal')
    expect(match?.category).toBe('cash.withdrawal')
  })

  it('extracts the real merchant from an installment payment', () => {
    const match = matchStructuralPattern(tx({ description: 'Щомісячний платіж COMFY', mcc: 4829 }))
    expect(match?.kind).toBe('spend')
    expect(match?.merchantHint).toBe('COMFY')
    expect(match?.category).toBeUndefined()
  })

  it('reads an incoming named transfer as income', () => {
    const match = matchStructuralPattern(tx({ description: 'Від: Юрій Дінкевич', amount: 9900 }))
    expect(match?.kind).toBe('income')
    expect(match?.category).toBe('income')
  })

  it('treats a cancellation as a refund and hints at the original merchant', () => {
    const match = matchStructuralPattern(tx({ description: 'Скасування. FOP Seidova Oks', amount: 200 }))
    expect(match?.kind).toBe('refund')
    expect(match?.merchantHint).toBe('FOP Seidova Oks')
  })
})

describe('transfer patterns (MCC 4829 sub-classification)', () => {
  it('classifies a Monobank instant-credit draw as debt, not income', () => {
    const match = matchTransferPattern(tx({ description: 'Кредит До завтра на 14 днів', mcc: 4829, amount: 2000 }))
    expect(match?.kind).toBe('debt')
    expect(match?.category).toBe('finance.credit')
  })

  it('classifies an installment draw as debt', () => {
    const match = matchTransferPattern(tx({ description: 'Розстрочка на картку', mcc: 4829, amount: 4000 }))
    expect(match?.kind).toBe('debt')
  })

  it('classifies a savings jar top-up separately from spend', () => {
    const match = matchTransferPattern(
      tx({ description: 'Поповнення «На генератор» вiд Олексій Л.', mcc: 4829, amount: -2037.92 }),
    )
    expect(match?.kind).toBe('savings_contribution')
  })

  it('classifies a move between own accounts as an internal transfer', () => {
    const match = matchTransferPattern(tx({ description: 'З гривневого рахунку ФОП', mcc: 4829, amount: 6608.2 }))
    expect(match?.kind).toBe('transfer_internal')
  })

  it('classifies a named person with a commission as a P2P transfer, not an internal move', () => {
    const match = matchTransferPattern(tx({ description: "Дар'я Г.", mcc: 4829, amount: -310.5, commission: 10.5 }))
    expect(match?.kind).toBe('transfer_p2p')
  })

  it('classifies a named person with no commission as an internal transfer', () => {
    const match = matchTransferPattern(tx({ description: 'Іван П.', mcc: 4829, amount: -500, commission: 0 }))
    expect(match?.kind).toBe('transfer_internal')
  })

  it('does not fire for a non-4829 MCC with no other pattern match', () => {
    const match = matchTransferPattern(tx({ description: 'Сільпо', mcc: 5411, amount: -100 }))
    expect(match).toBeNull()
  })
})

describe('merchant dictionary', () => {
  it('normalizes a known Ukrainian grocery chain', () => {
    expect(matchMerchant('SILPO 45')).toEqual({ merchant: 'Сільпо', category: 'food.groceries' })
  })

  it('distinguishes a coffee shop from a generic restaurant by name', () => {
    expect(matchMerchant('Aroma Kava')?.category).toBe('food.coffee')
    expect(matchMerchant("McDonald's")?.category).toBe('food.cafe')
  })

  it('returns null for an unknown merchant', () => {
    expect(matchMerchant('Zzznonexistent Merchant Inc')).toBeNull()
  })
})

describe('MCC table', () => {
  it('maps a known code to a category', () => {
    expect(mccToCategory(5411)).toBe('food.groceries')
  })
  it('returns null for an unknown or missing code', () => {
    expect(mccToCategory(9999)).toBeNull()
    expect(mccToCategory(null)).toBeNull()
  })
})

describe('categorization cascade priority', () => {
  it('falls through user > pattern > merchant > mcc > fallback in order', () => {
    // MCC only
    const mccOnly = categorizeTransaction(tx({ description: 'Unknown Shop', mcc: 5411 }))
    expect(mccOnly.categorySource).toBe('mcc')
    expect(mccOnly.category).toBe('food.groceries')

    // Merchant dictionary beats MCC
    const merchantWins = categorizeTransaction(tx({ description: 'Сільпо', mcc: 9999 }))
    expect(merchantWins.categorySource).toBe('merchant')
    expect(merchantWins.category).toBe('food.groceries')
    expect(merchantWins.merchant).toBe('Сільпо')

    // Structural pattern beats merchant dictionary
    const patternWins = categorizeTransaction(tx({ description: 'Видача готівки NOVUS', mcc: 5411 }))
    expect(patternWins.categorySource).toBe('pattern')
    expect(patternWins.kind).toBe('cash_withdrawal')

    // User rule beats everything
    const target = tx({ id: 'special-1', description: 'Сільпо', mcc: 5411 })
    const rule = createIdRule(target, 'kids')
    const userWins = categorizeTransaction(target, { userRules: [rule] })
    expect(userWins.categorySource).toBe('user')
    expect(userWins.category).toBe('kids')

    // Unknown everything -> fallback
    const fallback = categorizeTransaction(tx({ description: 'Completely Unknown Vendor XYZ', mcc: null }))
    expect(fallback.categorySource).toBe('fallback')
    expect(fallback.category).toBe('uncategorized')
  })

  it('resolves an installment payment merchant hint through the merchant dictionary', () => {
    const result = categorizeTransaction(tx({ description: 'Щомісячний платіж COMFY', mcc: 4829, amount: -537.38 }))
    // The pattern layer only decides kind=spend and hands "COMFY" on; the merchant
    // dictionary then resolves the real category — Comfy is a real UA electronics chain.
    expect(result.kind).toBe('spend')
    expect(result.category).toBe('shopping.electronics')
    expect(result.categorySource).toBe('merchant')
    expect(result.merchant).toBe('Comfy')
  })

  it('falls back to the merchant hint text itself when it matches nothing', () => {
    const result = categorizeTransaction(tx({ description: 'Щомісячний платіж ZZZNOPE', mcc: 4829, amount: -100 }))
    expect(result.kind).toBe('spend')
    expect(result.category).toBe('uncategorized')
    expect(result.categorySource).toBe('fallback')
  })

  it('categorizeAll processes a batch and never mutates its input', () => {
    const input = [tx({ id: 'a', description: 'Сільпо' }), tx({ id: 'b', description: 'WOG', mcc: 5541 })]
    const snapshot = JSON.parse(JSON.stringify(input))
    const result = categorizeAll(input)
    expect(result).toHaveLength(2)
    expect(JSON.parse(JSON.stringify(input))).toEqual(snapshot)
  })
})
