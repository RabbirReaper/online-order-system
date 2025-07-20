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
            <button
              class="btn btn-outline-primary btn-sm"
              @click="refreshData"
              :disabled="isRefreshing"
            >
              <span
                v-if="isRefreshing"
                class="spinner-border spinner-border-sm me-1"
                role="status"
                aria-hidden="true"
              ></span>
              <i v-else class="bi bi-arrow-clockwise me-1"></i>重新整理
            </button>
          </div>
        </div>

        <!-- 點數即將過期提醒 -->
        <div v-if="expiringPointsGroups.length > 0" class="expiring-alert">
          <div class="alert alert-warning">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            <strong>提醒：</strong> 您有 {{ expiringPointsTotal }} 點數將在近期過期，請儘早使用。
          </div>
        </div>

        <!-- 獲得點數明細 -->
        <div class="points-detail-card">
          <div class="card-header">
            <h5 class="mb-0"><i class="bi bi-plus-circle-fill text-success me-2"></i>獲得點數</h5>
            <small class="text-muted">按到期時間排序（即將到期優先）</small>
          </div>
          <div class="card-body">
            <div v-if="groupedEarnedPoints.length > 0" class="points-list">
              <div v-for="(record, index) in groupedEarnedPoints" :key="index" class="point-item">
                <div class="point-info">
                  <div class="point-amount">
                    <span class="amount">{{ record.amount }}</span>
                    <span class="unit">點</span>
                  </div>
                  <div class="point-details">
                    <p class="point-source">{{ formatPointSource(record.source) }}</p>
                    <p class="point-date">獲得時間：{{ formatDate(record.createdAt) }}</p>
                  </div>
                </div>
                <div class="point-status">
                  <span :class="getExpiryUrgencyClass(record.expiryDate)">
                    {{ getExpiryStatus(record.expiryDate) }}
                  </span>
                  <p class="expiry-date">到期日：{{ formatDate(record.expiryDate) }}</p>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-4">
              <i class="bi bi-star text-muted" style="font-size: 3rem"></i>
              <p class="text-muted mt-2">目前沒有可用點數</p>
            </div>
          </div>
        </div>

        <!-- 使用點數記錄 -->
        <div class="points-history-card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <div>
              <h5 class="mb-0"><i class="bi bi-dash-circle-fill text-primary me-2"></i>使用記錄</h5>
              <small class="text-muted">按使用時間排序（最近使用優先）</small>
            </div>
            <button
              class="btn btn-sm btn-outline-secondary"
              @click="loadMoreHistory"
              :disabled="isLoadingHistory || !hasMoreHistory"
              v-if="groupedUsedPoints.length > 0"
            >
              <span
                v-if="isLoadingHistory"
                class="spinner-border spinner-border-sm me-1"
                role="status"
                aria-hidden="true"
              ></span>
              {{ hasMoreHistory ? '載入更多' : '沒有更多' }}
            </button>
          </div>
          <div class="card-body">
            <div v-if="groupedUsedPoints.length > 0" class="history-list">
              <div v-for="(record, index) in groupedUsedPoints" :key="index" class="history-item">
                <div class="history-icon">
                  <i class="bi bi-dash-circle-fill text-primary"></i>
                </div>
                <div class="history-info">
                  <p class="history-title">{{ formatPointSource(record.source) }}</p>
                  <p class="history-date">使用時間：{{ formatDateTime(record.usedAt) }}</p>
                  <p class="history-order" v-if="record.usedIn">訂單：{{ record.usedIn.id }}</p>
                </div>
                <div class="history-amount">
                  <span class="amount-negative">-{{ record.amount }}</span>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-4">
              <i class="bi bi-clock-history text-muted" style="font-size: 3rem"></i>
              <p class="text-muted mt-2">目前沒有使用記錄</p>
            </div>
          </div>
        </div>

        <!-- 過期點數記錄 -->
        <div class="points-expired-card" v-if="groupedExpiredPoints.length > 0">
          <div class="card-header">
            <h5 class="mb-0"><i class="bi bi-x-circle-fill text-danger me-2"></i>過期點數</h5>
            <small class="text-muted">按過期時間排序</small>
          </div>
          <div class="card-body">
            <div class="expired-list">
              <div
                v-for="(record, index) in groupedExpiredPoints"
                :key="index"
                class="expired-item"
              >
                <div class="expired-icon">
                  <i class="bi bi-x-circle-fill text-danger"></i>
                </div>
                <div class="expired-info">
                  <p class="expired-title">{{ formatPointSource(record.source) }}</p>
                  <p class="expired-date">過期時間：{{ formatDate(record.expiryDate) }}</p>
                </div>
                <div class="expired-amount">
                  <span class="amount-expired">{{ record.amount }} 點</span>
                </div>
              </div>
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
              <div class="rule-item">
                <i class="bi bi-check-circle-fill text-success me-2"></i>
                點數獲得後立即生效，可立即使用
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/customerAuth'
import api from '@/api'

