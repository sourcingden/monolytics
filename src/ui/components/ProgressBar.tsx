export function ProgressBar({
  segments,
}: {
  segments: { fraction: number; color: string; label?: string }[]
}) {
  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-sm bg-surface-2">
      {segments.map((s, i) => (
        <div
          key={i}
          style={{ width: `${Math.max(0, Math.min(1, s.fraction)) * 100}%`, background: s.color }}
          title={s.label}
        />
      ))}
    </div>
  )
}
