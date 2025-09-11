<template>
  <div>
    <!-- 頁面標題 -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0">記帳統計報表</h5>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-primary" @click="refreshData">
          <i class="bi bi-arrow-clockwise me-1"></i>重新整理
        </button>
        <button class="btn btn-outline-success"><i class="bi bi-download me-1"></i>匯出報表</button>
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

    <!-- 概覽卡片 -->
    <div class="row mb-4">
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
    <div class="row mb-4">
      <!-- 收支趨勢圖 -->
      <div class="col-md-8">
        <div class="card">
          <div class="card-header">
            <h6 class="card-title mb-0">收支趨勢圖</h6>
          </div>
          <div class="card-body">
            <div class="chart-placeholder">
              <i class="bi bi-graph-up fs-1 text-muted"></i>
              <p class="text-muted mt-3">圖表功能需要集成圖表庫</p>
              <small class="text-muted">建議使用 Chart.js</small>
            </div>
          </div>
        </div>
      </div>

      <!-- 收支比例圓餅圖 -->
      <div class="col-md-4">
        <div class="card">
          <div class="card-header">
            <h6 class="card-title mb-0">收支比例</h6>
          </div>
          <div class="card-body">
            <div class="chart-placeholder">
              <i class="bi bi-pie-chart fs-1 text-muted"></i>
              <p class="text-muted mt-3">圓餅圖</p>
              <div class="mt-3">
                <div class="d-flex justify-content-between">
                  <span class="text-success">收入</span>
                  <span>{{ incomePercentage }}%</span>
                </div>
                <div class="d-flex justify-content-between">
                  <span class="text-danger">支出</span>
                  <span>{{ expensePercentage }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分類統計 -->
    <div class="row">
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

// 方法
const fetchStatistics = async () => {
  try {
    const params = {
      startDate: getDateRangeStart(),
      endDate: getDateRangeEnd(),
      groupBy: 'category'
    }
    
    const response = await api.cashFlow.getCashFlowStatistics(brandId.value, storeId.value, params)
    const statisticsData = response.data
    
    // 設置總結資料
    summary.value = {
      totalIncome: statisticsData.summary?.totalIncome || 0,
      totalExpense: statisticsData.summary?.totalExpense || 0,
      netAmount: statisticsData.summary?.netIncome || 0,
      totalRecords: statisticsData.summary?.totalTransactions || 0,
      incomeRecords: 0,
      expenseRecords: 0
    }
    
    // 處理分類統計資料
    const categoryStats = statisticsData.categoryStats || []
    
    // 分離收入和支出分類
    const incomeCategories = categoryStats.filter(cat => cat._id.categoryType === 'income')
    const expenseCategories = categoryStats.filter(cat => cat._id.categoryType === 'expense')
    
    // 計算收入分類排行和比例
    const totalIncome = incomeCategories.reduce((sum, cat) => sum + cat.totalAmount, 0)
    incomeRanking.value = incomeCategories
      .map(cat => ({
        categoryId: cat._id.categoryId,
        categoryName: cat._id.categoryName,
        amount: cat.totalAmount,
        percentage: totalIncome > 0 ? Math.round((cat.totalAmount / totalIncome) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount)
    
    // 計算支出分類排行和比例
    const totalExpense = expenseCategories.reduce((sum, cat) => sum + cat.totalAmount, 0)
    expenseRanking.value = expenseCategories
      .map(cat => ({
        categoryId: cat._id.categoryId,
        categoryName: cat._id.categoryName,
        amount: cat.totalAmount,
        percentage: totalExpense > 0 ? Math.round((cat.totalAmount / totalExpense) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      
    // 更新記錄數量
    summary.value.incomeRecords = incomeCategories.reduce((sum, cat) => sum + cat.transactionCount, 0)
    summary.value.expenseRecords = expenseCategories.reduce((sum, cat) => sum + cat.transactionCount, 0)
    
  } catch (err) {
    console.error('獲取統計資料失敗:', err)
    // 設置空資料
    summary.value = {
      totalIncome: 0,
      totalExpense: 0,
      netAmount: 0,
      totalRecords: 0,
      incomeRecords: 0,
      expenseRecords: 0
    }
    incomeRanking.value = []
    expenseRanking.value = []
  }
}

// 獲取台北時區的今日日期
const getTaipeiToday = () => {
  const now = new Date()
  const taipeiOffset = 8 * 60 // 台北時區 UTC+8
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
  const taipeiTime = new Date(utc + (taipeiOffset * 60000))
  return new Date(taipeiTime.getFullYear(), taipeiTime.getMonth(), taipeiTime.getDate())
}

// 獲取日期範圍開始時間
const getDateRangeStart = () => {
  if (dateRange.value === 'custom' && customDateRange.value.start) {
    return customDateRange.value.start
  }
  
  const today = getTaipeiToday()
  
  switch (dateRange.value) {
    case 'today':
      return today.toISOString().split('T')[0]
    case 'week':
      // 本週從週日開始
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      return weekStart.toISOString().split('T')[0]
    case 'month':
      // 本月從1號開始
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      return monthStart.toISOString().split('T')[0]
    case 'quarter':
      // 本季從第一天開始
      const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1)
      return quarterStart.toISOString().split('T')[0]
    case 'year':
      // 本年從1月1日開始
      const yearStart = new Date(today.getFullYear(), 0, 1)
      return yearStart.toISOString().split('T')[0]
    default:
      return undefined
  }
}

// 獲取日期範圍結束時間
const getDateRangeEnd = () => {
  if (dateRange.value === 'custom' && customDateRange.value.end) {
    return customDateRange.value.end
  }
  
  return getTaipeiToday().toISOString().split('T')[0]
}

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
