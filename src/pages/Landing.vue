<template>
  <div class="landing">
    <!-- Navigation: the landing has no app bar, so it carries its own links and language switch -->
    <nav class="nav">
      <div class="nav-inner">
        <router-link to="/" class="brand" aria-label="Karo">Karo<span>.</span></router-link>
        <div class="nav-links">
          <a href="#how" class="nav-link">{{ t('homepage.nav.how') }}</a>
          <a href="#features" class="nav-link">{{ t('homepage.nav.features') }}</a>
          <a href="#pricing" class="nav-link">{{ t('homepage.nav.pricing') }}</a>
          <a href="#faq" class="nav-link">{{ t('homepage.nav.faq') }}</a>
        </div>
        <div class="nav-actions">
          <div class="lang-switch" role="group" aria-label="Language">
            <button type="button" :class="{ active: locale === 'fr' }" @click="setLang('fr')">FR</button>
            <button type="button" :class="{ active: locale === 'en' }" @click="setLang('en')">EN</button>
          </div>
          <router-link to="/login" class="nav-login">{{ t('auth.login') }}</router-link>
          <router-link to="/signup" class="btn btn-small">{{ t('homepage.nav.start') }}</router-link>
        </div>
      </div>
    </nav>

    <!-- Hero: no expense tracking, just adjust the balance -->
    <header class="hero">
      <div class="hero-glow hero-glow--one"></div>
      <div class="hero-glow hero-glow--two"></div>

      <div class="hero-inner">
        <div class="hero-copy">
          <span class="eyebrow"><i class="mdi mdi-receipt-text-remove-outline"></i>{{ t('homepage.hero.eyebrow') }}</span>
          <h1>{{ t('homepage.hero.title') }}</h1>
          <p class="hero-subtitle">{{ t('homepage.hero.subtitle') }}</p>
          <div class="hero-buttons">
            <router-link to="/signup" class="btn btn-white">
              {{ t('homepage.hero.cta') }} <i class="mdi mdi-arrow-right"></i>
            </router-link>
            <a href="#how" class="btn btn-ghost">{{ t('homepage.hero.secondary') }}</a>
          </div>
          <ul class="hero-trust">
            <li><i class="mdi mdi-check-circle"></i>{{ t('homepage.hero.trust_free') }}</li>
            <li><i class="mdi mdi-check-circle"></i>{{ t('homepage.hero.trust_card') }}</li>
            <li><i class="mdi mdi-check-circle"></i>{{ t('homepage.hero.trust_quebec') }}</li>
          </ul>
        </div>

        <!-- A glimpse of the app: one balance to adjust, envelopes filled by the paycheck -->
        <div class="hero-visual" aria-hidden="true">
          <div class="mock-account">
            <div class="mock-account-row">
              <div>
                <p class="mock-label">{{ t('homepage.mock.account') }}</p>
                <p class="mock-balance">2 480,00 $</p>
              </div>
              <span class="mock-adjust"><i class="mdi mdi-pencil-outline"></i>{{ t('homepage.mock.adjust') }}</span>
            </div>
            <div class="mock-envelopes">
              <div v-for="envelope in mockEnvelopes" :key="envelope.name" class="mock-envelope">
                <div class="mock-envelope-row">
                  <span class="mock-dot" :style="{ background: envelope.color }"></span>
                  <span class="mock-name">{{ envelope.name }}</span>
                  <span class="mock-amount">{{ envelope.amount }}</span>
                </div>
                <div class="mock-bar"><span :style="{ width: envelope.fill, background: envelope.color }"></span></div>
              </div>
            </div>
          </div>
          <div class="mock-toast">
            <i class="mdi mdi-cash-fast"></i>
            <div>
              <strong>{{ t('homepage.mock.toast_title') }}</strong>
              <span>{{ t('homepage.mock.toast_text') }}</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Why Karo is different: the reason people quit budget apps -->
    <section class="section">
      <div class="section-inner">
        <p class="kicker">{{ t('homepage.why.kicker') }}</p>
        <h2 class="section-title">{{ t('homepage.why.title') }}</h2>
        <p class="section-lead">{{ t('homepage.why.lead') }}</p>

        <div class="compare">
          <div class="compare-card compare-card--old">
            <h3><i class="mdi mdi-emoticon-sad-outline"></i>{{ t('homepage.why.old_title') }}</h3>
            <ul>
              <li v-for="key in ['old_1', 'old_2', 'old_3']" :key="key">
                <i class="mdi mdi-close-circle"></i>{{ t(`homepage.why.${key}`) }}
              </li>
            </ul>
          </div>
          <div class="compare-card compare-card--karo">
            <h3><i class="mdi mdi-emoticon-happy-outline"></i>{{ t('homepage.why.karo_title') }}</h3>
            <ul>
              <li v-for="key in ['karo_1', 'karo_2', 'karo_3']" :key="key">
                <i class="mdi mdi-check-circle"></i>{{ t(`homepage.why.${key}`) }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section id="how" class="section section--tinted">
      <div class="section-inner">
        <p class="kicker">{{ t('homepage.how.kicker') }}</p>
        <h2 class="section-title">{{ t('homepage.how.title') }}</h2>

        <ol class="steps">
          <li v-for="(step, index) in steps" :key="step.key" class="step">
            <span class="step-number">{{ index + 1 }}</span>
            <i :class="['mdi', step.icon, 'step-icon']"></i>
            <h3>{{ t(`homepage.how.${step.key}_title`) }}</h3>
            <p>{{ t(`homepage.how.${step.key}_text`) }}</p>
          </li>
        </ol>

        <p class="steps-note"><i class="mdi mdi-lightbulb-on-outline"></i>{{ t('homepage.how.note') }}</p>
      </div>
    </section>

    <!-- Features -->
    <section id="features" class="section">
      <div class="section-inner">
        <p class="kicker">{{ t('homepage.features.kicker') }}</p>
        <h2 class="section-title">{{ t('homepage.features.title') }}</h2>

        <div class="features">
          <article v-for="feature in features" :key="feature.key" class="feature">
            <span class="feature-icon" :style="{ background: feature.tint, color: feature.color }">
              <i :class="['mdi', feature.icon]"></i>
            </span>
            <h3>{{ t(`homepage.features.${feature.key}_title`) }}</h3>
            <p>{{ t(`homepage.features.${feature.key}_text`) }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- Pricing: prices and limits come from the tier configuration -->
    <section id="pricing" class="section section--tinted">
      <div class="section-inner">
        <p class="kicker">{{ t('homepage.pricing.kicker') }}</p>
        <h2 class="section-title">{{ t('homepage.pricing.title') }}</h2>
        <p class="section-lead">{{ t('homepage.pricing.lead') }}</p>

        <div class="interval-switch" role="group" :aria-label="t('homepage.pricing.title')">
          <button type="button" :class="{ active: interval === 'month' }" @click="interval = 'month'">
            {{ t('homepage.pricing.monthly') }}
          </button>
          <button type="button" :class="{ active: interval === 'year' }" @click="interval = 'year'">
            {{ t('homepage.pricing.yearly') }}
            <span v-if="bestSaving > 0" class="saving">{{ t('homepage.pricing.saving_upto', { n: bestSaving }) }}</span>
          </button>
        </div>

        <div class="plans">
          <article v-for="plan in plans" :key="plan.tier" class="plan" :class="{ 'plan--featured': plan.tier === 'Pro' }">
            <span v-if="plan.tier === 'Pro'" class="plan-badge">{{ t('homepage.pricing.popular') }}</span>
            <h3>{{ t(`homepage.pricing.${plan.tier.toLowerCase()}_name`) }}</h3>
            <p class="plan-desc">{{ t(`homepage.pricing.${plan.tier.toLowerCase()}_desc`) }}</p>

            <p class="plan-price">
              <template v-if="plan.monthlyPrice === 0">{{ t('homepage.pricing.free_price') }}</template>
              <template v-else>
                {{ formatPrice(interval === 'year' && plan.annualPrice > 0 ? plan.annualPrice : plan.monthlyPrice) }}
                <span>/ {{ interval === 'year' && plan.annualPrice > 0 ? t('homepage.pricing.per_year') : t('homepage.pricing.per_month') }}</span>
              </template>
            </p>
            <p class="plan-note">
              <template v-if="plan.monthlyPrice === 0">{{ t('homepage.pricing.free_note') }}</template>
              <template v-else-if="interval === 'year' && plan.annualPrice > 0">
                {{ t('homepage.pricing.year_note', { price: formatPrice(plan.annualPrice / 12) }) }}
              </template>
              <template v-else>{{ t('homepage.pricing.month_note') }}</template>
            </p>

            <ul class="plan-features">
              <li v-for="(item, idx) in planFeatures(plan)" :key="idx"><i class="mdi mdi-check"></i>{{ item }}</li>
            </ul>

            <router-link :to="planLink(plan)" :class="['btn', 'btn-block', plan.tier === 'Pro' ? 'btn-primary' : 'btn-outline']">
              {{ plan.monthlyPrice === 0 ? t('homepage.pricing.free_cta') : t('homepage.pricing.paid_cta', { plan: t(`homepage.pricing.${plan.tier.toLowerCase()}_name`) }) }}
            </router-link>
          </article>
        </div>

        <p class="pricing-footnote">{{ t('homepage.pricing.footnote') }}</p>
      </div>
    </section>

    <!-- FAQ: Karo's own question first, then the basics shared with the FAQ page -->
    <section id="faq" class="section">
      <div class="section-inner section-inner--narrow">
        <p class="kicker">{{ t('homepage.faq.kicker') }}</p>
        <h2 class="section-title">{{ t('homepage.faq.title') }}</h2>

        <div class="faq">
          <details class="faq-item" open>
            <summary>{{ t('homepage.faq.tracking_question') }}</summary>
            <p>{{ t('homepage.faq.tracking_answer') }}</p>
          </details>
          <details v-for="id in FAQ_ITEMS" :key="id" class="faq-item">
            <summary>{{ t(`faq.items.${id}.question`) }}</summary>
            <p>{{ t(`faq.items.${id}.answer`) }}</p>
          </details>
        </div>
      </div>
    </section>

    <!-- Final call to action -->
    <section class="cta">
      <div class="cta-inner">
        <h2>{{ t('homepage.cta.title') }}</h2>
        <p>{{ t('homepage.cta.text') }}</p>
        <router-link to="/signup" class="btn btn-white">
          {{ t('homepage.hero.cta') }} <i class="mdi mdi-arrow-right"></i>
        </router-link>
      </div>
    </section>

    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <span class="brand">Karo<span>.</span></span>
          <p>{{ t('homepage.footer.tagline') }}</p>
        </div>
        <nav class="footer-links" :aria-label="t('homepage.footer.product')">
          <h4>{{ t('homepage.footer.product') }}</h4>
          <a href="#how">{{ t('homepage.nav.how') }}</a>
          <a href="#features">{{ t('homepage.nav.features') }}</a>
          <a href="#pricing">{{ t('homepage.nav.pricing') }}</a>
          <router-link to="/faq">{{ t('homepage.nav.faq') }}</router-link>
        </nav>
        <nav class="footer-links" :aria-label="t('homepage.footer.legal')">
          <h4>{{ t('homepage.footer.legal') }}</h4>
          <router-link to="/confidentialite">{{ t('homepage.footer.privacy') }}</router-link>
          <router-link to="/conditions">{{ t('homepage.footer.terms') }}</router-link>
        </nav>
        <nav class="footer-links" :aria-label="t('homepage.footer.account')">
          <h4>{{ t('homepage.footer.account') }}</h4>
          <router-link to="/login">{{ t('auth.login') }}</router-link>
          <router-link to="/signup">{{ t('homepage.nav.start') }}</router-link>
        </nav>
      </div>
      <div class="footer-bottom">
        <p>© {{ year }} Karo · {{ t('homepage.footer.hosted') }}</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { billingApi, type BillingInterval } from '../api/billing'

const { t, locale } = useI18n()

const setLang = (lang: 'fr' | 'en') => {
  locale.value = lang
  localStorage.setItem('language', lang)
}

const year = new Date().getFullYear()

// Questions from the shared FAQ texts (faq.items.*) that explain the basics
const FAQ_ITEMS = ['envelope', 'accountVsEnvelope', 'expectedIncome', 'allocation', 'paid'] as const

const mockEnvelopes = computed(() => [
  { name: t('homepage.mock.rent'), amount: '1 250 $', fill: '100%', color: '#34d399' },
  { name: t('homepage.mock.groceries'), amount: '320 $', fill: '64%', color: '#fbbf24' },
  { name: t('homepage.mock.trip'), amount: '880 $', fill: '38%', color: '#a78bfa' }
])

const steps = [
  { key: 'step1', icon: 'mdi-bank-outline' },
  { key: 'step2', icon: 'mdi-email-multiple-outline' },
  { key: 'step3', icon: 'mdi-cash-fast' }
]

const features = [
  { key: 'balance', icon: 'mdi-scale-balance', color: '#2563eb', tint: '#dbeafe' },
  { key: 'envelopes', icon: 'mdi-email-outline', color: '#7c3aed', tint: '#ede9fe' },
  { key: 'paycheck', icon: 'mdi-cash-fast', color: '#059669', tint: '#d1fae5' },
  { key: 'bills', icon: 'mdi-calendar-check-outline', color: '#d97706', tint: '#fef3c7' },
  { key: 'cards', icon: 'mdi-credit-card-outline', color: '#db2777', tint: '#fce7f3' },
  { key: 'family', icon: 'mdi-account-group-outline', color: '#0891b2', tint: '#cffafe' }
]

// What the public tier endpoint returns. A limit of 0 means unlimited.
interface Plan {
  tier: 'Free' | 'Pro' | 'Family'
  monthlyPrice: number
  annualPrice: number
  maxAccounts: number
  maxEnvelopes: number
  maxPaycheckJobs: number
  maxSharedHouseholds: number
  allowSharedExpenses: boolean
  allowAdvancedReporting: boolean
  prioritySupport: boolean
  allowMembers: boolean
  allowBalanceHistory: boolean
  allowPlanning: boolean
  stripeAnnualPriceId: string | null
}

// Shown until the configuration loads, or if it cannot be reached (values of Nov 2026)
const FALLBACK_PLANS: Plan[] = [
  { tier: 'Free', monthlyPrice: 0, annualPrice: 0, maxAccounts: 1, maxEnvelopes: 5, maxPaycheckJobs: 0, maxSharedHouseholds: 0, allowSharedExpenses: false, allowAdvancedReporting: false, prioritySupport: false, allowMembers: false, allowBalanceHistory: false, allowPlanning: false, stripeAnnualPriceId: null },
  { tier: 'Pro', monthlyPrice: 9.99, annualPrice: 99.9, maxAccounts: 5, maxEnvelopes: 20, maxPaycheckJobs: 3, maxSharedHouseholds: 1, allowSharedExpenses: true, allowAdvancedReporting: true, prioritySupport: false, allowMembers: false, allowBalanceHistory: true, allowPlanning: true, stripeAnnualPriceId: null },
  { tier: 'Family', monthlyPrice: 24.99, annualPrice: 199.9, maxAccounts: 0, maxEnvelopes: 0, maxPaycheckJobs: 0, maxSharedHouseholds: 10, allowSharedExpenses: true, allowAdvancedReporting: true, prioritySupport: true, allowMembers: true, allowBalanceHistory: true, allowPlanning: true, stripeAnnualPriceId: null }
]

const TIER_ORDER = ['Free', 'Pro', 'Family']
const plans = ref<Plan[]>(FALLBACK_PLANS)
const interval = ref<BillingInterval>('month')

onMounted(async () => {
  try {
    const loaded = (await billingApi.getPlans()) as unknown as Plan[]
    const known = loaded.filter(p => TIER_ORDER.includes(p.tier))
    if (known.length) plans.value = known.sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier))
  } catch {
    // The fallback prices stay
  }
})

