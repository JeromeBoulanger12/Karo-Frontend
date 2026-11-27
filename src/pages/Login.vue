<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../composables/useAuth'
import { resetRedirectFlag } from '../api/client'

const { t } = useI18n()
const route = useRoute()
const { login, loading, error } = useAuth()

// Set when the interceptor sent the user here because the session ended
const sessionExpired = route.query.reason === 'expired'

const email = ref('')
const password = ref('')
const showPassword = ref(false)

const handleLogin = async () => {
  await login(email.value, password.value)
}

onMounted(() => {
  resetRedirectFlag()
})
</script>

<template>
  <div class="login-page">
    <!-- Brand panel: what Karo is, with a glimpse of envelopes -->
    <section class="brand-panel" aria-hidden="true">
      <div class="brand-glow brand-glow--one"></div>
      <div class="brand-glow brand-glow--two"></div>

      <div class="brand-content">
        <h2 class="brand-title">{{ t('loginPage.heroTitle') }}</h2>
        <p class="brand-subtitle">{{ t('loginPage.heroSubtitle') }}</p>

        <div class="preview">
          <div class="preview-card">
            <div class="preview-row">
              <span class="preview-dot" style="background: #34d399"></span>
              <span class="preview-name">{{ t('loginPage.previewRent') }}</span>
              <span class="preview-amount">1 250 $</span>
            </div>
            <div class="preview-bar"><span style="width: 100%; background: #34d399"></span></div>
          </div>
          <div class="preview-card preview-card--offset">
            <div class="preview-row">
              <span class="preview-dot" style="background: #fbbf24"></span>
              <span class="preview-name">{{ t('loginPage.previewGroceries') }}</span>
              <span class="preview-amount">320 $</span>
            </div>
            <div class="preview-bar"><span style="width: 64%; background: #fbbf24"></span></div>
          </div>
          <div class="preview-card">
            <div class="preview-row">
              <span class="preview-dot" style="background: #a78bfa"></span>
              <span class="preview-name">{{ t('loginPage.previewTrip') }}</span>
              <span class="preview-amount">880 $</span>
            </div>
            <div class="preview-bar"><span style="width: 38%; background: #a78bfa"></span></div>
          </div>
        </div>

        <ul class="brand-points">
          <li><i class="mdi mdi-email-outline"></i>{{ t('loginPage.pointEnvelopes') }}</li>
          <li><i class="mdi mdi-cash-fast"></i>{{ t('loginPage.pointPaycheck') }}</li>
          <li><i class="mdi mdi-shield-lock-outline"></i>{{ t('loginPage.pointPrivacy') }}</li>
        </ul>
      </div>
    </section>

    <!-- Sign-in form -->
    <section class="form-panel">
      <div class="form-card">
        <h1 class="form-title">{{ t('loginPage.welcomeBack') }}</h1>
        <p class="form-subtitle">{{ t('loginPage.subtitle') }}</p>

        <div v-if="sessionExpired && !error" class="notice notice--info" role="status">
          <i class="mdi mdi-clock-outline"></i>
          <span>{{ t('loginPage.sessionExpired') }}</span>
        </div>

        <div v-if="error" class="notice notice--error" role="alert">
          <i class="mdi mdi-alert-circle-outline"></i>
          <span>{{ error }}</span>
        </div>

        <form class="form" @submit.prevent="handleLogin">
          <label class="field">
            <span class="field-label">{{ t('auth.email') }}</span>
            <span class="field-control">
              <i class="mdi mdi-email-outline field-icon"></i>
              <input
                v-model="email"
                type="email"
                autocomplete="email"
                inputmode="email"
                required
                :disabled="loading"
                placeholder="nom@exemple.com"
              />
            </span>
          </label>

          <label class="field">
            <span class="field-label">{{ t('auth.password') }}</span>
            <span class="field-control">
              <i class="mdi mdi-lock-outline field-icon"></i>
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                required
                :disabled="loading"
                placeholder="••••••••"
              />
              <button
                type="button"
                class="field-toggle"
                :aria-label="showPassword ? t('loginPage.hidePassword') : t('loginPage.showPassword')"
                :aria-pressed="showPassword"
                @click="showPassword = !showPassword"
              >
                <i :class="['mdi', showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline']"></i>
              </button>
            </span>
          </label>

          <button type="submit" class="submit" :disabled="loading">
            <i v-if="loading" class="mdi mdi-loading mdi-spin"></i>
            <span>{{ t('auth.login') }}</span>
            <i v-if="!loading" class="mdi mdi-arrow-right"></i>
          </button>
        </form>

        <p class="signup">
          {{ t('auth.noAccount') }}
          <router-link to="/signup">{{ t('loginPage.createAccount') }}</router-link>
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.login-page {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  /* The app bar (64px) overlays the page: the global reset cancels the space Vuetify reserves for it */
  min-height: 100dvh;
  padding-top: 64px;
  background: var(--surface, #f8fafc);
}

/* Brand panel */
.brand-panel {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #fff;
  background: linear-gradient(140deg, #1e3a8a 0%, #2563eb 45%, #7c3aed 100%);
}

.brand-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.55;
  pointer-events: none;
}

.brand-glow--one {
  width: 420px;
  height: 420px;
  top: -120px;
  right: -100px;
  background: #60a5fa;
}

.brand-glow--two {
  width: 360px;
  height: 360px;
  bottom: -140px;
  left: -80px;
  background: #c084fc;
}

.brand-content {
  position: relative;
  max-width: 460px;
  width: 100%;
}

.brand-title {
  margin: 0 0 0.75rem;
  color: #fff;
  font-size: clamp(2rem, 3.2vw, 2.75rem);
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.brand-subtitle {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.82);
}

.preview {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 2.5rem 0;
}

.preview-card {
  padding: 0.9rem 1.1rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(12px);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.18);
  animation: float-in 0.6s ease-out both;
}

