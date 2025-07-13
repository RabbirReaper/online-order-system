<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <router-link :to="`/admin/${brandId}/orders`" class="btn btn-outline-secondary">
        <i class="bi bi-arrow-left me-1"></i>返回訂單管理
      </router-link>
    </div>

    <!-- 篩選條件 -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row align-items-center">
          <div class="col-md-3">
            <label class="form-label">開始日期</label>
            <input
              type="date"
              class="form-control"
              v-model="filters.fromDate"
              @change="handleDateChange"
            />
          </div>
          <div class="col-md-3">
            <label class="form-label">結束日期</label>
            <input
              type="date"
              class="form-control"
              v-model="filters.toDate"
              @change="handleDateChange"
            />
          </div>
          <div class="col-md-4">
            <label class="form-label">選擇店鋪</label>
            <select
              class="form-select"
              v-model="filters.selectedStoreId"
              @change="handleFilterChange"
            >
              <option value="all">所有店鋪</option>
              <option v-for="store in stores" :key="store._id" :value="store._id">
                {{ store.name }}
              </option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label">&nbsp;</label>
            <div class="d-flex gap-2">
              <button class="btn btn-primary" @click="applyFilters" :disabled="loading">
                <i class="bi bi-search me-1"></i>查詢
              </button>
              <button class="btn btn-outline-secondary" @click="resetFilters">
                <i class="bi bi-arrow-clockwise me-1"></i>重置
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 載入中提示 -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">載入中...</span>
      </div>
      <p>正在載入報表資料...</p>
    </div>

    <!-- 錯誤提示 -->
    <div v-else-if="error" class="alert alert-danger mb-4">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ errorMessage }}
      <button class="btn btn-sm btn-danger ms-3" @click="fetchData">重試</button>
    </div>

    <!-- 圖表區域 -->
    <div v-else-if="allOrders.length > 0">
      <!-- 第一排：雙軸圖 -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <RevenueOrdersDualAxisChart :chart-data="revenueOrdersData" :height="400" />
            </div>
          </div>
        </div>
      </div>

      <!-- 第二排：週營業額趨勢 + 各店比較 -->
      <div class="row mb-4">
        <div class="col-md-6">
          <div class="card h-100">
            <div class="card-body">
              <WeeklyRevenueTrendChart :chart-data="weeklyTrendData" :height="350" />
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card h-100">
            <div class="card-body">
              <StoreComparisonChart :chart-data="storeComparisonData" :height="350" />
            </div>
          </div>
        </div>
      </div>

      <!-- 第三排：回購率 + 單品生命週期 -->
      <div class="row mb-4">
        <div class="col-md-6">
          <div class="card h-100">
            <div class="card-body">
              <CustomerRetentionChart :chart-data="customerRetentionData" :height="350" />
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card h-100">
            <div class="card-body">
              <DishLifecycleChart :chart-data="dishLifecycleData" :height="350" />
            </div>
          </div>
        </div>
      </div>

      <!-- 第四排：客單價分佈 + 訂單/付款方式圓餅圖 -->
      <div class="row mb-4">
        <div class="col-md-6">
          <div class="card h-100">
            <div class="card-body">
              <OrderValueDistributionChart :chart-data="orderValueData" :height="350" />
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card h-100">
            <div class="card-body">
              <OrderTypesPieChart :order-types="orderTypesData" :height="300" />
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card h-100">
            <div class="card-body">
              <PaymentMethodsPieChart :payment-methods="paymentMethodsData" :height="300" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 無資料提示 -->
    <div v-else-if="!loading" class="alert alert-info text-center mb-4">
      <i class="bi bi-info-circle me-2"></i>
      所選時間範圍內沒有訂單資料
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api'
import RevenueOrdersDualAxisChart from '@/components/BrandAdmin/Order/Charts/RevenueOrdersDualAxisChart.vue'
import WeeklyRevenueTrendChart from '@/components/BrandAdmin/Order/Charts/WeeklyRevenueTrendChart.vue'
import StoreComparisonChart from '@/components/BrandAdmin/Order/Charts/StoreComparisonChart.vue'
import CustomerRetentionChart from '@/components/BrandAdmin/Order/Charts/CustomerRetentionChart.vue'
import DishLifecycleChart from '@/components/BrandAdmin/Order/Charts/DishLifecycleChart.vue'
import OrderValueDistributionChart from '@/components/BrandAdmin/Order/Charts/OrderValueDistributionChart.vue'
import OrderTypesPieChart from '@/components/BrandAdmin/Order/Charts/OrderTypesPieChart.vue'
import PaymentMethodsPieChart from '@/components/BrandAdmin/Order/Charts/PaymentMethodsPieChart.vue'

