<template>
  <div class="about-page">
    <!-- Navbar -->
    <Navbar />

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container">
        <div class="row align-items-center min-vh-75">
          <div class="col-lg-6">
            <h1 class="hero-title">{{ $t('about.title') }}</h1>
            <p class="hero-subtitle">
              {{ $t('about.subtitle') }}
            </p>
          </div>
          <div class="col-lg-6">
            <div class="hero-image">
              <div class="placeholder-image">
                <i class="bi bi-people-fill"></i>
                <p>團隊照片區域</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Mission Section -->
    <section class="mission-section">
      <div class="container">
        <div class="row">
          <div class="col-12 text-center mb-5">
            <h2 class="section-title">{{ $t('about.mission.title') }}</h2>
            <p class="section-subtitle">{{ $t('about.mission.subtitle') }}</p>
          </div>
        </div>
        <div class="row g-4">
          <div class="col-md-4">
            <div class="mission-card">
              <div class="mission-icon">
                <i class="bi bi-lightbulb"></i>
              </div>
              <h4>{{ $t('about.mission.innovation.title') }}</h4>
              <p>{{ $t('about.mission.innovation.description') }}</p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="mission-card">
              <div class="mission-icon">
                <i class="bi bi-heart"></i>
              </div>
              <h4>{{ $t('about.mission.service.title') }}</h4>
              <p>{{ $t('about.mission.service.description') }}</p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="mission-card">
              <div class="mission-icon">
                <i class="bi bi-graph-up"></i>
              </div>
              <h4>{{ $t('about.mission.growth.title') }}</h4>
              <p>{{ $t('about.mission.growth.description') }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Values Section -->
    <section class="values-section">
      <div class="container">
        <div class="row">
          <div class="col-12 text-center mb-5">
            <h2 class="section-title">{{ $t('about.values.title') }}</h2>
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-lg-6">
            <div class="values-content">
              <div class="value-item">
                <h5>{{ $t('about.values.professional.title') }}</h5>
                <p>{{ $t('about.values.professional.description') }}</p>
              </div>
              <div class="value-item">
                <h5>{{ $t('about.values.integrity.title') }}</h5>
                <p>{{ $t('about.values.integrity.description') }}</p>
              </div>
              <div class="value-item">
                <h5>{{ $t('about.values.innovation.title') }}</h5>
                <p>{{ $t('about.values.innovation.description') }}</p>
              </div>
            </div>
          </div>
          <div class="col-lg-6">
            <div class="values-image">
              <div class="placeholder-image">
                <i class="bi bi-award"></i>
                <p>核心價值圖片區域</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Service Promise Section -->
    <section class="service-promise-section">
      <div class="container">
        <div class="row">
          <div class="col-12 text-center mb-5">
            <h2 class="section-title">{{ $t('about.servicePromise.title') }}</h2>
            <p class="section-subtitle">{{ $t('about.servicePromise.subtitle') }}</p>
          </div>
        </div>
        <div class="row g-4">
          <div class="col-md-4">
            <div class="promise-card">
              <div class="promise-icon">
                <i class="bi bi-lightning-charge"></i>
              </div>
              <h5>{{ $t('about.servicePromise.fastResponse.title') }}</h5>
              <p class="promise-desc">{{ $t('about.servicePromise.fastResponse.description') }}</p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="promise-card">
              <div class="promise-icon">
                <i class="bi bi-star"></i>
              </div>
              <h5>{{ $t('about.servicePromise.customized.title') }}</h5>
              <p class="promise-desc">{{ $t('about.servicePromise.customized.description') }}</p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="promise-card">
              <div class="promise-icon">
                <i class="bi bi-shield-check"></i>
              </div>
              <h5>{{ $t('about.servicePromise.quality.title') }}</h5>
              <p class="promise-desc">{{ $t('about.servicePromise.quality.description') }}</p>
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
            <h2 class="cta-title">{{ $t('about.cta.title') }}</h2>
            <p class="cta-subtitle">{{ $t('about.cta.subtitle') }}</p>
            <div class="cta-actions">
              <router-link to="/contact" class="btn btn-cta btn-lg me-3">
                <i class="bi bi-telephone me-2"></i>
                {{ $t('common.contact') }}
              </router-link>
              <!-- <router-link to="/demo" class="btn btn-outline-light btn-lg">
                <i class="bi bi-play-circle me-2"></i>
                {{ $t('common.bookDemo') }}
              </router-link> -->
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import Navbar from '@/components/landing/Navbar.vue'
import { useLanguage } from '@/composables/useLanguage'

const { initializeLanguage } = useLanguage()

onMounted(() => {
  initializeLanguage()
  document.title = '關於我們 - 智慧餐飲管理系統'
})
</script>

<style scoped>
/* 在組件根元素上定義 CSS 變數 */
.about-page {
  --primary-blue: #0f4c81;
  --accent-yellow: #f4d35e;
  --accent-orange: #ee964b;
  --cta-red: #f95738;
  --text-blue: #0d3b66;
  --light-bg: #f8f9fa;
  --white: #ffffff;

  color: var(--text-blue);
}

.section-title {
  color: var(--primary-blue);
  font-weight: 700;
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.section-subtitle {
  color: var(--text-blue);
  font-size: 1.25rem;
  opacity: 0.8;
  margin-bottom: 3rem;
}

.btn-cta {
  background-color: var(--cta-red);
  border-color: var(--cta-red);
  color: var(--white);
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-cta:hover {
  background-color: #e04527;
  border-color: #e04527;
  transform: translateY(-2px);
}

/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, var(--primary-blue) 0%, #1a5b8c 100%);
  color: var(--white);
  padding: 5rem 0;
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
}

.hero-subtitle {
  font-size: 1.3rem;
  opacity: 0.9;
}

.placeholder-image {
  background: rgba(255, 255, 255, 0.1);
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
}

.placeholder-image i {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: block;
}

/* Mission Section */
.mission-section {
  padding: 5rem 0;
  background: var(--light-bg);
}

.mission-card {
  text-align: center;
  padding: 2rem;
  background: var(--white);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  height: 100%;
  transition: transform 0.3s ease;
}

.mission-card:hover {
  transform: translateY(-5px);
}

.mission-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, var(--accent-yellow), var(--accent-orange));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.mission-icon i {
  font-size: 1.5rem;
  color: var(--white);
}

.mission-card h4 {
  color: var(--primary-blue);
  font-weight: 700;
  margin-bottom: 1rem;
}

/* Values Section */
.values-section {
  padding: 5rem 0;
  background: var(--white);
}

.values-content {
  padding: 2rem 0;
}

.value-item {
  margin-bottom: 2rem;
}

.value-item h5 {
  color: var(--primary-blue);
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.values-image .placeholder-image {
  background: var(--light-bg);
  border-color: #dee2e6;
  color: var(--text-blue);
  opacity: 0.7;
}

/* Service Promise Section */
.service-promise-section {
  padding: 5rem 0;
  background: var(--light-bg);
}

.promise-card {
  text-align: center;
  padding: 2rem;
  background: var(--white);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  height: 100%;
  transition: transform 0.3s ease;
}

.promise-card:hover {
  transform: translateY(-5px);
}

.promise-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, var(--accent-yellow), var(--accent-orange));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.promise-icon i {
  font-size: 1.5rem;
  color: var(--white);
}

.promise-card h5 {
  color: var(--primary-blue);
  font-weight: 700;
  margin-bottom: 1rem;
}

.promise-desc {
  color: var(--text-blue);
  opacity: 0.8;
}

/* CTA Section */
.cta-section {
  padding: 5rem 0;
  background: linear-gradient(135deg, var(--primary-blue) 0%, #1a5b8c 100%);
  color: var(--white);
  text-align: center;
}

.cta-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--white);
}

.cta-subtitle {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.cta-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .cta-title {
    font-size: 2rem;
  }

  .cta-actions {
    flex-direction: column;
    align-items: center;
  }
}
</style>
