<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Keys of the questions in the locale files (faq.items.<key>.question / .answer)
const ITEMS = [
  'envelope',
  'accountVsEnvelope',
  'expectedIncome',
  'addIncome',
  'allocation',
  'paid',
  'transferWithdraw',
  'debt',
  'sharing'
] as const
</script>

<template>
  <div class="faq">
    <header class="faq-header">
      <router-link to="/dashboard" class="back-link">
        <i class="mdi mdi-arrow-left"></i>
        {{ t('faq.back') }}
      </router-link>
      <h1>{{ t('faq.title') }}</h1>
      <p class="intro">{{ t('faq.intro') }}</p>
    </header>

    <div class="faq-list">
      <details v-for="id in ITEMS" :key="id" class="faq-item">
        <summary>{{ t(`faq.items.${id}.question`) }}</summary>
        <p>{{ t(`faq.items.${id}.answer`) }}</p>
      </details>
    </div>
  </div>
</template>

<style scoped>
.faq {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.faq-header h1 {
  font-size: 1.75rem;
  color: var(--text-primary);
  margin: 0.5rem 0 0.25rem;
}

.intro {
  color: var(--text-muted);
  margin: 0;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--primary);
  font-size: 0.875rem;
  text-decoration: none;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.faq-item {
  background: white;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem 1.25rem;
}

.faq-item summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--text-primary);
}

.faq-item p {
  margin: 0.75rem 0 0;
  color: var(--text-muted);
  line-height: 1.6;
}
</style>
