import client from './client'

export type NotificationKind = 'BillOverdue' | 'BillDueSoon' | 'AutomaticPaydaySuspended'

// Mirrors the backend NotificationDto. Only the fields the kind needs are set.
export interface AppNotification {
  kind: NotificationKind
  name: string
  dueDate: string | null
  amount: number | null
  currency: string | null
  envelopeId: string | null
  planId: string | null
}

export const notificationsApi = {
  list() {
    return client.get<AppNotification[]>('/notifications')
  }
}
