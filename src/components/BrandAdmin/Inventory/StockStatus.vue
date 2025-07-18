<template>
  <div>
    <!-- 頁面頂部工具列 -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="d-flex align-items-center">
        <router-link :to="`/admin/${brandId}/inventory`" class="btn btn-outline-secondary me-3">
          <i class="bi bi-arrow-left"></i>
        </router-link>
        <h4 class="mb-0">{{ storeName }} - 庫存管理</h4>
      </div>
      <div class="d-flex gap-2">
        <!-- 新增按鈕組 -->
        <BDropdown variant="primary" text="新增庫存" class="btn-group">
          <template #button-content> <i class="bi bi-plus-lg me-1"></i>新增庫存 </template>
          <BDropdownItem @click="openInitializeModal">
            <i class="bi bi-box-seam me-2"></i>初始化餐點庫存
          </BDropdownItem>
          <BDropdownItem @click="openCreateModal">
            <i class="bi bi-plus-circle me-2"></i>新增自訂義庫存
          </BDropdownItem>
        </BDropdown>

        <!-- 原有的篩選和搜尋按鈕 -->
        <BDropdown variant="outline-secondary" text="篩選" auto-close="outside">
          <template #button-content> <i class="bi bi-filter me-1"></i>篩選 </template>
          <template #default>
            <div class="dropdown-menu-form p-3" style="min-width: 300px">
              <!-- 庫存類型篩選 -->
              <div class="mb-3">
                <label class="form-label">庫存類型</label>
                <select v-model="filters.inventoryType" class="form-select" @change="applyFilters">
                  <option value="">全部類型</option>
                  <option value="DishTemplate">餐點</option>
                  <option value="else">其他</option>
                </select>
              </div>

              <!-- 庫存狀態篩選 -->
              <div class="mb-3">
                <label class="form-label">庫存狀態</label>
                <select v-model="filters.status" class="form-select" @change="applyFilters">
                  <option value="">全部狀態</option>
                  <option value="normal">正常</option>
                  <option value="low">低庫存</option>
                  <option value="out">缺貨</option>
                  <option value="soldOut">售完</option>
                </select>
              </div>

              <!-- 追蹤狀態篩選 -->
              <div class="mb-3">
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    v-model="filters.onlyTracked"
                    id="onlyTracked"
                    @change="applyFilters"
                  />
                  <label class="form-check-label" for="onlyTracked"> 只顯示追蹤庫存的項目 </label>
                </div>
              </div>

              <button class="btn btn-sm btn-secondary w-100" @click="resetFilters">重置篩選</button>
            </div>
          </template>
        </BDropdown>

        <div class="input-group" style="width: 300px">
          <input
            type="text"
            class="form-control"
            placeholder="搜尋項目名稱..."
            v-model="searchQuery"
            @input="handleSearch"
          />
          <button class="btn btn-outline-secondary" type="button" @click="handleSearch">
            <i class="bi bi-search"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- 統計卡片 -->
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="card bg-primary text-white">
          <div class="card-body">
            <h6 class="card-title">總項目數</h6>
            <h3 class="mb-0">{{ stats.totalItems }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-warning text-dark">
          <div class="card-body">
            <h6 class="card-title">低庫存</h6>
            <h3 class="mb-0">{{ stats.lowStock }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-danger text-white">
          <div class="card-body">
            <h6 class="card-title">缺貨/售完</h6>
            <h3 class="mb-0">{{ stats.outOfStock + stats.soldOut }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-info text-white">
          <div class="card-body">
            <h6 class="card-title">需要補貨</h6>
            <h3 class="mb-0">{{ stats.needsRestock }}</h3>
          </div>
        </div>
      </div>
    </div>

    <!-- 錯誤提示 -->
    <div class="alert alert-danger" v-if="error">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ error }}
    </div>

    <!-- 載入中提示 -->
    <div class="d-flex justify-content-center my-5" v-if="isLoading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加載中...</span>
      </div>
    </div>

    <!-- 庫存列表 -->
    <div class="card" v-if="!isLoading">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th>類型</th>
                <th>項目名稱</th>
                <th>總庫存</th>
                <th>可販售庫存</th>
                <th>狀態</th>
                <th>最低警告值</th>
                <th>補貨目標</th>
                <th>追蹤庫存</th>
                <th>是否自動停售</th>
                <th>售完狀態(快速切換)</th>
                <th width="250">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in inventories" :key="item._id" :class="getRowClass(item)">
                <td>
                  <span
                    class="badge"
                    :class="item.inventoryType === 'DishTemplate' ? 'bg-info' : 'bg-secondary'"
                  >
                    {{ item.inventoryType === 'DishTemplate' ? '餐點' : '其他' }}
                  </span>
                </td>
                <td>{{ item.itemName }}</td>
                <td>
                  <strong>{{ item.totalStock }}</strong>
                </td>
                <td>
                  <strong v-if="item.enableAvailableStock">{{ item.availableStock }}</strong>
                  <span v-else class="text-muted">未啟用</span>
                </td>
                <td>
                  <span class="badge" :class="getStatusBadgeClass(item)">
                    {{ getStatusText(item) }}
                  </span>
                </td>
                <td>{{ item.minStockAlert }}</td>
                <td>{{ item.targetStockLevel || '-' }}</td>
                <td>
                  <div class="form-check form-switch">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      :checked="item.isInventoryTracked"
                      disabled
                    />
                  </div>
                </td>
                <td>
                  <div class="form-check form-switch">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      :checked="item.enableAvailableStock"
                      disabled
                    />
                  </div>
                </td>
                <td>
                  <div class="form-check form-switch">
                    <input
                      v-if="item.inventoryType === 'DishTemplate'"
                      class="form-check-input"
                      type="checkbox"
                      v-model="item.isSoldOut"
                      @change="toggleSoldOut(item)"
                      :disabled="pendingSoldOutItem && pendingSoldOutItem._id === item._id"
                    />
                    <input v-else class="form-check-input" type="checkbox" disabled />
                  </div>
                </td>
                <td>
                  <BButtonGroup size="sm">
                    <BButton variant="outline-primary" @click="openAdjustModal(item)">
                      <i class="bi bi-pencil"></i> 調整
                    </BButton>
                    <BButton variant="outline-secondary" @click="openShowSettingModal(item)">
                      <i class="bi bi-gear me-1"></i> 設定
                    </BButton>
                    <BButton
                      variant="outline-secondary"
                      :to="`/admin/${brandId}/inventory/store/${storeId}/detail/${item._id}?type=${item.inventoryType}`"
                    >
                      <i class="bi bi-eye"></i> 詳情
                    </BButton>
                  </BButtonGroup>
                </td>
              </tr>

              <!-- 無資料提示 -->
              <tr v-if="!inventories || inventories.length === 0">
                <td colspan="10" class="text-center py-4">
                  <div class="text-muted">
                    {{ searchQuery ? '沒有符合搜尋條件的庫存項目' : '尚未建立任何庫存項目' }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 分頁控制 -->
    <nav v-if="pagination.totalPages > 1" class="mt-4">
      <ul class="pagination justify-content-center">
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <a class="page-link" href="#" @click.prevent="changePage(currentPage - 1)">上一頁</a>
        </li>
        <li
          class="page-item"
          v-for="page in visiblePages"
          :key="page"
          :class="{ active: currentPage === page }"
        >
          <a class="page-link" href="#" @click.prevent="changePage(page)">{{ page }}</a>
        </li>
        <li class="page-item" :class="{ disabled: currentPage === pagination.totalPages }">
          <a class="page-link" href="#" @click.prevent="changePage(currentPage + 1)">下一頁</a>
        </li>
      </ul>
    </nav>

    <!-- 初始化餐點庫存 Modal -->
    <InitializeDishInventoryModal
      v-if="showInitializeModal"
      :store-id="storeId"
      :brand-id="brandId"
      @close="showInitializeModal = false"
      @success="handleInitializeSuccess"
    />

    <!-- 新增自訂義庫存 Modal -->
    <CreateInventoryModal
      v-if="showCreateModal"
      :store-id="storeId"
      :brand-id="brandId"
      @close="showCreateModal = false"
      @success="handleCreateSuccess"
    />

    <!-- 庫存調整 Modal -->
    <StockAdjustModal
      v-if="showAdjustModal"
      :item="selectedItem"
      :store-id="storeId"
      :brand-id="brandId"
      @close="showAdjustModal = false"
      @success="handleAdjustSuccess"
    />

    <!-- 庫存設定 -->
    <StockSettingModal
      v-if="showSettingModal"
      :item="selectedItem"
      :store-id="storeId"
      :brand-id="brandId"
      @close="showSettingModal = false"
      @success="handleSettingSuccess"
    />
  </div>
  <!-- 確認售完狀態變更 Modal -->
  <BModal
    v-model="showSoldOutConfirm"
    title="確認變更售完狀態"
    @ok="confirmSoldOutChange"
    @cancel="cancelSoldOutChange"
  >
    <p v-if="pendingSoldOutItem?.isSoldOut">
      確定要將「{{ pendingSoldOutItem?.itemName }}」設為售完嗎？設為售完後，顧客將無法點餐此項目。
    </p>
    <p v-else>
      確定要將「{{
        pendingSoldOutItem?.itemName
      }}」恢復為正常狀態嗎？恢復後，顧客將可以正常點餐此項目。
    </p>
  </BModal>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BDropdown, BDropdownItem, BButton, BButtonGroup, BModal } from 'bootstrap-vue-next'
import api from '@/api'
import InitializeDishInventoryModal from './InitializeDishInventoryModal.vue'
import CreateInventoryModal from './CreateInventoryModal.vue'
import StockAdjustModal from './StockAdjustModal.vue'
import StockSettingModal from './StockSettingModal.vue'

// 路由
const route = useRoute()
const router = useRouter()
const brandId = computed(() => route.params.brandId)
const storeId = computed(() => route.params.storeId)

// 狀態
const isLoading = ref(true)
const error = ref('')
const inventories = ref([])
const searchQuery = ref('')
const currentPage = ref(1)
const storeName = ref('')
const showSoldOutConfirm = ref(false)
const pendingSoldOutItem = ref(null)

// Modal 狀態
const showInitializeModal = ref(false)
const showCreateModal = ref(false)
const showAdjustModal = ref(false)
const selectedItem = ref(null)
const showSettingModal = ref(false)
// 篩選條件
const filters = reactive({
  inventoryType: '',
  status: '',
  onlyTracked: false,
})

// 分頁
const pagination = reactive({
  total: 0,
  totalPages: 0,
  limit: 20,
})

// 統計數據
const stats = ref({
  totalItems: 0,
  lowStock: 0,
  outOfStock: 0,
  soldOut: 0,
  needsRestock: 0,
})

// 計算可見頁碼
const visiblePages = computed(() => {
  const total = pagination.totalPages
  const current = currentPage.value
  const pages = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 3) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 2) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    }
  }

  return pages
})

