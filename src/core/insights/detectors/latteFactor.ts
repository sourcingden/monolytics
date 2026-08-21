import { annualize, insightId, periodDays } from '../util'
import type { AnalysisContext, Insight, InsightDetector } from '../types'

const SMALL_AMOUNT_THRESHOLD = 150 // UAH — below this a single purchase barely registers
const MIN_COUNT = 8 // needs real frequency to be a "factor", not a one-off

/** Frequent small purchases in one category that quietly add up — the "latte factor". */
export const latteFactorDetector: InsightDetector = {
  id: 'latteFactor',
  run(ctx: AnalysisContext): Insight[] {
    const byCategory = new Map<string, { count: number; total: number }>()
    for (const tx of ctx.transactions) {
      if (tx.kind !== 'spend') continue
      const amount = Math.abs(tx.amount)
      if (amount > SMALL_AMOUNT_THRESHOLD) continue
      const bucket = byCategory.get(tx.category) ?? { count: 0, total: 0 }
      bucket.count += 1
      bucket.total += amount
      byCategory.set(tx.category, bucket)
    }

    const days = periodDays(ctx.transactions)
    const candidates: Extract<Insight, { type: 'latteFactor' }>[] = []

    for (const [category, { count, total }] of byCategory) {
      if (count < MIN_COUNT) continue
      const annualizedAmount = annualize(total, ctx.transactions)
      candidates.push({
        id: insightId('latteFactor', category),
        type: 'latteFactor',
        severity: 'info',
        category,
        count,
        avgAmount: total / count,
        totalAmount: total,
        periodDays: days,
        annualizedAmount,
        annualSavingsPotential: annualizedAmount,
      })
    }

    return candidates.sort((a, b) => b.totalAmount - a.totalAmount)
  },
}
