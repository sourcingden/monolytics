import { insightId } from '../util'
import type { AnalysisContext, Insight, InsightDetector } from '../types'

const TOP_MERCHANTS_LIMIT = 5
const MIN_TOTAL = 50 // UAH

/** How much money sits in "Не визначено", and which merchants would close the most of it with one rule. */
export const uncategorizedNudgeDetector: InsightDetector = {
  id: 'uncategorizedNudge',
  run(ctx: AnalysisContext): Insight[] {
    const uncategorized = ctx.transactions.filter(
      (tx) => tx.category === 'uncategorized' && tx.kind === 'spend',
    )
    const totalAmount = uncategorized.reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
    if (totalAmount < MIN_TOTAL) return []

    const byMerchant = new Map<string, number>()
    for (const tx of uncategorized) {
      byMerchant.set(tx.merchant, (byMerchant.get(tx.merchant) ?? 0) + Math.abs(tx.amount))
    }

    const topMerchants = Array.from(byMerchant.entries())
      .map(([merchant, amount]) => ({ merchant, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, TOP_MERCHANTS_LIMIT)

    const insight: Extract<Insight, { type: 'uncategorizedNudge' }> = {
      id: insightId('uncategorizedNudge', 'summary'),
      type: 'uncategorizedNudge',
      severity: totalAmount > 0 ? 'notice' : 'info',
      totalAmount,
      topMerchants,
    }
    return [insight]
  },
}
