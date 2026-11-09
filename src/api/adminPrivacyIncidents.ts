import client from './client'

// Mirrors the backend PrivacyIncidentDto
export interface PrivacyIncident {
  id: string
  detectedAt: string
  occurredAt: string | null
  description: string
  personalInformation: string
  affectedPeopleCount: number | null
  containmentMeasures: string | null
  riskOfSeriousInjury: boolean | null
  assessmentNotes: string | null
  caiNotifiedAt: string | null
  affectedPeopleNotifiedAt: string | null
  closedAt: string | null
  createdAt: string
}

// Facts of an incident, as the form sends them (recording and updating)
export interface IncidentFacts {
  occurredAt: string | null
  description: string
  personalInformation: string
  affectedPeopleCount: number | null
  containmentMeasures: string | null
}

export const adminPrivacyIncidentsApi = {
  list() {
    return client.get<PrivacyIncident[]>('/admin/privacy-incidents')
  },
  record(facts: IncidentFacts) {
    return client.post<PrivacyIncident>('/admin/privacy-incidents', facts)
  },
  update(id: string, facts: IncidentFacts) {
    return client.put<PrivacyIncident>(`/admin/privacy-incidents/${id}`, facts)
  },
  assess(id: string, riskOfSeriousInjury: boolean, assessmentNotes: string | null) {
    return client.post<PrivacyIncident>(`/admin/privacy-incidents/${id}/assess`, { riskOfSeriousInjury, assessmentNotes })
  },
  // Without a date, the backend records the moment of the request
  notifyCai(id: string) {
    return client.post<PrivacyIncident>(`/admin/privacy-incidents/${id}/notify-cai`, {})
  },
  notifyAffectedPeople(id: string) {
    return client.post<PrivacyIncident>(`/admin/privacy-incidents/${id}/notify-affected-people`, {})
  },
  close(id: string) {
    return client.post<PrivacyIncident>(`/admin/privacy-incidents/${id}/close`, {})
  }
}
