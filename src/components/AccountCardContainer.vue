<script setup lang="ts">
import { ref, computed } from 'vue'
import EnvelopeCard from './EnvelopeCard.vue'
import AccountBalanceChart from './AccountBalanceChart.vue'

interface Money {
  amount: number
  currency: string
}

interface Account {
  id: string
  name: string
  type: string
  currency: string
  latestBalance?: { amount?: number }
  latestSnapshot?: { amount?: { amount?: number } }
}

interface Envelope {
  id: string
  name: string
  homeAccountId: string
  balance?: Money
  targetAmount?: Money
  purpose?: string
  billDetails?: {
    frequency?: string
    targetDate?: string
  }
  isShared?: boolean
}

const props = withDefaults(defineProps<{
  account: Account
  envelopes: Envelope[]
}>(), {})

const emit = defineEmits<{
  'add-envelope': [accountId: string]
  'edit-envelope': [envelope: Envelope]
  'pay-envelope': [envelope: Envelope]
  'transfer-envelope': [envelope: Envelope]
  'withdraw-envelope': [envelope: Envelope]
  'edit-account': [account: Account]
  'edit-balance': [account: Account]
}>()

const isExpanded = ref(true)

const accountBalance = computed(() => {
  return props.account.latestBalance?.amount ?? props.account.latestSnapshot?.amount?.amount ?? 0
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
    investment: 'mdi-chart-line'
  }
  return typeMap[type?.toLowerCase()] || 'mdi-bank'
}

const getIconBackground = (type: string) => {
  const typeMap: Record<string, string> = {
    checking: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    savings: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
    credit: 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)',
    investment: 'linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%)'
  }
  return typeMap[type?.toLowerCase()] || 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
}

const getIconColor = (type: string) => {
  const typeMap: Record<string, string> = {
    checking: 'var(--primary)',
    savings: 'var(--success)',
    credit: 'var(--danger)',
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
        <div class="account-icon" :style="{ background: getIconBackground(account.type), color: getIconColor(account.type) }">
          <i :class="`mdi ${getAccountIcon(account.type)}`"></i>
        </div>
        <div class="account-info-text">
          <div class="account-name">{{ account.name }}</div>
          <div class="account-meta">
            <span><i class="mdi mdi-globe" style="font-size: 0.75rem;"></i> {{ account.currency || 'CAD' }}</span>
            <span>{{ account.type }}</span>
          </div>
        </div>
      </div>
      <div class="account-balance-section">
        <div class="account-balance">
          <div class="account-balance-label">Solde</div>
          <div class="account-balance-amount">{{ formatCurrency(accountBalance) }}</div>
        </div>
        <button class="btn-adjust-balance" @click.stop="emit('edit-balance', account)">
          Ajuster le solde
        </button>
      </div>
      <button class="expand-toggle" :class="{ rotated: isExpanded }" @click.stop="toggleExpand">
        <i class="mdi mdi-chevron-up"></i>
      </button>
    </div>

    <!-- Account Body (Envelopes) -->
    <div v-show="isExpanded" class="account-body" :class="{ expanded: isExpanded }">
      <!-- Balance History Chart -->
      <div class="chart-section">
        <h4 class="section-subtitle">Historique de solde</h4>
        <AccountBalanceChart :account-id="account.id" :days="7" />
      </div>

      <h4 class="section-subtitle">Enveloppes ({{ envelopesCount }}/20)</h4>

      <div v-if="envelopes.length === 0" class="empty-envelopes">
        <i class="mdi mdi-inbox-outline"></i>
        <p>Aucune enveloppe pour ce compte</p>
      </div>

      <div v-else class="envelopes-grid">
        <EnvelopeCard
          v-for="envelope in envelopes"
          :key="envelope.id"
          :envelope="envelope"
          @edit="emit('edit-envelope', $event)"
          @pay="emit('pay-envelope', $event)"
          @transfer="emit('transfer-envelope', $event)"
          @withdraw="emit('withdraw-envelope', $event)"
        />
      </div>

      <div class="account-actions">
        <button class="btn btn-primary-sm" @click="emit('add-envelope', account.id)">
          <i class="mdi mdi-plus"></i>
          Ajouter une enveloppe
        </button>
        <button class="btn btn-secondary-sm" @click="emit('edit-account', account)">
          <i class="mdi mdi-pencil"></i>
          Éditer le compte
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
  padding: 1.5rem;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  align-items: center;
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

.account-balance-amount {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--success);
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
  padding: 1.5rem;
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

.section-subtitle {
  margin-bottom: 1rem;
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
}

.chart-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
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

.envelopes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
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
  .envelopes-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}

@media (max-width: 640px) {
  .account-header-main {
    grid-template-columns: 1fr;
    padding: 1rem;
  }

  .account-info {
    grid-template-columns: 1fr;
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

  .envelopes-grid {
    grid-template-columns: 1fr;
  }

  .account-actions {
    flex-direction: column;
  }
}
</style>
