<template>
  <div>
    <!-- 功能區 -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0">記帳記錄</h5>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary" @click="refreshRecords">
          <i class="bi bi-arrow-clockwise me-1"></i>重新整理
        </button>
        <router-link :to="`/admin/${brandId}/cash-flow/${storeId}/create`" class="btn btn-primary">
          <i class="bi bi-plus me-1"></i>新增記帳
        </router-link>
      </div>
    </div>

    <!-- 篩選器 -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label">日期範圍</label>
            <select class="form-select" v-model="dateFilter">
              <option value="today">今天</option>
              <option value="week">本週</option>
              <option value="month">本月</option>
              <option value="custom">自訂範圍</option>
              <option value="all">全部</option>
            </select>
          </div>
          <div class="col-md-4" v-if="dateFilter === 'custom'">
            <label class="form-label">開始日期</label>
            <input type="date" class="form-control" v-model="customStartDate" />
          </div>
          <div class="col-md-4" v-if="dateFilter === 'custom'">
            <label class="form-label">結束日期</label>
            <input type="date" class="form-control" v-model="customEndDate" />
          </div>
          <div class="col-md-4" :class="{ 'col-md-8': dateFilter === 'custom' }">
            <label class="form-label">類型</label>
            <select class="form-select" v-model="typeFilter">
              <option value="all">全部類型</option>
              <option value="income">收入</option>
              <option value="expense">支出</option>
            </select>
          </div>
          <div class="col-md-4" :class="{ 'col-md-12': dateFilter === 'custom' }">
            <label class="form-label">分類</label>
            <select class="form-select" v-model="categoryFilter">
              <option value="all">全部分類</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
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

    <!-- 記帳記錄列表 -->
    <div class="card" v-if="!isLoading">
      <div class="card-header d-flex justify-content-between align-items-center">
        <span>記錄列表 ({{ pagination.total || 0 }} 筆)</span>
        <div class="d-flex gap-2">
          <small class="text-success">收入: ${{ totalIncome.toLocaleString() }}</small>
          <small class="text-danger">支出: ${{ totalExpense.toLocaleString() }}</small>
          <small class="fw-bold">淨額: ${{ netAmount.toLocaleString() }}</small>
        </div>
      </div>

      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th>日期</th>
              <th>類型</th>
              <th>分類</th>
              <th>描述</th>
              <th>金額</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in paginatedRecords" :key="record.id">
              <td>{{ formatDate(record.date) }}</td>
              <td>
                <span class="badge" :class="record.type === 'income' ? 'bg-success' : 'bg-danger'">
                  {{ record.type === 'income' ? '收入' : '支出' }}
                </span>
              </td>
              <td>{{ getCategoryName(record.categoryId) }}</td>
              <td>{{ record.description }}</td>
              <td
                class="fw-bold"
                :class="record.type === 'income' ? 'text-success' : 'text-danger'"
              >
                {{ record.type === 'income' ? '+' : '-' }}${{ record.amount.toLocaleString() }}
              </td>
              <td>
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-primary" @click="editRecord(record)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-outline-danger" @click="deleteRecord(record)">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 無資料提示 -->
      <div class="card-body text-center py-5" v-if="records.length === 0">
        <i class="bi bi-inbox fs-1 text-muted"></i>
        <p class="text-muted mt-3 mb-0">目前沒有記帳記錄</p>
      </div>

      <!-- 分頁 -->
      <div class="card-footer" v-if="totalPages > 1">
        <nav>
          <ul class="pagination justify-content-center mb-0">
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <button class="page-link" @click="currentPage--" :disabled="currentPage === 1">
                上一頁
              </button>
            </li>
            <li
              class="page-item"
              v-for="page in displayPages"
              :key="page"
              :class="{ active: page === currentPage }"
            >
              <button class="page-link" @click="currentPage = page">{{ page }}</button>
            </li>
            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
              <button
                class="page-link"
                @click="currentPage++"
                :disabled="currentPage === totalPages"
              >
                下一頁
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- 刪除確認對話框 -->
    <BModal
      v-model:show="showDeleteModal"
      id="deleteRecordModal"
      title="確認刪除"
      centered
      @ok="confirmDelete"
      @cancel="showDeleteModal = false"
    >
      <p v-if="recordToDelete">確定要刪除這筆記錄嗎？</p>
      <div v-if="recordToDelete" class="bg-light p-3 rounded mb-3">
        <div class="row">
          <div class="col-sm-3"><strong>日期：</strong></div>
          <div class="col-sm-9">{{ formatDate(recordToDelete.date) }}</div>
        </div>
        <div class="row">
          <div class="col-sm-3"><strong>類型：</strong></div>
          <div class="col-sm-9">
            <span
              class="badge"
              :class="recordToDelete.type === 'income' ? 'bg-success' : 'bg-danger'"
            >
              {{ recordToDelete.type === 'income' ? '收入' : '支出' }}
            </span>
          </div>
        </div>
        <div class="row">
          <div class="col-sm-3"><strong>分類：</strong></div>
          <div class="col-sm-9">{{ getCategoryName(recordToDelete.categoryId) }}</div>
        </div>
        <div class="row">
          <div class="col-sm-3"><strong>描述：</strong></div>
          <div class="col-sm-9">{{ recordToDelete.description }}</div>
        </div>
        <div class="row">
          <div class="col-sm-3"><strong>金額：</strong></div>
          <div class="col-sm-9">
            <span
              class="fw-bold"
              :class="recordToDelete.type === 'income' ? 'text-success' : 'text-danger'"
            >
              {{ recordToDelete.type === 'income' ? '+' : '-' }}${{
                recordToDelete.amount.toLocaleString()
              }}
            </span>
          </div>
        </div>
      </div>
      <BAlert variant="warning" show>
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        此操作無法撤銷，記錄將被永久刪除。
      </BAlert>
      <template #footer>
        <BButton variant="secondary" @click="showDeleteModal = false">取消</BButton>
        <BButton variant="danger" @click="confirmDelete">確認刪除</BButton>
      </template>
    </BModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { BModal, BButton, BAlert } from 'bootstrap-vue-next'
