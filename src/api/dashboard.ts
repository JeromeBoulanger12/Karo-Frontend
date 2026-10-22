import client from './client'

export interface UserDashboardStatistics {
  userId: string
  email: string
  displayName: string
  subscriptionTier: string
  householdCount: number
  totalMembers: number
  accountCount: number
  envelopeCount: number
  totalSpendingThisMonth: number
  lastLogin?: string
  createdAt: string
}

export interface AdminDashboardStatistics {
  totalUsers: number
  activeHouseholds: number
  newUsersThisMonth: number
  totalAccounts: number
  totalEnvelopes: number
  subscriptionBreakdown: SubscriptionBreakdown
  mrr: number
  arr: number
  averageSpendingPerHousehold: number
  recentSignups: RecentSignupDto[]
  userGrowthTrend: MonthlyUserGrowthDto[]
}

export interface SubscriptionBreakdown {
  freeCount: number
  proCount: number
  familyCount: number
  total: number
  freePercentage: number
  proPercentage: number
  familyPercentage: number
}

export interface RecentSignupDto {
  userId: string
  email: string
  displayName: string
  signupDate: string
}

export interface MonthlyUserGrowthDto {
  month: string
  userCount: number
  newUsers: number
}

export const dashboardAPI = {
  // User Dashboard
  async getUserDashboard(): Promise<UserDashboardStatistics> {
    const response = await client.get('/dashboard/user')
    return response.data
  },

  // Admin Dashboard (owner-only)
  async getAdminDashboard(): Promise<AdminDashboardStatistics> {
    const response = await client.get('/dashboard/admin')
    return response.data
  }
}
