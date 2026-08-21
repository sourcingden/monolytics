// Re-exported for detector convenience; the actual implementations live in analyze/periods
// since they're generic date-span helpers, not insight-specific — src/core/budget uses them too.
export { periodDays, periodMonths, annualize } from '../analyze/periods'

export function insightId(detector: string, discriminator: string): string {
  return `${detector}:${discriminator}`
}
