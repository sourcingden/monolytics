import { burnRateForecast } from '../../analyze/cashflow'
import { insightId } from '../util'
import type { AnalysisContext, Insight, InsightDetector } from '../types'

export const burnRateForecastDetector: InsightDetector = {
  id: 'burnRateForecast',
  run(ctx: AnalysisContext): Insight[] {
    const forecast = burnRateForecast(ctx.transactions)
    if (!forecast || forecast.daysElapsed >= forecast.daysInMonth) return []

    const insight: Extract<Insight, { type: 'burnRateForecast' }> = {
      id: insightId('burnRateForecast', forecast.month),
      type: 'burnRateForecast',
      severity: 'info',
      month: forecast.month,
      spendSoFar: forecast.spendSoFar,
      projectedTotal: forecast.projectedTotal,
      daysElapsed: forecast.daysElapsed,
      daysInMonth: forecast.daysInMonth,
    }
    return [insight]
  },
}
