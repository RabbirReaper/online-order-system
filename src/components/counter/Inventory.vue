<template>
  <div class="inventory-container h-100 d-flex flex-column">
    <!-- 頁面標題 -->
    <div class="header-section p-3 border-bottom">
      <div class="d-flex justify-content-between align-items-center">
        <h5 class="mb-0">庫存管理</h5>
        <div class="d-flex gap-2">
          <button
            class="btn btn-sm btn-outline-success"
            @click="syncToUberEats"
            :disabled="isSyncing"
          >
            <span v-if="isSyncing" class="spinner-border spinner-border-sm me-1"></span>
            <i v-else class="bi bi-cloud-upload me-1"></i>
            同步至 UberEats
          </button>
          <button class="btn btn-sm btn-outline-primary" @click="refreshInventory">
            <i class="bi bi-arrow-clockwise me-1"></i>重新整理
          </button>
        </div>
      </div>
    </div>

    <!-- 同步成功訊息 -->
    <BAlert
      v-model="showSyncAlert"
      variant="success"
      dismissible
      class="mx-3 mt-3 mb-0"
    >
      {{ syncMessage }}
    </BAlert>

    <!-- 搜尋和篩選 -->
    <div class="filter-section p-3 border-bottom">
      <div class="row g-2">
        <div class="col-md-6">
          <input
            type="text"
            class="form-control form-control-sm"
            placeholder="搜尋項目名稱..."
            v-model="searchQuery"
          />
        </div>
        <div class="col-md-3">
          <select v-model="statusFilter" class="form-select form-select-sm">
            <option value="">全部狀態</option>
            <option value="normal">正常</option>
            <option value="low">低庫存</option>
            <option value="soldOut">售完</option>
          </select>
        </div>
        <div class="col-md-3">
          <div class="form-check form-check-sm">
            <input
              class="form-check-input"
              type="checkbox"
              v-model="showOnlyTracked"
              id="showOnlyTracked"
            />
            <label class="form-check-label" for="showOnlyTracked">只顯示追蹤庫存</label>
          </div>
        </div>
      </div>
    </div>

    <!-- 統計卡片 -->
    <div class="stats-section p-3 border-bottom">
      <div class="row g-2">
        <div class="col-3">
          <div class="stat-card bg-primary text-white">
            <div class="stat-number">{{ stats.total }}</div>
            <div class="stat-label">總項目</div>
          </div>
        </div>
        <div class="col-3">
          <div class="stat-card bg-warning text-dark">
            <div class="stat-number">{{ stats.lowStock }}</div>
            <div class="stat-label">低庫存</div>
          </div>
        </div>
        <div class="col-3">
          <div class="stat-card bg-danger text-white">
            <div class="stat-number">{{ stats.soldOut }}</div>
            <div class="stat-label">售完</div>
          </div>
        </div>
        <div class="col-3">
          <div class="stat-card bg-success text-white">
            <div class="stat-number">{{ stats.normal }}</div>
            <div class="stat-label">正常</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 錯誤訊息 -->
    <div v-if="error" class="alert alert-danger mx-3 mt-3">
      {{ error }}
    </div>

    <!-- 載入中 -->
    <div v-if="isLoading" class="d-flex justify-content-center align-items-center flex-grow-1">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">載入中...</span>
      </div>
    </div>

    <!-- 庫存列表 -->
    <div v-else class="inventory-list flex-grow-1 overflow-auto">
      <div class="table-responsive">
        <table class="table table-sm table-hover mb-0">
          <thead class="table-light sticky-top">
            <tr>
              <th>項目名稱</th>
              <th width="80">總庫存</th>
              <th width="80">限量</th>
              <th width="80">狀態</th>
              <th width="80">售完</th>
              <th width="120">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredInventories" :key="item._id" :class="getRowClass(item)">
              <td>
                <div class="d-flex align-items-center">
                  <span
                    class="badge badge-sm me-2"
                    :class="item.inventoryType === 'DishTemplate' ? 'bg-info' : 'bg-secondary'"
                  >
                    {{ item.inventoryType === 'DishTemplate' ? '餐點' : '其他' }}
                  </span>
                  <span class="item-name">{{ item.itemName }}</span>
                </div>
              </td>
              <td>
                <span class="fw-bold">{{ item.totalStock }}</span>
              </td>
              <td>
                <span v-if="item.enableAvailableStock" class="fw-bold text-primary">
                  {{ item.availableStock }}
                </span>
                <span v-else class="text-muted">-</span>
              </td>
              <td>
                <span class="badge badge-sm" :class="getStatusBadgeClass(item)">
                  {{ getStatusText(item) }}
                </span>
              </td>
              <td>
                <div class="form-check form-switch">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    v-model="item.isSoldOut"
                    @change="toggleSoldOut(item)"
                    :disabled="item.inventoryType !== 'DishTemplate'"
                  />
                </div>
              </td>
              <td>
                <div class="btn-group btn-group-sm">
                  <button
                    class="btn btn-outline-primary btn-sm"
                    @click="openAdjustModal(item)"
                    title="調整庫存"
                  >
                    <i class="bi bi-pencil"></i>
                  </button>
                </div>
              </td>
            </tr>

            <!-- 無資料提示 -->
            <tr v-if="filteredInventories.length === 0">
              <td colspan="6" class="text-center py-4 text-muted">
                {{ searchQuery ? '沒有符合條件的項目' : '暫無庫存資料' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 庫存調整 BModal -->
    <BModal
      id="adjust-inventory-modal"
      v-model="showAdjustModal"
      :title="`調整庫存 - ${selectedItem?.itemName || ''}`"
      size="md"
      centered
      no-close-on-backdrop
      no-close-on-esc
      @hide="closeAdjustModal"
    >
      <div v-if="selectedItem">
        <!-- 目前庫存狀態 -->
        <div class="row mb-3">
          <div class="col-6">
            <label class="form-label text-muted small">總庫存</label>
            <div class="fs-4 fw-bold">{{ selectedItem.totalStock }}</div>
          </div>
          <div class="col-6" v-if="selectedItem.enableAvailableStock">
            <label class="form-label text-muted small">限量庫存</label>
            <div class="fs-4 fw-bold text-primary">{{ selectedItem.availableStock }}</div>
          </div>
        </div>

        <!-- 調整類型 -->
        <div class="mb-3">
          <label class="form-label">調整類型</label>
          <select v-model="adjustForm.type" class="form-select" @change="resetQuantity">
            <option value="add">增加庫存</option>
            <option value="reduce">減少庫存</option>
            <option value="set">設定新值</option>
          </select>
        </div>

        <!-- 庫存類型選擇（只有在啟用限量庫存時顯示） -->
        <div class="mb-3" v-if="selectedItem.enableAvailableStock">
          <label class="form-label">調整目標</label>
          <select v-model="adjustForm.stockType" class="form-select" @change="resetQuantity">
            <option value="totalStock">總庫存</option>
            <option value="availableStock">限量庫存</option>
            <option v-if="adjustForm.type === 'set'" value="both">同時設定兩者</option>
          </select>
        </div>

        <!-- 數量輸入 -->
        <div class="mb-3">
          <label class="form-label">
            {{ adjustForm.type === 'set' ? '新的庫存值' : '調整數量' }}
          </label>
          <input
            type="number"
            v-model.number="adjustForm.quantity"
            class="form-control"
            min="0"
            required
          />
        </div>

        <!-- 如果是同時設定，還需要輸入限量庫存 -->
        <div class="mb-3" v-if="adjustForm.type === 'set' && adjustForm.stockType === 'both'">
          <label class="form-label">新的限量庫存值</label>
          <input
            type="number"
            v-model.number="adjustForm.availableQuantity"
            class="form-control"
            min="0"
            :max="adjustForm.quantity"
            required
          />
          <div class="form-text text-muted">限量庫存不能超過總庫存</div>
        </div>

        <!-- 原因 -->
        <div class="mb-3">
          <label class="form-label">調整原因（選填）</label>
          <textarea
            v-model="adjustForm.reason"
            class="form-control"
            rows="2"
            placeholder="例如：定期盤點、損耗、補貨等"
          ></textarea>
        </div>

        <!-- 預覽 -->
        <div v-if="adjustForm.quantity > 0" class="alert alert-info">
          <small>
            {{ getAdjustPreviewText() }}
          </small>
        </div>
      </div>

      <template #footer>
        <button type="button" class="btn btn-secondary" @click="closeAdjustModal">取消</button>
        <button
          type="button"
          class="btn btn-primary"
          @click="confirmAdjust"
          :disabled="isAdjusting || !adjustForm.quantity || !isFormValid"
        >
          <span v-if="isAdjusting" class="spinner-border spinner-border-sm me-1"></span>
          {{ isAdjusting ? '處理中...' : '確認調整' }}
        </button>
      </template>
    </BModal>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { BModal, BAlert } from 'bootstrap-vue-next'
import { useCounterStore } from '@/stores/counter'
import api from '@/api'

// Props
const props = defineProps({
  brandId: {
    type: String,
    required: true,
  },
  storeId: {
    type: String,
    required: true,
  },
})

// Store
const counterStore = useCounterStore()

// 狀態
const isLoading = ref(true)
const error = ref('')
const inventories = ref([])
const searchQuery = ref('')
const statusFilter = ref('')
const showOnlyTracked = ref(false)
const isSyncing = ref(false)
const syncMessage = ref('')
const showSyncAlert = ref(false)

// Modal 狀態
const showAdjustModal = ref(false)
const selectedItem = ref(null)
const isAdjusting = ref(false)

// 調整表單
const adjustForm = reactive({
  type: 'add', // add, reduce, set
  stockType: 'totalStock', // totalStock, availableStock, both
  quantity: 0,
  availableQuantity: 0, // 用於同時設定時的限量庫存值
  reason: '',
})

// 計算屬性
const filteredInventories = computed(() => {
  let filtered = [...inventories.value]

  // 搜尋篩選
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase()
    filtered = filtered.filter((item) => item.itemName?.toLowerCase().includes(query))
  }

  // 狀態篩選
  if (statusFilter.value) {
    filtered = filtered.filter((item) => {
      const status = getStatusText(item)
      switch (statusFilter.value) {
        case 'normal':
          return status === '正常'
        case 'low':
          return status === '低庫存'
        case 'soldOut':
          return status === '售完'
        default:
          return true
      }
    })
  }

  // 只顯示追蹤庫存
  if (showOnlyTracked.value) {
    filtered = filtered.filter((item) => item.isInventoryTracked)
  }

  return filtered
})

// 統計數據
const stats = computed(() => {
  const filtered = filteredInventories.value
  return {
    total: filtered.length,
    normal: filtered.filter((item) => getStatusText(item) === '正常').length,
    lowStock: filtered.filter((item) => getStatusText(item) === '低庫存').length,
    soldOut: filtered.filter((item) => item.isSoldOut).length,
  }
})

// 表單驗證
const isFormValid = computed(() => {
  if (!adjustForm.quantity || adjustForm.quantity < 0) return false

  // 如果是同時設定模式，檢查限量庫存值
  if (adjustForm.type === 'set' && adjustForm.stockType === 'both') {
    if (!adjustForm.availableQuantity || adjustForm.availableQuantity < 0) return false
    if (adjustForm.availableQuantity > adjustForm.quantity) return false
  }

  return true
})

// 方法
const getStatusText = (item) => {
  if (item.isSoldOut) return '售完'
  if (!item.isInventoryTracked) return '不追蹤'
  if (item.totalStock === 0) return '缺貨'
  if (item.enableAvailableStock && item.availableStock === 0) return '自動停售'
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
    case '自動停售':
      return 'bg-danger'
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
  if (status === '低庫存') return 'table-warning'
  return ''
}

// 載入庫存資料
const loadInventory = async () => {
  isLoading.value = true
  error.value = ''

  try {
    const response = await api.inventory.getStoreInventory({
      brandId: props.brandId,
      storeId: props.storeId,
      page: 1,
      limit: 999,
    })

    if (response && response.inventory) {
      inventories.value = response.inventory
    } else {
      inventories.value = []
    }
  } catch (err) {
    console.error('載入庫存失敗:', err)
    error.value = err.response?.data?.message || '載入庫存時發生錯誤'
    inventories.value = []
  } finally {
    isLoading.value = false
  }
}

// 重新整理庫存
const refreshInventory = async () => {
  await loadInventory()
}

// 同步庫存到 UberEats
const syncToUberEats = async () => {
  isSyncing.value = true
  error.value = ''
  syncMessage.value = ''

  try {
    console.log('同步庫存到 UberEats:', { brandId: props.brandId, storeId: props.storeId })
    const response = await api.delivery.syncInventoryToUberEats({
      brandId: props.brandId,
      storeId: props.storeId,
    })

    if (response && response.success) {
      const { disabledCount = 0, enabledCount = 0 } = response.data || {}
      syncMessage.value = `同步成功！已停售 ${disabledCount} 項、正常販售 ${enabledCount} 項`

      // 顯示成功訊息
      showSyncAlert.value = true

      // 重新載入庫存資料以反映最新狀態
      await loadInventory()
    }
  } catch (err) {
    console.error('同步庫存到 UberEats 失敗:', err)
    const errorMsg = err.response?.data?.message || '同步庫存時發生錯誤'
    error.value = errorMsg
  } finally {
    isSyncing.value = false
  }
}

// 切換售完狀態
const toggleSoldOut = async (item) => {
  if (item.inventoryType !== 'DishTemplate') return

  try {
    await api.inventory.toggleSoldOut({
      brandId: props.brandId,
      storeId: props.storeId,
      inventoryId: item._id,
      isSoldOut: item.isSoldOut,
    })

    // 成功後重新載入庫存資料
    await loadInventory()
  } catch (err) {
    console.error('切換售完狀態失敗:', err)
    error.value = err.response?.data?.message || '切換售完狀態時發生錯誤'

    // 失敗時還原狀態
    item.isSoldOut = !item.isSoldOut
  }
}

// 開啟調整 Modal
const openAdjustModal = (item) => {
  selectedItem.value = { ...item }
  adjustForm.type = 'add'
  adjustForm.stockType = 'totalStock'
  adjustForm.quantity = 0
  adjustForm.availableQuantity = 0
  adjustForm.reason = ''
  showAdjustModal.value = true
}

// 關閉調整 Modal
const closeAdjustModal = () => {
  showAdjustModal.value = false
  selectedItem.value = null
}

// 重置數量值
const resetQuantity = () => {
  adjustForm.quantity = 0
  adjustForm.availableQuantity = 0
}

// 取得調整預覽文字
const getAdjustPreviewText = () => {
  if (!selectedItem.value || !adjustForm.quantity) return ''

  const stockTypeLabel = adjustForm.stockType === 'availableStock' ? '限量庫存' : '總庫存'
  const current =
    adjustForm.stockType === 'availableStock'
      ? selectedItem.value.availableStock
      : selectedItem.value.totalStock

  let newValue = current

  switch (adjustForm.type) {
    case 'add':
      newValue = current + adjustForm.quantity
      return `${stockTypeLabel}將從 ${current} 增加到 ${newValue} (+${adjustForm.quantity})`
    case 'reduce':
      newValue = Math.max(0, current - adjustForm.quantity)
      return `${stockTypeLabel}將從 ${current} 減少到 ${newValue} (-${adjustForm.quantity})`
    case 'set':
      if (adjustForm.stockType === 'both') {
        return `總庫存將設定為 ${adjustForm.quantity}，限量庫存將設定為 ${adjustForm.availableQuantity || 0}`
      } else {
        return `${stockTypeLabel}將從 ${current} 設定為 ${adjustForm.quantity} (${adjustForm.quantity >= current ? '+' : ''}${adjustForm.quantity - current})`
      }
    default:
      return ''
  }
}

// 確認調整
const confirmAdjust = async () => {
  if (!selectedItem.value || !adjustForm.quantity || !isFormValid.value) return

  isAdjusting.value = true

  try {
    const baseParams = {
      brandId: props.brandId,
      storeId: props.storeId,
      inventoryId: selectedItem.value._id,
      reason: adjustForm.reason || '前台庫存調整',
    }

    // 根據調整類型和庫存類型調用不同的 API
    switch (adjustForm.type) {
      case 'add':
        await api.inventory.addStock({
          ...baseParams,
          quantity: adjustForm.quantity,
          stockType: adjustForm.stockType,
          inventoryType: selectedItem.value.inventoryType,
        })
        break

      case 'reduce':
        await api.inventory.reduceStock({
          ...baseParams,
          quantity: adjustForm.quantity,
          inventoryType: selectedItem.value.inventoryType,
        })
        break

      case 'set':
        if (adjustForm.stockType === 'availableStock') {
          // 設定限量庫存
          await api.inventory.setAvailableStock({
            ...baseParams,
            availableStock: adjustForm.quantity,
          })
        } else if (adjustForm.stockType === 'both') {
          // 同時設定總庫存和限量庫存
          await api.inventory.updateInventory({
            ...baseParams,
            data: {
              stockType: 'both',
              stock: adjustForm.quantity,
              availableStock: adjustForm.availableQuantity,
              reason: adjustForm.reason || '前台庫存設定',
            },
          })
        } else {
          // 設定總庫存
          await api.inventory.updateInventory({
            ...baseParams,
            data: {
              stockType: 'totalStock',
              stock: adjustForm.quantity,
              reason: adjustForm.reason || '前台庫存設定',
            },
          })
        }
        break
    }

    // 成功後重新載入庫存
    await loadInventory()
    closeAdjustModal()
  } catch (err) {
    console.error('調整庫存失敗:', err)
    error.value = err.response?.data?.message || '調整庫存時發生錯誤'
  } finally {
    isAdjusting.value = false
  }
}

// 監聽篩選變化
watch([searchQuery, statusFilter, showOnlyTracked], () => {
  // 篩選變化時的處理（如果需要的話）
})

// 生命週期
onMounted(async () => {
  await loadInventory()
})
</script>

<style scoped>
.inventory-container {
  background-color: #fff;
}

.header-section {
  background-color: #f8f9fa;
}

.stat-card {
  padding: 0.75rem;
  border-radius: 0.5rem;
  text-align: center;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: bold;
  line-height: 1;
}

.stat-label {
  font-size: 0.75rem;
  opacity: 0.9;
  margin-top: 0.25rem;
}

.inventory-list {
  background-color: #fff;
}

.table th {
  font-weight: 600;
  font-size: 0.875rem;
  border-bottom: 2px solid #dee2e6;
}

.table td {
  vertical-align: middle;
  font-size: 0.875rem;
}

.item-name {
  font-weight: 500;
}

.badge-sm {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

.table-danger {
  background-color: rgba(220, 53, 69, 0.1);
}

.table-warning {
  background-color: rgba(255, 193, 7, 0.1);
}

.btn-group-sm > .btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.form-check-sm .form-check-input {
  margin-top: 0.1rem;
}

.form-check-sm .form-check-label {
  font-size: 0.875rem;
}
</style>