import api from '@/api'

// 路由
const route = useRoute()
const brandId = computed(() => route.params.brandId)
const storeId = computed(() => route.params.storeId)

// 狀態
const isLoading = ref(false)
const records = ref([])
const categories = ref([])
const pagination = ref({})
const currentPage = ref(1)
const pageSize = 10
const statistics = ref({
  totalIncome: 0,
  totalExpense: 0,
  netAmount: 0,
})

// Modal 狀態
const showDeleteModal = ref(false)
const recordToDelete = ref(null)

// 篩選條件
const dateFilter = ref('all')
const typeFilter = ref('all')
const categoryFilter = ref('all')
const customStartDate = ref('')
const customEndDate = ref('')

// 計算屬性
const totalPages = computed(() => Math.ceil((pagination.value?.total || 0) / pageSize))

const paginatedRecords = computed(() => {
  // 由於 API 已經處理分頁，直接返回 records
  return records.value
})

const displayPages = computed(() => {
  const pages = []
  const maxDisplay = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxDisplay / 2))
  let end = Math.min(totalPages.value, start + maxDisplay - 1)

  if (end - start < maxDisplay - 1) {
    start = Math.max(1, end - maxDisplay + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

const totalIncome = computed(() => statistics.value.totalIncome)
const totalExpense = computed(() => statistics.value.totalExpense)
const netAmount = computed(() => statistics.value.netAmount)

// 方法
const refreshRecords = async () => {
  await fetchRecords()
}

// 獲取統計資料
const fetchStatistics = async () => {
  try {
    const startDate = getDateRangeStart()
    const endDate = getDateRangeEnd()
    
    // 除錯：顯示發送的查詢參數
    console.log('📅 查詢參數除錯:', {
      dateFilter: dateFilter.value,
      startDate,
      endDate,
      台北時間現在: new Date().toLocaleString('zh-TW', {timeZone: 'Asia/Taipei'}),
      UTC時間現在: new Date().toISOString()
    })

    // 獲取所有符合篩選條件的記錄來計算統計（不分頁）
    const statisticsResponse = await api.cashFlow.getCashFlowsByStore(
      brandId.value,
      storeId.value,
      {
        startDate,
        endDate,
        type: typeFilter.value === 'all' ? undefined : typeFilter.value,
        categoryId: categoryFilter.value === 'all' ? undefined : categoryFilter.value,
        // 不設置 page 和 limit，獲取所有資料
      },
    )

    console.log('📊 統計資料響應:', statisticsResponse)

    if (statisticsResponse && statisticsResponse.success && statisticsResponse.data) {
      const allRecords = statisticsResponse.data
      const totalIncome = allRecords
        .filter((record) => record.type === 'income')
        .reduce((sum, record) => sum + record.amount, 0)
      const totalExpense = allRecords
        .filter((record) => record.type === 'expense')
        .reduce((sum, record) => sum + record.amount, 0)

      statistics.value = {
        totalIncome,
        totalExpense,
        netAmount: totalIncome - totalExpense,
      }
    }
  } catch (err) {
    console.error('獲取統計資料失敗:', err)
    statistics.value = {
      totalIncome: 0,
      totalExpense: 0,
      netAmount: 0,
    }
  }
}

const fetchRecords = async () => {
  isLoading.value = true
  try {
    // 同時獲取記帳記錄、分類資料和統計資料
    const [recordsResponse, categoriesResponse] = await Promise.all([
      api.cashFlow.getCashFlowsByStore(brandId.value, storeId.value, {
        startDate: getDateRangeStart(),
        endDate: getDateRangeEnd(),
        type: typeFilter.value === 'all' ? undefined : typeFilter.value,
        categoryId: categoryFilter.value === 'all' ? undefined : categoryFilter.value,
        page: currentPage.value,
        limit: pageSize,
      }),
      api.cashFlowCategory.getCategoriesByStore(brandId.value, storeId.value),
    ])

    // 處理記帳記錄資料
    if (recordsResponse && recordsResponse.success && recordsResponse.data) {
      records.value = recordsResponse.data.map((record) => ({
        id: record._id,
        date: record.time,
        type: record.type,
        categoryId: record.category?._id,
        description: record.name + (record.description ? ' - ' + record.description : ''),
        amount: record.amount,
      }))

      // 修正分頁信息處理
      pagination.value = recordsResponse.pagination || {}
    }

    // 處理分類資料
    if (categoriesResponse && categoriesResponse.success && categoriesResponse.data) {
      categories.value = categoriesResponse.data.map((category) => ({
        id: category._id,
        name: category.name,
        type: category.type,
      }))
    }

    // 獲取統計資料
    await fetchStatistics()
  } catch (err) {
    console.error('獲取記帳記錄失敗:', err)
    // 如果失敗，設置空資料
    records.value = []
    categories.value = []
    pagination.value = {}
    statistics.value = {
      totalIncome: 0,
      totalExpense: 0,
      netAmount: 0,
    }
  } finally {
    isLoading.value = false
  }
}

// 響應式篩選 - 當篩選條件改變時自動重置頁面
const resetPage = () => {
  currentPage.value = 1
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Taipei',
  })
}

