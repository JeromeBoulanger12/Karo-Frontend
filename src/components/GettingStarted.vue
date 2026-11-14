<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

// Checklist of the first things to set up. Each item checks itself from the dashboard data, so it also
// guides people who skipped the setup wizard or joined a household that already had accounts.
const props = defineProps<{
  accounts: any[]
  envelopes: any[]
  jobs: any[]
}>()

const emit = defineEmits<{
  'add-account': []
  'edit-balance': [account: any]
  'add-job': []
  'add-envelope': [accountId: string]
  'edit-envelope': [envelope: any]
  deposit: [job: any]
}>()

const { t } = useI18n()

// Closing the card is remembered on this device
const STORAGE_KEY = 'karo.gettingStarted.dismissed'
const dismissed = ref(localStorage.getItem(STORAGE_KEY) === '1')
const dismiss = () => {
  localStorage.setItem(STORAGE_KEY, '1')
  dismissed.value = true
}

const linkedEnvelopeIds = computed(() => new Set(props.jobs.flatMap(job => (job.rules ?? []).map((r: any) => r.envelopeId))))
const accountWithoutBalance = computed(() => props.accounts.find(a => !a.latestSnapshotDate))
const unlinkedEnvelope = computed(() => props.envelopes.find(e => !linkedEnvelopeIds.value.has(e.id)))

const items = computed(() => [
  {
    key: 'account',
    done: props.accounts.length > 0,
    action: () => emit('add-account')
  },
  {
    key: 'balance',
    done: props.accounts.length > 0 && !accountWithoutBalance.value,
    action: () => accountWithoutBalance.value ? emit('edit-balance', accountWithoutBalance.value) : emit('add-account')
  },
  {
    key: 'job',
    done: props.jobs.length > 0,
    action: () => emit('add-job')
  },
  {
    key: 'envelope',
    done: props.envelopes.length > 0,
    action: () => props.accounts[0] ? emit('add-envelope', props.accounts[0].id) : emit('add-account')
  },
  {
    key: 'link',
    done: linkedEnvelopeIds.value.size > 0,
    action: () => unlinkedEnvelope.value ? emit('edit-envelope', unlinkedEnvelope.value) : emit('add-job')
  },
  {
    key: 'deposit',
    done: props.jobs.some(job => job.lastPaycheck || job.fixedAmount),
    action: () => props.jobs[0] ? emit('deposit', props.jobs[0]) : emit('add-job')
  }
])

const doneCount = computed(() => items.value.filter(i => i.done).length)
const visible = computed(() => !dismissed.value && doneCount.value < items.value.length)
</script>

<template>
  <section v-if="visible" class="getting-started">
    <header>
      <div>
        <h2><i class="mdi mdi-rocket-launch-outline"></i> {{ t('gettingStarted.title') }}</h2>
        <p class="intro">{{ t('gettingStarted.intro') }}</p>
      </div>
      <span class="progress">{{ t('gettingStarted.progress', { done: doneCount, total: items.length }) }}</span>
    </header>

    <ol class="items">
      <li v-for="item in items" :key="item.key" :class="{ done: item.done }">
        <i class="mdi" :class="item.done ? 'mdi-check-circle' : 'mdi-circle-outline'"></i>
        <div class="item-text">
          <strong>{{ t(`gettingStarted.items.${item.key}.title`) }}</strong>
          <span>{{ t(`gettingStarted.items.${item.key}.why`) }}</span>
        </div>
        <button v-if="!item.done" type="button" class="btn-do" @click="item.action()">
          {{ t(`gettingStarted.items.${item.key}.action`) }}
        </button>
      </li>
    </ol>

    <footer>
      <router-link to="/faq" class="link">{{ t('faq.link') }}</router-link>
      <button type="button" class="link" @click="dismiss">{{ t('gettingStarted.dismiss') }}</button>
    </footer>
  </section>
</template>

<style scoped>
.getting-started {
  background: white;
  border: 2px solid var(--primary);
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

h2 {
  margin: 0;
  font-size: 1.125rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.intro {
  margin: 0.25rem 0 0;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.progress {
  white-space: nowrap;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--primary);
}

.items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.items li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.items li > i {
  font-size: 1.25rem;
  color: var(--text-muted);
}

.items li.done > i {
  color: var(--success);
}

.item-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  font-size: 0.875rem;
}

.item-text strong {
  color: var(--text-primary);
}

.item-text span {
  color: var(--text-muted);
}

.items li.done .item-text strong {
  text-decoration: line-through;
  color: var(--text-muted);
}

.btn-do {
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 0.875rem;
  font-weight: 600;
  font-size: 0.8125rem;
  cursor: pointer;
  white-space: nowrap;
}

footer {
  display: flex;
  justify-content: space-between;
}

.link {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 0.8125rem;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

@media (max-width: 640px) {
  .items li {
    flex-wrap: wrap;
  }

  .btn-do {
    margin-left: 2rem;
  }
}
</style>
