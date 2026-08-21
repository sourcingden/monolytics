import { insightId } from '../util'
import type { AnalysisContext, Insight, InsightDetector } from '../types'
import type { Transaction } from '../../types'

const MIN_OCCURRENCES = 4
const MIN_DELTA_PCT = 0.15

/** Tracks a merchant's average ticket over time — "personal inflation" at your usual spots. */
export const merchantInflationDetector: InsightDetector = {
  id: 'merchantInflation',
  run(ctx: AnalysisContext): Insight[] {
    const byMerchant = new Map<string, Transaction[]>()
    for (const tx of ctx.transactions) {
      if (tx.kind !== 'spend') continue
      const bucket = byMerchant.get(tx.merchant)
      if (bucket) bucket.push(tx)
      else byMerchant.set(tx.merchant, [tx])
    }

    const results: Extract<Insight, { type: 'merchantInflation' }>[] = []

    for (const [merchant, txs] of byMerchant) {
      if (txs.length < MIN_OCCURRENCES) continue
      const sorted = [...txs].sort((a, b) => a.date.getTime() - b.date.getTime())
      const half = Math.floor(sorted.length / 2)
      const firstHalf = sorted.slice(0, half)
      const lastHalf = sorted.slice(sorted.length - half)

      const firstAvg = firstHalf.reduce((s, tx) => s + Math.abs(tx.amount), 0) / firstHalf.length
      const lastAvg = lastHalf.reduce((s, tx) => s + Math.abs(tx.amount), 0) / lastHalf.length
      if (firstAvg <= 0) continue

      const deltaPct = (lastAvg - firstAvg) / firstAvg
      if (deltaPct < MIN_DELTA_PCT) continue

      results.push({
        id: insightId('merchantInflation', merchant),
        type: 'merchantInflation',
        severity: 'info',
        merchant,
        category: sorted[sorted.length - 1].category,
        firstAvg,
        lastAvg,
        deltaPct,
      })
    }

    return results.sort((a, b) => b.deltaPct - a.deltaPct)
  },
}
