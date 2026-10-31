<template>
  <div class="page-container">
    <div class="admin-header">
      <h1>{{ t('admin.tier_configurations') }}</h1>
      <p class="subtitle">{{ t('admin.tier_configurations_subtitle') }}</p>
    </div>

    <div class="admin-section">
      <div class="section-header">
        <h2>{{ t('admin.manage_pricing_limits') }}</h2>
        <button class="btn btn-primary" @click="showCreateModal = true">
          <i class="fas fa-plus"></i> {{ t('admin.new_tier') }}
        </button>
      </div>

      <div v-if="loading" class="loading">
        <i class="fas fa-spinner fa-spin"></i> {{ t('common.loading') }}...
      </div>

      <div v-else-if="tiers.length === 0" class="empty-state">
        <p>{{ t('admin.no_tier_configurations') }}</p>
      </div>

      <div v-else class="tiers-grid">
        <div v-for="tier in tiers" :key="tier.id" class="tier-card">
          <div class="tier-header">
            <h3>{{ tier.tier }}</h3>
            <span class="badge" :class="{ 'badge-active': tier.isActive, 'badge-inactive': !tier.isActive }">
              {{ tier.isActive ? t('common.active') : t('common.inactive') }}
            </span>
          </div>

          <div class="tier-content">
            <div class="pricing-section">
              <h4>{{ t('admin.pricing') }}</h4>
              <div class="form-group">
                <label>{{ t('admin.monthly_price') }}</label>
                <input
                  v-model.number="tier.monthlyPrice"
                  type="number"
                  step="0.01"
                  :disabled="editingId !== tier.id"
                  class="form-control"
                />
              </div>
              <div class="form-group">
                <label>{{ t('admin.annual_price') }}</label>
                <input
                  v-model.number="tier.annualPrice"
                  type="number"
                  step="0.01"
                  :disabled="editingId !== tier.id"
                  class="form-control"
                />
              </div>
            </div>

            <div class="limits-section">
              <h4>{{ t('admin.limits_unlimited') }}</h4>
              <div class="form-group">
                <label>{{ t('admin.max_accounts') }}</label>
                <input
                  v-model.number="tier.maxAccounts"
                  type="number"
                  :disabled="editingId !== tier.id"
                  class="form-control"
                />
              </div>
              <div class="form-group">
                <label>{{ t('admin.max_envelopes') }}</label>
                <input
                  v-model.number="tier.maxEnvelopes"
                  type="number"
                  :disabled="editingId !== tier.id"
                  class="form-control"
                />
              </div>
              <div class="form-group">
                <label>{{ t('admin.max_paycheck_jobs') }}</label>
                <input
                  v-model.number="tier.maxPaycheckJobs"
                  type="number"
                  :disabled="editingId !== tier.id"
                  class="form-control"
                />
              </div>
              <div class="form-group">
                <label>{{ t('admin.max_shared_households') }}</label>
                <input
                  v-model.number="tier.maxSharedHouseholds"
                  type="number"
                  :disabled="editingId !== tier.id"
                  class="form-control"
                />
              </div>
            </div>

            <div class="features-section">
              <h4>{{ t('admin.features') }}</h4>
              <div class="checkbox-group">
                <label>
                  <input
                    v-model="tier.allowSharedExpenses"
                    type="checkbox"
                    :disabled="editingId !== tier.id"
                  />
                  {{ t('admin.shared_expenses') }}
                </label>
                <label>
                  <input
                    v-model="tier.allowAdvancedReporting"
                    type="checkbox"
                    :disabled="editingId !== tier.id"
                  />
                  {{ t('admin.advanced_reporting') }}
                </label>
                <label>
                  <input
                    v-model="tier.allowCustomCategories"
                    type="checkbox"
                    :disabled="editingId !== tier.id"
                  />
                  {{ t('admin.custom_categories') }}
                </label>
                <label>
                  <input
                    v-model="tier.prioritySupport"
                    type="checkbox"
                    :disabled="editingId !== tier.id"
                  />
                  {{ t('admin.priority_support') }}
                </label>
                <label>
                  <input
                    v-model="tier.allowMembers"
                    type="checkbox"
                    :disabled="editingId !== tier.id"
                  />
                  {{ t('admin.members_access') }}
                </label>
                <label>
                  <input
                    v-model="tier.allowHousehold"
                    type="checkbox"
                    :disabled="editingId !== tier.id"
                  />
                  {{ t('admin.household_access') }}
                </label>
              </div>
            </div>

            <div class="description-section">
              <h4>{{ t('admin.description') }}</h4>
              <textarea
                v-model="tier.description"
                :disabled="editingId !== tier.id"
                class="form-control"
                rows="2"
              ></textarea>
            </div>
          </div>

          <div class="tier-actions">
            <button
              v-if="editingId !== tier.id"
              class="btn btn-sm btn-secondary"
              @click="startEdit(tier)"
            >
              <i class="fas fa-edit"></i> {{ t('common.edit') }}
            </button>
            <button
              v-else
              class="btn btn-sm btn-success"
              @click="saveEdit(tier)"
            >
              <i class="fas fa-check"></i> {{ t('common.save') }}
            </button>
            <button
              v-if="editingId === tier.id"
              class="btn btn-sm btn-secondary"
              @click="cancelEdit"
            >
              <i class="fas fa-times"></i> {{ t('common.cancel') }}
            </button>
            <button
              class="btn btn-sm btn-danger"
              @click="deleteTier(tier)"
              v-if="tier.isActive"
            >
              <i class="fas fa-trash"></i> {{ t('admin.deactivate') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create New Tier Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ t('admin.new_tier') }}</h2>
          <button @click="showCreateModal = false" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Tier Name</label>
            <select v-model="newTier.tier" class="form-control">
              <option value="">{{ t('common.select') }}...</option>
              <option value="Startup">Startup</option>
              <option value="Professional">Professional</option>
              <option value="Enterprise">Enterprise</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <div class="form-group">
            <label>{{ t('admin.monthly_price') }}</label>
            <input v-model.number="newTier.monthlyPrice" type="number" step="0.01" class="form-control" />
          </div>

          <div class="form-group">
            <label>{{ t('admin.annual_price') }}</label>
            <input v-model.number="newTier.annualPrice" type="number" step="0.01" class="form-control" />
          </div>

          <div class="form-group">
            <label>{{ t('admin.description') }}</label>
            <textarea v-model="newTier.description" class="form-control" rows="3"></textarea>
          </div>

          <h3>{{ t('admin.limits_unlimited') }}</h3>
          <div class="form-row">
            <div class="form-group">
              <label>{{ t('admin.max_accounts') }}</label>
              <input v-model.number="newTier.maxAccounts" type="number" class="form-control" />
            </div>
            <div class="form-group">
              <label>{{ t('admin.max_envelopes') }}</label>
              <input v-model.number="newTier.maxEnvelopes" type="number" class="form-control" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>{{ t('admin.max_paycheck_jobs') }}</label>
              <input v-model.number="newTier.maxPaycheckJobs" type="number" class="form-control" />
            </div>
            <div class="form-group">
              <label>{{ t('admin.max_shared_households') }}</label>
              <input v-model.number="newTier.maxSharedHouseholds" type="number" class="form-control" />
            </div>
          </div>

          <h3>{{ t('admin.features') }}</h3>
          <div class="checkbox-group">
            <label>
              <input v-model="newTier.allowSharedExpenses" type="checkbox" />
              {{ t('admin.shared_expenses') }}
            </label>
            <label>
              <input v-model="newTier.allowAdvancedReporting" type="checkbox" />
              {{ t('admin.advanced_reporting') }}
            </label>
            <label>
              <input v-model="newTier.allowCustomCategories" type="checkbox" />
              {{ t('admin.custom_categories') }}
            </label>
            <label>
              <input v-model="newTier.prioritySupport" type="checkbox" />
              {{ t('admin.priority_support') }}
            </label>
            <label>
              <input v-model="newTier.allowMembers" type="checkbox" />
              {{ t('admin.members_access') }}
            </label>
            <label>
              <input v-model="newTier.allowHousehold" type="checkbox" />
              {{ t('admin.household_access') }}
            </label>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showCreateModal = false">{{ t('common.cancel') }}</button>
          <button class="btn btn-primary" @click="createTier">{{ t('admin.new_tier') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { apiUrl } from '../api/client'

const { t } = useI18n()

interface SubscriptionTier {
  id: string
  tier: string
  monthlyPrice: number
  annualPrice: number
  maxAccounts: number
  maxEnvelopes: number
  maxPaycheckJobs: number
  maxSharedHouseholds: number
  allowSharedExpenses: boolean
  allowAdvancedReporting: boolean
  allowCustomCategories: boolean
  prioritySupport: boolean
  allowMembers: boolean
  allowHousehold: boolean
  description: string
  isActive: boolean
  updatedAt: string
}

const tiers = ref<SubscriptionTier[]>([])
const loading = ref(false)
const editingId = ref<string | null>(null)
const showCreateModal = ref(false)
const originalTier = ref<SubscriptionTier | null>(null)

const newTier = ref({
  tier: '',
  monthlyPrice: 0,
  annualPrice: 0,
  maxAccounts: 0,
  maxEnvelopes: 0,
  maxPaycheckJobs: 0,
  maxSharedHouseholds: 0,
  allowSharedExpenses: false,
  allowAdvancedReporting: false,
  allowCustomCategories: false,
  prioritySupport: false,
  allowMembers: false,
  allowHousehold: false,
  description: ''
})

onMounted(async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(apiUrl('/admin/subscription-tier-configurations'), {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (response.ok) {
      tiers.value = await response.json()

      // If no tiers found, initialize defaults
      if (tiers.value.length === 0) {
        console.log('No tiers found, initializing defaults...')
        const initResponse = await fetch(apiUrl('/admin/subscription-tier-configurations/initialize'), {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (initResponse.ok) {
          // Reload tiers after initialization
          const reloadResponse = await fetch(apiUrl('/admin/subscription-tier-configurations'), {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (reloadResponse.ok) {
            tiers.value = await reloadResponse.json()
          }
        }
      }
    }
  } catch (error) {
    console.error('Error loading tier configurations:', error)
  } finally {
    loading.value = false
  }
})

const startEdit = (tier: SubscriptionTier) => {
  originalTier.value = JSON.parse(JSON.stringify(tier))
  editingId.value = tier.id
}

const cancelEdit = () => {
  if (originalTier.value && editingId.value) {
    const index = tiers.value.findIndex(t => t.id === editingId.value)
    if (index !== -1) {
      tiers.value[index] = JSON.parse(JSON.stringify(originalTier.value))
    }
  }
  editingId.value = null
  originalTier.value = null
}

const saveEdit = async (tier: SubscriptionTier) => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(apiUrl(`/admin/subscription-tier-configurations/${tier.tier}`), {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        monthlyPrice: tier.monthlyPrice,
        annualPrice: tier.annualPrice,
        maxAccounts: tier.maxAccounts,
        maxEnvelopes: tier.maxEnvelopes,
        maxPaycheckJobs: tier.maxPaycheckJobs,
        maxSharedHouseholds: tier.maxSharedHouseholds,
        allowSharedExpenses: tier.allowSharedExpenses,
        allowAdvancedReporting: tier.allowAdvancedReporting,
        allowCustomCategories: tier.allowCustomCategories,
        prioritySupport: tier.prioritySupport,
        allowMembers: tier.allowMembers,
        allowHousehold: tier.allowHousehold
      })
    })

    if (response.ok) {
      console.log('Tier configuration updated successfully')
      editingId.value = null
      originalTier.value = null
    } else {
      console.error('Failed to update tier configuration')
      cancelEdit()
    }
  } catch (error) {
    console.error('Error updating tier configuration:', error)
    cancelEdit()
  }
}

const createTier = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(apiUrl('/admin/subscription-tier-configurations'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newTier.value)
    })

    if (response.ok) {
      const createdTier = await response.json()
      tiers.value.push(createdTier)
      showCreateModal.value = false
      resetNewTierForm()
      console.log('Tier created successfully')
    } else {
      console.error('Failed to create tier')
    }
  } catch (error) {
    console.error('Error creating tier:', error)
  }
}

