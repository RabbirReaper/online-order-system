<template>
  <div>
    <!-- 頁面標題 -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0"></h5>
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
        <!-- 快速日期選擇器 -->
        <div class="row align-items-center mb-3">
          <div class="col-md-6">
            <label class="form-label">快速選擇日期</label>
            <div class="d-flex align-items-center gap-2">
              <button class="btn btn-outline-primary" @click="adjustDate(-1)" :disabled="isLoading">
                <i class="bi bi-chevron-left"></i>
              </button>

              <div class="quick-date-selector">
                <div class="current-date-display">
                  {{ formatSelectedDateRange() }}
                </div>
              </div>

              <button
                class="btn btn-outline-primary"
                @click="adjustDate(1)"
                :disabled="isLoading || isToday()"
              >
                <i class="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>

          <div class="col-md-6">
            <label class="form-label">快速期間選擇</label>
            <div class="d-flex gap-2 flex-wrap">
              <button
                class="btn btn-sm btn-outline-secondary"
                @click="setDateRange('lastWeek')"
                :class="{ active: isCurrentRange('lastWeek') }"
              >
                上週
              </button>
              <button
                class="btn btn-sm btn-outline-secondary"
                @click="setDateRange('thisWeek')"
                :class="{ active: isCurrentRange('thisWeek') }"
              >
                本週
              </button>
              <button
                class="btn btn-sm btn-outline-secondary"
                @click="setDateRange('lastMonth')"
                :class="{ active: isCurrentRange('lastMonth') }"
              >
                上月
              </button>
              <button
                class="btn btn-sm btn-outline-secondary"
                @click="setDateRange('thisMonth')"
                :class="{ active: isCurrentRange('thisMonth') }"
              >
                本月
              </button>
              <button
                class="btn btn-sm btn-outline-secondary"
                @click="setDateRange('thisQuarter')"
                :class="{ active: isCurrentRange('thisQuarter') }"
              >
                本季
              </button>
              <button
                class="btn btn-sm btn-outline-secondary"
                @click="setDateRange('thisYear')"
                :class="{ active: isCurrentRange('thisYear') }"
              >
                本年
              </button>
            </div>
          </div>
        </div>

        <!-- 詳細日期選擇 -->
        <div class="row align-items-center">
          <div class="col-md-3">
            <label class="form-label">開始日期</label>
            <input
              type="date"
              class="form-control"
              v-model="startDate"
              @change="handleDateChange"
            />
          </div>
          <div class="col-md-3">
            <label class="form-label">結束日期</label>
            <input type="date" class="form-control" v-model="endDate" @change="handleDateChange" />
          </div>
          <div class="col-md-3">
            <button class="btn btn-primary w-100" @click="updateStatistics" :disabled="isLoading">
              <span
                v-if="isLoading"
                class="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              {{ isLoading ? '載入中...' : '更新統計' }}
            </button>
          </div>
          <div class="col-md-3">
            <button class="btn btn-outline-secondary w-100" @click="resetDateRange">
              <i class="bi bi-arrow-clockwise me-1"></i>重置
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
const startDate = ref('')
const endDate = ref('')
const currentDateRange = ref('') // 記錄當前選擇的日期範圍類型

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
    lastWeek: '上週',
    thisWeek: '本週',
    lastMonth: '上月',
    thisMonth: '本月',
    thisQuarter: '本季',
    thisYear: '本年',
  }
  return texts[currentDateRange.value] || '自訂範圍'
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

// 🆕 與 OrderList.vue 相同的日期處理方式
const formatDate = (date) => {
  return date.toLocaleDateString('en-CA') // 返回 YYYY-MM-DD 格式
}

const isToday = () => {
  const today = formatDate(new Date())
  return startDate.value === today && endDate.value === today
}

const formatSelectedDateRange = () => {
  if (!startDate.value || !endDate.value) return '請選擇日期'

  if (startDate.value === endDate.value) {
    return new Date(startDate.value + 'T00:00:00').toLocaleDateString('zh-TW')
  }

  return `${new Date(startDate.value + 'T00:00:00').toLocaleDateString('zh-TW')} - ${new Date(endDate.value + 'T00:00:00').toLocaleDateString('zh-TW')}`
}

const setToday = () => {
  const today = new Date()
  startDate.value = formatDate(today)
  endDate.value = formatDate(today)
  currentDateRange.value = ''
  fetchStatistics()
}

