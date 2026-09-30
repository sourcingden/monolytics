import Papa from 'papaparse'
import type { MissingColumnsError, RawRow } from '../types'
import { detectDelimiter } from './dialect'

/**
 * Canonical fields we need out of a Monobank statement, and how to recognize their
 * column regardless of exact header wording (language, punctuation, apostrophe style
 * all vary between exports). See plan: headers are matched by content, never by index.
 */
export type MonoColumn =
  | 'date'
  | 'description'
  | 'mcc'
  | 'cardAmount'
  | 'opAmount'
  | 'opCurrency'
  | 'rate'
  | 'commission'
  | 'cashback'
  | 'balanceAfter'

const REQUIRED_COLUMNS: MonoColumn[] = ['date', 'description', 'cardAmount']

/** Lowercases, folds Ukrainian/Latin "і"/"i" together, and strips apostrophes/quotes for matching. */
function norm(header: string): string {
  return header
    .toLowerCase()
    .replace(/[iі]/g, 'i')
    .replace(/['’ʼ`]/g, '')
    .trim()
}

function matchColumn(normalizedHeader: string): MonoColumn | null {
  const h = normalizedHeader
  if (h.includes('дата')) return 'date'
  if (h.includes('деталi') || h.includes('details') || h.includes('опис')) return 'description'
  if (h === 'mcc' || h.includes('mcc')) return 'mcc'
  if (h.includes('сума') && h.includes('карт')) return 'cardAmount'
  if (h.includes('сума') && h.includes('операц')) return 'opAmount'
  if (h === 'валюта' || h === 'currency' || (h.includes('валюта') && h.includes('операц')))
    return 'opCurrency'
  if (h.includes('курс')) return 'rate'
  if (h.includes('комiс') || h.includes('commission')) return 'commission'
  if (h.includes('кешбек') || h.includes('кэшбек') || h.includes('cashback')) return 'cashback'
  if (h.includes('залишок') || h.includes('залиш') || h.includes('остат') || h.includes('balance'))
    return 'balanceAfter'
  return null
}

export interface HeaderMapping {
  /** Original header text -> resolved canonical column. Unrecognized headers are omitted. */
  columnByHeader: Map<string, MonoColumn>
  /** Canonical column -> original header text, for building RawRow lookups. */
  headerByColumn: Map<MonoColumn, string>
}

export function mapHeaders(headers: string[]): HeaderMapping {
  const columnByHeader = new Map<string, MonoColumn>()
  const headerByColumn = new Map<MonoColumn, string>()

  for (const header of headers) {
    const column = matchColumn(norm(header))
    if (column && !headerByColumn.has(column)) {
      columnByHeader.set(header, column)
      headerByColumn.set(column, header)
    }
  }

  return { columnByHeader, headerByColumn }
}

export function findMissingColumns(mapping: HeaderMapping): string[] {
  return REQUIRED_COLUMNS.filter((c) => !mapping.headerByColumn.has(c))
}

export interface ParsedCsv {
  rows: RawRow[]
  mapping: HeaderMapping
}

export type ParseCsvResult = { ok: true; data: ParsedCsv } | { ok: false; error: MissingColumnsError }

/** Parses raw CSV text into rows keyed by original header, with delimiter autodetection. */
export function parseMonoCsv(text: string): ParseCsvResult {
  const delimiter = detectDelimiter(text)
  const result = Papa.parse<RawRow>(text, {
    header: true,
    delimiter,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })

  const headers = result.meta.fields ?? []
  const mapping = mapHeaders(headers)
  const missing = findMissingColumns(mapping)

  if (missing.length > 0) {
    return { ok: false, error: { type: 'missing-columns', missing } }
  }

  return { ok: true, data: { rows: result.data, mapping } }
}

/** Reads one canonical column's raw string value off a parsed row, or undefined if absent. */
export function getField(row: RawRow, mapping: HeaderMapping, column: MonoColumn): string | undefined {
  const header = mapping.headerByColumn.get(column)
  if (!header) return undefined
  return row[header]
}
