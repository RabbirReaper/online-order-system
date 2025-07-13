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
      <!-- 頁面頂部工具列 -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">{{ brandName }} 品牌儀表板</h4>
        <div class="btn-group">
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
          <router-link :to="`/admin/${brandId}/stores`" class="btn btn-primary">
            <i class="bi bi-shop me-1"></i>管理店鋪
          </router-link>
        </div>
      </div>

      <!-- 統計卡片 -->
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="card h-100 border-primary">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="text-primary mb-0">店鋪數量</h6>
                  <p class="small text-muted mb-1">品牌旗下店鋪</p>
                </div>
                <div class="rounded-circle bg-primary bg-opacity-10 p-3">
                  <i class="bi bi-shop text-primary fs-4"></i>
                </div>
              </div>
              <h2 class="mt-3">{{ stats.storeCount }}</h2>
              <div class="small mt-2">
                <span class="badge bg-success me-1">
                  <i class="bi bi-check-circle me-1"></i>{{ stats.activeStoreCount }} 間啟用中
                </span>
                <span
                  class="badge bg-secondary"
                  v-if="stats.storeCount - stats.activeStoreCount > 0"
                >
                  <i class="bi bi-dash-circle me-1"></i
                  >{{ stats.storeCount - stats.activeStoreCount }} 間已停用
                </span>
              </div>
            </div>
            <div class="card-footer bg-white border-0">
              <router-link
                :to="`/admin/${brandId}/stores`"
                class="btn btn-sm btn-outline-primary w-100"
              >
                查看店鋪列表
              </router-link>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card h-100 border-success">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="text-success mb-0">本週銷售額</h6>
                  <p class="small text-muted mb-1">所有店鋪總計</p>
                </div>
                <div class="rounded-circle bg-success bg-opacity-10 p-3">
                  <i class="bi bi-cash text-success fs-4"></i>
                </div>
              </div>
              <h2 class="mt-3">NT$ {{ formatNumber(stats.weeklySales || 0) }}</h2>
              <div class="small mt-2">
                <span class="badge bg-success me-1" v-if="stats.salesGrowth > 0">
                  <i class="bi bi-graph-up me-1"></i>較上週 +{{ stats.salesGrowth.toFixed(1) }}%
                </span>
                <span class="badge bg-danger me-1" v-else-if="stats.salesGrowth < 0">
                  <i class="bi bi-graph-down me-1"></i>較上週 {{ stats.salesGrowth.toFixed(1) }}%
                </span>
                <span class="badge bg-secondary" v-else>
                  <i class="bi bi-dash me-1"></i>與上週持平
                </span>
              </div>
            </div>
            <div class="card-footer bg-white border-0">
              <router-link
                :to="`/admin/${brandId}/orders/reports`"
                class="btn btn-sm btn-outline-success w-100"
              >
                查看詳細報表
              </router-link>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card h-100 border-info">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="text-info mb-0">本週訂單數</h6>
                  <p class="small text-muted mb-1">所有店鋪總計</p>
                </div>
                <div class="rounded-circle bg-info bg-opacity-10 p-3">
                  <i class="bi bi-receipt text-info fs-4"></i>
                </div>
              </div>
              <h2 class="mt-3">{{ formatNumber(stats.weeklyOrders || 0) }}</h2>
              <div class="small mt-2">
                <span class="badge bg-info me-1">
                  <i class="bi bi-people me-1"></i>客單價 NT$
                  {{ formatNumber(stats.averageOrderValue || 0) }}
                </span>
              </div>
            </div>
            <div class="card-footer bg-white border-0">
              <router-link
                :to="`/admin/${brandId}/orders`"
                class="btn btn-sm btn-outline-info w-100"
              >
                查看訂單列表
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- 店鋪概覽 -->
      <div class="card mb-4">
        <div class="card-header bg-white d-flex justify-content-between align-items-center py-3">
          <h5 class="mb-0">店鋪概覽</h5>
          <router-link :to="`/admin/${brandId}/stores/create`" class="btn btn-sm btn-primary">
            <i class="bi bi-plus-circle me-1"></i>新增店鋪
          </router-link>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0 align-middle">
              <thead class="table-light">
                <tr>
                  <th>店鋪名稱</th>
                  <th>狀態</th>
                  <th>營業時間</th>
                  <th>本週銷售額</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="store in stores" :key="store._id">
                  <td>
                    <div class="d-flex align-items-center">
                      <div class="store-img me-2">
                        <img
                          :src="store.image?.url || '/placeholder.jpg'"
                          :alt="store.name"
                          class="rounded"
                        />
                      </div>
                      <div>
                        <h6 class="mb-0">{{ store.name }}</h6>
                        <span class="small text-muted"
                          >菜單: {{ store.menuId ? '已設定' : '未設定' }}</span
                        >
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      class="badge rounded-pill"
                      :class="store.isActive ? 'bg-success' : 'bg-secondary'"
                    >
                      {{ store.isActive ? '營業中' : '已停業' }}
                    </span>
                  </td>
                  <td>
                    <div v-if="isTodayOpen(store)">
                      <span class="text-success small">
                        <i class="bi bi-clock me-1"></i>
                        今日營業: {{ formatBusinessHours(getTodayBusinessHours(store)) }}
                      </span>
                    </div>
                    <div v-else>
                      <span class="text-danger small">
                        <i class="bi bi-calendar-x me-1"></i>
                        今日公休
                      </span>
                    </div>
                  </td>
                  <td>
                    <div class="d-flex flex-column">
                      <span>NT$ {{ formatNumber(getStoreSales(store._id)) }}</span>
                      <small
                        :class="
                          getStoreGrowth(store._id) > 0
                            ? 'text-success'
                            : getStoreGrowth(store._id) < 0
                              ? 'text-danger'
                              : 'text-muted'
                        "
                      >
                        <i
                          class="bi"
                          :class="
                            getStoreGrowth(store._id) > 0
                              ? 'bi-arrow-up'
                              : getStoreGrowth(store._id) < 0
                                ? 'bi-arrow-down'
                                : 'bi-dash'
                          "
                        ></i>
                        {{ getStoreGrowth(store._id) > 0 ? '+' : ''
                        }}{{ getStoreGrowth(store._id).toFixed(1) }}%
                      </small>
                    </div>
                  </td>
                  <td>
                    <div class="btn-group">
                      <router-link
                        :to="`/admin/${brandId}/stores/detail/${store._id}`"
                        class="btn btn-sm btn-outline-primary"
                      >
                        <i class="bi bi-eye"></i>
                      </router-link>
                      <router-link
                        :to="`/admin/${brandId}/stores/edit/${store._id}`"
                        class="btn btn-sm btn-outline-primary"
                      >
                        <i class="bi bi-pencil"></i>
                      </router-link>
                      <router-link
                        :to="`/admin/${brandId}/inventory?storeId=${store._id}`"
                        class="btn btn-sm btn-outline-primary"
                      >
                        <i class="bi bi-box-seam"></i>
                      </router-link>
                    </div>
                  </td>
                </tr>
                <tr v-if="stores.length === 0">
                  <td colspan="5" class="text-center py-4">
                    <div class="text-muted">尚未創建任何店鋪</div>
                    <router-link
                      :to="`/admin/${brandId}/stores/create`"
                      class="btn btn-sm btn-primary mt-2"
                    >
                      <i class="bi bi-plus-circle me-1"></i>新增第一間店鋪
                    </router-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="card-footer bg-white text-center" v-if="stores.length > 5">
          <router-link :to="`/admin/${brandId}/stores`" class="text-decoration-none">
            查看全部 {{ stats.storeCount }} 間店鋪 <i class="bi bi-chevron-right"></i>
          </router-link>
        </div>
      </div>

      <!-- 最近訂單 -->
      <div class="card mb-4">
        <div class="card-header bg-white d-flex justify-content-between align-items-center py-3">
          <h5 class="mb-0">最近訂單</h5>
          <router-link :to="`/admin/${brandId}/orders`" class="btn btn-sm btn-primary">
            <i class="bi bi-list-ul me-1"></i>查看全部
          </router-link>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0 align-middle">
              <thead class="table-light">
                <tr>
                  <th>訂單編號</th>
                  <th>店鋪</th>
                  <th>取餐方式</th>
                  <th>金額</th>
                  <th>狀態</th>
                  <th>下單時間</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in recentOrders" :key="order._id">
                  <td>
                    <span class="fw-medium">{{ getOrderNumber(order) }}</span>
                  </td>
                  <td>{{ order.storeName }}</td>
                  <td>{{ formatOrderType(order.orderType) }}</td>
                  <td>NT$ {{ formatNumber(order.total) }}</td>
                  <td>
                    <span class="badge rounded-pill" :class="getOrderStatusClass(order.status)">
                      {{ getOrderStatusText(order.status) }}
                    </span>
                  </td>
                  <td>{{ formatDate(order.createdAt) }}</td>
                </tr>
                <tr v-if="recentOrders.length === 0">
                  <td colspan="6" class="text-center py-4">
                    <div class="text-muted">尚無訂單記錄</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="card-footer bg-white text-center" v-if="recentOrders.length > 0">
          <router-link :to="`/admin/${brandId}/orders`" class="text-decoration-none">
            查看全部訂單 <i class="bi bi-chevron-right"></i>
          </router-link>
        </div>
      </div>

      <!-- 快速操作區 -->
      <div class="row g-3 mb-4">
        <div class="col-md-6 col-lg-3">
          <router-link :to="`/admin/${brandId}/menus`" class="card action-card h-100">
            <div class="card-body d-flex flex-column align-items-center justify-content-center p-4">
              <div class="icon-circle bg-primary bg-opacity-10 mb-3">
                <i class="bi bi-menu-button-wide text-primary"></i>
              </div>
              <h5 class="card-title mb-2">菜單管理</h5>
              <p class="text-muted text-center small mb-0">管理店鋪菜單與餐點項目</p>
            </div>
          </router-link>
        </div>

        <div class="col-md-6 col-lg-3">
          <router-link :to="`/admin/${brandId}/inventory`" class="card action-card h-100">
            <div class="card-body d-flex flex-column align-items-center justify-content-center p-4">
              <div class="icon-circle bg-success bg-opacity-10 mb-3">
                <i class="bi bi-box-seam text-success"></i>
              </div>
              <h5 class="card-title mb-2">庫存管理</h5>
              <p class="text-muted text-center small mb-0">監控與管理店鋪餐點庫存</p>
            </div>
          </router-link>
        </div>

        <div class="col-md-6 col-lg-3">
          <router-link :to="`/admin/${brandId}/coupons`" class="card action-card h-100">
            <div class="card-body d-flex flex-column align-items-center justify-content-center p-4">
              <div class="icon-circle bg-warning bg-opacity-10 mb-3">
                <i class="bi bi-ticket-perforated text-warning"></i>
              </div>
              <h5 class="card-title mb-2">促銷管理</h5>
              <p class="text-muted text-center small mb-0">設置優惠券與點數規則</p>
            </div>
          </router-link>
        </div>

        <div class="col-md-6 col-lg-3">
          <router-link :to="`/admin/${brandId}/orders/reports`" class="card action-card h-100">
            <div class="card-body d-flex flex-column align-items-center justify-content-center p-4">
              <div class="icon-circle bg-info bg-opacity-10 mb-3">
                <i class="bi bi-bar-chart text-info"></i>
              </div>
              <h5 class="card-title mb-2">銷售報表</h5>
              <p class="text-muted text-center small mb-0">查看詳細銷售數據與分析</p>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api'

