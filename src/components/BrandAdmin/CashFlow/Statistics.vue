<template>
  <div>
    <!-- 頁面標題 -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0">記帳統計報表</h5>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-primary" @click="refreshData">
          <i class="bi bi-arrow-clockwise me-1"></i>重新整理
        </button>
        <button class="btn btn-outline-success" @click="exportReport">
          <i class="bi bi-download me-1"></i>匯出報表
        </button>
      </div>
    </div>

    <!-- 時間範圍選擇 -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-md-3">
            <label class="form-label">統計範圍</label>
            <select class="form-select" v-model="dateRange" @change="updateStatistics">
              <option value="today">今天</option>
              <option value="week">本週</option>
              <option value="month">本月</option>
              <option value="quarter">本季</option>
              <option value="year">本年</option>
              <option value="custom">自訂範圍</option>
            </select>
          </div>
          <div class="col-md-3" v-if="dateRange === 'custom'">
            <label class="form-label">開始日期</label>
            <input type="date" class="form-control" v-model="customDateRange.start" />
          </div>
          <div class="col-md-3" v-if="dateRange === 'custom'">
            <label class="form-label">結束日期</label>
            <input type="date" class="form-control" v-model="customDateRange.end" />
          </div>
          <div class="col-md-3">
            <button class="btn btn-primary w-100" @click="updateStatistics">
              <i class="bi bi-bar-chart me-1"></i>更新統計
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 載入中提示 -->
    <div class="d-flex justify-content-center my-5" v-if="isLoading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">載入中...</span>
      </div>
    </div>

    <!-- 概覽卡片 -->
    <div class="row mb-4" v-if="!isLoading">
      <div class="col-md-3">
        <div class="card bg-success text-white">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <div>
                <h6 class="card-title">總收入</h6>
                <h4 class="mb-0">${{ summary.totalIncome.toLocaleString() }}</h4>
              </div>
              <div class="align-self-center">
                <i class="bi bi-arrow-up-circle fs-2"></i>
              </div>
            </div>
            <small class="opacity-75">{{ summary.incomeRecords }} 筆記錄</small>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-danger text-white">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <div>
                <h6 class="card-title">總支出</h6>
                <h4 class="mb-0">${{ summary.totalExpense.toLocaleString() }}</h4>
              </div>
              <div class="align-self-center">
                <i class="bi bi-arrow-down-circle fs-2"></i>
              </div>
            </div>
            <small class="opacity-75">{{ summary.expenseRecords }} 筆記錄</small>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-white" :class="summary.netAmount >= 0 ? 'bg-info' : 'bg-warning'">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <div>
                <h6 class="card-title">淨收益</h6>
                <h4 class="mb-0">${{ summary.netAmount.toLocaleString() }}</h4>
              </div>
              <div class="align-self-center">
                <i class="bi bi-wallet2 fs-2"></i>
              </div>
            </div>
            <small class="opacity-75">
              {{ summary.netAmount >= 0 ? '盈餘' : '虧損' }}
            </small>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-primary text-white">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <div>
                <h6 class="card-title">記錄總數</h6>
                <h4 class="mb-0">{{ summary.totalRecords }}</h4>
              </div>
              <div class="align-self-center">
                <i class="bi bi-list-ul fs-2"></i>
              </div>
            </div>
            <small class="opacity-75">{{ dateRangeText }}</small>
          </div>
        </div>
      </div>
    </div>

    <!-- 圖表區域 -->
    <div class="row mb-4" v-if="!isLoading">
      <!-- 收支趨勢圖 -->
      <div class="col-md-8">
        <div class="card">
          <div class="card-header">
            <h6 class="card-title mb-0">收支趨勢圖</h6>
          </div>
          <div class="card-body" style="height: 400px">
            <IncomeExpenseTrendChart :chartData="trendChartData" :height="350" />
          </div>
        </div>
      </div>

      <!-- 收支比例圓餅圖 -->
      <div class="col-md-4">
        <div class="card">
          <div class="card-header">
            <h6 class="card-title mb-0">收支比例</h6>
          </div>
          <div class="card-body" style="height: 400px">
            <IncomeExpensePieChart :summary="summary" :height="350" />
          </div>
        </div>
      </div>
    </div>

    <!-- 分類統計 -->
    <div class="row" v-if="!isLoading">
      <!-- 收入分類排行 -->
      <div class="col-md-6">
        <div class="card">
          <div class="card-header bg-success text-white">
            <h6 class="card-title mb-0"><i class="bi bi-arrow-up-circle me-2"></i>收入分類排行</h6>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th>排名</th>
                    <th>分類</th>
                    <th>金額</th>
                    <th>比例</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in incomeRanking" :key="item.categoryId">
                    <td>
                      <span class="badge bg-success">{{ index + 1 }}</span>
                    </td>
                    <td>{{ item.categoryName }}</td>
                    <td class="text-success fw-bold">${{ item.amount.toLocaleString() }}</td>
                    <td>
                      <div class="progress" style="height: 10px">
                        <div
                          class="progress-bar bg-success"
                          :style="{ width: item.percentage + '%' }"
                        ></div>
                      </div>
                      <small>{{ item.percentage }}%</small>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="card-body text-center py-4" v-if="incomeRanking.length === 0">
              <i class="bi bi-inbox text-muted fs-4"></i>
              <p class="text-muted mt-2 mb-0">暫無收入記錄</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 支出分類排行 -->
      <div class="col-md-6">
        <div class="card">
          <div class="card-header bg-danger text-white">
            <h6 class="card-title mb-0">
              <i class="bi bi-arrow-down-circle me-2"></i>支出分類排行
            </h6>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th>排名</th>
                    <th>分類</th>
                    <th>金額</th>
                    <th>比例</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in expenseRanking" :key="item.categoryId">
                    <td>
                      <span class="badge bg-danger">{{ index + 1 }}</span>
                    </td>
                    <td>{{ item.categoryName }}</td>
                    <td class="text-danger fw-bold">${{ item.amount.toLocaleString() }}</td>
                    <td>
                      <div class="progress" style="height: 10px">
                        <div
                          class="progress-bar bg-danger"
                          :style="{ width: item.percentage + '%' }"
                        ></div>
                      </div>
                      <small>{{ item.percentage }}%</small>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="card-body text-center py-4" v-if="expenseRanking.length === 0">
              <i class="bi bi-inbox text-muted fs-4"></i>
              <p class="text-muted mt-2 mb-0">暫無支出記錄</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api'
