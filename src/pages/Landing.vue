<template>
  <div class="landing-container">
    <!-- Navigation -->
    <nav class="navbar">
      <div class="navbar-content">
        <div class="logo">
          <i class="mdi mdi-wallet-outline"></i>
          <span>Karo</span>
        </div>
        <div class="nav-links">
          <a href="#features" class="nav-link">{{ t('landing.features') }}</a>
          <a href="#pricing" class="nav-link">{{ t('landing.pricing') }}</a>
          <router-link to="/login" class="nav-link">{{ t('auth.login') }}</router-link>
          <router-link to="/signup" class="btn btn-primary-sm">{{ t('auth.signup') }}</router-link>
        </div>
      </div>
    </nav>

    <!-- Test application notice: what the app is, its features, free vs paid -->
    <section class="test-banner-section">
      <div class="test-banner">
        <div class="test-banner-header">
          <i class="mdi mdi-flask-outline"></i>
          <div>
            <h2>{{ t('landing.test_banner.title') }}</h2>
            <p>{{ t('landing.test_banner.intro') }}</p>
          </div>
        </div>

        <div class="test-banner-notice">
          <i class="mdi mdi-cash-remove"></i>
          <p>{{ t('landing.test_banner.no_payment') }}</p>
        </div>

        <h3 class="test-banner-title">{{ t('landing.test_banner.features_title') }}</h3>
        <div class="test-features-grid">
          <div v-for="item in testFeatures" :key="item.icon" class="test-feature">
            <i :class="item.icon"></i>
            <div>
              <h4>{{ item.title }}</h4>
              <p>{{ item.description }}</p>
            </div>
          </div>
        </div>

        <h3 class="test-banner-title">{{ t('landing.test_banner.plans_title') }}</h3>
        <p class="test-banner-text">{{ t('landing.test_banner.plans_intro') }}</p>
        <div class="test-plans-grid">
          <div v-for="plan in testPlans" :key="plan.name" class="test-plan" :class="{ paid: plan.paid }">
            <h4>{{ plan.name }}</h4>
            <ul>
              <li v-for="(item, idx) in plan.items" :key="idx">
                <i :class="plan.paid ? 'mdi mdi-star-circle' : 'mdi mdi-check'"></i>
                {{ item }}
              </li>
            </ul>
          </div>
        </div>
        <p class="test-banner-footnote">{{ t('landing.test_banner.plans_footnote') }}</p>
      </div>
    </section>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">{{ t('landing.hero_title') }}</h1>
        <p class="hero-subtitle">{{ t('landing.hero_subtitle') }}</p>
        <div class="hero-buttons">
          <router-link to="/signup" class="btn btn-primary-lg">
            {{ t('landing.get_started') }}
          </router-link>
          <a href="#pricing" class="btn btn-secondary-lg">
            {{ t('landing.view_pricing') }}
          </a>
        </div>
      </div>
      <div class="hero-visual">
        <div class="hero-card">
          <i class="mdi mdi-chart-line"></i>
          <span>{{ t('landing.budget_tracking') }}</span>
        </div>
        <div class="hero-card">
          <i class="mdi mdi-account-multiple"></i>
          <span>{{ t('landing.family_sharing') }}</span>
        </div>
        <div class="hero-card">
          <i class="mdi mdi-lock"></i>
          <span>{{ t('landing.secure') }}</span>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="features">
      <h2 class="section-title">{{ t('landing.why_karo') }}</h2>
      <div class="features-grid">
        <div v-for="feature in features" :key="feature.id" class="feature-card">
          <div class="feature-icon" :style="{ backgroundColor: feature.color }">
            <i :class="feature.icon"></i>
          </div>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="pricing">
      <h2 class="section-title">{{ t('landing.simple_pricing') }}</h2>
      <p class="section-subtitle">{{ t('landing.pricing_subtitle') }}</p>

      <div class="pricing-grid">
        <div
          v-for="tier in pricingTiers"
          :key="tier.id"
          class="pricing-card"
          :class="{ featured: tier.featured }"
        >
          <div class="pricing-header">
            <h3>{{ tier.name }}</h3>
            <p v-if="tier.price === 0" class="price-free">{{ t('landing.free') }}</p>
            <p v-else class="price">
              <span class="currency">$</span>
              <span class="amount">{{ tier.price }}</span>
              <span class="period">/{{ t('landing.month') }}</span>
            </p>
          </div>

          <p class="tier-description">{{ tier.description }}</p>

          <ul class="features-list">
            <li v-for="(feature, idx) in tier.features" :key="idx">
              <i class="mdi mdi-check"></i>
              {{ feature }}
            </li>
          </ul>

          <router-link
            :to="tier.buttonLink"
            :class="['btn', tier.featured ? 'btn-primary-lg' : 'btn-secondary-lg']"
          >
            {{ tier.buttonText }}
          </router-link>

          <p v-if="tier.popular" class="popular-badge">{{ t('landing.most_popular') }}</p>
        </div>
      </div>

      <!-- Comparison Table -->
      <div class="comparison-section">
        <h3>{{ t('landing.feature_comparison') }}</h3>
        <div class="comparison-table">
          <table>
            <thead>
              <tr>
                <th>{{ t('landing.feature') }}</th>
                <th>{{ t('landing.free') }}</th>
                <th>Pro</th>
                <th>{{ t('landing.family') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(feature, idx) in comparisonFeatures" :key="idx">
                <td class="feature-name">{{ feature.name }}</td>
                <td>
                  <i v-if="feature.free" class="mdi mdi-check"></i>
                  <span v-else class="dash">—</span>
                </td>
                <td>
                  <i v-if="feature.pro" class="mdi mdi-check"></i>
                  <span v-else class="dash">—</span>
                </td>
                <td>
                  <i v-if="feature.family" class="mdi mdi-check"></i>
                  <span v-else class="dash">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Promo Code Section -->
    <section class="promo-section">
      <h2 class="section-title">{{ t('landing.have_promo_code') }}</h2>
      <div class="promo-box">
        <input
          v-model="promoCode"
          type="text"
          :placeholder="t('landing.enter_promo_code')"
          class="promo-input"
          @keyup.enter="applyPromoCode"
        />
        <button class="btn btn-primary-lg" @click="applyPromoCode">
          {{ t('landing.apply') }}
        </button>
      </div>
      <div v-if="promoMessage" :class="['promo-message', promoSuccess ? 'success' : 'error']">
        {{ promoMessage }}
      </div>
    </section>

    <!-- CTA Section -->
    <!-- Basic concepts, explained before the call to action -->
    <section id="faq" class="landing-faq">
      <h2 class="section-title">{{ t('landing.faq_title') }}</h2>
      <p class="landing-faq-intro">{{ t('landing.faq_intro') }}</p>
      <div class="landing-faq-list">
        <details v-for="id in FAQ_ITEMS" :key="id" class="landing-faq-item">
          <summary>{{ t(`faq.items.${id}.question`) }}</summary>
          <p>{{ t(`faq.items.${id}.answer`) }}</p>
        </details>
      </div>
    </section>

    <section class="cta">
      <h2>{{ t('landing.ready_to_start') }}</h2>
      <p>{{ t('landing.cta_subtitle') }}</p>
      <router-link to="/signup" class="btn btn-primary-lg">
        {{ t('landing.create_account_free') }}
      </router-link>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <h4>{{ t('landing.product') }}</h4>
          <ul>
            <li><a href="#features">{{ t('landing.features') }}</a></li>
            <li><a href="#pricing">{{ t('landing.pricing') }}</a></li>
            <li><router-link to="/login">{{ t('auth.login') }}</router-link></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>{{ t('landing.company') }}</h4>
          <ul>
            <li><a href="#">{{ t('landing.about') }}</a></li>
            <li><a href="#">{{ t('landing.blog') }}</a></li>
            <li><a href="#">{{ t('landing.contact') }}</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>{{ t('landing.legal') }}</h4>
          <ul>
            <li><a href="/confidentialite">{{ t('landing.privacy') }}</a></li>
            <li><a href="/conditions">{{ t('landing.terms') }}</a></li>
            <li><a href="/confidentialite#cookies">{{ t('landing.cookies') }}</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>Karo</h4>
          <p>{{ t('landing.tagline') }}</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2024 Karo. {{ t('landing.all_rights') }}</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Questions from the shared FAQ texts (faq.items.*) that explain the basics
const FAQ_ITEMS = [
  'envelope',
  'accountVsEnvelope',
  'expectedIncome',
  'allocation',
  'paid',
  'transferWithdraw'
] as const

const promoCode = ref('')
const promoMessage = ref('')
const promoSuccess = ref(false)

const features = [
  {
    id: 1,
    icon: 'mdi mdi-chart-pie',
    color: '#3b82f6',
    title: t('landing.feature_budget_title'),
    description: t('landing.feature_budget_desc')
  },
  {
    id: 2,
    icon: 'mdi mdi-account-multiple-plus',
    color: '#10b981',
    title: t('landing.feature_sharing_title'),
    description: t('landing.feature_sharing_desc')
  },
  {
    id: 3,
    icon: 'mdi mdi-shield-check',
    color: '#f59e0b',
    title: t('landing.feature_secure_title'),
    description: t('landing.feature_secure_desc')
  },
  {
    id: 4,
    icon: 'mdi mdi-sync',
    color: '#8b5cf6',
    title: t('landing.feature_sync_title'),
    description: t('landing.feature_sync_desc')
  },
  {
    id: 5,
    icon: 'mdi mdi-smartphone',
    color: '#ec4899',
    title: t('landing.feature_mobile_title'),
    description: t('landing.feature_mobile_desc')
  },
  {
    id: 6,
    icon: 'mdi mdi-lightbulb-on',
    color: '#06b6d4',
    title: t('landing.feature_insights_title'),
    description: t('landing.feature_insights_desc')
  }
]

// Test-app notice: features explained in detail
const testFeatures = [
  {
    icon: 'mdi mdi-bank',
    title: t('landing.test_banner.accounts_title'),
    description: t('landing.test_banner.accounts_desc')
  },
  {
    icon: 'mdi mdi-email-outline',
    title: t('landing.test_banner.envelopes_title'),
    description: t('landing.test_banner.envelopes_desc')
  },
  {
    icon: 'mdi mdi-cash-multiple',
    title: t('landing.test_banner.paychecks_title'),
    description: t('landing.test_banner.paychecks_desc')
  },
  {
    icon: 'mdi mdi-calendar-alert',
    title: t('landing.test_banner.bills_title'),
    description: t('landing.test_banner.bills_desc')
  },
  {
    icon: 'mdi mdi-account-multiple',
    title: t('landing.test_banner.sharing_title'),
    description: t('landing.test_banner.sharing_desc')
  },
  {
    icon: 'mdi mdi-calendar-month',
    title: t('landing.test_banner.planning_title'),
    description: t('landing.test_banner.planning_desc')
  },
  {
    icon: 'mdi mdi-chart-bar',
    title: t('landing.test_banner.reports_title'),
    description: t('landing.test_banner.reports_desc')
  },
  {
    icon: 'mdi mdi-shield-lock',
    title: t('landing.test_banner.privacy_title'),
    description: t('landing.test_banner.privacy_desc')
  }
]

// Free vs paid plans, as explained in the test-app notice
const testPlans = [
  {
    name: t('landing.free'),
    paid: false,
    items: [
      t('landing.test_banner.free_1'),
      t('landing.test_banner.free_2'),
      t('landing.test_banner.free_3'),
      t('landing.test_banner.free_4'),
      t('landing.test_banner.free_5'),
      t('landing.test_banner.free_6')
    ]
  },
  {
    name: 'Pro',
    paid: true,
    items: [
      t('landing.test_banner.pro_1'),
      t('landing.test_banner.pro_2'),
      t('landing.test_banner.pro_3'),
      t('landing.test_banner.pro_4'),
      t('landing.test_banner.pro_5'),
      t('landing.test_banner.pro_6')
    ]
  },
  {
    name: t('landing.family'),
    paid: true,
    items: [
      t('landing.test_banner.family_1'),
      t('landing.test_banner.family_2'),
      t('landing.test_banner.family_3'),
      t('landing.test_banner.family_4'),
      t('landing.test_banner.family_5')
    ]
  }
]

const pricingTiers = [
  {
    id: 'free',
    name: t('landing.free'),
    price: 0,
    description: t('landing.free_desc'),
    features: [
      t('landing.feature_1_account'),
      t('landing.feature_basic_envelope'),
      t('landing.feature_household'),
      t('landing.feature_basic_analytics')
    ],
    buttonText: t('landing.get_started'),
    buttonLink: '/signup',
    featured: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    description: t('landing.pro_desc'),
    features: [
      t('landing.feature_unlimited_accounts'),
      t('landing.feature_advanced_envelope'),
      t('landing.feature_household'),
      t('landing.feature_advanced_analytics'),
      t('landing.feature_priority_support')
    ],
    buttonText: t('landing.choose_pro'),
    buttonLink: '/checkout?plan=Pro',
    featured: true,
    popular: true
  },
  {
    id: 'family',
    name: t('landing.family'),
    price: 19.99,
    description: t('landing.family_desc'),
    features: [
      t('landing.feature_multiple_households'),
      t('landing.feature_team_collab'),
      t('landing.feature_api_access'),
      t('landing.feature_premium_analytics'),
      t('landing.feature_24_7_support'),
      t('landing.feature_custom_reports')
    ],
    buttonText: t('landing.choose_family'),
    buttonLink: '/checkout?plan=Family',
    featured: false
  }
]

const comparisonFeatures = [
  { name: t('landing.comp_basic_accounts'), free: true, pro: true, family: true },
  { name: t('landing.comp_accounts'), free: false, pro: true, family: true },
  { name: t('landing.comp_households'), free: false, pro: false, family: true },
  { name: t('landing.comp_members'), free: false, pro: false, family: true },
  { name: t('landing.comp_analytics'), free: false, pro: true, family: true },
  { name: t('landing.comp_advanced_analytics'), free: false, pro: false, family: true },
  { name: t('landing.comp_api'), free: false, pro: false, family: true },
  { name: t('landing.comp_support'), free: false, pro: true, family: true },
  { name: t('landing.comp_priority_support'), free: false, pro: false, family: true }
]

const applyPromoCode = () => {
  if (!promoCode.value) {
    promoMessage.value = t('landing.enter_code_error')
    promoSuccess.value = false
    return
  }

  // TODO: Validate promo code via API
  promoMessage.value = t('landing.promo_applied')
  promoSuccess.value = true
  promoCode.value = ''

  setTimeout(() => {
    promoMessage.value = ''
  }, 3000)
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.landing-container {
  background: #ffffff;
  color: #1e293b;
  overflow-x: hidden;
  padding-top: 64px;
}

/* Navbar */
.navbar {
  position: sticky;
  top: 0;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 0;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.navbar-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #3b82f6;
}

.logo i {
  font-size: 2rem;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-link {
  color: #475569;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}

.nav-link:hover {
  color: #3b82f6;
}

.btn-primary-sm {
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.3s;
}

.btn-primary-sm:hover {
  background-color: #2563eb;
}

/* Hero Section */
.hero {
  max-width: 1200px;
  margin: 0 auto;
  padding: 5rem 2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.2;
  color: #0f172a;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: #64748b;
  line-height: 1.6;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-primary-lg {
  background-color: #3b82f6;
  color: white;
}

.btn-primary-lg:hover {
  background-color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
}

.btn-secondary-lg {
  background-color: #f1f5f9;
  color: #1e293b;
  border: 2px solid #cbd5e1;
}

.btn-secondary-lg:hover {
  background-color: #e2e8f0;
  border-color: #3b82f6;
}

.hero-visual {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.hero-card {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  padding: 2rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  border: 2px solid #bfdbfe;
}

.hero-card i {
  font-size: 2.5rem;
  color: #3b82f6;
}

/* Features Section */
.features {
  background: #f8fafc;
  padding: 5rem 2rem;
}

.features,
.pricing {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 800;
  text-align: center;
  margin-bottom: 1rem;
  color: #0f172a;
}

.section-subtitle {
  text-align: center;
  color: #64748b;
  font-size: 1.1rem;
  margin-bottom: 3rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  text-align: center;
  transition: all 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  color: white;
  font-size: 1.5rem;
}

.feature-card h3 {
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
}

.feature-card p {
  color: #64748b;
  line-height: 1.6;
}

/* Pricing Section */
.pricing {
  padding: 5rem 2rem;
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 5rem;
}

.pricing-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative;
  transition: all 0.3s;
}

.pricing-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 12px 24px rgba(59, 130, 246, 0.15);
  transform: translateY(-5px);
}

.pricing-card.featured {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);
  box-shadow: 0 12px 24px rgba(59, 130, 246, 0.2);
  transform: scale(1.05);
}

.pricing-header h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.price-free {
  color: #10b981;
  font-size: 1.25rem;
  font-weight: 700;
}

.price {
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
}

.currency {
  font-size: 1.5rem;
}

.amount {
  margin: 0 0.25rem;
}

.period {
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
}

.tier-description {
  color: #64748b;
  font-size: 0.95rem;
}

.features-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
}

.features-list li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #475569;
  font-size: 0.95rem;
}

.features-list i {
  color: #10b981;
  font-size: 1.2rem;
}

.popular-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #ef4444;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

/* Comparison Table */
.comparison-section {
  background: white;
  padding: 3rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.comparison-section h3 {
  font-size: 1.5rem;
  margin-bottom: 2rem;
}

.comparison-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

table th,
table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
}

.feature-name {
  font-weight: 500;
  color: #1e293b;
}

table td i {
  color: #10b981;
  font-size: 1.2rem;
}

.dash {
  color: #cbd5e1;
  font-weight: 700;
}

/* Promo Code Section */
.promo-section {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  padding: 4rem 2rem;
  text-align: center;
}

.promo-section .section-title {
  color: white;
}

.promo-box {
  display: flex;
  gap: 1rem;
  max-width: 500px;
  margin: 0 auto 2rem;
  flex-wrap: wrap;
  justify-content: center;
}

.promo-input {
  flex: 1;
  min-width: 200px;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
}

.promo-input::placeholder {
  color: #cbd5e1;
}

.promo-message {
  padding: 1rem;
  border-radius: 4px;
  font-weight: 500;
  margin-top: 1rem;
}

.promo-message.success {
  background: #dcfce7;
  color: #166534;
}

.promo-message.error {
  background: #fee2e2;
  color: #991b1b;
}

/* CTA Section */
.landing-faq {
  background: white;
  padding: 5rem 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.landing-faq .section-title {
  text-align: center;
}

.landing-faq-intro {
  text-align: center;
  color: var(--text-muted);
  margin: 0 0 2rem;
}

.landing-faq-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.landing-faq-item {
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem 1.25rem;
}

.landing-faq-item summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--text-primary);
}

.landing-faq-item p {
  margin: 0.75rem 0 0;
  color: var(--text-muted);
  line-height: 1.6;
}

.cta {
  background: #0f172a;
  color: white;
  padding: 4rem 2rem;
  text-align: center;
  max-width: 1200px;
  margin: 0 auto;
}

.cta h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.cta p {
  font-size: 1.1rem;
  color: #cbd5e1;
  margin-bottom: 2rem;
}

/* Footer */
.footer {
  background: #1e293b;
  color: #cbd5e1;
  padding: 3rem 2rem 1.5rem;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.footer-section h4 {
  color: white;
  margin-bottom: 1rem;
  font-weight: 600;
}

.footer-section ul {
  list-style: none;
}

.footer-section ul li {
  margin-bottom: 0.5rem;
}

.footer-section a {
  color: #cbd5e1;
  text-decoration: none;
  transition: color 0.3s;
}

.footer-section a:hover {
  color: #3b82f6;
}

.footer-section p {
  color: #94a3b8;
  font-size: 0.9rem;
}

.footer-bottom {
  border-top: 1px solid #334155;
  padding-top: 2rem;
  text-align: center;
  color: #94a3b8;
}

/* Test-app notice: a bordered box so it stands out at the top */
.test-banner-section {
  max-width: 1200px;
  margin: 2rem auto 0;
  padding: 0 2rem;
}

.test-banner {
  background: #fffbeb;
  border: 4px solid #f59e0b;
  border-radius: 12px;
  padding: 2.5rem;
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.25);
  color: #1e293b;
}

.test-banner-header {
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.test-banner-header > i {
  font-size: 3rem;
  color: #d97706;
  flex-shrink: 0;
}

.test-banner-header h2 {
  font-size: 2rem;
  font-weight: 800;
  color: #92400e;
  margin-bottom: 0.5rem;
}

.test-banner-header p,
.test-banner-text {
  font-size: 1.05rem;
  line-height: 1.6;
  color: #451a03;
}

.test-banner-notice {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  background: #ffffff;
  border: 2px solid #f59e0b;
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 2rem;
}

.test-banner-notice > i {
  font-size: 1.75rem;
  color: #d97706;
  flex-shrink: 0;
}

.test-banner-notice p {
  line-height: 1.6;
  font-weight: 500;
}

.test-banner-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #92400e;
  margin: 2rem 0 1rem;
}

.test-features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}

