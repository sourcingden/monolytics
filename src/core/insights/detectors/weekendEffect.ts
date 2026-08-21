import { dateRange } from '../../analyze/periods'
import { insightId } from '../util'
import type { AnalysisContext, Insight, InsightDetector } from '../types'

const MIN_DELTA_PCT = 0.15

function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

function countCalendarDays(from: Date, to: Date): { weekdays: number; weekends: number } {
  let weekdays = 0
  let weekends = 0
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate())
  while (cursor <= end) {
    if (isWeekend(cursor)) weekends += 1
    else weekdays += 1
    cursor.setDate(cursor.getDate() + 1)
  }
  return { weekdays, weekends }
}

/** Compares average daily spend on weekends vs weekdays — a "Friday night effect" check. */
export const weekendEffectDetector: InsightDetector = {
  id: 'weekendEffect',
  run(ctx: AnalysisContext): Insight[] {
    const range = dateRange(ctx.transactions)
    if (!range) return []

    let weekdayTotal = 0
    let weekendTotal = 0
    for (const tx of ctx.transactions) {
      if (tx.kind !== 'spend') continue
      if (isWeekend(tx.date)) weekendTotal += Math.abs(tx.amount)
      else weekdayTotal += Math.abs(tx.amount)
    }

    const { weekdays, weekends } = countCalendarDays(range.from, range.to)
    if (weekdays === 0 || weekends === 0) return []

    const weekdayAvgPerDay = weekdayTotal / weekdays
    const weekendAvgPerDay = weekendTotal / weekends
    if (weekdayAvgPerDay <= 0) return []

    const deltaPct = (weekendAvgPerDay - weekdayAvgPerDay) / weekdayAvgPerDay
    if (Math.abs(deltaPct) < MIN_DELTA_PCT) return []

    const insight: Extract<Insight, { type: 'weekendEffect' }> = {
      id: insightId('weekendEffect', 'summary'),
      type: 'weekendEffect',
      severity: 'info',
      weekdayAvgPerDay,
      weekendAvgPerDay,
      deltaPct,
    }
    return [insight]
  },
}
