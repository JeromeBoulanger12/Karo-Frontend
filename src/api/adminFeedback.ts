import client from './client'
import type { UserFeedback } from './feedback'

export const adminFeedbackApi = {
  list() {
    return client.get<UserFeedback[]>('/admin/feedback')
  },
  markRead(id: string) {
    return client.post<UserFeedback>(`/admin/feedback/${id}/read`, {})
  }
}