// Modal 操作方法
const openInitializeModal = () => {
  showInitializeModal.value = true
}

const openCreateModal = () => {
  showCreateModal.value = true
}

const openAdjustModal = (item) => {
  selectedItem.value = item
  showAdjustModal.value = true
}

const openShowSettingModal = (item) => {
  selectedItem.value = item
  showSettingModal.value = true
}

const handleInitializeSuccess = () => {
  showInitializeModal.value = false
  fetchInventory()
}

const handleCreateSuccess = () => {
  showCreateModal.value = false
  fetchInventory()
}

const handleAdjustSuccess = () => {
  showAdjustModal.value = false
  selectedItem.value = null
  fetchInventory()
}

// 處理設定成功
const handleSettingSuccess = () => {
  showSettingModal.value = false
  selectedItem.value = null
  fetchInventory()
}

const toggleSoldOut = (item) => {
  // 立即恢復原始狀態，等待用戶確認
  pendingSoldOutItem.value = { ...item }
  showSoldOutConfirm.value = true
}

const confirmSoldOutChange = async () => {
  if (!pendingSoldOutItem.value) return

  try {
    await api.inventory.toggleSoldOut({
      storeId: storeId.value,
      inventoryId: pendingSoldOutItem.value._id,
      isSoldOut: pendingSoldOutItem.value.isSoldOut,
    })

    // API 成功，更新統計
    updateStats()
  } catch (err) {
    console.error('切換售完狀態失敗:', err)
    error.value = err.response?.data?.message || '切換售完狀態時發生錯誤'

    // 失敗時恢復原始狀態
    const index = inventories.value.findIndex((item) => item._id === pendingSoldOutItem.value._id)
    if (index !== -1) {
      inventories.value[index].isSoldOut = !inventories.value[index].isSoldOut
    }
  } finally {
    showSoldOutConfirm.value = false
    pendingSoldOutItem.value = null
  }
}

