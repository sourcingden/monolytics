import type { Transaction } from '../types'
import { totalsByCategory } from '../analyze/totals'
import { annualize } from '../analyze/periods'

export interface CategoryCutResult {
  category: string
  currentAnnual: number
  cutPct: number
  annualSavings: number
  newAnnual: number
}

/** Projects the annual effect of cutting one category's spend by a given percentage. */
export function simulateCategoryCut(
  transactions: Transaction[],
  category: string,
  cutPct: number,
): CategoryCutResult {
  const currentTotal = totalsByCategory(transactions).get(category) ?? 0
  const currentAnnual = annualize(currentTotal, transactions)
  const annualSavings = currentAnnual * cutPct
  return { category, currentAnnual, cutPct, annualSavings, newAnnual: currentAnnual - annualSavings }
}

export interface GrowthPoint {
  years: number
  futureValue: number
  contributed: number
  interestEarned: number
}

/**
 * Future value of a fixed monthly contribution compounded monthly — the "what if I invest
 * the savings instead" half of the simulator.
 */
export function simulateSavingsGrowth(
  monthlyAmount: number,
  annualRatePct: number,
  yearsList: number[] = [1, 3, 5],
): GrowthPoint[] {
  const monthlyRate = annualRatePct / 12

  return yearsList.map((years) => {
    const months = years * 12
    const contributed = monthlyAmount * months
    const futureValue =
      monthlyRate === 0
        ? contributed
        : monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
    return { years, futureValue, contributed, interestEarned: futureValue - contributed }
  })
}
