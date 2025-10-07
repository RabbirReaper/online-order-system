<template>
  <div>
    <!-- 載入中提示 -->
    <div class="d-flex justify-content-center my-5" v-if="isLoading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加載中...</span>
      </div>
    </div>

    <!-- 錯誤提示 -->
    <div class="alert alert-danger" v-if="error">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ error }}
    </div>

    <div v-if="!isLoading && !error">
      <!-- 頁面頂部 -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">{{ dashboardTitle }} 營業儀表板</h4>
        <button class="btn btn-outline-secondary" @click="refreshData" :disabled="isRefreshing">
          <span
            v-if="isRefreshing"
            class="spinner-border spinner-border-sm me-1"
            role="status"
            aria-hidden="true"
          ></span>
          <i v-else class="bi bi-arrow-clockwise me-1"></i>
          {{ isRefreshing ? '刷新中...' : '刷新數據' }}
        </button>
      </div>

      <!-- 時間選擇按鈕 -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="d-flex flex-wrap gap-2">
            <button
              class="btn btn-outline-primary"
              :class="{ active: currentPeriod === 'today' }"
              @click="setPeriod('today')"
            >
              今日
            </button>
            <button
              class="btn btn-outline-primary"
              :class="{ active: currentPeriod === 'yesterday' }"
              @click="setPeriod('yesterday')"
            >
              昨日
            </button>
            <button
              class="btn btn-outline-primary"
              :class="{ active: currentPeriod === 'thisWeek' }"
              @click="setPeriod('thisWeek')"
            >
              本週
            </button>
            <button
              class="btn btn-outline-primary"
              :class="{ active: currentPeriod === 'lastWeek' }"
              @click="setPeriod('lastWeek')"
            >
              上週
            </button>
            <button
              class="btn btn-outline-primary"
              :class="{ active: currentPeriod === 'thisMonth' }"
              @click="setPeriod('thisMonth')"
            >
              本月
            </button>
            <button
              class="btn btn-outline-primary"
              :class="{ active: currentPeriod === 'lastMonth' }"
              @click="setPeriod('lastMonth')"
            >
              上個月
            </button>
          </div>
          <div class="mt-2 text-muted small">
            {{ formatDateRange(dateRange.fromDate, dateRange.toDate) }}
          </div>
        </div>
      </div>

      <!-- 第一排：營業額與訂單數 -->
      <div class="row mb-4">
        <!-- 營業額總覽 -->
        <div class="col-md-6">
          <div class="card h-100">
            <div class="card-header bg-white py-3">
              <h5 class="mb-0"><i class="bi bi-cash-stack text-success me-2"></i>營業額總覽</h5>
            </div>
            <div class="card-body">
              <div class="text-center py-4 mb-4 border-bottom">
                <i class="bi bi-cash-coin display-1 text-success mb-3"></i>
                <h2 class="text-success mb-1 mt-3 fw-bold">
                  NT$ {{ formatNumber(revenueStats.total) }}
                </h2>
                <p class="text-muted mb-0">總營業額</p>
              </div>
              <div class="row g-3">
                <div class="col-md-6">
                  <div class="stat-card">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <p class="text-muted mb-1 small">內用</p>
                        <h5 class="mb-0">NT$ {{ formatNumber(revenueStats.dineIn) }}</h5>
                      </div>
                      <i class="bi bi-shop text-primary fs-2"></i>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="stat-card">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <p class="text-muted mb-1 small">自取</p>
                        <h5 class="mb-0">NT$ {{ formatNumber(revenueStats.takeout) }}</h5>
                      </div>
                      <i class="bi bi-bag text-success fs-2"></i>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="stat-card">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <p class="text-muted mb-1 small">外送</p>
                        <h5 class="mb-0">NT$ {{ formatNumber(revenueStats.delivery) }}</h5>
                      </div>
                      <i class="bi bi-truck text-info fs-2"></i>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="stat-card">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <p class="text-muted mb-1 small">Foodpanda</p>
                        <h5 class="mb-0">NT$ {{ formatNumber(revenueStats.foodpanda) }}</h5>
                      </div>
                      <i class="bi bi-bicycle text-danger fs-2"></i>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="stat-card">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <p class="text-muted mb-1 small">UberEats</p>
                        <h5 class="mb-0">NT$ {{ formatNumber(revenueStats.ubereats) }}</h5>
                      </div>
                      <i class="bi bi-scooter text-dark fs-2"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 訂單數總覽 -->
        <div class="col-md-6">
          <div class="card h-100">
            <div class="card-header bg-white py-3">
              <h5 class="mb-0"><i class="bi bi-receipt text-primary me-2"></i>訂單數總覽</h5>
            </div>
            <div class="card-body">
              <div class="text-center py-4 mb-4 border-bottom">
                <i class="bi bi-receipt-cutoff display-1 text-primary mb-3"></i>
                <h2 class="text-primary mb-1 mt-3 fw-bold">{{ orderStats.total }}</h2>
                <p class="text-muted mb-0">總訂單數</p>
              </div>
              <div class="row g-3">
                <div class="col-md-6">
                  <div class="stat-card">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <p class="text-muted mb-1 small">內用</p>
                        <h5 class="mb-0">{{ orderStats.dineIn }} 筆</h5>
                      </div>
                      <i class="bi bi-shop text-primary fs-2"></i>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="stat-card">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <p class="text-muted mb-1 small">自取</p>
                        <h5 class="mb-0">{{ orderStats.takeout }} 筆</h5>
                      </div>
                      <i class="bi bi-bag text-success fs-2"></i>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="stat-card">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <p class="text-muted mb-1 small">外送</p>
                        <h5 class="mb-0">{{ orderStats.delivery }} 筆</h5>
                      </div>
                      <i class="bi bi-truck text-info fs-2"></i>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="stat-card">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <p class="text-muted mb-1 small">Foodpanda</p>
                        <h5 class="mb-0">{{ orderStats.foodpanda }} 筆</h5>
                      </div>
                      <i class="bi bi-bicycle text-danger fs-2"></i>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="stat-card">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <p class="text-muted mb-1 small">UberEats</p>
                        <h5 class="mb-0">{{ orderStats.ubereats }} 筆</h5>
                      </div>
                      <i class="bi bi-scooter text-dark fs-2"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 第二排：付款方式與實際收入 -->
      <div class="row mb-4">
        <!-- 付款方式圓餅圖 -->
        <div class="col-md-6">
          <div class="card h-100">
            <div class="card-header bg-white py-3">
              <h5 class="mb-0"><i class="bi bi-credit-card text-info me-2"></i>付款方式分布</h5>
            </div>
            <div class="card-body">
              <PaymentMethodsPieChart :payment-methods="paymentMethodsData" :height="400" />
            </div>
          </div>
        </div>

        <!-- 店家實際收入 -->
        <div class="col-md-6">
          <div class="card h-100">
            <div
              class="card-header bg-white d-flex justify-content-between align-items-center py-3"
            >
              <h5 class="mb-0"><i class="bi bi-wallet2 text-warning me-2"></i>店家實際收入估算</h5>
              <button class="btn btn-sm btn-outline-primary" @click="openCommissionSettings">
                <i class="bi bi-gear me-1"></i>調整抽成
              </button>
            </div>
            <div class="card-body">
              <div class="text-center py-3 mb-4 bg-light rounded">
                <h3 class="mb-1 fw-bold">NT$ {{ formatNumber(actualIncomeStats.total) }}</h3>
                <p class="text-muted mb-0">扣除平台抽成後</p>
              </div>

              <div class="mb-3">
                <div class="d-flex justify-content-between mb-2">
                  <span>總營業額:</span>
                  <span class="fw-bold">NT$ {{ formatNumber(revenueStats.total) }}</span>
                </div>
                <hr />
              </div>

              <div class="mb-3">
                <h6 class="mb-3">平台抽成明細</h6>
                <div class="mb-2">
                  <div class="d-flex justify-content-between text-muted small mb-1">
                    <span>Foodpanda ({{ commissionRates.foodpanda }}%)</span>
                    <span>-NT$ {{ formatNumber(actualIncomeStats.foodpandaDeduction) }}</span>
                  </div>
                  <div class="progress" style="height: 6px">
                    <div
                      class="progress-bar bg-danger"
                      :style="{
                        width:
                          revenueStats.total > 0
                            ? ((revenueStats.foodpanda / revenueStats.total) * 100).toFixed(1) + '%'
                            : '0%',
                      }"
                    ></div>
                  </div>
                </div>

                <div class="mb-2">
                  <div class="d-flex justify-content-between text-muted small mb-1">
                    <span>UberEats ({{ commissionRates.ubereats }}%)</span>
                    <span>-NT$ {{ formatNumber(actualIncomeStats.uberEatsDeduction) }}</span>
                  </div>
                  <div class="progress" style="height: 6px">
                    <div
                      class="progress-bar bg-dark"
                      :style="{
                        width:
                          revenueStats.total > 0
                            ? ((revenueStats.ubereats / revenueStats.total) * 100).toFixed(1) + '%'
                            : '0%',
                      }"
                    ></div>
                  </div>
                </div>

                <div class="mb-2">
                  <div class="d-flex justify-content-between text-muted small mb-1">
                    <span>線上付款手續費 ({{ commissionRates.onlinePayment }}%)</span>
                    <span>-NT$ {{ formatNumber(actualIncomeStats.onlinePaymentFee) }}</span>
                  </div>
                  <div class="progress" style="height: 6px">
                    <div
                      class="progress-bar bg-info"
                      :style="{
                        width:
                          revenueStats.total > 0
                            ? (
                                (actualIncomeStats.onlinePaymentFee / revenueStats.total) *
                                100
                              ).toFixed(1) + '%'
                            : '0%',
                      }"
                    ></div>
                  </div>
                </div>
              </div>

              <div class="bg-light p-3 rounded">
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted">總扣除金額:</span>
                  <span class="text-danger fw-bold"
                    >-NT$ {{ formatNumber(actualIncomeStats.totalDeduction) }}</span
                  >
                </div>
                <div class="d-flex justify-content-between">
                  <span class="fw-bold">實際收入:</span>
                  <span class="text-success fw-bold"
                    >NT$ {{ formatNumber(actualIncomeStats.total) }}</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 抽成設定彈窗 (改用 BModal) -->
    <BModal
      v-model="showCommissionSettings"
      id="commissionSettingsModal"
      title="平台抽成設定"
      centered
      @ok="saveCommissionSettings"
      @cancel="cancelCommissionSettings"
      no-close-on-backdrop
      no-close-on-esc
    >
      <div class="mb-3">
        <label class="form-label">Foodpanda 抽成比例 (%)</label>
        <input
          type="number"
          class="form-control"
          v-model.number="tempCommissionRates.foodpanda"
          min="0"
          max="100"
          step="0.1"
        />
        <small class="text-muted">預設: 25%</small>
      </div>
      <div class="mb-3">
        <label class="form-label">UberEats 抽成比例 (%)</label>
        <input
          type="number"
          class="form-control"
          v-model.number="tempCommissionRates.ubereats"
          min="0"
          max="100"
          step="0.1"
        />
        <small class="text-muted">預設: 34%</small>
      </div>
      <div class="mb-3">
        <label class="form-label">線上付款手續費 (%)</label>
        <input
          type="number"
          class="form-control"
          v-model.number="tempCommissionRates.onlinePayment"
          min="0"
          max="100"
          step="0.1"
        />
        <small class="text-muted">預設: 3%</small>
      </div>

      <template #footer>
        <BButton variant="secondary" @click="cancelCommissionSettings">取消</BButton>
        <BButton variant="primary" @click="saveCommissionSettings">儲存設定</BButton>
      </template>
    </BModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { BModal, BButton } from 'bootstrap-vue-next'
