<template>
  <div class="admin-subscriptions-container">
    <div class="subscriptions-header">
      <h1>{{ t('admin.subscriptions') }}</h1>
      <p class="subtitle">{{ t('admin.subscriptions_subtitle') }}</p>
    </div>

    <div v-if="loading" class="loading">
      {{ t('common.loading') }}
    </div>

    <div v-else class="subscriptions-content">
      <!-- Subscription Tiers Overview -->
      <div class="tiers-overview">
        <h2>{{ t('admin.subscription_tiers') }}</h2>
        <div class="tiers-grid">
          <div v-for="tier in subscriptionTiers" :key="tier.id" class="tier-card">
            <div class="tier-header">
              <h3>{{ tier.name }}</h3>
              <span class="tier-badge" :class="tier.id.toLowerCase()">{{ tier.id }}</span>
            </div>

            <div class="tier-price">
              <span class="price-amount">{{ formatCurrency(tier.price) }}</span>
              <span class="price-period">/{{ t('admin.month') }}</span>
            </div>

            <ul class="tier-features">
              <li v-for="(feature, idx) in tier.features" :key="idx">
                <i class="mdi mdi-check-circle"></i>
                {{ feature }}
              </li>
            </ul>

            <div class="tier-stats">
              <div class="stat">
                <span class="stat-label">{{ t('admin.users') }}</span>
                <span class="stat-value">{{ tier.userCount }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">{{ t('admin.revenue_monthly') }}</span>
                <span class="stat-value">{{ formatCurrency(tier.monthlyRevenue) }}</span>
              </div>
            </div>

            <button class="btn btn-edit" @click="editTier(tier)">
              <i class="mdi mdi-pencil"></i>
              {{ t('admin.edit') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Active Subscriptions Table -->
      <div class="active-subscriptions">
        <div class="section-header">
          <h2>{{ t('admin.active_subscriptions') }}</h2>
          <button class="btn btn-primary" @click="showCreateModal = true">
            <i class="mdi mdi-plus"></i>
            Create Subscription
          </button>
          <div class="search-filter">
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('admin.search_users')"
              class="search-input"
            />
            <select v-model="filterTier" class="filter-select">
              <option value="">{{ t('admin.all_tiers') }}</option>
              <option value="Free">{{ t('admin.free') }}</option>
              <option value="Pro">{{ t('admin.pro') }}</option>
              <option value="Family">{{ t('admin.family') }}</option>
            </select>
          </div>
        </div>

        <div class="table-container">
          <table class="subscriptions-table">
            <thead>
              <tr>
                <th>{{ t('admin.user') }}</th>
                <th>{{ t('admin.email') }}</th>
                <th>{{ t('admin.tier') }}</th>
                <th>{{ t('admin.status') }}</th>
                <th>{{ t('admin.start_date') }}</th>
                <th>{{ t('admin.renewal_date') }}</th>
                <th>{{ t('admin.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sub in filteredSubscriptions" :key="sub.id">
                <td>
                  <div class="user-info">
                    <div class="user-avatar" :style="{ backgroundColor: getAvatarColor(sub.userId) }">
                      {{ sub.displayName.charAt(0).toUpperCase() }}
                    </div>
                    <span>{{ sub.displayName }}</span>
                  </div>
                </td>
                <td>{{ sub.email }}</td>
                <td>
                  <span class="tier-badge" :class="sub.tier.toLowerCase()">
                    {{ sub.tier }}
                  </span>
                </td>
                <td>
                  <span class="status-badge" :class="sub.status.toLowerCase()">
                    {{ t(`admin.status_${sub.status.toLowerCase()}`) }}
                  </span>
                </td>
                <td>{{ formatDate(sub.startDate) }}</td>
                <td>{{ formatDate(sub.renewalDate) }}</td>
                <td>
                  <div class="action-buttons">
                    <button class="btn-small btn-view" @click="viewSubscription(sub)" title="View">
                      <i class="mdi mdi-eye"></i>
                    </button>
                    <button class="btn-small btn-edit" @click="editSubscription(sub)" title="Edit">
                      <i class="mdi mdi-pencil"></i>
                    </button>
                    <button class="btn-small btn-cancel" @click="cancelSubscription(sub)" title="Cancel">
                      <i class="mdi mdi-trash-can"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Revenue Analytics -->
      <div class="revenue-analytics">
        <h2>{{ t('admin.revenue_analytics') }}</h2>
        <div class="analytics-grid">
          <div class="analytics-card">
            <div class="analytics-label">{{ t('admin.mrr') }}</div>
            <div class="analytics-value">{{ formatCurrency(stats.mrr) }}</div>
            <div class="analytics-change" :class="stats.mrrChange >= 0 ? 'positive' : 'negative'">
              <i :class="stats.mrrChange >= 0 ? 'mdi mdi-trending-up' : 'mdi mdi-trending-down'"></i>
              {{ Math.abs(stats.mrrChange) }}%
            </div>
          </div>

          <div class="analytics-card">
            <div class="analytics-label">{{ t('admin.arr') }}</div>
            <div class="analytics-value">{{ formatCurrency(stats.arr) }}</div>
            <div class="analytics-change" :class="stats.arrChange >= 0 ? 'positive' : 'negative'">
              <i :class="stats.arrChange >= 0 ? 'mdi mdi-trending-up' : 'mdi mdi-trending-down'"></i>
              {{ Math.abs(stats.arrChange) }}%
            </div>
          </div>

          <div class="analytics-card">
            <div class="analytics-label">{{ t('admin.churn_rate') }}</div>
            <div class="analytics-value">{{ stats.churnRate.toFixed(1) }}%</div>
            <div class="analytics-info">{{ stats.churnedCount }} cancellations</div>
          </div>

          <div class="analytics-card">
            <div class="analytics-label">{{ t('admin.avg_lifetime_value') }}</div>
            <div class="analytics-value">{{ formatCurrency(stats.avgLifetimeValue) }}</div>
            <div class="analytics-info">{{ stats.activeSubscriptions }} active</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Subscription Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Create New Subscription</h2>
          <button @click="showCreateModal = false" class="close-btn">
            <i class="mdi mdi-close"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>User Email</label>
            <input
              v-model="newSubscription.userEmail"
              type="email"
              placeholder="user@example.com"
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label>Subscription Tier</label>
            <select v-model="newSubscription.tier" class="form-control">
              <option value="">Select a tier...</option>
              <option value="Free">Free</option>
              <option value="Pro">Pro</option>
              <option value="Family">Family</option>
            </select>
          </div>

          <div class="form-group">
            <label>Start Date</label>
            <input
              v-model="newSubscription.startDate"
              type="date"
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label>Renewal Date</label>
            <input
              v-model="newSubscription.renewalDate"
              type="date"
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label>Status</label>
            <select v-model="newSubscription.status" class="form-control">
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showCreateModal = false">Cancel</button>
          <button class="btn btn-primary" @click="createSubscription">Create</button>
        </div>
      </div>
    </div>

    <!-- Edit Subscription Tier Modal -->
    <div v-if="editingSub" class="modal-overlay" @click.self="editingSub = null">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingSub.displayName }}</h2>
          <button @click="editingSub = null" class="close-btn">
            <i class="mdi mdi-close"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>{{ t('admin.subscription_tier') }}</label>
            <select v-model="editTierValue" class="form-control">
              <option value="Free">Free</option>
              <option value="Pro">Pro</option>
              <option value="Family">Family</option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="editingSub = null">{{ t('common.cancel') }}</button>
          <button class="btn btn-primary" @click="saveSubscriptionEdit">{{ t('common.save') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { apiUrl } from '../api/client'

const { t } = useI18n()
const router = useRouter()

const loading = ref(true)
const searchQuery = ref('')
const filterTier = ref('')
const showCreateModal = ref(false)
const editingSub = ref<any | null>(null)
const editTierValue = ref('')

const newSubscription = ref({
  userEmail: '',
  tier: '',
  startDate: new Date().toISOString().split('T')[0],
  renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  status: 'Active'
})

const subscriptionTiers = ref<any[]>([])
const subscriptions = ref<any[]>([])
const stats = ref({
  mrr: 0,
  mrrChange: 0,
  arr: 0,
  arrChange: 0,
  churnRate: 0,
  churnedCount: 0,
  avgLifetimeValue: 0,
  activeSubscriptions: 0
})

// Fetch data from backend
onMounted(async () => {
  try {
    loading.value = true

    // Get subscription stats
    const statsResponse = await fetch(apiUrl('/admin/subscriptions/stats'), {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    if (statsResponse.ok) {
      stats.value = await statsResponse.json()
    }

    // Real per-tier figures from the backend (tierBreakdown: userCount and monthlyRevenue per tier)
    const breakdownFor = (tier: string): { userCount: number; monthlyRevenue: number } => {
      const breakdown: any[] = Object.values((stats.value as any).tierBreakdown ?? {})
      return breakdown.find(b => b.tier === tier) ?? { userCount: 0, monthlyRevenue: 0 }
    }

    // Build tiers with data from stats
    subscriptionTiers.value = [
      {
        id: 'Free',
        name: t('admin.free'),
        price: 0,
        features: [
          t('admin.feature_basic_accounts'),
          t('admin.feature_basic_envelopes'),
          t('admin.feature_shared_household')
        ],
        // Free users have no paid subscription row; the backend counts them from the user table
        userCount: (stats.value as any).freeUserCount ?? 0,
        monthlyRevenue: 0
      },
      {
        id: 'Pro',
        name: 'Pro',
        price: 9.99,
        features: [
          t('admin.feature_unlimited_accounts'),
          t('admin.feature_advanced_analytics'),
          t('admin.feature_priority_support'),
          t('admin.feature_custom_categories')
        ],
        userCount: breakdownFor('Pro').userCount,
        monthlyRevenue: breakdownFor('Pro').monthlyRevenue
      },
      {
        id: 'Family',
        name: t('admin.family'),
        price: 19.99,
        features: [
          t('admin.feature_multiple_households'),
          t('admin.feature_team_collaboration'),
          t('admin.feature_api_access'),
          t('admin.feature_24_7_support')
        ],
        userCount: breakdownFor('Family').userCount,
        monthlyRevenue: breakdownFor('Family').monthlyRevenue
      }
    ]

    // Get active subscriptions
    const subsResponse = await fetch(apiUrl('/admin/subscriptions'), {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    if (subsResponse.ok) {
      subscriptions.value = await subsResponse.json()
    }
  } catch (error) {
    console.error('Error loading subscription data:', error)
  } finally {
    loading.value = false
  }
})

const filteredSubscriptions = computed(() => {
  return subscriptions.value.filter(sub => {
    const matchesSearch = sub.displayName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         sub.email.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesTier = !filterTier.value || sub.tier === filterTier.value
    return matchesSearch && matchesTier
  })
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

const getAvatarColor = (userId: string): string => {
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6']
  return colors[userId.charCodeAt(userId.length - 1) % colors.length]
}

// Tier prices and features are edited on the tier configurations page
const editTier = (_tier: any) => {
  router.push('/admin/tier-configurations')
}

const viewSubscription = (sub: any) => {
  console.log('View subscription:', sub)
}

const editSubscription = (sub: any) => {
  editingSub.value = sub
  editTierValue.value = sub.tier
}

const saveSubscriptionEdit = async () => {
  const sub = editingSub.value
  if (!sub) return

  try {
    const response = await fetch(apiUrl(`/admin/subscriptions/${sub.userId}/tier`), {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tier: editTierValue.value })
    })

    if (response.ok) {
      sub.tier = editTierValue.value
      editingSub.value = null
    } else {
      alert(await response.text() || 'Failed to update subscription')
    }
  } catch (error) {
    console.error('Error updating subscription:', error)
    alert('Error updating subscription')
  }
}

const cancelSubscription = (sub: any) => {
  if (confirm(`${t('admin.confirm_cancel')} ${sub.displayName}?`)) {
    subscriptions.value = subscriptions.value.filter(s => s.id !== sub.id)
  }
}

const createSubscription = async () => {
  if (!newSubscription.value.userEmail || !newSubscription.value.tier) {
    alert('Please fill in all required fields')
    return
  }

  try {
    const token = localStorage.getItem('token')
    const response = await fetch(apiUrl('/admin/subscriptions/create'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newSubscription.value)
    })

    if (response.ok) {
      const createdSub = await response.json()
      subscriptions.value.push(createdSub)
      showCreateModal.value = false
      newSubscription.value = {
        userEmail: '',
        tier: '',
        startDate: new Date().toISOString().split('T')[0],
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Active'
      }
      console.log('Subscription created successfully')
    } else {
      alert('Failed to create subscription')
    }
  } catch (error) {
    console.error('Error creating subscription:', error)
    alert('Error creating subscription')
  }
}
</script>

<style scoped>
.admin-subscriptions-container {
  max-width: 1400px;
  margin: 0 auto;
}

.subscriptions-header {
  margin-bottom: 2rem;
}

.subscriptions-header h1 {
  margin: 0;
  font-size: 2rem;
  color: #1e293b;
}

.subtitle {
  margin: 0.5rem 0 0;
  color: #64748b;
  font-size: 1rem;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #64748b;
}

.subscriptions-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Tiers Overview */
.tiers-overview h2 {
  margin: 0 0 1.5rem;
  font-size: 1.3rem;
  color: #1e293b;
}

.tiers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.tier-card {
  background: white;
  border-radius: 8px;
  border: 2px solid #e2e8f0;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.tier-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.1);
}

.tier-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.tier-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #1e293b;
}

.tier-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
}

.tier-badge.free {
  background-color: #fef3c7;
  color: #92400e;
}

.tier-badge.pro {
  background-color: #dbeafe;
  color: #1e40af;
}

.tier-badge.family {
  background-color: #d1fae5;
  color: #065f46;
}

.tier-price {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.price-amount {
  font-size: 2rem;
  font-weight: bold;
  color: #1e293b;
}

.price-period {
  color: #64748b;
  font-size: 0.9rem;
  margin-left: 0.5rem;
}

.tier-features {
  list-style: none;
  margin: 0 0 1.5rem;
  padding: 0;
}

.tier-features li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  color: #475569;
  font-size: 0.9rem;
}

.tier-features i {
  color: #10b981;
  font-size: 1.1rem;
}

.tier-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.stat {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 0.25rem;
}

.stat-value {
  display: block;
  font-size: 1.3rem;
  font-weight: bold;
  color: #1e293b;
}

.btn-edit {
  width: 100%;
  padding: 0.75rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-edit:hover {
  background-color: #2563eb;
}

/* Active Subscriptions */
.active-subscriptions {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  margin: 0;
  font-size: 1.3rem;
  color: #1e293b;
}

.search-filter {
  display: flex;
  gap: 1rem;
}

.search-input,
.filter-select {
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 0.9rem;
}

.search-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.table-container {
  overflow-x: auto;
}

.subscriptions-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.subscriptions-table thead {
  background-color: #f8fafc;
}

.subscriptions-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #475569;
  border-bottom: 2px solid #e2e8f0;
}

.subscriptions-table td {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  color: #1e293b;
}

.subscriptions-table tbody tr:hover {
  background-color: #f8fafc;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.85rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.active {
  background-color: #dcfce7;
  color: #166534;
}

.status-badge.expired {
  background-color: #fee2e2;
  color: #991b1b;
}

.status-badge.cancelled {
  background-color: #f3f4f6;
  color: #374151;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-small {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.btn-view {
  background-color: #dbeafe;
  color: #1e40af;
}

.btn-view:hover {
  background-color: #bfdbfe;
}

.btn-edit {
  background-color: #fef3c7;
  color: #92400e;
}

.btn-edit:hover {
  background-color: #fde68a;
}

.btn-cancel {
  background-color: #fee2e2;
  color: #991b1b;
}

.btn-cancel:hover {
  background-color: #fecaca;
}

/* Revenue Analytics */
.revenue-analytics {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.revenue-analytics h2 {
  margin: 0 0 1.5rem;
  font-size: 1.3rem;
  color: #1e293b;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.analytics-card {
  padding: 1.5rem;
  background-color: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.analytics-label {
  font-size: 0.85rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.75rem;
}

.analytics-value {
  font-size: 1.75rem;
  font-weight: bold;
  color: #1e293b;
  margin-bottom: 0.75rem;
}

.analytics-change {
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.analytics-change.positive {
  color: #10b981;
}

.analytics-change.negative {
  color: #ef4444;
}

.analytics-info {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 0.75rem;
}

@media (max-width: 768px) {
  .tiers-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .search-filter {
    width: 100%;
    flex-direction: column;
  }

  .search-input,
  .filter-select {
    width: 100%;
  }

  .analytics-grid {
    grid-template-columns: 1fr;
  }
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #1e293b;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
}

.close-btn:hover {
  color: #1e293b;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 5px;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 0.875rem;
  font-family: inherit;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #e5e7eb;
  color: #1e293b;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
