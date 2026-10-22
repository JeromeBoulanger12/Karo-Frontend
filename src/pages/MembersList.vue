<template>
  <div class="members-container">
    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>{{ t('common.loading') || 'Chargement...' }}</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-container">
      <div class="error-message">
        <i class="mdi mdi-alert-circle"></i>
        {{ error }}
      </div>
      <button class="btn-retry" @click="loadMembers">{{ t('common.retry') || 'Réessayer' }}</button>
    </div>

    <!-- Main content -->
    <div v-else class="members-content">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ t('members.title') }}</h1>
          <p class="page-subtitle">{{ members.length }} {{ t('members.active_members').toLowerCase() }}</p>
        </div>
        <button v-if="canInvite" @click="showInviteModal = true" class="btn-create">
          <i class="mdi mdi-plus"></i>
          {{ t('members.invite_member') }}
        </button>
      </div>

      <!-- Members Section -->
      <section class="section">
        <h2 class="section-title">
          <i class="mdi mdi-account-multiple"></i>
          {{ t('members.active_members') }}
        </h2>

        <div v-if="members.length === 0" class="empty-state">
          <i class="mdi mdi-inbox-outline"></i>
          <p>{{ t('members.no_members') }}</p>
        </div>

        <div v-else class="table-card">
          <table class="modern-table">
            <thead>
              <tr>
                <th>{{ t('members.name') }}</th>
                <th>{{ t('members.email') }}</th>
                <th>{{ t('members.role') }}</th>
                <th v-if="canRemoveMembers">{{ t('members.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="member in members" :key="member.id">
                <td class="name-cell">
                  <div class="member-avatar">{{ getInitials(member) }}</div>
                  <span>{{ member.firstName }} {{ member.lastName }}</span>
                </td>
                <td>{{ member.email }}</td>
                <td>
                  <v-chip
                    :color="getRoleColor(member.role)"
                    label
                    small
                    class="role-chip"
                  >
                    {{ getRoleLabel(member.role) }}
                  </v-chip>
                </td>
                <td v-if="canRemoveMembers" class="actions-cell">
                  <button
                    v-if="currentUserId !== member.id && member.role !== 'Owner'"
                    @click="removeMember(member)"
                    class="btn-action btn-danger"
                  >
                    <i class="mdi mdi-trash-can"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Pending Invitations Section -->
      <section v-if="pendingInvitations.length > 0" class="section">
        <h2 class="section-title">
          <i class="mdi mdi-email-outline"></i>
          {{ t('members.pending_invitations') }}
        </h2>

        <div class="table-card">
          <table class="modern-table">
            <thead>
              <tr>
                <th>{{ t('members.email') }}</th>
                <th>{{ t('members.invited_on') }}</th>
                <th v-if="canInvite">{{ t('members.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="invitation in pendingInvitations" :key="invitation.id">
                <td>{{ invitation.email }}</td>
                <td>{{ formatDate(invitation.createdAt) }}</td>
                <td v-if="canInvite" class="actions-cell">
                  <button
                    @click="cancelInvitation(invitation)"
                    class="btn-action btn-danger"
                  >
                    <i class="mdi mdi-trash-can"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <!-- Invite Modal -->
    <div v-if="showInviteModal" class="modal-overlay" @click="showInviteModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>{{ t('members.invite_member') }}</h2>
          <button class="modal-close" @click="showInviteModal = false">
            <i class="mdi mdi-close"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>{{ t('members.email') }}</label>
            <input
              v-model="inviteEmail"
              type="email"
              placeholder="exemple@email.com"
              class="form-input"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showInviteModal = false">
            {{ t('common.cancel') }}
          </button>
          <button class="btn-primary" @click="sendInvitation" :disabled="!inviteEmail">
            {{ t('members.send_invitation') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { householdsAPI, type HouseholdMember, type PendingInvitation } from '../api/households'
import '../styles/dashboard.css'

const { t } = useI18n()

const members = ref<HouseholdMember[]>([])
const pendingInvitations = ref<PendingInvitation[]>([])
const loading = ref(true)
const error = ref('')
const showInviteModal = ref(false)
const inviteEmail = ref('')
const currentUserId = ref<string | null>(null)
const userRole = ref<string | null>(null)

const householdId = computed(() => localStorage.getItem('householdId') || '')

const canInvite = computed(() => userRole.value === 'Owner' || userRole.value === 'Admin')
const canRemoveMembers = computed(() => userRole.value === 'Owner')

const getRoleLabel = (role: string) => {
  return t(`members.role_${role.toLowerCase()}`)
}

const getRoleColor = (role: string) => {
  const colorMap: Record<string, string> = {
    owner: 'error',
    admin: 'warning',
    member: 'info',
    guest: 'grey'
  }
  return colorMap[role.toLowerCase()] || 'grey'
}

const getInitials = (member: HouseholdMember) => {
  const first = member.firstName?.charAt(0)?.toUpperCase() || ''
  const last = member.lastName?.charAt(0)?.toUpperCase() || ''
  return `${first}${last}` || 'U'
}

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('fr-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString))
}

const loadMembers = async () => {
  try {
    loading.value = true
    const response = await householdsAPI.getMembers(householdId.value)
    members.value = response.members
    pendingInvitations.value = response.pendingInvitations

    // Get current user's role
    const currentUser = members.value.find((m) => m.id === currentUserId.value)
    if (currentUser) {
      userRole.value = currentUser.role
    }

    error.value = ''
  } catch (err) {
    error.value = t('members.error_loading')
    console.error('Error loading members:', err)
  } finally {
    loading.value = false
  }
}

const sendInvitation = async () => {
  if (!inviteEmail.value) return

  try {
    await householdsAPI.inviteUser(householdId.value, inviteEmail.value)
    inviteEmail.value = ''
    showInviteModal.value = false
    await loadMembers()
  } catch (err) {
    error.value = t('members.error_inviting')
    console.error('Error sending invitation:', err)
  }
}

const removeMember = async (member: HouseholdMember) => {
  if (!confirm(t('members.confirm_remove', { name: member.firstName }))) {
    return
  }

  try {
    await householdsAPI.removeMember(householdId.value, member.id)
    await loadMembers()
  } catch (err) {
    error.value = t('members.error_removing')
    console.error('Error removing member:', err)
  }
}

const cancelInvitation = async (invitation: PendingInvitation) => {
  if (!confirm(t('members.confirm_cancel_invitation'))) {
    return
  }

  try {
    await householdsAPI.deleteInvitation(householdId.value, invitation.id)
    await loadMembers()
  } catch (err) {
    error.value = t('members.error_canceling')
    console.error('Error canceling invitation:', err)
  }
}

onMounted(() => {
  const userId = localStorage.getItem('userId')
  if (userId) {
    currentUserId.value = userId
  }
  loadMembers()
})
</script>

<style scoped>
.members-container {
  background: var(--surface);
  min-height: 100vh;
  padding: 2rem;
  padding-top: 5rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Loading & Error States */
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

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 8px;
  font-weight: 600;
}

.error-message i {
  font-size: 1.5rem;
}

.btn-retry {
  padding: 0.75rem 1.5rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-retry:hover {
  background: #2563eb;
}

/* Main Content */
.members-content {
  width: 100%;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
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

.btn-create {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-create:hover {
  background: #2563eb;
  transform: translateY(-2px);
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

.role-chip {
  text-transform: capitalize;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
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

/* Modal */
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
  animation: fadeIn var(--transition-fast);
}

.modal {
  background: var(--bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  width: 90%;
  max-width: 500px;
  animation: slideUp var(--transition-base);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border);
}

.modal-header h2 {
  font-size: var(--font-size-2xl);
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: var(--font-size-2xl);
  padding: 0;
  transition: all var(--transition-fast);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: var(--text-primary);
  background: var(--surface);
  border-radius: var(--radius-md);
}

.modal-body {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.modal-footer {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-lg);
  border-top: 1px solid var(--border);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.form-group label {
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.form-input {
  padding: var(--space-md);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  transition: border-color var(--transition-fast);
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: var(--space-md) var(--space-lg);
  border: none;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--surface);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  background: var(--border);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 640px) {
  .members-container {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
  }

  .btn-create {
    width: 100%;
    justify-content: center;
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

  .modal {
    width: 95%;
  }
}
</style>
