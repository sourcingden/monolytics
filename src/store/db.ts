import { get, set, del } from 'idb-keyval'
import type { Transaction } from '@/core/types'
import type { UserRule } from '@/core/categorize'

// Versioned keys so a future schema change can migrate instead of silently misreading
// old data. Everything here lives only in the browser's IndexedDB — see plan's privacy
// section: there is no server this data could go to.
const TRANSACTIONS_KEY = 'monolytics:v1:transactions'
const RULES_KEY = 'monolytics:v1:rules'
const SETTINGS_KEY = 'monolytics:v1:settings'

export interface StoredAccount {
  id: string
  label: string
}

export interface StoredSettings {
  language: 'uk' | 'en'
  accounts: StoredAccount[]
}

const DEFAULT_SETTINGS: StoredSettings = { language: 'uk', accounts: [] }

/** Transactions are stored with `date` as an ISO string — IndexedDB structured clone
 * handles Date fine, but we serialize explicitly to keep the on-disk shape stable and
 * easy to migrate. */
type StoredTransaction = Omit<Transaction, 'date'> & { date: string }

function toStored(tx: Transaction): StoredTransaction {
  return { ...tx, date: tx.date.toISOString() }
}

function fromStored(tx: StoredTransaction): Transaction {
  return { ...tx, date: new Date(tx.date) }
}

export async function loadTransactions(): Promise<Transaction[]> {
  const stored = await get<StoredTransaction[]>(TRANSACTIONS_KEY)
  return (stored ?? []).map(fromStored)
}

export async function saveTransactions(transactions: Transaction[]): Promise<void> {
  await set(TRANSACTIONS_KEY, transactions.map(toStored))
}

export async function loadRules(): Promise<UserRule[]> {
  return (await get<UserRule[]>(RULES_KEY)) ?? []
}

export async function saveRules(rules: UserRule[]): Promise<void> {
  await set(RULES_KEY, rules)
}

export async function loadSettings(): Promise<StoredSettings> {
  const stored = await get<StoredSettings>(SETTINGS_KEY)
  return { ...DEFAULT_SETTINGS, ...stored }
}

export async function saveSettings(settings: StoredSettings): Promise<void> {
  await set(SETTINGS_KEY, settings)
}

/** The "delete everything" button in Налаштування — a real, complete wipe. */
export async function clearAllData(): Promise<void> {
  await Promise.all([del(TRANSACTIONS_KEY), del(RULES_KEY), del(SETTINGS_KEY)])
}
