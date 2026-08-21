import type { Transaction } from '../types'
import { CATEGORIES } from '../categorize/categories'

const CATEGORY_TO_GROUP = new Map(CATEGORIES.map((c) => [c.id, c.groupId]))

/**
 * The headline number: real purchases minus refunds. Deliberately excludes transfers
 * (internal and P2P), debt drawdowns, savings contributions and cash withdrawals — this
 * is what makes it more honest than the figure Monobank's own app shows. See plan §
 * "kind — главное отличие от Монобанка".
 */
export function realSpendTotal(transactions: Transaction[]): number {
  let total = 0
  for (const tx of transactions) {
    if (tx.kind === 'spend') total += Math.abs(tx.amount)
    else if (tx.kind === 'refund') total -= Math.abs(tx.amount)
  }
  return Math.max(total, 0)
}

/** What Monobank's own statement view would report as "spent": every outgoing amount, kind be damned. */
export function naiveMonobankSpendTotal(transactions: Transaction[]): number {
  return transactions.filter((tx) => tx.amount < 0).reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
}

export function incomeTotal(transactions: Transaction[]): number {
  return transactions.filter((tx) => tx.kind === 'income').reduce((sum, tx) => sum + tx.amount, 0)
}

export function totalByKind(transactions: Transaction[], kind: Transaction['kind']): number {
  return transactions.filter((tx) => tx.kind === kind).reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
}

/** Real spend per category (refunds netted against their own category), spend-kind only categories included. */
export function totalsByCategory(transactions: Transaction[]): Map<string, number> {
  const totals = new Map<string, number>()
  for (const tx of transactions) {
    if (tx.kind !== 'spend' && tx.kind !== 'refund') continue
    const delta = tx.kind === 'spend' ? Math.abs(tx.amount) : -Math.abs(tx.amount)
    totals.set(tx.category, (totals.get(tx.category) ?? 0) + delta)
  }
  return totals
}

export function totalsByGroup(transactions: Transaction[]): Map<string, number> {
  const byCategory = totalsByCategory(transactions)
  const totals = new Map<string, number>()
  for (const [category, amount] of byCategory) {
    const group = CATEGORY_TO_GROUP.get(category) ?? 'uncategorized'
    totals.set(group, (totals.get(group) ?? 0) + amount)
  }
  return totals
}

export function totalsByMerchant(transactions: Transaction[]): Map<string, number> {
  const totals = new Map<string, number>()
  for (const tx of transactions) {
    if (tx.kind !== 'spend') continue
    totals.set(tx.merchant, (totals.get(tx.merchant) ?? 0) + Math.abs(tx.amount))
  }
  return totals
}
