import { useMemo, useState } from 'react'
import { CATEGORIES, CATEGORY_GROUPS } from '@/core/categorize'
import type { Transaction, TransactionKind } from '@/core/types'
import { useI18n } from '@/i18n'
import { useStore } from '@/store/useStore'
import type { ScreenProps } from '@/ui/types'

const POSITIVE_KINDS = new Set<TransactionKind>(['income', 'refund', 'cashback'])

/** Green means "real money in" — not just "positive number". A debt draw or a savings
 * jar top-up is a positive amount too, but neither is good news the way income is. */
function amountColorClass(tx: Transaction): string {
  return POSITIVE_KINDS.has(tx.kind) ? 'text-good' : 'text-ink'
}

const KINDS: TransactionKind[] = [
  'spend',
  'income',
  'transfer_p2p',
  'transfer_internal',
  'debt',
  'savings_contribution',
  'cash_withdrawal',
  'refund',
]

export function TransactionsScreen({ transactions }: ScreenProps) {
  const { t, formatMoney, formatDate, categoryLabel, kindLabel } = useI18n()
  const reassignTransaction = useStore((s) => s.reassignTransaction)
  const demoMode = useStore((s) => s.demoMode)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [kindFilter, setKindFilter] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return transactions
      .filter((tx) => (q ? tx.description.toLowerCase().includes(q) || tx.merchant.toLowerCase().includes(q) : true))
      .filter((tx) => (categoryFilter ? tx.category === categoryFilter : true))
      .filter((tx) => (kindFilter ? tx.kind === kindFilter : true))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [transactions, search, categoryFilter, kindFilter])

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">{t('transactions.title')}</h1>

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('transactions.search')}
          className="min-w-48 flex-1 rounded-sm border border-line-strong bg-surface px-3 py-2 text-[13px] text-ink placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-sm border border-line-strong bg-surface px-3 py-2 text-[13px] text-ink"
        >
          <option value="">{t('transactions.filterCategory')}</option>
          {CATEGORY_GROUPS.map((g) => (
            <optgroup key={g.id} label={categoryLabel(g.id)}>
              {CATEGORIES.filter((c) => c.groupId === g.id).map((c) => (
                <option key={c.id} value={c.id}>
                  {categoryLabel(c.id)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value)}
          className="rounded-sm border border-line-strong bg-surface px-3 py-2 text-[13px] text-ink"
        >
          <option value="">{t('transactions.filterKind')}</option>
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {kindLabel(k)}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-line">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line bg-surface text-left text-[11px] tracking-[0.05em] text-muted uppercase">
              <th className="px-4 py-3 font-semibold">{t('transactions.columnDate')}</th>
              <th className="px-4 py-3 font-semibold">{t('transactions.columnMerchant')}</th>
              <th className="px-4 py-3 font-semibold">{t('transactions.columnCategory')}</th>
              <th className="px-4 py-3 text-right font-semibold">{t('transactions.columnAmount')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-ink-dim">
                  {t('transactions.empty')}
                </td>
              </tr>
            )}
            {filtered.map((tx) => (
              <Row
                key={tx.id}
                tx={tx}
                formatMoney={formatMoney}
                formatDate={formatDate}
                categoryLabel={categoryLabel}
                disabled={demoMode}
                onReassign={(category, scope) => reassignTransaction(tx, category, { scope })}
                applyToAllLabel={t('transactions.applyToAllSimilar', { merchant: tx.merchant })}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Row({
  tx,
  formatMoney,
  formatDate,
  categoryLabel,
  disabled,
  onReassign,
  applyToAllLabel,
}: {
  tx: Transaction
  formatMoney: (n: number) => string
  formatDate: (d: Date) => string
  categoryLabel: (id: string) => string
  disabled: boolean
  onReassign: (category: string, scope: 'single' | 'merchant') => void
  applyToAllLabel: string
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(tx.category)

  return (
    <tr className="border-b border-line last:border-0 hover:bg-surface-2">
      <td className="px-4 py-2.5 text-ink-dim">{formatDate(tx.date)}</td>
      <td className="px-4 py-2.5 text-ink">{tx.merchant}</td>
      <td className="px-4 py-2.5">
        <button
          disabled={disabled}
          onClick={() => {
            setPending(tx.category)
            setOpen((o) => !o)
          }}
          className="rounded-sm border border-line-strong px-2 py-1 text-[12px] text-ink-dim hover:border-accent hover:text-accent disabled:opacity-40"
        >
          {categoryLabel(tx.category)}
        </button>
        {open && (
          <div className="mt-1 flex flex-col gap-1.5 rounded-sm border border-line-strong bg-surface-2 p-2">
            <CategoryPicker value={pending} onPick={setPending} />
            <button
              className="rounded-sm border border-line-strong px-2 py-1 text-left text-[11px] text-ink-dim hover:border-accent hover:text-accent"
              onClick={() => {
                onReassign(pending, 'single')
                setOpen(false)
              }}
            >
              {t('transactions.applyToThis')}
            </button>
            <button
              className="rounded-sm border border-accent/40 px-2 py-1 text-left text-[11px] text-accent hover:bg-accent/10"
              onClick={() => {
                onReassign(pending, 'merchant')
                setOpen(false)
              }}
            >
              {applyToAllLabel}
            </button>
          </div>
        )}
      </td>
      <td className={`px-4 py-2.5 text-right font-mono font-tabular ${amountColorClass(tx)}`}>
        {formatMoney(tx.amount)}
      </td>
    </tr>
  )
}

function CategoryPicker({ value, onPick }: { value: string; onPick: (category: string) => void }) {
  const { categoryLabel } = useI18n()
  return (
    <select
      value={value}
      onChange={(e) => onPick(e.target.value)}
      className="rounded-sm border border-line-strong bg-surface px-2 py-1 text-[12px] text-ink"
    >
      {CATEGORY_GROUPS.map((g) => (
        <optgroup key={g.id} label={categoryLabel(g.id)}>
          {CATEGORIES.filter((c) => c.groupId === g.id).map((c) => (
            <option key={c.id} value={c.id}>
              {categoryLabel(c.id)}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}
