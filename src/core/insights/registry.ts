import { recurringDetector } from './detectors/recurring'
import { zombieSubscriptionDetector } from './detectors/zombieSubscription'
import { latteFactorDetector } from './detectors/latteFactor'
import { deliveryVsGroceriesDetector } from './detectors/deliveryVsGroceries'
import { categoryGrowthDetector } from './detectors/categoryGrowth'
import { anomalyDetector } from './detectors/anomaly'
import { feesAndFxDetector } from './detectors/feesAndFx'
import { cashbackOptimizerDetector } from './detectors/cashbackOptimizer'
import { weekendEffectDetector } from './detectors/weekendEffect'
import { impulseClusterDetector } from './detectors/impulseCluster'
import { spendVsIncomeGrowthDetector } from './detectors/spendVsIncomeGrowth'
import { merchantInflationDetector } from './detectors/merchantInflation'
import { burnRateForecastDetector } from './detectors/burnRateForecast'
import { zeroSpendDaysDetector } from './detectors/zeroSpendDays'
import { uncategorizedNudgeDetector } from './detectors/uncategorizedNudge'
import { topTransactionsDetector } from './detectors/topTransactions'
import { microloanUsageDetector } from './detectors/microloanUsage'
import { cashBlackholeDetector } from './detectors/cashBlackhole'
import type { AnalysisContext, Insight, InsightDetector } from './types'

/** All 18 detectors from the plan, in the order they're listed there. */
export const INSIGHT_DETECTORS: InsightDetector[] = [
  recurringDetector,
  zombieSubscriptionDetector,
  latteFactorDetector,
  deliveryVsGroceriesDetector,
  categoryGrowthDetector,
  anomalyDetector,
  feesAndFxDetector,
  cashbackOptimizerDetector,
  weekendEffectDetector,
  impulseClusterDetector,
  spendVsIncomeGrowthDetector,
  merchantInflationDetector,
  burnRateForecastDetector,
  zeroSpendDaysDetector,
  uncategorizedNudgeDetector,
  topTransactionsDetector,
  microloanUsageDetector,
  cashBlackholeDetector,
]

/** Runs every registered detector and flattens the results. A detector throwing never takes down the rest. */
export function runAllDetectors(ctx: AnalysisContext, detectors: InsightDetector[] = INSIGHT_DETECTORS): Insight[] {
  const results: Insight[] = []
  for (const detector of detectors) {
    try {
      results.push(...detector.run(ctx))
    } catch (err) {
      console.error(`Insight detector "${detector.id}" failed`, err)
    }
  }
  return results
}
