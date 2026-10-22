<template>
  <div class="admin-panel-layout">
    <!-- Sidebar Navigation -->
    <div class="admin-sidebar">
      <div class="admin-header">
        <h2>{{ t('admin.title') }}</h2>
        <p class="admin-subtitle">{{ t('admin.management') }}</p>
      </div>

      <nav class="admin-nav">
        <router-link
          to="/admin/dashboard"
          class="nav-item"
          :class="{ active: isActive('dashboard') }"
        >
          <i class="mdi mdi-chart-box-outline"></i>
          <span>{{ t('admin.dashboard') }}</span>
        </router-link>

        <router-link
          to="/admin/settings"
          class="nav-item"
          :class="{ active: isActive('settings') }"
        >
          <i class="mdi mdi-cog-outline"></i>
          <span>{{ t('admin.settings') }}</span>
        </router-link>

        <router-link
          to="/admin/subscriptions"
          class="nav-item"
          :class="{ active: isActive('subscriptions') }"
        >
          <i class="mdi mdi-credit-card-outline"></i>
          <span>{{ t('admin.subscriptions') }}</span>
        </router-link>

        <router-link
          to="/admin/tier-configurations"
          class="nav-item"
          :class="{ active: isActive('tier-configurations') }"
        >
          <i class="mdi mdi-sliders-vertical"></i>
          <span>Tier Configurations</span>
        </router-link>

        <router-link
          to="/admin/users"
          class="nav-item"
          :class="{ active: isActive('users') }"
        >
          <i class="mdi mdi-account-multiple-outline"></i>
          <span>{{ t('admin.users') }}</span>
        </router-link>

        <router-link
          to="/admin/promo-codes"
          class="nav-item"
          :class="{ active: isActive('promo-codes') }"
        >
          <i class="mdi mdi-ticket-outline"></i>
          <span>{{ t('admin.promo_codes') }}</span>
        </router-link>

        <router-link
          to="/admin/tax-rates"
          class="nav-item"
          :class="{ active: isActive('tax-rates') }"
        >
          <i class="mdi mdi-percent"></i>
          <span>{{ t('admin.tax_rates_management') }}</span>
        </router-link>
      </nav>

      <div class="admin-footer">
        <router-link to="/dashboard" class="back-link">
          <i class="mdi mdi-arrow-left"></i>
          {{ t('admin.back_to_app') }}
        </router-link>
      </div>
    </div>

    <!-- Main Content -->
    <div class="admin-content">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { t } = useI18n()
const route = useRoute()

const isActive = (section: string): boolean => {
  return route.path.includes(section)
}
</script>

<style scoped>
.admin-panel-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* Sidebar */
.admin-sidebar {
  width: 260px;
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  color: white;
  padding: 2rem 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  position: fixed;
  height: 100vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.admin-header {
  padding: 0 1.5rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.admin-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.admin-subtitle {
  margin: 0.5rem 0 0;
  font-size: 0.85rem;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Navigation */
.admin-nav {
  flex: 1;
  padding: 1rem 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
  font-size: 0.95rem;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: white;
}

.nav-item.active {
  background-color: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  border-left-color: #3b82f6;
}

.nav-item i {
  font-size: 1.3rem;
  width: 24px;
  text-align: center;
}

/* Footer */
.admin-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.back-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 0.9rem;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.back-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

/* Main Content */
.admin-content {
  flex: 1;
  margin-left: 260px;
  padding: 2rem;
  overflow-y: auto;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .admin-panel-layout {
    flex-direction: column;
  }

  .admin-sidebar {
    position: relative;
    width: 100%;
    height: auto;
    padding: 1rem 0;
  }

  .admin-content {
    margin-left: 0;
    padding: 1rem;
  }

  .admin-nav {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    padding: 1rem;
  }

  .nav-item {
    flex: 0 0 auto;
    padding: 0.75rem 1rem;
  }

  .admin-header {
    padding: 0 1rem 1rem;
  }

  .admin-footer {
    padding: 1rem;
  }
}
</style>
