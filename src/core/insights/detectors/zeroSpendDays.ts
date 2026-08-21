import { dateRange, dayKey } from '../../analyze/periods'
import { insightId } from '../util'
import type { AnalysisContext, Insight, InsightDetector } from '../types'

const MIN_STREAK = 2 // a single quiet day isn't a "streak"

/** Longest and current run of days with zero real spend — a small gamified nudge. */
export const zeroSpendDaysDetector: InsightDetector = {
  id: 'zeroSpendDays',
  run(ctx: AnalysisContext): Insight[] {
    const range = dateRange(ctx.transactions)
    if (!range) return []

    const spendDays = new Set(
      ctx.transactions.filter((tx) => tx.kind === 'spend').map((tx) => dayKey(tx.date)),
    )

    let longestStreak = 0
    let runningStreak = 0
    let currentStreak = 0

    const cursor = new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate())
    const end = new Date(range.to.getFullYear(), range.to.getMonth(), range.to.getDate())

    while (cursor <= end) {
      if (spendDays.has(dayKey(cursor))) {
        runningStreak = 0
      } else {
        runningStreak += 1
        longestStreak = Math.max(longestStreak, runningStreak)
      }
      cursor.setDate(cursor.getDate() + 1)
    }
    currentStreak = runningStreak

    if (longestStreak < MIN_STREAK && currentStreak < MIN_STREAK) return []

    const insight: Extract<Insight, { type: 'zeroSpendDays' }> = {
      id: insightId('zeroSpendDays', 'summary'),
      type: 'zeroSpendDays',
      severity: 'info',
      currentStreak,
      longestStreak,
    }
    return [insight]
  },
}