// The biggest yearly discount, shown on the yearly switch
const bestSaving = computed(() =>
  Math.max(0, ...plans.value
    .filter(p => p.monthlyPrice > 0 && p.annualPrice > 0)
    .map(p => Math.round((1 - p.annualPrice / (p.monthlyPrice * 12)) * 100)))
)

const formatPrice = (amount: number) =>
  new Intl.NumberFormat(locale.value === 'en' ? 'en-CA' : 'fr-CA', { style: 'currency', currency: 'CAD' }).format(amount)

// A count, or "unlimited" for a limit of 0
const limit = (count: number, key: string) =>
  count === 0 ? t(`homepage.pricing.unlimited_${key}`) : t(`homepage.pricing.limit_${key}`, count)

const planFeatures = (plan: Plan) => {
  const items = [
    limit(plan.maxAccounts, 'accounts'),
    limit(plan.maxEnvelopes, 'envelopes'),
    limit(plan.maxPaycheckJobs, 'jobs'),
    t('homepage.pricing.item_core')
  ]
  if (plan.allowPlanning) items.push(t('homepage.pricing.item_planning'))
  if (plan.allowBalanceHistory) items.push(t('homepage.pricing.item_history'))
  if (plan.allowSharedExpenses && plan.maxSharedHouseholds > 0) items.push(t('homepage.pricing.item_sharing', plan.maxSharedHouseholds))
  if (plan.allowMembers) items.push(t('homepage.pricing.item_members'))
  if (plan.allowAdvancedReporting) items.push(t('homepage.pricing.item_reports'))
  if (plan.prioritySupport) items.push(t('homepage.pricing.item_support'))
  return items
}

