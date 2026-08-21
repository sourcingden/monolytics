export function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <span className="text-[11px] font-semibold tracking-[0.15em] text-accent">{index}</span>
      <div className="h-px flex-1 bg-line" />
      <span className="text-[13px] font-semibold tracking-[0.05em] text-ink-dim">{title}</span>
    </div>
  )
}