const deleteTier = async (tier: SubscriptionTier) => {
  if (!confirm(`Are you sure you want to deactivate ${tier.tier} tier?`)) {
    return
  }

  try {
    const token = localStorage.getItem('token')
    const response = await fetch(apiUrl(`/admin/subscription-tier-configurations/${tier.tier}`), {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (response.ok) {
      tier.isActive = false
      console.log('Tier deactivated successfully')
    } else {
      console.error('Failed to deactivate tier')
    }
  } catch (error) {
    console.error('Error deactivating tier:', error)
  }
}

const resetNewTierForm = () => {
  newTier.value = {
    tier: '',
    monthlyPrice: 0,
    annualPrice: 0,
    maxAccounts: 0,
    maxEnvelopes: 0,
    maxPaycheckJobs: 0,
    maxSharedHouseholds: 0,
    allowSharedExpenses: false,
    allowAdvancedReporting: false,
    allowCustomCategories: false,
    prioritySupport: false,
    allowMembers: false,
    allowHousehold: false,
    description: ''
  }
}
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.admin-header {
  margin-bottom: 30px;
}

.admin-header h1 {
  margin: 0;
  font-size: 2rem;
  color: #333;
}

.admin-header .subtitle {
  margin: 5px 0 0 0;
  color: #666;
  font-size: 0.95rem;
}

.admin-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e5e5;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.tiers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.tier-card {
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 15px;
  background: #fafafa;
  transition: box-shadow 0.3s;
}

.tier-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.tier-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #007bff;
}

.tier-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.badge-active {
  background: #d4edda;
  color: #155724;
}

.badge-inactive {
  background: #f8d7da;
  color: #721c24;
}

.tier-content {
  margin-bottom: 15px;
}

.pricing-section,
.limits-section,
.features-section,
.description-section {
  margin-bottom: 15px;
}

.pricing-section h4,
.limits-section h4,
.features-section h4,
.description-section h4 {
  margin: 10px 0 5px 0;
  color: #333;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group {
  margin-bottom: 10px;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  color: #666;
  margin-bottom: 3px;
}

.form-control {
  width: 100%;
  padding: 6px 8px;
  font-size: 0.9rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-control:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  cursor: pointer;
  margin: 0;
}

.checkbox-group input[type="checkbox"] {
  margin-right: 8px;
  cursor: pointer;
}

.tier-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 10px;
  border-top: 1px solid #ddd;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover {
  background: #218838;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 0.8rem;
}

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
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e5e5;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
}

.modal-body h3 {
  font-size: 1rem;
  margin-top: 20px;
  margin-bottom: 10px;
  color: #333;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e5e5e5;
}

.loading,
.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}

.loading i {
  margin-right: 10px;
}
</style>
