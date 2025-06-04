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
            <div class="navbar-title">我的點數</div>
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
        <p class="mt-3">載入您的點數資料中，請稍候...</p>
      </div>

      <div v-else-if="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
        <button class="btn btn-outline-danger btn-sm mt-2" @click="loadPointsData">
          <i class="bi bi-arrow-clockwise me-1"></i>重新載入
        </button>
      </div>

      <div v-else class="points-content">
        <!-- 點數總覽卡片 -->
        <div class="points-overview-card">
          <div class="points-icon">
            <i class="bi bi-star-fill"></i>
          </div>
          <div class="points-info">
            <h3 class="points-balance">{{ pointsBalance }}</h3>
            <p class="points-label">可用點數</p>
          </div>
          <div class="points-actions">
            <button class="btn btn-outline-primary btn-sm" @click="refreshData" :disabled="isRefreshing">
              <span v-if="isRefreshing" class="spinner-border spinner-border-sm me-1" role="status"
                aria-hidden="true"></span>
              <i v-else class="bi bi-arrow-clockwise me-1"></i>重新整理
            </button>
          </div>
        </div>

        <!-- 點數即將過期提醒 -->
        <div v-if="expiringPoints.length > 0" class="expiring-alert">
          <div class="alert alert-warning">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            <strong>提醒：</strong> 您有 {{ expiringPointsTotal }} 點數將在近期過期，請儘早使用。
          </div>
        </div>

        <!-- 點數明細 -->
        <div class="points-detail-card">
          <div class="card-header">
            <h5 class="mb-0">點數明細</h5>
          </div>
          <div class="card-body">
            <div v-if="pointsDetail.length > 0" class="points-list">
              <div v-for="(point, index) in pointsDetail" :key="point._id || index" class="point-item">
                <div class="point-info">
                  <div class="point-amount">
                    <span class="amount">{{ point.amount }}</span>
                    <span class="unit">點</span>
                  </div>
                  <div class="point-details">
                    <p class="point-source">{{ formatPointSource(point.source) }}</p>
                    <p class="point-date">獲得時間：{{ formatDate(point.createdAt) }}</p>
                  </div>
                </div>
                <div class="point-status">
                  <span :class="getStatusClass(point.status)">{{ formatStatus(point.status) }}</span>
                  <p class="expiry-date">到期日：{{ formatDate(point.expiryDate) }}</p>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-4">
              <i class="bi bi-star text-muted" style="font-size: 3rem;"></i>
              <p class="text-muted mt-2">目前沒有點數記錄</p>
            </div>
          </div>
        </div>

        <!-- 點數使用歷史 -->
        <div class="points-history-card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">使用記錄</h5>
            <button class="btn btn-sm btn-outline-secondary" @click="loadMoreHistory"
              :disabled="isLoadingHistory || !hasMoreHistory" v-if="pointsHistory.length > 0">
              <span v-if="isLoadingHistory" class="spinner-border spinner-border-sm me-1" role="status"
                aria-hidden="true"></span>
              {{ hasMoreHistory ? '載入更多' : '沒有更多' }}
            </button>
          </div>
          <div class="card-body">
            <div v-if="pointsHistory.length > 0" class="history-list">
              <div v-for="(record, index) in pointsHistory" :key="record._id || index" class="history-item">
                <div class="history-icon">
                  <i :class="getHistoryIcon(record)"></i>
                </div>
                <div class="history-info">
                  <p class="history-title">{{ formatHistoryTitle(record) }}</p>
                  <p class="history-desc">{{ formatHistoryDescription(record) }}</p>
                  <p class="history-date">{{ formatDateTime(record.createdAt) }}</p>
                </div>
                <div class="history-amount">
                  <span :class="getAmountClass(record)">
                    {{ getAmountPrefix(record) }}{{ record.amount }}
                  </span>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-4">
              <i class="bi bi-clock-history text-muted" style="font-size: 3rem;"></i>
              <p class="text-muted mt-2">目前沒有使用記錄</p>
            </div>
          </div>
        </div>

        <!-- 點數使用規則說明 -->
        <div class="points-rules-card">
          <div class="card-header">
            <h5 class="mb-0">點數使用規則</h5>
          </div>
          <div class="card-body">
            <div class="rules-list">
              <div class="rule-item">
                <i class="bi bi-check-circle-fill text-success me-2"></i>
                使用點數時將優先使用即將到期的點數
              </div>
              <div class="rule-item">
                <i class="bi bi-check-circle-fill text-success me-2"></i>
                過期點數將自動失效，不可恢復
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/customerAuth';
import api from '@/api';

