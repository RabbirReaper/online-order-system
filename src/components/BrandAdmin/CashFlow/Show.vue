<template>
  <div>
    <!-- 功能區 -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0">記帳記錄</h5>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary" @click="refreshRecords">
          <i class="bi bi-arrow-clockwise me-1"></i>重新整理
        </button>
        <router-link 
          :to="`/admin/${brandId}/cash-flow/${storeId}/create`"
          class="btn btn-primary"
        >
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
        <span>記錄列表 ({{ filteredRecords.length }} 筆)</span>
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
                <span 
                  class="badge"
                  :class="record.type === 'income' ? 'bg-success' : 'bg-danger'"
                >
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
                  <button 
                    class="btn btn-outline-primary" 
                    @click="editRecord(record)"
                  >
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button 
                    class="btn btn-outline-danger" 
                    @click="deleteRecord(record)"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 無資料提示 -->
      <div class="card-body text-center py-5" v-if="filteredRecords.length === 0">
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
              <button class="page-link" @click="currentPage++" :disabled="currentPage === totalPages">
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
      <p v-if="recordToDelete">
        確定要刪除這筆記錄嗎？
      </p>
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
              {{ recordToDelete.type === 'income' ? '+' : '-' }}${{ recordToDelete.amount.toLocaleString() }}
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
import {
  BModal,
  BButton,
  BAlert
} from 'bootstrap-vue-next'

// 路由
const route = useRoute()
const brandId = computed(() => route.params.brandId)
const storeId = computed(() => route.params.storeId)

// 狀態
const isLoading = ref(false)
const records = ref([])
const categories = ref([])
const currentPage = ref(1)
const pageSize = 10

// Modal 狀態
const showDeleteModal = ref(false)
const recordToDelete = ref(null)

// 篩選條件
const dateFilter = ref('all')
const typeFilter = ref('all')
const categoryFilter = ref('all')
const customStartDate = ref('')
const customEndDate = ref('')

// 模擬分類資料
const mockCategories = [
  { id: '1', name: '食材採購' },
  { id: '2', name: '租金' },
  { id: '3', name: '水電費' },
  { id: '4', name: '人事費用' },
  { id: '5', name: '餐點銷售' },
  { id: '6', name: '其他收入' }
]

// 模擬記帳記錄
const mockRecords = [
  {
    id: '1',
    date: '2025-01-10',
    type: 'expense',
    categoryId: '1',
    description: '採購新鮮蔬菜',
    amount: 1500
  },
  {
    id: '2',
    date: '2025-01-10',
    type: 'income',
    categoryId: '5',
    description: '午餐時段銷售',
    amount: 8500
  },
  {
    id: '3',
    date: '2025-01-09',
    type: 'expense',
    categoryId: '2',
    description: '店面租金',
    amount: 25000
  },
  {
    id: '4',
    date: '2025-01-09',
    type: 'income',
    categoryId: '5',
    description: '晚餐時段銷售',
    amount: 12000
  },
  {
    id: '5',
    date: '2025-01-08',
    type: 'expense',
    categoryId: '3',
    description: '電費',
    amount: 2800
  }
]

// 計算屬性
const filteredRecords = computed(() => {
  let result = records.value

  // 日期篩選
  if (dateFilter.value !== 'all') {
    if (dateFilter.value === 'custom') {
      // 自訂日期範圍
      if (customStartDate.value && customEndDate.value) {
        const startDate = new Date(customStartDate.value)
        const endDate = new Date(customEndDate.value)
        endDate.setHours(23, 59, 59, 999) // 設為當天最後一秒
        
        result = result.filter(record => {
          const recordDate = new Date(record.date)
          return recordDate >= startDate && recordDate <= endDate
        })
      }
    } else {
      // 預設日期篩選
      const today = new Date()
      const filterDate = new Date()
      
      if (dateFilter.value === 'today') {
        filterDate.setHours(0, 0, 0, 0)
      } else if (dateFilter.value === 'week') {
        filterDate.setDate(today.getDate() - 7)
      } else if (dateFilter.value === 'month') {
        filterDate.setMonth(today.getMonth() - 1)
      }
      
      result = result.filter(record => new Date(record.date) >= filterDate)
    }
  }

  // 類型篩選
  if (typeFilter.value !== 'all') {
    result = result.filter(record => record.type === typeFilter.value)
  }

  // 分類篩選
  if (categoryFilter.value !== 'all') {
    result = result.filter(record => record.categoryId === categoryFilter.value)
  }

  return result.sort((a, b) => new Date(b.date) - new Date(a.date))
})

const totalPages = computed(() => Math.ceil(filteredRecords.value.length / pageSize))

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredRecords.value.slice(start, start + pageSize)
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

const totalIncome = computed(() => {
  return filteredRecords.value
    .filter(record => record.type === 'income')
    .reduce((sum, record) => sum + record.amount, 0)
})

const totalExpense = computed(() => {
  return filteredRecords.value
    .filter(record => record.type === 'expense')
    .reduce((sum, record) => sum + record.amount, 0)
})

const netAmount = computed(() => totalIncome.value - totalExpense.value)

// 方法
const refreshRecords = async () => {
  await fetchRecords()
}

const fetchRecords = async () => {
  isLoading.value = true
  try {
    // 使用假資料
    await new Promise(resolve => setTimeout(resolve, 500))
    records.value = mockRecords
    categories.value = mockCategories
  } catch (err) {
    console.error('獲取記帳記錄失敗:', err)
  } finally {
    isLoading.value = false
  }
}

// 響應式篩選 - 當篩選條件改變時自動重置頁面
const resetPage = () => {
  currentPage.value = 1
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('zh-TW')
}

const getCategoryName = (categoryId) => {
  const category = categories.value.find(c => c.id === categoryId)
  return category ? category.name : '未知分類'
}

const editRecord = (record) => {
  // TODO: 實作編輯功能
  console.log('編輯記錄:', record)
}

const deleteRecord = (record) => {
  recordToDelete.value = record
  showDeleteModal.value = true
}

const confirmDelete = () => {
  if (recordToDelete.value) {
    // TODO: 實作實際的刪除API
    const index = records.value.findIndex(r => r.id === recordToDelete.value.id)
    if (index > -1) {
      records.value.splice(index, 1)
    }
    
    console.log('刪除記錄:', recordToDelete.value)
    showDeleteModal.value = false
    recordToDelete.value = null
  }
}

// 監聽篩選條件變化，自動重置頁面
watch([dateFilter, typeFilter, categoryFilter, customStartDate, customEndDate], () => {
  resetPage()
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