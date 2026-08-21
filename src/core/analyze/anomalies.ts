import type { Transaction } from '../types'

export interface Anomaly {
  transaction: Transaction
  reason: 'category-outlier' | 'new-merchant-large'
  categoryAverage?: number
}

function mean(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length
}

function stddev(values: number[], avg: number): number {
  if (values.length < 2) return 0
  const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

export interface DetectAnomaliesOptions {
  /** How many standard deviations above a category's mean counts as an outlier. */
  zThreshold?: number
  /** Minimum spend transactions in a category before its stats are trusted. */
  minCategorySamples?: number
}

/**
 * Flags transactions that stand out against the user's own history: either far above
 * their category's usual spend, or a first-time merchant charging a large amount.
 */
export function detectAnomalies(transactions: Transaction[], opts: DetectAnomaliesOptions = {}): Anomaly[] {
  const zThreshold = opts.zThreshold ?? 3
  const minCategorySamples = opts.minCategorySamples ?? 5

  const spendTxs = transactions
    .filter((tx) => tx.kind === 'spend')
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  const byCategory = new Map<string, Transaction[]>()
  for (const tx of spendTxs) {
    const bucket = byCategory.get(tx.category)
    if (bucket) bucket.push(tx)
    else byCategory.set(tx.category, [tx])
  }

  const anomalies: Anomaly[] = []

  for (const txs of byCategory.values()) {
    if (txs.length < minCategorySamples) continue
    const amounts = txs.map((tx) => Math.abs(tx.amount))
    const avg = mean(amounts)
    const sd = stddev(amounts, avg)
    if (sd === 0) continue

    for (const tx of txs) {
      const z = (Math.abs(tx.amount) - avg) / sd
      if (z >= zThreshold) {
        anomalies.push({ transaction: tx, reason: 'category-outlier', categoryAverage: avg })
      }
    }
  }

  const seenMerchants = new Set<string>()
  const allAmounts = spendTxs.map((tx) => Math.abs(tx.amount)).sort((a, b) => a - b)
  const medianSpend = allAmounts.length > 0 ? allAmounts[Math.floor(allAmounts.length / 2)] : 0

  for (const tx of spendTxs) {
    const isFirstTime = !seenMerchants.has(tx.merchant)
    seenMerchants.add(tx.merchant)
    if (isFirstTime && medianSpend > 0 && Math.abs(tx.amount) > medianSpend * 5) {
      anomalies.push({ transaction: tx, reason: 'new-merchant-large' })
    }
  }

  return anomalies.sort((a, b) => Math.abs(b.transaction.amount) - Math.abs(a.transaction.amount))
}