const route = useRoute()
const brandId = computed(() => route.params.brandId)

// 狀態管理
const loading = ref(true)
const error = ref(false)
const errorMessage = ref('')
const stores = ref([])
const allOrders = ref([])

// 篩選條件
const filters = reactive({
  fromDate: '',
  toDate: '',
  selectedStoreId: 'all',
})

// 日期處理函數
const formatDate = (date) => {
  return date.toISOString().split('T')[0]
}

const initializeDateRange = () => {
  const today = new Date()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(today.getDate() - 30)

  filters.fromDate = formatDate(thirtyDaysAgo)
  filters.toDate = formatDate(today)
}

// 計算圖表數據
const revenueOrdersData = computed(() => {
  if (!allOrders.value.length) return { labels: [], datasets: [] }

  // 按週統計營業額和訂單數
  const weeklyStats = {}

  allOrders.value.forEach((order) => {
    const date = new Date(order.createdAt)
    const weekKey = getWeekKey(date)

    if (!weeklyStats[weekKey]) {
      weeklyStats[weekKey] = {
        revenue: 0,
        orders: 0,
        weekStart: getWeekStart(date),
      }
    }

    weeklyStats[weekKey].revenue += order.total || 0
    weeklyStats[weekKey].orders += 1
  })

  const sortedWeeks = Object.entries(weeklyStats).sort(([a], [b]) => new Date(a) - new Date(b))

  return {
    labels: sortedWeeks.map(([key, data]) => formatWeekLabel(data.weekStart)),
    revenue: sortedWeeks.map(([key, data]) => data.revenue),
    orders: sortedWeeks.map(([key, data]) => data.orders),
    averageOrderValue: sortedWeeks.map(([key, data]) =>
      data.orders > 0 ? data.revenue / data.orders : 0,
    ),
  }
})

const weeklyTrendData = computed(() => {
  if (!allOrders.value.length) return { datasets: [] }

  // 獲取過去5週的數據
  const weeks = getLast5Weeks()
  const datasets = []

  weeks.forEach((week, index) => {
    const weekData = getWeekRevenueData(week.start, week.end)
    datasets.push({
      label: week.label,
      data: weekData,
      borderColor: getWeekColor(index),
      backgroundColor: getWeekColor(index, 0.1),
      tension: 0.4,
      weekInfo: week,
    })
  })

  return { datasets }
})

const storeComparisonData = computed(() => {
  if (!allOrders.value.length || !stores.value.length) return { labels: [], datasets: [] }

  const storeStats = {}

  // 如果選擇了特定店鋪，只顯示該店鋪
  if (filters.selectedStoreId && filters.selectedStoreId !== 'all') {
    const selectedStore = stores.value.find((s) => s._id === filters.selectedStoreId)
    if (selectedStore) {
      const storeOrders = allOrders.value.filter((order) => order.store === filters.selectedStoreId)
      const revenue = storeOrders.reduce((sum, order) => sum + (order.total || 0), 0)
      const orderCount = storeOrders.length

      storeStats[selectedStore._id] = {
        name: selectedStore.name,
        revenue,
        orders: orderCount,
        averageValue: orderCount > 0 ? revenue / orderCount : 0,
      }
    }
  } else {
    // 顯示所有店鋪的比較
    stores.value.forEach((store) => {
      const storeOrders = allOrders.value.filter((order) => order.store === store._id)
      const revenue = storeOrders.reduce((sum, order) => sum + (order.total || 0), 0)
      const orderCount = storeOrders.length

      storeStats[store._id] = {
        name: store.name,
        revenue,
        orders: orderCount,
        averageValue: orderCount > 0 ? revenue / orderCount : 0,
      }
    })
  }

  const storeArray = Object.values(storeStats).sort((a, b) => b.revenue - a.revenue)

  return {
    labels: storeArray.map((store) => store.name),
    revenue: storeArray.map((store) => store.revenue),
    orders: storeArray.map((store) => store.orders),
    averageValue: storeArray.map((store) => store.averageValue),
  }
})