// 從路由中獲取品牌ID
const route = useRoute()
const brandId = computed(() => route.params.brandId)

// 狀態變數
const isLoading = ref(true)
const isRefreshing = ref(false)
const error = ref('')
const brandName = ref('')
const stores = ref([])
const recentOrders = ref([])
const stats = ref({
  storeCount: 0,
  activeStoreCount: 0,
  weeklySales: 0,
  salesGrowth: 0,
  weeklyOrders: 0,
  averageOrderValue: 0,
})
const orderTypeMap = {
  dine_in: '內用',
  takeout: '外帶',
  delivery: '外送',
  foodpanda: 'Foodpanda',
  ubereats: 'UberEats',
}

// 店鋪銷售數據
const storeSalesData = ref({})

// 格式化數字 (加入千位分隔符)
const formatNumber = (num) => {
  return new Intl.NumberFormat('zh-TW').format(num)
}

// 獲取當天星期幾 (0-6，0代表星期日)
const getTodayDayOfWeek = () => {
  return new Date().getDay()
}

// 獲取當天的營業時間
const getTodayBusinessHours = (store) => {
  if (!store.businessHours || store.businessHours.length === 0) {
    return null
  }

  const today = getTodayDayOfWeek()
  const todayHours = store.businessHours.find((h) => h.day === today)

  return todayHours
}

