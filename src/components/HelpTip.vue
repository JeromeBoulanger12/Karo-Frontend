<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

// A small « ? » beside a term: a short explanation, and a link to the matching FAQ question
const props = defineProps<{
  // Key under helpTips.<topic> for the text, and the FAQ question it links to (faq.items.<faq>)
  topic: string
  faq?: string
}>()

const { t } = useI18n()
const open = ref(false)
const root = ref<HTMLElement | null>(null)

// Closes when the user clicks anywhere else
const onDocumentClick = (event: MouseEvent) => {
  if (root.value && !root.value.contains(event.target as Node)) open.value = false
}
watch(open, (isOpen) => {
  if (isOpen) document.addEventListener('click', onDocumentClick)
  else document.removeEventListener('click', onDocumentClick)
})
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
  <span ref="root" class="help-tip" @click.stop>
    <button
      type="button"
      class="help-button"
      :aria-label="t('helpTips.label')"
      :aria-expanded="open"
      @click="open = !open"
    >?</button>
    <span v-if="open" class="help-bubble" role="tooltip">
      {{ t(`helpTips.${props.topic}`) }}
      <router-link v-if="props.faq" :to="`/faq#${props.faq}`" class="help-more">{{ t('helpTips.more') }}</router-link>
    </span>
  </span>
</template>

<style scoped>
.help-tip {
  position: relative;
  display: inline-flex;
  vertical-align: middle;
}

.help-button {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid var(--text-muted);
  background: white;
  color: var(--text-muted);
  font-size: 0.6875rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.help-button:hover,
.help-button[aria-expanded='true'] {
  border-color: var(--primary);
  color: var(--primary);
}

.help-bubble {
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  width: 260px;
  max-width: 80vw;
  background: #1e293b;
  color: white;
  font-size: 0.8125rem;
  font-weight: 400;
  line-height: 1.45;
  text-align: left;
  text-transform: none;
  letter-spacing: normal;
  white-space: normal;
  padding: 0.625rem 0.75rem;
  border-radius: 6px;
  box-shadow: var(--shadow-md);
}

.help-more {
  display: block;
  margin-top: 0.375rem;
  color: #93c5fd;
  font-weight: 600;
}
</style>
