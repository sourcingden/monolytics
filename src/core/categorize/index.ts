import type { Transaction } from '../types'
import { matchMerchant } from './merchants'
import { mccToCategory } from './mcc'
import { matchStructuralPattern } from './structuralPatterns'
import { matchTransferPattern } from './transfers'
import { matchUserRule, type UserRule } from './rules'

export { CATEGORIES, CATEGORY_GROUPS, isValidCategoryId, NON_SPEND_KINDS } from './categories'
export { matchMerchant } from './merchants'
export { mccToCategory } from './mcc'
export {
  matchUserRule,
  createIdRule,
  createMerchantRule,
  type UserRule,
  type UserRuleMatch,
} from './rules'

export interface CategorizeOptions {
  userRules?: UserRule[]
}

/**
 * The full categorization cascade from the plan: user rules (incl. manual per-transaction
 * overrides) > structural description patterns > merchant dictionary > MCC table > fallback.
 * Pure function — takes a transaction shell (as produced by src/core/parse) and returns a
 * fully resolved one. Never mutates its input.
 */
export function categorizeTransaction(tx: Transaction, opts: CategorizeOptions = {}): Transaction {
  const userRule = matchUserRule(tx, opts.userRules ?? [])
  if (userRule) {
    return { ...tx, category: userRule.category, categorySource: 'user', kind: userRule.kind ?? tx.kind }
  }

  const structural = matchStructuralPattern(tx) ?? matchTransferPattern(tx)

  if (structural?.category) {
    return { ...tx, category: structural.category, categorySource: 'pattern', kind: structural.kind }
  }

  const effectiveDescription = structural?.merchantHint ?? tx.description
  const merchantMatch = matchMerchant(effectiveDescription)
  if (merchantMatch) {
    return {
      ...tx,
      merchant: merchantMatch.merchant,
      category: merchantMatch.category,
      categorySource: 'merchant',
      kind: structural?.kind ?? tx.kind,
    }
  }

  const mccCategory = mccToCategory(tx.mcc)
  if (mccCategory) {
    return { ...tx, category: mccCategory, categorySource: 'mcc', kind: structural?.kind ?? tx.kind }
  }

  return { ...tx, category: 'uncategorized', categorySource: 'fallback', kind: structural?.kind ?? tx.kind }
}

export function categorizeAll(transactions: Transaction[], opts: CategorizeOptions = {}): Transaction[] {
  return transactions.map((tx) => categorizeTransaction(tx, opts))
}
