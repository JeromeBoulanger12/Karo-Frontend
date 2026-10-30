<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { accountsApi } from '../api/accounts'

interface BalanceSnapshot {
  capturedAt: string
  amount: { amount: number; currency: string }
}

const props = withDefaults(defineProps<{
  accountId: string
  days?: number
}>(), {
  days: 30
})

const WIDTH = 120
const HEIGHT = 36
const PADDING = 3

const points = ref<number[]>([])

const load = async () => {
  try {
    const { data } = await accountsApi.getAccountBalanceHistory(props.accountId, props.days)
    const snapshots = (data as BalanceSnapshot[]) ?? []
    points.value = snapshots
      .slice()
      .sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime())
      .map(s => s.amount.amount)
  } catch (err) {
    console.error('Error loading balance sparkline:', err)
    points.value = []
  }
}

watch(() => props.accountId, load, { immediate: true })

// Hidden when there is no trend to show
const hasTrend = computed(() => points.value.length >= 2)

const path = computed(() => {
  const values = points.value
  if (values.length < 2) return ''
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  return values
    .map((value, i) => {
      const x = PADDING + (i / (values.length - 1)) * (WIDTH - 2 * PADDING)
      const y = PADDING + (1 - (value - min) / range) * (HEIGHT - 2 * PADDING)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
})

const trendClass = computed(() => {
  const values = points.value
  if (values.length < 2) return ''
  return values[values.length - 1] >= values[0] ? 'up' : 'down'
})
</script>

<template>
  <div v-if="hasTrend" class="sparkline" :class="trendClass" :title="`Solde sur ${days} jours`">
    <svg :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" preserveAspectRatio="none" role="img" aria-label="Tendance du solde">
      <path :d="path" fill="none" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
    </svg>
  </div>
</template>

<style scoped>
.sparkline {
  width: 120px;
  height: 36px;
  flex-shrink: 0;
}

.sparkline svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.sparkline.up path {
  stroke: var(--success);
}

.sparkline.down path {
  stroke: var(--danger);
}

@media (max-width: 640px) {
  .sparkline {
    display: none;
  }
}
</style>
