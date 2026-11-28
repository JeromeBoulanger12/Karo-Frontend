<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../composables/useAuth'
import client from '../api/client'
import { userSettingsApi, listTimeZones } from '../api/userSettings'
import SubscriptionPlanCard from '../components/SubscriptionPlanCard.vue'
import '../styles/dashboard.css'

const { t, locale } = useI18n()
const { user, clearLocalSession, changePassword } = useAuth()

// Password change: the current password is asked again
const currentPassword = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')
const changingPassword = ref(false)
const passwordError = ref<string | null>(null)
const passwordSuccess = ref(false)

const passwordMismatch = computed(() =>
  confirmNewPassword.value.length > 0 && newPassword.value !== confirmNewPassword.value
)

const handleChangePassword = async () => {
  if (passwordMismatch.value) return
  changingPassword.value = true
  passwordError.value = null
  passwordSuccess.value = false

  const code = await changePassword(currentPassword.value, newPassword.value)
  if (code === 'invalid_current_password') {
    passwordError.value = t('passwordReset.wrongCurrentPassword')
  } else if (code === 'same_password') {
    passwordError.value = t('passwordReset.samePassword')
  } else if (code === 'weak_password') {
    passwordError.value = t('passwordReset.weakPassword')
  } else if (code) {
    passwordError.value = t('passwordReset.updateError')
  } else {
    passwordSuccess.value = true
    currentPassword.value = ''
    newPassword.value = ''
    confirmNewPassword.value = ''
  }

  changingPassword.value = false
}

// Account deletion
const showDeleteDialog = ref(false)
const deleteConfirmEmail = ref('')
const deleting = ref(false)
const deleteError = ref<string | null>(null)

const canConfirmDelete = computed(() =>
  deleteConfirmEmail.value.trim().toLowerCase() === (user.value?.email ?? '').toLowerCase()
)

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

// Time zone and notifications
const subscriptionFeatures = inject('subscriptionFeatures', ref({ allowPlanning: false }))
const userPreferences = inject<{ value: { notificationsEnabled: boolean } }>('userPreferences', ref({ notificationsEnabled: true }))
const canUseNotifications = computed(() => !!subscriptionFeatures.value.allowPlanning)
const timeZones = listTimeZones()
const timeZoneId = ref('America/Toronto')
const notificationsEnabled = ref(true)

// Orders (no purchase history is stored yet)
const orders = ref<any[]>([])
const loadingSubscriptions = ref(false)

const loadProfile = async () => {
  try {
    const response = await userSettingsApi.getProfile()
    const profile = response.data
    email.value = profile.email
    firstName.value = profile.firstName
    lastName.value = profile.lastName
    timeZoneId.value = profile.timeZoneId
    notificationsEnabled.value = profile.notificationsEnabled
  } catch (err) {
    console.error('Error loading profile:', err)
  }
}

onMounted(async () => {
  if (user.value) {
    email.value = user.value.email
    await loadProfile()
  }
})