import IncomeExpenseTrendChart from './Charts/IncomeExpenseTrendChart.vue'
import IncomeExpensePieChart from './Charts/IncomeExpensePieChart.vue'

// 路由
const route = useRoute()
const brandId = computed(() => route.params.brandId)
const storeId = computed(() => route.params.storeId)

// 狀態
const dateRange = ref('month')
const customDateRange = ref({
  start: '',
  end: '',
})

const summary = ref({
  totalIncome: 0,
  totalExpense: 0,
  netAmount: 0,
  totalRecords: 0,
  incomeRecords: 0,
  expenseRecords: 0,
})

const incomeRanking = ref([])
const expenseRanking = ref([])
const categories = ref([])
const isLoading = ref(false)
const trendChartData = ref({
  labels: [],
  incomeData: [],
  expenseData: [],
})

// 計算屬性
const dateRangeText = computed(() => {
  const texts = {
    today: '今天',
    week: '本週',
    month: '本月',
    quarter: '本季',
    year: '本年',
    custom: '自訂範圍',
  }
  return texts[dateRange.value] || '未知'
})

const incomePercentage = computed(() => {
  const total = summary.value.totalIncome + summary.value.totalExpense
  if (total === 0) return 0
  return Math.round((summary.value.totalIncome / total) * 100)
})

const expensePercentage = computed(() => {
  const total = summary.value.totalIncome + summary.value.totalExpense
  if (total === 0) return 0
  return Math.round((summary.value.totalExpense / total) * 100)
})

// 🆕 與 Show.vue 相同的日期處理方式
const formatDate = (date) => {
  return date.toLocaleDateString('en-CA') // 返回 YYYY-MM-DD 格式
}

// 獲取台北時區的今日日期 (與 Show.vue 相同)
const getTaipeiToday = () => {
  // 更簡單直接的方法：手動調整UTC+8
  const now = new Date()
  const taipeiOffset = 8 * 60 * 60 * 1000 // UTC+8 in milliseconds
  const taipeiTime = new Date(now.getTime() + taipeiOffset)

  // 取得台北時間的年月日
  const year = taipeiTime.getUTCFullYear()
  const month = taipeiTime.getUTCMonth()
  const date = taipeiTime.getUTCDate()

  // 建立今日日期（UTC 0點）
  const today = new Date(Date.UTC(year, month, date))

  console.log('🕒 日期轉換除錯:', {
    原始時間: now.toISOString(),
    台北時間: taipeiTime.toISOString(),
    年月日: { year, month, date },
    今日日期: today.toISOString(),
    今日日期字串: today.toISOString().split('T')[0],
  })

  return today
}

