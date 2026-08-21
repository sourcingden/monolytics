import { useCallback, useRef, useState } from 'react'
import { useI18n } from '@/i18n'
import { useStore } from '@/store/useStore'
import type { ImportOutcome } from '@/store/useStore'
import type { ScreenProps } from '@/ui/types'
import { Card } from '@/ui/components/Card'

export function UploadScreen({ goTo }: ScreenProps) {
  const { t } = useI18n()
  const importFiles = useStore((s) => s.importFiles)
  const removeAccount = useStore((s) => s.removeAccount)
  const accounts = useStore((s) => s.accounts)
  const setDemoMode = useStore((s) => s.setDemoMode)
  const [dragging, setDragging] = useState(false)
  const [outcomes, setOutcomes] = useState<ImportOutcome[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return
      const files = await Promise.all(
        Array.from(fileList).map(async (f) => ({ fileName: f.name, text: await f.text() })),
      )
      const results = await importFiles(files)
      setOutcomes(results)
      if (results.some((r) => r.ok)) goTo('overview')
    },
    [importFiles, goTo],
  )

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-extrabold tracking-tight">{t('upload.title')}</h1>
      <p className="mt-2 text-[15px] text-ink-dim">{t('upload.subtitle')}</p>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          void handleFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
        className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-8 py-16 text-center transition-colors ${
          dragging ? 'border-accent bg-accent/5' : 'border-line-strong hover:border-line-strong/80'
        }`}
      >
        <div className="text-[15px] font-semibold text-ink">
          {dragging ? t('upload.dropHint') : t('upload.subtitle')}
        </div>
        <button
          type="button"
          className="mt-4 rounded-sm bg-accent px-5 py-2.5 text-[13px] font-bold text-accent-ink hover:opacity-90"
        >
          {t('upload.browse')}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          multiple
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>

      {outcomes.map((o, i) => (
        <div
          key={i}
          className={`mt-3 rounded-sm border px-4 py-3 text-[13px] ${
            o.ok ? 'border-good/40 text-good' : 'border-critical/40 text-critical'
          }`}
        >
          {o.ok ? (
            <>
              <strong>{o.fileName}</strong> — {t('upload.importedTitle')}.{' '}
              {t('upload.importedBody', { added: o.addedCount, duplicates: o.duplicateCount })}
            </>
          ) : (
            <>
              <strong>{o.fileName}</strong> — {t('upload.missingColumnsTitle')}.{' '}
              {t('upload.missingColumnsBody', { columns: o.error })}
            </>
          )}
        </div>
      ))}

      <Card className="mt-6">
        <div className="text-[13px] font-bold tracking-[0.05em] text-accent uppercase">
          {t('upload.privacyTitle')}
        </div>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">{t('upload.privacyBody')}</p>
      </Card>

      <div className="mt-6 flex justify-center">
        <button
          onClick={() => {
            setDemoMode(true)
            goTo('overview')
          }}
          className="rounded-sm border border-line-strong px-4 py-2 text-[13px] font-semibold text-ink-dim hover:border-accent hover:text-accent"
        >
          {t('upload.tryDemo')}
        </button>
      </div>

      {accounts.length > 0 && (
        <div className="mt-10">
          <div className="text-[13px] font-bold tracking-[0.05em] text-ink-dim uppercase">
            {t('upload.accountsTitle')}
          </div>
          <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
            {accounts.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-4 py-3 text-[14px]">
                <span>{a.label}</span>
                <button
                  onClick={() => removeAccount(a.id)}
                  className="text-[12px] font-semibold text-critical hover:underline"
                >
                  {t('upload.removeAccount')}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
