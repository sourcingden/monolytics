import type { Transaction } from '../types'
import { groupByMonth, listMonths } from './periods'
import { realSpendTotal, totalsByCategory } from './totals'

export interface MonthlyPoint {
  month: string
  total: number
}

export function monthlySpendSeries(transactions: Transaction[]): MonthlyPoint[] {
  const months = listMonths(transactions)
  const byMonth = groupByMonth(transactions)
  return months.map((month) => ({ month, total: realSpendTotal(byMonth.get(month) ?? []) }))
}

export interface MonthOverMonthPoint extends MonthlyPoint {
  delta: number
  pct: number | null
}

/** Adds month-over-month delta/percent change to a monthly series (first point has no comparison). */
export function withMonthOverMonth(series: MonthlyPoint[]): MonthOverMonthPoint[] {
  return series.map((point, i) => {
    const prev = series[i - 1]
    const delta = prev ? point.total - prev.total : 0
    const pct = prev && prev.total > 0 ? delta / prev.total : null
    return { ...point, delta, pct }
  })
}

/** Per-category spend series across months, for the "which category moved" breakdown. */
export function monthlyCategorySeries(transactions: Transaction[]): Map<string, MonthlyPoint[]> {
  const months = listMonths(transactions)
  const byMonth = groupByMonth(transactions)
  const series = new Map<string, MonthlyPoint[]>()

  for (const month of months) {
    const totals = totalsByCategory(byMonth.get(month) ?? [])
    for (const [category, total] of totals) {
      const points = series.get(category) ?? []
      points.push({ month, total })
      series.set(category, points)
    }
  }

  return series
}