const planLink = (plan: Plan) => {
  if (plan.monthlyPrice === 0) return '/signup'
  const yearly = interval.value === 'year' && plan.annualPrice > 0
  return { path: '/checkout', query: { plan: plan.tier.toLowerCase(), interval: yearly ? 'year' : 'month' } }
}
</script>

<style scoped>
.landing {
  --ink: #0f172a;
  --text: #334155;
  --muted: #64748b;
  --line: #e2e8f0;
  --tint: #f5f7ff;
  --blue: #2563eb;
  --violet: #7c3aed;
  --gradient: linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #7c3aed 100%);
  color: var(--text);
  background: #ffffff;
  overflow-x: hidden;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.95rem 1.6rem;
  border-radius: 14px;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  border: 1.5px solid transparent;
  transition: transform 150ms, box-shadow 150ms, background 150ms;
  cursor: pointer;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn:focus-visible {
  outline: 3px solid rgba(59, 130, 246, 0.45);
  outline-offset: 2px;
}

.btn-small {
  padding: 0.6rem 1.1rem;
  border-radius: 12px;
  font-size: 0.925rem;
  color: #ffffff;
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
}

.btn-primary {
  color: #ffffff;
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.28);
}

.btn-outline {
  color: var(--blue);
  border-color: #c7d2fe;
  background: #ffffff;
}

