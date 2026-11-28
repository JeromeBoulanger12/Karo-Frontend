<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../composables/useAuth'
import { LEGAL_CONTACT_EMAIL, LEGAL_DOCUMENTS } from '../legal/documents'
import { LEGAL_VERSION } from '../legal/version'

// The route decides which document is shown: 'privacy' or 'terms'
const props = defineProps<{ document: 'privacy' | 'terms' }>()

const { t, locale } = useI18n()
const { isAuthenticated } = useAuth()

const content = computed(() => {
  const lang = locale.value === 'en' ? 'en' : 'fr'
  return LEGAL_DOCUMENTS[props.document][lang]
})

// The other document, offered beside the table of contents
const otherDocument = computed(() =>
  props.document === 'privacy'
    ? { to: '/conditions', label: t('homepage.footer.terms') }
    : { to: '/confidentialite', label: t('homepage.footer.privacy') }
)

const sectionId = (index: number) => `section-${index + 1}`

const setLang = (lang: 'fr' | 'en') => {
  locale.value = lang
  localStorage.setItem('language', lang)
}
</script>

<template>
  <div class="legal">
    <!-- Guests have no app bar here, so the page carries its own (same look as the landing) -->
    <nav v-if="!isAuthenticated" class="nav">
      <div class="nav-inner">
        <router-link to="/" class="brand" aria-label="Karo">Karo<span>.</span></router-link>
        <div class="nav-actions">
          <div class="lang-switch" role="group" aria-label="Language">
            <button type="button" :class="{ active: locale === 'fr' }" @click="setLang('fr')">FR</button>
            <button type="button" :class="{ active: locale === 'en' }" @click="setLang('en')">EN</button>
          </div>
          <router-link to="/login" class="nav-login">{{ t('auth.login') }}</router-link>
        </div>
      </div>
    </nav>

    <header class="hero">
      <div class="hero-inner">
        <span class="eyebrow">
          <i class="mdi" :class="document === 'privacy' ? 'mdi-shield-lock-outline' : 'mdi-file-document-outline'"></i>
          {{ t('legalPage.eyebrow') }}
        </span>
        <h1>{{ content.title }}</h1>
        <p class="hero-summary">{{ content.summary }}</p>
        <p class="hero-version">{{ t('legalPage.version', { version: LEGAL_VERSION }) }}</p>
      </div>
    </header>

    <div class="body">
      <!-- Table of contents: sticky beside the text on wide screens -->
      <aside class="toc">
        <p class="toc-title">{{ t('legalPage.toc') }}</p>
        <ol>
          <li v-for="(section, index) in content.sections" :key="section.heading">
            <a :href="`#${sectionId(index)}`">{{ section.heading }}</a>
          </li>
        </ol>
        <router-link :to="otherDocument.to" class="toc-other">
          <i class="mdi mdi-arrow-right"></i>{{ otherDocument.label }}
        </router-link>
      </aside>

      <article class="content">
        <!-- Shown until a lawyer or privacy expert has reviewed the text -->
        <div class="draft" role="note">
          <i class="mdi mdi-alert-outline"></i>
          <span>{{ t('legalPage.draft') }}</span>
        </div>

        <section
          v-for="(section, index) in content.sections"
          :id="sectionId(index)"
          :key="section.heading"
          class="legal-section"
        >
          <h2>{{ section.heading }}</h2>
          <p v-for="(paragraph, pIndex) in section.paragraphs" :key="pIndex">{{ paragraph }}</p>
        </section>

        <div class="contact">
          <i class="mdi mdi-email-outline"></i>
          <div>
            <p class="contact-title">{{ t('legalPage.questions') }}</p>
            <a :href="`mailto:${LEGAL_CONTACT_EMAIL}`">{{ LEGAL_CONTACT_EMAIL }}</a>
          </div>
        </div>
      </article>
    </div>

    <footer class="footer">
      <router-link to="/">&larr; {{ t('legalPage.back') }}</router-link>
      <div class="footer-links">
        <router-link to="/confidentialite">{{ t('homepage.footer.privacy') }}</router-link>
        <router-link to="/conditions">{{ t('homepage.footer.terms') }}</router-link>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.legal {
  --ink: #0f172a;
  --text: #334155;
  --muted: #64748b;
  --line: #e2e8f0;
  --blue: #2563eb;
  --violet: #7c3aed;
  --gradient: linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #7c3aed 100%);
  min-height: 100vh;
  color: var(--text);
  background: #f8fafc;
}

