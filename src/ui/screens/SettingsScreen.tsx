import { useState } from 'react'
import { useI18n } from '@/i18n'
import { useStore } from '@/store/useStore'
import type { ScreenProps } from '@/ui/types'
import { Card } from '@/ui/components/Card'

export function SettingsScreen({ goTo }: ScreenProps) {
  const { t, language, categoryLabel } = useI18n()
  const setLanguage = useStore((s) => s.setLanguage)
  const rules = useStore((s) => s.rules)
  const removeRule = useStore((s) => s.removeRule)
  const clearAll = useStore((s) => s.clearAll)
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-extrabold tracking-tight">{t('settings.title')}</h1>

      <Card>
        <div className="text-[13px] font-bold tracking-[0.05em] text-ink-dim uppercase">
          {t('settings.language')}
        </div>
        <div className="mt-3 flex overflow-hidden rounded-sm border border-line w-fit">
          {(['uk', 'en'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-4 py-2 text-[13px] font-semibold uppercase ${
                language === lang ? 'bg-accent text-accent-ink' : 'text-ink-dim hover:bg-surface-2'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="text-[13px] font-bold tracking-[0.05em] text-ink-dim uppercase">
          {t('settings.rulesTitle')}
        </div>
        {rules.length === 0 ? (
          <p className="mt-3 text-[13px] text-ink-dim">{t('settings.noRules')}</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {rules.map((rule) => (
              <li key={rule.id} className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-ink-dim">
                  {rule.match.type === 'id' && `#${rule.match.txId.slice(0, 8)}`}
                  {rule.match.type === 'contains' && `"${rule.match.text}"`}
                  {rule.match.type === 'regex' && `/${rule.match.source}/`}
                  {' → '}
                  <span className="text-ink">{categoryLabel(rule.category)}</span>
                </span>
                <button
                  onClick={() => removeRule(rule.id)}
                  className="text-[12px] font-semibold text-critical hover:underline"
                >
                  {t('settings.deleteRule')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="border-critical/30">
        <div className="text-[13px] font-bold tracking-[0.05em] text-critical uppercase">
          {t('settings.dangerZone')}
        </div>
        <p className="mt-2 text-[13px] text-ink-dim">{t('settings.deleteAllData')}</p>
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="mt-3 rounded-sm border border-critical/50 px-4 py-2 text-[13px] font-semibold text-critical hover:bg-critical/10"
          >
            {t('settings.deleteAllData')}
          </button>
        ) : (
          <div className="mt-3 rounded-sm border border-critical/50 bg-critical/5 p-3">
            <p className="text-[13px] text-ink">{t('settings.deleteAllConfirm')}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={async () => {
                  await clearAll()
                  setConfirming(false)
                  goTo('upload')
                }}
                className="rounded-sm bg-critical px-4 py-2 text-[13px] font-bold text-white hover:opacity-90"
              >
                {t('settings.deleteAllButton')}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="rounded-sm border border-line-strong px-4 py-2 text-[13px] font-semibold text-ink-dim"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
