import type { Transaction } from '../types'

/**
 * Deduplicates transactions by id (date + description + amount + balanceAfter hash).
 * Lets a user re-upload the same statement, or upload two overlapping date ranges for
 * the same card, without double-counting. First occurrence wins.
 */
export function dedupeTransactions(transactions: Transaction[]): Transaction[] {
  const seen = new Set<string>()
  const result: Transaction[] = []

  for (const tx of transactions) {
    if (seen.has(tx.id)) continue
    seen.add(tx.id)
    result.push(tx)
  }

  return result
}
