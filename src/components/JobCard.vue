<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { jobsApi } from '../api/jobs'
import HelpTip from './HelpTip.vue'
import { formatRuleAmount, type DistributionRule, type PaycheckPreview } from '../utils/distributionRules'

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
  // Computed by the backend from the anchor date and frequency (YYYY-MM-DD)
  nextPaydayDate?: string | null
  // Fixed paycheck deposited automatically on each payday; null when paychecks are entered by hand
  fixedAmount?: Money | null
}

const props = withDefaults(defineProps<{
  job: Job
}>(), {})

const emit = defineEmits<{
  edit: [job: Job]
  deposit: [job: Job]
  adjust: [job: Job]
  'set-main-job': [job: Job]
}>()

const { t, locale } = useI18n()

// The total taken by the rules and the surplus left on each paycheck are a paid-tier feature
const subscriptionFeatures = inject('subscriptionFeatures', ref({ allowPlanning: false }))
const canPlan = computed(() => !!subscriptionFeatures.value.allowPlanning)

// Amounts come from the backend: bill and goal shares depend on the envelopes and the next payday.
// The dashboard rebuilds the job object on each reload, so a new object means the amounts may have changed.
const preview = ref<PaycheckPreview | null>(null)
watch([() => props.job, canPlan], async ([job, allowed]) => {
  if (!allowed || !job?.id) {
    preview.value = null
    return
  }
  try {
    const { data } = await jobsApi.paycheckPreview(job.id)
    preview.value = data
  } catch (err) {
    console.error('Error loading paycheck preview:', err)
    preview.value = null
  }
}, { immediate: true })

// The rule's amount on the next paycheck when known, else its setting (fixed amount, percentage, automatic)
const ruleAmount = (rule: DistributionRule, index: number) => {
  const line = preview.value?.lines[index]
  return line && line.envelopeId === rule.envelopeId ? formatCurrency(line.amount) : formatRuleAmount(rule)
}

const frequencyLabel = computed(() => {
  const freqMap: Record<string, string> = {
    weekly: t('jobCard.frequency.weekly'),
    biweekly: t('jobCard.frequency.biweekly'),
    semimonthly: t('jobCard.frequency.semimonthly'),
    monthly: t('jobCard.frequency.monthly'),
    annual: t('jobCard.frequency.annual'),
    annually: t('jobCard.frequency.annual'),
    irregular: t('jobCard.frequency.irregular')
  }
  // The backend sends PascalCase (BiWeekly, Irregular); the labels are keyed in lowercase
  return freqMap[props.job.frequency?.toLowerCase()] || props.job.frequency
})

const formatCurrency = (money: Money | undefined) => {
  if (!money) return '$0.00'
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: money.currency || 'CAD'
  }).format(money.amount)
}

