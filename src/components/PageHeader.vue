<script setup lang="ts">
import { computed } from 'vue'

interface TierBadge {
  tier: 'Free' | 'Pro' | 'Family'
  price?: string
}

defineProps<{
  title: string
  subtitle?: string
  tierBadge?: TierBadge
}>()

const tierColor = computed(() => {
  const tier = arguments[0].tierBadge?.tier
  const colorMap: Record<string, string> = {
    Free: '#f3f4f6',
    Pro: '#dbeafe',
    Family: '#dcfce7'
  }
  return colorMap[tier || 'Free'] || '#f3f4f6'
})

const tierTextColor = computed(() => {
  const tier = arguments[0].tierBadge?.tier
  const colorMap: Record<string, string> = {
    Free: '#4b5563',
    Pro: '#1e40af',
    Family: '#166534'
  }
  return colorMap[tier || 'Free'] || '#4b5563'
})
</script>

<template>
  <div class="page-header">
    <div class="page-header-top">
      <div v-if="tierBadge" class="tier-badge" :style="{ background: tierColor, color: tierTextColor }">
        <i class="mdi mdi-star"></i>
        Plan {{ tierBadge.tier }}<span v-if="tierBadge.price"> - {{ tierBadge.price }}</span>
      </div>
      <div class="page-header-actions">
        <slot name="actions"></slot>
      </div>
    </div>
    <div class="page-title">{{ title }}</div>
    <div v-if="subtitle" class="page-subtitle">{{ subtitle }}</div>
  </div>
</template>

<style scoped>

.page-header {
  margin-bottom: 2rem;
}

.page-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.page-header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.tier-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.875rem;
}

.tier-badge i {
  font-size: 1rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.page-subtitle {
  font-size: 1rem;
  color: var(--text-muted);
}

@media (max-width: 640px) {
  .page-title {
    font-size: 1.5rem;
  }

  .page-subtitle {
    font-size: 0.95rem;
  }
}
</style>