const handleSave = async () => {
  loading.value = true
  error.value = null
  success.value = null

  try {
    await userSettingsApi.updateName(firstName.value, lastName.value)
    // On a free plan the switch is disabled, so this sends back the value the user already has
    await userSettingsApi.updatePreferences(timeZoneId.value, notificationsEnabled.value)
    userPreferences.value.notificationsEnabled = notificationsEnabled.value

    success.value = t('profile.updateSuccess')
    setTimeout(() => {
      success.value = null
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('profile.updateError')
    console.error('Profile update error:', err)
  } finally {
    loading.value = false
  }
}

// Downloads everything the app holds about the user, as a JSON file
const downloadingData = ref(false)

const downloadMyData = async () => {
  downloadingData.value = true
  error.value = null
  try {
    const response = await client.get('/account/export', { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = t('profilePage.data.exportFileName')
    link.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    error.value = t('profile.dataError')
    console.error('Data export error:', err)
  } finally {
    downloadingData.value = false
  }
}

const openDeleteDialog = () => {
  deleteConfirmEmail.value = ''
  deleteError.value = null
  showDeleteDialog.value = true
}

const confirmDeleteAccount = async () => {
  if (!canConfirmDelete.value) return

  deleting.value = true
  deleteError.value = null

  try {
    await client.post('/account/delete', { confirmEmail: deleteConfirmEmail.value.trim() })
    await clearLocalSession()
  } catch (err: any) {
    const code = err?.response?.data?.error
    if (code === 'billing_cancel_failed') {
      deleteError.value = t('profile.deleteAccountErrorBilling')
    } else if (code === 'auth_not_configured') {
      deleteError.value = t('profile.deleteAccountErrorNotConfigured')
    } else if (code === 'auth_identity_not_removed') {
      deleteError.value = t('profile.deleteAccountErrorPartial')
    } else {
      deleteError.value = t('profile.deleteAccountErrorGeneric')
    }
    console.error('Account deletion failed:', err)
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="profile-container">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('profile.title') }}</h1>
        <p class="page-subtitle">{{ user?.email }}</p>
      </div>
      <router-link to="/faq" class="faq-link">
        <i class="mdi mdi-help-circle-outline"></i>
        {{ t('faq.link') }}
      </router-link>
    </div>

    <!-- Profile Form & Subscription Section -->
    <div class="grid-2">
      <!-- Profile Card -->
      <div class="card">
        <div class="card-header">
          <i class="mdi mdi-account"></i>
          <h2>{{ t('profile.title') }}</h2>
        </div>

        <div class="card-body">
          <v-alert v-if="success" type="success" class="mb-4">
            {{ success }}
          </v-alert>

          <v-alert v-if="error" type="error" class="mb-4">
            {{ error }}
          </v-alert>

          <form @submit.prevent="handleSave" class="form">
            <div class="form-group">
              <label>{{ t('auth.email') }}</label>
              <input v-model="email" type="email" disabled class="form-input disabled" />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>{{ t('common.firstName') }}</label>
                <input v-model="firstName" type="text" class="form-input" />
              </div>
              <div class="form-group">
                <label>{{ t('common.lastName') }}</label>
                <input v-model="lastName" type="text" class="form-input" />
              </div>
            </div>

            <h3 class="form-section-title">{{ t('profile.preferencesTitle') }}</h3>

            <div class="form-group">
              <label>{{ t('profile.timeZone') }}</label>
              <select v-model="timeZoneId" class="form-input">
                <option v-for="zone in timeZones" :key="zone" :value="zone">{{ zone }}</option>
              </select>
              <small class="form-hint">{{ t('profile.timeZoneHint') }}</small>
            </div>

            <div class="form-group">
              <label class="checkbox-row">
                <input v-model="notificationsEnabled" type="checkbox" :disabled="!canUseNotifications" />
                {{ t('profile.notifications') }}
              </label>
              <small v-if="!canUseNotifications" class="form-hint">{{ t('profile.notificationsPaidOnly') }}</small>
            </div>

            <button type="submit" class="btn-primary" :disabled="loading">
              {{ loading ? t('common.loading') : t('common.save') }}
            </button>
          </form>
        </div>
      </div>

      <!-- Subscription Card: current plan, Stripe checkout and customer portal -->
      <SubscriptionPlanCard />
    </div>

    <!-- Password change -->
    <section class="section">
      <h2 class="section-title">
        <i class="mdi mdi-lock-reset"></i>
        {{ t('passwordReset.changeTitle') }}
      </h2>
      <div class="card">
        <div class="card-body">
          <v-alert v-if="passwordSuccess" type="success" class="mb-4">
            {{ t('passwordReset.updated') }}
          </v-alert>

          <v-alert v-if="passwordError" type="error" class="mb-4">
            {{ passwordError }}
          </v-alert>

          <form class="form" @submit.prevent="handleChangePassword">
            <div class="form-group">
              <label>{{ t('passwordReset.currentPassword') }}</label>
              <input
                v-model="currentPassword"
                type="password"
                autocomplete="current-password"
                required
                class="form-input"
                :disabled="changingPassword"
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>{{ t('passwordReset.newPassword') }}</label>
                <input
                  v-model="newPassword"
                  type="password"
                  autocomplete="new-password"
                  required
                  class="form-input"
                  :disabled="changingPassword"
                />
              </div>
              <div class="form-group">
                <label>{{ t('auth.confirmPassword') }}</label>
                <input
                  v-model="confirmNewPassword"
                  type="password"
                  autocomplete="new-password"
                  required
                  class="form-input"
                  :disabled="changingPassword"
                />
                <small v-if="passwordMismatch" class="form-hint password-mismatch">{{ t('auth.passwordsMustMatch') }}</small>
              </div>
            </div>

            <button type="submit" class="btn-primary" :disabled="changingPassword || passwordMismatch">
              {{ changingPassword ? t('common.loading') : t('passwordReset.save') }}
            </button>
          </form>
        </div>
      </div>
    </section>

    <!-- Purchase History Section -->
    <section class="section">
      <h2 class="section-title">
        <i class="mdi mdi-history"></i>
        {{ t('profile.purchases') }}
      </h2>

      <div v-if="loadingSubscriptions" class="loading-state">
        <v-progress-linear indeterminate></v-progress-linear>
      </div>

      <div v-else-if="orders.length > 0" class="table-card">
        <table class="modern-table">
          <thead>
            <tr>
              <th>{{ t('profile.date') }}</th>
              <th>{{ t('profile.description') }}</th>
              <th>{{ t('profile.amount') }}</th>
              <th>{{ t('profile.status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id">
              <td>{{ new Date(order.createdAt).toLocaleDateString(locale) }}</td>
              <td>{{ order.planName || order.description }}</td>
              <td class="amount">{{ order.amount }}{{ order.currency || 'CAD' }}</td>
              <td>
                <v-chip
                  :color="order.status === 'completed' ? 'success' : order.status === 'pending' ? 'warning' : 'error'"
                  label
                  small
                >
                  {{ order.status }}
                </v-chip>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-placeholder">
        <i class="mdi mdi-inbox-outline"></i>
        <p>{{ t('profile.noPurchases') }}</p>
      </div>
    </section>

    <!-- Your data: a copy of what Karo holds about you (Loi 25) -->
    <section class="section">
      <h2 class="section-title">{{ t('profile.dataTitle') }}</h2>
      <div class="card">
        <div class="card-body">
          <p class="form-hint">{{ t('profile.dataHint') }}</p>
          <button type="button" class="btn-primary" :disabled="downloadingData" @click="downloadMyData">
            {{ downloadingData ? t('common.loading') : t('profile.dataDownload') }}
          </button>
        </div>
      </div>
    </section>

    <!-- Danger Zone: account deletion -->
    <section class="section danger-zone">
      <h2 class="section-title">
        <i class="mdi mdi-alert-octagon"></i>
        {{ t('profile.deleteAccountTitle') }}
      </h2>

      <div class="card danger-card">
        <div class="card-body">
          <p class="danger-text">{{ t('profile.deleteAccountIntro') }}</p>
          <p class="danger-text">{{ t('profile.deleteAccountWhatDeleted') }}</p>
          <p class="danger-text">{{ t('profile.deleteAccountWhatKept') }}</p>
          <p class="danger-text">{{ t('profile.deleteAccountSharedWarning') }}</p>
          <button type="button" class="btn-danger" @click="openDeleteDialog">
            {{ t('profile.deleteAccountButton') }}
          </button>
        </div>
      </div>
    </section>

    <!-- Delete confirmation dialog -->
    <div v-if="showDeleteDialog" class="modal-overlay" @click.self="!deleting && (showDeleteDialog = false)">
      <div class="modal-box">
        <h3>{{ t('profile.deleteAccountTitle') }}</h3>
        <p class="danger-text">{{ t('profile.deleteAccountIntro') }}</p>

        <label class="confirm-label">
          {{ t('profile.deleteAccountConfirmLabel', { email: user?.email }) }}
          <input v-model="deleteConfirmEmail" type="email" class="form-input" :disabled="deleting" />
        </label>

        <v-alert v-if="deleteError" type="error" class="mb-4">
          {{ deleteError }}
        </v-alert>

        <div class="modal-actions">
          <button type="button" class="btn-secondary" :disabled="deleting" @click="showDeleteDialog = false">
            {{ t('profile.deleteAccountCancel') }}
          </button>
          <button
            type="button"
            class="btn-danger"
            :disabled="!canConfirmDelete || deleting"
            @click="confirmDeleteAccount"
          >
            {{ deleting ? t('common.loading') : t('profile.deleteAccountConfirmButton') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  background: var(--surface);
  min-height: 100vh;
  padding: 2rem;
  padding-top: 5rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  margin-bottom: 2.5rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  font-size: 0.95rem;
  color: var(--text-muted);
  margin: 0;
}

/* Grid Layout */
.grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-bottom: 2.5rem;
}

/* Card */
.card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.card-header i {
  font-size: 1.25rem;
  color: var(--primary);
}

.card-header h2 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.card-body {
  padding: 1.5rem;
  flex: 1;
}

/* Form */
.form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 1.5rem 0 0.25rem;
}

.form-hint {
  display: block;
  color: #666666;
  margin-top: 0.25rem;
}

.password-mismatch {
  color: #b91c1c;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.form-input {
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.95rem;
  transition: border-color var(--transition-fast);
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input.disabled {
  background: var(--surface);
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-primary {
  align-self: flex-start;
  padding: 0.75rem 1.5rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Subscription List */
.subscription-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.subscription-item {
  padding: 1rem;
  background: var(--surface);
  border-radius: 6px;
  border: 1px solid var(--border);
}

.subscription-name {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.subscription-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.detail-row strong {
  color: var(--text-primary);
  min-width: 120px;
}

/* Section */
.section {
  margin-bottom: 2.5rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-title i {
  font-size: 1.5rem;
  color: var(--primary);
}

/* Table Card */
.table-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border);
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.modern-table thead {
  background: var(--surface);
  border-bottom: 2px solid var(--border);
}

.modern-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: var(--text-muted);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.modern-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--border);
  color: var(--text-primary);
}

.modern-table tbody tr:hover {
  background: var(--surface);
}

.amount {
  font-weight: 600;
  color: var(--primary);
}

/* Empty State */
.empty-placeholder {
  text-align: center;
  padding: 2rem;
  background: var(--surface);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.empty-placeholder i {
  font-size: 2.5rem;
  color: var(--border);
  margin-bottom: 0.5rem;
  display: block;
}

.empty-placeholder p {
  color: var(--text-muted);
  margin: 0;
}

/* Loading State */
.loading-state {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid var(--border);
}

/* Danger zone */
.danger-zone {
  margin-top: 1rem;
}

.danger-card {
  border-color: #fecaca;
}

.danger-text {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin: 0 0 0.75rem 0;
}

.btn-danger {
  padding: 0.75rem 1.5rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: white;
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-box {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 480px;
  width: 100%;
}

.modal-box h3 {
  margin: 0 0 0.75rem 0;
  color: var(--text-primary);
}

.confirm-label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

/* Responsive */
@media (max-width: 768px) {
  .profile-container {
    padding: 1rem;
  }

  .grid-2 {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .modern-table {
    font-size: 0.85rem;
  }

  .modern-table th,
  .modern-table td {
    padding: 0.75rem 0.5rem;
  }

  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .detail-row strong {
    min-width: auto;
  }
}
</style>
