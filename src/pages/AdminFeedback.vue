<template>
  <div class="feedback-admin">
    <div class="feedback-admin-header">
      <div>
        <h1>{{ t('feedback.admin.title') }}</h1>
        <p class="feedback-admin-subtitle">{{ t('feedback.admin.subtitle') }}</p>
      </div>
      <div class="feedback-filters">
        <button
          type="button"
          :class="['filter-btn', { active: onlyUnread === false }]"
          @click="onlyUnread = false"
        >
          {{ t('feedback.admin.filterAll') }}
        </button>
        <button
          type="button"
          :class="['filter-btn', { active: onlyUnread === true }]"
          @click="onlyUnread = true"
        >
          {{ t('feedback.admin.filterUnread') }}
        </button>
      </div>
    </div>

    <p v-if="loadError" class="feedback-admin-error">{{ t('feedback.admin.loadError') }}</p>
    <p v-else-if="loading" class="feedback-admin-empty">…</p>
    <p v-else-if="visible.length === 0" class="feedback-admin-empty">{{ t('feedback.admin.empty') }}</p>

    <article v-for="item in visible" :key="item.id" class="feedback-item" :class="{ unread: !item.readAt }">
      <header class="feedback-item-header">
        <div>
          <span class="feedback-from">{{ t('feedback.admin.from') }} :</span>
          <a :href="`mailto:${item.userEmail}`">{{ item.userEmail }}</a>
          <span class="feedback-date">{{ t('feedback.admin.sentAt') }} {{ formatDate(item.createdAt) }}</span>
        </div>
        <span :class="['feedback-status', item.readAt ? 'read' : 'unread']">
          {{ item.readAt ? t('feedback.admin.read') : t('feedback.admin.unread') }}
        </span>
      </header>

      <p class="feedback-message">{{ item.message }}</p>

      <footer v-if="!item.readAt" class="feedback-item-footer">
        <button type="button" class="mark-read-btn" :disabled="markingId === item.id" @click="markRead(item)">
          {{ t('feedback.admin.markRead') }}
        </button>
      </footer>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { adminFeedbackApi } from '../api/adminFeedback'
import type { UserFeedback } from '../api/feedback'

const { t, locale } = useI18n()

const items = ref<UserFeedback[]>([])
const loading = ref(true)
const loadError = ref(false)
const onlyUnread = ref(false)
const markingId = ref<string | null>(null)

const visible = computed(() =>
  onlyUnread.value ? items.value.filter((item) => !item.readAt) : items.value
)

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(locale.value === 'en' ? 'en-CA' : 'fr-CA')

const load = async () => {
  loading.value = true
  loadError.value = false
  try {
    const { data } = await adminFeedbackApi.list()
    items.value = data
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

const markRead = async (item: UserFeedback) => {
  markingId.value = item.id
  try {
    const { data } = await adminFeedbackApi.markRead(item.id)
    items.value = items.value.map((existing) => (existing.id === data.id ? data : existing))
  } finally {
    markingId.value = null
  }
}

onMounted(load)
</script>

<style scoped>
.feedback-admin {
  max-width: 900px;
}

.feedback-admin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.feedback-admin-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
}

.feedback-admin-subtitle {
  color: #64748b;
  margin-top: 0.25rem;
}

.feedback-filters {
  display: flex;
  gap: 0.5rem;
}

.filter-btn {
  border: 1px solid #cbd5e1;
  background: #ffffff;
  border-radius: 999px;
  padding: 0.4rem 0.9rem;
  cursor: pointer;
}

.filter-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #ffffff;
}

.feedback-admin-empty,
.feedback-admin-error {
  color: #64748b;
  padding: 1rem 0;
}

.feedback-admin-error {
  color: #991b1b;
}

.feedback-item {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-left: 4px solid #cbd5e1;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
}

.feedback-item.unread {
  border-left-color: #3b82f6;
}

.feedback-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.feedback-from {
  color: #475569;
  font-weight: 600;
  margin-right: 0.25rem;
}

.feedback-date {
  color: #94a3b8;
  font-size: 0.875rem;
  margin-left: 0.75rem;
}

.feedback-status {
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
}

.feedback-status.unread {
  background: #dbeafe;
  color: #1e40af;
}

.feedback-status.read {
  background: #f1f5f9;
  color: #64748b;
}

.feedback-message {
  white-space: pre-wrap;
  line-height: 1.6;
  color: #1e293b;
}

.feedback-item-footer {
  margin-top: 0.75rem;
}

.mark-read-btn {
  border: 1px solid #3b82f6;
  background: #ffffff;
  color: #3b82f6;
  border-radius: 4px;
  padding: 0.4rem 0.9rem;
  cursor: pointer;
}

.mark-read-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
