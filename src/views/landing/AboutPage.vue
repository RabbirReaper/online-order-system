<template>
  <div class="about-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container">
        <div class="row align-items-center min-vh-75">
          <div class="col-lg-6">
            <h1 class="hero-title">關於我們</h1>
            <p class="hero-subtitle">
              致力於為餐飲業者提供最專業的數位化解決方案，協助您提升營運效率、增加營收。
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
            <h2 class="section-title">我們的使命</h2>
            <p class="section-subtitle">透過科技創新，讓餐飲業營運更智慧、更高效</p>
          </div>
        </div>
        <div class="row g-4">
          <div class="col-md-4">
            <div class="mission-card">
              <div class="mission-icon">
                <i class="bi bi-lightbulb"></i>
              </div>
              <h4>創新技術</h4>
              <p>持續投入研發，提供最前沿的餐飲管理技術解決方案。</p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="mission-card">
              <div class="mission-icon">
                <i class="bi bi-heart"></i>
              </div>
              <h4>用心服務</h4>
              <p>以客戶需求為中心，提供貼心、專業的技術支援與服務。</p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="mission-card">
              <div class="mission-icon">
                <i class="bi bi-graph-up"></i>
              </div>
              <h4>共同成長</h4>
              <p>與合作夥伴攜手並進，在數位轉型的道路上共創佳績。</p>
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
            <h2 class="section-title">核心價值</h2>
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-lg-6">
            <div class="values-content">
              <div class="value-item">
                <h5>專業至上</h5>
                <p>以專業的技術能力和豐富的行業經驗，為客戶提供最優質的解決方案。</p>
              </div>
              <div class="value-item">
                <h5>誠信經營</h5>
                <p>秉持誠信原則，建立與客戶間的信任關係，創造長期合作價值。</p>
              </div>
              <div class="value-item">
                <h5>持續創新</h5>
                <p>不斷追求技術突破與服務創新，為餐飲業帶來更多可能性。</p>
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

    <!-- Team Section (預留) -->
    <section class="team-section">
      <div class="container">
        <div class="row">
          <div class="col-12 text-center mb-5">
            <h2 class="section-title">專業團隊</h2>
            <p class="section-subtitle">由經驗豐富的技術專家與行業顧問組成</p>
          </div>
        </div>
        <div class="row g-4">
          <div class="col-md-4">
            <div class="team-card">
              <div class="team-avatar">
                <i class="bi bi-person-circle"></i>
              </div>
              <h5>技術總監</h5>
              <p class="team-role">負責系統架構設計與技術方向</p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="team-card">
              <div class="team-avatar">
                <i class="bi bi-person-circle"></i>
              </div>
              <h5>產品經理</h5>
              <p class="team-role">負責產品規劃與用戶體驗設計</p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="team-card">
              <div class="team-avatar">
                <i class="bi bi-person-circle"></i>
              </div>
              <h5>客戶成功經理</h5>
              <p class="team-role">負責客戶服務與技術支援</p>
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
            <h2 class="cta-title">想了解更多？</h2>
            <p class="cta-subtitle">聯絡我們的專業團隊，獲得個人化的解決方案建議</p>
            <div class="cta-actions">
              <router-link to="/contact" class="btn btn-cta btn-lg me-3">
                <i class="bi bi-telephone me-2"></i>
                立即聯絡
              </router-link>
              <router-link to="/demo" class="btn btn-outline-light btn-lg">
                <i class="bi bi-play-circle me-2"></i>
                產品展示
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
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

/* Team Section */
.team-section {
  padding: 5rem 0;
  background: var(--light-bg);
}

.team-card {
  text-align: center;
  padding: 2rem;
  background: var(--white);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  height: 100%;
}

.team-avatar {
  margin-bottom: 1.5rem;
}

.team-avatar i {
  font-size: 3rem;
  color: var(--primary-blue);
}

.team-card h5 {
  color: var(--primary-blue);
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.team-role {
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