.test-feature {
  display: flex;
  gap: 0.9rem;
  background: #ffffff;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 1.25rem;
}

.test-feature > i {
  font-size: 1.75rem;
  color: #3b82f6;
  flex-shrink: 0;
}

.test-feature h4 {
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 0.4rem;
}

.test-feature p {
  color: #475569;
  line-height: 1.55;
  font-size: 0.95rem;
}

.test-plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.test-plan {
  background: #ffffff;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
}

.test-plan.paid {
  border-color: #3b82f6;
}

.test-plan h4 {
  font-size: 1.25rem;
  font-weight: 800;
  margin-bottom: 1rem;
  color: #0f172a;
}

.test-plan ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.test-plan li {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  color: #334155;
  font-size: 0.95rem;
  line-height: 1.45;
}

.test-plan li i {
  color: #10b981;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.test-plan.paid li i {
  color: #3b82f6;
}

.test-banner-footnote {
  margin-top: 1.25rem;
  font-size: 0.85rem;
  color: #78350f;
  font-style: italic;
}

@media (max-width: 768px) {
  .test-banner-section {
    padding: 0 1rem;
  }

  .test-banner {
    padding: 1.5rem;
  }

  .test-banner-header h2 {
    font-size: 1.5rem;
  }

  .test-banner-header > i {
    font-size: 2.25rem;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .hero {
    grid-template-columns: 1fr;
    padding: 3rem 1rem;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .features-grid,
  .pricing-grid {
    grid-template-columns: 1fr;
  }

  .pricing-card.featured {
    transform: scale(1);
  }

  .nav-links {
    gap: 1rem;
  }

  .section-title {
    font-size: 1.75rem;
  }

  .promo-box {
    flex-direction: column;
  }

  .promo-input {
    min-width: 100%;
  }
}
</style>
