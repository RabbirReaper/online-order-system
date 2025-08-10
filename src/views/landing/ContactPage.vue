<template>
  <div class="contact-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container">
        <div class="row align-items-center min-vh-75">
          <div class="col-12 text-center">
            <h1 class="hero-title">聯絡我們</h1>
            <p class="hero-subtitle">
              專業團隊隨時為您服務，立即聯絡我們獲得個人化的餐飲管理解決方案
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
            <h2 class="section-title">留下您的需求</h2>
            <p class="section-subtitle">我們將在24小時內與您聯絡，提供專業的解決方案建議</p>
          </div>
        </div>
        <div class="row justify-content-center">
          <div class="col-lg-8">
            <div class="form-container">
              <!-- Google 表單嵌入區域 -->
              <div class="google-form-placeholder">
                <div class="form-header">
                  <i class="bi bi-clipboard-check"></i>
                  <h4>諮詢表單</h4>
                  <p>請填寫以下資訊，我們將盡快與您聯絡</p>
                </div>

                <!-- 這裡可以嵌入 Google 表單的 iframe -->
                <div class="form-embed-area">
                  <p class="embed-instruction">
                    <i class="bi bi-info-circle me-2"></i>
                    此區域可嵌入 Google 表單或其他線上表單服務
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
            <h2 class="section-title">常見問題</h2>
            <p class="section-subtitle">快速找到您關心的問題答案</p>
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
                    系統收費方式如何計算？
                  </button>
                </h2>
                <div
                  id="collapse1"
                  class="accordion-collapse collapse show"
                  aria-labelledby="faq1"
                  data-bs-parent="#faqAccordion"
                >
                  <div class="accordion-body">
                    我們採用營業額分潤制，僅收取 0.3% 的營業額作為服務費用，無其他隱藏費用。
                    包含完整系統功能、不限店鋪數量、24/7 技術支援等所有服務。
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
                    系統支援多少家分店？
                  </button>
                </h2>
                <div
                  id="collapse2"
                  class="accordion-collapse collapse"
                  aria-labelledby="faq2"
                  data-bs-parent="#faqAccordion"
                >
                  <div class="accordion-body">
                    系統支援無限制的分店數量，從單店到數百家連鎖店皆可使用。
                    每家分店都可以獨立管理，同時總部可以統一掌控所有數據。
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
                    導入系統需要多長時間？
                  </button>
                </h2>
                <div
                  id="collapse3"
                  class="accordion-collapse collapse"
                  aria-labelledby="faq3"
                  data-bs-parent="#faqAccordion"
                >
                  <div class="accordion-body">
                    一般情況下，單店導入約需 1-2 週，包含系統設定、資料匯入、員工教育訓練等。
                    多店導入時間視店鋪數量而定，我們會提供詳細的導入時程規劃。
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
                    是否提供教育訓練？
                  </button>
                </h2>
                <div
                  id="collapse4"
                  class="accordion-collapse collapse"
                  aria-labelledby="faq4"
                  data-bs-parent="#faqAccordion"
                >
                  <div class="accordion-body">
                    是的，我們提供完整的教育訓練服務，包含現場教學、線上教學影片、
                    操作手冊等。確保您的員工能夠熟練使用系統的所有功能。
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
                    資料安全如何保障？
                  </button>
                </h2>
                <div
                  id="collapse5"
                  class="accordion-collapse collapse"
                  aria-labelledby="faq5"
                  data-bs-parent="#faqAccordion"
                >
                  <div class="accordion-body">
                    我們採用企業級資安標準，包含 SSL 加密傳輸、定期資料備份、
                    多重身份驗證等機制，確保您的營業資料安全無虞。
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
            <h2 class="section-title">技術支援</h2>
            <p class="section-subtitle">多種管道提供協助，確保您的系統順暢運行</p>
          </div>
        </div>
        <div class="row g-4">
          <div class="col-md-6 col-lg-3">
            <div class="support-card">
              <div class="support-icon">
                <i class="bi bi-headset"></i>
              </div>
              <h5>專屬客戶經理</h5>
              <p>專屬服務，深度了解營運需求。</p>
            </div>
          </div>
          <div class="col-md-6 col-lg-3">
            <div class="support-card">
              <div class="support-icon">
                <i class="bi bi-chat-dots"></i>
              </div>
              <h5>線上客服</h5>
              <p>即時通訊系統，快速回應您的疑問。</p>
            </div>
          </div>
          <div class="col-md-6 col-lg-3">
            <div class="support-card">
              <div class="support-icon">
                <i class="bi bi-tools"></i>
              </div>
              <h5>遠端協助</h5>
              <p>技術人員遠端協助，直接解決操作問題。</p>
            </div>
          </div>
          <div class="col-md-6 col-lg-3">
            <div class="support-card">
              <div class="support-icon">
                <i class="bi bi-book"></i>
              </div>
              <h5>教學資源</h5>
              <p>完整的操作手冊與教學影片資源。</p>
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
            <h2 class="cta-title">立即開始您的數位轉型</h2>
            <p class="cta-subtitle">
              填寫表單或直接聯絡我們，專業顧問將為您量身打造最適合的解決方案
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, nextTick } from 'vue'

onMounted(async () => {
  document.title = '聯絡我們 - 智慧餐飲管理系統'

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
    console.log('Bootstrap JavaScript 載入完成')
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
      console.log('Bootstrap Accordion 已初始化')
    }
  })
}
</script>

<style scoped>
/* 在組件根元素上定義 CSS 變數 */
.contact-page {
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
  color: var(--primary-blue);
  font-weight: 700;
  margin-bottom: 1rem;
}

.contact-detail {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-blue);
  margin-bottom: 0.5rem;
}

.contact-note {
  color: var(--text-blue);
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
  color: var(--primary-blue);
  margin-bottom: 1rem;
  display: block;
}

.form-header h4 {
  color: var(--primary-blue);
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
  color: var(--text-blue);
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
  color: var(--primary-blue);
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
  color: var(--primary-blue) !important;
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
  color: var(--primary-blue);
  font-weight: 700;
  margin-bottom: 1rem;
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

  .contact-methods {
    align-items: stretch;
  }

  .form-container {
    padding: 1.5rem;
  }
}
</style>
