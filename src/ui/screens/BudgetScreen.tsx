import { useMemo, useState } from 'react'
import {
  computeFiftyThirtyTwenty,
  averageSavingsRate,
  computeEmergencyFund,
  simulateCategoryCut,
  simulateSavingsGrowth,
  computeCheckup,
} from '@/core/budget'
import { totalsByCategory } from '@/core/analyze'
import { CATEGORIES } from '@/core/categorize'
import { useI18n } from '@/i18n'
import type { ScreenProps } from '@/ui/types'
import { Card } from '@/ui/components/Card'
import { SectionLabel } from '@/ui/components/SectionLabel'
import { StatTile } from '@/ui/components/StatTile'
import { ProgressBar } from '@/ui/components/ProgressBar'

export function BudgetScreen({ transactions }: ScreenProps) {
  const { t, formatMoney, formatPercent, categoryLabel } = useI18n()

  const split = useMemo(() => computeFiftyThirtyTwenty(transactions), [transactions])
  const avgSavingsRate = useMemo(() => averageSavingsRate(transactions), [transactions])
  const fund = useMemo(() => computeEmergencyFund(transactions), [transactions])
  const checkup = useMemo(() => computeCheckup(transactions), [transactions])
  const spendCategories = useMemo(() => {
    const totals = totalsByCategory(transactions)
    return CATEGORIES.filter((c) => (totals.get(c.id) ?? 0) > 0).sort(
      (a, b) => (totals.get(b.id) ?? 0) - (totals.get(a.id) ?? 0),
    )
  }, [transactions])

  const [cutCategory, setCutCategory] = useState('')
  const [cutPct, setCutPct] = useState(20)
  const [rate, setRate] = useState(8)

  const activeCategory = cutCategory || spendCategories[0]?.id || ''
  const cutResult = useMemo(
    () => (activeCategory ? simulateCategoryCut(transactions, activeCategory, cutPct / 100) : null),
    [transactions, activeCategory, cutPct],
  )
  const growth = useMemo(
    () => simulateSavingsGrowth((cutResult?.annualSavings ?? 0) / 12, rate / 100),
    [cutResult, rate],
  )

  return (
    <div className="space-y-10">
      <div>
        <SectionLabel index="01" title={t('budget.splitTitle')} />
        <Card>
          <ProgressBar
            segments={[
              { fraction: split.needsPct ?? 0, color: '#3987e5', label: t('budget.needs') },
              { fraction: split.wantsPct ?? 0, color: '#d95926', label: t('budget.wants') },
              { fraction: Math.max(split.savingsPct ?? 0, 0), color: '#0ca30c', label: t('budget.savings') },
            ]}
          />
          <div className="mt-4 grid grid-cols-3 gap-4 text-[13px]">
            <SplitStat
              label={t('budget.needs')}
              pct={split.needsPct}
              target={0.5}
              amount={split.needs}
              formatMoney={formatMoney}
              formatPercent={formatPercent}
              t={t}
            />
            <SplitStat
              label={t('budget.wants')}
              pct={split.wantsPct}
              target={0.3}
              amount={split.wants}
              formatMoney={formatMoney}
              formatPercent={formatPercent}
              t={t}
            />
            <SplitStat
              label={t('budget.savings')}
              pct={split.savingsPct}
              target={0.2}
              amount={split.income - split.needs - split.wants - split.uncategorized}
              formatMoney={formatMoney}
              formatPercent={formatPercent}
              t={t}
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <SectionLabel index="02" title={t('budget.savingsRateTitle')} />
          <Card>
            <StatTile
              label={t('budget.savingsRateTitle')}
              value={avgSavingsRate != null ? formatPercent(avgSavingsRate) : '—'}
            />
          </Card>
        </div>
        <div>
          <SectionLabel index="03" title={t('budget.checkupTitle')} />
          <Card>
            <StatTile label={t('budget.checkupTitle')} value={`${checkup.score} / 100`} />
          </Card>
        </div>
      </div>

      <div>
        <SectionLabel index="04" title={t('budget.emergencyFundTitle')} />
        <Card>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <div className="text-[11px] tracking-[0.1em] text-muted uppercase">
                {t('budget.emergencyFund3')}
              </div>
              <div className="font-mono font-tabular mt-1 text-2xl">{formatMoney(fund.target3Months)}</div>
              {fund.monthsToTarget3 != null && (
                <div className="mt-1 text-[12px] text-ink-dim">
                  {t('budget.monthsToGoal', { months: Math.ceil(fund.monthsToTarget3) })}
                </div>
              )}
            </div>
            <div>
              <div className="text-[11px] tracking-[0.1em] text-muted uppercase">
                {t('budget.emergencyFund6')}
              </div>
              <div className="font-mono font-tabular mt-1 text-2xl">{formatMoney(fund.target6Months)}</div>
              {fund.monthsToTarget6 != null && (
                <div className="mt-1 text-[12px] text-ink-dim">
                  {t('budget.monthsToGoal', { months: Math.ceil(fund.monthsToTarget6) })}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div>
        <SectionLabel index="05" title={t('budget.simulatorTitle')} />
        <Card>
          <div className="flex flex-wrap items-end gap-4">
            <label className="text-[13px]">
              <div className="mb-1 text-muted">{t('budget.simulatorCategory')}</div>
              <select
                value={activeCategory}
                onChange={(e) => setCutCategory(e.target.value)}
                className="rounded-sm border border-line-strong bg-surface px-3 py-2 text-ink"
              >
                {spendCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {categoryLabel(c.id)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[13px]">
              <div className="mb-1 text-muted">
                {t('budget.simulatorCutPct')}: {cutPct}%
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={cutPct}
                onChange={(e) => setCutPct(Number(e.target.value))}
                className="w-40 accent-accent"
              />
            </label>
            <label className="text-[13px]">
              <div className="mb-1 text-muted">{t('budget.simulatorGrowthTitle', { rate })}</div>
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-40 accent-accent"
              />
            </label>
          </div>

          {cutResult && (
            <div className="mt-6 text-[14px] font-semibold text-good">
              {t('budget.simulatorAnnualSavings', { amount: formatMoney(cutResult.annualSavings) })}
            </div>
          )}

          <div className="mt-4 grid grid-cols-3 gap-4">
            {growth.map((g) => (
              <div key={g.years} className="rounded-sm border border-line-strong p-3">
                <div className="text-[11px] text-muted">{g.years} р.</div>
                <div className="font-mono font-tabular text-lg">{formatMoney(g.futureValue)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function SplitStat({
  label,
  pct,
  target,
  amount,
  formatMoney,
  formatPercent,
  t,
}: {
  label: string
  pct: number | null
  target: number
  amount: number
  formatMoney: (n: number) => string
  formatPercent: (n: number) => string
  t: (key: string, params?: Record<string, string | number>) => string
}) {
  return (
    <div>
      <div className="text-muted">{label}</div>
      <div className="font-mono font-tabular text-lg text-ink">{pct != null ? formatPercent(pct) : '—'}</div>
      <div className="text-ink-dim">{formatMoney(amount)}</div>
      <div className="text-[11px] text-muted">{t('budget.target', { pct: formatPercent(target) })}</div>
    </div>
  )
}