// 檢查今天是否營業
const isTodayOpen = (store) => {
  const todayHours = getTodayBusinessHours(store)
  return todayHours && !todayHours.isClosed && todayHours.periods && todayHours.periods.length > 0
}

// 格式化營業時間
const formatBusinessHours = (businessHours) => {
  if (!businessHours || !businessHours.periods || businessHours.periods.length === 0) {
    return '無資料'
  }

  return businessHours.periods
    .map((period) => {
      return `${period.open}-${period.close}`
    })
    .join(', ')
}

const formatOrderType = (orderType) => {
  return orderTypeMap[orderType] || '其他'
}

// 獲取店鋪本週銷售額
const getStoreSales = (storeId) => {
  return storeSalesData.value[storeId]?.weeklySales || 0
}

// 獲取店鋪銷售成長率
const getStoreGrowth = (storeId) => {
  return storeSalesData.value[storeId]?.salesGrowth || 0
}

// 獲取訂單編號
const getOrderNumber = (order) => {
  if (order.platformOrderId) return order.platformOrderId
  if (order.orderDateCode && order.sequence) {
    return `${order.orderDateCode}-${String(order.sequence).padStart(3, '0')}`
  }
  return order._id || ''
}

// 根據訂單狀態返回對應的樣式類
const getOrderStatusClass = (status) => {
  switch (status) {
    case 'paid':
      return 'bg-success'
    case 'unpaid':
      return 'bg-warning'
    case 'cancelled':
      return 'bg-danger'
    default:
      return 'bg-secondary'
  }
}

