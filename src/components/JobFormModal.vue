<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatRuleAmount, type DistributionRule } from '../utils/distributionRules'

interface Job {
  id?: string
  name: string
  frequency: string
  homeAccountId: string
  lastPayment?: string
  rules?: DistributionRule[]
}

const validationError = ref<string>('')

const props = withDefaults(defineProps<{
  isOpen: boolean
  job?: Job | null
  accountId: string
}>(), {
  isOpen: false,
  job: null
})

const emit = defineEmits<{
  close: []
  save: [job: Job]
}>()

const { t } = useI18n()

const formData = ref<Job>({
  name: props.job?.name || '',
  frequency: props.job?.frequency || 'biweekly',
  homeAccountId: props.accountId
})

// Watch for changes to job prop to update form data
watch(() => props.job, (newJob) => {
  if (newJob && newJob.id) {
    formData.value = {
      id: newJob.id,
      name: newJob.name || '',
      frequency: newJob.frequency || 'biweekly',
      homeAccountId: newJob.homeAccountId || props.accountId,
      lastPayment: newJob.lastPayment
    }
  } else {
    // Reset form for new job
    formData.value = {
      name: '',
      frequency: 'biweekly',
      homeAccountId: props.accountId
    }
  }
}, { deep: true, immediate: true })

// Watch for changes to accountId prop to update form data
watch(() => props.accountId, (newAccountId) => {
  if (newAccountId && !props.job?.id) {
    // Only update if creating a new job (not editing)
    formData.value.homeAccountId = newAccountId
  }
})

const isEditing = computed(() => !!props.job?.id)

const handleSubmit = () => {
  // Validate required fields
  validationError.value = ''

  if (!formData.value.name || !formData.value.name.trim()) {
    validationError.value = 'Job name is required'
    return
  }

  if (!formData.value.homeAccountId) {
    validationError.value = 'Account must be selected'
    return
  }

  console.log('Submitting job form:', formData.value)
  emit('save', formData.value)
}

const handleClose = () => {
  emit('close')
  formData.value = {
    name: '',
    frequency: 'biweekly',
    amount: { amount: 0, currency: 'CAD' },
    homeAccountId: props.accountId
  }
}

const frequencies = [
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'biweekly', label: 'Bi-hebdomadaire' },
  { value: 'monthly', label: 'Mensuel' },
  { value: 'annual', label: 'Annuel' }
]

const getFrequencyLabel = (freq: string) => {
  const found = frequencies.find(f => f.value === freq)
  return found?.label || freq
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  } catch {
    return dateString
  }
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click="handleClose">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h2>{{ isEditing ? 'Éditer' : 'Ajouter' }} Paie</h2>
        <button class="modal-close" @click="handleClose">
          <i class="mdi mdi-close"></i>
        </button>
      </div>

      <!-- Info Box (only when editing) -->
      <div v-if="isEditing" class="job-info-box">
        <div class="info-row">
          <span class="info-label">Nom:</span>
          <span class="info-value">{{ formData.name }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Fréquence:</span>
          <span class="info-value">{{ getFrequencyLabel(formData.frequency) }}</span>
        </div>
        <div v-if="formData.lastPayment" class="info-row">
          <span class="info-label">Dernière paie:</span>
          <span class="info-value">{{ formatDate(formData.lastPayment) }}</span>
        </div>
      </div>

      <div class="modal-body">
        <div v-if="validationError" class="error-message">
          {{ validationError }}
        </div>

        <div class="form-group">
          <label>Nom du travail</label>
          <input v-model="formData.name" type="text" placeholder="Ex: Emploi principal..." />
        </div>

        <div class="form-group">
          <label>Fréquence</label>
          <select v-model="formData.frequency">
            <option v-for="freq in frequencies" :key="freq.value" :value="freq.value">
              {{ freq.label }}
            </option>
          </select>
        </div>

        <!-- Distribution rules (read-only; rules are added from the envelope form) -->
        <div v-if="isEditing" class="rules-preview">
          <div class="rules-header">Répartition prévue</div>
          <ul v-if="job?.rules?.length" class="rules-list">
            <li v-for="(rule, index) in job.rules" :key="index" class="rule-row">
              <span class="rule-envelope">{{ rule.envelopeName }}</span>
              <span class="rule-amount">{{ formatRuleAmount(rule) }}</span>
            </li>
          </ul>
          <p v-else class="rules-empty">
            <i class="mdi mdi-alert-outline"></i>
            Aucune règle : cette paie n'alloue rien aux enveloppes. Ajoute une règle depuis le formulaire d'enveloppe (prélèvement automatique).
          </p>
        </div>
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

/* Job Info Box */
.job-info-box {
  background: var(--surface);
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sm);
}

.info-label {
  font-weight: var(--font-weight-semibold);
  color: var(--text-muted);
}

.info-value {
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.modal-body {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.error-message {
  background: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 12px 15px;
  border-radius: 6px;
  font-size: 14px;
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

.rules-preview {
  padding: var(--space-md);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

.rules-header {
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.rules-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs, 4px);
}

.rule-row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-md);
  color: var(--text-primary);
}

.rule-amount {
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.rules-empty {
  margin: 0;
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  color: var(--warning, #b45309);
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
</style>
