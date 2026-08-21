import type { Transaction, TransactionKind } from '../types'

export type UserRuleMatch =
  | { type: 'id'; txId: string } // a single manual reassignment ("ручное назначение")
  | { type: 'contains'; text: string } // broad "if description contains X" rule
  | { type: 'regex'; source: string }

export interface UserRule {
  id: string
  match: UserRuleMatch
  category: string
  kind?: TransactionKind
  createdAt: string
}

/**
 * User rules and single-transaction manual reassignments share one mechanism: both are
 * "the user decided this", so both win over every automatic layer, checked in stored
 * order (first match wins) — an id-exact rule and a broader contains/regex rule are just
 * two shapes of the same list. See plan's categorization cascade, steps 1+2.
 */
export function matchUserRule(tx: Transaction, rules: UserRule[]): UserRule | null {
  for (const rule of rules) {
    if (ruleMatches(tx, rule.match)) return rule
  }
  return null
}

function ruleMatches(tx: Transaction, match: UserRuleMatch): boolean {
  switch (match.type) {
    case 'id':
      return tx.id === match.txId
    case 'contains':
      return tx.description.toLowerCase().includes(match.text.toLowerCase())
    case 'regex':
      try {
        return new RegExp(match.source, 'i').test(tx.description)
      } catch {
        return false
      }
  }
}

/** Builds a single-transaction override rule, as offered right after a manual recategorization. */
export function createIdRule(tx: Transaction, category: string, kind?: TransactionKind): UserRule {
  return {
    id: `rule_${tx.id}_${Date.now()}`,
    match: { type: 'id', txId: tx.id },
    category,
    kind,
    createdAt: new Date().toISOString(),
  }
}

/** Builds a "apply to all similar" rule from the transaction's own (already resolved) merchant name. */
export function createMerchantRule(tx: Transaction, category: string, kind?: TransactionKind): UserRule {
  return {
    id: `rule_merchant_${hashText(tx.merchant)}_${Date.now()}`,
    match: { type: 'contains', text: tx.merchant },
    category,
    kind,
    createdAt: new Date().toISOString(),
  }
}

function hashText(s: string): string {
  let hash = 5381
  for (let i = 0; i < s.length; i++) hash = (hash * 33) ^ s.charCodeAt(i)
  return (hash >>> 0).toString(36)
}