// 路由
const router = useRouter();
const authStore = useAuthStore();

// 狀態管理
const isLoading = ref(true);
const isRefreshing = ref(false);
const isLoadingHistory = ref(false);
const errorMessage = ref('');

// 點數資料
const pointsBalance = ref(0);
const pointsDetail = ref([]);
const pointsHistory = ref([]);

// 分頁相關
const currentHistoryPage = ref(1);
const hasMoreHistory = ref(false);
const historyLimit = ref(10);

// 品牌ID計算屬性
const brandId = computed(() => {
  return sessionStorage.getItem('currentBrandId');
});

// 即將過期的點數 (30天內)
const expiringPoints = computed(() => {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  return pointsDetail.value.filter(point => {
    const expiryDate = new Date(point.expiryDate);
    return point.status === 'active' && expiryDate <= thirtyDaysFromNow;
  });
});

const expiringPointsTotal = computed(() => {
  return expiringPoints.value.reduce((total, point) => total + point.amount, 0);
});

// 監聽用戶狀態變化
watch(() => authStore.user, (newUser) => {
  console.log('用戶狀態變化:', newUser);
}, { immediate: true });

// 返回上一頁
const goBack = () => {
  router.push('/member');
};

// 格式化點數來源
const formatPointSource = (source) => {
  const sourceMap = {
    '滿額贈送': '滿額贈送',
    'purchase_reward': '消費獎勵',
    'sign_up_bonus': '註冊獎勵',
    'referral_bonus': '推薦獎勵',
    'admin_grant': '管理員給予'
  };
  return sourceMap[source] || source;
};

// 格式化狀態
const formatStatus = (status) => {
  const statusMap = {
    'active': '可用',
    'used': '已使用',
    'expired': '已過期'
  };
  return statusMap[status] || status;
};

// 獲取狀態樣式
const getStatusClass = (status) => {
  const statusClasses = {
    'active': 'badge bg-success',
    'used': 'badge bg-secondary',
    'expired': 'badge bg-danger'
  };
  return statusClasses[status] || 'badge bg-secondary';
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未設定';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '無效日期';

  return date.toLocaleDateString('zh-TW');
};

// 格式化日期時間
const formatDateTime = (dateString) => {
  if (!dateString) return '未設定';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '無效日期';

  return date.toLocaleString('zh-TW');
};

// 格式化歷史記錄標題
const formatHistoryTitle = (record) => {
  const statusMap = {
    'active': '獲得點數',
    'used': '使用點數',
    'expired': '點數過期'
  };
  return statusMap[record.status] || '點數異動';
};

// 格式化歷史記錄描述
const formatHistoryDescription = (record) => {
  if (record.status === 'used' && record.usedIn) {
    return `訂單使用 - ${record.usedIn.id}`;
  } else if (record.source) {
    return formatPointSource(record.source);
  }
  return '點數異動';
};

// 獲取歷史記錄圖標
const getHistoryIcon = (record) => {
  const iconMap = {
    'active': 'bi bi-plus-circle-fill text-success',
    'used': 'bi bi-dash-circle-fill text-primary',
    'expired': 'bi bi-x-circle-fill text-danger'
  };
  return iconMap[record.status] || 'bi bi-circle-fill text-secondary';
};

// 獲取金額樣式
const getAmountClass = (record) => {
  const amountClasses = {
    'active': 'amount-positive',
    'used': 'amount-negative',
    'expired': 'amount-expired'
  };
  return amountClasses[record.status] || 'amount-neutral';
};

