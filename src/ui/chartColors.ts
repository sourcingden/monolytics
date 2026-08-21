// The validated dark-mode categorical ramp (dataviz skill's reference palette — see
// references/palette.md). Fixed order, never cycled per-render: a category always maps
// to the same slot, and a filtered chart never repaints survivors into new colors.
export const CHART_SERIES = [
  '#3987e5', // blue
  '#d95926', // orange
  '#199e70', // aqua
  '#c98500', // yellow
  '#d55181', // magenta
  '#008300', // green
  '#9085e9', // violet
  '#e66767', // red
] as const

export const CHART_OTHER = '#5a5850' // muted, for the "Other" bucket beyond the 8 slots

export const STATUS_COLORS = {
  good: '#0ca30c',
  notice: '#fab219',
  warning: '#ec835a',
  critical: '#d03b3b',
} as const

/** Every category GROUP id, in a fixed order — assigns a stable chart color to each. */
const GROUP_ORDER = [
  'food',
  'transport',
  'housing',
  'shopping',
  'entertainment',
  'health',
  'transfers',
  'finance',
  'travel',
  'education',
  'donations',
  'kids',
  'pets',
  'cash',
  'savings',
  'income',
  'uncategorized',
] as const

const GROUP_COLOR = new Map<string, string>(
  GROUP_ORDER.map((group, i) => [group, i < CHART_SERIES.length ? CHART_SERIES[i] : CHART_OTHER]),
)

export function colorForGroup(groupId: string): string {
  return GROUP_COLOR.get(groupId) ?? CHART_OTHER
}
