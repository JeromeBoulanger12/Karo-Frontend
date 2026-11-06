// The backend sends the account type as its enum name ("CreditCard"); older values are lowercase ("credit")
export function isCreditAccount(type: string | null | undefined): boolean {
  const normalized = (type ?? '').toLowerCase()
  return normalized === 'credit' || normalized === 'creditcard'
}
