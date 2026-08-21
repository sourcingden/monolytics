import type { Transaction } from '../types'

export interface RecurringMerchant {
  merchant: string
  category: string
  avgAmount: number
  avgPeriodDays: number
  occurrences: number
  lastDate: Date
  transactionIds: string[]
}

export interface DetectRecurringOptions {
  /** Minimum number of charges before a merchant is considered recurring. */
  minOccurrences?: number
  /** How far a charge's gap can drift from ~30 days and still count as monthly. */
  periodToleranceDays?: number
  /** How far a charge's amount can drift from the merchant's average and still count as the same subscription. */
  amountTolerancePct?: number
}

/**
 * Flags merchants charging roughly the same amount roughly once a month — subscriptions,
 * rent, recurring bills. Pure pattern detection: no merchant allowlist, so it works for
 * subscriptions data won't otherwise know about.
 */
export function detectRecurring(
  transactions: Transaction[],
  opts: DetectRecurringOptions = {},
): RecurringMerchant[] {
  const minOccurrences = opts.minOccurrences ?? 2
  const periodTolerance = opts.periodToleranceDays ?? 6
  const amountTolerance = opts.amountTolerancePct ?? 0.15

  const byMerchant = new Map<string, Transaction[]>()
  for (const tx of transactions) {
    if (tx.kind !== 'spend') continue
    const bucket = byMerchant.get(tx.merchant)
    if (bucket) bucket.push(tx)
    else byMerchant.set(tx.merchant, [tx])
  }

  const results: RecurringMerchant[] = []

  for (const [merchant, txs] of byMerchant) {
    if (txs.length < minOccurrences) continue
    const sorted = [...txs].sort((a, b) => a.date.getTime() - b.date.getTime())

    const amounts = sorted.map((tx) => Math.abs(tx.amount))
    const avgAmount = amounts.reduce((s, a) => s + a, 0) / amounts.length
    const amountsConsistent = amounts.every(
      (a) => Math.abs(a - avgAmount) <= avgAmount * amountTolerance,
    )
    if (!amountsConsistent) continue

    const gaps: number[] = []
    for (let i = 1; i < sorted.length; i++) {
      const days = (sorted[i].date.getTime() - sorted[i - 1].date.getTime()) / 86_400_000
      gaps.push(days)
    }
    if (gaps.length === 0) continue

    const avgPeriodDays = gaps.reduce((s, g) => s + g, 0) / gaps.length
    const periodicConsistent = gaps.every((g) => Math.abs(g - 30) <= periodTolerance || Math.abs(g - avgPeriodDays) <= periodTolerance)
    if (avgPeriodDays < 20 || avgPeriodDays > 40 || !periodicConsistent) continue

    results.push({
      merchant,
      category: sorted[sorted.length - 1].category,
      avgAmount,
      avgPeriodDays,
      occurrences: sorted.length,
      lastDate: sorted[sorted.length - 1].date,
      transactionIds: sorted.map((tx) => tx.id),
    })
  }

  return results.sort((a, b) => b.avgAmount - a.avgAmount)
}
