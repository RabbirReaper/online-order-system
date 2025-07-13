<template>
  <div class="container-fluid py-4">
    <!-- 頁面標題及操作按鈕 -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div class="d-flex">
        <div class="bg-primary rounded me-3" style="width: 6px; height: 26px"></div>
        <h4>{{ storeName }} 的菜單管理</h4>
      </div>
      <div class="d-flex">
        <router-link :to="`/admin/${brandId}/menus`" class="btn btn-outline-secondary me-2">
          <i class="bi bi-arrow-left me-1"></i>返回店鋪列表
        </router-link>
        <router-link :to="`/admin/${brandId}/menus/create/${storeId}`" class="btn btn-primary">
          <i class="bi bi-plus-lg me-1"></i>新增菜單
        </router-link>
      </div>
    </div>

    <!-- 篩選器 -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row align-items-end">
          <div class="col-md-4">
            <label class="form-label">狀態</label>
            <select v-model="filters.activeOnly" @change="applyFilters" class="form-select">
              <option value="">所有狀態</option>
              <option value="true">僅啟用</option>
              <option value="false">僅停用</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label">搜尋</label>
            <input
              type="text"
              v-model="filters.search"
              @input="applyFilters"
              class="form-control"
              placeholder="搜尋菜單名稱..."
            />
          </div>
          <div class="col-md-2">
            <button @click="resetFilters" class="btn btn-outline-secondary w-100">
              <i class="bi bi-arrow-counterclockwise me-1"></i>重置
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 載入中提示 -->
    <div v-if="isLoading" class="d-flex justify-content-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加載中...</span>
      </div>
    </div>

    <!-- 錯誤提示 -->
    <div v-else-if="error" class="alert alert-danger">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ error }}
    </div>

    <!-- 菜單分類顯示 -->
    <div v-else>
      <!-- 統計資訊 -->
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="card bg-primary text-white">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <h6 class="card-title">總菜單數</h6>
                  <h4 class="mb-0">{{ allMenus.length }}</h4>
                </div>
                <div class="align-self-center">
                  <i class="bi bi-menu-button-wide fs-2"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-success text-white">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <h6 class="card-title">現金購買餐點</h6>
                  <h4 class="mb-0">{{ foodMenus.length }}</h4>
                </div>
                <div class="align-self-center">
                  <i class="bi bi-cup-hot fs-2"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-info text-white">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <h6 class="card-title">現金購買預購券</h6>
                  <h4 class="mb-0">{{ cashCouponMenus.length }}</h4>
                </div>
                <div class="align-self-center">
                  <i class="bi bi-ticket fs-2"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-warning text-white">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <h6 class="card-title">點數兌換</h6>
                  <h4 class="mb-0">{{ pointExchangeMenus.length }}</h4>
                </div>
                <div class="align-self-center">
                  <i class="bi bi-star fs-2"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 三欄分類顯示 -->
      <div class="row">
        <!-- 現金購買餐點 -->
        <div class="col-lg-4">
          <div class="card h-100">
            <div class="card-header bg-success text-white">
              <h5 class="mb-0">
                <i class="bi bi-cup-hot me-2"></i>現金購買餐點
                <span class="badge bg-light text-dark ms-2">{{ foodMenus.length }}</span>
              </h5>
            </div>
            <div class="card-body p-2">
              <div v-if="foodMenus.length === 0" class="text-center py-4 text-muted">
                <i class="bi bi-cup-hot display-4 mb-2"></i>
                <p>尚未設置餐點菜單</p>
              </div>
              <div v-else class="menu-list">
                <div v-for="menu in foodMenus" :key="menu._id" class="menu-item mb-2">
                  <div class="card border-0 shadow-sm">
                    <div class="card-body p-2">
                      <div class="d-flex justify-content-between align-items-center">
                        <div class="flex-grow-1">
                          <div class="d-flex align-items-center mb-1">
                            <h6 class="mb-0 me-2">{{ menu.name || '未命名菜單' }}</h6>
                            <span
                              class="badge rounded-pill"
                              :class="menu.isActive ? 'bg-success' : 'bg-secondary'"
                            >
                              {{ menu.isActive ? '啟用中' : '已停用' }}
                            </span>
                          </div>
                          <small class="text-muted">
                            分類: {{ menu.categories ? menu.categories.length : 0 }} | 商品:
                            {{ countTotalItems(menu) }}
                          </small>
                        </div>

                        <!-- 操作區域 -->
                        <div class="d-flex align-items-center">
                          <!-- 狀態切換 -->
                          <div class="form-check form-switch me-2">
                            <input
                              class="form-check-input"
                              type="checkbox"
                              :id="`menu-active-${menu._id}`"
                              v-model="menu.isActive"
                              @change="toggleMenuActive(menu)"
                              :disabled="isToggling"
                            />
                          </div>

                          <!-- 操作按鈕 -->
                          <div class="btn-group btn-group-sm">
                            <router-link
                              :to="`/admin/${brandId}/menus/detail/${storeId}/${menu._id}`"
                              class="btn btn-outline-primary btn-sm"
                              title="查看詳情"
                            >
                              <i class="bi bi-eye"></i>
                            </router-link>
                            <router-link
                              :to="`/admin/${brandId}/menus/edit/${storeId}/${menu._id}`"
                              class="btn btn-outline-warning btn-sm"
                              title="編輯菜單"
                            >
                              <i class="bi bi-pencil"></i>
                            </router-link>
                            <button
                              type="button"
                              class="btn btn-outline-danger btn-sm"
                              @click="confirmDeleteMenu(menu)"
                              title="刪除菜單"
                            >
                              <i class="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 現金購買預購券 -->
        <div class="col-lg-4">
          <div class="card h-100">
            <div class="card-header bg-info text-white">
              <h5 class="mb-0">
                <i class="bi bi-ticket me-2"></i>現金購買預購券
                <span class="badge bg-light text-dark ms-2">{{ cashCouponMenus.length }}</span>
              </h5>
            </div>
            <div class="card-body p-2">
              <div v-if="cashCouponMenus.length === 0" class="text-center py-4 text-muted">
                <i class="bi bi-ticket display-4 mb-2"></i>
                <p>尚未設置預購券菜單</p>
              </div>
              <div v-else class="menu-list">
                <div v-for="menu in cashCouponMenus" :key="menu._id" class="menu-item mb-2">
                  <div class="card border-0 shadow-sm">
                    <div class="card-body p-2">
                      <div class="d-flex justify-content-between align-items-center">
                        <div class="flex-grow-1">
                          <div class="d-flex align-items-center mb-1">
                            <h6 class="mb-0 me-2">{{ menu.name }}</h6>
                            <span
                              class="badge rounded-pill"
                              :class="menu.isActive ? 'bg-success' : 'bg-secondary'"
                            >
                              {{ menu.isActive ? '啟用中' : '已停用' }}
                            </span>
                          </div>
                          <small class="text-muted">
                            分類: {{ menu.categories ? menu.categories.length : 0 }} | 商品:
                            {{ countTotalItems(menu) }}
                          </small>
                        </div>

                        <!-- 操作區域 -->
                        <div class="d-flex align-items-center">
                          <!-- 狀態切換 -->
                          <div class="form-check form-switch me-2">
                            <input
                              class="form-check-input"
                              type="checkbox"
                              :id="`menu-active-${menu._id}`"
                              v-model="menu.isActive"
                              @change="toggleMenuActive(menu)"
                              :disabled="isToggling"
                            />
                          </div>

                          <!-- 操作按鈕 -->
                          <div class="btn-group btn-group-sm">
                            <router-link
                              :to="`/admin/${brandId}/menus/detail/${storeId}/${menu._id}`"
                              class="btn btn-outline-primary btn-sm"
                              title="查看詳情"
                            >
                              <i class="bi bi-eye"></i>
                            </router-link>
                            <router-link
                              :to="`/admin/${brandId}/menus/edit/${storeId}/${menu._id}`"
                              class="btn btn-outline-warning btn-sm"
                              title="編輯菜單"
                            >
                              <i class="bi bi-pencil"></i>
                            </router-link>
                            <button
                              type="button"
                              class="btn btn-outline-danger btn-sm"
                              @click="confirmDeleteMenu(menu)"
                              title="刪除菜單"
                            >
                              <i class="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 點數兌換 -->
        <div class="col-lg-4">
          <div class="card h-100">
            <div class="card-header bg-warning text-white">
              <h5 class="mb-0">
                <i class="bi bi-star me-2"></i>點數兌換
                <span class="badge bg-light text-dark ms-2">{{ pointExchangeMenus.length }}</span>
              </h5>
            </div>
            <div class="card-body p-2">
              <div v-if="pointExchangeMenus.length === 0" class="text-center py-4 text-muted">
                <i class="bi bi-star display-4 mb-2"></i>
                <p>尚未設置點數兌換菜單</p>
              </div>
              <div v-else class="menu-list">
                <div v-for="menu in pointExchangeMenus" :key="menu._id" class="menu-item mb-2">
                  <div class="card border-0 shadow-sm">
                    <div class="card-body p-2">
                      <div class="d-flex justify-content-between align-items-center">
                        <div class="flex-grow-1">
                          <div class="d-flex align-items-center mb-1">
                            <h6 class="mb-0 me-2">{{ menu.name || '點數兌換' }}</h6>
                            <span
                              class="badge rounded-pill"
                              :class="menu.isActive ? 'bg-success' : 'bg-secondary'"
                            >
                              {{ menu.isActive ? '啟用中' : '已停用' }}
                            </span>
                          </div>
                          <small class="text-muted">
                            分類: {{ menu.categories ? menu.categories.length : 0 }} | 商品:
                            {{ countTotalItems(menu) }}
                          </small>
                        </div>

                        <!-- 操作區域 -->
                        <div class="d-flex align-items-center">
                          <!-- 狀態切換 -->
                          <div class="form-check form-switch me-2">
                            <input
                              class="form-check-input"
                              type="checkbox"
                              :id="`menu-active-${menu._id}`"
                              v-model="menu.isActive"
                              @change="toggleMenuActive(menu)"
                              :disabled="isToggling"
                            />
                          </div>

                          <!-- 操作按鈕 -->
                          <div class="btn-group btn-group-sm">
                            <router-link
                              :to="`/admin/${brandId}/menus/detail/${storeId}/${menu._id}`"
                              class="btn btn-outline-primary btn-sm"
                              title="查看詳情"
                            >
                              <i class="bi bi-eye"></i>
                            </router-link>
                            <router-link
                              :to="`/admin/${brandId}/menus/edit/${storeId}/${menu._id}`"
                              class="btn btn-outline-warning btn-sm"
                              title="編輯菜單"
                            >
                              <i class="bi bi-pencil"></i>
                            </router-link>
                            <button
                              type="button"
                              class="btn btn-outline-danger btn-sm"
                              @click="confirmDeleteMenu(menu)"
                              title="刪除菜單"
                            >
                              <i class="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 無菜單提示 -->
      <div v-if="allMenus.length === 0" class="text-center py-5 bg-light rounded mt-4">
        <i class="bi bi-menu-button-wide display-1 text-muted mb-3"></i>
        <h5>此店鋪尚未設置菜單</h5>
        <p class="text-muted">創建菜單後，您可以添加餐點分類和商品項目</p>
        <router-link :to="`/admin/${brandId}/menus/create/${storeId}`" class="btn btn-primary mt-2">
          <i class="bi bi-plus-lg me-1"></i>新增第一個菜單
        </router-link>
      </div>
    </div>

    <!-- 確認刪除對話框 -->
    <b-modal
      id="deleteModal"
      v-model:show="showDeleteModal"
      :title="`刪除菜單 - ${selectedMenu?.name}`"
      @ok="deleteMenu"
      :ok-disabled="isDeleting"
      ok-title="確認刪除"
      ok-variant="danger"
      cancel-title="取消"
    >
      <p v-if="selectedMenu">確定要刪除菜單「{{ selectedMenu.name }}」嗎？</p>
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        此操作無法撤銷，菜單內所有分類和商品數據都將被永久刪除。
      </div>
      <div v-if="selectedMenu">
        <ul class="mb-0">
          <li>菜單類型：{{ getMenuTypeText(selectedMenu.menuType) }}</li>
          <li>分類數量：{{ selectedMenu.categories?.length || 0 }}</li>
          <li>商品數量：{{ countTotalItems(selectedMenu) }}</li>
        </ul>
      </div>
      <div v-if="isDeleting" class="text-center mt-3">
        <div class="spinner-border text-danger" role="status">
          <span class="visually-hidden">刪除中...</span>
        </div>
      </div>
    </b-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BModal } from 'bootstrap-vue-next'
