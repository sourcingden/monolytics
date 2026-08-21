import type { Transaction } from '../types'

export type InsightSeverity = 'info' | 'notice' | 'warning'

interface BaseInsight {
  id: string
  severity: InsightSeverity
  /** Estimated yearly savings in UAH if the user acts on this — see plan: no number, no insight, for advice-shaped detectors. */
  annualSavingsPotential?: number
}

/**
 * A discriminated union, not a titleKey/params bag: the UI layer switches on `type` and
 * renders its own i18n template around these typed numeric fields. Keeps this module free
 * of any i18n/text dependency — see src/core/README.md.
 */
export type Insight =
  | (BaseInsight & {
      type: 'recurring'
      merchant: string
      category: string
      monthlyAmount: number
      annualAmount: number
      occurrences: number
    })
  | (BaseInsight & {
      type: 'zombieSubscription'
      merchant: string
      category: string
      monthlyAmount: number
      annualAmount: number
      monthsActive: number
    })
  | (BaseInsight & {
      type: 'latteFactor'
      category: string
      count: number
      avgAmount: number
      totalAmount: number
      periodDays: number
      annualizedAmount: number
    })
  | (BaseInsight & {
      type: 'deliveryVsGroceries'
      deliveryTotal: number
      groceriesTotal: number
      ratio: number
      annualDeliveryCost: number
    })
  | (BaseInsight & {
      type: 'categoryGrowth'
      category: string
      prevMonth: string
      currMonth: string
      prevAmount: number
      currAmount: number
      deltaPct: number
      /** Whether the jump comes from bigger purchases, more of them, or both. */
      driver: 'amount' | 'frequency' | 'both'
    })
  | (BaseInsight & {
      type: 'anomaly'
      transactionId: string
      merchant: string
      category: string
      amount: number
      categoryAverage: number | null
      reason: 'category-outlier' | 'new-merchant-large'
    })
  | (BaseInsight & {
      type: 'feesAndFx'
      commissionTotal: number
      periodMonths: number
    })
  | (BaseInsight & {
      type: 'cashbackOptimizer'
      actualCashback: number
      bestCategory: string
      bestCategorySpend: number
      estimatedPotentialCashback: number
    })
  | (BaseInsight & {
      type: 'weekendEffect'
      weekdayAvgPerDay: number
      weekendAvgPerDay: number
      deltaPct: number
    })
  | (BaseInsight & {
      type: 'impulseCluster'
      clusterCount: number
      totalAmount: number
      exampleDate: string
    })
  | (BaseInsight & {
      type: 'spendVsIncomeGrowth'
      incomeGrowthPct: number
      spendGrowthPct: number
    })
  | (BaseInsight & {
      type: 'merchantInflation'
      merchant: string
      category: string
      firstAvg: number
      lastAvg: number
      deltaPct: number
    })
  | (BaseInsight & {
      type: 'burnRateForecast'
      month: string
      spendSoFar: number
      projectedTotal: number
      daysElapsed: number
      daysInMonth: number
    })
  | (BaseInsight & {
      type: 'zeroSpendDays'
      currentStreak: number
      longestStreak: number
    })
  | (BaseInsight & {
      type: 'uncategorizedNudge'
      totalAmount: number
      topMerchants: { merchant: string; amount: number }[]
    })
  | (BaseInsight & {
      type: 'topTransactions'
      items: { id: string; merchant: string; category: string; amount: number; date: string }[]
    })
  | (BaseInsight & {
      type: 'microloanUsage'
      totalDrawn: number
      drawCount: number
      periodMonths: number
    })
  | (BaseInsight & {
      type: 'cashBlackhole'
      totalWithdrawn: number
      pctOfSpend: number
    })

export interface AnalysisContext {
  transactions: Transaction[]
}

export interface InsightDetector {
  id: string
  run: (ctx: AnalysisContext) => Insight[]
}
