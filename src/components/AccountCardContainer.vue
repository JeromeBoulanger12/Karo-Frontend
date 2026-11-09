<script setup lang="ts">
import { ref, computed, inject, watch, onBeforeUnmount } from 'vue'
import Sortable from 'sortablejs'
import EnvelopeRow from './EnvelopeRow.vue'
import AccountBalanceChart from './AccountBalanceChart.vue'
import AccountSparkline from './AccountSparkline.vue'
import { useI18n } from 'vue-i18n'
import type { EnvelopeSummary } from '../utils/envelopes'
import { isCreditAccount } from '../utils/accounts'

interface Account {
  id: string
  name: string
  type: string
  currency: string
  latestBalance?: { amount?: number }
  latestSnapshot?: { amount?: { amount?: number } }
  creditLimit?: { amount: number; currency?: string } | null
}

const { t } = useI18n()

const props = withDefaults(defineProps<{
  account: Account
  envelopes: EnvelopeSummary[]
  history?: { capturedAt: string; amount: { amount: number; currency: string } }[]
  // Balance minus the total of this account's envelopes; negative means a deficit
  surplus?: number | null
  // When the balance was last recorded; old or missing values are flagged as stale
  balanceDate?: string | null
}>(), { surplus: null, balanceDate: null })

const STALE_AFTER_DAYS = 7
const balanceAgeDays = computed(() => {
  if (!props.balanceDate) return null
  return Math.floor((Date.now() - new Date(props.balanceDate).getTime()) / (24 * 60 * 60 * 1000))
})
const isBalanceStale = computed(() => balanceAgeDays.value === null || balanceAgeDays.value > STALE_AFTER_DAYS)
const balanceFreshnessLabel = computed(() => {
  if (balanceAgeDays.value === null) return t('dashboard.account.balanceNone')
  if (balanceAgeDays.value === 0) return t('dashboard.account.balanceToday')
  return t('dashboard.account.balanceDaysAgo', { days: balanceAgeDays.value })
})

const emit = defineEmits<{
  'add-envelope': [accountId: string]
  'select-envelope': [envelope: EnvelopeSummary]
  'edit-envelope': [envelope: EnvelopeSummary]
  'pay-envelope': [envelope: EnvelopeSummary]
  'transfer-envelope': [envelope: EnvelopeSummary]
  'withdraw-envelope': [envelope: EnvelopeSummary]
  'edit-account': [account: Account]
  'edit-balance': [account: Account]
  'view-history': [account: Account]
  'reorder-envelopes': [accountId: string, envelopeIds: string[]]
}>()

// Drag and drop to arrange this account's envelopes. On a touch screen a short press starts the drag,
// so a plain swipe still scrolls the list.
const envelopeListEl = ref<HTMLElement | null>(null)
let sortable: Sortable | null = null

watch(envelopeListEl, (el) => {
  sortable?.destroy()
  sortable = el
    ? Sortable.create(el, {
        animation: 150,
        delay: 250,
        delayOnTouchOnly: true,
        touchStartThreshold: 5,
        disabled: !canArrange.value,
        onEnd: (evt) => {
          const oldIndex = evt.oldIndex ?? 0
          const newIndex = evt.newIndex ?? 0
          if (oldIndex === newIndex) return

          // Sortable moved the element in the DOM; put it back so Vue stays in charge of the list.
          // The new order is then applied from the data, and the dashboard reloads.
          evt.item.remove()
          evt.from.insertBefore(evt.item, evt.from.children[oldIndex] ?? null)

          const ids = props.envelopes.map(e => e.id)
          const [moved] = ids.splice(oldIndex, 1)
          ids.splice(newIndex, 0, moved)
          emit('reorder-envelopes', props.account.id, ids)
        }
      })
    : null
}, { flush: 'post' })

onBeforeUnmount(() => sortable?.destroy())

// Accounts start folded: the header shows the balance and surplus, and the envelopes open on demand
const isExpanded = ref(false)
// The full history chart is heavy; the header sparkline shows the trend, this opens the detail
const showHistory = ref(false)

