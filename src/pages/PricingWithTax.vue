<template>
  <div class="pricing-container">
    <div class="pricing-header">
      <h1>{{ t('landing.pricing_with_taxes') }}</h1>
      <p>{{ t('landing.pricing_adjusted_your_location') }}</p>
    </div>

    <!-- Jurisdiction Selector -->
    <div class="jurisdiction-selector-box">
      <label for="jurisdiction">{{ t('landing.select_region') }}</label>
      <select
        id="jurisdiction"
        v-model="selectedJurisdiction"
        class="jurisdiction-select"
        @change="updatePrices"
      >
        <option v-for="region in jurisdictions" :key="region.value" :value="region.value">
          {{ region.label }}
        </option>
      </select>

      <div v-if="taxInfo" class="tax-info-card">
        <div class="tax-detail">
          <span class="label">{{ t('landing.sales_tax') }}</span>
          <span class="value">{{ taxInfo.salesTaxRate.toFixed(2) }}%</span>
        </div>
        <div v-if="taxInfo.vat" class="tax-detail">
          <span class="label">{{ t('landing.vat') }}</span>
          <span class="value">{{ taxInfo.vat.toFixed(2) }}%</span>
        </div>
        <div class="tax-detail">
          <span class="label">{{ t('landing.total_tax_rate') }}</span>
          <span class="value total">{{ taxInfo.totalTaxRate.toFixed(2) }}%</span>
        </div>
      </div>
    </div>

    <!-- Pricing Tiers with Tax -->
    <div v-if="!loading" class="pricing-tiers-tax">
      <div
        v-for="tier in pricingTiersWithTax"
        :key="tier.id"
        class="tier-card-tax"
        :class="{ featured: tier.featured }"
      >
        <h2>{{ tier.name }}</h2>

        <!-- Base Price -->
        <div class="price-breakdown">
          <div class="price-row">
            <span class="label">{{ t('landing.base_price') }}</span>
            <span class="amount">${{ tier.basePrice.toFixed(2) }}</span>
          </div>

          <!-- Tax Amount -->
          <div class="price-row tax-row">
            <span class="label">+ {{ t('landing.tax') }} ({{ taxInfo?.totalTaxRate.toFixed(2) }}%)</span>
            <span class="amount tax">+ ${{ tier.taxAmount.toFixed(2) }}</span>
          </div>

          <!-- Final Price -->
          <div class="price-row final-price">
            <span class="label">{{ t('landing.total') }}</span>
            <span class="amount final">{{ tier.currency }}{{ tier.finalPrice.toFixed(2) }}</span>
          </div>
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

    <div v-else class="loading">
      {{ t('common.loading') }}
    </div>

    <!-- Back Button -->
    <div class="back-button-container">
      <router-link to="/" class="back-button">
        <i class="mdi mdi-arrow-left"></i>
        {{ t('landing.back_to_home') }}
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { apiUrl } from '../api/client'

const { t } = useI18n()

const loading = ref(false)
const selectedJurisdiction = ref('CA_ON')
const jurisdictions = ref<Array<{ value: string; label: string }>>([])
const taxInfo = ref<any>(null)

interface TierWithTax {
  id: string
  name: string
  basePrice: number
  taxAmount: number
  finalPrice: number
  currency: string
  description: string
  features: string[]
  buttonText: string
  buttonLink: string
  featured: boolean
  popular?: boolean
}

const pricingTiers = [
  {
    id: 'free',
    name: t('landing.free'),
    basePrice: 0,
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
    basePrice: 9.99,
    description: t('landing.pro_desc'),
    features: [
      t('landing.feature_unlimited_accounts'),
      t('landing.feature_advanced_envelope'),
      t('landing.feature_household'),
      t('landing.feature_advanced_analytics'),
      t('landing.feature_priority_support')
    ],
    buttonText: t('landing.choose_pro'),
    buttonLink: '/signup?tier=pro',
    featured: true,
    popular: true
  },
  {
    id: 'family',
    name: t('landing.family'),
    basePrice: 19.99,
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
    buttonLink: '/signup?tier=family',
    featured: false
  }
]

