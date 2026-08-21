import { totalsByCategory } from '../../analyze/totals'
import { annualize, insightId } from '../util'
import type { AnalysisContext, Insight, InsightDetector } from '../types'

/** How much "the cost of laziness" (delivery over cooking) runs, framed against grocery spend. */
export const deliveryVsGroceriesDetector: InsightDetector = {
  id: 'deliveryVsGroceries',
  run(ctx: AnalysisContext): Insight[] {
    const totals = totalsByCategory(ctx.transactions)
    const deliveryTotal = totals.get('food.delivery') ?? 0
    const groceriesTotal = totals.get('food.groceries') ?? 0

    if (deliveryTotal <= 0) return []

    const ratio = groceriesTotal > 0 ? deliveryTotal / groceriesTotal : Infinity
    const annualDeliveryCost = annualize(deliveryTotal, ctx.transactions)

    const insight: Extract<Insight, { type: 'deliveryVsGroceries' }> = {
      id: insightId('deliveryVsGroceries', 'summary'),
      type: 'deliveryVsGroceries',
      severity: 'info',
      deliveryTotal,
      groceriesTotal,
      ratio,
      annualDeliveryCost,
      annualSavingsPotential: annualDeliveryCost,
    }
    return [insight]
  },
}
