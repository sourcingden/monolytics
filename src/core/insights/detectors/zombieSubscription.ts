import { detectRecurring } from '../../analyze/recurring'
import { insightId } from '../util'
import type { AnalysisContext, Insight, InsightDetector } from '../types'

const MIN_MONTHS_TO_BE_A_ZOMBIE = 3

/**
 * A subscription still running 3+ months in — easy to forget once the initial trial
 * excitement fades. Reuses the same recurring-charge detection as `recurring`, scoped to
 * entertainment.subscriptions and gated on a longer run so it reads as "you've been
 * paying this for a while", not "here's your subscriptions list" (that's `recurring`).
 */
export const zombieSubscriptionDetector: InsightDetector = {
  id: 'zombieSubscription',
  run(ctx: AnalysisContext): Insight[] {
    return detectRecurring(ctx.transactions)
      .filter((r) => r.category === 'entertainment.subscriptions' && r.occurrences >= MIN_MONTHS_TO_BE_A_ZOMBIE)
      .map((r) => {
        const annualAmount = r.avgAmount * (365 / r.avgPeriodDays)
        const monthsActive = Math.round((r.avgPeriodDays * r.occurrences) / 30)
        return {
          id: insightId('zombieSubscription', r.merchant),
          type: 'zombieSubscription',
          severity: 'notice',
          merchant: r.merchant,
          category: r.category,
          monthlyAmount: r.avgAmount,
          annualAmount,
          monthsActive,
          annualSavingsPotential: annualAmount,
        }
      })
  },
}