.btn-outline:hover {
  background: #eef2ff;
}

.btn-white {
  color: #1e3a8a;
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.2);
}

.btn-ghost {
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.45);
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.12);
}

.btn-block {
  width: 100%;
}

/* Navigation */
.nav {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
}

.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.9rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.brand {
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #1e3a8a;
  text-decoration: none;
}

.brand span {
  color: var(--violet);
}

.nav-links {
  display: flex;
  gap: 1.75rem;
  flex: 1;
}

.nav-link,
.nav-login {
  color: var(--text);
  font-weight: 500;
  text-decoration: none;
}

.nav-link:hover,
.nav-login:hover {
  color: var(--blue);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 1.1rem;
}

.lang-switch {
  display: flex;
  flex-shrink: 0;
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
}

.lang-switch button {
  padding: 0.35rem 0.65rem;
  border: none;
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

/* Hero */
.hero {
  position: relative;
  overflow: hidden;
  color: #ffffff;
  background: var(--gradient);
}

.hero-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.5;
  pointer-events: none;
}

.hero-glow--one {
  width: 520px;
  height: 520px;
  top: -180px;
  right: -120px;
  background: #60a5fa;
}

.hero-glow--two {
  width: 420px;
  height: 420px;
  bottom: -200px;
  left: -120px;
  background: #c084fc;
}

