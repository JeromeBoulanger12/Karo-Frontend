<template>
  <div class="admin-tax-rates-page">
    <div class="page-header">
      <h1>{{ t('admin.tax_rates_management') }}</h1>
      <p>{{ t('admin.manage_tax_rates_desc') }}</p>
    </div>

    <!-- Filters and Actions -->
    <div class="controls-section">
      <div class="filter-group">
        <input
          v-model="searchTerm"
          type="text"
          :placeholder="t('common.search')"
          class="search-input"
        />
        <select v-model="filterCountry" class="filter-select">
          <option value="">{{ t('common.all_countries') }}</option>
          <option v-for="country in countries" :key="country" :value="country">
            {{ country }}
          </option>
        </select>
      </div>
      <button @click="showCreateModal = true" class="btn-primary">
        <i class="mdi mdi-plus"></i>
        {{ t('admin.add_tax_rate') }}
      </button>
    </div>

    <!-- Tax Rates Table -->
    <div class="tax-rates-table">
      <div v-if="filteredTaxRates.length > 0" class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>{{ t('admin.jurisdiction') }}</th>
              <th>{{ t('admin.country') }}</th>
              <th>{{ t('landing.sales_tax') }}</th>
              <th>{{ t('landing.vat') }}</th>
              <th>{{ t('admin.local_tax') }}</th>
              <th>{{ t('admin.total_rate') }}</th>
              <th>{{ t('admin.status') }}</th>
              <th>{{ t('admin.effective_from') }}</th>
              <th>{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rate in filteredTaxRates" :key="rate.id" :class="{ inactive: !rate.isActive }">
              <td class="jurisdiction-name">{{ rate.jurisdictionName }}</td>
              <td>{{ rate.countryCode }}</td>
              <td>{{ formatPercentage(rate.salesTaxRate) }}</td>
              <td>{{ rate.vat ? formatPercentage(rate.vat) : '-' }}</td>
              <td>{{ rate.localTaxRate ? formatPercentage(rate.localTaxRate) : '-' }}</td>
              <td class="total-rate">
                <strong>{{ formatPercentage(calculateTotalRate(rate)) }}</strong>
              </td>
              <td>
                <span :class="['status-badge', rate.isActive ? 'active' : 'inactive']">
                  {{ rate.isActive ? t('admin.active') : t('admin.inactive') }}
                </span>
              </td>
              <td>{{ formatDate(rate.effectiveFrom) }}</td>
              <td class="actions-cell">
                <button
                  @click="editRate(rate)"
                  class="btn-icon edit"
                  :title="t('common.edit')"
                >
                  <i class="mdi mdi-pencil"></i>
                </button>
                <button
                  @click="toggleStatus(rate)"
                  :class="['btn-icon', rate.isActive ? 'deactivate' : 'activate']"
                  :title="rate.isActive ? t('admin.deactivate') : t('admin.activate')"
                >
                  <i :class="['mdi', rate.isActive ? 'mdi-pause' : 'mdi-play']"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state">
        <i class="mdi mdi-inbox"></i>
        <p>{{ t('admin.no_tax_rates') }}</p>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ isEditing ? t('admin.edit_tax_rate') : t('admin.create_tax_rate') }}</h2>
          <button @click="closeModal" class="btn-close">
            <i class="mdi mdi-close"></i>
          </button>
        </div>

        <form @submit.prevent="saveTaxRate" class="form">
          <div class="form-group">
            <label>{{ t('admin.jurisdiction') }} *</label>
            <select v-model="formData.jurisdiction" :disabled="isEditing" required>
              <option value="">{{ t('common.select') }}</option>
              <option v-for="j in jurisdictions" :key="j.value" :value="j.value">
                {{ j.label }}
              </option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>{{ t('landing.sales_tax') }} (%) *</label>
              <input v-model.number="formData.salesTaxRate" type="number" step="0.01" min="0" max="100" required />
            </div>
            <div class="form-group">
              <label>{{ t('landing.vat') }} (%)</label>
              <input v-model.number="formData.vat" type="number" step="0.01" min="0" max="100" />
            </div>
            <div class="form-group">
              <label>{{ t('admin.local_tax') }} (%)</label>
              <input v-model.number="formData.localTaxRate" type="number" step="0.01" min="0" max="100" />
            </div>
          </div>

          <div class="form-group">
            <label>{{ t('common.notes') }}</label>
            <textarea v-model="formData.notes" rows="3" :placeholder="t('admin.tax_rate_notes_placeholder')"></textarea>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn-secondary">
              {{ t('common.cancel') }}
            </button>
            <button type="submit" class="btn-primary" :disabled="!formData.jurisdiction">
              {{ isEditing ? t('common.update') : t('common.create') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Loading/Error States -->
    <div v-if="loading" class="loading-overlay">
      {{ t('common.loading') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { apiUrl } from '../api/client'

const { t } = useI18n()

interface TaxRate {
  id: string
  jurisdiction: string
  jurisdictionName: string
  countryCode: string
  regionCode?: string
  salesTaxRate: number
  vat?: number
  localTaxRate?: number
  isActive: boolean
  effectiveFrom: string
  effectiveUntil?: string
  notes?: string
}

interface FormData {
  jurisdiction: string
  salesTaxRate: number
  vat?: number
  localTaxRate?: number
  notes?: string
}

const loading = ref(false)
const searchTerm = ref('')
const filterCountry = ref('')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const isEditing = ref(false)
const taxRates = ref<TaxRate[]>([])
const jurisdictions = ref<Array<{ value: string; label: string }>>([])
const selectedRate = ref<TaxRate | null>(null)

const formData = ref<FormData>({
  jurisdiction: '',
  salesTaxRate: 0,
  vat: undefined,
  localTaxRate: undefined,
  notes: ''
})

const countries = computed(() => {
  return [...new Set(taxRates.value.map(r => r.countryCode))].sort()
})

const filteredTaxRates = computed(() => {
  return taxRates.value.filter(rate => {
    const matchesSearch = rate.jurisdictionName.toLowerCase().includes(searchTerm.value.toLowerCase())
    const matchesCountry = !filterCountry.value || rate.countryCode === filterCountry.value
    return matchesSearch && matchesCountry
  })
})

onMounted(async () => {
  await fetchJurisdictions()
  await fetchTaxRates()
})

const fetchJurisdictions = async () => {
  try {
    const response = await fetch(apiUrl('/tax/jurisdictions'))
    if (response.ok) {
      jurisdictions.value = await response.json()
    }
  } catch (error) {
    console.error('Error fetching jurisdictions:', error)
  }
}

const fetchTaxRates = async () => {
  loading.value = true
  try {
    const response = await fetch(apiUrl('/admin/tax-rates'), {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    if (response.ok) {
      taxRates.value = await response.json()
    }
  } catch (error) {
    console.error('Error fetching tax rates:', error)
  } finally {
    loading.value = false
  }
}

const calculateTotalRate = (rate: TaxRate): number => {
  let total = rate.salesTaxRate
  if (rate.vat) total += rate.vat
  if (rate.localTaxRate) total += rate.localTaxRate
  return total
}

const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-CA')
}

const editRate = (rate: TaxRate) => {
  selectedRate.value = rate
  formData.value = {
    jurisdiction: rate.jurisdiction,
    salesTaxRate: rate.salesTaxRate,
    vat: rate.vat,
    localTaxRate: rate.localTaxRate,
    notes: rate.notes
  }
  isEditing.value = true
  showEditModal.value = true
}

const toggleStatus = async (rate: TaxRate) => {
  try {
    const endpoint = rate.isActive
      ? `/admin/tax-rates/${rate.jurisdiction}/deactivate`
      : `/admin/tax-rates/${rate.jurisdiction}/activate`

    const response = await fetch(apiUrl(endpoint), {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })

    if (response.ok) {
      await fetchTaxRates()
    }
  } catch (error) {
    console.error('Error updating tax rate status:', error)
  }
}

const saveTaxRate = async () => {
  if (!formData.value.jurisdiction) return

  try {
    const endpoint = isEditing.value
      ? `/admin/tax-rates/${formData.value.jurisdiction}/update`
      : '/admin/tax-rates/create'

    const method = isEditing.value ? 'POST' : 'POST'
    const response = await fetch(apiUrl(endpoint), {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(formData.value)
    })

    if (response.ok) {
      closeModal()
      await fetchTaxRates()
    }
  } catch (error) {
    console.error('Error saving tax rate:', error)
  }
}

const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  isEditing.value = false
  selectedRate.value = null
  formData.value = {
    jurisdiction: '',
    salesTaxRate: 0,
    vat: undefined,
    localTaxRate: undefined,
    notes: ''
  }
}
</script>

<style scoped>
.admin-tax-rates-page {
  padding: 2rem;
  background: #f8fafc;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #0f172a;
}

.page-header p {
  color: #64748b;
  font-size: 0.95rem;
}

.controls-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.filter-group {
  display: flex;
  gap: 1rem;
  flex: 1;
}

.search-input,
.filter-select {
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 0.95rem;
}

.search-input {
  flex: 1;
}

.search-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s;
  white-space: nowrap;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.tax-rates-table {
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f1f5f9;
  border-bottom: 2px solid #e2e8f0;
}

th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #475569;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

tbody tr {
  border-bottom: 1px solid #e2e8f0;
  transition: background 0.2s;
}

tbody tr:hover {
  background: #f8fafc;
}

tbody tr.inactive {
  opacity: 0.6;
}

td {
  padding: 1rem;
  color: #1e293b;
  font-size: 0.95rem;
}

.jurisdiction-name {
  font-weight: 600;
}

.total-rate {
  color: #3b82f6;
}

.status-badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  padding: 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-icon:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.btn-icon.deactivate:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #64748b;
}

.empty-state i {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
  opacity: 0.5;
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

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
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
  font-size: 1.25rem;
  color: #0f172a;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
  transition: color 0.2s;
}

.btn-close:hover {
  color: #1e293b;
}

.form {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.form-group label {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.9rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 0.95rem;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-secondary {
  background-color: #f1f5f9;
  color: #1e293b;
  padding: 0.75rem 1.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-secondary:hover {
  background-color: #e2e8f0;
}

.form-actions .btn-primary {
  flex: 1;
  margin: 0;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  color: white;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .controls-section {
    flex-direction: column;
  }

  .filter-group {
    width: 100%;
    flex-direction: column;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