const customerRetentionData = computed(() => {
  // 這裡需要複雜的用戶分析邏輯
  // 暫時返回模擬數據
  const days = getDaysInRange()
  return {
    labels: days.map((day) =>
      day.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }),
    ),
    newCustomerRate: days.map(() => Math.random() * 100),
    returnCustomerRate: days.map(() => Math.random() * 100),
  }
})

const dishLifecycleData = computed(() => {
  if (!allOrders.value.length) return { labels: [], datasets: [] }

  // 統計每道菜的週銷量
  const dishWeeklyStats = {}
  const weeks = getWeeksInRange()

  allOrders.value.forEach((order) => {
    const orderWeek = getWeekKey(new Date(order.createdAt))

    if (order.items && order.items.length > 0) {
      order.items.forEach((item) => {
        const dishName = getDishName(item)
        const quantity = item.quantity || 1

        if (!dishWeeklyStats[dishName]) {
          dishWeeklyStats[dishName] = {}
        }

        dishWeeklyStats[dishName][orderWeek] =
          (dishWeeklyStats[dishName][orderWeek] || 0) + quantity
      })
    }
  })

  // 只顯示銷量前5的菜品
  const topDishes = Object.entries(dishWeeklyStats)
    .map(([name, weekData]) => ({
      name,
      totalSales: Object.values(weekData).reduce((sum, qty) => sum + qty, 0),
      weekData,
    }))
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 5)

  const datasets = topDishes.map((dish, index) => ({
    label: dish.name,
    data: weeks.map((week) => dish.weekData[week] || 0),
    borderColor: getDishColor(index),
    backgroundColor: getDishColor(index, 0.1),
    tension: 0.4,
  }))

  return {
    labels: weeks.map((week) => formatWeekLabel(new Date(week))),
    datasets,
  }
})

const orderValueData = computed(() => {
  if (!allOrders.value.length) return { labels: [], data: [] }

  // 計算客單價分佈
  const intervals = [
    { min: 0, max: 100, label: '$0-100' },
    { min: 101, max: 200, label: '$101-200' },
    { min: 201, max: 300, label: '$201-300' },
    { min: 301, max: 500, label: '$301-500' },
    { min: 501, max: 1000, label: '$501-1000' },
    { min: 1001, max: Infinity, label: '$1000+' },
  ]

  const distribution = intervals.map((interval) => {
    const count = allOrders.value.filter((order) => {
      const total = order.total || 0
      return total >= interval.min && total <= interval.max
    }).length

    return {
      label: interval.label,
      count,
      percentage: ((count / allOrders.value.length) * 100).toFixed(1),
    }
  })

  return {
    labels: distribution.map((d) => d.label),
    data: distribution.map((d) => d.count),
    percentages: distribution.map((d) => d.percentage),
  }
})

const orderTypesData = computed(() => {
  const types = {}

  allOrders.value.forEach((order) => {
    const displayType = formatOrderType(order.orderType)
    types[displayType] = (types[displayType] || 0) + 1
  })

  return types
})

const paymentMethodsData = computed(() => {
  const methods = {}

  allOrders.value.forEach((order) => {
    const displayMethod = formatPaymentMethod(order.paymentMethod)
    methods[displayMethod] = (methods[displayMethod] || 0) + 1
  })

  return methods
})

// 輔助函數
const getWeekKey = (date) => {
  const weekStart = getWeekStart(date)
  return weekStart.toISOString().split('T')[0]
}

