import client from './client'

// Mirrors the backend PostalAddress (camelCase JSON). Every part is optional.
export interface PostalAddress {
  street: string | null
  city: string | null
  province: string | null
  postalCode: string | null
  country: string | null
}

// Mirrors the backend UserProfileDto
export interface UserProfile {
  email: string
  firstName: string
  lastName: string
  timeZoneId: string
  notificationsEnabled: boolean
  address: PostalAddress | null
}

export const userSettingsApi = {
  getProfile() {
    return client.get<UserProfile>('/auth/profile')
  },
  updateName(firstName: string, lastName: string) {
    return client.put('/auth/profile', { firstName, lastName })
  },
  updatePreferences(timeZoneId: string, notificationsEnabled: boolean) {
    return client.put('/auth/preferences', { timeZoneId, notificationsEnabled })
  },
  updateAddress(address: PostalAddress) {
    return client.put('/auth/address', address)
  },
  // Proof of consent: the version of the policy and terms the user accepted
  recordConsent(version: string) {
    return client.put('/auth/consent', { version })
  }
}

// Every time zone the browser knows, with a short fallback for older browsers
export function listTimeZones(): string[] {
  const supported = (Intl as any).supportedValuesOf
  if (typeof supported === 'function') return supported('timeZone')
  return ['America/Toronto', 'America/Montreal', 'America/Vancouver', 'America/Halifax', 'America/St_Johns', 'Europe/Paris', 'UTC']
}
