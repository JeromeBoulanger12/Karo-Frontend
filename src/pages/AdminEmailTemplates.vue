<template>
  <div class="admin-email-templates">
    <div class="page-header">
      <h1>{{ t('adminEmail.templatesTitle') }}</h1>
      <p class="subtitle">{{ t('adminEmail.templatesSubtitle') }}</p>
    </div>

    <div v-if="loading" class="loading">{{ t('common.loading') }}</div>

    <div v-else class="layout">
      <!-- Template list -->
      <aside class="template-list">
        <label class="field">
          <span>{{ t('adminEmail.locale') }}</span>
          <select v-model="locale" @change="loadTemplate">
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </label>

        <button
          v-for="item in templates"
          :key="item.key"
          class="template-item"
          :class="{ active: item.key === selectedKey }"
          @click="selectTemplate(item.key)"
        >
          <span>{{ item.name }}</span>
          <span v-if="item.customizedLocales.includes(locale)" class="custom-tag">{{ t('adminEmail.customized') }}</span>
        </button>
      </aside>

      <!-- Editor -->
      <section v-if="template" class="editor card">
        <p class="variables">
          <strong>{{ t('adminEmail.availableVariables') }} :</strong>
          <code v-for="variable in template.variables" :key="variable">{{ placeholder(variable) }}</code>
        </p>

        <div class="field">
          <label for="subject">{{ t('adminEmail.subject') }}</label>
          <input id="subject" v-model="subject" type="text" maxlength="200" />
        </div>

        <div class="blocks">
          <div v-for="(block, index) in blocks" :key="index" class="block">
            <div class="block-header">
              <select v-model="block.type" :aria-label="t('adminEmail.blockType')">
                <option value="Heading">{{ t('adminEmail.blockHeading') }}</option>
                <option value="Paragraph">{{ t('adminEmail.blockParagraph') }}</option>
                <option value="Button">{{ t('adminEmail.blockButton') }}</option>
              </select>
              <div class="block-actions">
                <button type="button" :disabled="index === 0" :title="t('adminEmail.moveUp')" @click="move(index, -1)">
                  <i class="mdi mdi-arrow-up"></i>
                </button>
                <button type="button" :disabled="index === blocks.length - 1" :title="t('adminEmail.moveDown')" @click="move(index, 1)">
                  <i class="mdi mdi-arrow-down"></i>
                </button>
                <button type="button" :title="t('adminEmail.removeBlock')" @click="removeBlock(index)">
                  <i class="mdi mdi-delete-outline"></i>
                </button>
              </div>
            </div>

            <textarea
              v-model="block.text"
              rows="block.type === 'Paragraph' ? 3 : 1"
              :placeholder="block.type === 'Button' ? t('adminEmail.buttonLabel') : ''"
            ></textarea>

            <input
              v-if="block.type === 'Button'"
              v-model="block.url"
              type="url"
              :placeholder="t('adminEmail.buttonUrl')"
            />
          </div>

          <div class="add-blocks">
            <button type="button" @click="addBlock('Heading')">+ {{ t('adminEmail.blockHeading') }}</button>
            <button type="button" @click="addBlock('Paragraph')">+ {{ t('adminEmail.blockParagraph') }}</button>
            <button type="button" @click="addBlock('Button')">+ {{ t('adminEmail.blockButton') }}</button>
          </div>
        </div>

        <ul v-if="errors.length" class="errors">
          <li v-for="(error, index) in errors" :key="index">{{ error }}</li>
        </ul>
        <p v-if="message" class="message" :class="messageKind">{{ message }}</p>

        <div class="actions">
          <button class="btn btn-primary" :disabled="saving" @click="save">
            {{ saving ? t('adminEmail.saving') : t('common.save') }}
          </button>
          <button class="btn btn-secondary" :disabled="previewing" @click="preview">
            <i class="mdi mdi-eye-outline"></i>
            {{ t('adminEmail.preview') }}
          </button>
          <button
            v-if="template.isCustomized"
            class="btn btn-danger"
            :disabled="saving"
            @click="reset"
          >
            {{ t('adminEmail.resetToDefault') }}
          </button>
        </div>

        <div v-if="previewResult" class="preview">
          <h3>{{ t('adminEmail.previewTitle') }}</h3>
          <p><strong>{{ t('adminEmail.subject') }} :</strong> {{ previewResult.subject }}</p>
          <iframe sandbox="" :srcdoc="previewResult.html" class="preview-frame" :title="t('adminEmail.previewTitle')"></iframe>
          <details>
            <summary>{{ t('adminEmail.textVersion') }}</summary>
            <pre>{{ previewResult.text }}</pre>
          </details>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  adminEmailApi,
  errorMessages,
  type EmailBlock,
  type EmailBlockType,
  type EmailPreview,
  type EmailTemplate,
  type EmailTemplateSummary
} from '../api/adminEmail'

const { t } = useI18n()

const loading = ref(true)
const saving = ref(false)
const previewing = ref(false)
const templates = ref<EmailTemplateSummary[]>([])
const selectedKey = ref('')
const locale = ref('fr')
const template = ref<EmailTemplate | null>(null)
const subject = ref('')
const blocks = ref<EmailBlock[]>([])
const errors = ref<string[]>([])
const message = ref('')
const messageKind = ref<'success' | 'error'>('success')
const previewResult = ref<EmailPreview | null>(null)

