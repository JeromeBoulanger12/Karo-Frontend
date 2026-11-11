<template>
  <div class="feedback-page">
    <h1>{{ t('feedback.title') }}</h1>
    <p class="feedback-intro">{{ t('feedback.intro') }}</p>

    <form v-if="!sent" class="feedback-card" @submit.prevent="send">
      <textarea
        v-model="message"
        class="feedback-textarea"
        rows="8"
        :maxlength="MAX_LENGTH"
        :placeholder="t('feedback.placeholder')"
        :aria-label="t('feedback.title')"
      ></textarea>

      <div class="feedback-footer">
        <span class="feedback-counter">{{ t('feedback.counter', { count: message.length, max: MAX_LENGTH }) }}</span>
        <button type="submit" class="feedback-send" :disabled="sending || !message.trim()">
          {{ t('feedback.send') }}
        </button>
      </div>

      <p v-if="error" class="feedback-error">{{ error }}</p>
    </form>

    <div v-else class="feedback-card feedback-sent">
      <p>{{ t('feedback.sent') }}</p>
      <button type="button" class="feedback-send" @click="reset">{{ t('feedback.another') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { feedbackApi } from '../api/feedback'

const { t } = useI18n()

// Same limit as the backend (UserFeedback.MaxMessageLength)
const MAX_LENGTH = 2000

const message = ref('')
const sending = ref(false)
const sent = ref(false)
const error = ref('')

const send = async () => {
  const text = message.value.trim()
  if (!text) {
    return
  }

  sending.value = true
  error.value = ''
  try {
    await feedbackApi.submit(text)
    sent.value = true
    message.value = ''
  } catch {
    error.value = t('feedback.error')
  } finally {
    sending.value = false
  }
}

const reset = () => {
  sent.value = false
}
</script>

<style scoped>
.feedback-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.feedback-page h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.feedback-intro {
  color: #64748b;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.feedback-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feedback-textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.75rem;
  font: inherit;
  resize: vertical;
}

.feedback-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.feedback-counter {
  color: #64748b;
  font-size: 0.875rem;
}

.feedback-send {
  background: #3b82f6;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  padding: 0.6rem 1.25rem;
  font-weight: 600;
  cursor: pointer;
}

.feedback-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.feedback-error {
  color: #991b1b;
  background: #fee2e2;
  border-radius: 4px;
  padding: 0.75rem;
}

.feedback-sent {
  align-items: flex-start;
}
</style>