import api from '@/api'
import PaymentMethodsPieChart from '@/components/BrandAdmin/Order/Charts/PaymentMethodsPieChart.vue'
import { usePermissions } from '@/composables/usePermissions'

const route = useRoute()
const brandId = computed(() => route.params.brandId)

const { currentUserRole, currentStore, currentBrand, hasRole, PERMISSIONS } = usePermissions()

const isLoading = ref(true)
const isRefreshing = ref(false)
const error = ref('')
const brandName = ref('')
const stores = ref([])
const allOrders = ref([])
const currentPeriod = ref('today')
const showCommissionSettings = ref(false)

const dateRange = reactive({
  fromDate: '',
  toDate: '',
})

const commissionRates = reactive({
  foodpanda: 25,
  ubereats: 34,
  onlinePayment: 3,
})

const tempCommissionRates = reactive({
  foodpanda: 25,
  ubereats: 34,
  onlinePayment: 3,
})

const dashboardTitle = computed(() => {
  if (hasRole(PERMISSIONS.BRAND_ADMIN)) {
    return brandName.value || '品牌'
  } else if (currentStore.value) {
    return currentStore.value.name || '店鋪'
  }
  return '店鋪'
})

// 載入儲存的設定
const loadCommissionSettings = () => {
  const saved = localStorage.getItem(`commission_rates_${brandId.value}`)
  if (saved) {
    const rates = JSON.parse(saved)
    commissionRates.foodpanda = rates.foodpanda
    commissionRates.ubereats = rates.ubereats
    commissionRates.onlinePayment = rates.onlinePayment
  }
  tempCommissionRates.foodpanda = commissionRates.foodpanda
  tempCommissionRates.ubereats = commissionRates.ubereats
  tempCommissionRates.onlinePayment = commissionRates.onlinePayment
}