const getWeekStart = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day // Sunday is 0
  return new Date(d.setDate(diff))
}

const formatWeekLabel = (weekStart) => {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  return `${weekStart.getMonth() + 1}/${weekStart.getDate()}-${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`
}

const getLast5Weeks = () => {
  const weeks = []
  const today = new Date()

  for (let i = 0; i < 5; i++) {
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - (today.getDay() + i * 7))

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    weeks.unshift({
      start: weekStart,
      end: weekEnd,
      label: i === 0 ? '本週' : `${i}週前`,
    })
  }

  return weeks
}

const getWeekRevenueData = (weekStart, weekEnd) => {
  const dailyData = Array(7).fill(0) // Mon-Sun

  allOrders.value.forEach((order) => {
    const orderDate = new Date(order.createdAt)
    if (orderDate >= weekStart && orderDate <= weekEnd) {
      const dayOfWeek = (orderDate.getDay() + 6) % 7 // Convert to Mon=0, Tue=1, etc.
      dailyData[dayOfWeek] += order.total || 0
    }
  })

  return dailyData
}

const getWeekColor = (index, alpha = 1) => {
  const colors = [
    `rgba(52, 152, 219, ${alpha})`, // 藍色 - 本週
    `rgba(149, 165, 166, ${alpha})`, // 灰色 - 上週
    `rgba(155, 89, 182, ${alpha})`, // 紫色
    `rgba(230, 126, 34, ${alpha})`, // 橙色
    `rgba(231, 76, 60, ${alpha})`, // 紅色
  ]
  return colors[index] || colors[0]
}

const getDishColor = (index, alpha = 1) => {
  const colors = [
    `rgba(52, 152, 219, ${alpha})`,
    `rgba(46, 204, 113, ${alpha})`,
    `rgba(155, 89, 182, ${alpha})`,
    `rgba(241, 196, 15, ${alpha})`,
    `rgba(230, 126, 34, ${alpha})`,
  ]
  return colors[index] || colors[0]
}

const getDaysInRange = () => {
  const days = []
  const start = new Date(filters.fromDate)
  const end = new Date(filters.toDate)

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d))
  }

  return days
}

const getWeeksInRange = () => {
  const weeks = []
  const start = new Date(filters.fromDate)
  const end = new Date(filters.toDate)

  let current = getWeekStart(start)
  while (current <= end) {
    weeks.push(getWeekKey(current))
    current.setDate(current.getDate() + 7)
  }

  return weeks
}

const getDishName = (item) => {
  if (!item || !item.dishInstance) return '未知餐點'

  if (typeof item.dishInstance === 'object') {
    return item.dishInstance.name || '未知餐點'
  }

  return '未知餐點'
}

const formatOrderType = (type) => {
  const typeMap = {
    dine_in: '內用',
    takeout: '外帶',
    delivery: '外送',
  }
  return typeMap[type] || type
}

const formatPaymentMethod = (method) => {
  const methodMap = {
    cash: '現金',
    credit_card: '信用卡',
    line_pay: 'LINE Pay',
    other: '其他',
  }
  return methodMap[method] || method || '未設定'
}

// API 調用
const fetchStores = async () => {
  try {
    console.log('開始獲取店鋪列表，brandId:', brandId.value)

    const response = await api.store.getAllStores({
      brandId: brandId.value,
      activeOnly: true,
    })

    console.log('店鋪API響應:', response)

    if (response && response.stores) {
      stores.value = response.stores
      console.log('成功載入店鋪:', stores.value.length, '間店鋪')
      console.log(
        '店鋪列表:',
        stores.value.map((s) => ({ id: s._id, name: s.name })),
      )
    } else {
      console.warn('API響應格式異常:', response)
      stores.value = []
    }
  } catch (err) {
    console.error('獲取店鋪列表失敗:', err)
    if (err.response) {
      console.error('錯誤詳情:', err.response.status, err.response.data)
    }
    stores.value = []
    throw err
  }
}

