import mccData from '@data/mcc.json'

const MCC_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(mccData as Record<string, string>).filter(([key]) => !key.startsWith('_')),
)

/** Looks up the fallback category for an MCC code. Returns null when unknown or absent. */
export function mccToCategory(mcc: number | null): string | null {
  if (mcc == null) return null
  return MCC_MAP[String(mcc)] ?? null
}
