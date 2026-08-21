import { totalsByCategory } from '../../analyze/totals'
import { insightId } from '../util'
import type { AnalysisContext, Insight, InsightDetector } from '../types'

/**
 * A rough stand-in for Monobank's actual per-month cashback rate, which the statement
 * doesn't expose. Used only to size "picking your top category as your cashback category
 * would have earned roughly this much" — framed as an estimate in the UI, not a fact.
 */
const ASSUMED_CASHBACK_RATE = 0.02

const MIN_GAP = 30 // UAH — below this the comparison is noise

/** Monobank lets you pick one cashback category a month — checks if the pick matches where the money actually went. */
export const cashbackOptimizerDetector: InsightDetector = {
  id: 'cashbackOptimizer',
  run(ctx: AnalysisContext): Insight[] {
    const actualCashback = ctx.transactions.reduce((sum, tx) => sum + Math.max(tx.cashback, 0), 0)
    const totals = totalsByCategory(ctx.transactions)

    let bestCategory: string | null = null
    let bestCategorySpend = 0
    for (const [category, total] of totals) {
      if (total > bestCategorySpend) {
        bestCategory = category
        bestCategorySpend = total
      }
    }
    if (!bestCategory) return []

    const estimatedPotentialCashback = bestCategorySpend * ASSUMED_CASHBACK_RATE
    const gap = estimatedPotentialCashback - actualCashback
    if (gap < MIN_GAP) return []

    const insight: Extract<Insight, { type: 'cashbackOptimizer' }> = {
      id: insightId('cashbackOptimizer', 'summary'),
      type: 'cashbackOptimizer',
      severity: 'info',
      actualCashback,
      bestCategory,
      bestCategorySpend,
      estimatedPotentialCashback,
      annualSavingsPotential: gap,
    }
    return [insight]
  },
}
