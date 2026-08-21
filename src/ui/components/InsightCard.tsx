import type { Insight } from '@/core/insights'
import { useI18n } from '@/i18n'
import { describeInsight } from '@/ui/insightText'
import { Badge } from './Badge'

export function InsightCard({ insight }: { insight: Insight }) {
  const i18n = useI18n()
  const text = describeInsight(insight, i18n)

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[14px] leading-snug text-ink">{text}</p>
        {insight.severity !== 'info' && <Badge severity={insight.severity}>{insight.type}</Badge>}
      </div>
      {insight.annualSavingsPotential != null && insight.annualSavingsPotential > 0 && (
        <div className="mt-2 text-[12px] font-semibold text-good">
          {i18n.t('insights.savingsPotential', { amount: i18n.formatMoney(insight.annualSavingsPotential) })}
        </div>
      )}
    </div>
  )
}