.hero-inner {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  padding: 5.5rem 1.5rem 6rem;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: 4rem;
  align-items: center;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.28);
  font-size: 0.9rem;
  font-weight: 600;
}

.hero h1 {
  margin: 1.25rem 0 1rem;
  color: #ffffff;
  font-size: clamp(2.4rem, 4.6vw, 3.6rem);
  line-height: 1.05;
  font-weight: 800;
  letter-spacing: -0.035em;
}

.hero-subtitle {
  max-width: 560px;
  margin: 0;
  font-size: 1.15rem;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.88);
}

.hero-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
  margin: 2rem 0 1.75rem;
}

.hero-trust {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 1.4rem;
  font-size: 0.925rem;
  color: rgba(255, 255, 255, 0.85);
}

.hero-trust li {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.hero-trust i {
  color: #86efac;
}

/* Hero mock-up */
.hero-visual {
  position: relative;
}

.mock-account {
  padding: 1.5rem;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.24);
  backdrop-filter: blur(14px);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28);
  animation: float-in 0.6s ease-out both;
}

.mock-account-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.mock-label {
  margin: 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.75);
}

.mock-balance {
  margin: 0.2rem 0 0;
  color: #ffffff;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.mock-adjust {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.8rem;
  border-radius: 10px;
  background: #ffffff;
  color: #1e3a8a;
  font-size: 0.85rem;
  font-weight: 700;
  white-space: nowrap;
}

