import type { Transaction } from '../types'
import { groupByMonth, listMonths } from '../analyze/periods'
import { incomeTotal, realSpendTotal } from '../analyze/totals'
import { bucketOf } from './fiftyThirtyTwenty'

const LOOKBACK_MONTHS = 3

export interface EmergencyFundResult {
  avgMonthlyEssentialSpend: number
  target3Months: number
  target6Months: number
  avgMonthlyNet: number
  monthsToTarget3: number | null
  monthsToTarget6: number | null
}

/**
 * Sizes a safety cushion off essential ("needs") spend only — not total spend, since
 * discretionary spending is exactly what a real emergency would cut first.
 */
export function computeEmergencyFund(transactions: Transaction[]): EmergencyFundResult {
  const months = listMonths(transactions).slice(-LOOKBACK_MONTHS)
  const byMonth = groupByMonth(transactions)

  let essentialTotal = 0
  let netTotal = 0

  for (const month of months) {
    const txs = byMonth.get(month) ?? []
    for (const tx of txs) {
      if (tx.kind !== 'spend') continue
      if (bucketOf(tx.category) === 'needs') essentialTotal += Math.abs(tx.amount)
    }
    netTotal += incomeTotal(txs) - realSpendTotal(txs)
  }

  const monthCount = Math.max(months.length, 1)
  const avgMonthlyEssentialSpend = essentialTotal / monthCount
  const avgMonthlyNet = netTotal / monthCount

  const target3Months = avgMonthlyEssentialSpend * 3
  const target6Months = avgMonthlyEssentialSpend * 6

  return {
    avgMonthlyEssentialSpend,
    target3Months,
    target6Months,
    avgMonthlyNet,
    monthsToTarget3: avgMonthlyNet > 0 ? target3Months / avgMonthlyNet : null,
    monthsToTarget6: avgMonthlyNet > 0 ? target6Months / avgMonthlyNet : null,
  }
}
