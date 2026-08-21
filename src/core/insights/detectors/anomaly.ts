import { detectAnomalies } from '../../analyze/anomalies'
import { insightId } from '../util'
import type { AnalysisContext, Insight, InsightDetector } from '../types'

const MAX_RESULTS = 10

export const anomalyDetector: InsightDetector = {
  id: 'anomaly',
  run(ctx: AnalysisContext): Insight[] {
    return detectAnomalies(ctx.transactions)
      .slice(0, MAX_RESULTS)
      .map((a) => ({
        id: insightId('anomaly', a.transaction.id),
        type: 'anomaly',
        severity: 'warning',
        transactionId: a.transaction.id,
        merchant: a.transaction.merchant,
        category: a.transaction.category,
        amount: Math.abs(a.transaction.amount),
        categoryAverage: a.categoryAverage ?? null,
        reason: a.reason,
      }))
  },
}