import api from '@/api'
import { getMenuTypeText, formatDate, countTotalItems, countActiveItems } from './menuUtils'

// 路由相關
const route = useRoute()
const router = useRouter()
const brandId = computed(() => route.params.brandId)
const storeId = computed(() => route.params.storeId)

// 狀態變數
const store = ref(null)
const allMenus = ref([])
const isLoading = ref(true)
const isDeleting = ref(false)
const isToggling = ref(false)
const storeName = ref('載入中...')
const showDeleteModal = ref(false)
const selectedMenu = ref(null)
const error = ref('')

// 篩選器
const filters = reactive({
  activeOnly: '',
  search: '',
})

// 按類型分組的計算屬性
const foodMenus = computed(() => {
  return filteredMenusByType('food')
})

const cashCouponMenus = computed(() => {
  return filteredMenusByType('cash_coupon')
})

const pointExchangeMenus = computed(() => {
  return filteredMenusByType('point_exchange')
})

// 按類型篩選菜單的函數
const filteredMenusByType = (menuType) => {
  let filtered = allMenus.value.filter((menu) => menu.menuType === menuType)

  // 狀態篩選
  if (filters.activeOnly !== '') {
    const isActive = filters.activeOnly === 'true'
    filtered = filtered.filter((menu) => menu.isActive === isActive)
  }

  // 搜尋篩選
  if (filters.search.trim()) {
    const searchQuery = filters.search.toLowerCase().trim()
    filtered = filtered.filter((menu) => menu.name && menu.name.toLowerCase().includes(searchQuery))
  }

  return filtered
}

