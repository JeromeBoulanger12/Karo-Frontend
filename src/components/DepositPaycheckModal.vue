<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatRuleAmount, type DistributionRule } from '../utils/distributionRules'

interface Job {
  id: string
  name: string
  frequency: string
  isMainJob?: boolean
  rules?: DistributionRule[]
}

interface DepositData {
  amount: number
  accountBalance: number | null
  jobId?: string
  date?: string
}

const props = withDefaults(defineProps<{
  isOpen: boolean
  job?: Job | null
  jobs?: Job[]
}>(), {
  isOpen: false,
  job: null,
  jobs: () => []
})

const emit = defineEmits<{
  close: []
  save: [data: DepositData]
}>()

const { t } = useI18n()

// Find the main job if available, otherwise use the pre-selected job
const defaultJobId = computed(() => {
  if (props.job?.id) return props.job.id
  const mainJob = props.jobs?.find(j => j.isMainJob)
  return mainJob?.id || ''
})

const formData = ref<DepositData>({
  amount: 0,
  accountBalance: null,
  jobId: defaultJobId.value,
  date: new Date().toISOString().split('T')[0]
})

// Distribution rules of the selected job, shown read-only so the user knows where the paycheck goes
const selectedJob = computed(() => props.jobs?.find(j => j.id === formData.value.jobId) ?? null)


watch(() => props.job, (newJob) => {
  if (newJob?.id) {
    formData.value.jobId = newJob.id
  }
}, { deep: true })

watch(() => defaultJobId.value, (newJobId) => {
  if (!formData.value.jobId && newJobId) {
    formData.value.jobId = newJobId
  }
})

const handleSubmit = () => {
  if (!formData.value.jobId || formData.value.amount <= 0 || formData.value.accountBalance === null) {
    console.error('Missing required fields for deposit')
    return
  }
  emit('save', formData.value)
}

const handleClose = () => {
  emit('close')
  formData.value = {
    amount: 0,
    accountBalance: null,
    jobId: props.job?.id,
    date: new Date().toISOString().split('T')[0]
  }
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click="handleClose">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h2>Déposer une paie</h2>
        <button class="modal-close" @click="handleClose">
          <i class="mdi mdi-close"></i>
        </button>
      </div>

      <div class="modal-body">
        <!-- Job Selection (always shown) -->
        <div class="form-group">
          <label>Source de revenu:</label>
          <select v-model="formData.jobId">
            <option value="">-- Sélectionner --</option>
            <option v-for="j in jobs" :key="j.id" :value="j.id">
              {{ j.name }}
            </option>
          </select>

          <!-- Distribution rules (read-only) -->
          <div v-if="selectedJob" class="rules-preview">
            <div class="rules-header">Répartition prévue</div>
            <ul v-if="selectedJob.rules?.length" class="rules-list">
              <li v-for="(rule, index) in selectedJob.rules" :key="index" class="rule-row">
                <span class="rule-envelope">{{ rule.envelopeName }}</span>
                <span class="rule-amount">{{ formatRuleAmount(rule) }}</span>
              </li>
            </ul>
            <p v-else class="rules-empty">
              <i class="mdi mdi-alert-outline"></i>
              Aucune règle pour cette source : la paie sera enregistrée sans allocation aux enveloppes.
            </p>
          </div>
        </div>

        <!-- Amount Input -->
        <div class="form-group">
          <label>Montant déposé</label>
          <input
            v-model.number="formData.amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
          />
        </div>

        <!-- Account Balance Input (after paycheck) -->
        <div class="form-group">
          <label>Solde du compte chèques (après paie)</label>
          <input
            v-model.number="formData.accountBalance"
            type="number"
            step="0.01"
            placeholder="0.00"
          />
        </div>

        <!-- Date Input -->
        <div class="form-group">
          <label>Date du dépôt</label>
          <input
            v-model="formData.date"
            type="date"
          />
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
  border-radius: var(--radius-md);
  margin-bottom: var(--space-lg);
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
.form-group input[type="date"],
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
.form-group input[type="date"]:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.rules-preview {
  margin-top: var(--space-sm);
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