// 路由
const router = useRouter()
const authStore = useAuthStore()

// 狀態管理
const isLoading = ref(true)
const isRefreshing = ref(false)
const isLoadingHistory = ref(false)
const errorMessage = ref('')

// 點數資料
const pointsBalance = ref(0)
const pointsHistory = ref([])

// 分頁相關
const currentHistoryPage = ref(1)
const hasMoreHistory = ref(false)
const historyLimit = ref(200)

// 獲得點數（按到期時間排序：快到期優先）
const groupedEarnedPoints = computed(() => {
  const earnedPoints = pointsHistory.value.filter((point) => point.status === 'active')
  return earnedPoints.sort((a, b) => {
    const dateA = new Date(a.expiryDate || a.createdAt)
    const dateB = new Date(b.expiryDate || b.createdAt)
    return dateA - dateB // 升序：快到期優先
  })
})

// 使用點數（按使用時間排序：最近使用優先）
const groupedUsedPoints = computed(() => {
  const usedPoints = pointsHistory.value.filter((point) => point.status === 'used')
  return usedPoints.sort((a, b) => {
    const dateA = new Date(a.usedAt || a.createdAt)
    const dateB = new Date(b.usedAt || b.createdAt)
    return dateB - dateA // 降序：最近優先
  })
})

// 過期點數（按過期時間排序）
const groupedExpiredPoints = computed(() => {
  const expiredPoints = pointsHistory.value.filter((point) => point.status === 'expired')
  return expiredPoints.sort((a, b) => {
    const dateA = new Date(a.expiryDate || a.createdAt)
    const dateB = new Date(b.expiryDate || b.createdAt)
    return dateB - dateA // 降序
  })
})

// 即將過期的點數 (30天內)
const expiringPointsGroups = computed(() => {
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  return groupedEarnedPoints.value.filter((record) => {
    const expiryDate = new Date(record.expiryDate)
    return expiryDate <= thirtyDaysFromNow
  })
})

const expiringPointsTotal = computed(() => {
  return expiringPointsGroups.value.reduce((total, record) => total + (record.amount || 0), 0)
})

// 返回上一頁
const goBack = () => {
  router.push('/member')
}

// 格式化點數來源
const formatPointSource = (source) => {
  const sourceMap = {
    滿額贈送: '滿額贈送',
    purchase_reward: '消費獎勵',
    sign_up_bonus: '註冊獎勵',
    referral_bonus: '推薦獎勵',
    admin_grant: '管理員給予',
    order_reward: '訂單獎勵',
    first_purchase: '首次消費獎勵',
    birthday_bonus: '生日獎勵',
  }
  return sourceMap[source] || source
}

// 獲取到期狀態
const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return '永久有效'

  const now = new Date()
  const expiry = new Date(expiryDate)
  const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return '已過期'
  if (diffDays === 0) return '今日過期'
  if (diffDays <= 3) return `${diffDays}天後過期`
  if (diffDays <= 7) return '一週內過期'
  if (diffDays <= 30) return '一個月內過期'

  return '有效'
}

// 獲取到期緊急程度樣式
const getExpiryUrgencyClass = (expiryDate) => {
  if (!expiryDate) return 'badge bg-info'

  const now = new Date()
  const expiry = new Date(expiryDate)
  const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'badge bg-secondary'
  if (diffDays <= 3) return 'badge bg-danger'
  if (diffDays <= 7) return 'badge bg-warning'
  if (diffDays <= 30) return 'badge bg-info'

  return 'badge bg-success'
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未設定'

  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '無效日期'

  return date.toLocaleDateString('zh-TW')
}

// 格式化日期時間
const formatDateTime = (dateString) => {
  if (!dateString) return '未設定'

  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '無效日期'

  return date.toLocaleString('zh-TW')
}