// 獲取金額前綴
const getAmountPrefix = (record) => {
  if (record.status === 'active') {
    return '+';
  } else if (record.status === 'used') {
    return '-';
  }
  return '';
};

// 重新整理資料
const refreshData = async () => {
  try {
    isRefreshing.value = true;
    await loadPointsData();
  } catch (error) {
    console.error('重新整理點數資料失敗:', error);
  } finally {
    isRefreshing.value = false;
  }
};

// 載入更多歷史記錄
const loadMoreHistory = async () => {
  if (!hasMoreHistory.value || isLoadingHistory.value) {
    return;
  }

  try {
    isLoadingHistory.value = true;

    const currentBrandId = brandId.value;
    if (!currentBrandId) {
      throw new Error('無法獲取品牌資訊');
    }

    const nextPage = currentHistoryPage.value + 1;
    const response = await api.promotion.getUserPointHistory({
      brandId: currentBrandId,
      page: nextPage,
      limit: historyLimit.value
    });

    if (response.records && response.records.length > 0) {
      pointsHistory.value = [...pointsHistory.value, ...response.records];
      currentHistoryPage.value = nextPage;
      hasMoreHistory.value = response.pagination.hasNextPage;
    } else {
      hasMoreHistory.value = false;
    }

  } catch (error) {
    console.error('載入更多歷史記錄失敗:', error);
    errorMessage.value = '載入更多記錄失敗';
  } finally {
    isLoadingHistory.value = false;
  }
};

// 載入點數資料
const loadPointsData = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';

    const currentBrandId = brandId.value;
    if (!currentBrandId) {
      throw new Error('無法獲取品牌資訊');
    }

    // 檢查用戶是否已登入
    if (!authStore.isLoggedIn) {
      throw new Error('請先登入以查看點數資料');
    }

    // 並行獲取點數資料和歷史記錄
    const [pointsResponse, historyResponse] = await Promise.all([
      api.promotion.getUserPoints(currentBrandId),
      api.promotion.getUserPointHistory({
        brandId: currentBrandId,
        page: 1,
        limit: historyLimit.value
      })
    ]);

    // 設置點數資料
    if (pointsResponse) {
      pointsBalance.value = pointsResponse.balance || 0;
      pointsDetail.value = pointsResponse.points || [];
    }

    // 設置歷史記錄
    if (historyResponse) {
      pointsHistory.value = historyResponse.records || [];
      currentHistoryPage.value = 1;
      hasMoreHistory.value = historyResponse.pagination?.hasNextPage || false;
    }

  } catch (error) {
    console.error('載入點數資料失敗:', error);

    if (error.response) {
      if (error.response.status === 401) {
        errorMessage.value = '請先登入以查看點數資料';
        // 可以考慮跳轉到登入頁面
        // router.push('/auth/login');
      } else if (error.response.data && error.response.data.message) {
        errorMessage.value = error.response.data.message;
      } else {
        errorMessage.value = `載入失敗：${error.response.status}`;
      }
    } else if (error.message) {
      errorMessage.value = error.message;
    } else {
      errorMessage.value = '無法載入點數資料，請稍後再試';
    }
  } finally {
    isLoading.value = false;
  }
};