// 打開設定彈窗
const openCommissionSettings = () => {
  tempCommissionRates.foodpanda = commissionRates.foodpanda
  tempCommissionRates.ubereats = commissionRates.ubereats
  tempCommissionRates.onlinePayment = commissionRates.onlinePayment
  showCommissionSettings.value = true
}

// 儲存設定
const saveCommissionSettings = () => {
  commissionRates.foodpanda = tempCommissionRates.foodpanda
  commissionRates.ubereats = tempCommissionRates.ubereats
  commissionRates.onlinePayment = tempCommissionRates.onlinePayment

  localStorage.setItem(`commission_rates_${brandId.value}`, JSON.stringify(commissionRates))
  showCommissionSettings.value = false
}

// 取消設定
const cancelCommissionSettings = () => {
  tempCommissionRates.foodpanda = commissionRates.foodpanda
  tempCommissionRates.ubereats = commissionRates.ubereats
  tempCommissionRates.onlinePayment = commissionRates.onlinePayment
  showCommissionSettings.value = false
}

// 判斷訂單所屬平台
const getPlatform = (order) => {
  if (order.platformInfo?.platform) {
    return order.platformInfo.platform
  }
  if (order.orderType === 'delivery') {
    return 'direct'
  }
  return null
}

// 營業額統計
const revenueStats = computed(() => {
  const stats = {
    total: 0,
    dineIn: 0,
    takeout: 0,
    delivery: 0,
    foodpanda: 0,
    ubereats: 0,
  }

  allOrders.value.forEach((order) => {
    const amount = order.total || 0
    stats.total += amount

    const platform = getPlatform(order)

    if (order.orderType === 'dine_in') {
      stats.dineIn += amount
    } else if (order.orderType === 'takeout') {
      stats.takeout += amount
    } else if (order.orderType === 'delivery') {
      if (platform === 'foodpanda') {
        stats.foodpanda += amount
      } else if (platform === 'ubereats') {
        stats.ubereats += amount
      } else {
        stats.delivery += amount
      }
    }
  })

  return stats
})

