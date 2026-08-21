import type { Transaction } from '../types'
import { monthlyCashflow } from '../analyze/cashflow'

/** Mean of each month's savings rate (income-weighted months only). Null with no income data. */
export function averageSavingsRate(transactions: Transaction[]): number | null {
  const rates = monthlyCashflow(transactions)
    .map((m) => m.savingsRate)
    .filter((r): r is number => r !== null)
  if (rates.length === 0) return null
  return rates.reduce((s, r) => s + r, 0) / rates.length
}

/** The most recent month's savings rate, null if it has no income. */
export function currentSavingsRate(transactions: Transaction[]): number | null {
  const flow = monthlyCashflow(transactions)
  return flow.length > 0 ? flow[flow.length - 1].savingsRate : null
}