const getCategoryName = (categoryId) => {
  const category = categories.value.find((c) => c.id === categoryId)
  return category ? category.name : '未知分類'
}

// 獲取台北時區的今日日期
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
  
  // 除錯：顯示日期轉換過程
  console.log('🕒 日期轉換除錯:', {
    原始時間: now.toISOString(),
    台北時間: taipeiTime.toISOString(),
    年月日: { year, month, date },
    今日日期: today.toISOString(),
    今日日期字串: today.toISOString().split('T')[0]
  })
  
  return today
}

// 獲取日期範圍開始時間
const getDateRangeStart = () => {
  if (dateFilter.value === 'custom' && customStartDate.value) {
    return customStartDate.value
  }

  const today = getTaipeiToday()

  if (dateFilter.value === 'today') {
    return today.toISOString().split('T')[0]
  } else if (dateFilter.value === 'week') {
    // 本週從週日開始
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    return weekStart.toISOString().split('T')[0]
  } else if (dateFilter.value === 'month') {
    // 本月從1號開始
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    return monthStart.toISOString().split('T')[0]
  }

  return undefined
}

// 獲取日期範圍結束時間
const getDateRangeEnd = () => {
  if (dateFilter.value === 'custom' && customEndDate.value) {
    return customEndDate.value
  }

  if (dateFilter.value !== 'all') {
    return getTaipeiToday().toISOString().split('T')[0]
  }

  return undefined
}

