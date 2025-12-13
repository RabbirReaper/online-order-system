<template>
  <div class="pricing-page">
    <!-- Navbar -->
    <Navbar />

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container">
        <div class="row align-items-center min-vh-75">
          <div class="col-12 text-center">
            <h1 class="hero-title">{{ $t('pricing.title') }}</h1>
            <p class="hero-subtitle">{{ $t('pricing.subtitle') }}</p>
            <div class="hero-highlight">
              <div class="highlight-card">
                <span class="highlight-number">0.3%</span>
                <span class="highlight-text">{{ $t('home.stats.feeLabel') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Pricing Section -->
    <section class="main-pricing-section">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-lg-10">
            <div class="pricing-card-main">
              <div class="pricing-badge">{{ $t('pricing.plan.badge') }}</div>
              <div class="pricing-header">
                <h2>{{ $t('pricing.plan.title') }}</h2>
                <div class="pricing-value">
                  <span class="pricing-number">0.3</span>
                  <span class="pricing-unit">%</span>
                </div>
                <p class="pricing-description">{{ $t('pricing.plan.description') }}</p>
              </div>

              <div class="pricing-content">
                <div class="row">
                  <div class="col-lg-6">
                    <div class="features-included">
                      <h4>{{ $t('pricing.plan.features.title') }}</h4>
                      <ul class="pricing-features">
                        <li>
                          <i class="bi bi-check-circle-fill"></i>
                          <div>
                            <strong>{{ $t('pricing.plan.features.customer') }}</strong>
                            <span>{{ $t('pricing.plan.features.customerDesc') }}</span>
                          </div>
                        </li>
                        <li>
                          <i class="bi bi-check-circle-fill"></i>
                          <div>
                            <strong>{{ $t('pricing.plan.features.management') }}</strong>
                            <span>{{ $t('pricing.plan.features.managementDesc') }}</span>
                          </div>
                        </li>
                        <li>
                          <i class="bi bi-check-circle-fill"></i>
                          <div>
                            <strong>{{ $t('pricing.plan.features.pos') }}</strong>
                            <span>{{ $t('pricing.plan.features.posDesc') }}</span>
                          </div>
                        </li>
                        <li>
                          <i class="bi bi-check-circle-fill"></i>
                          <div>
                            <strong>{{ $t('pricing.plan.features.membership') }}</strong>
                            <span>{{ $t('pricing.plan.features.membershipDesc') }}</span>
                          </div>
                        </li>
                        <li>
                          <i class="bi bi-check-circle-fill"></i>
                          <div>
                            <strong>{{ $t('pricing.plan.features.voucher') }}</strong>
                            <span>{{ $t('pricing.plan.features.voucherDesc') }}</span>
                          </div>
                        </li>
                        <li>
                          <i class="bi bi-check-circle-fill"></i>
                          <div>
                            <strong>{{ $t('pricing.plan.features.multilevel') }}</strong>
                            <span>{{ $t('pricing.plan.features.multilevelDesc') }}</span>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div class="col-lg-6">
                    <div class="service-included">
                      <h4>{{ $t('pricing.plan.services.title') }}</h4>
                      <ul class="pricing-features">
                        <li>
                          <i class="bi bi-check-circle-fill"></i>
                          <div>
                            <strong>{{ $t('pricing.plan.services.manager') }}</strong>
                            <span>{{ $t('pricing.plan.services.managerDesc') }}</span>
                          </div>
                        </li>
                        <li>
                          <i class="bi bi-check-circle-fill"></i>
                          <div>
                            <strong>{{ $t('pricing.plan.services.updates') }}</strong>
                            <span>{{ $t('pricing.plan.services.updatesDesc') }}</span>
                          </div>
                        </li>
                        <li>
                          <i class="bi bi-check-circle-fill"></i>
                          <div>
                            <strong>{{ $t('pricing.plan.services.training') }}</strong>
                            <span>{{ $t('pricing.plan.services.trainingDesc') }}</span>
                          </div>
                        </li>
                        <li>
                          <i class="bi bi-check-circle-fill"></i>
                          <div>
                            <strong>{{ $t('pricing.plan.services.backup') }}</strong>
                            <span>{{ $t('pricing.plan.services.backupDesc') }}</span>
                          </div>
                        </li>
                        <li>
                          <i class="bi bi-check-circle-fill"></i>
                          <div>
                            <strong>{{ $t('pricing.plan.services.setup') }}</strong>
                            <span>{{ $t('pricing.plan.services.setupDesc') }}</span>
                          </div>
                        </li>
                        <li>
                          <i class="bi bi-check-circle-fill"></i>
                          <div>
                            <strong>{{ $t('pricing.plan.services.customization') }}</strong>
                            <span>{{ $t('pricing.plan.services.customizationDesc') }}</span>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div class="pricing-cta">
                <router-link to="/contact" class="btn btn-cta btn-lg w-100 mb-3">
                  <i class="bi bi-telephone me-2"></i>
                  {{ $t('pricing.plan.cta') }}
                </router-link>
                <p class="pricing-note">
                  <i class="bi bi-shield-check me-1"></i>
                  {{ $t('pricing.plan.note') }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Benefits Section -->
    <section class="benefits-section">
      <div class="container">
        <div class="row">
          <div class="col-12 text-center mb-5">
            <h2 class="section-title">{{ $t('pricing.benefits.title') }}</h2>
            <p class="section-subtitle">{{ $t('pricing.benefits.subtitle') }}</p>
          </div>
        </div>
        <div class="row g-4">
          <div class="col-md-6 col-lg-3">
            <div class="benefit-card">
              <div class="benefit-icon">
                <i class="bi bi-cash-coin"></i>
              </div>
              <h5>{{ $t('pricing.benefits.lowCost.title') }}</h5>
              <p>{{ $t('pricing.benefits.lowCost.description') }}</p>
            </div>
          </div>
          <div class="col-md-6 col-lg-3">
            <div class="benefit-card">
              <div class="benefit-icon">
                <i class="bi bi-graph-up-arrow"></i>
              </div>
              <h5>{{ $t('pricing.benefits.sharedRisk.title') }}</h5>
              <p>{{ $t('pricing.benefits.sharedRisk.description') }}</p>
            </div>
          </div>
          <div class="col-md-6 col-lg-3">
            <div class="benefit-card">
              <div class="benefit-icon">
                <i class="bi bi-speedometer2"></i>
              </div>
              <h5>{{ $t('pricing.benefits.optimization.title') }}</h5>
              <p>{{ $t('pricing.benefits.optimization.description') }}</p>
            </div>
          </div>
          <div class="col-md-6 col-lg-3">
            <div class="benefit-card">
              <div class="benefit-icon">
                <i class="bi bi-shield-check"></i>
              </div>
              <h5>{{ $t('pricing.benefits.transparency.title') }}</h5>
              <p>{{ $t('pricing.benefits.transparency.description') }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Cost Calculator Section -->
    <section class="calculator-section">
      <div class="container">
        <div class="row">
          <div class="col-12 text-center mb-5">
            <h2 class="section-title">{{ $t('pricing.calculator.title') }}</h2>
            <p class="section-subtitle">{{ $t('pricing.calculator.subtitle') }}</p>
          </div>
        </div>
        <div class="row justify-content-center">
          <div class="col-lg-6">
            <div class="calculator-card">
              <div class="calculator-input">
                <label for="revenue">{{ $t('pricing.calculator.label') }}</label>
                <div class="input-group">
                  <span class="input-group-text">$</span>
                  <input
                    type="number"
                    class="form-control"
                    id="revenue"
                    v-model="monthlyRevenue"
                    :placeholder="$t('pricing.calculator.placeholder')"
                    @input="calculateFee"
                  />
                </div>
              </div>

              <div class="calculator-result" v-if="calculatedFee">
                <div class="result-row">
                  <span class="result-label">{{ $t('pricing.calculator.monthlyRevenue') }}</span>
                  <span class="result-value">${{ formatNumber(monthlyRevenue) }}</span>
                </div>
                <div class="result-row highlight">
                  <span class="result-label">{{ $t('pricing.calculator.systemFee') }}</span>
                  <span class="result-value">${{ formatNumber(calculatedFee) }}</span>
                </div>
                <div class="result-row">
                  <span class="result-label">{{ $t('pricing.calculator.netIncome') }}</span>
                  <span class="result-value"
                    >${{ formatNumber(monthlyRevenue - calculatedFee) }}</span
                  >
                </div>
              </div>

              <div class="calculator-example">
                <h6>{{ $t('pricing.calculator.examples') }}</h6>
                <div class="example-item" @click="setRevenue(100000)">
                  <span>月營業額 $100,000</span>
                  <span class="example-fee">→ 系統費用 $300</span>
                </div>
                <div class="example-item" @click="setRevenue(500000)">
                  <span>月營業額 $500,000</span>
                  <span class="example-fee">→ 系統費用 $1,500</span>
                </div>
                <div class="example-item" @click="setRevenue(1000000)">
                  <span>月營業額 $1,000,000</span>
                  <span class="example-fee">→ 系統費用 $3,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Comparison Section -->
    <section class="comparison-section">
      <div class="container">
        <div class="row">
          <div class="col-12 text-center mb-5">
            <h2 class="section-title">{{ $t('pricing.comparison.title') }}</h2>
            <p class="section-subtitle">{{ $t('pricing.comparison.subtitle') }}</p>
          </div>
        </div>
        <div class="row justify-content-center">
          <div class="col-lg-10">
            <div class="comparison-table">
              <div class="table-responsive">
                <table class="table">
                  <thead>
                    <tr>
                      <th>比較項目</th>
                      <th class="our-solution">{{ $t('pricing.comparison.ourSolution') }}</th>
                      <th>{{ $t('pricing.comparison.traditional') }}</th>
                      <th>{{ $t('pricing.comparison.cloud') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong>{{ $t('pricing.comparison.initialCost') }}</strong>
                      </td>
                      <td class="our-solution">
                        <i class="bi bi-check-circle text-success me-2"></i>
                        $0 設定費
                      </td>
                      <td>
                        <i class="bi bi-x-circle text-danger me-2"></i>
                        $30,000-$60,000
                      </td>
                      <td>
                        <i class="bi bi-x-circle text-danger me-2"></i>
                        初期費用低，硬體如平板需額外購買
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>{{ $t('pricing.comparison.monthlyFee') }}</strong>
                      </td>
                      <td class="our-solution">
                        <i class="bi bi-check-circle text-success me-2"></i>
                        $0 固定月費
                      </td>
                      <td>
                        <i class="bi bi-x-circle text-danger me-2"></i>
                        無月租，後續維護需額外付費
                      </td>
                      <td>
                        <i class="bi bi-x-circle text-danger me-2"></i>
                        月租約 $500 - $4,000 新台幣（視功能方案而異）
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>{{ $t('pricing.comparison.updates') }}</strong>
                      </td>
                      <td class="our-solution">
                        <i class="bi bi-check-circle text-success me-2"></i>
                        免費自動更新
                      </td>
                      <td>
                        <i class="bi bi-x-circle text-danger me-2"></i>
                        升級多需額外付費，且需原廠技術人員現場維護
                      </td>
                      <td>
                        <i class="bi bi-dash-circle text-warning me-2"></i>
                        多為系統自動並免費更新，但高級功能有時需付費
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>{{ $t('pricing.comparison.support') }}</strong>
                      </td>
                      <td class="our-solution">
                        <i class="bi bi-check-circle text-success me-2"></i>
                        24/7 免費支援
                      </td>
                      <td>
                        <i class="bi bi-x-circle text-danger me-2"></i>
                        支援有限，且多為額外付費
                      </td>
                      <td>
                        <i class="bi bi-dash-circle text-warning me-2"></i>
                        工作時間支援
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>{{ $t('pricing.comparison.risk') }}</strong>
                      </td>
                      <td class="our-solution">
                        <i class="bi bi-check-circle text-success me-2"></i>
                        與您共同承擔
                      </td>
                      <td>
                        <i class="bi bi-x-circle text-danger me-2"></i>
                        客戶自行承擔
                      </td>
                      <td>
                        <i class="bi bi-x-circle text-danger me-2"></i>
                        客戶自行承擔
                      </td>
                    </tr>
                  </tbody>
                </table>
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
            <h2 class="section-title">{{ $t('pricing.faq.title') }}</h2>
            <p class="section-subtitle">{{ $t('pricing.faq.subtitle') }}</p>
          </div>
        </div>
        <div class="row justify-content-center">
          <div class="col-lg-8">
            <div class="accordion" id="pricingFaqAccordion">
              <div class="accordion-item">
                <h2 class="accordion-header" id="pricingFaq1">
                  <button
                    class="accordion-button"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#pricingCollapse1"
                  >
                    {{ $t('pricing.faq.q1') }}
                  </button>
                </h2>
                <div
                  id="pricingCollapse1"
                  class="accordion-collapse collapse show"
                  data-bs-parent="#pricingFaqAccordion"
                >
                  <div class="accordion-body">
                    {{ $t('pricing.faq.a1') }}
                  </div>
                </div>
              </div>

              <div class="accordion-item">
                <h2 class="accordion-header" id="pricingFaq2">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#pricingCollapse2"
                  >
                    {{ $t('pricing.faq.q2') }}
                  </button>
                </h2>
                <div
                  id="pricingCollapse2"
                  class="accordion-collapse collapse"
                  data-bs-parent="#pricingFaqAccordion"
                >
                  <div class="accordion-body">
                    {{ $t('pricing.faq.a2') }}
                  </div>
                </div>
              </div>

              <div class="accordion-item">
                <h2 class="accordion-header" id="pricingFaq3">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#pricingCollapse3"
                  >
                    {{ $t('pricing.faq.q3') }}
                  </button>
                </h2>
                <div
                  id="pricingCollapse3"
                  class="accordion-collapse collapse"
                  data-bs-parent="#pricingFaqAccordion"
                >
                  <div class="accordion-body">
                    {{ $t('pricing.faq.a3') }}
                  </div>
                </div>
              </div>

              <div class="accordion-item">
                <h2 class="accordion-header" id="pricingFaq4">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#pricingCollapse4"
                  >
                    {{ $t('pricing.faq.q4') }}
                  </button>
                </h2>
                <div
                  id="pricingCollapse4"
                  class="accordion-collapse collapse"
                  data-bs-parent="#pricingFaqAccordion"
                >
                  <div class="accordion-body">
                    {{ $t('pricing.faq.a4') }}
                  </div>
                </div>
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
            <h2 class="cta-title">{{ $t('pricing.cta.title') }}</h2>
            <p class="cta-subtitle">{{ $t('pricing.cta.subtitle') }}</p>
            <div class="cta-actions">
              <router-link to="/contact" class="btn btn-cta btn-lg me-3">
                <i class="bi bi-telephone me-2"></i>
                {{ $t('common.startTrial') }}
              </router-link>
            </div>
            <div class="cta-guarantees mt-4">
              <div class="guarantee-item">
                <i class="bi bi-shield-check"></i>
                <span>{{ $t('pricing.cta.guarantees.trial') }}</span>
              </div>
              <div class="guarantee-item">
                <i class="bi bi-credit-card"></i>
                <span>{{ $t('pricing.cta.guarantees.noCard') }}</span>
              </div>
              <div class="guarantee-item">
                <i class="bi bi-x-circle"></i>
                <span>{{ $t('pricing.cta.guarantees.cancel') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Navbar from '@/components/landing/Navbar.vue'
import { useLanguage } from '@/composables/useLanguage'

const { initializeLanguage } = useLanguage()

const monthlyRevenue = ref(100000)
const calculatedFee = computed(() => {
  if (monthlyRevenue.value && monthlyRevenue.value > 0) {
    return Math.round(monthlyRevenue.value * 0.003)
  }
  return 0
})

const formatNumber = (num) => {
  return new Intl.NumberFormat('zh-TW').format(num)
}

const calculateFee = () => {
  // 費用會自動透過 computed 計算
}

const setRevenue = (amount) => {
  monthlyRevenue.value = amount
}

onMounted(() => {
  initializeLanguage()
  document.title = '收費方案 - 光兔點餐'
})
</script>

<style scoped>
/* Color Variables */
.pricing-page {
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
  margin-bottom: 2rem;
}

.hero-highlight {
  margin-top: 2rem;
}

.highlight-card {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(244, 211, 94, 0.5);
  border-radius: 12px;
  padding: 1.5rem;
  display: inline-block;
  backdrop-filter: blur(10px);
}

.highlight-number {
  display: block;
  font-size: 3rem;
  font-weight: 800;
  color: var(--accent-orange);
}

.highlight-text {
  font-size: 1.1rem;
  opacity: 0.9;
}

/* Main Pricing Section */
.main-pricing-section {
  padding: 5rem 0;
  background: var(--light-bg);
}

.pricing-card-main {
  background: var(--white);
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
}

.pricing-badge {
  background: var(--accent-orange);
  color: var(--text-medium);
  padding: 0.75rem 2rem;
  position: absolute;
  top: 0;
  right: 3rem;
  font-size: 0.9rem;
  font-weight: 700;
  border-radius: 0 0 12px 12px;
  z-index: 2;
}

.pricing-header {
  background: linear-gradient(135deg, var(--primary-blue), #1a5b8c);
  color: var(--white);
  padding: 3rem 2rem 2rem;
  text-align: center;
}

.pricing-header h2 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.pricing-value {
  margin-bottom: 1.5rem;
}

.pricing-number {
  font-size: 5rem;
  font-weight: 800;
  color: var(--accent-orange);
}

.pricing-unit {
  font-size: 2.5rem;
  font-weight: 600;
}

.pricing-description {
  font-size: 1.2rem;
  opacity: 0.9;
}

.pricing-content {
  padding: 3rem 2rem;
}

.features-included h4,
.service-included h4 {
  color: var(--text-dark);
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.pricing-features {
  list-style: none;
  padding: 0;
}

.pricing-features li {
  display: flex;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: var(--light-bg);
  border-radius: 8px;
}

.pricing-features i {
  color: var(--accent-orange);
  margin-right: 1rem;
  font-size: 1.2rem;
  margin-top: 0.2rem;
  flex-shrink: 0;
}

.pricing-features div {
  flex: 1;
}

.pricing-features strong {
  display: block;
  color: var(--text-dark);
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.pricing-features span {
  color: var(--text-medium);
  opacity: 0.8;
  font-size: 0.9rem;
}

.pricing-cta {
  padding: 2rem;
  background: var(--light-bg);
  text-align: center;
}

.pricing-note {
  margin: 0;
  color: var(--text-medium);
  opacity: 0.8;
  font-size: 0.9rem;
}

/* Benefits Section */
.benefits-section {
  padding: 5rem 0;
  background: var(--white);
}

.benefit-card {
  text-align: center;
  padding: 2rem 1rem;
  height: 100%;
}

.benefit-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, var(--accent-yellow), var(--accent-orange));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.benefit-icon i {
  font-size: 1.5rem;
  color: var(--white);
}

.benefit-card h5 {
  color: var(--text-dark);
  font-weight: 700;
  margin-bottom: 1rem;
}

/* Calculator Section */
.calculator-section {
  padding: 5rem 0;
  background: var(--light-bg);
}

.calculator-card {
  background: var(--white);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.calculator-input label {
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 0.75rem;
  display: block;
}

.calculator-input .form-control {
  border: 2px solid #e9ecef;
  padding: 0.75rem;
  font-size: 1.1rem;
}

.calculator-input .form-control:focus {
  border-color: var(--text-dark);
  box-shadow: 0 0 0 0.2rem rgba(15, 76, 129, 0.25);
}

.calculator-result {
  margin: 2rem 0;
  padding: 1.5rem;
  background: var(--light-bg);
  border-radius: 8px;
}

.result-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding: 0.5rem 0;
}

.result-row.highlight {
  background: var(--primary-blue);
  color: var(--white);
  margin: 0.75rem -1rem;
  padding: 0.75rem 1rem;
  border-radius: 6px;
}

.result-label {
  font-weight: 600;
}

.result-value {
  font-weight: 700;
  font-size: 1.1rem;
}

.calculator-example h6 {
  color: var(--text-dark);
  font-weight: 600;
  margin-bottom: 1rem;
}

.example-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--light-bg);
  border-radius: 6px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.example-item:hover {
  background: var(--primary-blue);
  color: var(--white);
}

.example-fee {
  font-weight: 600;
  color: var(--accent-orange);
}

.example-item:hover .example-fee {
  color: var(--accent-orange);
}

/* Comparison Section */
.comparison-section {
  padding: 5rem 0;
  background: var(--white);
}

.comparison-table {
  background: var(--white);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.comparison-table table {
  margin: 0;
}

.comparison-table th {
  background: var(--light-bg);
  color: var(--text-dark);
  font-weight: 700;
  border: none;
  padding: 1.5rem 1rem;
}

.comparison-table th.our-solution {
  background: var(--primary-blue);
  color: var(--white);
}

.comparison-table td {
  padding: 1.25rem 1rem;
  border-color: #f0f0f0;
  vertical-align: middle;
}

.comparison-table td.our-solution {
  background: rgba(15, 76, 129, 0.05);
  font-weight: 600;
}

/* FAQ Section */
.faq-section {
  padding: 5rem 0;
  background: var(--light-bg);
}

.accordion-item {
  border: none;
  margin-bottom: 1rem;
}

.accordion-button {
  background: var(--white);
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  font-weight: 600;
  color: var(--text-dark);
  border-radius: 8px !important;
}

.accordion-button:not(.collapsed) {
  background: var(--primary-blue);
  color: var(--white);
}

.accordion-button:focus {
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(15, 76, 129, 0.2);
}

.accordion-body {
  background: var(--white);
  border-radius: 0 0 8px 8px;
  border-top: 1px solid rgba(15, 76, 129, 0.1);
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
  margin-bottom: 2rem;
}

.cta-guarantees {
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
}

.guarantee-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  opacity: 0.9;
}

.guarantee-item i {
  color: var(--accent-orange);
  font-size: 1rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .pricing-number {
    font-size: 4rem;
  }

  .pricing-content {
    padding: 2rem 1.5rem;
  }

  .calculator-card {
    padding: 1.5rem;
  }

  .cta-title {
    font-size: 2rem;
  }

  .cta-actions {
    flex-direction: column;
    align-items: center;
  }

  .cta-guarantees {
    flex-direction: column;
    gap: 1rem;
  }

  .comparison-table {
    font-size: 0.9rem;
  }

  .comparison-table th,
  .comparison-table td {
    padding: 1rem 0.75rem;
  }
}
</style>