const pricingTiersWithTax = computed((): TierWithTax[] => {
  if (!taxInfo.value) return []

  return pricingTiers.map(tier => ({
    ...tier,
    taxAmount: tier.basePrice === 0 ? 0 : (tier.basePrice * taxInfo.value.totalTaxRate) / 100,
    finalPrice: tier.basePrice === 0 ? 0 : tier.basePrice + (tier.basePrice * taxInfo.value.totalTaxRate) / 100,
    currency: '$'
  }))
})

onMounted(async () => {
  await fetchJurisdictions()
  await updatePrices()
})

const fetchJurisdictions = async () => {
  try {
    const response = await fetch(apiUrl('/tax/jurisdictions'))
    if (response.ok) {
      jurisdictions.value = await response.json()
    }
  } catch (error) {
    console.error('Error fetching jurisdictions:', error)
  }
}

const updatePrices = async () => {
  loading.value = true
  try {
    const response = await fetch(apiUrl(`/tax/rate/${selectedJurisdiction.value}`))
    if (response.ok) {
      taxInfo.value = await response.json()
    }
  } catch (error) {
    console.error('Error fetching tax info:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.pricing-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.pricing-header {
  text-align: center;
  margin-bottom: 2rem;
}

.pricing-header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: #0f172a;
}

.pricing-header p {
  font-size: 1.1rem;
  color: #64748b;
}

/* Jurisdiction Selector */
.jurisdiction-selector-box {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 3rem;
  text-align: center;
}

.jurisdiction-selector-box label {
  display: block;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.jurisdiction-select {
  width: 100%;
  max-width: 300px;
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 1rem;
  margin-bottom: 1rem;
  cursor: pointer;
}

.jurisdiction-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.tax-info-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.tax-detail {
  background: white;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.tax-detail .label {
  display: block;
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tax-detail .value {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: #1e293b;
}

.tax-detail .value.total {
  color: #3b82f6;
}

/* Pricing Tiers */
.pricing-tiers-tax {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.tier-card-tax {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
  transition: all 0.3s;
}

.tier-card-tax:hover {
  border-color: #3b82f6;
  box-shadow: 0 12px 24px rgba(59, 130, 246, 0.15);
  transform: translateY(-5px);
}

.tier-card-tax.featured {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);
  box-shadow: 0 12px 24px rgba(59, 130, 246, 0.2);
  transform: scale(1.05);
}

.tier-card-tax h2 {
  font-size: 1.5rem;
  margin: 0;
  color: #0f172a;
}

.price-breakdown {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid #3b82f6;
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  font-size: 0.95rem;
}

.price-row .label {
  color: #64748b;
  font-weight: 500;
}

.price-row .amount {
  font-weight: 600;
  color: #1e293b;
}

.price-row.tax-row .label {
  color: #f59e0b;
}

.price-row.tax-row .amount.tax {
  color: #f59e0b;
}

.price-row.final-price {
  border-top: 2px solid #e2e8f0;
  padding-top: 1rem;
  font-weight: bold;
}

.price-row.final-price .amount.final {
  font-size: 1.3rem;
  color: #10b981;
}

.tier-description {
  color: #64748b;
  font-size: 0.95rem;
  margin: 0;
}

.features-list {
  list-style: none;
  padding: 0;
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

.btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s;
  width: 100%;
}

.btn-primary-lg {
  background-color: #3b82f6;
  color: white;
}

.btn-primary-lg:hover {
  background-color: #2563eb;
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

.popular-badge {
  position: absolute;
  top: -12px;
  right: 20px;
  background: #ef4444;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #64748b;
}

.back-button-container {
  text-align: center;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}

.back-button:hover {
  color: #2563eb;
}

@media (max-width: 768px) {
  .tier-card-tax.featured {
    transform: scale(1);
  }

  .jurisdiction-select {
    max-width: 100%;
  }

  .price-breakdown {
    padding: 0.75rem;
  }
}
</style>
