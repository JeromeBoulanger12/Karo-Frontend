import client from './client'

// Map frontend account type values to backend AccountType enum values
function mapAccountType(type: string): string {
  const typeMap: Record<string, string> = {
    'checking': 'Checking',
    'savings': 'Savings',
    'credit': 'CreditCard',
    'creditcard': 'CreditCard',
    'lineofcredit': 'LineOfCredit',
    'mortgage': 'Mortgage',
    'investment': 'Investment'
  }
  return typeMap[type.toLowerCase()] || 'Checking'
}

// Debt terms as the form edits them (numbers as typed, enums as backend names)
export interface DebtTermsForm {
  interestRate?: number
  rateType: 'Fixed' | 'Variable'
  compoundingFrequency: 'Daily' | 'Monthly' | 'Annually'
  minimumPayment?: number
  paymentFrequency: string
  creditLimit?: number
}

// Backend DebtProfileInput. Only the optional fields left empty are omitted.
export function toDebtProfileInput(terms: DebtTermsForm) {
  return {
    interestRate: Number(terms.interestRate ?? 0),
    rateType: terms.rateType,
    compoundingFrequency: terms.compoundingFrequency,
    minimumPayment: Number(terms.minimumPayment ?? 0),
    paymentFrequency: terms.paymentFrequency,
    creditLimit: terms.creditLimit === undefined || terms.creditLimit === null ? null : Number(terms.creditLimit)
  }
}

// Backend DebtProfileDto back to the form's shape (used when editing an existing account)
export function fromDebtProfileDto(profile: any): DebtTermsForm {
  return {
    interestRate: profile.interestRate,
    rateType: profile.rateType,
    compoundingFrequency: profile.compoundingFrequency,
    minimumPayment: profile.minimumPayment?.amount,
    paymentFrequency: profile.paymentFrequency,
    creditLimit: profile.creditLimit?.amount ?? undefined
  }
}

export const accountsApi = {
  listAccounts() {
    return client.get('/accounts')
  },

  getAccount(id: string) {
    return client.get(`/accounts/${id}`)
  },

  createAccount(data: Record<string, unknown>) {
    // Map frontend data structure to backend CreateAccountRequest expectations
    // Backend expects: { Name, Type, DebtProfile? }
    const type = data.type ? mapAccountType(data.type as string) : 'Checking'
    const payload = {
      name: data.name,
      type,
      debtProfile: type === 'CreditCard' && data.debt ? toDebtProfileInput(data.debt as DebtTermsForm) : null
    }

    return client.post('/accounts', payload)
  },

  updateAccount(id: string, data: Record<string, unknown>) {
    return client.put(`/accounts/${id}`, data)
  },

  deleteAccount(id: string) {
    return client.delete(`/accounts/${id}`)
  },

  getAccountBalanceHistory(id: string, days: number = 7) {
    return client.get(`/accounts/${id}/balance-history`, {
      params: { days }
    })
  },

  getAccountSurplusHistory(id: string, days: number = 90) {
    return client.get(`/accounts/${id}/surplus-history`, {
      params: { days }
    })
  }
}
