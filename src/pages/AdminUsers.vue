<template>
  <div class="admin-users-container">
    <div class="users-header">
      <div>
        <h1>{{ t('admin.users_management') }}</h1>
        <p class="subtitle">{{ t('admin.users_management_subtitle') }}</p>
      </div>
      <button class="btn btn-primary" @click="openAddUserModal">
        <i class="mdi mdi-plus"></i>
        {{ t('admin.add_user') }}
      </button>
    </div>

    <div v-if="loading" class="loading">
      {{ t('common.loading') }}
    </div>

    <div v-else class="users-content">
      <!-- Filters and Search -->
      <div class="filters-section">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('admin.search_users')"
          class="search-input"
        />

        <select v-model="filterRole" class="filter-select">
          <option value="">{{ t('admin.all_roles') }}</option>
          <option value="Admin">{{ t('admin.admin') }}</option>
          <option value="User">{{ t('admin.user') }}</option>
        </select>

        <select v-model="filterStatus" class="filter-select">
          <option value="">{{ t('admin.all_status') }}</option>
          <option value="Active">{{ t('admin.active') }}</option>
          <option value="Inactive">{{ t('admin.inactive') }}</option>
          <option value="Suspended">{{ t('admin.suspended') }}</option>
        </select>

        <select v-model="sortBy" class="filter-select">
          <option value="joinDate">{{ t('admin.sort_by_date') }}</option>
          <option value="name">{{ t('admin.sort_by_name') }}</option>
          <option value="email">{{ t('admin.sort_by_email') }}</option>
        </select>
      </div>

      <!-- Users Table -->
      <div class="users-table-wrapper">
        <table class="users-table">
          <thead>
            <tr>
              <th>{{ t('admin.user') }}</th>
              <th>{{ t('admin.email') }}</th>
              <th>{{ t('admin.role') }}</th>
              <th>{{ t('admin.status') }}</th>
              <th>{{ t('admin.subscription_tier') }}</th>
              <th>{{ t('admin.join_date') }}</th>
              <th>{{ t('admin.last_activity') }}</th>
              <th>{{ t('admin.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>
                <div class="user-cell">
                  <div class="user-avatar" :style="{ backgroundColor: getAvatarColor(user.id) }">
                    {{ user.displayName.charAt(0).toUpperCase() }}
                  </div>
                  <span>{{ user.displayName }}</span>
                </div>
              </td>
              <td>{{ user.email }}</td>
              <td>
                <span class="role-badge" :class="user.role.toLowerCase()">
                  {{ t(`admin.role_${user.role.toLowerCase()}`) }}
                </span>
              </td>
              <td>
                <span class="status-badge" :class="user.status.toLowerCase()">
                  {{ t(`admin.status_${user.status.toLowerCase()}`) }}
                </span>
              </td>
              <td>
                <span class="tier-badge" :class="user.subscriptionTier.toLowerCase()">
                  {{ user.subscriptionTier }}
                </span>
                <span
                  v-if="user.isManualAccess"
                  class="grant-badge"
                  :title="user.manualAccessUntil ? t('admin.grantedUntil', { date: formatGrantEnd(user.manualAccessUntil) }) : t('admin.grantedNoEnd')"
                >
                  {{ user.manualAccessUntil ? t('admin.grantedUntil', { date: formatGrantEnd(user.manualAccessUntil) }) : t('admin.grantedNoEnd') }}
                </span>
              </td>
              <td>{{ formatDate(user.joinDate) }}</td>
              <td>{{ formatRelativeDate(user.lastActivity) }}</td>
              <td>
                <div class="action-buttons">
                  <button
                    class="btn-small btn-view"
                    @click="viewUser(user)"
                    :title="t('admin.view')"
                  >
                    <i class="mdi mdi-eye"></i>
                  </button>
                  <button
                    class="btn-small btn-edit"
                    @click="editUser(user)"
                    :title="t('admin.edit')"
                  >
                    <i class="mdi mdi-pencil"></i>
                  </button>
                  <button
                    class="btn-small btn-more"
                    @click="openUserMenu(user)"
                    :title="t('admin.more')"
                  >
                    <i class="mdi mdi-dots-vertical"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="filteredUsers.length === 0" class="no-results">
          {{ t('admin.no_users_found') }}
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <button
          :disabled="currentPage === 1"
          @click="currentPage--"
          class="btn-pagination"
        >
          <i class="mdi mdi-chevron-left"></i>
        </button>

        <span class="page-info">
          {{ t('admin.page') }} {{ currentPage }} {{ t('admin.of') }} {{ totalPages }}
        </span>

        <button
          :disabled="currentPage === totalPages"
          @click="currentPage++"
          class="btn-pagination"
        >
          <i class="mdi mdi-chevron-right"></i>
        </button>
      </div>

      <!-- User Statistics -->
      <div class="user-statistics">
        <h2>{{ t('admin.user_statistics') }}</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">{{ t('admin.total_users') }}</div>
            <div class="stat-value">{{ users.length }}</div>
            <div class="stat-trend positive">
              <i class="mdi mdi-trending-up"></i>
              {{ userStats.newUsersThisMonth }} this month
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-label">{{ t('admin.active_users') }}</div>
            <div class="stat-value">{{ userStats.activeUsers }}</div>
            <div class="stat-trend">
              {{ ((userStats.activeUsers / users.length) * 100).toFixed(1) }}% of total
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-label">{{ t('admin.admin_users') }}</div>
            <div class="stat-value">{{ userStats.adminCount }}</div>
            <div class="stat-info">{{ userStats.adminCount }} admins</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">{{ t('admin.avg_engagement') }}</div>
            <div class="stat-value">{{ userStats.avgEngagement.toFixed(1) }}%</div>
            <div class="stat-info">Last 30 days</div>
          </div>
        </div>
      </div>
    </div>

    <!-- User details (view) and subscription tier (edit) -->
    <div v-if="selectedUser" class="modal-overlay" @click="closeUserModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>{{ modalMode === 'edit' ? t('admin.editUser') : t('admin.userDetails') }}</h2>
          <button class="modal-close" @click="closeUserModal"><i class="mdi mdi-close"></i></button>
        </div>

        <div class="modal-body">
          <dl class="user-details">
            <dt>{{ t('admin.user') }}</dt>
            <dd>{{ selectedUser.displayName || '—' }}</dd>
            <dt>{{ t('admin.email') }}</dt>
            <dd>{{ selectedUser.email }}</dd>
            <dt>{{ t('admin.role') }}</dt>
            <dd>{{ selectedUser.role || '—' }}</dd>
            <dt>{{ t('admin.join_date') }}</dt>
            <dd>{{ formatDate(selectedUser.joinDate) }}</dd>
            <dt>{{ t('admin.last_activity') }}</dt>
            <dd>{{ formatRelativeDate(selectedUser.lastActivity) }}</dd>
          </dl>

          <template v-if="modalMode === 'edit'">
            <div class="form-group">
              <label>{{ t('admin.subscription_tier') }}</label>
              <select v-model="editTier">
                <option v-for="tier in TIERS" :key="tier" :value="tier">{{ tier }}</option>
              </select>
            </div>
            <div v-if="editTier !== 'Free'" class="form-group">
              <label>{{ t('admin.accessEnd') }}</label>
              <input v-model="editEndDate" type="date" :min="todayIso" />
              <small class="hint">{{ t('admin.accessEndHint') }}</small>
            </div>
          </template>

          <p v-if="modalError" class="error-text">{{ modalError }}</p>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="closeUserModal">{{ t('common.cancel') }}</button>
          <button
            v-if="modalMode === 'edit'"
            class="btn-primary"
            :disabled="saving || editTier === selectedUser.subscriptionTier"
            @click="saveUserTier"
          >
            {{ t('common.save') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { apiUrl } from '../api/client'

const { t } = useI18n()

const loading = ref(true)
const searchQuery = ref('')
const filterRole = ref('')
const filterStatus = ref('')
const sortBy = ref('joinDate')
const currentPage = ref(1)
const pageSize = 10

const users = ref<any[]>([])

const userStats = ref({
  newUsersThisMonth: 0,
  activeUsers: 0,
  adminCount: 0,
  avgEngagement: 0
})

// Fetch users from backend
onMounted(async () => {
  try {
    loading.value = true

    // Get users list
    const usersResponse = await fetch(apiUrl('/admin/users'), {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    if (usersResponse.ok) {
      const data = await usersResponse.json()
      users.value = Array.isArray(data) ? data : data.users || []
    }

    // Get user stats
    const statsResponse = await fetch(apiUrl('/admin/users/stats'), {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    if (statsResponse.ok) {
      userStats.value = await statsResponse.json()
    }
  } catch (error) {
    console.error('Error loading user data:', error)
  } finally {
    loading.value = false
  }
})

const filteredUsers = computed(() => {
  let result = users.value.filter(user => {
    const matchesSearch = user.displayName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesRole = !filterRole.value || user.role === filterRole.value
    const matchesStatus = !filterStatus.value || user.status === filterStatus.value
    return matchesSearch && matchesRole && matchesStatus
  })

  // Sort
  result.sort((a, b) => {
    if (sortBy.value === 'name') {
      return a.displayName.localeCompare(b.displayName)
    } else if (sortBy.value === 'email') {
      return a.email.localeCompare(b.email)
    }
    return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime()
  })

  return result
})

const totalPages = computed(() => {
  return Math.ceil(filteredUsers.value.length / pageSize)
})

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredUsers.value.slice(start, start + pageSize)
})

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('fr-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(dateString))
}

const formatRelativeDate = (relativeDate: string) => {
  return relativeDate
}

const getAvatarColor = (userId: string): string => {
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
  return colors[userId.charCodeAt(userId.length - 1) % colors.length]
}

const openAddUserModal = () => {
  console.log('Open add user modal')
}

// User modal: details (view) or subscription tier change (edit)
const TIERS = ['Free', 'Pro', 'Family']
const selectedUser = ref<any>(null)
const modalMode = ref<'view' | 'edit'>('view')
const editTier = ref('')
// Optional end of a manually granted access (YYYY-MM-DD); empty means no end date
const editEndDate = ref('')
const saving = ref(false)
const modalError = ref('')
const todayIso = new Date().toISOString().slice(0, 10)

const openUserModal = (user: any, mode: 'view' | 'edit') => {
  selectedUser.value = user
  modalMode.value = mode
  editTier.value = user.subscriptionTier
  editEndDate.value = user.manualAccessUntil ? String(user.manualAccessUntil).slice(0, 10) : ''
  modalError.value = ''
}

const formatGrantEnd = (value: string) =>
  new Date(value).toLocaleDateString('fr-CA', { dateStyle: 'medium' })

const closeUserModal = () => {
  if (saving.value) return
  selectedUser.value = null
}

const viewUser = (user: any) => openUserModal(user, 'view')
const editUser = (user: any) => openUserModal(user, 'edit')
// No separate menu yet: the more button opens the details
const openUserMenu = (user: any) => openUserModal(user, 'view')

// Grants access chosen by the admin. The end of the day is used so the chosen date is included
const saveUserTier = async () => {
  const user = selectedUser.value
  if (!user) return
  saving.value = true
  modalError.value = ''
  const manualAccessUntil = editTier.value !== 'Free' && editEndDate.value
    ? `${editEndDate.value}T23:59:59Z`
    : null
  try {
    const response = await fetch(apiUrl(`/admin/users/${user.id}/access`), {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tier: editTier.value, manualAccessUntil })
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      modalError.value = body?.message || t('admin.saveError')
      return
    }
    user.subscriptionTier = editTier.value
    user.isManualAccess = editTier.value !== 'Free'
    user.manualAccessUntil = manualAccessUntil
    selectedUser.value = null
  } catch (error) {
    console.error('Error updating tier:', error)
    modalError.value = t('admin.saveError')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.admin-users-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  padding-top: 5rem;
}

.users-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.users-header h1 {
  margin: 0;
  font-size: 2rem;
  color: #1e293b;
}

.subtitle {
  margin: 0.5rem 0 0;
  color: #64748b;
  font-size: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s ease;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #64748b;
}

.users-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Filters */
.filters-section {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-input,
.filter-select {
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 0.9rem;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.filter-select {
  min-width: 150px;
}

.search-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Table */
.users-table-wrapper {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.users-table thead {
  background-color: #f8fafc;
}

.users-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #475569;
  border-bottom: 2px solid #e2e8f0;
}

.users-table td {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  color: #1e293b;
}

.users-table tbody tr:hover {
  background-color: #f8fafc;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
}

.role-badge,
.status-badge,
.tier-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}

.role-badge.admin {
  background-color: #e0e7ff;
  color: #3730a3;
}

.role-badge.user {
  background-color: #f0fdf4;
  color: #166534;
}

.status-badge.active {
  background-color: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background-color: #f3f4f6;
  color: #374151;
}

.status-badge.suspended {
  background-color: #fee2e2;
  color: #991b1b;
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

.btn-more {
  background-color: #f3f4f6;
  color: #374151;
}

.btn-more:hover {
  background-color: #e5e7eb;
}

.no-results {
  padding: 2rem;
  text-align: center;
  color: #64748b;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn-pagination {
  width: 36px;
  height: 36px;
  border: 1px solid #cbd5e1;
  background-color: white;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-pagination:hover:not(:disabled) {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.btn-pagination:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #64748b;
  font-size: 0.95rem;
}

/* User Statistics */
.user-statistics {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-statistics h2 {
  margin: 0 0 1.5rem;
  font-size: 1.3rem;
  color: #1e293b;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  padding: 1.5rem;
  background-color: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.stat-label {
  font-size: 0.85rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.75rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: bold;
  color: #1e293b;
  margin-bottom: 0.75rem;
}

.stat-trend,
.stat-info {
  font-size: 0.85rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-trend.positive {
  color: #10b981;
}

@media (max-width: 768px) {
  .users-header {
    flex-direction: column;
    gap: 1rem;
  }

  .filters-section {
    flex-direction: column;
  }

  .search-input {
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .users-table {
    font-size: 0.8rem;
  }

  .users-table th,
  .users-table td {
    padding: 0.75rem 0.5rem;
  }
}

/* Admin-granted access */
.grant-badge {
  display: inline-block;
  margin-left: 0.375rem;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.15);
  color: #b45309;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.modal .hint {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.modal input[type='date'] {
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 6px;
}

/* User modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  width: 90%;
  max-width: 480px;
}

.modal-header,
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-lg);
}

.modal-header {
  border-bottom: 1px solid var(--border);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.125rem;
}

.modal-footer {
  justify-content: flex-end;
  gap: var(--space-sm);
  border-top: 1px solid var(--border);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-muted);
}

.modal-body {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.user-details {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.5rem 1rem;
  margin: 0;
  font-size: 0.9375rem;
}

.user-details dt {
  color: var(--text-muted);
}

.user-details dd {
  margin: 0;
  font-weight: 600;
}

.modal .form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.modal select {
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 6px;
}

.modal .error-text {
  margin: 0;
  color: var(--danger);
  font-size: 0.875rem;
}

.modal .btn-primary,
.modal .btn-secondary {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.modal .btn-primary {
  background: var(--primary);
  color: white;
  border: none;
}

.modal .btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal .btn-secondary {
  background: white;
  color: var(--primary);
  border: 1px solid var(--border);
}
</style>
