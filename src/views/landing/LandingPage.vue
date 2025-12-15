<template>
  <div class="landing-page">
    <!-- Loading Screen -->
    <transition name="fade">
      <div v-if="isLoading" class="loading-screen">
        <div class="loading-content">
          <div class="spinner"></div>
          <p class="loading-text">{{ $t('common.loading') || '載入中...' }}</p>
        </div>
      </div>
    </transition>

    <!-- Navbar -->
    <Navbar />

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container">
        <div class="row align-items-center min-vh-100">
          <div class="col-12">
            <div class="hero-content text-center">
              <h1 class="hero-title">
                {{ $t('home.title') }}
                <span class="highlight">{{ $t('home.titleHighlight') }}</span>
              </h1>
              <p class="hero-subtitle">
                {{ $t('home.subtitle') }}
              </p>
              <div class="hero-stats mb-4">
                <div class="stat-item">
                  <span class="stat-number">{{ $t('home.stats.fee') }}</span>
                  <span class="stat-label">{{ $t('home.stats.feeLabel') }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">{{ $t('home.stats.system') }}</span>
                  <span class="stat-label">{{ $t('home.stats.systemLabel') }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">{{ $t('home.stats.support') }}</span>
                  <span class="stat-label">{{ $t('home.stats.supportLabel') }}</span>
                </div>
              </div>
              <div class="hero-actions">
                <router-link to="/features" class="btn btn-cta btn-lg me-3">
                  <i class="bi bi-play-circle me-2"></i>
                  {{ $t('common.learnMore') }}
                </router-link>
                <router-link to="/contact" class="btn btn-outline-light btn-lg">
                  <i class="bi bi-telephone me-2"></i>
                  {{ $t('common.contact') }}
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Core Features Section -->
    <section class="features-section">
      <div class="container">
        <div class="row">
          <div class="col-12 text-center mb-5">
            <h2 class="section-title">{{ $t('home.features.title') }}</h2>
            <p class="section-subtitle">{{ $t('home.features.subtitle') }}</p>
          </div>
        </div>
        <div class="row g-4">
          <div class="col-md-6 col-lg-4">
            <div class="feature-card">
              <div class="feature-icon">
                <i class="bi bi-star-fill"></i>
              </div>
              <h4>{{ $t('home.features.membership.title') }}</h4>
              <p>{{ $t('home.features.membership.description') }}</p>
              <ul class="feature-list">
                <li>{{ $t('home.features.membership.features.0') }}</li>
                <li>{{ $t('home.features.membership.features.1') }}</li>
                <li>{{ $t('home.features.membership.features.2') }}</li>
                <li>{{ $t('home.features.membership.features.3') }}</li>
              </ul>
            </div>
          </div>
          <div class="col-md-6 col-lg-4">
            <div class="feature-card">
              <div class="feature-icon">
                <i class="bi bi-ticket-perforated"></i>
              </div>
              <h4>{{ $t('home.features.voucher.title') }}</h4>
              <p>{{ $t('home.features.voucher.description') }}</p>
              <ul class="feature-list">
                <li>{{ $t('home.features.voucher.features.0') }}</li>
                <li>{{ $t('home.features.voucher.features.1') }}</li>
                <li>{{ $t('home.features.voucher.features.2') }}</li>
                <li>{{ $t('home.features.voucher.features.3') }}</li>
              </ul>
            </div>
          </div>
          <div class="col-md-6 col-lg-4">
            <div class="feature-card">
              <div class="feature-icon">
                <i class="bi bi-diagram-3"></i>
              </div>
              <h4>{{ $t('home.features.management.title') }}</h4>
              <p>{{ $t('home.features.management.description') }}</p>
              <ul class="feature-list">
                <li>{{ $t('home.features.management.features.0') }}</li>
                <li>{{ $t('home.features.management.features.1') }}</li>
                <li>{{ $t('home.features.management.features.2') }}</li>
                <li>{{ $t('home.features.management.features.3') }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Product Demo Section -->
    <section class="demo-section">
      <div class="container">
        <div class="row">
          <div class="col-12 text-center mb-5">
            <h2 class="section-title">{{ $t('home.demo.title') }}</h2>
            <p class="section-subtitle">{{ $t('home.demo.subtitle') }}</p>
          </div>
        </div>
        <div class="row g-4">
          <div class="col-lg-4">
            <div class="demo-card">
              <div class="demo-header">
                <div class="demo-icon">
                  <i class="bi bi-phone"></i>
                </div>
                <h4>{{ $t('home.demo.customer.title') }}</h4>
                <p class="demo-description">{{ $t('home.demo.customer.description') }}</p>
              </div>
              <div class="demo-features">
                <div class="demo-feature">
                  <i class="bi bi-check-circle"></i>
                  {{ $t('home.demo.customer.features.0') }}
                </div>
                <div class="demo-feature">
                  <i class="bi bi-check-circle"></i>
                  {{ $t('home.demo.customer.features.1') }}
                </div>
                <div class="demo-feature">
                  <i class="bi bi-check-circle"></i>
                  {{ $t('home.demo.customer.features.2') }}
                </div>
                <div class="demo-feature">
                  <i class="bi bi-check-circle"></i>
                  {{ $t('home.demo.customer.features.3') }}
                </div>
              </div>
            </div>
          </div>
          <div class="col-lg-4">
            <div class="demo-card">
              <div class="demo-header">
                <div class="demo-icon">
                  <i class="bi bi-laptop"></i>
                </div>
                <h4>{{ $t('home.demo.management.title') }}</h4>
                <p class="demo-description">{{ $t('home.demo.management.description') }}</p>
              </div>
              <div class="demo-features">
                <div class="demo-feature">
                  <i class="bi bi-check-circle"></i>
                  {{ $t('home.demo.management.features.0') }}
                </div>
                <div class="demo-feature">
                  <i class="bi bi-check-circle"></i>
                  {{ $t('home.demo.management.features.1') }}
                </div>
                <div class="demo-feature">
                  <i class="bi bi-check-circle"></i>
                  {{ $t('home.demo.management.features.2') }}
                </div>
                <div class="demo-feature">
                  <i class="bi bi-check-circle"></i>
                  {{ $t('home.demo.management.features.3') }}
                </div>
              </div>
            </div>
          </div>
          <div class="col-lg-4">
            <div class="demo-card">
              <div class="demo-header">
                <div class="demo-icon">
                  <i class="bi bi-calculator"></i>
                </div>
                <h4>{{ $t('home.demo.pos.title') }}</h4>
                <p class="demo-description">{{ $t('home.demo.pos.description') }}</p>
              </div>
              <div class="demo-features">
                <div class="demo-feature">
                  <i class="bi bi-check-circle"></i>
                  {{ $t('home.demo.pos.features.0') }}
                </div>
                <div class="demo-feature">
                  <i class="bi bi-check-circle"></i>
                  {{ $t('home.demo.pos.features.1') }}
                </div>
                <div class="demo-feature">
                  <i class="bi bi-check-circle"></i>
                  {{ $t('home.demo.pos.features.2') }}
                </div>
                <div class="demo-feature">
                  <i class="bi bi-check-circle"></i>
                  {{ $t('home.demo.pos.features.3') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section class="pricing-section">
      <div class="container">
        <div class="row">
          <div class="col-12 text-center mb-5">
            <h2 class="section-title">{{ $t('home.pricing.title') }}</h2>
            <p class="section-subtitle">{{ $t('home.pricing.subtitle') }}</p>
          </div>
        </div>
        <div class="row justify-content-center">
          <div class="col-lg-8">
            <div class="pricing-card">
              <div class="pricing-header">
                <div class="pricing-badge">{{ $t('pricing.plan.badge') }}</div>
                <h3>{{ $t('home.pricing.planTitle') }}</h3>
                <div class="pricing-value">
                  <span class="pricing-number">0.3</span>
                  <span class="pricing-unit">%</span>
                </div>
                <p class="pricing-desc">{{ $t('home.pricing.planDescription') }}</p>
              </div>
              <div class="pricing-features">
                <div class="pricing-feature">
                  <i class="bi bi-check-circle-fill"></i>
                  <span>{{ $t('home.pricing.features.0') }}</span>
                </div>
                <div class="pricing-feature">
                  <i class="bi bi-check-circle-fill"></i>
                  <span>{{ $t('home.pricing.features.1') }}</span>
                </div>
                <div class="pricing-feature">
                  <i class="bi bi-check-circle-fill"></i>
                  <span>{{ $t('home.pricing.features.2') }}</span>
                </div>
                <div class="pricing-feature">
                  <i class="bi bi-check-circle-fill"></i>
                  <span>{{ $t('home.pricing.features.3') }}</span>
                </div>
                <div class="pricing-feature">
                  <i class="bi bi-check-circle-fill"></i>
                  <span>{{ $t('home.pricing.features.4') }}</span>
                </div>
                <div class="pricing-feature">
                  <i class="bi bi-check-circle-fill"></i>
                  <span>{{ $t('home.pricing.features.5') }}</span>
                </div>
              </div>
              <div class="pricing-footer">
                <router-link to="/pricing" class="btn btn-cta btn-lg w-100">
                  {{ $t('common.learnMore') }}
                </router-link>
                <p class="pricing-note">{{ $t('home.pricing.note') }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="container">
        <div class="row">
          <div class="col-12 text-center">
            <h2 class="cta-title">{{ $t('home.cta.title') }}</h2>
            <p class="cta-subtitle">{{ $t('home.cta.subtitle') }}</p>
            <div class="cta-actions">
              <router-link to="/contact" class="btn btn-cta btn-lg">
                <i class="bi bi-calendar-check me-2"></i>
                {{ $t('common.schedule') }}
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer-section">
      <div class="container">
        <hr class="footer-divider" />
        <div class="row">
          <div class="col-12 text-center">
            <p class="footer-copyright">{{ $t('common.copyright') }}</p>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Navbar from '@/components/landing/Navbar.vue'
import { useLanguage } from '@/composables/useLanguage'

const { initializeLanguage } = useLanguage()

// Loading state
const isLoading = ref(true)

// Background image URL
const HERO_IMAGE_URL =
  'https://pub-e2700a21e03b4e26a8bafd4546249408.r2.dev/brands/685112874db5fec187398d19/7d9e4175-5768-4677-8d32-0e13e08278a8.png'

// Preload background image
const preloadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(url)
    img.onerror = reject
    img.src = url
  })
}

// SEO Meta
const setMetaTags = () => {
  document.title = '光兔點餐 - 專業餐飲管理系統'

  const metaTags = [
    {
      name: 'description',
      content:
        '光兔點餐提供完整的餐飲管理系統，包含會員積點、預購券、多店管理等功能。僅收取營業額0.3%，助您提升營運效率。',
    },
    { name: 'keywords', content: '光兔點餐,餐飲管理系統,POS系統,會員管理,預購券,點餐系統,餐廳管理' },
    { property: 'og:title', content: '光兔點餐 - 專業餐飲管理系統' },
    {
      property: 'og:description',
      content:
        '光兔點餐提供完整的餐飲管理系統，包含會員積點、預購券、多店管理等功能。僅收取營業額0.3%，助您提升營運效率。',
    },
    { property: 'og:type', content: 'website' },
  ]

  metaTags.forEach((tag) => {
    const element = document.querySelector(
      `meta[${tag.name ? 'name' : 'property'}="${tag.name || tag.property}"]`,
    )
    if (element) {
      element.setAttribute('content', tag.content)
    } else {
      const newTag = document.createElement('meta')
      if (tag.name) {
        newTag.name = tag.name
      } else {
        newTag.setAttribute('property', tag.property)
      }
      newTag.content = tag.content
      document.head.appendChild(newTag)
    }
  })
}

onMounted(async () => {
  initializeLanguage()
  setMetaTags()

  // Preload hero background image
  try {
    await preloadImage(HERO_IMAGE_URL)
    // Add a small delay for smoother transition
    setTimeout(() => {
      isLoading.value = false
    }, 300)
  } catch (error) {
    console.error('Failed to load hero image:', error)
    // Show content anyway even if image fails to load
    isLoading.value = false
  }
})
</script>

<style scoped>
/* Color Variables */
.landing-page {
  --primary-white: #ffffff;
  --text-dark: #2d3436;
  --text-medium: #636e72;
  --text-light: #b2bec3;
  --accent-orange: #ff6b35;
  --accent-orange-hover: #e85a28;
  --accent-orange-light: #ffe8e0;
  --bg-light: #f8f9fa;
  --border-light: #e9ecef;
  --shadow: rgba(45, 52, 54, 0.08);

  color: var(--text-medium);
  line-height: 1.6;
}

/* Loading Screen */
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
}

.spinner {
  width: 60px;
  height: 60px;
  margin: 0 auto 1.5rem;
  border: 4px solid rgba(255, 107, 53, 0.2);
  border-top: 4px solid var(--accent-orange);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: var(--text-dark);
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
  letter-spacing: 0.5px;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.section-title {
  color: var(--text-dark);
  font-weight: 700;
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.section-subtitle {
  color: var(--text-medium);
  font-size: 1.25rem;
  opacity: 0.9;
  margin-bottom: 3rem;
}

.btn-cta {
  background-color: var(--accent-orange);
  border-color: var(--accent-orange);
  color: #ffffff;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-cta:hover {
  background-color: var(--accent-orange-hover);
  border-color: var(--accent-orange-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}

/* Hero Section */
.hero-section {
  background: var(--primary-white);
  color: var(--text-dark);
  position: relative;
  overflow: hidden;
  background-image: url('https://pub-e2700a21e03b4e26a8bafd4546249408.r2.dev/brands/685112874db5fec187398d19/7d9e4175-5768-4677-8d32-0e13e08278a8.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 2;
  padding: 2rem 0;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  line-height: 1.2;
  color: #ffffff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.highlight {
  color: var(--accent-orange);
}

.hero-subtitle {
  font-size: 1.3rem;
  margin-bottom: 2rem;
  color: #ffffff;
  opacity: 0.95;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
}

.hero-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  justify-content: center;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent-orange);
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.4);
}

.stat-label {
  font-size: 0.9rem;
  color: #ffffff;
  opacity: 0.9;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.hero-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

/* Features Section */
.features-section {
  padding: 5rem 0;
  background: var(--light-bg);
}

.feature-card {
  background: #ffffff;
  padding: 2.5rem;
  border-radius: 12px;
  border: 1px solid var(--border-light);
  box-shadow: 0 8px 24px var(--shadow);
  height: 100%;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 48px rgba(45, 52, 54, 0.12);
}

.feature-icon {
  width: 60px;
  height: 60px;
  background: var(--accent-orange-light);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.feature-icon i {
  font-size: 1.5rem;
  color: var(--accent-orange);
}

.feature-card h4 {
  color: var(--text-dark);
  font-weight: 700;
  margin-bottom: 1rem;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin-top: 1rem;
}

.feature-list li {
  padding: 0.25rem 0;
  position: relative;
  padding-left: 1.5rem;
}

.feature-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--accent-orange);
  font-weight: 700;
}

/* Demo Section */
.demo-section {
  padding: 5rem 0;
  background: var(--white);
}

.demo-card {
  background: #ffffff;
  border: 2px solid #f0f0f0;
  border-radius: 12px;
  overflow: hidden;
  height: 100%;
  transition: all 0.3s ease;
}

.demo-card:hover {
  border-color: var(--accent-orange);
  box-shadow: 0 12px 32px rgba(255, 107, 53, 0.15);
}

.demo-header {
  padding: 2rem 1.5rem;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
}

.demo-icon {
  width: 50px;
  height: 50px;
  background: var(--accent-orange);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.demo-icon i {
  font-size: 1.25rem;
  color: #ffffff;
}

.demo-description {
  color: var(--text-medium);
  opacity: 0.9;
  margin-bottom: 1rem;
}

.demo-features {
  padding: 1.5rem;
}

.demo-feature {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.demo-feature i {
  color: var(--accent-orange);
  margin-right: 0.75rem;
}

/* Pricing Section */
.pricing-section {
  padding: 5rem 0;
  background: var(--light-bg);
}

.pricing-card {
  background: var(--white);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
}

.pricing-badge {
  background: var(--accent-orange);
  color: #ffffff;
  padding: 0.5rem 1rem;
  position: absolute;
  top: 0;
  right: 2rem;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 0 0 8px 8px;
}

.pricing-header {
  padding: 2.5rem 2rem 2rem;
  text-align: center;
  background: var(--bg-light);
  color: var(--text-dark);
  border-bottom: 1px solid var(--border-light);
}

.pricing-header h3 {
  margin-bottom: 1rem;
  font-weight: 700;
}

.pricing-value {
  margin-bottom: 1rem;
}

.pricing-number {
  font-size: 4rem;
  font-weight: 800;
  color: var(--accent-orange);
}

.pricing-unit {
  font-size: 2rem;
  font-weight: 600;
}

.pricing-desc {
  opacity: 0.9;
  font-size: 1.1rem;
}

.pricing-features {
  padding: 2rem;
}

.pricing-feature {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.pricing-feature i {
  color: var(--accent-orange);
  margin-right: 1rem;
  font-size: 1.1rem;
}

.pricing-footer {
  padding: 0 2rem 2rem;
  text-align: center;
}

.pricing-note {
  margin-top: 1rem;
  font-size: 0.9rem;
  opacity: 0.7;
}

/* CTA Section */
.cta-section {
  padding: 5rem 0;
  background: var(--bg-light);
  color: var(--text-dark);
  text-align: center;
}

.cta-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--text-dark);
}

.cta-subtitle {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  color: var(--text-medium);
  opacity: 1;
}

.cta-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Footer */
.footer-section {
  background: var(--text-dark);
  color: #ffffff;
  padding: 3rem 0 1rem;
}

.footer-brand h5 {
  color: var(--accent-orange);
  margin-bottom: 1rem;
}

.footer-links h6 {
  margin-bottom: 1rem;
  color: var(--accent-orange);
}

.footer-links ul {
  list-style: none;
  padding: 0;
}

.footer-links li {
  margin-bottom: 0.5rem;
}

.footer-links a {
  color: #ffffff;
  text-decoration: none;
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.footer-links a:hover {
  opacity: 1;
  color: var(--accent-orange);
}

.footer-contact h6 {
  margin-bottom: 1rem;
  color: var(--accent-orange);
}

.contact-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
}

.contact-item i {
  width: 20px;
  margin-right: 0.75rem;
  color: var(--accent-orange);
}

.footer-divider {
  border-color: rgba(255, 255, 255, 0.2);
  margin: 2rem 0 1rem;
}

.footer-copyright {
  opacity: 0.6;
  margin: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1.1rem;
  }

  .hero-stats {
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: center;
  }

  .section-title {
    font-size: 2rem;
  }

  .cta-title {
    font-size: 2rem;
  }

  .hero-actions {
    justify-content: center;
  }

  .cta-actions {
    flex-direction: column;
    align-items: center;
  }
}

@media (max-width: 576px) {
  .hero-title {
    font-size: 2rem;
  }

  .pricing-number {
    font-size: 3rem;
  }

  .stat-number {
    font-size: 1.5rem;
  }
}
</style>