const cancelSoldOutChange = () => {
  // 取消時恢復原始狀態
  if (pendingSoldOutItem.value) {
    const index = inventories.value.findIndex((item) => item._id === pendingSoldOutItem.value._id)
    if (index !== -1) {
      inventories.value[index].isSoldOut = !inventories.value[index].isSoldOut
    }
  }

  showSoldOutConfirm.value = false
  pendingSoldOutItem.value = null
}

// 庫存狀態相關方法
const getStatusText = (item) => {
  if (item.isSoldOut) return '售完'
  if (!item.isInventoryTracked) return '不追蹤'
  if (item.totalStock === 0) return '缺貨'
  if (item.needsRestock) return '需補貨'
  if (item.totalStock <= item.minStockAlert) return '低庫存'
  return '正常'
}

const getStatusBadgeClass = (item) => {
  const status = getStatusText(item)
  switch (status) {
    case '售完':
      return 'bg-danger'
    case '缺貨':
      return 'bg-danger'
    case '需補貨':
      return 'bg-warning text-dark'
    case '低庫存':
      return 'bg-warning text-dark'
    case '不追蹤':
      return 'bg-secondary'
    default:
      return 'bg-success'
  }
}

const getRowClass = (item) => {
  const status = getStatusText(item)
  if (status === '售完' || status === '缺貨') return 'table-danger'
  if (status === '低庫存' || status === '需補貨') return 'table-warning'
  return ''
}

