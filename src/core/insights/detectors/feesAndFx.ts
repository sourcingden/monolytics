import { annualize, insightId, periodMonths } from '../util'
import type { AnalysisContext, Insight, InsightDetector } from '../types'

const MIN_COMMISSION_TOTAL = 50 // UAH — not worth flagging pocket change

/**
 * Total commissions paid across the period (P2P transfers, cash withdrawals, currency
 * conversion). FX-rate loss on foreign-currency purchases isn't estimated here — Monobank
 * doesn't expose the interbank rate to compare against, so a number would be a guess
 * dressed up as data.
 */
export const feesAndFxDetector: InsightDetector = {
  id: 'feesAndFx',
  run(ctx: AnalysisContext): Insight[] {
    const commissionTotal = ctx.transactions.reduce((sum, tx) => sum + Math.max(tx.commission, 0), 0)
    if (commissionTotal < MIN_COMMISSION_TOTAL) return []

    const annualCommission = annualize(commissionTotal, ctx.transactions)

    const insight: Extract<Insight, { type: 'feesAndFx' }> = {
      id: insightId('feesAndFx', 'summary'),
      type: 'feesAndFx',
      severity: 'info',
      commissionTotal,
      periodMonths: periodMonths(ctx.transactions),
      annualSavingsPotential: annualCommission,
    }
    return [insight]
  },
}
