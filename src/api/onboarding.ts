import client from './client'

export const onboardingApi = {
  getStatus() {
    return client.get('/auth/onboarding')
  },

  complete() {
    return client.post('/auth/onboarding/complete', {})
  }
}
