<template>
  <div>
    <!-- 頁面頂部工具列 -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="d-flex">
        <BInputGroup style="width: 300px">
          <BFormInput
            type="text"
            placeholder="搜尋店鋪..."
            v-model="searchQuery"
            @input="handleSearch"
          />
          <BButton variant="outline-secondary" @click="handleSearch">
            <i class="bi bi-search"></i>
          </BButton>
        </BInputGroup>

        <div class="ms-2">
          <BFormSelect v-model="filterActive" @change="handleSearch">
            <BFormSelectOption value="all">所有狀態</BFormSelectOption>
            <BFormSelectOption value="active">僅顯示啟用</BFormSelectOption>
            <BFormSelectOption value="inactive">僅顯示停用</BFormSelectOption>
          </BFormSelect>
        </div>
      </div>

      <div v-if="canCreateStore">
        <RouterLink :to="`/admin/${brandId}/stores/create`" class="btn btn-primary">
          <i class="bi bi-plus-lg me-1"></i>新增店鋪
        </RouterLink>
      </div>
    </div>

    <!-- 網路錯誤提示 -->
    <BAlert :show="!!networkError" variant="danger">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ networkError }}
    </BAlert>

    <!-- 店鋪卡片列表 -->
    <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xxl-4 g-4">
      <div class="col" v-for="store in stores" :key="store._id">
        <div class="card h-100 store-card">
          <div class="card-img-top position-relative overflow-hidden" style="height: 180px">
            <img
              :src="store.image?.url || '/placeholder.jpg'"
              class="img-fluid w-100 h-100 object-fit-cover"
              :alt="store.name"
            />
            <div class="store-status" :class="store.isActive ? 'bg-success' : 'bg-secondary'">
              {{ store.isActive ? '啟用中' : '已停用' }}
            </div>
          </div>

          <div class="card-body">
            <h5 class="card-title mb-2">{{ store.name }}</h5>

            <div class="mb-3">
              <div class="text-muted small" v-if="isTodayOpen(store)">
                <i class="bi bi-clock me-1"></i>
                今日營業: {{ formatBusinessHours(getTodayBusinessHours(store)) }}
              </div>
              <div class="text-danger small" v-else>
                <i class="bi bi-calendar-x me-1"></i>
                今日公休
              </div>
            </div>

            <div class="d-flex flex-wrap">
              <span class="badge bg-info me-1 mb-1" v-if="hasMenu(store)">
                <i class="bi bi-menu-button me-1"></i>已設定菜單
              </span>
              <span class="badge bg-warning me-1 mb-1" v-if="hasAnnouncements(store)">
                <i class="bi bi-megaphone me-1"></i>{{ store.announcements?.length || 0 }} 則公告
              </span>
            </div>
          </div>

          <div class="card-footer bg-transparent border-top-0">
            <div class="d-flex flex-wrap">
              <BButtonGroup class="mb-2 me-2">
                <RouterLink
                  :to="`/admin/${brandId}/stores/detail/${store._id}`"
                  class="btn btn-outline-primary btn-sm"
                >
                  <i class="bi bi-eye me-1"></i>查看
                </RouterLink>
                <RouterLink
                  :to="`/admin/${brandId}/stores/edit/${store._id}`"
                  class="btn btn-outline-primary btn-sm"
                >
                  <i class="bi bi-pencil me-1"></i>編輯
                </RouterLink>
              </BButtonGroup>

              <BButton
                size="sm"
                class="mb-2"
                :variant="store.isActive ? 'outline-warning' : 'outline-success'"
                @click="toggleStoreActive(store)"
              >
                <i
                  class="bi"
                  :class="store.isActive ? 'bi-pause-fill me-1' : 'bi-play-fill me-1'"
                ></i>
                {{ store.isActive ? '停用' : '啟用' }}
              </BButton>
            </div>
          </div>
        </div>
      </div>

      <!-- 無資料提示 -->
      <div class="col-12" v-if="stores.length === 0 && !isLoading">
        <BAlert :show="true" variant="info" class="text-center py-4">
          <i class="bi bi-info-circle me-2 fs-4"></i>
          <p class="mb-0">{{ searchQuery ? '沒有符合搜尋條件的店鋪' : '尚未創建任何店鋪' }}</p>
          <div class="mt-3" v-if="!searchQuery && canCreateStore">
            <RouterLink :to="`/admin/${brandId}/stores/create`" class="btn btn-primary">
              <i class="bi bi-plus-lg me-1"></i>新增第一間店鋪
            </RouterLink>
          </div>
        </BAlert>
      </div>

      <!-- 加載中提示 -->
      <div class="col-12" v-if="isLoading">
        <div class="d-flex justify-content-center my-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">加載中...</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 分頁控制 -->
    <BPagination
      v-if="pagination.totalPages > 1"
      v-model="currentPage"
      :total-rows="pagination.total"
      :per-page="pagination.limit"
      align="center"
      class="mt-4"
      @input="changePage"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  BButton,
  BButtonGroup,
  BFormInput,
  BFormSelect,
  BFormSelectOption,
  BInputGroup,
  BAlert,
  BPagination,
} from 'bootstrap-vue-next'
import api from '@/api'
import { usePermissions } from '@/composables/usePermissions'

