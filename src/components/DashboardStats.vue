<script setup lang="ts">
const props = withDefaults(defineProps<{
  totalBalance?: number
  envelopesCount?: number
  jobsCount?: number
  spendingThisMonth?: number
  expectedIncome?: number
}>(), {
  totalBalance: 0,
  envelopesCount: 0,
  jobsCount: 0,
  spendingThisMonth: 0,
  expectedIncome: 0
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD'
  }).format(value)
}
</script>

<template>
  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-label">Solde total</div>
      <div class="stat-value">{{ formatCurrency(totalBalance) }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Enveloppes</div>
      <div class="stat-value">{{ envelopesCount }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Revenus prévus</div>
      <div class="stat-value" style="color: var(--success)">{{ formatCurrency(expectedIncome) }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Dépenses ce mois</div>
      <div class="stat-value" style="color: var(--warning)">{{ formatCurrency(spendingThisMonth) }}</div>
    </div>
  </div>
</template>

<style scoped>

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.stat-card:hover {
  border-color: var(--primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: var(--primary);
}

@media (max-width: 640px) {
  .stats-row {
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }
}
</style>