const adjustDate = (days) => {
  const fromDate = new Date(startDate.value + 'T00:00:00')
  const toDate = new Date(endDate.value + 'T00:00:00')

  fromDate.setDate(fromDate.getDate() + days)
  toDate.setDate(toDate.getDate() + days)

  // 不能選擇未來的日期
  const today = new Date()
  if (toDate > today) return

  startDate.value = formatDate(fromDate)
  endDate.value = formatDate(toDate)
  currentDateRange.value = ''
  fetchStatistics()
}

const setDateRange = (range) => {
  const today = new Date()

  switch (range) {
    case 'lastWeek':
      // 上週（週日到週六）
      const lastWeekEnd = new Date()
      lastWeekEnd.setDate(today.getDate() - today.getDay() - 1) // 上週六
      const lastWeekStart = new Date(lastWeekEnd)
      lastWeekStart.setDate(lastWeekEnd.getDate() - 6) // 上週日
      startDate.value = formatDate(lastWeekStart)
      endDate.value = formatDate(lastWeekEnd)
      break
    case 'thisWeek':
      // 本週（週日開始到今天）
      const thisWeekStart = new Date()
      thisWeekStart.setDate(today.getDate() - today.getDay()) // 週日開始
      startDate.value = formatDate(thisWeekStart)
      endDate.value = formatDate(today)
      break
    case 'lastMonth':
      // 上月（完整月份）
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0) // 上月最後一天
      startDate.value = formatDate(lastMonth)
      endDate.value = formatDate(lastMonthEnd)
      break
    case 'thisMonth':
      // 本月（從1號到今天）
      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      startDate.value = formatDate(thisMonthStart)
      endDate.value = formatDate(today)
      break
    case 'thisQuarter':
      // 本季（從第一天到今天）
      const thisQuarterStart = new Date(
        today.getFullYear(),
        Math.floor(today.getMonth() / 3) * 3,
        1,
      )
      startDate.value = formatDate(thisQuarterStart)
      endDate.value = formatDate(today)
      break
    case 'thisYear':
      // 本年（從1月1日到今天）
      const thisYearStart = new Date(today.getFullYear(), 0, 1)
      startDate.value = formatDate(thisYearStart)
      endDate.value = formatDate(today)
      break
  }

  currentDateRange.value = range
  fetchStatistics()
}

const isCurrentRange = (range) => {
  return currentDateRange.value === range
}

const handleDateChange = () => {
  if (startDate.value && endDate.value) {
    if (new Date(startDate.value) > new Date(endDate.value)) {
      alert('開始日期不能晚於結束日期')
      return
    }
    currentDateRange.value = '' // 清除快速選擇狀態
    fetchStatistics()
  }
}

const resetDateRange = () => {
  setDateRange('thisMonth')
}

// 獲取日期範圍開始時間
const getDateRangeStart = () => {
  return startDate.value || undefined
}

// 獲取日期範圍結束時間
const getDateRangeEnd = () => {
  return endDate.value || undefined
}

// 使用 getCashFlowsByStore 來獲取現金流資料，並在前端進行統計處理
const fetchStatistics = async () => {
  isLoading.value = true
  try {
    const startDate = getDateRangeStart()
    const endDate = getDateRangeEnd()

    console.log('📅 統計查詢參數:', {
      currentDateRange: currentDateRange.value,
      startDate,
      endDate,
      本地時間現在: new Date().toLocaleString('zh-TW'),
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

// 🆕 更新統計資料
const updateStatistics = () => {
  console.log('更新統計範圍:', { startDate: startDate.value, endDate: endDate.value })

  if (!startDate.value || !endDate.value) {
    alert('請選擇完整的日期範圍')
    return
  }

  if (new Date(startDate.value) > new Date(endDate.value)) {
    alert('開始日期不能晚於結束日期')
    return
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

// 初始化日期範圍（預設為本月）
const initializeDateRange = () => {
  setDateRange('thisMonth')
}

// 生命週期
onMounted(() => {
  initializeDateRange()
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

/* 快速日期選擇器樣式 */
.quick-date-selector {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 200px;
}

.current-date-display {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #6c757d;
  text-align: center;
}

/* 快速期間選擇按鈕 */
.btn-sm.active {
  background-color: #0d6efd;
  border-color: #0d6efd;
  color: white;
}

/* 按鈕hover效果 */
.btn-outline-primary:hover {
  background-color: #0d6efd;
  border-color: #0d6efd;
  color: white;
}

.btn-outline-secondary:hover {
  background-color: #6c757d;
  border-color: #6c757d;
  color: white;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .quick-date-selector {
    min-width: 150px;
  }

  .current-date-display {
    font-size: 0.75rem;
  }
}
</style>