// 根據訂單狀態返回對應的文字
const getOrderStatusText = (status) => {
  switch (status) {
    case 'paid':
      return '已付款'
    case 'unpaid':
      return '未付款'
    case 'cancelled':
      return '已取消'
    default:
      return '未知'
  }
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '無資料'

  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 日期處理函數
const getWeekStart = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day // Sunday is 0
  return new Date(d.setDate(diff))
}

const getWeekEnd = (date) => {
  const weekStart = getWeekStart(date)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  return weekEnd
}

const formatDateForAPI = (date) => {
  return date.toISOString().split('T')[0]
}

// 獲取店鋪列表
const fetchStores = async () => {
  try {
    const response = await api.store.getAllStores({ brandId: brandId.value })
    if (response && response.stores) {
      stores.value = response.stores.slice(0, 5) // 僅顯示前5間店鋪

      // 更新統計數據
      stats.value.storeCount = response.stores.length
      stats.value.activeStoreCount = response.stores.filter((store) => store.isActive).length
    }
  } catch (err) {
    console.error('獲取店鋪列表失敗:', err)
    throw err
  }
}

// 獲取訂單數據並計算統計
const fetchOrdersAndCalculateStats = async () => {
  try {
    // 獲取本週和上週的日期範圍
    const today = new Date()
    const thisWeekStart = getWeekStart(today)
    const thisWeekEnd = getWeekEnd(today)

    const lastWeekStart = new Date(thisWeekStart)
    lastWeekStart.setDate(thisWeekStart.getDate() - 7)
    const lastWeekEnd = new Date(thisWeekEnd)
    lastWeekEnd.setDate(thisWeekEnd.getDate() - 7)

    // 獲取所有店鋪列表（如果還沒有的話）
    if (stores.value.length === 0) {
      const storesResponse = await api.store.getAllStores({ brandId: brandId.value })
      if (storesResponse && storesResponse.stores) {
        stores.value = storesResponse.stores
      }
    }

    // 獲取本週訂單
    const thisWeekOrdersPromises = stores.value.map((store) =>
      api.orderAdmin
        .getStoreOrders({
          brandId: brandId.value,
          storeId: store._id,
          fromDate: formatDateForAPI(thisWeekStart),
          toDate: formatDateForAPI(thisWeekEnd),
          page: 1,
          limit: 1000,
        })
        .catch((err) => {
          console.warn(`獲取店鋪 ${store._id} 本週訂單失敗:`, err)
          return { success: false, orders: [] }
        }),
    )

    // 獲取上週訂單
    const lastWeekOrdersPromises = stores.value.map((store) =>
      api.orderAdmin
        .getStoreOrders({
          brandId: brandId.value,
          storeId: store._id,
          fromDate: formatDateForAPI(lastWeekStart),
          toDate: formatDateForAPI(lastWeekEnd),
          page: 1,
          limit: 1000,
        })
        .catch((err) => {
          console.warn(`獲取店鋪 ${store._id} 上週訂單失敗:`, err)
          return { success: false, orders: [] }
        }),
    )

    const [thisWeekResponses, lastWeekResponses] = await Promise.all([
      Promise.all(thisWeekOrdersPromises),
      Promise.all(lastWeekOrdersPromises),
    ])

    // 合併本週訂單
    const thisWeekOrders = thisWeekResponses.flatMap((response) => {
      if (response.success && response.orders) {
        return response.orders.map((order) => ({
          ...order,
          storeName: stores.value.find((s) => s._id === order.store)?.name || '未知店鋪',
        }))
      }
      return []
    })

    // 合併上週訂單
    const lastWeekOrders = lastWeekResponses.flatMap((response) => {
      if (response.success && response.orders) {
        return response.orders
      }
      return []
    })

    // 計算統計數據
    const thisWeekSales = thisWeekOrders.reduce((sum, order) => sum + (order.total || 0), 0)
    const lastWeekSales = lastWeekOrders.reduce((sum, order) => sum + (order.total || 0), 0)
    const thisWeekOrderCount = thisWeekOrders.length

    stats.value.weeklySales = thisWeekSales
    stats.value.weeklyOrders = thisWeekOrderCount
    stats.value.averageOrderValue = thisWeekOrderCount > 0 ? thisWeekSales / thisWeekOrderCount : 0
    stats.value.salesGrowth =
      lastWeekSales > 0 ? ((thisWeekSales - lastWeekSales) / lastWeekSales) * 100 : 0

    // 計算每個店鋪的銷售數據
    stores.value.forEach((store) => {
      const storeThisWeekOrders = thisWeekOrders.filter((order) => order.store === store._id)
      const storeLastWeekOrders = lastWeekOrders.filter((order) => order.store === store._id)

      const storeThisWeekSales = storeThisWeekOrders.reduce(
        (sum, order) => sum + (order.total || 0),
        0,
      )
      const storeLastWeekSales = storeLastWeekOrders.reduce(
        (sum, order) => sum + (order.total || 0),
        0,
      )

      storeSalesData.value[store._id] = {
        weeklySales: storeThisWeekSales,
        salesGrowth:
          storeLastWeekSales > 0
            ? ((storeThisWeekSales - storeLastWeekSales) / storeLastWeekSales) * 100
            : 0,
      }
    })

    // 設置最近訂單（按時間排序，取前5筆）
    recentOrders.value = thisWeekOrders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
  } catch (err) {
    console.error('獲取訂單數據失敗:', err)
    throw err
  }
}

