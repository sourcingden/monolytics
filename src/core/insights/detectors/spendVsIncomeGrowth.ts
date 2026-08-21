import { monthlyCashflow } from '../../analyze/cashflow'
import { insightId } from '../util'
import type { AnalysisContext, Insight, InsightDetector } from '../types'

const MIN_GAP_PP = 0.1 // 10 percentage points

/** Flags when spend is growing faster than income across the observed months. */
export const spendVsIncomeGrowthDetector: InsightDetector = {
  id: 'spendVsIncomeGrowth',
  run(ctx: AnalysisContext): Insight[] {
    const flow = monthlyCashflow(ctx.transactions)
    if (flow.length < 2) return []

    const first = flow[0]
    const last = flow[flow.length - 1]
    if (first.income <= 0 || first.spend <= 0) return []

    const incomeGrowthPct = (last.income - first.income) / first.income
    const spendGrowthPct = (last.spend - first.spend) / first.spend

    if (spendGrowthPct - incomeGrowthPct < MIN_GAP_PP) return []

    const insight: Extract<Insight, { type: 'spendVsIncomeGrowth' }> = {
      id: insightId('spendVsIncomeGrowth', 'summary'),
      type: 'spendVsIncomeGrowth',
      severity: 'warning',
      incomeGrowthPct,
      spendGrowthPct,
    }
    return [insight]
  },
}
