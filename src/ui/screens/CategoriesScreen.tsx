import { useMemo, useState } from 'react'
import { totalsByGroup, totalsByCategory } from '@/core/analyze'
import { CATEGORIES } from '@/core/categorize'
import { useI18n } from '@/i18n'
import type { ScreenProps } from '@/ui/types'
import { Card } from '@/ui/components/Card'
import { colorForGroup } from '@/ui/chartColors'

export function CategoriesScreen({ transactions }: ScreenProps) {
  const { t, formatMoney, categoryLabel } = useI18n()
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)

  const groupTotals = useMemo(
    () =>
      Array.from(totalsByGroup(transactions).entries())
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1]),
    [transactions],
  )
  const categoryTotals = useMemo(() => totalsByCategory(transactions), [transactions])
  const grandTotal = groupTotals.reduce((s, [, v]) => s + v, 0) || 1

  const childrenOf = (groupId: string) =>
    CATEGORIES.filter((c) => c.groupId === groupId)
      .map((c) => ({ id: c.id, amount: categoryTotals.get(c.id) ?? 0 }))
      .filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount)

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">{t('categories.title')}</h1>
      <p className="mt-1 text-[14px] text-ink-dim">{t('categories.subtitle')}</p>

      {selectedGroup ? (
        <div className="mt-8">
          <button
            onClick={() => setSelectedGroup(null)}
            className="mb-4 text-[13px] font-semibold text-accent hover:underline"
          >
            ← {t('categories.drillBack')}
          </button>
          <Card>
            <div className="mb-4 text-[15px] font-bold">{categoryLabel(selectedGroup)}</div>
            <div className="space-y-3">
              {childrenOf(selectedGroup).map((c) => (
                <BarRow
                  key={c.id}
                  label={categoryLabel(c.id)}
                  amount={c.amount}
                  max={childrenOf(selectedGroup)[0]?.amount ?? 1}
                  color={colorForGroup(selectedGroup)}
                  formatMoney={formatMoney}
                />
              ))}
            </div>
          </Card>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {groupTotals.map(([group, amount]) => (
            <button
              key={group}
              onClick={() => setSelectedGroup(group)}
              className="rounded-lg border border-line bg-surface p-4 text-left transition-colors hover:border-line-strong"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: colorForGroup(group) }}
                  />
                  {categoryLabel(group)}
                </span>
                <span className="font-mono text-[14px] text-ink">{formatMoney(amount)}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-sm bg-surface-2">
                <div
                  className="h-full"
                  style={{ width: `${(amount / grandTotal) * 100}%`, background: colorForGroup(group) }}
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function BarRow({
  label,
  amount,
  max,
  color,
  formatMoney,
}: {
  label: string
  amount: number
  max: number
  color: string
  formatMoney: (n: number) => string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-36 shrink-0 truncate text-[13px] text-ink-dim">{label}</div>
      <div className="h-2 flex-1 overflow-hidden rounded-sm bg-surface-2">
        <div className="h-full" style={{ width: `${(amount / max) * 100}%`, background: color }} />
      </div>
      <div className="w-24 shrink-0 text-right font-mono text-[13px] text-ink">{formatMoney(amount)}</div>
    </div>
  )
}