.mock-envelopes {
  display: grid;
  gap: 0.7rem;
}

.mock-envelope {
  padding: 0.8rem 1rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.1);
}

.mock-envelope-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.95rem;
}

.mock-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.mock-name {
  flex: 1;
}

.mock-amount {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.mock-bar {
  height: 6px;
  margin-top: 0.55rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  overflow: hidden;
}

.mock-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
}

.mock-toast {
  position: absolute;
  left: -2rem;
  bottom: -1.75rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.9rem 1.1rem;
  border-radius: 16px;
  background: #ffffff;
  color: var(--ink);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.22);
  animation: float-in 0.6s 0.25s ease-out both;
}

.mock-toast i {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #d1fae5;
  color: #059669;
  font-size: 1.3rem;
}

.mock-toast strong,
.mock-toast span {
  display: block;
}

.mock-toast strong {
  font-size: 0.925rem;
}

.mock-toast span {
  font-size: 0.825rem;
  color: var(--muted);
}

@keyframes float-in {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* Sections */
.section {
  padding: 6rem 1.5rem;
}

.section--tinted {
  background: var(--tint);
}

.section-inner {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.section-inner--narrow {
  max-width: 820px;
}

.kicker {
  margin: 0 0 0.6rem;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--violet);
}

.section-title {
  margin: 0 auto;
  max-width: 760px;
  color: var(--ink);
  font-size: clamp(1.9rem, 3.4vw, 2.6rem);
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.section-lead {
  max-width: 680px;
  margin: 1rem auto 0;
  font-size: 1.1rem;
  line-height: 1.65;
  color: var(--muted);
}

/* Old way vs Karo */
.compare {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
  margin-top: 3rem;
  text-align: left;
}

.compare-card {
  padding: 2rem;
  border-radius: 20px;
  border: 1px solid var(--line);
}

.compare-card h3 {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0 0 1.25rem;
  font-size: 1.2rem;
  color: var(--ink);
}

.compare-card ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.9rem;
}

.compare-card li {
  display: flex;
  gap: 0.65rem;
  line-height: 1.55;
}

.compare-card li i {
  margin-top: 0.1rem;
  font-size: 1.15rem;
}

.compare-card--old {
  background: #f8fafc;
}

.compare-card--old h3 i,
.compare-card--old li i {
  color: #94a3b8;
}

.compare-card--old li {
  color: var(--muted);
}

.compare-card--karo {
  background: #ffffff;
  border-color: #c7d2fe;
  box-shadow: 0 18px 40px rgba(37, 99, 235, 0.12);
}

.compare-card--karo h3 i {
  color: var(--violet);
}

.compare-card--karo li i {
  color: #10b981;
}

/* Steps */
.steps {
  list-style: none;
  margin: 3rem 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.5rem;
  text-align: left;
}

.step {
  position: relative;
  padding: 2rem;
  border-radius: 20px;
  background: #ffffff;
  border: 1px solid var(--line);
}

.step-number {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  font-size: 2.5rem;
  font-weight: 800;
  color: #e0e7ff;
  line-height: 1;
}

.step-icon {
  display: inline-grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: var(--gradient);
  color: #ffffff;
  font-size: 1.5rem;
}

.step h3 {
  margin: 1.25rem 0 0.5rem;
  font-size: 1.15rem;
  color: var(--ink);
}

.step p {
  margin: 0;
  line-height: 1.6;
  color: var(--muted);
}

.steps-note {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  margin: 2.5rem 0 0;
  padding: 0.9rem 1.4rem;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #c7d2fe;
  color: var(--ink);
  font-weight: 600;
}

.steps-note i {
  color: #f59e0b;
  font-size: 1.3rem;
}

/* Features */
.features {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.5rem;
  margin-top: 3rem;
  text-align: left;
}

.feature {
  padding: 1.75rem;
  border-radius: 20px;
  border: 1px solid var(--line);
  transition: box-shadow 150ms, transform 150ms;
}

.feature:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
}

