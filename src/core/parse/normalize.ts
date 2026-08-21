import type { ParseIssue, RawRow, Transaction } from '../types'
import { getField, type HeaderMapping } from './monoCsv'

/** Monobank prints "—" (em dash) for absent optional values (rate, commission, cashback, …). */
const EMPTY_MARKERS = new Set(['', '—', '-'])

/**
 * Parses a Monobank numeric field. Handles both '.' and ',' as decimal separators
 * (exports re-saved through a comma-locale spreadsheet use ','), and em-dash/blank as null.
 */
export function parseAmount(raw: string | undefined): number | null {
  if (raw == null) return null
  const trimmed = raw.trim()
  if (EMPTY_MARKERS.has(trimmed)) return null

  let cleaned = trimmed.replace(/[\s ]/g, '')
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // comma used as a thousands separator alongside a dot decimal
    cleaned = cleaned.replace(/,/g, '')
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.')
  }

  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

const DATE_RE = /^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/

/** Parses "DD.MM.YYYY HH:mm:ss", the exact format of Monobank's date/time column. */
export function parseMonoDate(raw: string | undefined): Date | null {
  if (raw == null) return null
  const m = DATE_RE.exec(raw.trim())
  if (!m) return null
  const [, dd, mm, yyyy, hh, mi, ss] = m
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(mi), Number(ss))
  return Number.isNaN(date.getTime()) ? null : date
}

function parseMcc(raw: string | undefined): number | null {
  if (raw == null) return null
  const trimmed = raw.trim()
  if (EMPTY_MARKERS.has(trimmed)) return null
  const n = Number(trimmed)
  return Number.isInteger(n) ? n : null
}

/** djb2 — cheap, stable, non-cryptographic. Just needs to make a compact id, not resist attack. */
function hashString(s: string): string {
  let hash = 5381
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 33) ^ s.charCodeAt(i)
  }
  return (hash >>> 0).toString(36)
}

export interface NormalizeResult {
  transactions: Transaction[]
  issues: ParseIssue[]
}

/**
 * Turns raw CSV rows into transaction shells: parsed fields, a naive sign-based
 * kind/category placeholder. The categorization cascade (src/core/categorize) is what
 * resolves the real kind, category and merchant — this step only makes the data usable.
 */
export function normalizeRows(rows: RawRow[], mapping: HeaderMapping, accountId: string): NormalizeResult {
  const transactions: Transaction[] = []
  const issues: ParseIssue[] = []

  rows.forEach((row, rowIndex) => {
    const date = parseMonoDate(getField(row, mapping, 'date'))
    const description = (getField(row, mapping, 'description') ?? '').trim()
    const amount = parseAmount(getField(row, mapping, 'cardAmount'))

    if (!date || !description || amount == null) {
      issues.push({ rowIndex, reason: 'missing date, description, or amount' })
      return
    }

    const balanceAfter = parseAmount(getField(row, mapping, 'balanceAfter'))
    const opAmount = parseAmount(getField(row, mapping, 'opAmount'))
    const opCurrency = getField(row, mapping, 'opCurrency')?.trim() || null
    const rate = parseAmount(getField(row, mapping, 'rate'))
    const commission = parseAmount(getField(row, mapping, 'commission')) ?? 0
    const cashback = parseAmount(getField(row, mapping, 'cashback')) ?? 0
    const mcc = parseMcc(getField(row, mapping, 'mcc'))

    const id = hashString(`${date.toISOString()}|${description}|${amount}|${balanceAfter ?? ''}`)

    transactions.push({
      id,
      date,
      description,
      merchant: description,
      mcc,
      amount,
      currency: 'UAH',
      opAmount,
      opCurrency,
      rate,
      commission,
      cashback,
      balanceAfter,
      accountId,
      // Naive placeholder — src/core/categorize overwrites all three below.
      category: 'uncategorized',
      categorySource: 'fallback',
      kind: amount >= 0 ? 'income' : 'spend',
    })
  })

  return { transactions, issues }
}