// Built in script so the template never contains a literal closing brace pair
const placeholder = (variable: string) => '{{' + variable + '}}'

const showMessage = (text: string, kind: 'success' | 'error') => {
  message.value = text
  messageKind.value = kind
}

const fillForm = (data: EmailTemplate) => {
  template.value = data
  subject.value = data.subject
  // Copies, so editing the form never mutates what the server returned
  blocks.value = data.blocks.map(b => ({ type: b.type, text: b.text, url: b.url ?? null }))
  errors.value = []
  message.value = ''
  previewResult.value = null
}

const loadTemplate = async () => {
  if (!selectedKey.value) return
  try {
    const { data } = await adminEmailApi.getTemplate(selectedKey.value, locale.value)
    fillForm(data)
  } catch (error) {
    showMessage(errorMessages(error).join(' '), 'error')
  }
}

const selectTemplate = async (key: string) => {
  selectedKey.value = key
  await loadTemplate()
}

const addBlock = (type: EmailBlockType) => {
  blocks.value.push({ type, text: '', url: type === 'Button' ? 'https://' : null })
}

const removeBlock = (index: number) => {
  blocks.value.splice(index, 1)
}

const move = (index: number, direction: -1 | 1) => {
  const target = index + direction
  const [item] = blocks.value.splice(index, 1)
  blocks.value.splice(target, 0, item)
}

// Heading and paragraph blocks never carry a link, whatever was typed before switching the type
const cleanBlocks = (): EmailBlock[] =>
  blocks.value.map(b => ({
    type: b.type,
    text: b.text,
    url: b.type === 'Button' ? b.url : null
  }))

const save = async () => {
  saving.value = true
  errors.value = []
  message.value = ''
  try {
    const { data } = await adminEmailApi.saveTemplate(selectedKey.value, locale.value, {
      subject: subject.value,
      blocks: cleanBlocks()
    })
    fillForm(data)
    showMessage(t('adminEmail.saved'), 'success')
    await refreshList()
  } catch (error) {
    errors.value = errorMessages(error)
  } finally {
    saving.value = false
  }
}

const preview = async () => {
  previewing.value = true
  errors.value = []
  try {
    const { data } = await adminEmailApi.previewTemplate(selectedKey.value, locale.value, {
      subject: subject.value,
      blocks: cleanBlocks()
    })
    previewResult.value = data
  } catch (error) {
    errors.value = errorMessages(error)
  } finally {
    previewing.value = false
  }
}

const reset = async () => {
  if (!window.confirm(t('adminEmail.confirmReset'))) return
  saving.value = true
  try {
    await adminEmailApi.resetTemplate(selectedKey.value, locale.value)
    await loadTemplate()
    showMessage(t('adminEmail.resetDone'), 'success')
    await refreshList()
  } catch (error) {
    showMessage(errorMessages(error).join(' '), 'error')
  } finally {
    saving.value = false
  }
}

const refreshList = async () => {
  const { data } = await adminEmailApi.listTemplates()
  templates.value = data
}

onMounted(async () => {
  try {
    await refreshList()
    if (templates.value.length > 0) {
      await selectTemplate(templates.value[0].key)
    }
  } catch (error) {
    showMessage(errorMessages(error).join(' '), 'error')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-header h1 {
  margin: 0;
  font-size: 1.75rem;
}

.subtitle {
  margin: 0.25rem 0 1.5rem;
  color: #64748b;
}

.layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 1.5rem;
  align-items: start;
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.template-list .field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-bottom: 0.5rem;
}

.template-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  text-align: left;
}

.template-item.active {
  border-color: #2d6a4f;
  box-shadow: inset 3px 0 0 #2d6a4f;
}

.custom-tag {
  font-size: 0.7rem;
  background: #dbeafe;
  color: #1e40af;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.variables code {
  margin: 0 0.25rem;
  background: #f1f5f9;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 1rem;
}

input,
select,
textarea {
  padding: 0.55rem 0.7rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font: inherit;
  width: 100%;
  box-sizing: border-box;
}

.blocks {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.block {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.block-header {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.block-header select {
  width: auto;
}

.block-actions {
  display: flex;
  gap: 0.25rem;
}

.block-actions button,
.add-blocks button {
  background: #f1f5f9;
  border: none;
  border-radius: 6px;
  padding: 0.35rem 0.6rem;
  cursor: pointer;
}

.block-actions button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.add-blocks {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.errors {
  background: #fee2e2;
  color: #991b1b;
  border-radius: 8px;
  padding: 0.75rem 1rem 0.75rem 2rem;
  margin: 0 0 1rem;
}

.message.success {
  color: #166534;
  font-weight: 600;
}

.message.error {
  color: #991b1b;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.btn {
  padding: 0.6rem 1.1rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #2d6a4f;
  color: white;
}

.btn-secondary {
  background: #e2e8f0;
  color: #1e293b;
}

.btn-danger {
  background: #fee2e2;
  color: #991b1b;
}

.preview {
  margin-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
  padding-top: 1rem;
}

.preview-frame {
  width: 100%;
  height: 420px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f5f5f5;
}

.preview pre {
  white-space: pre-wrap;
  background: #f8fafc;
  padding: 0.75rem;
  border-radius: 8px;
}

@media (max-width: 800px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
