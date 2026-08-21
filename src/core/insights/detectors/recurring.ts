import { detectRecurring } from '../../analyze/recurring'
import { insightId } from '../util'
import type { AnalysisContext, Insight, InsightDetector } from '../types'

export const recurringDetector: InsightDetector = {
  id: 'recurring',
  run(ctx: AnalysisContext): Insight[] {
    return detectRecurring(ctx.transactions).map((r) => {
      const annualAmount = r.avgAmount * (365 / r.avgPeriodDays)
      return {
        id: insightId('recurring', r.merchant),
        type: 'recurring',
        severity: 'notice',
        merchant: r.merchant,
        category: r.category,
        monthlyAmount: r.avgAmount,
        annualAmount,
        occurrences: r.occurrences,
        annualSavingsPotential: annualAmount,
      }
    })
  },
}
