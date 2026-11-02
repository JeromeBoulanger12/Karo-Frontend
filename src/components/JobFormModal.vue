<script setup lang="ts">
import { ref, computed, watch, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatRuleAmount, type DistributionRule } from '../utils/distributionRules'

interface Job {
  id?: string
  name: string
  frequency: string
  homeAccountId: string
  lastPayment?: string
  // A real payday; the following ones are counted from it with the frequency (YYYY-MM-DD)
  anchorDate?: string
  // Fixed paycheck from the dashboard (amount and currency); the form works with a plain number
  fixedAmount?: { amount: number; currency: string } | null
  rules?: DistributionRule[]
}

// What the form emits: the fixed amount is a plain number, or null when fixed pay is off
interface JobSavePayload extends Omit<Job, 'fixedAmount'> {
  fixedAmount: number | null
}

const validationError = ref<string>('')

// Fixed pay: deposited automatically on each payday, instead of entered by hand (paid plans only)
const subscriptionFeatures = inject('subscriptionFeatures', ref({ allowPlanning: false }))
const canUseFixedPay = computed(() => !!subscriptionFeatures.value.allowPlanning)
const isIrregular = computed(() => formData.value.frequency === 'irregular')
const fixedPayEnabled = ref(false)
const fixedPayAmount = ref<number | null>(null)

const props = withDefaults(defineProps<{
  isOpen: boolean
  submitError?: string
  job?: Job | null
  accountId: string
}>(), {
  isOpen: false,
  submitError: '',
  job: null
})

const emit = defineEmits<{
  close: []
  save: [job: JobSavePayload]
}>()

const { t } = useI18n()

// The backend sends the frequency in PascalCase (BiWeekly, Irregular); the select uses the lowercase values above
const FORM_FREQUENCY_BY_BACKEND: Record<string, string> = {
  weekly: 'weekly',
  biweekly: 'biweekly',
  semimonthly: 'semimonthly',
  monthly: 'monthly',
  annually: 'annual',
  annual: 'annual',
  irregular: 'irregular'
}

const normalizeFrequency = (raw?: string | null) => FORM_FREQUENCY_BY_BACKEND[(raw ?? '').toLowerCase()] ?? 'biweekly'

// Today in local time as YYYY-MM-DD (toISOString would give the UTC date)
const todayIso = () => {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

const formData = ref<Job>({
  name: props.job?.name || '',
  frequency: normalizeFrequency(props.job?.frequency),
  homeAccountId: props.accountId,
  anchorDate: props.job?.anchorDate || todayIso()
})

// Watch for changes to job prop to update form data
watch(() => props.job, (newJob) => {
  if (newJob && newJob.id) {
    formData.value = {
      id: newJob.id,
      name: newJob.name || '',
      frequency: normalizeFrequency(newJob.frequency),
      homeAccountId: newJob.homeAccountId || props.accountId,
      lastPayment: newJob.lastPayment,
      anchorDate: newJob.anchorDate || todayIso()
    }
  } else {
    // Reset form for new job
    formData.value = {
      name: '',
      frequency: 'biweekly',
      homeAccountId: props.accountId,
      anchorDate: todayIso()
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

// Fixed pay state follows the job being edited; a new job starts with fixed pay off
watch(() => props.job, (newJob) => {
  fixedPayEnabled.value = !!newJob?.id && !!newJob.fixedAmount
  fixedPayAmount.value = newJob?.id ? newJob.fixedAmount?.amount ?? null : null
}, { immediate: true })

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

  if (!isIrregular.value && fixedPayEnabled.value && !(fixedPayAmount.value && fixedPayAmount.value > 0)) {
    validationError.value = 'Le montant de la paie fixe doit être supérieur à 0.'
    return
  }

  emit('save', {
    ...formData.value,
    fixedAmount: !isIrregular.value && fixedPayEnabled.value ? fixedPayAmount.value : null
  })
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
  { value: 'annual', label: 'Annuel' },
  { value: 'irregular', label: 'Aucune' }
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

        <template v-if="!isIrregular">
        <div class="form-group">
          <label>Date d'une paie</label>
          <input v-model="formData.anchorDate" type="date" required />
          <small class="hint">
            Choisissez une date de paie réelle. Les suivantes sont calculées à partir de celle-ci selon la fréquence.
          </small>
        </div>

        <div class="form-group">
          <label class="checkbox-row">
            <!-- A plan that already has fixed pay can still be switched off, even after a downgrade -->
            <input v-model="fixedPayEnabled" type="checkbox" :disabled="!canUseFixedPay && !fixedPayEnabled" />
            Paie fixe (déposée automatiquement à chaque paie)
          </label>
          <input
            v-if="fixedPayEnabled"
            v-model.number="fixedPayAmount"
            type="number"
            step="0.01"
            min="0"
            placeholder="Montant par paie"
          />
          <small v-if="!canUseFixedPay" class="hint">
            Réservé aux abonnements payants.
          </small>
          <small v-else class="hint">
            Avec une paie fixe, « Déposer une paie » disparaît. Si le montant reçu est différent, utilisez « Ajuster la dernière paie ».
          </small>
        </div>
        </template>

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

.error-text {
  margin: 0;
  color: var(--danger);
  font-size: 0.875rem;
}
.hint {
  display: block;
  margin-top: 0.25rem;
  color: var(--text-muted);
  font-size: 0.75rem;
}
.checkbox-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}
</style>
