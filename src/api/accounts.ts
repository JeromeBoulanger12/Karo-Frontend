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

export const accountsApi = {
  listAccounts() {
    return client.get('/accounts')
  },

  getAccount(id: string) {
    return client.get(`/accounts/${id}`)
  },

  createAccount(data: Record<string, unknown>) {
    // Map frontend data structure to backend CreateAccountRequest expectations
    // Backend expects: { Name, Type }
    const payload = {
      name: data.name,
      type: data.type ? mapAccountType(data.type as string) : 'Checking'
    }

    console.log('Creating account with payload:', JSON.stringify(payload))
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
