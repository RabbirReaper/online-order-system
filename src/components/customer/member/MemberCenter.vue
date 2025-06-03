<template>
  <div class="main-container">
    <!-- 頂部導航欄 -->
    <div class="nav-container">
      <div class="nav-wrapper">
        <nav class="navbar navbar-light">
          <div class="container-fluid px-3">
            <a class="navbar-brand" href="#" @click.prevent="goBack">
              <i class="bi bi-arrow-left me-2"></i>返回
            </a>
            <div class="navbar-title">會員中心</div>
            <div class="nav-placeholder"></div>
          </div>
        </nav>
        <div class="nav-border"></div>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">載入中...</span>
        </div>
        <p class="mt-3">載入您的資料中，請稍候...</p>
      </div>

      <div v-else-if="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
      </div>

      <div v-else class="member-content">
        <!-- 用戶信息卡片 -->
        <div class="user-info-card">
          <div class="user-avatar">
            <i class="bi bi-person-circle"></i>
          </div>
          <div class="user-details">
            <h5 class="user-name">{{ userProfile.name || '會員' }}</h5>
            <p class="user-phone">{{ userProfile.phone || '未設定手機號碼' }}</p>
            <p class="user-email">{{ userProfile.email || '未設定電子郵件' }}</p>
          </div>
          <div class="user-actions">
            <button class="btn btn-sm btn-outline-primary" @click="logout">
              <i class="bi bi-box-arrow-right me-1"></i>登出
            </button>
          </div>
        </div>

        <!-- 功能選單 -->
        <div class="menu-section">
          <div class="menu-item" @click="goToProfile">
            <div class="menu-icon">
              <i class="bi bi-person"></i>
            </div>
            <div class="menu-content">
              <h6 class="menu-title">會員資料</h6>
              <p class="menu-desc">管理個人資料、地址和密碼</p>
            </div>
            <div class="menu-arrow">
              <i class="bi bi-chevron-right"></i>
            </div>
          </div>

          <div class="menu-item" @click="goToPoints">
            <div class="menu-icon">
              <i class="bi bi-star"></i>
            </div>
            <div class="menu-content">
              <h6 class="menu-title">我的點數</h6>
              <p class="menu-desc">查看點數餘額與使用記錄</p>
            </div>
            <div class="menu-badge">
              <span class="badge bg-primary">{{ pointsBalance }} 點</span>
            </div>
            <div class="menu-arrow">
              <i class="bi bi-chevron-right"></i>
            </div>
          </div>

          <div class="menu-item" @click="goToCoupons">
            <div class="menu-icon">
              <i class="bi bi-ticket-perforated"></i>
            </div>
            <div class="menu-content">
              <h6 class="menu-title">我的優惠券</h6>
              <p class="menu-desc">查看可用的優惠券</p>
            </div>
            <div class="menu-badge">
              <span class="badge bg-success">{{ availableCoupons }} 張</span>
            </div>
            <div class="menu-arrow">
              <i class="bi bi-chevron-right"></i>
            </div>
          </div>

          <div class="menu-item" @click="goToOrderHistory">
            <div class="menu-icon">
              <i class="bi bi-bag"></i>
            </div>
            <div class="menu-content">
              <h6 class="menu-title">我的訂單</h6>
              <p class="menu-desc">查看訂單歷史與狀態</p>
            </div>
            <div class="menu-arrow">
              <i class="bi bi-chevron-right"></i>
            </div>
          </div>
        </div>

        <!-- 快速統計 -->
        <div class="stats-section">
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-icon">
                <i class="bi bi-star-fill text-warning"></i>
              </div>
              <div class="stat-content">
                <h6 class="stat-number">{{ pointsBalance }}</h6>
                <p class="stat-label">可用點數</p>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">
                <i class="bi bi-ticket-perforated-fill text-success"></i>
              </div>
              <div class="stat-content">
                <h6 class="stat-number">{{ availableCoupons }}</h6>
                <p class="stat-label">可用優惠券</p>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">
                <i class="bi bi-bag-fill text-primary"></i>
              </div>
              <div class="stat-content">
                <h6 class="stat-number">{{ totalOrders }}</h6>
                <p class="stat-label">總訂單數</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 登出確認模態框 -->
  <BModal id="logoutModal" title="確認登出" ok-title="確認登出" ok-variant="danger" cancel-title="取消" @ok="confirmLogout"
    ref="logoutModal">
    <div class="text-center">
      <i class="bi bi-question-circle-fill text-warning mb-3" style="font-size: 3rem;"></i>
      <p>確定要登出嗎？</p>
    </div>
  </BModal>

  <!-- 錯誤模態框 -->
  <BModal id="errorModal" title="操作失敗" ok-title="確認" ok-variant="danger" :hide-footer="false" ref="errorModal">
    <div class="alert alert-danger">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ errorMessage }}
    </div>
  </BModal>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/customerAuth';
import api from '@/api';
import { BModal } from 'bootstrap-vue-next';

// 路由與狀態
const router = useRouter();
const authStore = useAuthStore();

// 模態框參考
const logoutModal = ref(null);
const errorModal = ref(null);

// 狀態管理
const isLoading = ref(true);
const errorMessage = ref('');
const userProfile = ref({});

// 假資料 (後續會被 API 替換)
const pointsBalance = ref(0);
const availableCoupons = ref(0);
const totalOrders = ref(0);

// 品牌ID計算屬性
const brandId = computed(() => {
  return sessionStorage.getItem('currentBrandId');
});

const storeId = computed(() => {
  return sessionStorage.getItem('currentStoreId');
});

// 返回上一頁
const goBack = () => {
  if (brandId.value && storeId.value) {
    router.push(`/stores/${brandId.value}/${storeId.value}`);
  } else {
    router.back();
  }
};