.preview-card:nth-child(2) {
  animation-delay: 0.1s;
}

.preview-card:nth-child(3) {
  animation-delay: 0.2s;
}

.preview-card--offset {
  margin-left: 2rem;
}

.preview-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.95rem;
}

.preview-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.preview-name {
  flex: 1;
}

.preview-amount {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.preview-bar {
  height: 6px;
  margin-top: 0.6rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  overflow: hidden;
}

.preview-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
}

.brand-points {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
}

.brand-points li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: rgba(255, 255, 255, 0.9);
}

.brand-points i {
  display: inline-grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.14);
  font-size: 1.1rem;
}

@keyframes float-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* Form panel */
.form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
}

.form-card {
  width: 100%;
  max-width: 400px;
}

.form-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--text-primary, #0f172a);
}

.form-subtitle {
  margin: 0.5rem 0 2rem;
  color: var(--text-muted, #64748b);
}

.notice {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
  margin-bottom: 1.25rem;
  border-radius: 12px;
  font-size: 0.925rem;
  line-height: 1.45;
}

.notice i {
  font-size: 1.2rem;
  line-height: 1.2;
}

.notice--info {
  background: var(--info-light, #e0f2fe);
  color: var(--info, #0369a1);
}

.notice--error {
  background: var(--danger-light, #fee2e2);
  color: #b91c1c;
}

.form {
  display: grid;
  gap: 1.1rem;
}

.field {
  display: grid;
  gap: 0.45rem;
}

.field-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary, #475569);
}

.field-control {
  position: relative;
  display: flex;
  align-items: center;
}

.field-icon {
  position: absolute;
  left: 0.95rem;
  font-size: 1.2rem;
  color: var(--text-disabled, #94a3b8);
  pointer-events: none;
  transition: color var(--transition-fast, 150ms);
}

.field-control input {
  width: 100%;
  height: 50px;
  padding: 0 2.9rem;
  font-size: 1rem;
  color: var(--text-primary, #0f172a);
  background: #fff;
  border: 1.5px solid var(--border, #e2e8f0);
  border-radius: 14px;
  outline: none;
  transition: border-color var(--transition-fast, 150ms), box-shadow var(--transition-fast, 150ms);
}

.field-control input::placeholder {
  color: var(--text-disabled, #94a3b8);
}

.field-control input:hover {
  border-color: #cbd5e1;
}

.field-control input:focus {
  border-color: var(--primary, #3b82f6);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
}

.field-control:focus-within .field-icon {
  color: var(--primary, #3b82f6);
}

.field-toggle {
  position: absolute;
  right: 0.5rem;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--text-muted, #64748b);
  font-size: 1.2rem;
  cursor: pointer;
}

.field-toggle:hover {
  background: var(--surface-secondary, #f1f5f9);
}

.field-toggle:focus-visible {
  outline: 2px solid var(--primary, #3b82f6);
  outline-offset: 1px;
}

.submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 52px;
  margin-top: 0.4rem;
  border: none;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.28);
  cursor: pointer;
  transition: transform var(--transition-fast, 150ms), box-shadow var(--transition-fast, 150ms), opacity var(--transition-fast, 150ms);
}

.submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(37, 99, 235, 0.34);
}

.submit:focus-visible {
  outline: 3px solid rgba(59, 130, 246, 0.45);
  outline-offset: 2px;
}

.submit:disabled {
  opacity: 0.7;
  cursor: progress;
}

.submit .mdi-arrow-right {
  transition: transform var(--transition-fast, 150ms);
}

.submit:hover:not(:disabled) .mdi-arrow-right {
  transform: translateX(3px);
}

.signup {
  margin: 2rem 0 0;
  text-align: center;
  color: var(--text-muted, #64748b);
}

.signup a {
  margin-left: 0.25rem;
  font-weight: 600;
  color: var(--primary-dark, #2563eb);
  text-decoration: none;
}

.signup a:hover {
  text-decoration: underline;
}

/* Tablets and phones: the form comes first, the brand panel goes away */
@media (max-width: 900px) {
  .login-page {
    grid-template-columns: 1fr;
    background: linear-gradient(180deg, #eef2ff 0%, var(--surface, #f8fafc) 40%);
  }

  .brand-panel {
    display: none;
  }

  .form-panel {
    align-items: flex-start;
    padding: 2.5rem 1.25rem;
  }

  .form-card {
    padding: 2rem 1.5rem;
    background: #fff;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  }

  .form-title {
    font-size: 1.65rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .preview-card,
  .submit,
  .submit .mdi-arrow-right {
    animation: none;
    transition: none;
  }
}
</style>
