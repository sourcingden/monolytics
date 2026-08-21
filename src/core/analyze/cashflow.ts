import type { Transaction } from '../types'
import { daysInMonth, groupByMonth, listMonths } from './periods'
import { incomeTotal, realSpendTotal } from './totals'

export interface MonthlyCashflow {
  month: string
  income: number
  spend: number
  net: number
  savingsRate: number | null
}

export function monthlyCashflow(transactions: Transaction[]): MonthlyCashflow[] {
  const months = listMonths(transactions)
  const byMonth = groupByMonth(transactions)

  return months.map((month) => {
    const txs = byMonth.get(month) ?? []
    const income = incomeTotal(txs)
    const spend = realSpendTotal(txs)
    const net = income - spend
    return { month, income, spend, net, savingsRate: income > 0 ? net / income : null }
  })
}

export interface BurnRateForecast {
  month: string
  spendSoFar: number
  daysElapsed: number
  daysInMonth: number
  projectedTotal: number
}

/**
 * Projects the current (most recent) month's spend to a full-month total by linear
 * run-rate. `referenceDate` defaults to the latest transaction's day — a statement export
 * is historical data, so "today" for forecasting purposes is the last day it covers.
 */
export function burnRateForecast(transactions: Transaction[], referenceDate?: Date): BurnRateForecast | null {
  if (transactions.length === 0) return null

  const latest = referenceDate ?? transactions.reduce((max, tx) => (tx.date > max ? tx.date : max), transactions[0].date)
  const year = latest.getFullYear()
  const monthIndex0 = latest.getMonth()
  const monthKeyStr = `${year}-${String(monthIndex0 + 1).padStart(2, '0')}`

  const monthTxs = transactions.filter(
    (tx) => tx.date.getFullYear() === year && tx.date.getMonth() === monthIndex0,
  )
  if (monthTxs.length === 0) return null

  const spendSoFar = realSpendTotal(monthTxs)
  const daysElapsed = latest.getDate()
  const totalDays = daysInMonth(year, monthIndex0)
  const projectedTotal = daysElapsed > 0 ? (spendSoFar / daysElapsed) * totalDays : spendSoFar

  return { month: monthKeyStr, spendSoFar, daysElapsed, daysInMonth: totalDays, projectedTotal }
}