// Balance history visuals are part of the paid tiers; provided by App.vue from the subscription
const subscriptionFeatures = inject('subscriptionFeatures', ref({ allowBalanceHistory: false, allowPlanning: false }))
const canShowHistory = computed(() => !!subscriptionFeatures.value.allowBalanceHistory)

// Free plan: the envelopes stay in their order but cannot be dragged. Declared after subscriptionFeatures,
// because the watch below reads it during setup.
const canArrange = computed(() => !!subscriptionFeatures.value.allowPlanning)
watch(canArrange, (allowed) => sortable?.option('disabled', !allowed))

const accountBalance = computed(() => {
  return props.account.latestBalance?.amount ?? props.account.latestSnapshot?.amount?.amount ?? 0
})

// A credit card's balance is what is owed: shown in red, and no surplus
const isCredit = computed(() => isCreditAccount(props.account.type))

// Credit utilisation: the amount owed against the credit limit. Below 30% is good, 30% to 50% is a
// warning and 50% or more is high, the usual guideline for a card's standing.
const creditLimit = computed(() => props.account.creditLimit?.amount ?? null)
const creditUsage = computed(() => {
  if (!isCredit.value || !creditLimit.value || creditLimit.value <= 0) return null
  return (accountBalance.value / creditLimit.value) * 100
})
const creditUsageLevel = computed(() => {
  const percent = creditUsage.value
  if (percent === null) return null
  if (percent < 30) return 'good'
  if (percent < 50) return 'warning'
  return 'danger'
})

const envelopesCount = computed(() => {
  return props.envelopes.length
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: props.account.currency || 'CAD'
  }).format(value)
}

const getAccountIcon = (type: string) => {
  const typeMap: Record<string, string> = {
    checking: 'mdi-bank',
    savings: 'mdi-piggy-bank',
    credit: 'mdi-credit-card',
    creditcard: 'mdi-credit-card',
    investment: 'mdi-chart-line'
  }
  return typeMap[type?.toLowerCase()] || 'mdi-bank'
}

const getIconBackground = (type: string) => {
  const typeMap: Record<string, string> = {
    checking: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    savings: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
    credit: 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)',
    creditcard: 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)',
    investment: 'linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%)'
  }
  return typeMap[type?.toLowerCase()] || 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
}

