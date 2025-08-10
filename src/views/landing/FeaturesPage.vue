<template>
  <div class="about-page">
    <!-- Navbar -->
    <Navbar />

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container">
        <div class="row align-items-center min-vh-75">
          <div class="col-12 text-center">
            <h1 class="hero-title">{{ $t('features.title') }}</h1>
            <p class="hero-subtitle">
              {{ $t('features.subtitle') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Core Features Section -->
    <section class="core-features-section">
      <div class="container">
        <div class="row">
          <div class="col-12 text-center mb-5">
            <h2 class="section-title">{{ $t('features.coreFeatures.title') }}</h2>
            <p class="section-subtitle">{{ $t('features.coreFeatures.subtitle') }}</p>
          </div>
        </div>

        <!-- 會員積點系統 -->
        <div class="feature-detail mb-5">
          <div class="row align-items-center">
            <div class="col-lg-6">
              <div class="feature-content">
                <div class="feature-badge">{{ $t('features.membership.badge') }}</div>
                <h3>{{ $t('features.membership.title') }}</h3>
                <p class="feature-description">
                  {{ $t('features.membership.description') }}
                </p>
                <ul class="feature-benefits">
                  <li>
                    <i class="bi bi-check-circle"></i>{{ $t('features.membership.benefits.0') }}
                  </li>
                  <li>
                    <i class="bi bi-check-circle"></i>{{ $t('features.membership.benefits.1') }}
                  </li>
                  <li>
                    <i class="bi bi-check-circle"></i>{{ $t('features.membership.benefits.2') }}
                  </li>
                  <li>
                    <i class="bi bi-check-circle"></i>{{ $t('features.membership.benefits.3') }}
                  </li>
                </ul>
              </div>
            </div>
            <div class="col-lg-6">
              <div class="feature-demo">
                <!-- 會員中心實際布局展示 -->
                <div class="mobile-demo-frame">
                  <div class="demo-nav-container">
                    <div class="demo-nav-wrapper">
                      <nav class="demo-navbar">
                        <div class="demo-nav-content">
                          <a class="demo-navbar-brand" href="#">
                            <i class="bi bi-arrow-left me-2"></i>{{ $t('nav.home') }}
                          </a>
                          <div class="demo-navbar-title">{{ $t('nav.home') }}</div>
                          <div class="demo-nav-placeholder"></div>
                        </div>
                      </nav>
                      <div class="demo-nav-border"></div>
                    </div>
                  </div>

                  <div class="demo-content">
                    <!-- 用戶信息卡片 -->
                    <div class="demo-user-info-card">
                      <div class="demo-user-avatar">
                        <i class="bi bi-person-circle"></i>
                      </div>
                      <div class="demo-user-details">
                        <h6 class="demo-user-name">王小明</h6>
                        <p class="demo-user-phone">0912-345-678</p>
                      </div>
                      <div class="demo-user-actions">
                        <button class="btn btn-sm btn-outline-primary">
                          <i class="bi bi-box-arrow-right me-1"></i>登出
                        </button>
                      </div>
                    </div>

                    <!-- 快速統計 -->
                    <div class="demo-stats-section">
                      <div class="demo-stats-grid">
                        <div class="demo-stat-item">
                          <div class="demo-stat-icon">
                            <i class="bi bi-star-fill" style="color: #d35400"></i>
                          </div>
                          <div class="demo-stat-content">
                            <div class="demo-stat-number">1,250</div>
                            <div class="demo-stat-label">目前點數</div>
                          </div>
                        </div>
                        <div class="demo-stat-item">
                          <div class="demo-stat-icon">
                            <i class="bi bi-ticket-perforated" style="color: #d35400"></i>
                          </div>
                          <div class="demo-stat-content">
                            <div class="demo-stat-number">3</div>
                            <div class="demo-stat-label">可用優惠券</div>
                          </div>
                        </div>
                        <div class="demo-stat-item">
                          <div class="demo-stat-icon">
                            <i class="bi bi-bag-check" style="color: #d35400"></i>
                          </div>
                          <div class="demo-stat-content">
                            <div class="demo-stat-number">18</div>
                            <div class="demo-stat-label">歷史訂單</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 預購券系統 -->
        <div class="feature-detail mb-5">
          <div class="row align-items-center">
            <div class="col-lg-6 order-lg-2">
              <div class="feature-content">
                <div class="feature-badge">{{ $t('features.voucher.badge') }}</div>
                <h3>{{ $t('features.voucher.title') }}</h3>
                <p class="feature-description">
                  {{ $t('features.voucher.description') }}
                </p>
                <ul class="feature-benefits">
                  <li><i class="bi bi-check-circle"></i>{{ $t('features.voucher.benefits.0') }}</li>
                  <li><i class="bi bi-check-circle"></i>{{ $t('features.voucher.benefits.1') }}</li>
                  <li><i class="bi bi-check-circle"></i>{{ $t('features.voucher.benefits.2') }}</li>
                  <li><i class="bi bi-check-circle"></i>{{ $t('features.voucher.benefits.3') }}</li>
                </ul>
              </div>
            </div>
            <div class="col-lg-6 order-lg-1">
              <div class="feature-demo">
                <!-- 優惠券頁面實際布局展示 -->
                <div class="mobile-demo-frame">
                  <div class="demo-nav-container">
                    <div class="demo-nav-wrapper">
                      <nav class="demo-navbar">
                        <div class="demo-nav-content">
                          <a class="demo-navbar-brand" href="#">
                            <i class="bi bi-arrow-left me-2"></i>{{ $t('nav.home') }}
                          </a>
                          <div class="demo-navbar-title">我的優惠券</div>
                          <div class="demo-nav-placeholder"></div>
                        </div>
                      </nav>
                      <div class="demo-nav-border"></div>
                    </div>
                  </div>

                  <div class="demo-content">
                    <!-- 標籤切換 -->
                    <div class="demo-tabs">
                      <button class="demo-tab active">可使用 (3)</button>
                      <button class="demo-tab">已使用 (12)</button>
                      <button class="demo-tab">已過期 (1)</button>
                    </div>

                    <!-- 優惠券列表 -->
                    <div class="demo-coupon-list">
                      <div class="demo-coupon-item">
                        <div class="demo-coupon-info">
                          <div class="demo-coupon-header">
                            <span class="demo-badge bg-warning text-dark">優惠券</span>
                            <h6 class="demo-coupon-title">50元折扣券</h6>
                          </div>
                          <p class="demo-coupon-desc">獲得方式：消費滿 $500 贈送</p>
                          <p class="demo-coupon-expiry">有效至：2025/01/31</p>
                        </div>
                        <div class="demo-coupon-action">
                          <button class="btn btn-sm btn-primary">使用</button>
                        </div>
                      </div>

                      <div class="demo-coupon-item">
                        <div class="demo-coupon-info">
                          <div class="demo-coupon-header">
                            <span class="demo-badge bg-info">兌換券</span>
                            <h6 class="demo-coupon-title">紅茶兌換券</h6>
                          </div>
                          <p class="demo-coupon-desc">可兌換一杯紅茶</p>
                          <p class="demo-coupon-expiry">有效至：2025/02/15</p>
                        </div>
                        <div class="demo-coupon-action">
                          <button class="btn btn-sm btn-primary">使用</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 多層級管理 -->
        <div class="feature-detail mb-5">
          <div class="row align-items-center">
            <div class="col-lg-6">
              <div class="feature-content">
                <div class="feature-badge">{{ $t('features.multilevel.badge') }}</div>
                <h3>{{ $t('features.multilevel.title') }}</h3>
                <p class="feature-description">
                  {{ $t('features.multilevel.description') }}
                </p>
                <ul class="feature-benefits">
                  <li>
                    <i class="bi bi-check-circle"></i>{{ $t('features.multilevel.benefits.0') }}
                  </li>
                  <li>
                    <i class="bi bi-check-circle"></i>{{ $t('features.multilevel.benefits.1') }}
                  </li>
                  <li>
                    <i class="bi bi-check-circle"></i>{{ $t('features.multilevel.benefits.2') }}
                  </li>
                  <li>
                    <i class="bi bi-check-circle"></i>{{ $t('features.multilevel.benefits.3') }}
                  </li>
                </ul>
              </div>
            </div>
            <div class="col-lg-6">
              <div class="chart-demo-container">
                <h6 class="chart-title">週營業額趨勢分析</h6>
                <WeeklyRevenueTrendChart :chart-data="weeklyTrendData" :height="350" />
                <p class="chart-description">即時追蹤各週營業表現，清楚掌握業績趨勢變化</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Components Section -->
    <section class="components-section">
      <div class="container">
        <div class="row">
          <div class="col-12 text-center mb-5">
            <h2 class="section-title">{{ $t('features.components.title') }}</h2>
            <p class="section-subtitle">{{ $t('features.components.subtitle') }}</p>
          </div>
        </div>

        <div class="row g-4">
          <div class="col-md-6 col-lg-4">
            <div class="component-card">
              <div class="component-header">
                <div class="component-icon">
                  <i class="bi bi-shop"></i>
                </div>
                <h4>{{ $t('features.components.ordering.title') }}</h4>
              </div>
              <div class="component-features">
                <h6>核心功能</h6>
                <ul>
                  <li>{{ $t('features.components.ordering.features.0') }}</li>
                  <li>{{ $t('features.components.ordering.features.1') }}</li>
                  <li>{{ $t('features.components.ordering.features.2') }}</li>
                  <li>{{ $t('features.components.ordering.features.3') }}</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="col-md-6 col-lg-4">
            <div class="component-card">
              <div class="component-header">
                <div class="component-icon">
                  <i class="bi bi-people"></i>
                </div>
                <h4>{{ $t('features.components.membership.title') }}</h4>
              </div>
              <div class="component-features">
                <h6>核心功能</h6>
                <ul>
                  <li>{{ $t('features.components.membership.features.0') }}</li>
                  <li>{{ $t('features.components.membership.features.1') }}</li>
                  <li>{{ $t('features.components.membership.features.2') }}</li>
                  <li>{{ $t('features.components.membership.features.3') }}</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="col-md-6 col-lg-4">
            <div class="component-card">
              <div class="component-header">
                <div class="component-icon">
                  <i class="bi bi-graph-up"></i>
                </div>
                <h4>{{ $t('features.components.analytics.title') }}</h4>
              </div>
              <div class="component-features">
                <h6>核心功能</h6>
                <ul>
                  <li>{{ $t('features.components.analytics.features.0') }}</li>
                  <li>{{ $t('features.components.analytics.features.1') }}</li>
                  <li>{{ $t('features.components.analytics.features.2') }}</li>
                  <li>{{ $t('features.components.analytics.features.3') }}</li>
                </ul>
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
            <h2 class="section-title">{{ $t('features.benefits.title') }}</h2>
            <p class="section-subtitle">{{ $t('features.benefits.subtitle') }}</p>
          </div>
        </div>

        <div class="row g-4">
          <div class="col-md-6 col-lg-3">
            <div class="benefit-card">
              <div class="benefit-icon">
                <i class="bi bi-lightning"></i>
              </div>
              <h5>{{ $t('features.benefits.deployment.title') }}</h5>
              <p>{{ $t('features.benefits.deployment.description') }}</p>
            </div>
          </div>

          <div class="col-md-6 col-lg-3">
            <div class="benefit-card">
              <div class="benefit-icon">
                <i class="bi bi-shield-check"></i>
              </div>
              <h5>{{ $t('features.benefits.security.title') }}</h5>
              <p>{{ $t('features.benefits.security.description') }}</p>
            </div>
          </div>

          <div class="col-md-6 col-lg-3">
            <div class="benefit-card">
              <div class="benefit-icon">
                <i class="bi bi-headset"></i>
              </div>
              <h5>{{ $t('features.benefits.support.title') }}</h5>
              <p>{{ $t('features.benefits.support.description') }}</p>
            </div>
          </div>

          <div class="col-md-6 col-lg-3">
            <div class="benefit-card">
              <div class="benefit-icon">
                <i class="bi bi-currency-dollar"></i>
              </div>
              <h5>{{ $t('features.benefits.cost.title') }}</h5>
              <p>{{ $t('features.benefits.cost.description') }}</p>
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
            <h2 class="cta-title">{{ $t('features.cta.title') }}</h2>
            <p class="cta-subtitle">{{ $t('features.cta.subtitle') }}</p>
            <div class="cta-actions">
              <router-link to="/contact" class="btn btn-cta btn-lg me-3">
                <i class="bi bi-telephone me-2"></i>
                {{ $t('common.consultation') }}
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
import { ref, computed, onMounted } from 'vue'
import Navbar from '@/components/landing/Navbar.vue'
import { useLanguage } from '@/composables/useLanguage'
import WeeklyRevenueTrendChart from '@/components/BrandAdmin/Order/Charts/WeeklyRevenueTrendChart.vue'

const { initializeLanguage } = useLanguage()

// 生成模擬的週營業額趨勢資料
const weeklyTrendData = computed(() => {
  // 模擬過去5週的資料
  const weeks = [
    { label: '4週前', start: new Date('2024-12-09'), end: new Date('2024-12-15') },
    { label: '3週前', start: new Date('2024-12-16'), end: new Date('2024-12-22') },
    { label: '2週前', start: new Date('2024-12-23'), end: new Date('2024-12-29') },
    { label: '上週', start: new Date('2024-12-30'), end: new Date('2025-01-05') },
    { label: '本週', start: new Date('2025-01-06'), end: new Date('2025-01-12') },
  ]

  // 模擬一週7天的營業額資料 (週一到週日)
  const datasets = weeks.map((week, index) => {
    // 為不同週生成不同的營業額模式
    let baseRevenue = 15000 + index * 2000 // 基礎營業額逐週增長

    const weekData = [
      baseRevenue * 0.7, // 週一
      baseRevenue * 0.8, // 週二
      baseRevenue * 0.9, // 週三
      baseRevenue * 1.0, // 週四
      baseRevenue * 1.3, // 週五
      baseRevenue * 1.5, // 週六
      baseRevenue * 1.2, // 週日
    ]

    // 添加一些隨機變化使資料更真實
    const randomizedData = weekData.map((value) =>
      Math.round(value + (Math.random() - 0.5) * value * 0.2),
    )

    return {
      label: week.label,
      data: randomizedData,
      borderColor: getWeekColor(index),
      backgroundColor: getWeekColor(index, 0.1),
      tension: 0.4,
      fill: false,
      pointBackgroundColor: getWeekColor(index),
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      weekInfo: week,
    }
  })

  return {
    datasets,
    // 添加 X 軸標籤 (週一到週日)
    labels: ['週一', '週二', '週三', '週四', '週五', '週六', '週日'],
  }
})

// 為不同週次生成不同顏色
const getWeekColor = (index, alpha = 1) => {
  const colors = [
    `rgba(52, 152, 219, ${alpha})`, // 藍色 - 4週前
    `rgba(155, 89, 182, ${alpha})`, // 紫色 - 3週前
    `rgba(230, 126, 34, ${alpha})`, // 橙色 - 2週前
    `rgba(149, 165, 166, ${alpha})`, // 灰色 - 上週
    `rgba(46, 204, 113, ${alpha})`, // 綠色 - 本週
  ]
  return colors[index] || colors[0]
}

onMounted(() => {
  initializeLanguage()
  document.title = '產品功能 - 智慧餐飲管理系統'
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

/* Core Features Section */
.core-features-section {
  padding: 5rem 0;
  background: var(--white);
}

.feature-detail {
  padding: 3rem 0;
}

.feature-badge {
  background: var(--accent-yellow);
  color: var(--text-blue);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  display: inline-block;
  margin-bottom: 1rem;
}

.feature-content h3 {
  color: var(--primary-blue);
  font-weight: 700;
  font-size: 2rem;
  margin-bottom: 1rem;
}

.feature-description {
  font-size: 1.1rem;
  line-height: 1.8;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.feature-benefits {
  list-style: none;
  padding: 0;
}

.feature-benefits li {
  padding: 0.5rem 0;
  display: flex;
  align-items: center;
}

.feature-benefits i {
  color: var(--accent-yellow);
  margin-right: 1rem;
  font-size: 1.1rem;
}

.feature-demo {
  padding: 2rem;
}

/* Chart Demo Container */
.chart-demo-container {
  padding: 2rem;
  background: var(--white);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.chart-title {
  color: var(--primary-blue);
  font-weight: 700;
  text-align: center;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
}

.chart-description {
  text-align: center;
  color: var(--text-blue);
  opacity: 0.8;
  margin-top: 1rem;
  font-size: 0.9rem;
}

/* Mobile Demo Frame - 模擬真實系統設計 */
.mobile-demo-frame {
  max-width: 350px;
  margin: 0 auto;
  background-color: #f8f9fa;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid #dee2e6;
}

/* Demo Navigation - 模擬實際導航欄 */
.demo-nav-container {
  position: relative;
  background-color: #ffffff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.demo-nav-wrapper {
  width: 100%;
  background-color: #ffffff;
}

.demo-navbar {
  width: 100%;
  background-color: #ffffff;
  padding: 0.8rem 1rem;
  margin: 0;
}

.demo-nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.demo-navbar-brand {
  color: #333;
  text-decoration: none;
  display: flex;
  align-items: center;
  font-weight: 500;
  font-size: 0.9rem;
}

.demo-navbar-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-weight: 700;
  font-size: 1rem;
  color: #333;
}

.demo-nav-placeholder {
  width: 30px;
}

.demo-nav-border {
  height: 3px;
  background: linear-gradient(to right, #d35400, #e67e22);
  width: 100%;
}

/* Demo Content */
.demo-content {
  padding: 1rem;
  background-color: #f8f9fa;
  min-height: 300px;
}

/* Demo User Info Card - 模擬會員資訊卡片 */
.demo-user-info-card {
  background-color: white;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
}

.demo-user-avatar {
  margin-right: 0.75rem;
}

.demo-user-avatar i {
  font-size: 2rem;
  color: #d35400;
}

.demo-user-details {
  flex: 1;
}

.demo-user-name {
  margin-bottom: 0.25rem;
  color: #333;
  font-weight: 600;
  font-size: 0.9rem;
}

.demo-user-phone {
  margin-bottom: 0;
  color: #6c757d;
  font-size: 0.8rem;
}

.demo-user-actions {
  margin-left: 0.5rem;
}

.demo-user-actions .btn {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

/* Demo Stats Section - 模擬統計區域 */
.demo-stats-section {
  background-color: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 1rem;
}

.demo-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.demo-stat-item {
  text-align: center;
  padding: 0.75rem 0.5rem;
  border-radius: 8px;
  background-color: #f8f9fa;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.demo-stat-icon {
  margin-bottom: 0.5rem;
}

.demo-stat-icon i {
  font-size: 1.25rem;
}

.demo-stat-number {
  margin-bottom: 0.25rem;
  color: #333;
  font-weight: 600;
  font-size: 1rem;
}

.demo-stat-label {
  margin: 0;
  color: #6c757d;
  font-size: 0.7rem;
}

/* Demo Tabs - 模擬標籤切換 */
.demo-tabs {
  display: flex;
  background-color: white;
  border-radius: 8px;
  padding: 0.25rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.demo-tab {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0.5rem;
  font-size: 0.8rem;
  border-radius: 6px;
  transition: all 0.3s ease;
  color: #6c757d;
}

.demo-tab.active {
  background-color: #d35400;
  color: white;
  font-weight: 600;
}

/* Demo Coupon List - 模擬優惠券列表 */
.demo-coupon-list {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.demo-coupon-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #f1f1f1;
}

.demo-coupon-item:last-child {
  border-bottom: none;
}

.demo-coupon-info {
  flex: 1;
}

.demo-coupon-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.demo-badge {
  font-size: 0.7rem;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
}

.demo-coupon-title {
  font-weight: 600;
  margin: 0;
  font-size: 0.85rem;
  color: #333;
}

.demo-coupon-desc {
  margin-bottom: 0.25rem;
  color: #6c757d;
  font-size: 0.75rem;
}

.demo-coupon-expiry {
  margin: 0;
  color: #999;
  font-size: 0.7rem;
}

.demo-coupon-action .btn {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
}

/* Components Section */
.components-section {
  padding: 5rem 0;
  background: var(--light-bg);
}

.component-card {
  background: var(--white);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  height: 100%;
  transition: transform 0.3s ease;
}

.component-card:hover {
  transform: translateY(-5px);
}

.component-header {
  text-align: center;
  margin-bottom: 2rem;
}

.component-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, var(--accent-yellow), var(--accent-orange));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.component-icon i {
  font-size: 1.5rem;
  color: var(--white);
}

.component-header h4 {
  color: var(--primary-blue);
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.component-features h6 {
  color: var(--primary-blue);
  font-weight: 600;
  margin-bottom: 1rem;
}

.component-features ul {
  list-style: none;
  padding: 0;
}

.component-features li {
  padding: 0.25rem 0;
  position: relative;
  padding-left: 1.5rem;
}

.component-features li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--accent-orange);
  font-weight: 700;
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
  width: 50px;
  height: 50px;
  background: var(--primary-blue);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.benefit-icon i {
  font-size: 1.25rem;
  color: var(--white);
}

.benefit-card h5 {
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

/* Button Overrides for Demo */
.btn-primary {
  background-color: #d35400;
  border-color: #d35400;
}

.btn-primary:hover,
.btn-primary:focus {
  background-color: #e67e22;
  border-color: #e67e22;
}

.btn-outline-primary {
  color: #d35400;
  border-color: #d35400;
}

.btn-outline-primary:hover {
  background-color: #d35400;
  border-color: #d35400;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .feature-content h3 {
    font-size: 1.5rem;
  }

  .cta-title {
    font-size: 2rem;
  }

  .cta-actions {
    flex-direction: column;
    align-items: center;
  }

  .feature-detail {
    padding: 2rem 0;
  }

  .mobile-demo-frame {
    max-width: 300px;
  }

  .demo-stats-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .demo-stat-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    text-align: left;
    padding: 0.75rem;
  }

  .demo-stat-icon {
    margin-right: 0.75rem;
    margin-bottom: 0;
  }

  .chart-demo-container {
    padding: 1rem;
  }
}
</style>