// 獲取店鋪和菜單資料
const fetchData = async () => {
  if (!storeId.value || !brandId.value) return

  isLoading.value = true
  error.value = ''

  try {
    // 1. 獲取店鋪資料
    const storeResponse = await api.store.getStoreById({
      brandId: brandId.value,
      id: storeId.value,
    })

    if (storeResponse && storeResponse.store) {
      store.value = storeResponse.store
      storeName.value = storeResponse.store.name
    } else {
      error.value = '無法獲取店鋪資訊'
      return
    }

    // 2. 獲取所有菜單資料
    const menusResponse = await api.menu.getAllStoreMenus({
      brandId: brandId.value,
      storeId: storeId.value,
      includeUnpublished: true, // 管理界面顯示所有菜單
    })

    if (menusResponse && menusResponse.menus) {
      allMenus.value = menusResponse.menus
    } else {
      allMenus.value = []
    }
  } catch (err) {
    console.error('獲取資料失敗:', err)
    error.value = '獲取資料時發生錯誤，請稍後再試'
  } finally {
    isLoading.value = false
  }
}

// 應用篩選器
const applyFilters = () => {
  // 篩選會自動通過計算屬性處理
}

// 重置篩選器
const resetFilters = () => {
  filters.activeOnly = ''
  filters.search = ''
}

