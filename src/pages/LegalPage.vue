<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { LEGAL_DOCUMENTS } from '../legal/documents'
import { LEGAL_VERSION } from '../legal/version'

// The route decides which document is shown: 'privacy' or 'terms'
const props = defineProps<{ document: 'privacy' | 'terms' }>()

const { locale } = useI18n()

const content = computed(() => {
  const lang = locale.value === 'en' ? 'en' : 'fr'
  return LEGAL_DOCUMENTS[props.document][lang]
})
</script>

<template>
  <div class="legal-page">
    <div class="legal-card">
      <a href="/" class="legal-back">&larr; Karo</a>

      <!-- Shown until a lawyer or privacy expert has reviewed the text -->
      <v-alert type="warning" variant="tonal" class="mb-6">
        {{ locale === 'en' ? 'Draft: this text is pending legal review.' : 'Ébauche : ce texte est en attente de révision juridique.' }}
      </v-alert>

      <h1>{{ content.title }}</h1>
      <p class="legal-version">
        Version {{ LEGAL_VERSION }}
      </p>

      <section v-for="section in content.sections" :key="section.heading" class="legal-section">
        <h2>{{ section.heading }}</h2>
        <p v-for="(paragraph, index) in section.paragraphs" :key="index">{{ paragraph }}</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.legal-page {
  min-height: 100vh;
  padding: 2rem 1rem;
  background: #f5f7fb;
}

.legal-card {
  max-width: 760px;
  margin: 0 auto;
  padding: 2rem;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e5e5;
  line-height: 1.6;
}

.legal-back {
  display: inline-block;
  margin-bottom: 1rem;
  color: #1b6ec2;
  text-decoration: none;
}

.legal-version {
  color: #666666;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.legal-section h2 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 1.5rem 0 0.5rem;
}
</style>
