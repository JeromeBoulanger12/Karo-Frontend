<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import client from '../api/client'
import '../styles/dashboard.css'

const { t } = useI18n()

const householdId = ref('')
const members = ref<any[]>([])
const pendingInvitations = ref<any[]>([])
const receivedInvitations = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const inviteEmail = ref('')
const inviteLoading = ref(false)

onMounted(async () => {
  await loadMembers()
})

const loadMembers = async () => {
  loading.value = true
  error.value = null

  try {
    const householdIdFromStorage = localStorage.getItem('householdId')
    if (!householdIdFromStorage) {
      error.value = 'Household not found'
      return
    }

    householdId.value = householdIdFromStorage
    const [membersResp, invitationsResp] = await Promise.all([
      client.get(`/households/${householdId.value}/members`),
      client.get('/households/invitations/pending')
    ])

    members.value = membersResp.data.members
    pendingInvitations.value = membersResp.data.pendingInvitations
    receivedInvitations.value = invitationsResp.data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load members'
  } finally {
    loading.value = false
  }
}

const acceptInvitation = async (invitationId: string) => {
  try {
    const response = await client.post(`/households/invitations/${invitationId}/accept`)
    // Update localStorage with new householdId from backend
    if (response.data.householdId) {
      localStorage.setItem('householdId', response.data.householdId)
    }
    success.value = 'Invitation accepted! Reloading...'
    setTimeout(() => location.reload(), 1000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to accept invitation'
  }
}

const handleInvite = async () => {
  if (!inviteEmail.value) return

  inviteLoading.value = true
  error.value = null
  success.value = null

  try {
    await client.post(`/households/${householdId.value}/invitations`, {
      email: inviteEmail.value
    })

    success.value = t('household.invitationSent', { email: inviteEmail.value })
    inviteEmail.value = ''

    await loadMembers()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to send invitation'
  } finally {
    inviteLoading.value = false
  }
}

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('fr-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date))
}

const getInitials = (member: any) => {
  const first = member.firstName?.charAt(0)?.toUpperCase() || ''
  const last = member.lastName?.charAt(0)?.toUpperCase() || ''
  return `${first}${last}` || 'U'
}

const deleteInvitation = async (invitationId: string, email: string) => {
  if (!window.confirm(t('household.confirmDeleteInvitation', { email }))) {
    return
  }

  try {
    await client.delete(`/households/${householdId.value}/invitations/${invitationId}`)
    success.value = t('household.invitationDeleted', { email })
    error.value = null
    await loadMembers()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete invitation'
  }
}
</script>

<template>
  <div class="household-container">
    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>{{ t('common.loading') || 'Chargement...' }}</p>
    </div>

    <!-- Main content -->
    <div v-else class="household-content">
      <!-- Alerts -->
      <div v-if="error" class="alert-error">
        <i class="mdi mdi-alert-circle"></i>
        {{ error }}
      </div>

      <div v-if="success" class="alert-success">
        <i class="mdi mdi-check-circle"></i>
        {{ success }}
      </div>

      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ t('household.title') }}</h1>
          <p class="page-subtitle">{{ t('household.members') }} - {{ members.length }}</p>
        </div>
      </div>

      <!-- Invite Section -->
      <section class="section">
        <h2 class="section-title">
          <i class="mdi mdi-email-plus"></i>
          {{ t('household.inviteSomeone') }}
        </h2>

        <div class="card">
          <form @submit.prevent="handleInvite" class="form">
            <div class="form-group">
              <label>{{ t('household.emailAddress') }}</label>
              <input
                v-model="inviteEmail"
                type="email"
                placeholder="exemple@email.com"
                class="form-input"
                required
              />
            </div>

            <button type="submit" class="btn-primary" :disabled="!inviteEmail || inviteLoading">
              {{ inviteLoading ? t('common.loading') : t('household.sendInvitation') }}
            </button>
          </form>
        </div>
      </section>

      <!-- Members Section -->
      <section v-if="members.length > 0" class="section">
        <h2 class="section-title">
          <i class="mdi mdi-account-multiple"></i>
          {{ t('household.members') }} ({{ members.length }})
        </h2>

        <div class="table-card">
          <table class="modern-table">
            <thead>
              <tr>
                <th>{{ t('common.name') }}</th>
                <th>{{ t('auth.email') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="member in members" :key="member.id">
                <td class="name-cell">
                  <div class="member-avatar">{{ getInitials(member) }}</div>
                  <span>{{ member.firstName }} {{ member.lastName }}</span>
                </td>
                <td>{{ member.email }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Pending Invitations Section -->
      <section v-if="pendingInvitations.length > 0" class="section">
        <h2 class="section-title">
          <i class="mdi mdi-email-outline"></i>
          {{ t('household.pendingInvitations') }} ({{ pendingInvitations.length }})
        </h2>

        <div class="table-card">
          <table class="modern-table">
            <thead>
              <tr>
                <th>{{ t('auth.email') }}</th>
                <th>{{ t('household.sent') }}</th>
                <th class="actions-header">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="invite in pendingInvitations" :key="invite.id">
                <td>{{ invite.email }}</td>
                <td>{{ formatDate(invite.createdAt) }}</td>
                <td class="actions-cell">
                  <button
                    @click="deleteInvitation(invite.id, invite.email)"
                    class="btn-action btn-danger"
                    :title="t('household.deleteInvitation')"
                  >
                    <i class="mdi mdi-trash-can"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Received Invitations Section -->
      <section v-if="receivedInvitations.length > 0" class="section">
        <h2 class="section-title">
          <i class="mdi mdi-email-receive"></i>
          Invitations reçues ({{ receivedInvitations.length }})
        </h2>

        <div class="invitations-grid">
          <div v-for="invitation in receivedInvitations" :key="invitation.id" class="invitation-card">
            <div class="invitation-header">
              <i class="mdi mdi-email"></i>
              <span class="invitation-sender">{{ invitation.invitedByEmail }}</span>
            </div>
            <div class="invitation-body">
              <p class="invitation-date">
                <i class="mdi mdi-calendar"></i>
                {{ formatDate(invitation.createdAt) }}
              </p>
            </div>
            <div class="invitation-footer">
              <button
                @click="acceptInvitation(invitation.id)"
                class="btn-accept"
              >
                <i class="mdi mdi-check"></i>
                Accepter
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Empty State -->
      <section v-if="members.length === 0 && pendingInvitations.length === 0" class="section">
        <div class="empty-state">
          <i class="mdi mdi-inbox-outline"></i>
          <p>{{ t('household.noMembers') }}</p>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.household-container {
  background: var(--surface);
  min-height: 100vh;
  padding: 2rem;
  padding-top: 5rem;
  max-width: 900px;
  margin: 0 auto;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Main Content */
.household-content {
  width: 100%;
}

/* Alerts */
.alert-error,
.alert-success {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-weight: 500;
}

.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.alert-error i {
  font-size: 1.25rem;
}

.alert-success {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.alert-success i {
  font-size: 1.25rem;
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

/* Card */
.card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border);
}

/* Form */
.form {
  display: flex;
  flex-direction: column;
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

.name-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.member-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.actions-header {
  text-align: center;
}

.actions-cell {
  display: flex;
  justify-content: center;
}

.btn-action {
  width: 32px;
  height: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.btn-action.btn-danger {
  color: #dc2626;
  background: #fee2e2;
}

.btn-action.btn-danger:hover {
  background: #fecaca;
  color: #991b1b;
}

/* Invitations Grid */
.invitations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.invitation-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid var(--border);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all 0.3s ease;
}

.invitation-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  border-color: var(--primary);
}

.invitation-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.invitation-header i {
  font-size: 1.25rem;
  color: var(--primary);
}

.invitation-sender {
  font-weight: 600;
  color: var(--text-primary);
  word-break: break-all;
}

.invitation-body {
  flex: 1;
}

.invitation-date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0;
}

.invitation-date i {
  font-size: 1rem;
}

.invitation-footer {
  display: flex;
  gap: 0.5rem;
}

.btn-accept {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.btn-accept:hover {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  background: white;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.empty-state i {
  font-size: 3rem;
  color: var(--border);
  margin-bottom: 1rem;
  display: block;
}

.empty-state p {
  color: var(--text-muted);
  margin: 0;
}

/* Responsive */
@media (max-width: 640px) {
  .household-container {
    padding: 1rem;
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

  .name-cell {
    flex-direction: column;
  }

  .invitations-grid {
    grid-template-columns: 1fr;
  }

  .form {
    flex-direction: column;
  }

  .btn-primary {
    width: 100%;
  }
}
</style>
