import { useEffect, useRef, useState, type JSX } from 'react'
import { useStore } from '@/store/useStore'
import { useTransactions } from '@/store/useTransactions'
import { I18nProvider, useI18n } from '@/i18n'
import type { ScreenId, ScreenProps } from '@/ui/types'
import { UploadScreen } from '@/ui/screens/UploadScreen'
import { OverviewScreen } from '@/ui/screens/OverviewScreen'
import { CategoriesScreen } from '@/ui/screens/CategoriesScreen'
import { TransactionsScreen } from '@/ui/screens/TransactionsScreen'
import { InsightsScreen } from '@/ui/screens/InsightsScreen'
import { BudgetScreen } from '@/ui/screens/BudgetScreen'
import { QuickCategorizeScreen } from '@/ui/screens/QuickCategorizeScreen'
import { SettingsScreen } from '@/ui/screens/SettingsScreen'

const SCREENS: { id: ScreenId; Component: (props: ScreenProps) => JSX.Element }[] = [
  { id: 'upload', Component: UploadScreen },
  { id: 'overview', Component: OverviewScreen },
  { id: 'categories', Component: CategoriesScreen },
  { id: 'transactions', Component: TransactionsScreen },
  { id: 'insights', Component: InsightsScreen },
  { id: 'budget', Component: BudgetScreen },
  { id: 'quickCategorize', Component: QuickCategorizeScreen },
  { id: 'settings', Component: SettingsScreen },
]

function Shell() {
  const { t, language } = useI18n()
  const setLanguage = useStore((s) => s.setLanguage)
  const demoMode = useStore((s) => s.demoMode)
  const setDemoMode = useStore((s) => s.setDemoMode)
  const rawCount = useStore((s) => s.rawTransactions.length)
  const transactions = useTransactions()
  const [screen, setScreen] = useState<ScreenId>('upload')
  const autoNavigated = useRef(false)

  // Jump to Overview the first time data shows up (upload or demo), but only once —
  // afterwards the user is free to sit on the Upload tab (e.g. to add another statement).
  useEffect(() => {
    if ((rawCount > 0 || demoMode) && !autoNavigated.current) {
      autoNavigated.current = true
      setScreen('overview')
    }
  }, [rawCount, demoMode])

  const ActiveScreen = SCREENS.find((s) => s.id === screen)?.Component ?? UploadScreen

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-lg font-extrabold tracking-tight">{t('app.name')}</div>
            <div className="text-[13px] text-muted">{t('app.tagline')}</div>
          </div>
          <div className="flex items-center gap-4">
            {demoMode && (
              <button
                onClick={() => setDemoMode(false)}
                className="rounded-sm border border-notice/50 px-3 py-1.5 text-[12px] font-semibold text-notice hover:bg-notice/10"
              >
                {t('common.demoModeOn')} · {t('common.exitDemo')}
              </button>
            )}
            <div className="flex overflow-hidden rounded-sm border border-line">
              {(['uk', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-2.5 py-1 text-[12px] font-semibold uppercase ${
                    language === lang ? 'bg-accent text-accent-ink' : 'text-ink-dim hover:bg-surface-2'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6">
          {SCREENS.map(({ id }) => (
            <button
              key={id}
              onClick={() => setScreen(id)}
              className={`shrink-0 border-b-2 px-3 py-3 text-[13px] font-semibold whitespace-nowrap transition-colors ${
                screen === id
                  ? 'border-accent text-ink'
                  : 'border-transparent text-ink-dim hover:text-ink'
              }`}
            >
              {t(`nav.${id}`)}
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <ActiveScreen transactions={transactions} goTo={setScreen} />
      </main>
    </div>
  )
}

export default function App() {
  const init = useStore((s) => s.init)
  const ready = useStore((s) => s.ready)
  const language = useStore((s) => s.language)

  useEffect(() => {
    init()
  }, [init])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-ink-dim">Loading…</div>
    )
  }

  return (
    <I18nProvider language={language}>
      <Shell />
    </I18nProvider>
  )
}
