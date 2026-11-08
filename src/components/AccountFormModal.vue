<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { isCreditAccount } from '../utils/accounts'
import type { DebtTermsForm } from '../api/accounts'

interface Account {
  id?: string
  name: string
  type: string
  currency: string
  debt?: DebtTermsForm
}

// Starting values for a new card. Payments are made by hand from the debt envelope, so the
// payment frequency is not asked; the backend still needs a value, so it is fixed here.
const defaultDebtTerms = (): DebtTermsForm => ({
  rateType: 'Variable',
  compoundingFrequency: 'Monthly',
  paymentFrequency: 'Monthly'
})

const props = withDefaults(defineProps<{
  isOpen: boolean
  submitError?: string
  account?: Account | null
}>(), {
  isOpen: false,
  submitError: '',
  account: null
})

const emit = defineEmits<{
  close: []
  save: [account: Account]
  delete: []
}>()

const { t } = useI18n()

const formData = ref<Account>({
  name: props.account?.name || '',
  type: props.account?.type || 'checking',
  currency: props.account?.currency || 'CAD',
  debt: props.account?.debt || defaultDebtTerms()
})

// Watch for changes to account prop to update form data
watch(() => props.account, (newAccount) => {
  if (newAccount) {
    formData.value = {
      id: newAccount.id,
      name: newAccount.name || '',
      type: newAccount.type || 'checking',
      currency: newAccount.currency || 'CAD',
      debt: newAccount.debt || defaultDebtTerms()
    }
  } else {
    // Reset form for new account
    formData.value = {
      name: '',
      type: 'checking',
      currency: 'CAD',
      debt: defaultDebtTerms()
    }
  }
}, { deep: true, immediate: true })

// Debt terms are asked only for credit cards
const isCredit = computed(() => isCreditAccount(formData.value.type))


const isEditing = computed(() => !!props.account?.id)

// Deleting is two steps: the warning only appears once the user asks for it
const confirmingDelete = ref(false)

const validationError = ref<string>('')

const handleSubmit = () => {
  validationError.value = ''

  // Validate required fields
  if (!formData.value.name || !formData.value.name.trim()) {
    validationError.value = 'Account name is required'
    return
  }

  if (!formData.value.type) {
    validationError.value = 'Account type is required'
    return
  }

  if (isCredit.value) {
    const debt = formData.value.debt
    // v-model.number leaves an empty field as '' rather than a number
    const isMissing = (value: unknown) => value === undefined || value === null || value === ''
    if (isMissing(debt?.interestRate) || Number(debt?.interestRate) < 0) {
      validationError.value = 'Le taux d\'intérêt annuel est requis'
      return
    }
    if (isMissing(debt?.minimumPayment) || Number(debt?.minimumPayment) < 0) {
      validationError.value = 'Le paiement minimum est requis'
      return
    }
  }

  console.log('Submitting account form:', formData.value)
  emit('save', formData.value)
}

const handleClose = () => {
  emit('close')
  confirmingDelete.value = false
  formData.value = {
    name: '',
    type: 'checking',
    currency: 'CAD',
    debt: defaultDebtTerms()
  }
}

const accountTypes = [
  { value: 'checking', label: 'Compte chèques' },
  { value: 'savings', label: 'Compte épargne' },
  { value: 'credit', label: 'Carte de crédit' },
  { value: 'investment', label: 'Investissement' }
]