// 獲取庫存列表
const fetchInventory = async () => {
  if (!storeId.value) {
    error.value = '請選擇店鋪'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    const params = {
      storeId: storeId.value,
      search: searchQuery.value,
      page: currentPage.value,
      limit: pagination.limit,
    }

    if (filters.inventoryType) {
      params.inventoryType = filters.inventoryType
    }

    if (filters.onlyTracked) {
      params.onlyTracked = true
    }

    const response = await api.inventory.getStoreInventory(params)

    if (response && response.inventory) {
      inventories.value = response.inventory
      pagination.total = response.total || response.inventory.length
      pagination.totalPages = response.totalPages || Math.ceil(pagination.total / pagination.limit)

      if (filters.status) {
        inventories.value = inventories.value.filter((item) => {
          const status = getStatusText(item)
          switch (filters.status) {
            case 'normal':
              return status === '正常'
            case 'low':
              return status === '低庫存' || status === '需補貨'
            case 'out':
              return status === '缺貨'
            case 'soldOut':
              return status === '售完'
            default:
              return true
          }
        })
      }

      updateStats()
    } else {
      inventories.value = []
      pagination.total = 0
      pagination.totalPages = 1
      stats.value = {
        totalItems: 0,
        lowStock: 0,
        outOfStock: 0,
        soldOut: 0,
        needsRestock: 0,
      }
    }
  } catch (err) {
    console.error('獲取庫存列表失敗:', err)
    error.value = err.response?.data?.message || '獲取庫存列表時發生錯誤'
    inventories.value = []
    pagination.total = 0
    pagination.totalPages = 1
    stats.value = {
      totalItems: 0,
      lowStock: 0,
      outOfStock: 0,
      soldOut: 0,
      needsRestock: 0,
    }
  } finally {
    isLoading.value = false
  }
}

// 更新統計數據
const updateStats = () => {
  if (!inventories.value || !Array.isArray(inventories.value)) {
    stats.value = {
      totalItems: 0,
      lowStock: 0,
      outOfStock: 0,
      soldOut: 0,
      needsRestock: 0,
    }
    return
  }

  stats.value = {
    totalItems: inventories.value.length,
    lowStock: inventories.value.filter((item) => {
      const status = getStatusText(item)
      return status === '低庫存'
    }).length,
    outOfStock: inventories.value.filter((item) => {
      const status = getStatusText(item)
      return status === '缺貨'
    }).length,
    soldOut: inventories.value.filter((item) => item.isSoldOut).length,
    needsRestock: inventories.value.filter((item) => item.needsRestock).length,
  }
}

// 搜尋處理
const handleSearch = () => {
  currentPage.value = 1
  fetchInventory()
}

// 篩選操作
const applyFilters = () => {
  currentPage.value = 1
  fetchInventory()
}

const resetFilters = () => {
  filters.inventoryType = ''
  filters.status = ''
  filters.onlyTracked = false
  currentPage.value = 1
  fetchInventory()
}

// 換頁
const changePage = (page) => {
  if (page < 1 || page > pagination.totalPages || page === '...') return
  currentPage.value = page
  fetchInventory()
}

// 獲取店鋪資訊
const fetchStoreInfo = async () => {
  if (!storeId.value) return

  try {
    const response = await api.store.getStoreById({ brandId: brandId.value, id: storeId.value })
    if (response && response.store) {
      storeName.value = response.store.name
    }
  } catch (err) {
    console.error('獲取店鋪資訊失敗:', err)
  }
}

// 生命週期
onMounted(() => {
  fetchStoreInfo()
  fetchInventory()
})
</script>

<style scoped>
.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.table th {
  font-weight: 600;
  background-color: #f8f9fa;
}

.table-danger {
  background-color: rgba(220, 53, 69, 0.1);
}

.table-warning {
  background-color: rgba(255, 193, 7, 0.1);
}

.btn-group-sm > .btn {
  padding: 0.25rem 0.5rem;
}

.dropdown-menu {
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.dropdown-menu-form {
  position: relative;
  padding: 1rem;
}
</style>
