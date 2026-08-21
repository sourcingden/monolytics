// Core domain types. This module has no React/DOM dependency — see src/core/README.md.

/** What a transaction actually represents economically — the whole point of not trusting Monobank's own categorization. */
export type TransactionKind =
  | 'spend' // a real purchase
  | 'income' // salary, "Від: Ім'я", other real inflow
  | 'transfer_internal' // between the user's own accounts/cards, or a Monobank credit product drawdown
  | 'transfer_p2p' // a transfer to a specific person (carries a commission)
  | 'savings_contribution' // topping up a savings jar/goal
  | 'debt' // "Кредит До завтра", "Розстрочка на картку" — an inflow that is a liability, not income
  | 'cash_withdrawal' // cash pulled at an ATM/terminal — money whose further path is invisible to the statement
  | 'refund'
  | 'fee'
  | 'cashback'

export type CategorySource = 'user' | 'pattern' | 'merchant' | 'mcc' | 'fallback'

export interface Transaction {
  id: string
  date: Date
  /** Raw "Деталі операції" text, unmodified. */
  description: string
  /** Best-effort human-readable merchant name, resolved by the categorization cascade. */
  merchant: string
  mcc: number | null
  /** Signed amount in card currency (UAH). Negative = money leaving the account. */
  amount: number
  currency: 'UAH'
  /** Amount in the operation's original currency, when it differs from UAH (e.g. a USD purchase). */
  opAmount: number | null
  opCurrency: string | null
  rate: number | null
  commission: number
  cashback: number
  balanceAfter: number | null
  /** Which uploaded statement/card this row came from. Assigned by the caller, not present in the CSV. */
  accountId: string

  category: string
  categorySource: CategorySource
  kind: TransactionKind
}

/** A row exactly as parsed from CSV, keyed by original header text. */
export type RawRow = Record<string, string>

export interface ParseIssue {
  rowIndex: number
  reason: string
}

export interface MissingColumnsError {
  type: 'missing-columns'
  missing: string[]
}
