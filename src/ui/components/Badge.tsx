const SEVERITY_CLASS: Record<string, string> = {
  info: 'text-ink-dim border-line-strong',
  notice: 'text-notice border-notice/50',
  warning: 'text-warning border-warning/50',
}

export function Badge({ children, severity = 'info' }: { children: string; severity?: string }) {
  return (
    <span
      className={`inline-block rounded-sm border px-2.5 py-0.5 text-[10px] font-bold tracking-[0.1em] uppercase ${SEVERITY_CLASS[severity] ?? SEVERITY_CLASS.info}`}
    >
      {children}
    </span>
  )
}
