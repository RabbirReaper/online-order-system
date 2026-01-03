<template>
  <div class="contact-page">
    <!-- Navbar -->
    <Navbar />

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container">
        <div class="row align-items-center min-vh-75">
          <div class="col-12 text-center">
            <h1 class="hero-title">{{ $t('contact.title') }}</h1>
            <p class="hero-subtitle">
              {{ $t('contact.subtitle') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Form Section -->
    <section class="contact-form-section">
      <div class="container">
        <div class="row">
          <div class="col-12 text-center mb-5">
            <h2 class="section-title">{{ $t('contact.form.title') }}</h2>
            <p class="section-subtitle">{{ $t('contact.form.subtitle') }}</p>
          </div>
        </div>
        <div class="row justify-content-center">
          <div class="col-lg-8">
            <div class="form-container">
              <!-- Google 表單嵌入區域 -->
              <div class="google-form-placeholder">
                <div class="form-header">
                  <i class="bi bi-clipboard-check"></i>
                  <h4>{{ $t('contact.form.header') }}</h4>
                  <p>{{ $t('contact.form.instruction') }}</p>
                </div>

                <!-- 這裡可以嵌入 Google 表單的 iframe -->
                <div class="form-embed-area">
                  <p class="embed-instruction">
                    <i class="bi bi-info-circle me-2"></i>
                    {{ $t('contact.form.embedNote') }}
                  </p>
                  <code class="embed-code">
                    &lt;iframe
                    src="https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform?embedded=true"
                    width="100%" height="600" frameborder="0"&gt;&lt;/iframe&gt;
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="faq-section">
      <div class="container">
        <div class="row">
          <div class="col-12 text-center mb-5">
            <h2 class="section-title">{{ $t('contact.faq.title') }}</h2>
            <p class="section-subtitle">{{ $t('contact.faq.subtitle') }}</p>
          </div>
        </div>
        <div class="row justify-content-center">
          <div class="col-lg-8">
            <!-- 修正：確保正確的 Bootstrap Accordion 結構 -->
            <div class="accordion accordion-flush" id="faqAccordion">
              <div class="accordion-item">
                <h2 class="accordion-header" id="faq1">
                  <button
                    class="accordion-button"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapse1"
                    aria-expanded="true"
                    aria-controls="collapse1"
                  >
                    {{ $t('contact.faq.q1') }}
                  </button>
                </h2>
                <div
                  id="collapse1"
                  class="accordion-collapse collapse show"
                  aria-labelledby="faq1"
                  data-bs-parent="#faqAccordion"
                >
                  <div class="accordion-body">
                    {{ $t('contact.faq.a1') }}
                  </div>
                </div>
              </div>

              <div class="accordion-item">
                <h2 class="accordion-header" id="faq2">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapse2"
                    aria-expanded="false"
                    aria-controls="collapse2"
                  >
                    {{ $t('contact.faq.q2') }}
                  </button>
                </h2>
                <div
                  id="collapse2"
                  class="accordion-collapse collapse"
                  aria-labelledby="faq2"
                  data-bs-parent="#faqAccordion"
                >
                  <div class="accordion-body">
                    {{ $t('contact.faq.a2') }}
                  </div>
                </div>
              </div>

              <div class="accordion-item">
                <h2 class="accordion-header" id="faq3">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapse3"
                    aria-expanded="false"
                    aria-controls="collapse3"
                  >
                    {{ $t('contact.faq.q3') }}
                  </button>
                </h2>
                <div
                  id="collapse3"
                  class="accordion-collapse collapse"
                  aria-labelledby="faq3"
                  data-bs-parent="#faqAccordion"
                >
                  <div class="accordion-body">
                    {{ $t('contact.faq.a3') }}
                  </div>
                </div>
              </div>

              <div class="accordion-item">
                <h2 class="accordion-header" id="faq4">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapse4"
                    aria-expanded="false"
                    aria-controls="collapse4"
                  >
                    {{ $t('contact.faq.q4') }}
                  </button>
                </h2>
                <div
                  id="collapse4"
                  class="accordion-collapse collapse"
                  aria-labelledby="faq4"
                  data-bs-parent="#faqAccordion"
                >
                  <div class="accordion-body">
                    {{ $t('contact.faq.a4') }}
                  </div>
                </div>
              </div>

              <div class="accordion-item">
                <h2 class="accordion-header" id="faq5">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapse5"
                    aria-expanded="false"
                    aria-controls="collapse5"
                  >
                    {{ $t('contact.faq.q5') }}
                  </button>
                </h2>
                <div
                  id="collapse5"
                  class="accordion-collapse collapse"
                  aria-labelledby="faq5"
                  data-bs-parent="#faqAccordion"
                >
                  <div class="accordion-body">
                    {{ $t('contact.faq.a5') }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Support Section -->
    <section class="support-section">
      <div class="container">
        <div class="row">
          <div class="col-12 text-center mb-5">
            <h2 class="section-title">{{ $t('contact.support.title') }}</h2>
            <p class="section-subtitle">{{ $t('contact.support.subtitle') }}</p>
          </div>
        </div>
        <div class="row g-4">
          <div class="col-md-6 col-lg-3">
            <div class="support-card">
              <div class="support-icon">
                <i class="bi bi-headset"></i>
              </div>
              <h5>{{ $t('contact.support.manager.title') }}</h5>
              <p>{{ $t('contact.support.manager.description') }}</p>
            </div>
          </div>
          <div class="col-md-6 col-lg-3">
            <div class="support-card">
              <div class="support-icon">
                <i class="bi bi-chat-dots"></i>
              </div>
              <h5>{{ $t('contact.support.chat.title') }}</h5>
              <p>{{ $t('contact.support.chat.description') }}</p>
            </div>
          </div>
          <div class="col-md-6 col-lg-3">
            <div class="support-card">
              <div class="support-icon">
                <i class="bi bi-tools"></i>
              </div>
              <h5>{{ $t('contact.support.remote.title') }}</h5>
              <p>{{ $t('contact.support.remote.description') }}</p>
            </div>
          </div>
          <div class="col-md-6 col-lg-3">
            <div class="support-card">
              <div class="support-icon">
                <i class="bi bi-book"></i>
              </div>
              <h5>{{ $t('contact.support.resources.title') }}</h5>
              <p>{{ $t('contact.support.resources.description') }}</p>
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
            <h2 class="cta-title">{{ $t('contact.cta.title') }}</h2>
            <p class="cta-subtitle">
              {{ $t('contact.cta.subtitle') }}
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, nextTick } from 'vue'
import Navbar from '@/components/landing/Navbar.vue'
import { useLanguage } from '@/composables/useLanguage'

const { initializeLanguage } = useLanguage()

onMounted(async () => {
  initializeLanguage()
  document.title = '聯絡我們 - 光速點餐'

  // 確保 Bootstrap JavaScript 已載入並初始化
  await nextTick()

  // 檢查 Bootstrap 是否已載入
  if (typeof window.bootstrap === 'undefined') {
    console.warn('Bootstrap JavaScript 尚未載入，accordion 功能可能無法正常運作')

    // 如果需要，可以動態載入 Bootstrap
    loadBootstrapJS()
  } else {
    // 手動初始化 accordion（可選）
    initializeAccordion()
  }
})

// 動態載入 Bootstrap JavaScript
const loadBootstrapJS = () => {
  const script = document.createElement('script')
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js'
  script.onload = () => {
    initializeAccordion()
  }
  document.head.appendChild(script)
}

// 初始化 accordion
const initializeAccordion = () => {
  // 確保所有 accordion 元素都已正確初始化
  const accordionElements = document.querySelectorAll('.accordion')
  accordionElements.forEach((element) => {
    if (window.bootstrap && window.bootstrap.Collapse) {
      // Bootstrap 已載入，accordion 應該自動工作
    }
  })
}
</script>

<style scoped>
/* 在組件根元素上定義 CSS 變數 */
.contact-page {
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
  opacity: 0.8;
  margin-bottom: 3rem;
}

.btn-cta {
  background-color: var(--accent-orange);
  border-color: var(--accent-orange);
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
  background: var(--bg-light);
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

/* Contact Info Section */
.contact-info-section {
  padding: 5rem 0;
  background: var(--light-bg);
}

.contact-card {
  background: var(--white);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  text-align: center;
  height: 100%;
  transition: transform 0.3s ease;
}

.contact-card:hover {
  transform: translateY(-5px);
}

.contact-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, var(--accent-yellow), var(--accent-orange));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.contact-icon i {
  font-size: 1.5rem;
  color: var(--white);
}

.contact-card h4 {
  color: var(--text-dark);
  font-weight: 700;
  margin-bottom: 1rem;
}

.contact-detail {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-medium);
  margin-bottom: 0.5rem;
}

.contact-note {
  color: var(--text-medium);
  opacity: 0.7;
  font-size: 0.9rem;
}

/* Contact Form Section */
.contact-form-section {
  padding: 5rem 0;
  background: var(--white);
}

.form-container {
  background: var(--light-bg);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.google-form-placeholder {
  min-height: 400px;
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.form-header i {
  font-size: 3rem;
  color: var(--text-dark);
  margin-bottom: 1rem;
  display: block;
}

.form-header h4 {
  color: var(--text-dark);
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.form-embed-area {
  background: var(--white);
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
}

.embed-instruction {
  color: var(--text-medium);
  opacity: 0.8;
  margin-bottom: 1rem;
}

.embed-code {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 1rem;
  font-size: 0.8rem;
  color: #6c757d;
  display: block;
  white-space: pre-wrap;
  word-break: break-all;
}

.alternative-contact h6 {
  color: var(--text-dark);
  font-weight: 600;
  margin-bottom: 1rem;
}

.contact-methods {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
}

.contact-method {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background: var(--primary-blue);
  color: var(--white);
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: 600;
}

.contact-method:hover {
  background: #1a5b8c;
  color: var(--white);
  transform: translateY(-2px);
}

.contact-method i {
  margin-right: 0.75rem;
}

/* FAQ Section */
.faq-section {
  padding: 5rem 0;
  background: var(--light-bg);
}

/* 修正：確保 accordion 樣式不會干擾 Bootstrap 功能 */
.accordion-item {
  border: none !important;
  margin-bottom: 1rem;
  border-radius: 8px !important;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.accordion-button {
  background: var(--white) !important;
  border: none !important;
  font-weight: 600;
  color: var(--text-dark) !important;
  padding: 1.5rem !important;
  border-radius: 8px !important;
  /* 重要：不要覆蓋 Bootstrap 的基本功能 */
}

.accordion-button:not(.collapsed) {
  background: var(--primary-blue) !important;
  color: var(--white) !important;
  box-shadow: none !important;
}

.accordion-button:focus {
  border-color: transparent !important;
  box-shadow: 0 4px 12px rgba(15, 76, 129, 0.2) !important;
}

.accordion-button::after {
  /* 確保箭頭圖示正常顯示 */
  filter: brightness(0) invert(1);
}

.accordion-button:not(.collapsed)::after {
  filter: brightness(0) invert(1);
}

.accordion-body {
  background: var(--white);
  padding: 1.5rem !important;
  border-top: 1px solid rgba(15, 76, 129, 0.1);
}

.accordion-collapse {
  /* 確保 Bootstrap 的 collapse 功能正常 */
  border: none !important;
}

/* Support Section */
.support-section {
  padding: 5rem 0;
  background: var(--white);
}

.support-card {
  text-align: center;
  padding: 2rem 1rem;
  height: 100%;
}

.support-icon {
  width: 50px;
  height: 50px;
  background: var(--primary-blue);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.support-icon i {
  font-size: 1.25rem;
  color: var(--white);
}

.support-card h5 {
  color: var(--text-dark);
  font-weight: 700;
  margin-bottom: 1rem;
}

/* CTA Section */
.cta-section {
  padding: 5rem 0;
  background: var(--bg-light);
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

  .contact-methods {
    align-items: stretch;
  }

  .form-container {
    padding: 1.5rem;
  }
}
</style>
