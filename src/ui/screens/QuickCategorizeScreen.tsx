import { useMemo, useState } from 'react'
import { CATEGORIES, CATEGORY_GROUPS } from '@/core/categorize'
import { useI18n } from '@/i18n'
import { useStore } from '@/store/useStore'
import type { ScreenProps } from '@/ui/types'
import { Card } from '@/ui/components/Card'

const LIMIT = 20

export function QuickCategorizeScreen({ transactions }: ScreenProps) {
  const { t, formatMoney, categoryLabel } = useI18n()
  const reassignTransaction = useStore((s) => s.reassignTransaction)
  const demoMode = useStore((s) => s.demoMode)
  const [resolved, setResolved] = useState<Set<string>>(new Set())

  const topMerchants = useMemo(() => {
    const byMerchant = new Map<string, { amount: number; example: (typeof transactions)[number] }>()
    for (const tx of transactions) {
      if (tx.category !== 'uncategorized' || tx.kind !== 'spend') continue
      const entry = byMerchant.get(tx.merchant)
      if (entry) entry.amount += Math.abs(tx.amount)
      else byMerchant.set(tx.merchant, { amount: Math.abs(tx.amount), example: tx })
    }
    return Array.from(byMerchant.entries())
      .map(([merchant, v]) => ({ merchant, ...v }))
      .filter((m) => !resolved.has(m.merchant))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, LIMIT)
  }, [transactions, resolved])

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">{t('quickCategorize.title')}</h1>
      <p className="mt-1 text-[14px] text-ink-dim">{t('quickCategorize.subtitle')}</p>

      {demoMode && <p className="mt-4 text-[13px] text-notice">{t('common.demoModeOn')}</p>}

      {topMerchants.length === 0 ? (
        <p className="mt-10 text-center text-ink-dim">{t('quickCategorize.empty')}</p>
      ) : (
        <div className="mt-6 space-y-3">
          {topMerchants.map((m) => (
            <Card key={m.merchant} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[14px] font-semibold text-ink">{m.merchant}</div>
                <div className="font-mono text-[13px] text-ink-dim">{formatMoney(m.amount)}</div>
              </div>
              <select
                disabled={demoMode}
                defaultValue=""
                onChange={(e) => {
                  if (!e.target.value) return
                  reassignTransaction(m.example, e.target.value, { scope: 'merchant' })
                  setResolved((prev) => new Set(prev).add(m.merchant))
                }}
                className="rounded-sm border border-line-strong bg-surface px-3 py-2 text-[13px] text-ink disabled:opacity-40"
              >
                <option value="" disabled>
                  {t('quickCategorize.pickCategory')}
                </option>
                {CATEGORY_GROUPS.map((g) => (
                  <optgroup key={g.id} label={categoryLabel(g.id)}>
                    {CATEGORIES.filter((c) => c.groupId === g.id).map((c) => (
                      <option key={c.id} value={c.id}>
                        {categoryLabel(c.id)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
