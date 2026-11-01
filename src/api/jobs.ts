import client from './client'

// Map frontend frequency values to backend RecurrenceFrequency enum
function mapFrequency(frequency: string): string {
  const frequencyMap: Record<string, string> = {
    'weekly': 'Weekly',
    'biweekly': 'BiWeekly',
    'semimonthly': 'SemiMonthly',
    'monthly': 'Monthly',
    'annual': 'Annually',
    'annually': 'Annually',
    'onetime': 'OneTime',
    'irregular': 'Irregular'
  }
  return frequencyMap[frequency.toLowerCase()] || 'BiWeekly'
}

export const jobsApi = {
  listPlans() {
    return client.get('/jobs/plans')
  },

  // Alias for dashboard/UI consistency
  listJobs() {
    return this.listPlans()
  },

  getPlan(id: string) {
    return client.get(`/jobs/plans/${id}`)
  },

  createPlan(data: Record<string, unknown>) {
    // Map frontend data structure to backend CreatePlanRequest expectations
    // Backend expects: { homeAccountId, name, shortfallPolicy, recurrenceFrequency }

    // Validate required fields
    if (!data.homeAccountId) {
      console.error('ERROR: homeAccountId is required but missing', data)
      throw new Error('homeAccountId is required')
    }
    if (!data.name) {
      console.error('ERROR: name is required but missing', data)
      throw new Error('name is required')
    }

    const payload = {
      homeAccountId: data.homeAccountId,
      name: data.name,
      shortfallPolicy: 'ProportionalReduction',
      recurrenceFrequency: data.frequency ? mapFrequency(data.frequency as string) : 'BiWeekly',
      anchorDate: data.anchorDate,
      interval: 1
    }

    console.log('Creating plan with payload:', JSON.stringify(payload))
    return client.post('/jobs/plans', payload)
  },

  updatePlan(id: string, data: Record<string, unknown>) {
    return client.post(`/jobs/plans/${id}`, data)
  },

  // Changes how often the paycheck arrives and the payday it is counted from
  updateRecurrence(id: string, data: { frequency: string; anchorDate: string; interval?: number }) {
    return client.put(`/jobs/plans/${id}/recurrence`, {
      frequency: mapFrequency(data.frequency),
      anchorDate: data.anchorDate,
      interval: data.interval ?? 1
    })
  },

  addRule(id: string, data: Record<string, unknown>) {
    return client.post(`/jobs/plans/${id}/rules`, data)
  },

  distributePaycheck(id: string, data: Record<string, unknown>) {
    return client.post(`/jobs/plans/${id}/distribute`, data)
  },

  listEvents(id: string) {
    return client.get(`/jobs/plans/${id}/events`)
  },

  deleteRule(planId: string, ruleIndex: number) {
    return client.delete(`/jobs/plans/${planId}/rules/${ruleIndex}`)
  },

  deletePlan(id: string) {
    return client.delete(`/jobs/plans/${id}`)
  },

  setMainJob(id: string) {
    return client.post(`/jobs/plans/${id}/set-main-job`, {})
  }
}