// 導航方法
const goToProfile = () => {
  router.push('/member/profile');
};

const goToPoints = () => {
  router.push('/member/points');
};

const goToCoupons = () => {
  router.push('/member/coupons');
};

const goToOrderHistory = () => {
  router.push('/member/order-history');
};

// 登出方法
const logout = () => {
  if (logoutModal.value) {
    logoutModal.value.show();
  }
};

const confirmLogout = async () => {
  try {
    await authStore.logout();
    router.push(`/stores/${brandId.value}/${storeId.value}`);
  } catch (error) {
    console.error('登出失敗:', error);
    errorMessage.value = '登出失敗，請稍後再試';
    if (errorModal.value) {
      errorModal.value.show();
    }
  }
};

// 載入用戶資料
const loadUserData = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';

    const currentBrandId = brandId.value;

    if (!currentBrandId) {
      throw new Error('無法獲取品牌資訊');
    }

    // 載入用戶基本資料
    const profileResponse = await api.user.getUserProfile(currentBrandId);
    userProfile.value = profileResponse.profile;

    // TODO: 後續加入這些 API 調用
    // 載入點數餘額
    // const pointsResponse = await api.promotion.getUserPoints(currentBrandId);
    // pointsBalance.value = pointsResponse.balance || 0;

    // 載入優惠券數量
    // const couponsResponse = await api.promotion.getUserCoupons(currentBrandId);
    // availableCoupons.value = couponsResponse.available || 0;

    // 載入訂單總數
    // const ordersResponse = await api.orderCustomer.getUserOrderCount(currentBrandId);
    // totalOrders.value = ordersResponse.total || 0;

    // 暫時使用假資料
    pointsBalance.value = 1250;
    availableCoupons.value = 3;
    totalOrders.value = 18;

  } catch (error) {
    console.error('載入用戶資料失敗:', error);

    if (error.response && error.response.data) {
      errorMessage.value = error.response.data.message || '無法載入用戶資料';
    } else {
      errorMessage.value = '無法載入用戶資料，請稍後再試';
    }

    if (errorModal.value) {
      errorModal.value.show();
    }
  } finally {
    isLoading.value = false;
  }
};

// 組件掛載後載入資料
onMounted(() => {
  loadUserData();
});
</script>

<style scoped>
.main-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8f9fa;
}

/* 導航欄樣式 */
.nav-container {
  position: fixed;
  top: 0;
  width: 100%;
  max-width: 736px;
  z-index: 1030;
  left: 50%;
  transform: translateX(-50%);
}

.nav-wrapper {
  width: 100%;
  background-color: #ffffff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.navbar {
  width: 100%;
  background-color: #ffffff;
  margin-bottom: 0;
  padding: 0.8rem 1rem;
}

.navbar-brand {
  color: #333;
  display: flex;
  align-items: center;
  font-weight: 500;
}

.navbar-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-weight: 700;
  font-size: 1.1rem;
  color: #333;
}

.nav-placeholder {
  width: 30px;
}

.nav-border {
  height: 3px;
  background: linear-gradient(to right, #d35400, #e67e22);
  width: 100%;
}

/* 內容容器 */
.content-wrapper {
  width: 100%;
  max-width: 736px;
  margin: 0 auto;
  padding: 80px 15px 30px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.member-content {
  margin-bottom: 2rem;
}

/* 用戶信息卡片 */
.user-info-card {
  background-color: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
}

.user-avatar {
  margin-right: 1rem;
}

.user-avatar i {
  font-size: 3rem;
  color: #d35400;
}

.user-details {
  flex: 1;
}

.user-name {
  margin-bottom: 0.25rem;
  color: #333;
  font-weight: 600;
}

.user-phone,
.user-email {
  margin-bottom: 0.25rem;
  color: #6c757d;
  font-size: 0.9rem;
}

.user-actions {
  margin-left: 1rem;
}

/* 功能選單 */
.menu-section {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f1f1f1;
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:hover {
  background-color: #f8f9fa;
}

.menu-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-right: 1rem;
  color: #d35400;
}

.menu-icon i {
  font-size: 1.2rem;
}

.menu-content {
  flex: 1;
}

.menu-title {
  margin-bottom: 0.25rem;
  color: #333;
  font-weight: 600;
}

.menu-desc {
  margin: 0;
  color: #6c757d;
  font-size: 0.85rem;
}

.menu-badge {
  margin-right: 0.5rem;
}

.menu-arrow {
  color: #6c757d;
}

/* 快速統計 */
.stats-section {
  background-color: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-item {
  text-align: center;
  padding: 1rem 0.5rem;
  border-radius: 8px;
  background-color: #f8f9fa;
}

.stat-icon {
  margin-bottom: 0.5rem;
}

.stat-icon i {
  font-size: 1.5rem;
}

.stat-number {
  margin-bottom: 0.25rem;
  color: #333;
  font-weight: 600;
  font-size: 1.1rem;
}

.stat-label {
  margin: 0;
  color: #6c757d;
  font-size: 0.8rem;
}

/* 按鈕樣式 */
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

/* 響應式設計 */
@media (max-width: 576px) {
  .content-wrapper {
    padding-top: 70px;
  }

  .user-info-card {
    flex-direction: column;
    text-align: center;
  }

  .user-details {
    margin: 1rem 0;
  }

  .user-actions {
    margin-left: 0;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .stat-item {
    display: flex;
    align-items: center;
    text-align: left;
    padding: 0.75rem;
  }

  .stat-icon {
    margin-right: 0.75rem;
    margin-bottom: 0;
  }

  .stat-content {
    flex: 1;
  }
}
</style>
