import type { Transaction, TransactionKind } from '../types'

/**
 * Result of a structural (description-shape) match. `category` fully resolves the
 * transaction; `merchantHint`, when set instead, means only `kind` is settled here and
 * the cascade should keep resolving category by running merchant/MCC matching against
 * this text instead of the raw description (e.g. an installment payment's real merchant
 * name, or what's left after stripping a "Скасування." prefix).
 */
export interface StructuralMatch {
  kind: TransactionKind
  category?: string
  merchantHint?: string
}

const CASH_WITHDRAWAL_RE = /^видача готівки/i
const MONTHLY_INSTALLMENT_RE = /^щом[іi]сячний плат[іi]ж\s+(.+)$/i
const CANCELLATION_RE = /^скасування\.?\s*(.*)$/i
const INCOMING_TRANSFER_RE = /^від:\s*(.+)$/i

/**
 * MCC-independent structural patterns. These win over the merchant dictionary and MCC
 * table because a single MCC (most notably 4829, handled separately in transfers.ts)
 * covers wildly different real-world meanings that only the description text disambiguates
 * — see the plan's "Главный вывод из образца" section.
 */
export function matchStructuralPattern(tx: Transaction): StructuralMatch | null {
  const desc = tx.description.trim()

  if (CASH_WITHDRAWAL_RE.test(desc)) {
    return { kind: 'cash_withdrawal', category: 'cash.withdrawal' }
  }

  const installment = MONTHLY_INSTALLMENT_RE.exec(desc)
  if (installment) {
    return { kind: 'spend', merchantHint: installment[1].trim() }
  }

  if (INCOMING_TRANSFER_RE.test(desc)) {
    return { kind: 'income', category: 'income' }
  }

  const cancellation = CANCELLATION_RE.exec(desc)
  if (cancellation) {
    const rest = cancellation[1].trim()
    return { kind: 'refund', merchantHint: rest.length > 0 ? rest : undefined }
  }

  return null
}
