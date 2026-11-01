<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

interface Account {
  id?: string
  name: string
  type: string
  currency: string
}

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
}>()

const { t } = useI18n()

const formData = ref<Account>({
  name: props.account?.name || '',
  type: props.account?.type || 'checking',
  currency: props.account?.currency || 'CAD'
})

// Watch for changes to account prop to update form data
watch(() => props.account, (newAccount) => {
  if (newAccount) {
    formData.value = {
      id: newAccount.id,
      name: newAccount.name || '',
      type: newAccount.type || 'checking',
      currency: newAccount.currency || 'CAD'
    }
  } else {
    // Reset form for new account
    formData.value = {
      name: '',
      type: 'checking',
      currency: 'CAD'
    }
  }
}, { deep: true, immediate: true })

const isEditing = computed(() => !!props.account?.id)

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

  console.log('Submitting account form:', formData.value)
  emit('save', formData.value)
}

const handleClose = () => {
  emit('close')
  formData.value = {
    name: '',
    type: 'checking',
    currency: 'CAD'
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
      </div>

        <p v-if="submitError" class="error-text">{{ submitError }}</p>

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