/* Navigation (guests only) */
.nav {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
}

.nav-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0.85rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1e3a8a;
  text-decoration: none;
}

.brand span {
  color: var(--violet);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-login {
  color: var(--text);
  font-weight: 600;
  text-decoration: none;
}

.nav-login:hover {
  color: var(--blue);
}

.lang-switch {
  display: flex;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 2px;
}

.lang-switch button {
  border: 0;
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  background: transparent;
  color: var(--muted);
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
}

.lang-switch button.active {
  background: #eef2ff;
  color: var(--blue);
}

/* Header band */
.hero {
  color: #ffffff;
  background: var(--gradient);
}

.hero-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 3rem 1.25rem 3.5rem;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.8rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
  font-size: 0.85rem;
  font-weight: 600;
}

.hero h1 {
  color: #ffffff;
  margin: 1rem 0 0.75rem;
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 800;
  line-height: 1.15;
}

.hero-summary {
  color: #ffffff;
  max-width: 680px;
  font-size: 1.05rem;
  line-height: 1.6;
  opacity: 0.92;
}

.hero-version {
  color: #ffffff;
  margin-top: 1rem;
  font-size: 0.85rem;
  opacity: 0.75;
}

/* Table of contents and text */
.body {
  max-width: 1120px;
  margin: -1.5rem auto 0;
  padding: 0 1.25rem 3rem;
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 2rem;
  align-items: start;
}

.toc {
  position: sticky;
  top: 5.5rem;
  padding: 1.25rem;
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 16px;
  font-size: 0.9rem;
}

.toc-title {
  margin-bottom: 0.5rem;
  color: var(--ink);
  font-weight: 700;
}

.toc ol {
  list-style: none;
  margin: 0;
  padding: 0;
}

.toc li a {
  display: block;
  padding: 0.3rem 0;
  color: var(--muted);
  text-decoration: none;
}

.toc li a:hover {
  color: var(--blue);
}

.toc-other {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--line);
  color: var(--blue);
  font-weight: 600;
  text-decoration: none;
}

.content {
  padding: 2rem 2.25rem;
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
  line-height: 1.7;
}

.draft {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
  font-size: 0.9rem;
}

.draft .mdi {
  font-size: 1.15rem;
}

.legal-section {
  scroll-margin-top: 5.5rem;
}

.legal-section + .legal-section {
  margin-top: 1.75rem;
  padding-top: 1.75rem;
  border-top: 1px solid #f1f5f9;
}

.legal-section h2 {
  margin-bottom: 0.6rem;
  color: var(--ink);
  font-size: 1.15rem;
  font-weight: 700;
}

.legal-section p + p {
  margin-top: 0.6rem;
}

.contact {
  display: flex;
  gap: 0.85rem;
  align-items: center;
  margin-top: 2.25rem;
  padding: 1.1rem 1.25rem;
  border-radius: 12px;
  background: #f5f7ff;
}

.contact .mdi {
  font-size: 1.5rem;
  color: var(--violet);
}

.contact-title {
  color: var(--ink);
  font-weight: 600;
}

.contact a {
  color: var(--blue);
  font-weight: 600;
}

.footer {
  max-width: 1120px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 2.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
  border-top: 1px solid var(--line);
  font-size: 0.9rem;
}

.footer a {
  color: var(--muted);
  text-decoration: none;
}

.footer a:hover {
  color: var(--blue);
}

.footer-links {
  display: flex;
  gap: 1.25rem;
}

@media (max-width: 860px) {
  .body {
    grid-template-columns: 1fr;
  }

  .toc {
    position: static;
  }

  .content {
    padding: 1.5rem 1.25rem;
  }
}
</style>
