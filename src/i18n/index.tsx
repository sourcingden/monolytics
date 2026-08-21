import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { uk } from './uk'
import { en } from './en'
import { categoryLabelsUk, categoryLabelsEn } from './categories'
import type { TransactionKind } from '@/core/types'

export type Language = 'uk' | 'en'

const DICTS: Record<Language, typeof uk> = { uk, en }
const CATEGORY_LABELS: Record<Language, Record<string, string>> = {
  uk: categoryLabelsUk,
  en: categoryLabelsEn,
}
const LOCALE: Record<Language, string> = { uk: 'uk-UA', en: 'en-US' }

function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) return (acc as Record<string, unknown>)[key]
    return undefined
  }, obj)
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  )
}

interface I18nValue {
  language: Language
  t: (key: string, params?: Record<string, string | number>) => string
  categoryLabel: (categoryId: string) => string
  kindLabel: (kind: TransactionKind) => string
  formatMoney: (amount: number) => string
  formatPercent: (fraction: number, digits?: number) => string
  formatDate: (date: Date) => string
  formatMonth: (monthKey: string) => string
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ language, children }: { language: Language; children: ReactNode }) {
  const value = useMemo<I18nValue>(() => {
    const dict = DICTS[language]
    const categoryLabels = CATEGORY_LABELS[language]
    const locale = LOCALE[language]

    const moneyFormatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'UAH',
      maximumFractionDigits: 0,
    })
    const dateFormatter = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' })

    return {
      language,
      t: (key, params) => {
        const raw = getPath(dict, key)
        return typeof raw === 'string' ? interpolate(raw, params) : key
      },
      categoryLabel: (categoryId) => categoryLabels[categoryId] ?? categoryId,
      kindLabel: (kind) => dict.kinds[kind] ?? kind,
      formatMoney: (amount) => moneyFormatter.format(amount),
      formatPercent: (fraction, digits = 0) =>
        `${(fraction * 100).toLocaleString(locale, { maximumFractionDigits: digits, minimumFractionDigits: digits })}%`,
      formatDate: (date) => dateFormatter.format(date),
      formatMonth: (monthKey) => {
        const [year, month] = monthKey.split('-').map(Number)
        return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
          new Date(year, month - 1, 1),
        )
      },
    }
  }, [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
