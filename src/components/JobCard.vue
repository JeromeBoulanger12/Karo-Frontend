<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatRuleAmount, type DistributionRule } from '../utils/distributionRules'

interface Money {
  amount: number
  currency: string
}

interface Account {
  id: string
  name: string
}

interface Job {
  id: string
  name: string
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'annual'
  homeAccountId?: string
  accountName?: string
  lastPayment?: string
  nextPayment?: string
  isMainJob?: boolean
  rules?: DistributionRule[]
  lastPaycheck?: { amount: Money; date: string } | null
}

const props = withDefaults(defineProps<{
  job: Job
}>(), {})

const emit = defineEmits<{
  edit: [job: Job]
  deposit: [job: Job]
  'set-main-job': [job: Job]
}>()

const { t } = useI18n()

const frequencyLabel = computed(() => {
  const freqMap: Record<string, string> = {
    weekly: 'Hebdo',
    biweekly: 'Bi-hebdo',
    monthly: 'Mensuel',
    annual: 'Annuel'
  }
  return freqMap[props.job.frequency] || props.job.frequency
})

const formatCurrency = (money: Money | undefined) => {
  if (!money) return '$0.00'
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: money.currency || 'CAD'
  }).format(money.amount)
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
  <div class="job-card">
    <div class="job-header">
      <div class="job-name">
        {{ job.name }}
        <span v-if="job.isMainJob" class="badge-main">
          <i class="mdi mdi-star"></i>
          Principal
        </span>
      </div>
      <div class="job-header-right">
        <button
          class="btn-star"
          :class="{ 'is-main': job.isMainJob }"
          @click="emit('set-main-job', job)"
          :title="job.isMainJob ? 'Retirer de principal' : 'Marquer comme principal'"
        >
          <i :class="job.isMainJob ? 'mdi mdi-star' : 'mdi mdi-star-outline'"></i>
        </button>
        <div class="job-frequency">
          <i class="mdi mdi-calendar"></i>
          {{ frequencyLabel }}
        </div>
      </div>
    </div>

    <div class="job-amount">
      <div>
        <div class="job-label">Dernière paie</div>
        <div v-if="job.lastPaycheck" class="job-value">{{ formatCurrency(job.lastPaycheck.amount) }}</div>
        <div v-else class="job-value job-value-empty">Aucune paie distribuée</div>
      </div>
      <div v-if="job.lastPaycheck" class="job-last-amount">
        <div class="job-label">Date</div>
        <div class="job-last-value">{{ formatDate(job.lastPaycheck.date) }}</div>
      </div>
    </div>

    <div class="job-details">
      <div v-if="job.accountName" class="job-detail-item">
        <span>Compte:</span>
        <strong>{{ job.accountName }}</strong>
      </div>
      <div v-if="job.lastPayment" class="job-detail-item">
        <span>Dernier versement:</span>
        <strong>{{ formatDate(job.lastPayment) }}</strong>
      </div>
      <div v-if="job.nextPayment" class="job-detail-item">
        <span>Prochain versement:</span>
        <strong>{{ formatDate(job.nextPayment) }}</strong>
      </div>
    </div>

    <!-- Distribution rules: where each paycheck goes -->
    <div class="job-rules">
      <div class="job-label">Répartition</div>
      <ul v-if="job.rules?.length" class="job-rules-list">
        <li v-for="(rule, index) in job.rules" :key="index" class="job-rule-row">
          <span>{{ rule.envelopeName }}</span>
          <strong>{{ formatRuleAmount(rule) }}</strong>
        </li>
      </ul>
      <p v-else class="job-rules-empty">
        <i class="mdi mdi-alert-outline"></i>
        Aucune règle : cette paie n'alloue rien aux enveloppes.
      </p>
    </div>

    <div class="job-actions">
      <button class="btn btn-primary" @click="emit('deposit', job)">
        <i class="mdi mdi-plus"></i>
        Déposer une paie
      </button>
      <button class="btn btn-primary-sm" @click="emit('edit', job)">
        <i class="mdi mdi-pencil"></i>
        {{ t('common.edit') || 'Éditer' }}
      </button>
    </div>
  </div>
</template>

<style scoped>

.job-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all 0.3s ease;
}

.job-card:hover {
  border-color: var(--primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.job-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.job-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.job-header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-star {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.btn-star:hover {
  color: #f59e0b;
  transform: scale(1.1);
}

.btn-star.is-main {
  color: #f59e0b;
}

.badge-main {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #fef3c7;
  color: #92400e;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge-main i {
  font-size: 0.65rem;
}

.job-frequency {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  background: #e0f2fe;
  color: #0369a1;
  white-space: nowrap;
}

.job-frequency i {
  font-size: 0.75rem;
}

.job-amount {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 1rem 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.job-label {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.job-value {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--success);
}

.job-value-empty {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-muted);
}

.job-last-amount {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: right;
}

.job-last-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--primary);
}

.job-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.job-rules {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  font-size: 0.875rem;
}

.job-rules-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.job-rule-row {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  color: var(--text-primary);
}

.job-rule-row strong {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.job-rules-empty {
  margin: 0;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  color: var(--warning, #b45309);
}

.job-detail-item {
  display: flex;
  justify-content: space-between;
}

.job-detail-item strong {
  color: var(--text-primary);
  font-weight: 600;
}

.job-actions {
  display: flex;
  gap: 0.75rem;
}

.btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-primary-sm {
  background: var(--primary);
  color: white;
}

.btn-primary-sm:hover {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
}

@media (max-width: 640px) {
  .job-card {
    padding: 1rem;
  }

  .job-header {
    flex-direction: column;
    gap: 0.5rem;
  }

  .job-actions {
    flex-direction: column;
  }
}
</style>