// 獲取日期範圍開始時間 (與 Show.vue 相同)
const getDateRangeStart = () => {
  if (dateRange.value === 'custom') {
    if (!customDateRange.value.start) {
      return undefined
    }
    return customDateRange.value.start
  }

  const today = getTaipeiToday()

  if (dateRange.value === 'today') {
    return today.toISOString().split('T')[0]
  } else if (dateRange.value === 'week') {
    // 本週從週日開始
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    return weekStart.toISOString().split('T')[0]
  } else if (dateRange.value === 'month') {
    // 本月從1號開始
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    return monthStart.toISOString().split('T')[0]
  } else if (dateRange.value === 'quarter') {
    // 本季從第一天開始
    const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1)
    return quarterStart.toISOString().split('T')[0]
  } else if (dateRange.value === 'year') {
    // 本年從1月1日開始
    const yearStart = new Date(today.getFullYear(), 0, 1)
    return yearStart.toISOString().split('T')[0]
  }

  return undefined
}

// 獲取日期範圍結束時間 (與 Show.vue 相同)
const getDateRangeEnd = () => {
  if (dateRange.value === 'custom') {
    if (!customDateRange.value.end) {
      return undefined
    }
    return customDateRange.value.end
  }

  if (dateRange.value !== 'all') {
    return getTaipeiToday().toISOString().split('T')[0]
  }

  return undefined
}

// 使用 getCashFlowsByStore 來獲取現金流資料，並在前端進行統計處理
const fetchStatistics = async () => {
  isLoading.value = true
  try {
    const startDate = getDateRangeStart()
    const endDate = getDateRangeEnd()

    console.log('📅 統計查詢參數:', {
      dateRange: dateRange.value,
      startDate,
      endDate,
      台北時間現在: new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
      UTC時間現在: new Date().toISOString(),
    })

    // 同時獲取現金流記錄和分類資料
    const [recordsResponse, categoriesResponse] = await Promise.all([
      api.cashFlow.getCashFlowsByStore(brandId.value, storeId.value, {
        startDate,
        endDate,
        // 不設置 page 和 limit，獲取所有資料用於統計
      }),
      api.cashFlowCategory.getCategoriesByStore(brandId.value, storeId.value),
    ])

    console.log('📊 統計資料響應:', { recordsResponse, categoriesResponse })

    // 處理分類資料
    if (categoriesResponse && categoriesResponse.success && categoriesResponse.data) {
      categories.value = categoriesResponse.data.map((category) => ({
        id: category._id,
        name: category.name,
        type: category.type,
      }))
    }

    // 處理現金流記錄資料
    if (recordsResponse && recordsResponse.success && recordsResponse.data) {
      const allRecords = recordsResponse.data.map((record) => ({
        id: record._id,
        date: record.time,
        type: record.type,
        categoryId: record.category?._id,
        categoryName: record.category?.name || '未知分類',
        description: record.name + (record.description ? ' - ' + record.description : ''),
        amount: record.amount,
      }))

      // 計算基本統計
      const incomeRecords = allRecords.filter((record) => record.type === 'income')
      const expenseRecords = allRecords.filter((record) => record.type === 'expense')

      const totalIncome = incomeRecords.reduce((sum, record) => sum + record.amount, 0)
      const totalExpense = expenseRecords.reduce((sum, record) => sum + record.amount, 0)

      summary.value = {
        totalIncome,
        totalExpense,
        netAmount: totalIncome - totalExpense,
        totalRecords: allRecords.length,
        incomeRecords: incomeRecords.length,
        expenseRecords: expenseRecords.length,
      }

      // 計算收入分類排行
      const incomeByCategory = {}
      incomeRecords.forEach((record) => {
        const categoryId = record.categoryId || 'unknown'
        const categoryName = record.categoryName || '未知分類'
        if (!incomeByCategory[categoryId]) {
          incomeByCategory[categoryId] = {
            categoryId,
            categoryName,
            amount: 0,
            count: 0,
          }
        }
        incomeByCategory[categoryId].amount += record.amount
        incomeByCategory[categoryId].count += 1
      })

      incomeRanking.value = Object.values(incomeByCategory)
        .sort((a, b) => b.amount - a.amount)
        .map((item) => ({
          ...item,
          percentage: totalIncome > 0 ? Math.round((item.amount / totalIncome) * 100) : 0,
        }))

      // 計算支出分類排行
      const expenseByCategory = {}
      expenseRecords.forEach((record) => {
        const categoryId = record.categoryId || 'unknown'
        const categoryName = record.categoryName || '未知分類'
        if (!expenseByCategory[categoryId]) {
          expenseByCategory[categoryId] = {
            categoryId,
            categoryName,
            amount: 0,
            count: 0,
          }
        }
        expenseByCategory[categoryId].amount += record.amount
        expenseByCategory[categoryId].count += 1
      })

      expenseRanking.value = Object.values(expenseByCategory)
        .sort((a, b) => b.amount - a.amount)
        .map((item) => ({
          ...item,
          percentage: totalExpense > 0 ? Math.round((item.amount / totalExpense) * 100) : 0,
        }))

      // 計算趨勢數據
      generateTrendData(allRecords)

      console.log('✅ 統計計算完成:', {
        總記錄數: allRecords.length,
        收入記錄: incomeRecords.length,
        支出記錄: expenseRecords.length,
        總收入: totalIncome,
        總支出: totalExpense,
        淨收益: totalIncome - totalExpense,
        收入排行: incomeRanking.value,
        支出排行: expenseRanking.value,
        趨勢數據: trendChartData.value,
      })
    } else {
      resetStatisticsData()
    }
  } catch (err) {
    console.error('獲取統計資料失敗:', err)
    resetStatisticsData()
  } finally {
    isLoading.value = false
  }
}

