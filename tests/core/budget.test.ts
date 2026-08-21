import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { Transaction } from '../../src/core/types'
import { parseStatement } from '../../src/core/parse'
import { categorizeAll } from '../../src/core/categorize'
import {
  computeFiftyThirtyTwenty,
  averageSavingsRate,
  computeEmergencyFund,
  simulateCategoryCut,
  simulateSavingsGrowth,
  computeCheckup,
} from '../../src/core/budget'

const FIXTURE_PATH = path.resolve(process.cwd(), 'tests/fixtures/sample-statement.csv')

let transactions: Transaction[]

beforeAll(() => {
  const text = readFileSync(FIXTURE_PATH, 'utf-8')
  const parsed = parseStatement(text, 'main-card')
  if (!parsed.ok) throw new Error('fixture failed to parse')
  transactions = categorizeAll(parsed.transactions)
})

describe('computeFiftyThirtyTwenty', () => {
  it('splits real spend into needs/wants without double counting income', () => {
    const result = computeFiftyThirtyTwenty(transactions)
    expect(result.income).toBeGreaterThan(0)
    expect(result.needs).toBeGreaterThan(0)
    expect(result.wants).toBeGreaterThan(0)
    // needs + wants + uncategorized should never exceed income by an absurd margin on this fixture
    expect(result.needs + result.wants + result.uncategorized).toBeLessThan(result.income)
  })
})

describe('averageSavingsRate', () => {
  it('returns a plausible rate for months with income', () => {
    const rate = averageSavingsRate(transactions)
    expect(rate).not.toBeNull()
    expect(rate!).toBeGreaterThan(-1)
    expect(rate!).toBeLessThanOrEqual(1)
  })
})

describe('computeEmergencyFund', () => {
  it('sizes a 6-month cushion at twice the 3-month one', () => {
    const fund = computeEmergencyFund(transactions)
    expect(fund.target6Months).toBeCloseTo(fund.target3Months * 2, 5)
    expect(fund.avgMonthlyEssentialSpend).toBeGreaterThan(0)
  })
})

describe('simulateCategoryCut', () => {
  it('reduces the annual projection by exactly the cut percentage', () => {
    const result = simulateCategoryCut(transactions, 'food.coffee', 0.5)
    expect(result.newAnnual).toBeCloseTo(result.currentAnnual * 0.5, 2)
    expect(result.annualSavings).toBeCloseTo(result.currentAnnual * 0.5, 2)
  })
})

describe('simulateSavingsGrowth', () => {
  it('at 0% interest, future value equals total contributed', () => {
    const points = simulateSavingsGrowth(1000, 0, [1, 3])
    expect(points[0].futureValue).toBeCloseTo(12000, 2)
    expect(points[0].interestEarned).toBeCloseTo(0, 2)
  })

  it('at a positive rate, future value exceeds total contributed', () => {
    const points = simulateSavingsGrowth(1000, 0.08, [5])
    expect(points[0].futureValue).toBeGreaterThan(points[0].contributed)
  })
})

describe('computeCheckup', () => {
  it('produces a score between 0 and 100', () => {
    const checkup = computeCheckup(transactions)
    expect(checkup.score).toBeGreaterThanOrEqual(0)
    expect(checkup.score).toBeLessThanOrEqual(100)
  })
})
