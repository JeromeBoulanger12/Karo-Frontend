import client from './client'

// Mirrors the backend EmailSettingsDto. The Resend key itself is never sent: only whether it is configured.
export interface EmailSettings {
  fromAddress: string
  fromName: string
  testMode: boolean
  testRecipient: string | null
  apiKeyConfigured: boolean
  updatedAt: string
}

export interface UpdateEmailSettingsRequest {
  fromAddress: string
  fromName: string
  testMode: boolean
  testRecipient: string | null
}

// Mirrors the backend EmailBlockType (serialized by name)
export type EmailBlockType = 'Heading' | 'Paragraph' | 'Button'

export interface EmailBlock {
  type: EmailBlockType
  text: string
  url: string | null
}

// Mirrors the backend EmailTemplateSummaryDto
export interface EmailTemplateSummary {
  key: string
  name: string
  variables: string[]
  sampleValues: Record<string, string>
  customizedLocales: string[]
}

// Mirrors the backend EmailTemplateDto
export interface EmailTemplate {
  key: string
  name: string
  locale: string
  variables: string[]
  subject: string
  blocks: EmailBlock[]
  isCustomized: boolean
  updatedAt: string | null
}

export interface EmailPreview {
  subject: string
  html: string
  text: string
}

export interface SaveEmailTemplateRequest {
  subject: string
  blocks: EmailBlock[]
}

export const adminEmailApi = {
  getSettings() {
    return client.get<EmailSettings>('/admin/email-settings')
  },
  updateSettings(request: UpdateEmailSettingsRequest) {
    return client.put<EmailSettings>('/admin/email-settings', request)
  },
  sendTestEmail() {
    return client.post<{ sent: boolean }>('/admin/email-settings/test')
  },
  listTemplates() {
    return client.get<EmailTemplateSummary[]>('/admin/email-templates')
  },
  getTemplate(key: string, locale: string) {
    return client.get<EmailTemplate>(`/admin/email-templates/${key}/${locale}`)
  },
  saveTemplate(key: string, locale: string, request: SaveEmailTemplateRequest) {
    return client.put<EmailTemplate>(`/admin/email-templates/${key}/${locale}`, request)
  },
  resetTemplate(key: string, locale: string) {
    return client.delete(`/admin/email-templates/${key}/${locale}`)
  },
  previewTemplate(key: string, locale: string, request: SaveEmailTemplateRequest) {
    return client.post<EmailPreview>(`/admin/email-templates/${key}/${locale}/preview`, request)
  }
}

// The backend answers validation problems with { errors: string[] } (or { error } for the test send)
export function errorMessages(error: any): string[] {
  const data = error?.response?.data
  if (Array.isArray(data?.errors)) return data.errors
  if (typeof data?.error === 'string') return [data.error]
  if (typeof data === 'string') return [data]
  return [error?.message || 'Erreur inconnue']
}
