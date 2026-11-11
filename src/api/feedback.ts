import client from './client'

// Mirrors the backend UserFeedbackDto
export interface UserFeedback {
  id: string
  userId: string
  userEmail: string
  message: string
  createdAt: string
  readAt: string | null
}

export const feedbackApi = {
  submit(message: string) {
    return client.post<UserFeedback>('/feedback', { message })
  }
}