const fetchAllOrders = async () => {
  try {
    let combinedOrders = []

    if (filters.selectedStoreId && filters.selectedStoreId !== 'all') {
      // 查詢特定店鋪
      console.log('查詢特定店鋪:', filters.selectedStoreId)
      const response = await api.orderAdmin.getStoreOrders({
        brandId: brandId.value,
        storeId: filters.selectedStoreId,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        page: 1,
        limit: 1000,
      })

      console.log('特定店鋪查詢結果:', response)
      if (response.success) {
        combinedOrders = response.orders || []
      }
    } else {
      // 查詢所有店鋪
      console.log('查詢所有店鋪，店鋪列表:', stores.value)
      if (stores.value.length === 0) {
        console.warn('店鋪列表為空，無法查詢訂單')
        allOrders.value = []
        return
      }

      const allOrdersPromises = stores.value.map((store) => {
        console.log('查詢店鋪:', store._id, store.name)
        return api.orderAdmin.getStoreOrders({
          brandId: brandId.value,
          storeId: store._id,
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          page: 1,
          limit: 1000,
        })
      })

      const responses = await Promise.all(allOrdersPromises)
      console.log('所有店鋪查詢結果:', responses)

      combinedOrders = responses.flatMap((response) => {
        if (response.success && response.orders) {
          return response.orders
        }
        return []
      })
    }

    console.log('最終合併的訂單數據:', combinedOrders.length, combinedOrders)
    allOrders.value = combinedOrders
  } catch (err) {
    console.error('獲取訂單失敗:', err)
    if (err.response) {
      console.error('錯誤響應:', err.response.data)
    }
    throw err
  }
}

const fetchData = async () => {
  loading.value = true
  error.value = false
  errorMessage.value = ''

  try {
    console.log('開始獲取報表數據...')
    console.log('當前篩選條件:', filters)
    console.log('可用店鋪列表:', stores.value.length)

    // 如果選擇"所有店鋪"但沒有店鋪數據，跳過查詢
    if (filters.selectedStoreId === 'all' && stores.value.length === 0) {
      console.warn('選擇了所有店鋪但沒有可用的店鋪數據，跳過訂單查詢')
      allOrders.value = []
      return
    }

    await fetchAllOrders()
    console.log('報表數據獲取完成，訂單數量:', allOrders.value.length)
  } catch (err) {
    console.error('獲取報表數據失敗:', err)
    error.value = true
    errorMessage.value = err.response?.data?.message || '載入資料失敗'
  } finally {
    loading.value = false
  }
}

// 事件處理
const handleDateChange = () => {
  if (filters.fromDate && filters.toDate) {
    if (new Date(filters.fromDate) > new Date(filters.toDate)) {
      alert('開始日期不能晚於結束日期')
      return
    }
    applyFilters()
  }
}

const handleFilterChange = () => {
  applyFilters()
}

const applyFilters = () => {
  fetchData()
}

const resetFilters = () => {
  filters.selectedStoreId = 'all'
  initializeDateRange()
  fetchData()
}

// 生命週期
onMounted(async () => {
  console.log('報表頁面載入開始...')

  // 1. 初始化日期範圍
  initializeDateRange()
  console.log('日期範圍初始化完成:', filters.fromDate, 'to', filters.toDate)

  try {
    // 2. 載入店鋪列表
    console.log('開始載入店鋪列表...')
    await fetchStores()
    console.log('店鋪列表載入完成，店鋪數量:', stores.value.length)

    // 3. 載入報表資料
    console.log('開始載入報表資料...')
    await fetchData()
    console.log('報表資料載入完成')
  } catch (error) {
    console.error('初始化失敗:', error)
    error.value = true
    errorMessage.value = '初始化失敗，請重新整理頁面'
    loading.value = false
  }
})
</script>

<style scoped>
.table th {
  border-top: none;
  font-weight: 600;
  background-color: #f8f9fa;
}

.card {
  border: 1px solid rgba(0, 0, 0, 0.125);
  margin-bottom: 1.5rem;
}

.card-body {
  padding: 1.5rem;
}
</style>
