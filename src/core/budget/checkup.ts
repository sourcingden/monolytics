import type { Transaction } from '../types'
import { incomeTotal, totalsByCategory } from '../analyze/totals'
import { monthlyCashflow } from '../analyze/cashflow'
import { computeFiftyThirtyTwenty } from './fiftyThirtyTwenty'

export interface CheckupResult {
  score: number // 0-100
  components: {
    savingsRate: number
    discretionaryShare: number
    spendStability: number
    uncategorizedShare: number
    subscriptionsWeight: number
  }
}

function clampScale(value: number, goodAt: number, zeroAt: number, maxPoints: number): number {
  if (goodAt <= zeroAt) {
    // lower value is better (e.g. volatility, uncategorized share)
    if (value <= goodAt) return maxPoints
    if (value >= zeroAt) return 0
    return maxPoints * (1 - (value - goodAt) / (zeroAt - goodAt))
  }
  // higher value is better
  if (value >= goodAt) return maxPoints
  if (value <= zeroAt) return 0
  return maxPoints * ((value - zeroAt) / (goodAt - zeroAt))
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((s, v) => s + v, 0) / values.length
}

/**
 * A single 0-100 score summarizing financial health month to month, so there's one number
 * to watch trend instead of re-reading a whole dashboard every time.
 */
export function computeCheckup(transactions: Transaction[]): CheckupResult {
  const split = computeFiftyThirtyTwenty(transactions)
  const savingsRatePts = clampScale(split.savingsPct ?? 0, 0.2, -0.1, 40)
  const discretionaryPts = clampScale(split.wantsPct ?? 0, 0.3, 0.6, 20)

  const flow = monthlyCashflow(transactions)
  const spendValues = flow.map((m) => m.spend).filter((v) => v > 0)
  const avgSpend = mean(spendValues)
  const cv =
    avgSpend > 0 && spendValues.length > 1
      ? Math.sqrt(mean(spendValues.map((v) => (v - avgSpend) ** 2))) / avgSpend
      : 0
  const stabilityPts = clampScale(cv, 0.15, 0.5, 15)

  const totals = totalsByCategory(transactions)
  const totalSpend = Array.from(totals.values()).reduce((s, v) => s + v, 0)
  const uncategorizedPct = totalSpend > 0 ? (totals.get('uncategorized') ?? 0) / totalSpend : 0
  const uncategorizedPts = clampScale(uncategorizedPct, 0.05, 0.3, 15)

  const income = incomeTotal(transactions)
  const subscriptionsPct = income > 0 ? (totals.get('entertainment.subscriptions') ?? 0) / income : 0
  const subscriptionsPts = clampScale(subscriptionsPct, 0.03, 0.15, 10)

  const score = Math.round(
    savingsRatePts + discretionaryPts + stabilityPts + uncategorizedPts + subscriptionsPts,
  )

  return {
    score: Math.max(0, Math.min(100, score)),
    components: {
      savingsRate: Math.round(savingsRatePts),
      discretionaryShare: Math.round(discretionaryPts),
      spendStability: Math.round(stabilityPts),
      uncategorizedShare: Math.round(uncategorizedPts),
      subscriptionsWeight: Math.round(subscriptionsPts),
    },
  }
}
