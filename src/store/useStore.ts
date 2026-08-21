import { create } from 'zustand'
import { parseStatement, dedupeTransactions } from '@/core/parse'
import {
  createIdRule,
  createMerchantRule,
  type UserRule,
} from '@/core/categorize'
import type { Transaction, TransactionKind } from '@/core/types'
import {
  loadTransactions,
  saveTransactions,
  loadRules,
  saveRules,
  loadSettings,
  saveSettings,
  clearAllData,
  type StoredAccount,
} from './db'

export type ImportOutcome =
  | {
      ok: true
      fileName: string
      accountId: string
      addedCount: number
      duplicateCount: number
      issueCount: number
    }
  | { ok: false; fileName: string; error: string }

interface AppState {
  ready: boolean
  rawTransactions: Transaction[]
  rules: UserRule[]
  language: 'uk' | 'en'
  accounts: StoredAccount[]
  demoMode: boolean

  init: () => Promise<void>
  importFiles: (files: { fileName: string; text: string }[]) => Promise<ImportOutcome[]>
  removeAccount: (accountId: string) => Promise<void>
  setLanguage: (lang: 'uk' | 'en') => Promise<void>
  reassignTransaction: (
    tx: Transaction,
    category: string,
    opts: { scope: 'single' | 'merchant'; kind?: TransactionKind },
  ) => Promise<void>
  removeRule: (ruleId: string) => Promise<void>
  clearAll: () => Promise<void>
  setDemoMode: (on: boolean) => void
}

export const useStore = create<AppState>((set, get) => ({
  ready: false,
  rawTransactions: [],
  rules: [],
  language: 'uk',
  accounts: [],
  demoMode: false,

  async init() {
    const [transactions, rules, settings] = await Promise.all([
      loadTransactions(),
      loadRules(),
      loadSettings(),
    ])
    set({
      rawTransactions: transactions,
      rules,
      language: settings.language,
      accounts: settings.accounts,
      ready: true,
    })
  },

  async importFiles(files) {
    const outcomes: ImportOutcome[] = []
    let { rawTransactions, accounts } = get()

    for (const file of files) {
      const accountId = `acc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const parsed = parseStatement(file.text, accountId)

      if (!parsed.ok) {
        outcomes.push({ ok: false, fileName: file.fileName, error: parsed.error.missing.join(', ') })
        continue
      }

      const beforeCount = rawTransactions.length
      const combined = dedupeTransactions([...rawTransactions, ...parsed.transactions])
      const addedCount = combined.length - beforeCount

      rawTransactions = combined
      accounts = [...accounts, { id: accountId, label: file.fileName }]

      outcomes.push({
        ok: true,
        fileName: file.fileName,
        accountId,
        addedCount,
        duplicateCount: parsed.transactions.length - addedCount,
        issueCount: parsed.issues.length,
      })
    }

    set({ rawTransactions, accounts })
    await Promise.all([
      saveTransactions(rawTransactions),
      saveSettings({ language: get().language, accounts }),
    ])
    return outcomes
  },

  async removeAccount(accountId) {
    const rawTransactions = get().rawTransactions.filter((tx) => tx.accountId !== accountId)
    const accounts = get().accounts.filter((a) => a.id !== accountId)
    set({ rawTransactions, accounts })
    await Promise.all([
      saveTransactions(rawTransactions),
      saveSettings({ language: get().language, accounts }),
    ])
  },

  async setLanguage(language) {
    set({ language })
    await saveSettings({ language, accounts: get().accounts })
  },

  async reassignTransaction(tx, category, opts) {
    const rule =
      opts.scope === 'merchant'
        ? createMerchantRule(tx, category, opts.kind)
        : createIdRule(tx, category, opts.kind)
    const rules = [...get().rules, rule]
    set({ rules })
    await saveRules(rules)
  },

  async removeRule(ruleId) {
    const rules = get().rules.filter((r) => r.id !== ruleId)
    set({ rules })
    await saveRules(rules)
  },

  async clearAll() {
    await clearAllData()
    set({ rawTransactions: [], rules: [], accounts: [], demoMode: false })
  },

  setDemoMode(on) {
    set({ demoMode: on })
  },
}))
