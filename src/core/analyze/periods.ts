import type { Transaction } from '../types'

/** "YYYY-MM", local time — the grouping key used throughout the analytics layer. */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/** "YYYY-MM-DD", local time. */
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(year, monthIndex0 + 1, 0).getDate()
}

export function groupByMonth(transactions: Transaction[]): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>()
  for (const tx of transactions) {
    const key = monthKey(tx.date)
    const bucket = groups.get(key)
    if (bucket) bucket.push(tx)
    else groups.set(key, [tx])
  }
  return groups
}

/** Distinct month keys present in the data, chronologically sorted. */
export function listMonths(transactions: Transaction[]): string[] {
  return Array.from(new Set(transactions.map((tx) => monthKey(tx.date)))).sort()
}

export function dateRange(transactions: Transaction[]): { from: Date; to: Date } | null {
  if (transactions.length === 0) return null
  let from = transactions[0].date
  let to = transactions[0].date
  for (const tx of transactions) {
    if (tx.date < from) from = tx.date
    if (tx.date > to) to = tx.date
  }
  return { from, to }
}

/** Span of the data in whole days, minimum 1 — used to annualize totals fairly for short histories. */
export function periodDays(transactions: Transaction[]): number {
  const range = dateRange(transactions)
  if (!range) return 1
  const days = Math.round((range.to.getTime() - range.from.getTime()) / 86_400_000)
  return Math.max(days, 1)
}

export function periodMonths(transactions: Transaction[]): number {
  return Math.max(periodDays(transactions) / 30, 1 / 30)
}

/** Scales a total observed over the data's actual span up (or down) to a 365-day estimate. */
export function annualize(total: number, transactions: Transaction[]): number {
  return (total / periodDays(transactions)) * 365
}