// 生成趨勢圖表數據
const generateTrendData = (allRecords) => {
  if (!allRecords || allRecords.length === 0) {
    trendChartData.value = {
      labels: [],
      incomeData: [],
      expenseData: [],
    }
    return
  }

  // 按日期分組記錄
  const dailyData = {}

  allRecords.forEach((record) => {
    const date = record.date.split('T')[0] // 取日期部分 YYYY-MM-DD

    if (!dailyData[date]) {
      dailyData[date] = {
        income: 0,
        expense: 0,
      }
    }

    if (record.type === 'income') {
      dailyData[date].income += record.amount
    } else if (record.type === 'expense') {
      dailyData[date].expense += record.amount
    }
  })

  // 排序日期並生成圖表數據
  const sortedDates = Object.keys(dailyData).sort()

  trendChartData.value = {
    labels: sortedDates.map((date) => {
      const dateObj = new Date(date)
      return dateObj.toLocaleDateString('zh-TW', {
        month: 'short',
        day: 'numeric',
      })
    }),
    incomeData: sortedDates.map((date) => dailyData[date].income),
    expenseData: sortedDates.map((date) => dailyData[date].expense),
  }
}

// 🆕 重置統計資料
const resetStatisticsData = () => {
  summary.value = {
    totalIncome: 0,
    totalExpense: 0,
    netAmount: 0,
    totalRecords: 0,
    incomeRecords: 0,
    expenseRecords: 0,
  }
  incomeRanking.value = []
  expenseRanking.value = []
  trendChartData.value = {
    labels: [],
    incomeData: [],
    expenseData: [],
  }
}

// 🆕 更新統計資料 (與 Show.vue 風格一致)
const updateStatistics = () => {
  console.log('更新統計範圍:', dateRange.value)

  if (dateRange.value === 'custom') {
    console.log('自訂範圍:', customDateRange.value)
    if (!customDateRange.value.start || !customDateRange.value.end) {
      alert('請選擇完整的自訂日期範圍')
      return
    }
  }

  fetchStatistics()
}

const refreshData = () => {
  fetchStatistics()
}

// 匯出報表功能
const exportReport = () => {
  if (isLoading.value) {
    alert('資料載入中，請稍後再試')
    return
  }

  const data = {
    統計期間: dateRangeText.value,
    統計範圍: {
      開始日期: getDateRangeStart() || '無限制',
      結束日期: getDateRangeEnd() || '無限制',
    },
    財務概覽: {
      總收入: `$${summary.value.totalIncome.toLocaleString()}`,
      總支出: `$${summary.value.totalExpense.toLocaleString()}`,
      淨收益: `$${summary.value.netAmount.toLocaleString()}`,
      記錄總數: summary.value.totalRecords,
      收入記錄數: summary.value.incomeRecords,
      支出記錄數: summary.value.expenseRecords,
    },
    收入分類排行: incomeRanking.value.map((item, index) => ({
      排名: index + 1,
      分類: item.categoryName,
      金額: `$${item.amount.toLocaleString()}`,
      比例: `${item.percentage}%`,
    })),
    支出分類排行: expenseRanking.value.map((item, index) => ({
      排名: index + 1,
      分類: item.categoryName,
      金額: `$${item.amount.toLocaleString()}`,
      比例: `${item.percentage}%`,
    })),
  }

  const jsonData = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `現金流統計報表_${dateRangeText.value}_${new Date().toLocaleDateString('zh-TW').replace(/\//g, '-')}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  console.log('📊 匯出統計報表:', data)
}

// 生命週期
onMounted(() => {
  fetchStatistics()
})
</script>

<style scoped>
.chart-placeholder {
  text-align: center;
  padding: 60px 20px;
  background-color: #f8f9fa;
  border-radius: 0.375rem;
  border: 2px dashed #dee2e6;
}

.progress {
  background-color: #e9ecef;
}

.badge {
  font-size: 0.75rem;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
}

.opacity-75 {
  opacity: 0.75;
}

.table th {
  border-top: none;
  font-weight: 600;
  font-size: 0.875rem;
}

.table td {
  font-size: 0.875rem;
}

.fs-2 {
  font-size: 2rem;
}
</style>
