import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { Transaction } from '../../src/core/types'
import { parseStatement } from '../../src/core/parse'
import { categorizeAll } from '../../src/core/categorize'
import { INSIGHT_DETECTORS, runAllDetectors } from '../../src/core/insights'
import { uncategorizedNudgeDetector } from '../../src/core/insights/detectors/uncategorizedNudge'
import { microloanUsageDetector } from '../../src/core/insights/detectors/microloanUsage'
import { cashBlackholeDetector } from '../../src/core/insights/detectors/cashBlackhole'
import { categoryGrowthDetector } from '../../src/core/insights/detectors/categoryGrowth'

const FIXTURE_PATH = path.resolve(process.cwd(), 'tests/fixtures/sample-statement.csv')

let transactions: Transaction[]

beforeAll(() => {
  const text = readFileSync(FIXTURE_PATH, 'utf-8')
  const parsed = parseStatement(text, 'main-card')
  if (!parsed.ok) throw new Error('fixture failed to parse')
  transactions = categorizeAll(parsed.transactions)
})

describe('registry', () => {
  it('has all 18 detectors from the plan', () => {
    expect(INSIGHT_DETECTORS).toHaveLength(18)
  })

  it('runs every detector against the fixture without throwing', () => {
    const insights = runAllDetectors({ transactions })
    expect(Array.isArray(insights)).toBe(true)
    for (const insight of insights) {
      expect(typeof insight.id).toBe('string')
      expect(insight.id.length).toBeGreaterThan(0)
    }
  })

  it('never emits an advice-shaped insight without a savings number, where the detector defines one', () => {
    // Spot-check the detectors whose whole point is a savings estimate.
    const insights = runAllDetectors({ transactions })
    const advisory = insights.filter((i) =>
      ['recurring', 'zombieSubscription', 'latteFactor', 'deliveryVsGroceries', 'feesAndFx'].includes(i.type),
    )
    for (const insight of advisory) {
      expect(insight.annualSavingsPotential).toBeGreaterThan(0)
    }
  })
})

describe('specific detectors on the fixture', () => {
  it('recurring: finds Netflix as a subscription', () => {
    const insights = runAllDetectors({ transactions })
    const netflix = insights.find((i) => i.type === 'recurring' && i.merchant === 'Netflix')
    expect(netflix).toBeDefined()
  })

  it('zombieSubscription: flags Netflix (3 months) but not Spotify (2 months)', () => {
    const insights = runAllDetectors({ transactions })
    const zombies = insights.filter((i) => i.type === 'zombieSubscription')
    expect(zombies.some((i) => i.type === 'zombieSubscription' && i.merchant === 'Netflix')).toBe(true)
    expect(zombies.some((i) => i.type === 'zombieSubscription' && i.merchant === 'Spotify')).toBe(false)
  })

  it('latteFactor: catches the daily coffee habit', () => {
    const insights = runAllDetectors({ transactions })
    const coffee = insights.find((i) => i.type === 'latteFactor' && i.category === 'food.coffee')
    expect(coffee).toBeDefined()
    if (coffee?.type === 'latteFactor') {
      expect(coffee.count).toBeGreaterThanOrEqual(8)
    }
  })

  it('impulseCluster: catches the late-night purchase bursts', () => {
    const insights = runAllDetectors({ transactions })
    const cluster = insights.find((i) => i.type === 'impulseCluster')
    expect(cluster).toBeDefined()
  })

  it('microloanUsage: counts the "Кредит До завтра" draws', () => {
    const insights = microloanUsageDetector.run({ transactions })
    expect(insights).toHaveLength(1)
    if (insights[0].type === 'microloanUsage') {
      expect(insights[0].drawCount).toBe(3)
    }
  })

  it('cashBlackhole: totals cash withdrawals', () => {
    const insights = cashBlackholeDetector.run({ transactions })
    expect(insights).toHaveLength(1)
    if (insights[0].type === 'cashBlackhole') {
      expect(insights[0].totalWithdrawn).toBeCloseTo(1000 + 1200 + 1500, 0)
    }
  })
})

describe('uncategorizedNudge in isolation', () => {
  it('fires when spend lands in the fallback category', () => {
    const tx: Transaction = {
      id: 'u1',
      date: new Date('2025-06-01'),
      description: 'Totally Unknown Vendor',
      merchant: 'Totally Unknown Vendor',
      mcc: null,
      amount: -500,
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
    }
    const insights = uncategorizedNudgeDetector.run({ transactions: [tx] })
    expect(insights).toHaveLength(1)
    if (insights[0].type === 'uncategorizedNudge') {
      expect(insights[0].totalAmount).toBe(500)
      expect(insights[0].topMerchants[0].merchant).toBe('Totally Unknown Vendor')
    }
  })
})

describe('categoryGrowth guards against a near-zero baseline', () => {
  function spendTx(id: string, date: string, category: string, amount: number): Transaction {
    return {
      id,
      date: new Date(date),
      description: category,
      merchant: category,
      mcc: null,
      amount: -amount,
      currency: 'UAH',
      opAmount: null,
      opCurrency: null,
      rate: null,
      commission: 0,
      cashback: 0,
      balanceAfter: null,
      accountId: 'acc',
      category,
      categorySource: 'fallback',
      kind: 'spend',
    }
  }

  it('does not fire a distorted percentage off a near-empty prior month', () => {
    // One 299 UAH purchase in May, one big 6200 UAH purchase in June — mathematically a
    // huge percentage, but not a meaningful "category grew" signal.
    const txs = [
      spendTx('a', '2025-05-09T12:00:00', 'shopping.electronics', 299),
      spendTx('b', '2025-06-18T12:00:00', 'shopping.electronics', 6200),
    ]
    expect(categoryGrowthDetector.run({ transactions: txs })).toHaveLength(0)
  })

  it('does fire when both months have a meaningful base', () => {
    const txs = [
      spendTx('a', '2025-05-05T12:00:00', 'food.groceries', 1000),
      spendTx('b', '2025-06-05T12:00:00', 'food.groceries', 1500),
    ]
    const insights = categoryGrowthDetector.run({ transactions: txs })
    expect(insights).toHaveLength(1)
    if (insights[0].type === 'categoryGrowth') {
      expect(insights[0].deltaPct).toBeCloseTo(0.5, 5)
    }
  })
})
