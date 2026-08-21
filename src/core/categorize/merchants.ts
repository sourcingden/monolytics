import merchantsData from '@data/merchants.ua.json'

interface RawMerchantEntry {
  pattern?: string
  merchant?: string
  category?: string
}

export interface MerchantRule {
  regex: RegExp
  merchant: string
  category: string
}

const MERCHANT_RULES: MerchantRule[] = (merchantsData as RawMerchantEntry[])
  .filter((e): e is Required<RawMerchantEntry> => Boolean(e.pattern && e.merchant && e.category))
  .map((e) => ({ regex: new RegExp(e.pattern, 'i'), merchant: e.merchant, category: e.category }))

export interface MerchantMatch {
  merchant: string
  category: string
}

/** Matches free-text merchant description against the Ukrainian merchant dictionary. First match wins. */
export function matchMerchant(description: string): MerchantMatch | null {
  for (const rule of MERCHANT_RULES) {
    if (rule.regex.test(description)) {
      return { merchant: rule.merchant, category: rule.category }
    }
  }
  return null
}
