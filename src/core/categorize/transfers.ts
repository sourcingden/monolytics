import type { Transaction } from '../types'
import type { StructuralMatch } from './structuralPatterns'

// Note: \b is unusable with Cyrillic in JS regex — \w (and therefore \b) is ASCII-only
// even with the /u flag, so a boundary next to a Cyrillic letter never matches. Anchoring
// on ^ instead of \b avoids the trap entirely.
const CREDIT_DRAW_RE = /^(кредит.*(дн[іi]в|дн[іi])|розстрочка на картку)/i
const SAVINGS_TOPUP_RE = /^поповнення\s*«.+»/i
const INTERNAL_TRANSFER_RE = /^з (гривневого рахунку|доларової картки|чорної картки)/i

/**
 * Sub-classifies everything that in practice rides MCC 4829 ("wire transfer / money
 * order"): Monobank's own credit products, moves between the user's own accounts,
 * savings jar top-ups, and real P2P transfers to another person all share that MCC.
 * See the plan's category table — order matters, most specific first.
 */
export function matchTransferPattern(tx: Transaction): StructuralMatch | null {
  const desc = tx.description.trim()

  if (CREDIT_DRAW_RE.test(desc)) {
    return { kind: 'debt', category: 'finance.credit' }
  }
  if (SAVINGS_TOPUP_RE.test(desc)) {
    return { kind: 'savings_contribution', category: 'savings.contribution' }
  }
  if (INTERNAL_TRANSFER_RE.test(desc)) {
    return { kind: 'transfer_internal', category: 'transfers.internal' }
  }

  if (tx.mcc === 4829) {
    // Whatever's left under 4829 is a named person or a masked card number. A commission
    // reliably tells them apart: Monobank does not charge one for moves between your own
    // cards/products, only for transfers that actually leave your accounts.
    return tx.commission > 0
      ? { kind: 'transfer_p2p', category: 'transfers.p2p' }
      : { kind: 'transfer_internal', category: 'transfers.internal' }
  }

  return null
}
