import client from './client'

export const envelopesApi = {
  listEnvelopes() {
    return client.get('/envelopes')
  },

  getEnvelope(id: string) {
    return client.get(`/envelopes/${id}`)
  },

  createEnvelope(data: Record<string, unknown>) {
    return client.post('/envelopes', data)
  },

  updateEnvelope(id: string, data: Record<string, unknown>) {
    return client.put(`/envelopes/${id}`, data)
  },

  allocate(id: string, data: Record<string, unknown>) {
    return client.post(`/envelopes/${id}/allocate`, data)
  },

  withdraw(id: string, data: { amount: number; payee?: string; memo?: string; isUnexpected?: boolean }) {
    return client.post(`/envelopes/${id}/withdraw`, data)
  },

  pay(id: string, amount?: number) {
    return client.post(`/envelopes/${id}/pay`, amount === undefined ? {} : { amount })
  },

  transfer(id: string, data: Record<string, unknown>) {
    return client.post(`/envelopes/${id}/transfer`, data)
  },

  listTransactions(id: string) {
    return client.get(`/envelopes/${id}/transactions`)
  },

  deleteEnvelope(id: string) {
    return client.delete(`/envelopes/${id}`)
  },

  setShareable(id: string, isShareable: boolean) {
    return client.put(`/envelopes/${id}/shareable`, { isShareable })
  }
}