const editRecord = (record) => {
  // TODO: 實作編輯功能
  console.log('編輯記錄:', record)
}

const deleteRecord = (record) => {
  recordToDelete.value = record
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (recordToDelete.value) {
    try {
      await api.cashFlow.deleteCashFlow(brandId.value, storeId.value, recordToDelete.value.id)

      // 刪除成功後從本地資料中移除
      const index = records.value.findIndex((r) => r.id === recordToDelete.value.id)
      if (index > -1) {
        records.value.splice(index, 1)
      }

      console.log('刪除記錄成功:', recordToDelete.value)
    } catch (err) {
      console.error('刪除記錄失敗:', err)
      alert('刪除失敗：' + (err.response?.data?.message || '未知錯誤'))
    } finally {
      showDeleteModal.value = false
      recordToDelete.value = null
    }
  }
}

// 獲取記錄列表（僅列表，不獲取統計）
const fetchRecordsList = async () => {
  try {
    const recordsResponse = await api.cashFlow.getCashFlowsByStore(brandId.value, storeId.value, {
      startDate: getDateRangeStart(),
      endDate: getDateRangeEnd(),
      type: typeFilter.value === 'all' ? undefined : typeFilter.value,
      categoryId: categoryFilter.value === 'all' ? undefined : categoryFilter.value,
      page: currentPage.value,
      limit: pageSize,
    })

    // 處理記帳記錄資料
    if (recordsResponse && recordsResponse.success && recordsResponse.data) {
      records.value = recordsResponse.data.map((record) => ({
        id: record._id,
        date: record.time,
        type: record.type,
        categoryId: record.category?._id,
        description: record.name + (record.description ? ' - ' + record.description : ''),
        amount: record.amount,
      }))

      // 修正分頁信息處理
      pagination.value = recordsResponse.pagination || {}
    }
  } catch (err) {
    console.error('獲取記帳記錄失敗:', err)
    records.value = []
    pagination.value = {}
  }
}

// 監聽篩選條件變化，自動重置頁面並重新獲取資料
watch([dateFilter, typeFilter, categoryFilter, customStartDate, customEndDate], () => {
  resetPage()
  fetchRecords()
})

// 監聽頁面變化，只重新獲取記錄列表（不重新計算統計）
watch(currentPage, () => {
  fetchRecordsList()
})

// 生命週期
onMounted(() => {
  fetchRecords()
})
</script>

<style scoped>
.badge {
  font-size: 0.75rem;
}

.table th {
  border-top: none;
  font-weight: 600;
}

.btn-group-sm .btn {
  padding: 0.25rem 0.5rem;
}

.page-link {
  color: #6c757d;
}

.page-item.active .page-link {
  background-color: #0d6efd;
  border-color: #0d6efd;
}
</style>