// 訂單數統計
const orderStats = computed(() => {
  const stats = {
    total: allOrders.value.length,
    dineIn: 0,
    takeout: 0,
    delivery: 0,
    foodpanda: 0,
    ubereats: 0,
  }

  allOrders.value.forEach((order) => {
    const platform = getPlatform(order)

    if (order.orderType === 'dine_in') {
      stats.dineIn++
    } else if (order.orderType === 'takeout') {
      stats.takeout++
    } else if (order.orderType === 'delivery') {
      if (platform === 'foodpanda') {
        stats.foodpanda++
      } else if (platform === 'ubereats') {
        stats.ubereats++
      } else {
        stats.delivery++
      }
    }
  })

  return stats
})

// 付款方式統計（細分平台）
const paymentMethodsData = computed(() => {
  const methods = {}

  allOrders.value.forEach((order) => {
    const platform = getPlatform(order)
    let methodKey = ''

    if (order.status === 'unpaid') {
      methodKey = '未付款'
    } else {
      const baseMethod = formatPaymentMethod(order.paymentMethod)

      if (platform === 'foodpanda') {
        methodKey = `${baseMethod} (Foodpanda)`
      } else if (platform === 'ubereats') {
        methodKey = `UberEats`
      } else {
        methodKey = baseMethod
      }
    }

    methods[methodKey] = (methods[methodKey] || 0) + 1
  })

  return methods
})

