import { realSpendTotal } from '../../analyze/totals'
import { insightId } from '../util'
import type { AnalysisContext, Insight, InsightDetector } from '../types'

const MIN_WITHDRAWN = 200 // UAH

/** Cash pulled at ATMs/terminals — money whose further path the statement can't see at all. */
export const cashBlackholeDetector: InsightDetector = {
  id: 'cashBlackhole',
  run(ctx: AnalysisContext): Insight[] {
    const totalWithdrawn = ctx.transactions
      .filter((tx) => tx.kind === 'cash_withdrawal')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
    if (totalWithdrawn < MIN_WITHDRAWN) return []

    const spend = realSpendTotal(ctx.transactions)
    const pctOfSpend = spend > 0 ? totalWithdrawn / spend : 1

    const insight: Extract<Insight, { type: 'cashBlackhole' }> = {
      id: insightId('cashBlackhole', 'summary'),
      type: 'cashBlackhole',
      severity: pctOfSpend >= 0.15 ? 'notice' : 'info',
      totalWithdrawn,
      pctOfSpend,
    }
    return [insight]
  },
}
