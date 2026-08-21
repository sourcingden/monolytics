/**
 * The flat category tree from the plan. Ids are stable strings used everywhere in
 * core/UI/storage; i18n labels live separately in src/i18n so this file never needs
 * to know about language.
 */
export interface CategoryDef {
  id: string
  groupId: string
}

export interface CategoryGroupDef {
  id: string
}

export const CATEGORY_GROUPS: CategoryGroupDef[] = [
  { id: 'food' },
  { id: 'transport' },
  { id: 'housing' },
  { id: 'health' },
  { id: 'shopping' },
  { id: 'entertainment' },
  { id: 'education' },
  { id: 'travel' },
  { id: 'finance' },
  { id: 'donations' },
  { id: 'kids' },
  { id: 'pets' },
  { id: 'cash' },
  { id: 'savings' },
  { id: 'transfers' },
  { id: 'income' },
  { id: 'uncategorized' },
]

export const CATEGORIES: CategoryDef[] = [
  { id: 'food.groceries', groupId: 'food' },
  { id: 'food.cafe', groupId: 'food' },
  { id: 'food.delivery', groupId: 'food' },
  { id: 'food.coffee', groupId: 'food' },

  { id: 'transport.taxi', groupId: 'transport' },
  { id: 'transport.fuel', groupId: 'transport' },
  { id: 'transport.public', groupId: 'transport' },
  { id: 'transport.service', groupId: 'transport' },
  { id: 'transport.parking', groupId: 'transport' },

  { id: 'housing.rent', groupId: 'housing' },
  { id: 'housing.utilities', groupId: 'housing' },
  { id: 'housing.internet', groupId: 'housing' },
  { id: 'housing.repair', groupId: 'housing' },

  { id: 'health.pharmacy', groupId: 'health' },
  { id: 'health.doctors', groupId: 'health' },
  { id: 'health.sport', groupId: 'health' },

  { id: 'shopping.clothes', groupId: 'shopping' },
  { id: 'shopping.electronics', groupId: 'shopping' },
  { id: 'shopping.home', groupId: 'shopping' },
  { id: 'shopping.cosmetics', groupId: 'shopping' },
  { id: 'shopping.gifts', groupId: 'shopping' },

  { id: 'entertainment.subscriptions', groupId: 'entertainment' },
  { id: 'entertainment.events', groupId: 'entertainment' },
  { id: 'entertainment.games', groupId: 'entertainment' },
  { id: 'entertainment.hobby', groupId: 'entertainment' },

  { id: 'education', groupId: 'education' },
  { id: 'travel', groupId: 'travel' },

  { id: 'finance.fees', groupId: 'finance' },
  { id: 'finance.credit', groupId: 'finance' },
  { id: 'finance.fines', groupId: 'finance' },
  { id: 'finance.insurance', groupId: 'finance' },

  { id: 'donations', groupId: 'donations' },
  { id: 'kids', groupId: 'kids' },
  { id: 'pets', groupId: 'pets' },

  { id: 'cash.withdrawal', groupId: 'cash' },
  { id: 'savings.contribution', groupId: 'savings' },

  { id: 'transfers.p2p', groupId: 'transfers' },
  { id: 'transfers.internal', groupId: 'transfers' },

  { id: 'income', groupId: 'income' },
  { id: 'uncategorized', groupId: 'uncategorized' },
]

const CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id))

export function isValidCategoryId(id: string): boolean {
  return CATEGORY_IDS.has(id)
}

/**
 * Categories excluded from the "real spend" headline number — everything that isn't
 * a purchase, per the plan's kind-based accounting. `transfers.p2p` is deliberately
 * excluded from spend too, but shown as its own line rather than hidden.
 */
export const NON_SPEND_KINDS = new Set([
  'income',
  'transfer_internal',
  'transfer_p2p',
  'savings_contribution',
  'debt',
  'cash_withdrawal',
])