// 實際收入計算
const actualIncomeStats = computed(() => {
  const foodpandaRevenue = revenueStats.value.foodpanda
  const uberEatsRevenue = revenueStats.value.ubereats
  const totalRevenue = revenueStats.value.total

  const foodpandaDeduction = (foodpandaRevenue * commissionRates.foodpanda) / 100
  const uberEatsDeduction = (uberEatsRevenue * commissionRates.ubereats) / 100

  let onlinePaymentRevenue = 0
  allOrders.value.forEach((order) => {
    const platform = getPlatform(order)

    if (
      platform !== 'foodpanda' &&
      platform !== 'ubereats' &&
      order.status === 'paid' &&
      order.paymentMethod &&
      order.paymentMethod !== 'cash'
    ) {
      onlinePaymentRevenue += order.total || 0
    }
  })

  const onlinePaymentFee = (onlinePaymentRevenue * commissionRates.onlinePayment) / 100

  const totalDeduction = foodpandaDeduction + uberEatsDeduction + onlinePaymentFee
  const actualIncome = totalRevenue - totalDeduction

  return {
    total: actualIncome,
    totalDeduction,
    foodpandaDeduction,
    uberEatsDeduction,
    onlinePaymentFee,
  }
})

// 格式化數字
const formatNumber = (num) => {
  return new Intl.NumberFormat('zh-TW').format(Math.round(num))
}

// 格式化付款方式
const formatPaymentMethod = (method) => {
  const methodMap = {
    cash: '現金',
    credit_card: '信用卡',
    line_pay: 'LINE Pay',
    other: '其他',
  }
  return methodMap[method] || method || '其他'
}

// 格式化日期範圍
const formatDateRange = (from, to) => {
  if (!from || !to) return ''
  const fromDate = new Date(from + 'T00:00:00')
  const toDate = new Date(to + 'T00:00:00')
  return `${fromDate.toLocaleDateString('zh-TW')} - ${toDate.toLocaleDateString('zh-TW')}`
}

