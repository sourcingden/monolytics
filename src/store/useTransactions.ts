import { useMemo } from 'react'
import demoCsv from '@/assets/demo-statement.csv?raw'
import { parseStatement } from '@/core/parse'
import { categorizeAll } from '@/core/categorize'
import type { Transaction } from '@/core/types'
import { useStore } from './useStore'

// Parsed once at module load — the demo dataset never changes at runtime.
const demoParsed = parseStatement(demoCsv, 'demo')
const demoRawTransactions: Transaction[] = demoParsed.ok ? demoParsed.transactions : []

/**
 * The single source of truth the UI reads from: real uploaded data run through the
 * categorization cascade with the user's own rules, or — in demo mode — the bundled
 * synthetic dataset with no rules applied, so it always looks the same for anyone trying
 * the app without their own statement.
 */
export function useTransactions(): Transaction[] {
  const rawTransactions = useStore((s) => s.rawTransactions)
  const rules = useStore((s) => s.rules)
  const demoMode = useStore((s) => s.demoMode)

  return useMemo(() => {
    if (demoMode) return categorizeAll(demoRawTransactions, { userRules: [] })
    return categorizeAll(rawTransactions, { userRules: rules })
  }, [rawTransactions, rules, demoMode])
}
