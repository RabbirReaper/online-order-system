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
            <button class="btn btn-outline-primary btn-sm" @click="refreshData">
              <i class="bi bi-arrow-clockwise me-1"></i>重新整理
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
              <div v-for="(point, index) in pointsDetail" :key="index" class="point-item">
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
            <button class="btn btn-sm btn-outline-secondary" @click="loadMoreHistory" :disabled="isLoadingHistory">
              <span v-if="isLoadingHistory" class="spinner-border spinner-border-sm me-1" role="status"
                aria-hidden="true"></span>
              載入更多
            </button>
          </div>
          <div class="card-body">
            <div v-if="pointsHistory.length > 0" class="history-list">
              <div v-for="(record, index) in pointsHistory" :key="index" class="history-item">
                <div class="history-icon">
                  <i :class="getHistoryIcon(record.type)"></i>
                </div>
                <div class="history-info">
                  <p class="history-title">{{ formatHistoryTitle(record.type) }}</p>
                  <p class="history-desc">{{ record.description }}</p>
                  <p class="history-date">{{ formatDateTime(record.createdAt) }}</p>
                </div>
                <div class="history-amount">
                  <span :class="getAmountClass(record.type)">
                    {{ record.type === 'earned' ? '+' : '-' }}{{ record.amount }}
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
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

// 路由
const router = useRouter();

// 狀態管理
const isLoading = ref(true);
const isLoadingHistory = ref(false);
const errorMessage = ref('');

// 點數資料 (使用假資料)
const pointsBalance = ref(1250);
const pointsDetail = ref([
  {
    amount: 500,
    source: '滿額贈送',
    status: 'active',
    createdAt: '2024-11-15T10:30:00Z',
    expiryDate: '2025-11-15T23:59:59Z'
  },
  {
    amount: 300,
    source: '滿額贈送',
    status: 'active',
    createdAt: '2024-10-20T14:15:00Z',
    expiryDate: '2025-10-20T23:59:59Z'
  },
  {
    amount: 450,
    source: '滿額贈送',
    status: 'active',
    createdAt: '2024-09-10T16:45:00Z',
    expiryDate: '2025-09-10T23:59:59Z'
  }
]);

const pointsHistory = ref([
  {
    type: 'used',
    amount: 200,
    description: '訂單折抵 - 雞排便當',
    createdAt: '2024-12-01T12:30:00Z'
  },
  {
    type: 'earned',
    amount: 150,
    description: '滿額贈送 - 消費滿$1500',
    createdAt: '2024-11-28T18:20:00Z'
  },
  {
    type: 'used',
    amount: 100,
    description: '訂單折抵 - 珍珠奶茶',
    createdAt: '2024-11-25T15:10:00Z'
  },
  {
    type: 'earned',
    amount: 300,
    description: '滿額贈送 - 消費滿$3000',
    createdAt: '2024-11-20T11:40:00Z'
  },
  {
    type: 'expired',
    amount: 50,
    description: '點數過期失效',
    createdAt: '2024-11-15T00:00:00Z'
  }
]);

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

// 返回上一頁
const goBack = () => {
  router.push('/member');
};

// 格式化點數來源
const formatPointSource = (source) => {
  const sourceMap = {
    '滿額贈送': '滿額贈送'
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
const formatHistoryTitle = (type) => {
  const titleMap = {
    'earned': '獲得點數',
    'used': '使用點數',
    'expired': '點數過期'
  };
  return titleMap[type] || type;
};

// 獲取歷史記錄圖標
const getHistoryIcon = (type) => {
  const iconMap = {
    'earned': 'bi bi-plus-circle-fill text-success',
    'used': 'bi bi-dash-circle-fill text-primary',
    'expired': 'bi bi-x-circle-fill text-danger'
  };
  return iconMap[type] || 'bi bi-circle-fill text-secondary';
};

// 獲取金額樣式
const getAmountClass = (type) => {
  const amountClasses = {
    'earned': 'amount-positive',
    'used': 'amount-negative',
    'expired': 'amount-expired'
  };
  return amountClasses[type] || 'amount-neutral';
};

// 重新整理資料
const refreshData = async () => {
  try {
    isLoading.value = true;

    // TODO: 後續實作 API 調用
    // const response = await api.promotion.getUserPoints(brandId.value);
    // pointsBalance.value = response.balance;
    // pointsDetail.value = response.details;

    // 模擬載入延遲
    await new Promise(resolve => setTimeout(resolve, 1000));

  } catch (error) {
    console.error('重新整理點數資料失敗:', error);
    errorMessage.value = '無法載入點數資料，請稍後再試';
  } finally {
    isLoading.value = false;
  }
};

// 載入更多歷史記錄
const loadMoreHistory = async () => {
  try {
    isLoadingHistory.value = true;

    // TODO: 後續實作 API 調用
    // const response = await api.promotion.getUserPointHistory({
    //   brandId: brandId.value,
    //   page: currentPage + 1
    // });
    // pointsHistory.value = [...pointsHistory.value, ...response.records];

    // 模擬載入延遲
    await new Promise(resolve => setTimeout(resolve, 500));

  } catch (error) {
    console.error('載入更多歷史記錄失敗:', error);
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

    // TODO: 後續實作 API 調用
    // const [balanceResponse, historyResponse] = await Promise.all([
    //   api.promotion.getUserPoints(currentBrandId),
    //   api.promotion.getUserPointHistory(currentBrandId)
    // ]);

    // pointsBalance.value = balanceResponse.balance;
    // pointsDetail.value = balanceResponse.details;
    // pointsHistory.value = historyResponse.records;

    // 模擬載入延遲
    await new Promise(resolve => setTimeout(resolve, 1000));

  } catch (error) {
    console.error('載入點數資料失敗:', error);

    if (error.response && error.response.data) {
      errorMessage.value = error.response.data.message || '無法載入點數資料';
    } else {
      errorMessage.value = '無法載入點數資料，請稍後再試';
    }
  } finally {
    isLoading.value = false;
  }
};

// 組件掛載後載入資料
onMounted(() => {
  loadPointsData();
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
