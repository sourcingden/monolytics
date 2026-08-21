import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
  detectDelimiter,
  parseAmount,
  parseMonoDate,
  parseMonoCsv,
  parseStatement,
  dedupeTransactions,
} from '../../src/core/parse'

const FIXTURE_PATH = path.resolve(process.cwd(), 'tests/fixtures/sample-statement.csv')

describe('detectDelimiter', () => {
  it('picks tab when the header is tab-separated', () => {
    expect(detectDelimiter('a\tb\tc\n1\t2\t3')).toBe('\t')
  })
  it('picks comma when the header is comma-separated', () => {
    expect(detectDelimiter('a,b,c\n1,2,3')).toBe(',')
  })
  it('picks semicolon when the header is semicolon-separated', () => {
    expect(detectDelimiter('a;b;c\n1;2;3')).toBe(';')
  })
})

describe('parseAmount', () => {
  it('parses a plain negative decimal', () => {
    expect(parseAmount('-119.0')).toBe(-119)
  })
  it('treats an em dash as null', () => {
    expect(parseAmount('—')).toBeNull()
  })
  it('treats a blank string as null', () => {
    expect(parseAmount('')).toBeNull()
  })
  it('treats undefined as null', () => {
    expect(parseAmount(undefined)).toBeNull()
  })
  it('treats a comma as a decimal separator when there is no dot', () => {
    expect(parseAmount('-119,50')).toBeCloseTo(-119.5)
  })
  it('treats a comma as a thousands separator when a dot is also present', () => {
    expect(parseAmount('146,553.00')).toBeCloseTo(146553)
  })
})

describe('parseMonoDate', () => {
  it('parses the exact Monobank format', () => {
    const d = parseMonoDate('31.07.2026 20:58:54')
    expect(d).not.toBeNull()
    expect(d?.getFullYear()).toBe(2026)
    expect(d?.getMonth()).toBe(6) // July, 0-indexed
    expect(d?.getDate()).toBe(31)
    expect(d?.getHours()).toBe(20)
    expect(d?.getMinutes()).toBe(58)
    expect(d?.getSeconds()).toBe(54)
  })
  it('rejects a malformed date', () => {
    expect(parseMonoDate('2026-07-31')).toBeNull()
  })
})

describe('parseMonoCsv', () => {
  it('recognizes the real Monobank header regardless of exact wording', () => {
    const csv = [
      ['Дата i час операції', 'Деталі операції', 'MCC', 'Сума в валюті картки (UAH)'].join('\t'),
      ['01.01.2025 10:00:00', 'Сільпо', '5411', '-100.00'].join('\t'),
    ].join('\n')
    const result = parseMonoCsv(csv)
    expect(result.ok).toBe(true)
  })

  it('reports missing required columns instead of throwing', () => {
    const csv = ['Foo,Bar', '1,2'].join('\n')
    const result = parseMonoCsv(csv)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.type).toBe('missing-columns')
      expect(result.error.missing.length).toBeGreaterThan(0)
    }
  })
})

describe('parseStatement (end-to-end on the real fixture)', () => {
  const text = readFileSync(FIXTURE_PATH, 'utf-8')
  const result = parseStatement(text, 'main-card')

  it('parses successfully with no missing columns', () => {
    expect(result.ok).toBe(true)
  })

  it('parses every row with no issues', () => {
    if (!result.ok) throw new Error('expected ok result')
    expect(result.issues).toHaveLength(0)
    expect(result.transactions.length).toBeGreaterThan(50)
  })

  it('reads em-dash fields as null and present fields as numbers', () => {
    if (!result.ok) throw new Error('expected ok result')
    const withCommission = result.transactions.find((tx) => tx.description === 'Олена П.')
    expect(withCommission?.commission).toBeGreaterThan(0)
    const withoutCommission = result.transactions.find((tx) => tx.description === 'Сільпо')
    expect(withoutCommission?.commission).toBe(0)
  })

  it('reads a foreign-currency operation amount alongside the UAH card amount', () => {
    if (!result.ok) throw new Error('expected ok result')
    const apple = result.transactions.find((tx) => tx.description === 'Apple')
    expect(apple?.currency).toBe('UAH')
    expect(apple?.opCurrency).toBe('USD')
    expect(apple?.rate).toBeGreaterThan(0)
  })

  it('assigns the given accountId to every row', () => {
    if (!result.ok) throw new Error('expected ok result')
    expect(result.transactions.every((tx) => tx.accountId === 'main-card')).toBe(true)
  })
})

describe('dedupeTransactions', () => {
  it('drops a second upload of the same statement', () => {
    const text = readFileSync(FIXTURE_PATH, 'utf-8')
    const result = parseStatement(text, 'main-card')
    if (!result.ok) throw new Error('expected ok result')

    const combined = [...result.transactions, ...result.transactions]
    const deduped = dedupeTransactions(combined)
    expect(deduped).toHaveLength(result.transactions.length)
  })
})
