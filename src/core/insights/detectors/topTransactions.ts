import { dayKey } from '../../analyze/periods'
import { insightId } from '../util'
import type { AnalysisContext, Insight, InsightDetector } from '../types'

const LIMIT = 10

/** The biggest single purchases in the period — often the most sobering screen in the app. */
export const topTransactionsDetector: InsightDetector = {
  id: 'topTransactions',
  run(ctx: AnalysisContext): Insight[] {
    const items = ctx.transactions
      .filter((tx) => tx.kind === 'spend')
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
      .slice(0, LIMIT)
      .map((tx) => ({
        id: tx.id,
        merchant: tx.merchant,
        category: tx.category,
        amount: Math.abs(tx.amount),
        date: dayKey(tx.date),
      }))

    if (items.length === 0) return []

    const insight: Extract<Insight, { type: 'topTransactions' }> = {
      id: insightId('topTransactions', 'summary'),
      type: 'topTransactions',
      severity: 'info',
      items,
    }
    return [insight]
  },
}
