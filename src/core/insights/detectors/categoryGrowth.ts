import { groupByMonth, listMonths } from '../../analyze/periods'
import { insightId } from '../util'
import type { AnalysisContext, Insight, InsightDetector } from '../types'

const GROWTH_THRESHOLD = 0.3 // 30% month-over-month
const MIN_CURR_AMOUNT = 300 // UAH — ignore noise in tiny categories
const DRIVER_THRESHOLD = 0.2

interface MonthCategoryStats {
  total: number
  count: number
}

function statsByCategory(transactions: AnalysisContext['transactions']): Map<string, MonthCategoryStats> {
  const stats = new Map<string, MonthCategoryStats>()
  for (const tx of transactions) {
    if (tx.kind !== 'spend') continue
    const s = stats.get(tx.category) ?? { total: 0, count: 0 }
    s.total += Math.abs(tx.amount)
    s.count += 1
    stats.set(tx.category, s)
  }
  return stats
}

/** Flags categories whose spend jumped month-over-month, and whether that's bigger tickets or more of them. */
export const categoryGrowthDetector: InsightDetector = {
  id: 'categoryGrowth',
  run(ctx: AnalysisContext): Insight[] {
    const months = listMonths(ctx.transactions)
    if (months.length < 2) return []

    const currMonth = months[months.length - 1]
    const prevMonth = months[months.length - 2]
    const byMonth = groupByMonth(ctx.transactions)

    const prevStats = statsByCategory(byMonth.get(prevMonth) ?? [])
    const currStats = statsByCategory(byMonth.get(currMonth) ?? [])

    const results: Extract<Insight, { type: 'categoryGrowth' }>[] = []

    for (const [category, curr] of currStats) {
      const prev = prevStats.get(category)
      // Both months need a meaningful base — one real purchase against a near-empty prior
      // month produces a mathematically correct but useless "+2000%" headline.
      if (!prev || prev.total < MIN_CURR_AMOUNT) continue
      if (curr.total < MIN_CURR_AMOUNT) continue

      const deltaPct = (curr.total - prev.total) / prev.total
      if (deltaPct < GROWTH_THRESHOLD) continue

      const avgPrev = prev.total / prev.count
      const avgCurr = curr.total / curr.count
      const avgDelta = avgPrev > 0 ? (avgCurr - avgPrev) / avgPrev : 0
      const countDelta = prev.count > 0 ? (curr.count - prev.count) / prev.count : 0

      const amountDrove = avgDelta >= DRIVER_THRESHOLD
      const frequencyDrove = countDelta >= DRIVER_THRESHOLD
      const driver = amountDrove && frequencyDrove ? 'both' : amountDrove ? 'amount' : 'frequency'

      results.push({
        id: insightId('categoryGrowth', category),
        type: 'categoryGrowth',
        severity: 'notice',
        category,
        prevMonth,
        currMonth,
        prevAmount: prev.total,
        currAmount: curr.total,
        deltaPct,
        driver,
      })
    }

    return results.sort((a, b) => b.deltaPct - a.deltaPct)
  },
}