// A payday is a calendar date (YYYY-MM-DD): build it in local time so it does not shift to the day before
const formatPayday = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(locale.value, { year: 'numeric', month: 'short', day: 'numeric' })
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(locale.value, {
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
          {{ t('jobCard.badge.main') }}
        </span>
      </div>
      <div class="job-header-right">
        <button
          class="btn-star"
          :class="{ 'is-main': job.isMainJob }"
          @click="emit('set-main-job', job)"
          :title="job.isMainJob ? t('jobCard.star.unset') : t('jobCard.star.set')"
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
        <div class="job-label">{{ t('jobCard.lastPayment') }}</div>
        <div v-if="job.lastPaycheck" class="job-value">{{ formatCurrency(job.lastPaycheck.amount) }}</div>
        <div v-else class="job-value job-value-empty">{{ t('jobCard.noPaycheck') }}</div>
      </div>
      <div v-if="job.lastPaycheck" class="job-last-amount">
        <div class="job-label">{{ t('jobCard.date') }}</div>
        <div class="job-last-value">{{ formatDate(job.lastPaycheck.date) }}</div>
      </div>
    </div>

    <div class="job-details">
      <div v-if="job.fixedAmount" class="job-detail-item fixed-pay">
        <span>{{ t('jobCard.fixedPay.label') }}</span>
        <strong>{{ formatCurrency(job.fixedAmount) }} {{ t('jobCard.fixedPay.automatic') }}</strong>
      </div>
      <div v-if="job.nextPaydayDate" class="job-detail-item">
        <span>{{ t('jobCard.nextPayday') }}</span>
        <strong>{{ formatPayday(job.nextPaydayDate) }}</strong>
      </div>
      <div v-if="job.accountName" class="job-detail-item">
        <span>{{ t('jobCard.account') }}</span>
        <strong>{{ job.accountName }}</strong>
      </div>
      <div v-if="job.lastPayment" class="job-detail-item">
        <span>{{ t('jobCard.lastDeposit') }}</span>
        <strong>{{ formatDate(job.lastPayment) }}</strong>
      </div>
      <div v-if="job.nextPayment" class="job-detail-item">
        <span>{{ t('jobCard.nextDeposit') }}</span>
        <strong>{{ formatDate(job.nextPayment) }}</strong>
      </div>
    </div>

    <!-- Distribution rules: where each paycheck goes -->
    <div class="job-rules">
      <div class="job-label">{{ t('jobCard.rules.header') }} <HelpTip topic="paycheckSplit" faq="allocation" /></div>
      <ul v-if="job.rules?.length" class="job-rules-list">
        <li v-for="(rule, index) in job.rules" :key="index" class="job-rule-row">
          <span>{{ rule.envelopeName }}</span>
          <strong>{{ ruleAmount(rule, index) }}</strong>
        </li>
      </ul>

      <!-- Paid plans: what the rules take from the next paycheck, and what is left over -->
      <div v-if="preview && job.rules?.length" class="job-preview">
        <div class="job-rule-row job-preview-total">
          <span>{{ t('jobCard.preview.total') }} <HelpTip topic="paycheckPreview" faq="paycheckPreview" /></span>
          <strong>{{ formatCurrency(preview.total) }}</strong>
        </div>
        <div
          v-if="preview.surplus"
          class="job-rule-row job-preview-surplus"
          :class="preview.surplus.amount < 0 ? 'is-deficit' : 'is-surplus'"
        >
          <span>{{ preview.surplus.amount < 0 ? t('jobCard.preview.deficit') : t('jobCard.preview.surplus') }}</span>
          <strong>{{ formatCurrency({ ...preview.surplus, amount: Math.abs(preview.surplus.amount) }) }}</strong>
        </div>
        <p class="job-preview-hint">
          {{ preview.paycheckAmount
            ? t('jobCard.preview.basis', { amount: formatCurrency(preview.paycheckAmount), date: formatPayday(preview.payDate) })
            : t('jobCard.preview.noPaycheck') }}
        </p>
      </div>
      <p v-else-if="!canPlan && job.rules?.length" class="job-preview-hint">{{ t('jobCard.preview.paidHint') }}</p>
      <p v-else class="job-rules-empty">
        <i class="mdi mdi-alert-outline"></i>
        {{ t('jobCard.rules.empty') }}
      </p>
    </div>

    <div class="job-actions">
      <!-- With a fixed pay the paycheck arrives on its own: no manual deposit -->
      <button v-if="!job.fixedAmount" class="btn btn-primary" @click="emit('deposit', job)">
        <i class="mdi mdi-plus"></i>
        {{ t('jobCard.deposit') }}
      </button>
      <button v-else class="btn btn-primary" @click="emit('adjust', job)">
        <i class="mdi mdi-tune-variant"></i>
        {{ t('jobCard.adjust') }}
      </button>
      <button class="btn btn-primary-sm" @click="emit('edit', job)">
        <i class="mdi mdi-pencil"></i>
        {{ t('common.edit') }}
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

.job-preview {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-top: 0.5rem;
  border-top: 1px dashed var(--border);
}

.job-preview-total strong {
  color: var(--text-primary);
}

.job-preview-surplus.is-surplus strong {
  color: var(--success);
}

.job-preview-surplus.is-deficit strong {
  color: var(--danger, #dc2626);
}

.job-preview-surplus.is-deficit strong::before {
  content: '−';
}

.job-preview-hint {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-muted);
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
.job-detail-item.fixed-pay strong {
  color: var(--success);
}
</style>
