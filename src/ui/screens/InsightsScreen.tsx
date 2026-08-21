import { useMemo } from 'react'
import { runAllDetectors } from '@/core/insights'
import { useI18n } from '@/i18n'
import type { ScreenProps } from '@/ui/types'
import { InsightCard } from '@/ui/components/InsightCard'

const SEVERITY_RANK: Record<string, number> = { warning: 0, notice: 1, info: 2 }

export function InsightsScreen({ transactions }: ScreenProps) {
  const { t } = useI18n()

  const insights = useMemo(
    () => runAllDetectors({ transactions }).sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]),
    [transactions],
  )

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">{t('insights.title')}</h1>
      <p className="mt-1 text-[14px] text-ink-dim">{t('insights.subtitle')}</p>

      {insights.length === 0 ? (
        <p className="mt-10 text-center text-ink-dim">{t('insights.empty')}</p>
      ) : (
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </div>
  )
}