// 加載數據
const loadData = async (isRefresh = false) => {
  if (!brandId.value) return

  if (isRefresh) {
    isRefreshing.value = true
  } else {
    isLoading.value = true
  }

  error.value = ''

  try {
    // 獲取品牌信息
    const brandResponse = await api.brand.getBrandById(brandId.value)
    if (brandResponse && brandResponse.brand) {
      brandName.value = brandResponse.brand.name
    }

    // 獲取店鋪列表
    await fetchStores()

    // 獲取訂單數據並計算統計
    await fetchOrdersAndCalculateStats()
  } catch (err) {
    console.error('獲取數據失敗:', err)
    error.value = '無法載入數據，請稍後再試'
  } finally {
    isLoading.value = false
    isRefreshing.value = false
  }
}

// 刷新數據
const refreshData = () => {
  loadData(true)
}

// 生命週期鉤子
onMounted(() => {
  loadData()
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

/* 店鋪圖片 */
.store-img {
  width: 40px;
  height: 40px;
  overflow: hidden;
}

.store-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 操作卡片 */
.action-card {
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid #dee2e6;
  text-decoration: none;
  color: inherit;
}

.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-circle i {
  font-size: 1.75rem;
}

/* 頁面內標題 */
h5.card-title {
  font-weight: 600;
}

/* 表格樣式優化 */
.table th {
  font-weight: 600;
}

.table td,
.table th {
  padding: 0.75rem 1rem;
}
</style>