// 切換菜單啟用狀態
const toggleMenuActive = async (menu) => {
  if (isToggling.value) return

  isToggling.value = true
  const originalStatus = !menu.isActive // 記錄原始狀態

  try {
    // 發送API請求更新狀態
    const response = await api.menu.updateMenu({
      brandId: brandId.value,
      storeId: storeId.value,
      menuId: menu._id,
      data: { isActive: menu.isActive },
    })

    if (response && response.menu) {
      // 重新獲取所有菜單資料以確保同步
      // 因為後台可能會自動停用同類型的其他菜單
      await refreshMenuData()
    }
  } catch (err) {
    console.error('切換菜單狀態失敗:', err)

    // 恢復原狀態
    menu.isActive = originalStatus

    // 顯示錯誤訊息
    let errorMessage = '切換菜單狀態時發生錯誤'
    if (err.response && err.response.data && err.response.data.message) {
      errorMessage = err.response.data.message
    }
    alert(errorMessage)
  } finally {
    isToggling.value = false
  }
}

// 刷新菜單資料的輔助函數
const refreshMenuData = async () => {
  try {
    const menusResponse = await api.menu.getAllStoreMenus({
      brandId: brandId.value,
      storeId: storeId.value,
      includeUnpublished: true,
    })

    if (menusResponse && menusResponse.menus) {
      allMenus.value = menusResponse.menus
    }
  } catch (err) {
    console.error('刷新菜單資料失敗:', err)
  }
}

