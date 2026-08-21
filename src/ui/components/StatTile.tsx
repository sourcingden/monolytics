import type { ReactNode } from 'react'

export function StatTile({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  accent?: boolean
}) {
  return (
    <div
      className={`border-t-2 pt-4 ${accent ? 'border-accent' : 'border-line-strong'}`}
    >
      <div className="text-[11px] font-semibold tracking-[0.1em] text-muted uppercase">{label}</div>
      <div className="font-mono font-tabular mt-2 text-4xl leading-none text-ink">{value}</div>
      {hint && <div className="mt-1.5 text-[13px] text-ink-dim">{hint}</div>}
    </div>
  )
}
