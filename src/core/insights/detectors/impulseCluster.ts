import { dayKey } from '../../analyze/periods'
import { annualize, insightId } from '../util'
import type { AnalysisContext, Insight, InsightDetector } from '../types'
import type { Transaction } from '../../types'

const CLUSTER_GAP_MS = 60 * 60_000 // transactions within an hour of each other
const LATE_HOUR_START = 20 // 20:00
const LATE_HOUR_END = 3 // until 03:00

const NON_DISCRETIONARY = new Set([
  'food.groceries',
  'housing.rent',
  'housing.utilities',
  'housing.internet',
  'transport.fuel',
  'transport.public',
  'health.pharmacy',
  'finance.insurance',
])

function isLateHour(date: Date): boolean {
  const h = date.getHours()
  return h >= LATE_HOUR_START || h < LATE_HOUR_END
}

/** Bursts of back-to-back discretionary purchases late at night — a proxy for impulse spending. */
export const impulseClusterDetector: InsightDetector = {
  id: 'impulseCluster',
  run(ctx: AnalysisContext): Insight[] {
    const candidates = ctx.transactions
      .filter((tx) => tx.kind === 'spend' && !NON_DISCRETIONARY.has(tx.category))
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    const clusters: Transaction[][] = []
    let current: Transaction[] = []

    for (const tx of candidates) {
      const prev = current[current.length - 1]
      if (prev && tx.date.getTime() - prev.date.getTime() <= CLUSTER_GAP_MS) {
        current.push(tx)
      } else {
        if (current.length >= 2) clusters.push(current)
        current = [tx]
      }
    }
    if (current.length >= 2) clusters.push(current)

    const qualifying = clusters.filter((cluster) => cluster.some((tx) => isLateHour(tx.date)))
    if (qualifying.length === 0) return []

    const totalAmount = qualifying.reduce(
      (sum, cluster) => sum + cluster.reduce((s, tx) => s + Math.abs(tx.amount), 0),
      0,
    )
    const largest = qualifying.reduce((a, b) => (b.length > a.length ? b : a))

    const insight: Extract<Insight, { type: 'impulseCluster' }> = {
      id: insightId('impulseCluster', 'summary'),
      type: 'impulseCluster',
      severity: 'notice',
      clusterCount: qualifying.length,
      totalAmount,
      exampleDate: dayKey(largest[0].date),
      annualSavingsPotential: annualize(totalAmount, ctx.transactions),
    }
    return [insight]
  },
}
