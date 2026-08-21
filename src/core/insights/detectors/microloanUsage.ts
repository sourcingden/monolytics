import { insightId, periodMonths } from '../util'
import type { AnalysisContext, Insight, InsightDetector } from '../types'

const MIN_DRAW_COUNT = 1

/**
 * How often Monobank's built-in short-term credit ("Кредит До завтра", installments) gets
 * drawn on. Not a "trata" by our own kind accounting, but repeated draws are a real signal
 * of cash-flow stress worth surfacing even though no category calls it out directly.
 */
export const microloanUsageDetector: InsightDetector = {
  id: 'microloanUsage',
  run(ctx: AnalysisContext): Insight[] {
    const draws = ctx.transactions.filter((tx) => tx.kind === 'debt')
    if (draws.length < MIN_DRAW_COUNT) return []

    const totalDrawn = draws.reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

    const insight: Extract<Insight, { type: 'microloanUsage' }> = {
      id: insightId('microloanUsage', 'summary'),
      type: 'microloanUsage',
      severity: draws.length >= 3 ? 'warning' : 'notice',
      totalDrawn,
      drawCount: draws.length,
      periodMonths: periodMonths(ctx.transactions),
    }
    return [insight]
  },
}
