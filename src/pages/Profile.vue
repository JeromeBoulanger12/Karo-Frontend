<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../composables/useAuth'
import client from '../api/client'
import '../styles/dashboard.css'

const { t } = useI18n()
const { user } = useAuth()

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

// Subscriptions and orders
const subscriptions = ref<any[]>([])
const orders = ref<any[]>([])
const loadingSubscriptions = ref(false)

const loadSubscriptionsAndOrders = async () => {
  loadingSubscriptions.value = true
  try {
    // Fetch current subscription
    const subResponse = await client.get('/subscriptions/my-subscription')
    if (subResponse.data) {
      subscriptions.value = [subResponse.data]
    }
  } catch (err) {
    console.error('Error loading subscription:', err)
    // If no subscription, that's ok - user is on free tier
  } finally {
    loadingSubscriptions.value = false
  }
}

onMounted(async () => {
  if (user.value) {
    email.value = user.value.email
    firstName.value = user.value.email.split('@')[0]
    lastName.value = ''
    await loadSubscriptionsAndOrders()
  }
})

const handleSave = async () => {
  loading.value = true
  error.value = null
  success.value = null

  try {
    const response = await client.put('/auth/profile', {
      firstName: firstName.value,
      lastName: lastName.value
    })

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

            <button type="submit" class="btn-primary" :disabled="loading">
              {{ loading ? t('common.loading') : t('common.save') }}
            </button>
          </form>
        </div>
      </div>

      <!-- Subscription Card -->
      <div class="card">
        <div class="card-header">
          <i class="mdi mdi-star"></i>
          <h2>{{ t('profile.subscription') || 'Abonnement' }}</h2>
        </div>

        <div class="card-body">
          <v-progress-linear
            v-if="loadingSubscriptions"
            indeterminate
          ></v-progress-linear>

          <div v-else-if="subscriptions.length > 0" class="subscription-list">
            <div v-for="sub in subscriptions" :key="sub.id" class="subscription-item">
              <div class="subscription-name">{{ sub.tier || sub.planName || 'Plan' }}</div>
              <div class="subscription-details">
                <div class="detail-row">
                  <strong>{{ t('common.status') || 'Statut' }}:</strong>
                  <v-chip
                    :color="sub.status === 'active' ? 'success' : 'warning'"
                    label
                    small
                  >
                    {{ sub.status || 'active' }}
                  </v-chip>
                </div>
                <div v-if="sub.amount" class="detail-row">
                  <strong>{{ t('common.amount') || 'Montant' }}:</strong>
                  <span>{{ sub.amount }}{{ sub.currency || 'CAD' }} / {{ sub.billingPeriod || 'month' }}</span>
                </div>
                <div v-if="sub.renewalDate" class="detail-row">
                  <strong>{{ t('profile.renewal') || 'Renouvellement' }}:</strong>
                  <span>{{ new Date(sub.renewalDate).toLocaleDateString('fr-CA') }}</span>
                </div>
                <div v-if="sub.startDate" class="detail-row">
                  <strong>{{ t('profile.startDate') || 'Date de début' }}:</strong>
                  <span>{{ new Date(sub.startDate).toLocaleDateString('fr-CA') }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="empty-placeholder">
            <i class="mdi mdi-inbox-outline"></i>
            <p>{{ t('profile.noSubscriptions') || 'Pas d\'abonnement actif' }}</p>
            <small style="display: block; margin-top: 0.5rem; color: var(--text-muted);">Vous êtes sur le plan gratuit</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Purchase History Section -->
    <section class="section">
      <h2 class="section-title">
        <i class="mdi mdi-history"></i>
        {{ t('profile.purchases') || 'Historique d\'achats' }}
      </h2>

      <div v-if="loadingSubscriptions" class="loading-state">
        <v-progress-linear indeterminate></v-progress-linear>
      </div>

      <div v-else-if="orders.length > 0" class="table-card">
        <table class="modern-table">
          <thead>
            <tr>
              <th>{{ t('profile.date') || 'Date' }}</th>
              <th>{{ t('profile.description') || 'Description' }}</th>
              <th>{{ t('profile.amount') || 'Montant' }}</th>
              <th>{{ t('profile.status') || 'Statut' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id">
              <td>{{ new Date(order.createdAt).toLocaleDateString('fr-CA') }}</td>
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
        <p>{{ t('profile.noPurchases') || 'Pas de transactions' }}</p>
      </div>
    </section>
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