// 顯示刪除確認對話框
const confirmDeleteMenu = (menu) => {
  selectedMenu.value = menu
  showDeleteModal.value = true
}

// 刪除菜單
const deleteMenu = async () => {
  if (!selectedMenu.value) return

  isDeleting.value = true

  try {
    // 發送API請求刪除菜單
    await api.menu.deleteMenu({
      brandId: brandId.value,
      storeId: storeId.value,
      menuId: selectedMenu.value._id,
    })

    // 從本地陣列中移除
    const menuIndex = allMenus.value.findIndex((m) => m._id === selectedMenu.value._id)
    if (menuIndex !== -1) {
      allMenus.value.splice(menuIndex, 1)
    }

    // 隱藏對話框
    showDeleteModal.value = false
    selectedMenu.value = null
  } catch (err) {
    console.error('刪除菜單失敗:', err)

    let errorMessage = '刪除菜單時發生錯誤，請稍後再試'
    if (err.response && err.response.data && err.response.data.message) {
      errorMessage = err.response.data.message
    }
    alert(errorMessage)
  } finally {
    isDeleting.value = false
  }
}

// 監聽ID變化
watch([storeId, brandId], ([newStoreId, newBrandId]) => {
  if (newStoreId && newBrandId) {
    fetchData()
  }
})

// 生命週期鉤子
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.menu-item {
  transition: transform 0.2s ease;
}

.menu-item:hover {
  transform: translateX(5px);
}

.menu-list {
  max-height: 600px;
  overflow-y: auto;
}

.card-header h5 {
  font-weight: 600;
}

.badge {
  font-weight: 500;
}

.form-switch .form-check-input:checked {
  background-color: #28a745;
  border-color: #28a745;
}

.btn-group-sm .btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

/* 統計卡片樣式 */
.card.bg-primary,
.card.bg-success,
.card.bg-info,
.card.bg-warning {
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 自定義滾動條 */
.menu-list::-webkit-scrollbar {
  width: 6px;
}

.menu-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.menu-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.menu-list::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* 響應式調整 */
@media (max-width: 991.98px) {
  .row > .col-lg-4 {
    margin-bottom: 1rem;
  }
}
</style>