// 從路由中獲取品牌ID
const route = useRoute()
const brandId = computed(() => route.params.brandId)

// 權限檢查
const { hasRole, PERMISSIONS } = usePermissions()
const canCreateStore = computed(() => hasRole(PERMISSIONS.BRAND_ADMIN))

// 狀態變數
const stores = ref([])
const isLoading = ref(true)
const searchQuery = ref('')
const filterActive = ref('all')
const currentPage = ref(1)
const networkError = ref('')
const pagination = reactive({
  total: 0,
  totalPages: 0,
  limit: 12,
})

// 獲取當天星期幾 (0-6，0代表星期日)
const getTodayDayOfWeek = () => {
  return new Date().getDay()
}

// 檢查店鋪是否有菜單
const hasMenu = (store) => {
  return !!store.menuId
}

// 檢查店鋪是否有公告
const hasAnnouncements = (store) => {
  return store.announcements && store.announcements.length > 0
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

// 加載店鋪列表
const fetchStores = async () => {
  if (!brandId.value) return

  isLoading.value = true
  networkError.value = ''

  try {
    // 獲取店鋪列表
    const response = await api.store.getAllStores({
      brandId: brandId.value,
      activeOnly: filterActive.value === 'active' ? true : undefined,
    })

    if (response && response.stores) {
      stores.value = response.stores

      // 處理搜尋過濾
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        stores.value = stores.value.filter((store) => store.name.toLowerCase().includes(query))
      }

      // 如果選擇只顯示未啟用，需要手動過濾
      if (filterActive.value === 'inactive') {
        stores.value = stores.value.filter((store) => !store.isActive)
      }

      // 分頁處理
      pagination.total = stores.value.length
      pagination.totalPages = Math.ceil(pagination.total / pagination.limit)
      const start = (currentPage.value - 1) * pagination.limit
      const end = start + pagination.limit
      stores.value = stores.value.slice(start, end)
    }
  } catch (error) {
    console.error('獲取店鋪列表失敗:', error)
    networkError.value = '網路連線有問題，無法獲取店鋪資料'
  } finally {
    isLoading.value = false
  }
}

// 切換頁碼
const changePage = (page) => {
  if (page < 1 || page > pagination.totalPages) {
    return
  }

  currentPage.value = page
  fetchStores()
}

// 處理搜尋
const handleSearch = () => {
  currentPage.value = 1 // 重置頁碼
  fetchStores()
}

// 切換店鋪啟用狀態
const toggleStoreActive = async (store) => {
  try {
    const newStatus = !store.isActive
    await api.store.toggleStoreActive({
      id: store._id,
      isActive: newStatus,
    })

    // 更新本地狀態
    store.isActive = newStatus
  } catch (error) {
    console.error('切換店鋪狀態失敗:', error)
    alert('切換店鋪狀態時發生錯誤')
  }
}

// 監聽品牌ID變化
watch(
  () => brandId.value,
  (newId, oldId) => {
    if (newId !== oldId) {
      fetchStores()
    }
  },
)

// 生命週期鉤子
onMounted(() => {
  // 載入店鋪列表
  fetchStores()
})
</script>

<style scoped>
.object-fit-cover {
  object-fit: cover;
}

/* 店鋪卡片樣式 */
.store-card {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
}

.store-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.store-status {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 8px;
  border-radius: 4px;
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
}
</style>