// 組件掛載後載入資料
onMounted(async () => {
  console.log('=== PointsView 調試開始 ===');

  // 確保品牌ID存在
  if (brandId.value) {
    authStore.setBrandId(brandId.value);
    console.log('設置品牌ID:', brandId.value);
  }

  // 等待下一個tick，確保組件完全掛載
  await nextTick();

  // 先檢查登入狀態
  console.log('檢查登入狀態前 - isLoggedIn:', authStore.isLoggedIn);
  console.log('檢查登入狀態前 - user:', authStore.user);

  if (!authStore.isLoggedIn) {
    await authStore.checkAuthStatus();
  }

  // 再獲取用戶資訊
  const currentUser = authStore.user;
  const isLoggedIn = authStore.isLoggedIn;
  const userId = authStore.userId;

  console.log('當前登入狀態:', isLoggedIn);
  console.log('當前用戶:', currentUser);
  console.log('用戶ID:', userId);
  console.log('=== PointsView 調試結束 ===');

  // 然後載入點數資料
  await loadPointsData();
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

.points-content {
  margin-bottom: 2rem;
}

/* 點數總覽卡片 */
.points-overview-card {
  background: linear-gradient(135deg, #d35400, #e67e22);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  color: white;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 12px rgba(211, 84, 0, 0.3);
}

.points-icon {
  margin-right: 1.5rem;
}

.points-icon i {
  font-size: 3rem;
  color: #fff;
}

.points-info {
  flex: 1;
}

.points-balance {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.points-label {
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.9;
}

.points-actions {
  margin-left: 1rem;
}

.points-actions .btn {
  color: white;
  border-color: rgba(255, 255, 255, 0.5);
}

.points-actions .btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: white;
}

/* 過期提醒 */
.expiring-alert {
  margin-bottom: 1.5rem;
}

/* 通用卡片樣式 */
.points-detail-card,
.points-history-card,
.points-rules-card {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
}

.card-header {
  background-color: #f8f9fa;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.card-body {
  padding: 1.25rem;
}

/* 點數明細列表 */
.points-list,
.history-list {
  margin: -0.5rem;
}

.point-item,
.history-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #f1f1f1;
  margin: 0;
}

.point-item:last-child,
.history-item:last-child {
  border-bottom: none;
}

.point-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.point-amount {
  margin-right: 1rem;
  text-align: center;
  min-width: 80px;
}

.point-amount .amount {
  font-size: 1.5rem;
  font-weight: 600;
  color: #d35400;
}

.point-amount .unit {
  font-size: 0.9rem;
  color: #6c757d;
  margin-left: 0.25rem;
}

.point-details {
  flex: 1;
}

.point-source {
  font-weight: 500;
  margin-bottom: 0.25rem;
  color: #333;
}

.point-date {
  font-size: 0.85rem;
  color: #6c757d;
  margin: 0;
}

.point-status {
  text-align: right;
  min-width: 120px;
}

.expiry-date {
  font-size: 0.8rem;
  color: #6c757d;
  margin-top: 0.25rem;
  margin-bottom: 0;
}

/* 歷史記錄樣式 */
.history-icon {
  margin-right: 1rem;
  width: 40px;
  text-align: center;
}

.history-icon i {
  font-size: 1.2rem;
}

.history-info {
  flex: 1;
}

.history-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
  color: #333;
}

.history-desc {
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.history-date {
  font-size: 0.8rem;
  color: #999;
  margin: 0;
}

.history-amount {
  text-align: right;
  font-weight: 600;
  font-size: 1.1rem;
}

.amount-positive {
  color: #28a745;
}

.amount-negative {
  color: #dc3545;
}

.amount-expired {
  color: #6c757d;
}

/* 規則說明 */
.rules-list {
  margin: 0;
}

.rule-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  padding: 0.5rem 0;
}

.rule-item:last-child {
  margin-bottom: 0;
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

/* 響應式設計 */
@media (max-width: 576px) {
  .content-wrapper {
    padding-top: 70px;
  }

  .points-overview-card {
    flex-direction: column;
    text-align: center;
    padding: 1.5rem;
  }

  .points-icon {
    margin-right: 0;
    margin-bottom: 1rem;
  }

  .points-info {
    margin-bottom: 1rem;
  }

  .points-actions {
    margin-left: 0;
  }

  .point-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .point-info {
    width: 100%;
    margin-bottom: 0.75rem;
  }

  .point-status {
    text-align: left;
    min-width: auto;
  }

  .history-item {
    flex-wrap: wrap;
  }

  .history-amount {
    width: 100%;
    text-align: left;
    margin-top: 0.5rem;
  }
}
</style>
