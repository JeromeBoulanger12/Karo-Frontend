<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
} from 'chart.js'
import { accountsApi } from '../api/accounts'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

interface BalanceSnapshot {
  capturedAt: string
  amount: { amount: number; currency: string }
}

const props = withDefaults(defineProps<{
  accountId: string
  days?: number
}>(), {
  days: 7
})

const chartData = ref(null)
const chartOptions = ref(null)
const loading = ref(true)

const loadBalanceHistory = async () => {
  try {
    loading.value = true
    const response = await accountsApi.getAccountBalanceHistory(props.accountId, props.days)
    const snapshots = response.data as BalanceSnapshot[]

    if (!snapshots || snapshots.length === 0) {
      chartData.value = {
        labels: [],
        datasets: [{ data: [], borderColor: 'transparent', fill: false }]
      }
      loading.value = false
      return
    }

    // Sort by date
    const sorted = snapshots.sort((a, b) =>
      new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime()
    )

    const labels = sorted.map(s => {
      const date = new Date(s.capturedAt)
      return date.toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' })
    })

    const amounts = sorted.map(s => s.amount.amount)

    chartData.value = {
      labels,
      datasets: [{
        label: 'Solde',
        data: amounts,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointHoverRadius: 5
      }]
    }

    chartOptions.value = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: { size: 12 },
          bodyFont: { size: 11 },
          displayColors: false,
          callbacks: {
            label: (context) => {
              const value = context.parsed.y
              return new Intl.NumberFormat('fr-CA', {
                style: 'currency',
                currency: 'CAD'
              }).format(value)
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          grid: { display: false },
          ticks: { font: { size: 10 }, color: '#9ca3af' }
        },
        y: {
          display: true,
          grid: { color: 'rgba(0, 0, 0, 0.05)' },
          ticks: {
            font: { size: 10 },
            color: '#9ca3af',
            callback: (value) => {
              return '$' + (value / 1000).toFixed(0) + 'k'
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Error loading balance history:', err)
  } finally {
    loading.value = false
  }
}

watch(() => props.accountId, () => {
  loadBalanceHistory()
}, { immediate: true })

onMounted(() => {
  loadBalanceHistory()
})
</script>

<template>
  <div class="balance-chart-container">
    <div v-if="loading" class="chart-loading">
      <div class="spinner"></div>
    </div>
    <Line v-else-if="chartData" :data="chartData" :options="chartOptions" />
    <div v-else class="chart-empty">
      No balance history available
    </div>
  </div>
</template>

<style scoped>
.balance-chart-container {
  width: 100%;
  height: 200px;
  position: relative;
  padding: 1rem 0;
}

.chart-loading,
.chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