// 重新整理資料
const refreshData = async () => {
  try {
    isRefreshing.value = true
    await loadPointsData()
  } catch (error) {
    console.error('重新整理點數資料失敗:', error)
  } finally {
    isRefreshing.value = false
  }
}

// 載入更多歷史記錄
const loadMoreHistory = async () => {
  if (!hasMoreHistory.value || isLoadingHistory.value) {
    return
  }

  try {
    isLoadingHistory.value = true

    if (!authStore.currentBrandId) {
      throw new Error('無法獲取品牌資訊')
    }

    const nextPage = currentHistoryPage.value + 1
    const response = await api.promotion.getUserPointHistory(authStore.currentBrandId, {
      page: nextPage,
      limit: historyLimit.value,
    })

    if (response.records && response.records.length > 0) {
      pointsHistory.value = [...pointsHistory.value, ...response.records]
      currentHistoryPage.value = nextPage
      hasMoreHistory.value = response.pagination.hasNextPage
    } else {
      hasMoreHistory.value = false
    }
  } catch (error) {
    console.error('載入更多歷史記錄失敗:', error)
    errorMessage.value = '載入更多記錄失敗'
  } finally {
    isLoadingHistory.value = false
  }
}

// 載入點數資料
const loadPointsData = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''

    if (!authStore.currentBrandId) {
      throw new Error('無法獲取品牌資訊')
    }

    // 檢查用戶是否已登入
    if (!authStore.isLoggedIn) {
      throw new Error('請先登入以查看點數資料')
    }

    // 並行獲取點數餘額和歷史記錄
    const [balanceResponse, historyResponse] = await Promise.all([
      api.promotion.getUserPointsBalance(authStore.currentBrandId),
      api.promotion.getUserPointHistory(authStore.currentBrandId, {
        page: 1,
        limit: historyLimit.value,
      }),
    ])

    // 設置點數餘額
    if (balanceResponse !== undefined && balanceResponse !== null) {
      pointsBalance.value =
        typeof balanceResponse === 'number' ? balanceResponse : balanceResponse.balance || 0
    }

    // 設置歷史記錄
    if (historyResponse) {
      pointsHistory.value = historyResponse.records || []
      currentHistoryPage.value = 1
      hasMoreHistory.value = historyResponse.pagination?.hasNextPage || false
    }
  } catch (error) {
    console.error('載入點數資料失敗:', error)

    if (error.response) {
      if (error.response.status === 401) {
        errorMessage.value = '請先登入以查看點數資料'
      } else if (error.response.data && error.response.data.message) {
        errorMessage.value = error.response.data.message
      } else {
        errorMessage.value = `載入失敗：${error.response.status}`
      }
    } else if (error.message) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = '無法載入點數資料，請稍後再試'
    }
  } finally {
    isLoading.value = false
  }
}

// 組件掛載後載入資料
onMounted(async () => {
  // 確保認證狀態是最新的
  if (!authStore.isLoggedIn) {
    await authStore.checkAuthStatus()
  }

  // 等待下一個tick，確保組件完全掛載
  await nextTick()

  // 載入點數資料
  await loadPointsData()
})
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
.points-expired-card,
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
.history-list,
.expired-list {
  margin: -0.5rem;
}

.point-item,
.history-item,
.expired-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #f1f1f1;
  margin: 0;
}

.point-item:last-child,
.history-item:last-child,
.expired-item:last-child {
  border-bottom: none;
}

.point-info,
.history-info,
.expired-info {
  flex: 1;
}

.point-info {
  display: flex;
  align-items: center;
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

.point-source,
.history-title,
.expired-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
  color: #333;
}

.point-date,
.history-date,
.expired-date {
  font-size: 0.85rem;
  color: #6c757d;
  margin: 0;
}

.history-order {
  font-size: 0.8rem;
  color: #999;
  margin: 0.25rem 0 0 0;
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
.history-icon,
.expired-icon {
  margin-right: 1rem;
  width: 40px;
  text-align: center;
}

.history-icon i,
.expired-icon i {
  font-size: 1.2rem;
}

.history-amount,
.expired-amount {
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

  .history-item,
  .expired-item {
    flex-wrap: wrap;
  }

  .history-amount,
  .expired-amount {
    width: 100%;
    text-align: left;
    margin-top: 0.5rem;
  }
}
</style>
