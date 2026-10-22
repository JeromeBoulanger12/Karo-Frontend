import client from './client'

export interface HouseholdMember {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'Owner' | 'Admin' | 'Member' | 'Guest'
}

export interface PendingInvitation {
  id: string
  email: string
  createdAt: string
}

export interface HouseholdMembersResponse {
  members: HouseholdMember[]
  pendingInvitations: PendingInvitation[]
}

export interface PendingInvitationForUser {
  id: string
  householdId: string
  invitedByEmail: string
  createdAt: string
}

export const householdsAPI = {
  // Get members with roles
  async getMembers(householdId: string): Promise<HouseholdMembersResponse> {
    const response = await client.get(`/households/${householdId}/members`)
    return response.data
  },

  // Invite user (owner/admin only)
  async inviteUser(householdId: string, email: string): Promise<{ message: string; invitationId: string }> {
    const response = await client.post(`/households/${householdId}/invitations`, {
      email
    })
    return response.data
  },

  // Delete invitation (owner/admin only)
  async deleteInvitation(householdId: string, invitationId: string): Promise<void> {
    await client.delete(`/households/${householdId}/invitations/${invitationId}`)
  },

  // Remove member (owner only)
  async removeMember(householdId: string, targetUserId: string): Promise<void> {
    await client.delete(`/households/${householdId}/members/${targetUserId}`)
  },

  // Get pending invitations for current user
  async getPendingInvitations(): Promise<PendingInvitationForUser[]> {
    const response = await client.get('/households/invitations/pending')
    return response.data
  },

  // Accept invitation
  async acceptInvitation(invitationId: string): Promise<{ message: string; householdId: string }> {
    const response = await client.post(`/households/invitations/${invitationId}/accept`)
    return response.data
  }
}