.feature-icon {
  display: inline-grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  font-size: 1.4rem;
}

.feature h3 {
  margin: 1.1rem 0 0.45rem;
  font-size: 1.1rem;
  color: var(--ink);
}

.feature p {
  margin: 0;
  line-height: 1.6;
  color: var(--muted);
}

/* Pricing */
.interval-switch {
  display: inline-flex;
  gap: 0.25rem;
  margin-top: 2rem;
  padding: 0.3rem;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid var(--line);
}

.interval-switch button {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1.1rem;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--muted);
  font-weight: 600;
  cursor: pointer;
}

.interval-switch button.active {
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  color: #ffffff;
}

.saving {
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  background: #d1fae5;
  color: #047857;
  font-size: 0.75rem;
}

.plans {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.5rem;
  margin-top: 2.5rem;
  align-items: stretch;
  text-align: left;
}

.plan {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 2rem;
  border-radius: 22px;
  background: #ffffff;
  border: 1px solid var(--line);
}

.plan--featured {
  border: 2px solid transparent;
  background: linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(135deg, #2563eb, #7c3aed) border-box;
  box-shadow: 0 24px 50px rgba(37, 99, 235, 0.16);
}

.plan-badge {
  position: absolute;
  top: -0.8rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.3rem 0.9rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
}

.plan h3 {
  margin: 0;
  font-size: 1.3rem;
  color: var(--ink);
}

.plan-desc {
  margin: 0.35rem 0 1.25rem;
  color: var(--muted);
  min-height: 3rem;
}

.plan-price {
  margin: 0;
  font-size: 2.3rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--ink);
}

.plan-price span {
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0;
  color: var(--muted);
}

.plan-note {
  margin: 0.25rem 0 1.5rem;
  font-size: 0.9rem;
  color: var(--muted);
}

.plan-features {
  list-style: none;
  margin: 0 0 2rem;
  padding: 0;
  display: grid;
  align-content: start;
  gap: 0.7rem;
  flex: 1;
}

