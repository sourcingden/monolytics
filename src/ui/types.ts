import type { Transaction } from '@/core/types'

export type ScreenId =
  | 'upload'
  | 'overview'
  | 'categories'
  | 'transactions'
  | 'insights'
  | 'budget'
  | 'quickCategorize'
  | 'settings'

export interface ScreenProps {
  transactions: Transaction[]
  goTo: (screen: ScreenId) => void
}
