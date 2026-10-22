<template>
  <div class="admin-dashboard-container">
    <h1>{{ t('admin_dashboard.title') }}</h1>

    <div v-if="loading" class="loading">
      {{ t('common.loading') }}
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else class="admin-grid">
      <!-- Key Metrics Row -->
      <div class="metrics-row">
        <div class="metric-card">
          <div class="metric-label">{{ t('admin_dashboard.total_users') }}</div>
          <div class="metric-value">{{ stats.totalUsers }}</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">{{ t('admin_dashboard.active_households') }}</div>
          <div class="metric-value">{{ stats.activeHouseholds }}</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">{{ t('admin_dashboard.new_users_month') }}</div>
          <div class="metric-value">{{ stats.newUsersThisMonth }}</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">{{ t('admin_dashboard.avg_spending') }}</div>
          <div class="metric-value">{{ formatCurrency(stats.averageSpendingPerHousehold) }}</div>
        </div>
      </div>

      <!-- Subscription Breakdown -->
      <div class="card subscription-card">
        <h2>{{ t('admin_dashboard.subscription_breakdown') }}</h2>
        <div class="subscription-grid">
          <div class="subscription-tier">
            <div class="tier-label">{{ t('admin_dashboard.free') }}</div>
            <div class="tier-count">{{ stats.subscriptionBreakdown.freeCount }}</div>
            <div class="tier-percentage">{{ stats.subscriptionBreakdown.freePercentage.toFixed(1) }}%</div>
            <div class="progress-bar">
              <div class="progress" :style="{ width: stats.subscriptionBreakdown.freePercentage + '%' }"></div>
            </div>
          </div>

          <div class="subscription-tier">
            <div class="tier-label">{{ t('admin_dashboard.pro') }}</div>
            <div class="tier-count">{{ stats.subscriptionBreakdown.proCount }}</div>
            <div class="tier-percentage">{{ stats.subscriptionBreakdown.proPercentage.toFixed(1) }}%</div>
            <div class="progress-bar pro">
              <div class="progress" :style="{ width: stats.subscriptionBreakdown.proPercentage + '%' }"></div>
            </div>
          </div>

          <div class="subscription-tier">
            <div class="tier-label">{{ t('admin_dashboard.family') }}</div>
            <div class="tier-count">{{ stats.subscriptionBreakdown.familyCount }}</div>
            <div class="tier-percentage">{{ stats.subscriptionBreakdown.familyPercentage.toFixed(1) }}%</div>
            <div class="progress-bar family">
              <div class="progress" :style="{ width: stats.subscriptionBreakdown.familyPercentage + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Revenue Metrics -->
      <div class="card revenue-card">
        <h2>{{ t('admin_dashboard.revenue') }}</h2>
        <div class="revenue-grid">
          <div class="revenue-item">
            <div class="revenue-label">{{ t('admin_dashboard.mrr') }}</div>
            <div class="revenue-value">{{ formatCurrency(stats.mrr) }}</div>
          </div>
          <div class="revenue-item">
            <div class="revenue-label">{{ t('admin_dashboard.arr') }}</div>
            <div class="revenue-value">{{ formatCurrency(stats.arr) }}</div>
          </div>
        </div>
      </div>

      <!-- Content Metrics -->
      <div class="card content-card">
        <h2>{{ t('admin_dashboard.content') }}</h2>
        <div class="content-grid">
          <div class="content-item">
            <div class="content-label">{{ t('admin_dashboard.total_accounts') }}</div>
            <div class="content-value">{{ stats.totalAccounts }}</div>
          </div>
          <div class="content-item">
            <div class="content-label">{{ t('admin_dashboard.total_envelopes') }}</div>
            <div class="content-value">{{ stats.totalEnvelopes }}</div>
          </div>
        </div>
      </div>

      <!-- Recent Signups -->
      <div class="card recent-signups-card">
        <h2>{{ t('admin_dashboard.recent_signups') }}</h2>
        <div class="signups-table">
          <table>
            <thead>
              <tr>
                <th>{{ t('admin_dashboard.name') }}</th>
                <th>{{ t('admin_dashboard.email') }}</th>
                <th>{{ t('admin_dashboard.signup_date') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="signup in stats.recentSignups" :key="signup.userId">
                <td>{{ signup.displayName }}</td>
                <td>{{ signup.email }}</td>
                <td>{{ formatDate(signup.signupDate) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { dashboardAPI, type AdminDashboardStatistics } from '../api/dashboard'

const { t } = useI18n()
const router = useRouter()

const stats = ref<AdminDashboardStatistics>({
  totalUsers: 0,
  activeHouseholds: 0,
  newUsersThisMonth: 0,
  totalAccounts: 0,
  totalEnvelopes: 0,
  subscriptionBreakdown: {
    freeCount: 0,
    proCount: 0,
    familyCount: 0,
    total: 0,
    freePercentage: 0,
    proPercentage: 0,
    familyPercentage: 0
  },
  mrr: 0,
  arr: 0,
  averageSpendingPerHousehold: 0,
  recentSignups: [],
  userGrowthTrend: []
})

const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    stats.value = await dashboardAPI.getAdminDashboard()
    loading.value = false
  } catch (err: any) {
    if (err.response?.status === 403) {
      error.value = t('admin_dashboard.access_denied')
      // Redirect to user dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } else {
      error.value = t('admin_dashboard.error_loading')
    }
    console.error('Error loading admin dashboard:', err)
    loading.value = false
  }
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD'
  }).format(value)
}

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('fr-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(dateString))
}
</script>

<style scoped>
.admin-dashboard-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.admin-dashboard-container h1 {
  margin-bottom: 2rem;
  color: #333;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
  font-size: 1.1rem;
}

.error {
  color: #d32f2f;
  background-color: #ffebee;
  padding: 1rem;
  border-radius: 4px;
}

.admin-grid {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.metric-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.metric-label {
  font-size: 0.85rem;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.metric-value {
  font-size: 2rem;
  font-weight: bold;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #333;
  font-size: 1.3rem;
}

.subscription-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
}

.subscription-tier {
  text-align: center;
}

.tier-label {
  font-size: 0.95rem;
  font-weight: 500;
  color: #666;
  margin-bottom: 0.5rem;
}

.tier-count {
  font-size: 1.8rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.5rem;
}

.tier-percentage {
  font-size: 0.85rem;
  color: #999;
  margin-bottom: 1rem;
}

.progress-bar {
  height: 6px;
  background-color: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar .progress {
  height: 100%;
  background-color: #757575;
  transition: width 0.3s ease;
}

.progress-bar.pro .progress {
  background-color: #1976d2;
}

.progress-bar.family .progress {
  background-color: #388e3c;
}

.revenue-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
}

.revenue-item {
  text-align: center;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.revenue-label {
  font-size: 0.85rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.revenue-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #388e3c;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
}

.content-item {
  text-align: center;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.content-label {
  font-size: 0.85rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.content-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1976d2;
}

.signups-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

thead {
  background-color: #f5f5f5;
}

th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #666;
  border-bottom: 2px solid #e0e0e0;
}

td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e0e0e0;
  color: #333;
}

tbody tr:hover {
  background-color: #fafafa;
}

@media (max-width: 768px) {
  .metrics-row {
    grid-template-columns: 1fr 1fr;
  }

  .metric-card {
    padding: 1rem;
  }

  .metric-value {
    font-size: 1.5rem;
  }

  .subscription-grid,
  .revenue-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }

  table {
    font-size: 0.85rem;
  }

  th, td {
    padding: 0.5rem;
  }
}
</style>
