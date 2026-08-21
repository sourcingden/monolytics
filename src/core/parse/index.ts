import type { MissingColumnsError, ParseIssue, Transaction } from '../types'
import { parseMonoCsv } from './monoCsv'
import { normalizeRows } from './normalize'

export { detectDelimiter, decodeStatementBuffer } from './dialect'
export { parseMonoCsv, mapHeaders, findMissingColumns, getField } from './monoCsv'
export type { MonoColumn, HeaderMapping } from './monoCsv'
export { parseAmount, parseMonoDate } from './normalize'
export { dedupeTransactions } from './dedupe'

export type ParseStatementResult =
  | { ok: true; transactions: Transaction[]; issues: ParseIssue[] }
  | { ok: false; error: MissingColumnsError }

/** End-to-end: raw CSV text -> transaction shells, ready for src/core/categorize. */
export function parseStatement(text: string, accountId: string): ParseStatementResult {
  const parsed = parseMonoCsv(text)
  if (!parsed.ok) return parsed

  const { transactions, issues } = normalizeRows(parsed.data.rows, parsed.data.mapping, accountId)
  return { ok: true, transactions, issues }
}