const getIconColor = (type: string) => {
  const typeMap: Record<string, string> = {
    checking: 'var(--primary)',
    savings: 'var(--success)',
    credit: 'var(--danger)',
    creditcard: 'var(--danger)',
    investment: 'var(--secondary)'
  }
  return typeMap[type?.toLowerCase()] || 'var(--primary)'
}

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div class="account-container">
    <!-- Account Header -->
    <div class="account-header-main" :class="{ expanded: isExpanded }" @click="toggleExpand">
      <div class="account-info">
        <div class="account-leading">
          <button class="btn-edit-account" :title="t('dashboard.account.editAccount')" :aria-label="t('dashboard.account.editAccount')" @click.stop="emit('edit-account', account)">
            <i class="mdi mdi-pencil"></i>
          </button>
          <div class="account-icon" :style="{ background: getIconBackground(account.type), color: getIconColor(account.type) }">
            <i :class="`mdi ${getAccountIcon(account.type)}`"></i>
          </div>
        </div>
        <div class="account-info-text">
          <div class="account-name">{{ account.name }}</div>
          <div class="account-meta">
            <span><i class="mdi mdi-globe" style="font-size: 0.75rem;"></i> {{ account.currency || 'CAD' }}</span>
            <span>{{ account.type }}</span>
          </div>
        </div>
      </div>
      <AccountSparkline v-if="canShowHistory" :account-id="account.id" :history="history" />
      <div class="account-balance-section">
        <div class="account-balance">
          <div class="account-balance-label">{{ t('dashboard.account.balance') }}</div>
          <div class="account-balance-amount" :class="{ 'is-debt': isCredit }">{{ formatCurrency(accountBalance) }}</div>
          <div v-if="creditUsage !== null" class="credit-usage" :class="`is-${creditUsageLevel}`">
            <div class="credit-usage-text">
              <span>{{ formatCurrency(accountBalance) }} sur {{ formatCurrency(creditLimit ?? 0) }}</span>
              <span class="credit-usage-percent">{{ Math.round(creditUsage) }} %</span>
            </div>
            <div class="credit-usage-track">
              <div class="credit-usage-fill" :style="{ width: `${Math.min(creditUsage, 100)}%` }"></div>
            </div>
          </div>
          <div v-else-if="isCredit" class="credit-usage-missing">Limite de crédit non renseignée</div>
          <div class="balance-freshness" :class="{ 'is-stale': isBalanceStale }">{{ balanceFreshnessLabel }}</div>
          <div v-if="surplus !== null && !isCredit" class="surplus-box" :class="surplus < 0 ? 'is-deficit' : 'is-surplus'">
            <i class="mdi" :class="surplus < 0 ? 'mdi-alert-circle' : 'mdi-check-circle'"></i>
            <div class="surplus-text">
              <span class="surplus-label">{{ surplus < 0 ? t('dashboard.stats.deficit') : t('dashboard.stats.surplus') }}</span>
              <span class="surplus-amount">{{ formatCurrency(Math.abs(surplus)) }}</span>
            </div>
          </div>
        </div>
        <div class="balance-actions">
          <button class="btn-adjust-balance" @click.stop="emit('edit-balance', account)">
            {{ t('dashboard.account.adjustBalance') }}
          </button>
          <button v-if="canShowHistory" class="btn-adjust-balance" @click.stop="emit('view-history', account)">
            {{ t('dashboard.account.history') }}
          </button>
        </div>
      </div>
      <button class="expand-toggle" :class="{ rotated: isExpanded }" @click.stop="toggleExpand">
        <i class="mdi mdi-chevron-up"></i>
      </button>
    </div>

    <!-- Account Body (Envelopes) -->
    <div v-show="isExpanded" class="account-body" :class="{ expanded: isExpanded }">
      <div class="section-header">
        <h4 class="section-subtitle">{{ t('dashboard.account.envelopesCount', { count: envelopesCount }) }}</h4>
        <button v-if="canShowHistory" class="btn-link" @click="showHistory = !showHistory">
          <i class="mdi" :class="showHistory ? 'mdi-chart-line-variant' : 'mdi-chart-line'"></i>
          {{ showHistory ? t('dashboard.account.hideHistory') : t('dashboard.account.showHistory') }}
        </button>
      </div>

      <div v-if="canShowHistory && showHistory" class="chart-section">
        <AccountBalanceChart :account-id="account.id" :days="30" />
      </div>

      <div v-if="envelopes.length === 0" class="empty-envelopes">
        <i class="mdi mdi-inbox-outline"></i>
        <p>{{ t('dashboard.account.noEnvelopes') }}</p>
      </div>

      <div v-else ref="envelopeListEl" class="envelope-list">
        <EnvelopeRow
          v-for="envelope in envelopes"
          :data-id="envelope.id"
          :key="envelope.id"
          :envelope="envelope"
          @select="emit('select-envelope', $event)"
          @edit="emit('edit-envelope', $event)"
          @pay="emit('pay-envelope', $event)"
          @transfer="emit('transfer-envelope', $event)"
          @withdraw="emit('withdraw-envelope', $event)"
        />
      </div>

      <div class="account-actions">
        <button class="btn btn-primary-sm" @click="emit('add-envelope', account.id)">
          <i class="mdi mdi-plus"></i>
          {{ t('dashboard.account.addEnvelope') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>

.account-container {
  background: white;
  border: 2px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
}

.account-container:hover {
  border-color: var(--primary);
  box-shadow: var(--shadow-lg);
}

.account-header-main {
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  cursor: pointer;
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  border-bottom: 1px solid var(--border);
  transition: all 0.3s ease;
}

.account-header-main:hover {
  background: linear-gradient(135deg, #f0f4ff 0%, #ffffff 100%);
}

.account-header-main.expanded {
  border-bottom-color: var(--primary);
}

.account-info {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.credit-usage {
  --usage-color: #16a34a;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.5rem;
  min-width: 220px;
}

.credit-usage.is-warning {
  --usage-color: #ca8a04;
}

.credit-usage.is-danger {
  --usage-color: #dc2626;
}

.credit-usage-text {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.credit-usage-percent {
  font-weight: 700;
  color: var(--usage-color);
}

.credit-usage-track {
  height: 8px;
  border-radius: 4px;
  background: var(--surface);
  overflow: hidden;
}

.credit-usage-fill {
  height: 100%;
  background: var(--usage-color);
  transition: width 0.3s ease;
}

.credit-usage-missing {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--text-muted);
  font-style: italic;
}

.account-leading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-edit-account {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1.125rem;
  padding: 0.25rem;
  border-radius: 6px;
  line-height: 1;
}

.btn-edit-account:hover {
  color: var(--primary);
  background: var(--surface);
}

.account-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.account-info-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.account-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
}

.account-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.account-balance-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.account-balance {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
}

.account-balance-label {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.balance-freshness {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.balance-freshness.is-stale {
  color: var(--warning);
  font-weight: 600;
}

/* Surplus / deficit of the account: a boxed callout, so it reads at a glance */
.surplus-box {
  margin-top: 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.9rem 0.5rem 0.75rem;
  border-radius: 10px;
  border-left: 5px solid;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.surplus-box > .mdi {
  font-size: 1.5rem;
}

.surplus-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.surplus-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.surplus-amount {
  font-size: 1.15rem;
  font-weight: 800;
}

.surplus-box.is-surplus {
  background: #ecfdf5;
  border-color: #10b981;
  color: #047857;
}

.surplus-box.is-deficit {
  background: #fef2f2;
  border-color: #ef4444;
  color: #b91c1c;
}

.surplus-box.is-deficit .surplus-amount::before {
  content: '−';
}

.account-balance-amount {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--success);
}

.account-balance-amount.is-debt {
  color: var(--danger);
}

.balance-actions {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.btn-adjust-balance {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid var(--primary);
  color: var(--primary);
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-adjust-balance:hover {
  background: var(--primary);
  color: white;
}

.expand-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--primary);
  transition: all 0.3s ease;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.expand-toggle:hover {
  background: var(--surface);
}

.expand-toggle.rotated {
  transform: rotate(180deg);
}

.account-body {
  padding: 1.25rem 1.5rem;
  background: var(--surface);
  display: none;
}

.account-body.expanded {
  display: block;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.section-subtitle {
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.btn-link {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.btn-link:hover {
  text-decoration: underline;
}

.chart-section {
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border);
}

.empty-envelopes {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--text-muted);
}

.empty-envelopes i {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
  color: var(--border);
}

.envelope-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.account-actions {
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

.btn-secondary-sm {
  background: white;
  color: var(--primary);
  border: 1px solid var(--border);
}

.btn-secondary-sm:hover {
  background: var(--surface);
  border-color: var(--primary);
}

@media (max-width: 1024px) {
  .account-header-main {
    flex-wrap: wrap;
  }
}

@media (max-width: 640px) {
  .account-header-main {
    padding: 1rem;
    flex-direction: column;
    align-items: stretch;
    position: relative;
  }

  .account-info {
    grid-template-columns: 1fr;
  }

  .account-balance-section {
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .account-balance {
    text-align: left;
    order: -1;
  }

  .expand-toggle {
    position: absolute;
    top: 1rem;
    right: 1rem;
  }

  .account-body {
    padding: 1rem;
  }

  .account-actions {
    flex-direction: column;
  }
}
</style>
