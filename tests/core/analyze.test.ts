import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { Transaction } from '../../src/core/types'
import { parseStatement } from '../../src/core/parse'
import { categorizeAll } from '../../src/core/categorize'
import {
  realSpendTotal,
  naiveMonobankSpendTotal,
  totalsByCategory,
  monthlySpendSeries,
  detectRecurring,
  detectAnomalies,
  monthlyCashflow,
  burnRateForecast,
  listMonths,
} from '../../src/core/analyze'

const FIXTURE_PATH = path.resolve(process.cwd(), 'tests/fixtures/sample-statement.csv')

let transactions: Transaction[]

beforeAll(() => {
  const text = readFileSync(FIXTURE_PATH, 'utf-8')
  const parsed = parseStatement(text, 'main-card')
  if (!parsed.ok) throw new Error('fixture failed to parse')
  transactions = categorizeAll(parsed.transactions)
})

describe('realSpendTotal vs naiveMonobankSpendTotal', () => {
  it('excludes transfers, debt draws, savings and cash withdrawals from real spend', () => {
    const real = realSpendTotal(transactions)
    const naive = naiveMonobankSpendTotal(transactions)
    // The fixture includes P2P transfers, credit draws, a savings jar top-up, and cash
    // withdrawals — Monobank's naive number must be strictly larger than the honest one.
    expect(naive).toBeGreaterThan(real)
  })

  it('never counts an income row as spend', () => {
    const total = realSpendTotal(transactions.filter((tx) => tx.kind === 'income'))
    expect(total).toBe(0)
  })
})

describe('totalsByCategory', () => {
  it('nets a refund against its category rather than double counting', () => {
    const totals = totalsByCategory(transactions)
    // Rozetka's May cancellation refunds part of an earlier Rozetka purchase, but the
    // category should still net positive — refunds reduce spend, they don't erase history.
    const electronics = totals.get('shopping.electronics') ?? 0
    expect(electronics).toBeGreaterThan(0)
  })
})

describe('monthlySpendSeries', () => {
  it('produces one point per month present in the data', () => {
    const series = monthlySpendSeries(transactions)
    expect(series.map((p) => p.month)).toEqual(listMonths(transactions))
    expect(series.every((p) => p.total >= 0)).toBe(true)
  })
})

describe('detectRecurring', () => {
  it('flags a merchant charged three months running at a stable amount', () => {
    const recurring = detectRecurring(transactions)
    const netflix = recurring.find((r) => r.merchant === 'Netflix')
    expect(netflix).toBeDefined()
    expect(netflix?.occurrences).toBe(3)
    expect(netflix?.avgAmount).toBeCloseTo(219, 0)
  })

  it('never flags a transfer as a recurring merchant', () => {
    const recurring = detectRecurring(transactions)
    expect(recurring.find((r) => r.merchant === 'Олена П.')).toBeUndefined()
  })
})

describe('detectAnomalies', () => {
  it('returns a sorted, well-formed list', () => {
    const anomalies = detectAnomalies(transactions)
    for (let i = 1; i < anomalies.length; i++) {
      expect(Math.abs(anomalies[i - 1].transaction.amount)).toBeGreaterThanOrEqual(
        Math.abs(anomalies[i].transaction.amount),
      )
    }
  })
})

describe('monthlyCashflow / burnRateForecast', () => {
  it('computes a savings rate between -infinity and 1 for months with income', () => {
    const flow = monthlyCashflow(transactions)
    for (const month of flow) {
      if (month.savingsRate !== null) expect(month.savingsRate).toBeLessThanOrEqual(1)
    }
  })

  it('forecasts the partial last month (June) to a higher full-month total', () => {
    const forecast = burnRateForecast(transactions)
    expect(forecast).not.toBeNull()
    expect(forecast?.month).toBe('2025-06')
    expect(forecast?.daysElapsed).toBeLessThan(forecast!.daysInMonth)
    expect(forecast?.projectedTotal).toBeGreaterThanOrEqual(forecast!.spendSoFar)
  })
})