// 設定時間範圍
const setPeriod = (period) => {
  currentPeriod.value = period
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  switch (period) {
    case 'today':
      dateRange.fromDate = formatDate(today)
      dateRange.toDate = formatDate(today)
      break
    case 'yesterday':
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)
      dateRange.fromDate = formatDate(yesterday)
      dateRange.toDate = formatDate(yesterday)
      break
    case 'thisWeek':
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      dateRange.fromDate = formatDate(weekStart)
      dateRange.toDate = formatDate(today)
      break
    case 'lastWeek':
      const lastWeekEnd = new Date(today)
      lastWeekEnd.setDate(today.getDate() - today.getDay() - 1)
      const lastWeekStart = new Date(lastWeekEnd)
      lastWeekStart.setDate(lastWeekEnd.getDate() - 6)
      dateRange.fromDate = formatDate(lastWeekStart)
      dateRange.toDate = formatDate(lastWeekEnd)
      break
    case 'thisMonth':
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      dateRange.fromDate = formatDate(monthStart)
      dateRange.toDate = formatDate(today)
      break
    case 'lastMonth':
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
      dateRange.fromDate = formatDate(lastMonthStart)
      dateRange.toDate = formatDate(lastMonthEnd)
      break
  }

  loadData(true)
}

// 格式化日期
const formatDate = (date) => {
  return date.toLocaleDateString('en-CA')
}

// 獲取品牌資訊
const fetchBrandInfo = async () => {
  try {
    const brandResponse = await api.brand.getBrandById(brandId.value)
    if (brandResponse && brandResponse.brand) {
      brandName.value = brandResponse.brand.name
    }
  } catch (err) {
    console.error('獲取品牌資訊失敗:', err)
  }
}

// 獲取店鋪列表
const fetchStores = async () => {
  try {
    const response = await api.store.getAllStores({ brandId: brandId.value })
    if (response && response.stores) {
      if (hasRole(PERMISSIONS.STORE_ADMIN) && !hasRole(PERMISSIONS.BRAND_ADMIN)) {
        if (currentStore.value && currentStore.value._id) {
          stores.value = response.stores.filter((store) => store._id === currentStore.value._id)
        } else {
          stores.value = []
        }
      } else {
        stores.value = response.stores
      }
    }
  } catch (err) {
    console.error('獲取店鋪列表失敗:', err)
    throw err
  }
}

// 獲取訂單資料
const fetchOrders = async () => {
  try {
    const allOrdersPromises = stores.value.map((store) =>
      api.orderAdmin
        .getStoreOrders({
          brandId: brandId.value,
          storeId: store._id,
          fromDate: dateRange.fromDate,
          toDate: dateRange.toDate,
          page: 1,
          limit: 10000,
        })
        .catch((err) => {
          console.warn(`獲取店鋪 ${store._id} 訂單失敗:`, err)
          return { success: false, orders: [] }
        }),
    )

    const responses = await Promise.all(allOrdersPromises)
    allOrders.value = responses.flatMap((response) => {
      if (response.success && response.orders) {
        return response.orders
      }
      return []
    })
  } catch (err) {
    console.error('獲取訂單資料失敗:', err)
    throw err
  }
}

// 載入資料
const loadData = async (isRefresh = false) => {
  if (!brandId.value) return

  if (isRefresh) {
    isRefreshing.value = true
  } else {
    isLoading.value = true
  }

  error.value = ''

  try {
    await fetchBrandInfo()
    await fetchStores()
    await fetchOrders()
  } catch (err) {
    console.error('獲取數據失敗:', err)
    error.value = '無法載入數據，請稍後再試'
  } finally {
    isLoading.value = false
    isRefreshing.value = false
  }
}

// 刷新資料
const refreshData = () => {
  loadData(true)
}

// 初始化
onMounted(() => {
  loadCommissionSettings()
  setPeriod('today')
})
</script>

<style scoped>
.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border: 1px solid rgba(0, 0, 0, 0.125);
}

.card-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.125);
}

.stat-card {
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  background-color: #f8f9fa;
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.btn-outline-primary.active {
  background-color: #0d6efd;
  border-color: #0d6efd;
  color: white;
}

h5.mb-0 {
  font-weight: 600;
}
</style>
