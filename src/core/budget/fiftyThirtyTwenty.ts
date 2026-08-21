import type { Transaction } from '../types'
import { incomeTotal, totalsByCategory } from '../analyze/totals'

export const NEEDS_CATEGORIES = new Set([
  'food.groceries',
  'housing.rent',
  'housing.utilities',
  'housing.internet',
  'housing.repair',
  'health.pharmacy',
  'health.doctors',
  'transport.fuel',
  'transport.public',
  'transport.service',
  'transport.parking',
  'finance.insurance',
  'finance.fees',
  'finance.fines',
  'kids',
  'pets',
  'education',
])

/**
 * Everything spend-shaped that isn't in NEEDS_CATEGORIES and isn't 'uncategorized' counts
 * as a want. Uncategorized spend is reported separately rather than guessed into either
 * bucket — see plan: don't fabricate precision the data doesn't support.
 */
export function bucketOf(category: string): 'needs' | 'wants' | null {
  if (category === 'uncategorized') return null
  return NEEDS_CATEGORIES.has(category) ? 'needs' : 'wants'
}

export interface FiftyThirtyTwentyResult {
  income: number
  needs: number
  wants: number
  uncategorized: number
  needsPct: number | null
  wantsPct: number | null
  savingsPct: number | null
  targetNeedsPct: number
  targetWantsPct: number
  targetSavingsPct: number
}

export const TARGET_NEEDS_PCT = 0.5
export const TARGET_WANTS_PCT = 0.3
export const TARGET_SAVINGS_PCT = 0.2

/** The classic 50/30/20 budgeting split, computed against real spend (not Monobank's naive total). */
export function computeFiftyThirtyTwenty(transactions: Transaction[]): FiftyThirtyTwentyResult {
  const income = incomeTotal(transactions)
  const totals = totalsByCategory(transactions)

  let needs = 0
  let wants = 0
  let uncategorized = 0

  for (const [category, amount] of totals) {
    const bucket = bucketOf(category)
    if (bucket === 'needs') needs += amount
    else if (bucket === 'wants') wants += amount
    else uncategorized += amount
  }

  const savings = income - needs - wants - uncategorized

  return {
    income,
    needs,
    wants,
    uncategorized,
    needsPct: income > 0 ? needs / income : null,
    wantsPct: income > 0 ? wants / income : null,
    savingsPct: income > 0 ? savings / income : null,
    targetNeedsPct: TARGET_NEEDS_PCT,
    targetWantsPct: TARGET_WANTS_PCT,
    targetSavingsPct: TARGET_SAVINGS_PCT,
  }
}
