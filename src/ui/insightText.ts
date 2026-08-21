import type { Insight } from '@/core/insights'
import type { useI18n } from '@/i18n'

type I18n = ReturnType<typeof useI18n>

/** Renders one Insight's headline text through the current language's templates. */
export function describeInsight(insight: Insight, i18n: I18nSubset): string {
  const { t, formatMoney, formatPercent, categoryLabel } = i18n
  const tpl = (key: string, params?: Record<string, string | number>) =>
    t(`insights.templates.${key}`, params)

  switch (insight.type) {
    case 'recurring':
      return tpl('recurring', {
        merchant: insight.merchant,
        monthly: formatMoney(insight.monthlyAmount),
        annual: formatMoney(insight.annualAmount),
      })
    case 'zombieSubscription':
      return tpl('zombieSubscription', {
        merchant: insight.merchant,
        months: insight.monthsActive,
        annual: formatMoney(insight.annualAmount),
      })
    case 'latteFactor':
      return tpl('latteFactor', {
        category: categoryLabel(insight.category),
        count: insight.count,
        avg: formatMoney(insight.avgAmount),
        annual: formatMoney(insight.annualizedAmount),
      })
    case 'deliveryVsGroceries':
      return tpl('deliveryVsGroceries', {
        annual: formatMoney(insight.annualDeliveryCost),
        ratio: insight.ratio === Infinity ? '∞' : insight.ratio.toFixed(1),
      })
    case 'categoryGrowth':
      return tpl('categoryGrowth', {
        category: categoryLabel(insight.category),
        pct: formatPercent(insight.deltaPct),
        prevAmount: formatMoney(insight.prevAmount),
        currAmount: formatMoney(insight.currAmount),
      })
    case 'anomaly':
      return tpl('anomaly', { merchant: insight.merchant, amount: formatMoney(insight.amount) })
    case 'feesAndFx':
      return tpl('feesAndFx', {
        total: formatMoney(insight.commissionTotal),
        annual: formatMoney(insight.annualSavingsPotential ?? insight.commissionTotal),
      })
    case 'cashbackOptimizer':
      return tpl('cashbackOptimizer', {
        actual: formatMoney(insight.actualCashback),
        potential: formatMoney(insight.estimatedPotentialCashback),
        category: categoryLabel(insight.bestCategory),
      })
    case 'weekendEffect':
      return tpl(insight.deltaPct >= 0 ? 'weekendEffectMore' : 'weekendEffectLess', {
        pct: formatPercent(Math.abs(insight.deltaPct)),
      })
    case 'impulseCluster':
      return tpl('impulseCluster', { count: insight.clusterCount, total: formatMoney(insight.totalAmount) })
    case 'spendVsIncomeGrowth':
      return tpl('spendVsIncomeGrowth', {
        spendPct: formatPercent(insight.spendGrowthPct),
        incomePct: formatPercent(insight.incomeGrowthPct),
      })
    case 'merchantInflation':
      return tpl('merchantInflation', { merchant: insight.merchant, pct: formatPercent(insight.deltaPct) })
    case 'burnRateForecast':
      return tpl('burnRateForecast', {
        projected: formatMoney(insight.projectedTotal),
        soFar: formatMoney(insight.spendSoFar),
      })
    case 'zeroSpendDays':
      return tpl('zeroSpendDays', { longest: insight.longestStreak, current: insight.currentStreak })
    case 'uncategorizedNudge':
      return tpl('uncategorizedNudge', { total: formatMoney(insight.totalAmount) })
    case 'topTransactions':
      return tpl('topTransactions')
    case 'microloanUsage':
      return tpl('microloanUsage', { count: insight.drawCount, total: formatMoney(insight.totalDrawn) })
    case 'cashBlackhole':
      return tpl('cashBlackhole', {
        total: formatMoney(insight.totalWithdrawn),
        pct: formatPercent(insight.pctOfSpend),
      })
  }
}

interface I18nSubset {
  t: I18n['t']
  formatMoney: I18n['formatMoney']
  formatPercent: I18n['formatPercent']
  categoryLabel: I18n['categoryLabel']
}
