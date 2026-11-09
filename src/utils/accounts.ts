// The backend sends the account type as its enum name ("CreditCard"); older values are lowercase ("credit")
export function isCreditAccount(type: string | null | undefined): boolean {
  const normalized = (type ?? '').toLowerCase()
  return normalized === 'credit' || normalized === 'creditcard'
}

// Enum name used by the translations (enums.accountTypes.<name>), for both the enum name and the older lowercase values
const ACCOUNT_TYPE_KEYS: Record<string, string> = {
  checking: 'Checking',
  savings: 'Savings',
  credit: 'CreditCard',
  creditcard: 'CreditCard',
  lineofcredit: 'LineOfCredit',
  mortgage: 'Mortgage',
  investment: 'Investment'
}

export function accountTypeKey(type: string | null | undefined): string | null {
  return ACCOUNT_TYPE_KEYS[(type ?? '').toLowerCase()] ?? null
}

// The surplus (balance minus envelopes) means something for a chequing or investment account only
export function showsSurplus(type: string | null | undefined): boolean {
  if (isCreditAccount(type)) return false
  return !['Savings', 'LineOfCredit'].includes(accountTypeKey(type) ?? '')
}