const currencies = [
  { value: 'CAD', label: 'CAD ($)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' }
]
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click="handleClose">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h2>{{ isEditing ? 'Éditer' : 'Ajouter' }} Compte</h2>
        <button class="modal-close" @click="handleClose">
          <i class="mdi mdi-close"></i>
        </button>
      </div>

      <div class="modal-body">
        <div v-if="validationError" class="error-message">
          {{ validationError }}
        </div>

        <div class="form-group">
          <label>{{ t('accounts.name') || 'Nom du compte' }}</label>
          <input v-model="formData.name" type="text" :placeholder="isEditing ? formData.name : 'Ex: Mon compte chèques...'" />
        </div>

        <div class="form-group">
          <label>{{ t('accounts.type') || 'Type de compte' }}</label>
          <select v-model="formData.type">
            <option v-if="!accountTypes.find(t => t.value === formData.type) && formData.type" :value="formData.type">
              {{ formData.type }}
            </option>
            <option v-for="type in accountTypes" :key="type.value" :value="type.value">
              {{ type.label }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>{{ t('accounts.currency') || 'Devise' }}</label>
          <select v-model="formData.currency">
            <option v-if="!currencies.find(c => c.value === formData.currency) && formData.currency" :value="formData.currency">
              {{ formData.currency }}
            </option>
            <option v-for="curr in currencies" :key="curr.value" :value="curr.value">
              {{ curr.label }}
            </option>
          </select>
        </div>

        <template v-if="isCredit && formData.debt">
          <h3 class="debt-title">Conditions de la carte</h3>

          <div class="form-group">
            <label>Taux d'intérêt annuel (%)</label>
            <input v-model.number="formData.debt.interestRate" type="number" min="0" step="0.01" placeholder="Ex: 19.99" />
          </div>

          <div class="form-group">
            <label>Type de taux</label>
            <select v-model="formData.debt.rateType">
              <option value="Variable">Variable</option>
              <option value="Fixed">Fixe</option>
            </select>
          </div>

          <div class="form-group">
            <label>Capitalisation des intérêts</label>
            <select v-model="formData.debt.compoundingFrequency">
              <option value="Daily">Quotidienne</option>
              <option value="Monthly">Mensuelle</option>
              <option value="Annually">Annuelle</option>
            </select>
          </div>

          <div class="form-group">
            <label>Paiement minimum</label>
            <input v-model.number="formData.debt.minimumPayment" type="number" min="0" step="0.01" placeholder="Ex: 75" />
          </div>

          <div class="form-group">
            <label>Limite de crédit (facultatif)</label>
            <input v-model.number="formData.debt.creditLimit" type="number" min="0" step="0.01" placeholder="Ex: 3000" />
          </div>
        </template>
      </div>

        <p v-if="submitError" class="error-text">{{ submitError }}</p>

      <div v-if="isEditing" class="delete-zone">
        <button v-if="!confirmingDelete" class="btn-danger" @click="confirmingDelete = true">
          {{ t('entityDelete.delete') }}
        </button>
        <template v-else>
          <p class="delete-warning">{{ t('entityDelete.confirmAccount') }}</p>
          <div class="delete-actions">
            <button class="btn-danger" @click="emit('delete')">{{ t('entityDelete.confirmButton') }}</button>
            <button class="btn-secondary" @click="confirmingDelete = false">{{ t('common.cancel') || 'Annuler' }}</button>
          </div>
        </template>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="handleClose">{{ t('common.cancel') || 'Annuler' }}</button>
        <button class="btn-primary" @click="handleSubmit">{{ t('common.save') || 'Enregistrer' }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  max-height: 90vh;
  overflow-y: auto;
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

.form-group input[type="text"],
.form-group input[type="number"],
.form-group select {
  padding: var(--space-md);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  transition: border-color var(--transition-fast);
  font-family: inherit;
}

.form-group input[type="text"]:focus,
.form-group input[type="number"]:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.debt-title {
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--text-primary);
}

.delete-zone {
  padding: var(--space-md) var(--space-lg);
  border-top: 1px solid var(--border);
}

.delete-warning {
  margin: 0 0 var(--space-sm);
  color: var(--text-muted);
  font-size: 0.9rem;
}

.delete-actions {
  display: flex;
  gap: var(--space-md);
}

.btn-danger {
  background: #dc2626;
  color: white;
  border: none;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  font-weight: 600;
}

.modal-footer {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-lg);
  border-top: 1px solid var(--border);
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
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
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

@media (max-width: 640px) {
  .modal {
    width: 95%;
    border-radius: var(--radius-md);
  }

  .modal-header {
    padding: var(--space-md);
  }

  .modal-body {
    padding: var(--space-md);
  }

  .modal-footer {
    flex-direction: column;
    padding: var(--space-md);
  }
}

.error-text {
  margin: 0;
  color: var(--danger);
  font-size: 0.875rem;
}
</style>
