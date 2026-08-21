import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import {
  realSpendTotal,
  naiveMonobankSpendTotal,
  incomeTotal,
  totalByKind,
  totalsByGroup,
  monthlySpendSeries,
} from '@/core/analyze'
import { computeCheckup } from '@/core/budget'
import { runAllDetectors } from '@/core/insights'
import { useI18n } from '@/i18n'
import type { ScreenProps } from '@/ui/types'
import { Card } from '@/ui/components/Card'
import { StatTile } from '@/ui/components/StatTile'
import { SectionLabel } from '@/ui/components/SectionLabel'
import { InsightCard } from '@/ui/components/InsightCard'
import { colorForGroup, CHART_OTHER } from '@/ui/chartColors'

const SEVERITY_RANK: Record<string, number> = { warning: 0, notice: 1, info: 2 }

export function OverviewScreen({ transactions, goTo }: ScreenProps) {
  const { t, formatMoney, formatMonth, categoryLabel } = useI18n()

  const stats = useMemo(() => {
    const real = realSpendTotal(transactions)
    const naive = naiveMonobankSpendTotal(transactions)
    const income = incomeTotal(transactions)
    const p2p = totalByKind(transactions, 'transfer_p2p')
    return { real, naive, income, net: income - real, p2p }
  }, [transactions])

  const checkup = useMemo(() => computeCheckup(transactions), [transactions])
  const trend = useMemo(() => monthlySpendSeries(transactions), [transactions])
  const topGroups = useMemo(() => {
    const totals = Array.from(totalsByGroup(transactions).entries())
      .filter(([group]) => group !== 'income' && group !== 'uncategorized')
      .sort((a, b) => b[1] - a[1])
    const top = totals.slice(0, 7)
    const rest = totals.slice(7).reduce((s, [, v]) => s + v, 0)
    return rest > 0 ? [...top, ['other', rest] as [string, number]] : top
  }, [transactions])
  const maxGroupTotal = topGroups[0]?.[1] ?? 1

  const topInsights = useMemo(() => {
    return runAllDetectors({ transactions })
      .sort((a, b) => (SEVERITY_RANK[a.severity] ?? 3) - (SEVERITY_RANK[b.severity] ?? 3))
      .slice(0, 3)
  }, [transactions])

  if (transactions.length === 0) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <h2 className="text-xl font-bold">{t('overview.noDataTitle')}</h2>
        <p className="mt-2 text-[14px] text-ink-dim">{t('overview.noDataBody')}</p>
        <button
          onClick={() => goTo('upload')}
          className="mt-6 rounded-sm bg-accent px-5 py-2.5 text-[13px] font-bold text-accent-ink hover:opacity-90"
        >
          {t('nav.upload')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <div>
        <SectionLabel index="01" title={t('overview.realSpendLabel')} />
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <StatTile
            label={t('overview.realSpendLabel')}
            value={formatMoney(stats.real)}
            hint={t('overview.naiveCompare', { amount: formatMoney(stats.naive) })}
            accent
          />
          <StatTile label={t('overview.incomeLabel')} value={formatMoney(stats.income)} />
          <StatTile
            label={t('overview.netLabel')}
            value={formatMoney(stats.net)}
            hint={stats.p2p > 0 ? t('overview.p2pLine', { amount: formatMoney(stats.p2p) }) : undefined}
          />
          <StatTile
            label={t('overview.checkupTitle')}
            value={
              <>
                {checkup.score}
                <span className="text-lg text-muted"> / 100</span>
              </>
            }
          />
        </div>
      </div>

      <div>
        <SectionLabel index="02" title={t('overview.trendTitle')} />
        <Card>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend.map((p) => ({ ...p, label: formatMonth(p.month) }))}>
                <CartesianGrid stroke="#2c2c2f" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#8a8983"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#2c2c2f' }}
                />
                <YAxis
                  stroke="#8a8983"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => formatMoney(v)}
                  width={80}
                />
                <Tooltip
                  contentStyle={{ background: '#17171a', border: '1px solid #2c2c2f', borderRadius: 6 }}
                  labelStyle={{ color: '#c3c2b7' }}
                  formatter={(v: unknown) => formatMoney(Number(v))}
                />
                <Line type="monotone" dataKey="total" stroke="#c9a24c" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div>
        <SectionLabel index="03" title={t('overview.topCategoriesTitle')} />
        <Card>
          <div className="space-y-3">
            {topGroups.map(([group, amount]) => (
              <div key={group} className="flex items-center gap-3">
                <div className="w-32 shrink-0 truncate text-[13px] text-ink-dim">
                  {group === 'other' ? '—' : categoryLabel(group)}
                </div>
                <div className="h-2 flex-1 overflow-hidden rounded-sm bg-surface-2">
                  <div
                    className="h-full"
                    style={{
                      width: `${(amount / maxGroupTotal) * 100}%`,
                      background: group === 'other' ? CHART_OTHER : colorForGroup(group),
                    }}
                  />
                </div>
                <div className="w-24 shrink-0 text-right font-mono text-[13px] text-ink">
                  {formatMoney(amount)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div>
        <SectionLabel index="04" title={t('overview.topInsightsTitle')} />
        <div className="grid gap-3 md:grid-cols-3">
          {topInsights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </div>
    </div>
  )
}
