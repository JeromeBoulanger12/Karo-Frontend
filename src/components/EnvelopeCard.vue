<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Money {
  amount: number
  currency: string
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
  envelope: Envelope
}>(), {})

const emit = defineEmits<{
  edit: [envelope: Envelope]
}>()

const { t } = useI18n()

const percentage = computed(() => {
  if (!props.envelope.balance || !props.envelope.targetAmount) return 0
  const target = props.envelope.targetAmount.amount
  if (target === 0) return 0
  return Math.min((props.envelope.balance.amount / target) * 100, 100)
})

const categoryBadgeClass = computed(() => {
  const purpose = props.envelope.purpose?.toLowerCase()
  if (purpose?.includes('rent') || purpose?.includes('loyer') || purpose?.includes('utility') || purpose?.includes('electricity')) {
    return 'essential'
  }
  if (purpose?.includes('savings') || purpose?.includes('épargne') || purpose?.includes('emergency')) {
    return 'savings'
  }
  return 'discretionary'
})

const categoryLabel = computed(() => {
  const categoryMap: Record<string, string> = {
    essential: 'Essentiel',
    savings: 'Épargne',
    discretionary: 'Loisir'
  }
  return categoryMap[categoryBadgeClass.value] || 'Autre'
})

const statusIcon = computed(() => {
  if (percentage.value >= 100) return '✓'
  if (percentage.value >= 75) return '⚠'
  return '✓'
})

const statusColor = computed(() => {
  if (percentage.value >= 100) return 'var(--success)'
  if (percentage.value >= 75) return 'var(--warning)'
  return 'var(--success)'
})

const formatCurrency = (money: Money | undefined) => {
  if (!money) return '$0.00'
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: money.currency || 'CAD'
  }).format(money.amount)
}
</script>

<template>
  <div class="envelope-card" @click="emit('edit', envelope)">
    <div class="envelope-header">
      <div class="envelope-name">{{ envelope.name }}</div>
      <div class="envelope-badge" :class="categoryBadgeClass">
        {{ categoryLabel }}
      </div>
    </div>

    <div class="envelope-amount">
      <div class="envelope-balance">{{ formatCurrency(envelope.balance) }}</div>
      <div class="envelope-target">/ {{ formatCurrency(envelope.targetAmount) }}</div>
    </div>

    <div class="envelope-progress">
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" :style="{ width: percentage + '%' }"></div>
      </div>
      <div class="progress-text">
        <span>{{ percentage.toFixed(1) }}%</span>
        <span :style="{ color: statusColor }">{{ statusIcon }}</span>
      </div>
    </div>

    <div v-if="envelope.billDetails?.targetDate" class="envelope-bill-date">
      <i class="mdi mdi-calendar"></i>
      {{ envelope.billDetails.targetDate }}
    </div>

    <div v-if="envelope.isShared" class="envelope-shared-badge">
      <i class="mdi mdi-account-multiple"></i>
      {{ t('common.shared') || 'Partagé' }}
    </div>
  </div>
</template>

<style scoped>

.envelope-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: all 0.3s ease;
  position: relative;
  cursor: pointer;
}

.envelope-card:hover {
  border-color: var(--primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.envelope-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}

.envelope-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
  flex: 1;
}

.envelope-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}

.envelope-badge.essential {
  background: #fee2e2;
  color: #991b1b;
}

.envelope-badge.savings {
  background: #dcfce7;
  color: #166534;
}

.envelope-badge.discretionary {
  background: #dbeafe;
  color: #0c4a6e;
}

.envelope-amount {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.25rem;
}

.envelope-balance {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--primary);
}

.envelope-target {
  font-size: 0.75rem;
  color: var(--text-muted);
  flex-shrink: 0;
}

.envelope-progress {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-bar-bg {
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--secondary));
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.envelope-bill-date {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.envelope-bill-date i {
  font-size: 0.75rem;
}

.envelope-shared-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #fef3c7;
  color: #92400e;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}

.envelope-shared-badge i {
  font-size: 0.75rem;
}
</style>
