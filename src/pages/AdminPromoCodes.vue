<template>
  <div class="admin-promo-codes-container">
    <div class="promo-codes-header">
      <div>
        <h1>{{ t('admin.promo_codes') }}</h1>
        <p class="subtitle">{{ t('admin.promo_codes_subtitle') }}</p>
      </div>
      <button class="btn btn-primary" @click="openCreateModal">
        <i class="mdi mdi-plus"></i>
        {{ t('admin.create_promo_code') }}
      </button>
    </div>

    <div v-if="loading" class="loading">
      {{ t('common.loading') }}
    </div>

    <div v-else class="promo-codes-content">
      <!-- Active Codes Table -->
      <div class="promo-codes-table-wrapper">
        <div class="table-header">
          <h2>{{ t('admin.active_promo_codes') }}</h2>
          <div class="search-filter">
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('admin.search_codes')"
              class="search-input"
            />
          </div>
        </div>

        <table class="promo-codes-table">
          <thead>
            <tr>
              <th>{{ t('admin.code') }}</th>
              <th>{{ t('admin.type') }}</th>
              <th>{{ t('admin.value') }}</th>
              <th>{{ t('admin.uses') }}</th>
              <th>{{ t('admin.valid_until') }}</th>
              <th>{{ t('admin.status') }}</th>
              <th>{{ t('admin.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="promoCode in filteredCodes" :key="promoCode.id">
              <td>
                <span class="code-badge">{{ promoCode.code }}</span>
              </td>
              <td>
                <span class="type-badge" :class="promoCode.type.toLowerCase()">
                  {{ formatType(promoCode.type) }}
                </span>
              </td>
              <td>{{ formatValue(promoCode) }}</td>
              <td>
                <span class="uses-info">{{ promoCode.currentUses }} / {{ promoCode.maxUses }}</span>
              </td>
              <td>{{ formatDate(promoCode.validUntil) }}</td>
              <td>
                <span class="status-badge" :class="promoCode.isActive ? 'active' : 'inactive'">
                  {{ promoCode.isActive ? t('admin.active') : t('admin.inactive') }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button
                    class="btn-small btn-edit"
                    @click="editPromoCode(promoCode)"
                    :title="t('admin.edit')"
                  >
                    <i class="mdi mdi-pencil"></i>
                  </button>
                  <button
                    v-if="promoCode.isActive"
                    class="btn-small btn-deactivate"
                    @click="deactivatePromoCode(promoCode)"
                    :title="t('admin.deactivate')"
                  >
                    <i class="mdi mdi-block-helper"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="filteredCodes.length === 0" class="no-results">
          {{ t('admin.no_promo_codes_found') }}
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="promo-stats">
        <h2>{{ t('admin.promo_code_statistics') }}</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">{{ t('admin.total_codes') }}</div>
            <div class="stat-value">{{ allCodes.length }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">{{ t('admin.active_codes') }}</div>
            <div class="stat-value">{{ activeCodes.length }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">{{ t('admin.total_uses') }}</div>
            <div class="stat-value">{{ totalUses }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">{{ t('admin.avg_discount') }}</div>
            <div class="stat-value">{{ avgDiscount }}%</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingCode ? t('admin.edit_promo_code') : t('admin.create_promo_code') }}</h2>
          <button class="btn-close" @click="closeModal">
            <i class="mdi mdi-close"></i>
          </button>
        </div>

        <div class="modal-content">
          <div class="form-group">
            <label>{{ t('admin.code') }}</label>
            <input
              v-model="formData.code"
              type="text"
              class="form-input"
              :disabled="editingCode"
              placeholder="SUMMER2024"
              @input="formData.code = formData.code.toUpperCase()"
            />
          </div>

          <div class="form-group">
            <label>{{ t('admin.type') }}</label>
            <select v-model="formData.type" class="form-input">
              <option value="PercentageDiscount">{{ t('admin.type_percentage') }}</option>
              <option value="FixedDiscount">{{ t('admin.type_fixed') }}</option>
              <option value="FreeMonths">{{ t('admin.type_free_months') }}</option>
              <option value="FreeUpgrade">{{ t('admin.type_free_upgrade') }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>{{ t('admin.value') }}</label>
            <input
              v-model.number="formData.value"
              type="number"
              class="form-input"
              placeholder="20"
            />
          </div>

          <div class="form-group">
            <label>{{ t('admin.max_uses') }}</label>
            <input
              v-model.number="formData.maxUses"
              type="number"
              class="form-input"
              placeholder="100"
            />
          </div>

          <div class="form-group">
            <label>{{ t('admin.valid_from') }}</label>
            <input
              v-model="formData.validFrom"
              type="datetime-local"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>{{ t('admin.valid_until') }}</label>
            <input
              v-model="formData.validUntil"
              type="datetime-local"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>{{ t('admin.target_tier') }}</label>
            <select v-model="formData.targetTier" class="form-input">
              <option :value="null">{{ t('admin.all_tiers') }}</option>
              <option value="Free">{{ t('admin.free') }}</option>
              <option value="Pro">{{ t('admin.pro') }}</option>
              <option value="Family">{{ t('admin.family') }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>{{ t('admin.description') }}</label>
            <textarea
              v-model="formData.description"
              class="form-input"
              placeholder="Optional description..."
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label>{{ t('admin.min_purchase_amount') }}</label>
            <input
              v-model.number="formData.minPurchaseAmount"
              type="number"
              class="form-input"
              placeholder="0"
            />
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal">
            {{ t('common.cancel') }}
          </button>
          <button class="btn btn-primary" @click="savePromoCode" :disabled="saving">
            {{ saving ? t('common.saving') : t('common.save') }}
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
const saving = ref(false)
const showModal = ref(false)
const searchQuery = ref('')
const editingCode = ref(null)

interface PromoCode {
  id: string
  code: string
  type: string
  value: number
  maxUses: number
  currentUses: number
  validFrom: string
  validUntil: string
  isActive: boolean
  targetTier?: string
  description?: string
  minPurchaseAmount: number
}

const allCodes = ref<PromoCode[]>([])

// Fetch promo codes from backend
onMounted(async () => {
  try {
    loading.value = true
    const response = await fetch(apiUrl('/admin/promo-codes'), {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    if (response.ok) {
      allCodes.value = await response.json()
    }
  } catch (error) {
    console.error('Error loading promo codes:', error)
  } finally {
    loading.value = false
  }
})

const formData = ref({
  code: '',
  type: 'PercentageDiscount',
  value: 0,
  maxUses: 100,
  validFrom: '',
  validUntil: '',
  targetTier: null,
  description: '',
  minPurchaseAmount: 0
})

const filteredCodes = computed(() => {
  return allCodes.value.filter(code =>
    code.code.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const activeCodes = computed(() => allCodes.value.filter(code => code.isActive))

const totalUses = computed(() => allCodes.value.reduce((sum, code) => sum + code.currentUses, 0))

const avgDiscount = computed(() => {
  const avgValue = allCodes.value.reduce((sum, code) => sum + code.value, 0) / allCodes.value.length
  return avgValue.toFixed(1)
})

const formatType = (type: string) => {
  const typeMap: Record<string, string> = {
    'PercentageDiscount': t('admin.type_percentage'),
    'FixedDiscount': t('admin.type_fixed'),
    'FreeMonths': t('admin.type_free_months'),
    'FreeUpgrade': t('admin.type_free_upgrade')
  }
  return typeMap[type] || type
}

const formatValue = (promoCode: PromoCode) => {
  switch (promoCode.type) {
    case 'PercentageDiscount':
      return `${promoCode.value}%`
    case 'FixedDiscount':
      return `$${promoCode.value}`
    case 'FreeMonths':
      return `${promoCode.value} months`
    case 'FreeUpgrade':
      return 'Free Upgrade'
    default:
      return promoCode.value
  }
}

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('fr-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(dateString))
}

const openCreateModal = () => {
  editingCode.value = null
  formData.value = {
    code: '',
    type: 'PercentageDiscount',
    value: 0,
    maxUses: 100,
    validFrom: new Date().toISOString().slice(0, 16),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    targetTier: null,
    description: '',
    minPurchaseAmount: 0
  }
  showModal.value = true
}

const editPromoCode = (code: PromoCode) => {
  editingCode.value = code
  formData.value = { ...code }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingCode.value = null
}

const savePromoCode = async () => {
  saving.value = true
  try {
    // TODO: Call API
    await new Promise(resolve => setTimeout(resolve, 1000))
    closeModal()
    console.log('Promo code saved:', formData.value)
  } catch (error) {
    console.error('Error saving promo code:', error)
  } finally {
    saving.value = false
  }
}

const deactivatePromoCode = async (code: PromoCode) => {
  if (confirm(`${t('admin.confirm_deactivate')} ${code.code}?`)) {
    code.isActive = false
    // TODO: Call API
  }
}
</script>

<style scoped>
.admin-promo-codes-container {
  max-width: 1400px;
  margin: 0 auto;
}

.promo-codes-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.promo-codes-header h1 {
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

.promo-codes-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.promo-codes-table-wrapper {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.table-header h2 {
  margin: 0;
  font-size: 1.3rem;
  color: #1e293b;
}

.search-input {
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 0.9rem;
  width: 250px;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.promo-codes-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.promo-codes-table thead {
  background-color: #f8fafc;
}

.promo-codes-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #475569;
  border-bottom: 2px solid #e2e8f0;
}

.promo-codes-table td {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  color: #1e293b;
}

.promo-codes-table tbody tr:hover {
  background-color: #f8fafc;
}

.code-badge {
  padding: 0.25rem 0.75rem;
  background-color: #dbeafe;
  color: #1e40af;
  border-radius: 4px;
  font-family: monospace;
  font-weight: 600;
}

.type-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}

.type-badge.percentagediscount {
  background-color: #fef3c7;
  color: #92400e;
}

.type-badge.fixeddiscount {
  background-color: #dbeafe;
  color: #1e40af;
}

.type-badge.freemonths {
  background-color: #d1fae5;
  color: #065f46;
}

.type-badge.freeupgrade {
  background-color: #e9d5ff;
  color: #6b21a8;
}

.uses-info {
  color: #64748b;
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

.status-badge.inactive {
  background-color: #fee2e2;
  color: #991b1b;
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

.btn-edit {
  background-color: #fef3c7;
  color: #92400e;
}

.btn-edit:hover {
  background-color: #fde68a;
}

.btn-deactivate {
  background-color: #fee2e2;
  color: #991b1b;
}

.btn-deactivate:hover {
  background-color: #fecaca;
}

.no-results {
  padding: 2rem;
  text-align: center;
  color: #64748b;
}

.promo-stats {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.promo-stats h2 {
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
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.3rem;
  color: #1e293b;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
}

.btn-close:hover {
  color: #1e293b;
}

.modal-content {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #1e293b;
  font-size: 0.95rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 0.9rem;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

textarea.form-input {
  resize: vertical;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.btn-secondary {
  background-color: #f1f5f9;
  color: #1e293b;
  border: 1px solid #cbd5e1;
}

.btn-secondary:hover {
  background-color: #e2e8f0;
}

@media (max-width: 768px) {
  .promo-codes-header {
    flex-direction: column;
    gap: 1rem;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