.plan-features li {
  display: flex;
  gap: 0.55rem;
  line-height: 1.45;
}

.plan-features i {
  color: #10b981;
  font-size: 1.1rem;
}

.pricing-footnote {
  margin: 2rem 0 0;
  font-size: 0.9rem;
  color: var(--muted);
}

/* FAQ */
.faq {
  display: grid;
  gap: 0.8rem;
  margin-top: 2.5rem;
  text-align: left;
}

.faq-item {
  border-radius: 16px;
  border: 1px solid var(--line);
  background: #ffffff;
  padding: 0 1.4rem;
}

.faq-item[open] {
  border-color: #c7d2fe;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.08);
}

.faq-item summary {
  padding: 1.15rem 0;
  font-weight: 600;
  color: var(--ink);
  cursor: pointer;
  list-style: none;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.faq-item summary::-webkit-details-marker {
  display: none;
}

.faq-item summary::after {
  content: '+';
  font-size: 1.3rem;
  line-height: 1;
  color: var(--violet);
}

.faq-item[open] summary::after {
  content: '−';
}

.faq-item p {
  margin: 0 0 1.2rem;
  line-height: 1.65;
  color: var(--muted);
}

/* Call to action */
.cta {
  padding: 0 1.5rem 6rem;
}

.cta-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 4rem 2rem;
  border-radius: 28px;
  background: var(--gradient);
  color: #ffffff;
  text-align: center;
  box-shadow: 0 30px 60px rgba(37, 99, 235, 0.25);
}

.cta h2 {
  margin: 0 0 0.75rem;
  color: #ffffff;
  font-size: clamp(1.8rem, 3.2vw, 2.4rem);
  font-weight: 800;
  letter-spacing: -0.03em;
}

.cta p {
  max-width: 560px;
  margin: 0 auto 2rem;
  font-size: 1.1rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.88);
}

/* Footer */
.footer {
  border-top: 1px solid var(--line);
  background: #f8fafc;
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3.5rem 1.5rem 2.5rem;
  display: grid;
  grid-template-columns: 1.6fr repeat(3, 1fr);
  gap: 2rem;
}

.footer-brand p {
  max-width: 300px;
  margin: 0.6rem 0 0;
  line-height: 1.6;
  color: var(--muted);
}

.footer-links {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.footer-links h4 {
  margin: 0 0 0.3rem;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink);
}

.footer-links a {
  color: var(--muted);
  text-decoration: none;
}

.footer-links a:hover {
  color: var(--blue);
}

.footer-bottom {
  border-top: 1px solid var(--line);
  padding: 1.25rem 1.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--muted);
}

.footer-bottom p {
  margin: 0;
}

/* Tablets */
@media (max-width: 960px) {
  .nav-links {
    display: none;
  }

  .nav-inner {
    justify-content: space-between;
  }

  .hero-inner {
    grid-template-columns: 1fr;
    gap: 3.5rem;
    padding: 4rem 1.5rem 5rem;
  }

  .hero-visual {
    max-width: 560px;
  }

  /* One column: the toast goes under the card instead of covering its last envelope */
  .mock-toast {
    position: static;
    margin-top: 1rem;
  }

  .steps,
  .features,
  .plans {
    grid-template-columns: 1fr;
    max-width: 560px;
    margin-left: auto;
    margin-right: auto;
  }

  .compare {
    grid-template-columns: 1fr;
  }

  .footer-inner {
    grid-template-columns: 1fr 1fr;
  }
}

/* Phones */
@media (max-width: 560px) {
  .nav-login {
    display: none;
  }

  .nav-actions {
    gap: 0.6rem;
  }

  .section {
    padding: 4.5rem 1.25rem;
  }

  .hero-buttons .btn {
    width: 100%;
  }

  .footer-inner {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mock-account,
  .mock-toast,
  .btn,
  .feature {
    animation: none;
    transition: none;
  }
}
</style>
