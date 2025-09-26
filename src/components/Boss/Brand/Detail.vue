<template>
  <div>
    <!-- 載入中提示 -->
    <div class="d-flex justify-content-center my-5" v-if="isLoading">
      <BSpinner variant="primary" label="加載中...">
        <span class="visually-hidden">加載中...</span>
      </BSpinner>
    </div>

    <!-- 錯誤提示 -->
    <BAlert variant="danger" show dismissible v-if="error">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ error }}
    </BAlert>

    <div v-if="brand && !isLoading">
      <!-- 頁面頂部工具列 -->
      <div class="d-flex justify-content-between mb-4">
        <h2 class="mb-0">
          {{ brand.name }}
          <BBadge pill :variant="brand.isActive ? 'success' : 'secondary'">{{
            brand.isActive ? '啟用中' : '已停用'
          }}</BBadge>
        </h2>
        <div class="d-flex">
          <router-link
            :to="{ name: 'brand-edit', params: { id: brand._id } }"
            class="btn btn-primary me-2"
          >
            <i class="bi bi-pencil me-1"></i>編輯品牌
          </router-link>
          <router-link :to="{ name: 'brand-list' }" class="btn btn-secondary">
            <i class="bi bi-arrow-left me-1"></i>返回列表
          </router-link>
        </div>
      </div>

      <!-- 品牌詳情卡片 -->
      <BRow>
        <!-- 左側基本資訊 -->
        <BCol md="5" class="mb-4">
          <BCard class="h-100">
            <BCardBody>
              <BCardTitle>基本資訊</BCardTitle>
              <hr />
              <div class="mb-3">
                <div class="rounded overflow-hidden" style="max-height: 300px">
                  <BImg
                    :src="brand.image?.url || '/placeholder.jpg'"
                    class="w-100 object-fit-cover"
                    :alt="brand.name"
                    fluid
                  />
                </div>
              </div>
              <div class="mb-3">
                <label class="text-muted">品牌名稱</label>
                <p class="mb-1">{{ brand.name }}</p>
              </div>
              <div class="mb-3">
                <label class="text-muted">品牌描述</label>
                <p class="mb-1">{{ brand.description || '無描述' }}</p>
              </div>
              <div class="mb-3">
                <label class="text-muted">創建時間</label>
                <p class="mb-1">{{ formatDate(brand.createdAt) }}</p>
              </div>
              <div class="mb-0">
                <label class="text-muted">最後更新</label>
                <p class="mb-1">{{ formatDate(brand.updatedAt) }}</p>
              </div>
            </BCardBody>
            <BCardFooter class="bg-transparent">
              <div class="d-flex justify-content-between">
                <BButton
                  size="sm"
                  :variant="brand.isActive ? 'outline-warning' : 'outline-success'"
                  @click="toggleBrandActive"
                >
                  <i
                    class="bi"
                    :class="brand.isActive ? 'bi-pause-fill me-1' : 'bi-play-fill me-1'"
                  ></i>
                  {{ brand.isActive ? '停用品牌' : '啟用品牌' }}
                </BButton>
                <!-- 刪除按鈕，使用 v-model 控制 modal -->
                <BButton size="sm" variant="outline-danger" @click="showDeleteModal = true">
                  <i class="bi bi-trash me-1"></i>刪除品牌
                </BButton>
              </div>
            </BCardFooter>
          </BCard>
        </BCol>

        <!-- 右側統計資料 -->
        <BCol md="7" class="mb-4">
          <BCard class="h-100">
            <BCardBody>
              <BCardTitle>品牌統計</BCardTitle>
              <hr />
              <BRow class="g-3 mb-4">
                <BCol md="6">
                  <BCard bg-variant="light">
                    <BCardBody class="p-3">
                      <div class="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 class="mb-0">店鋪數量</h6>
                          <small class="text-muted">品牌旗下店鋪總數</small>
                        </div>
                        <h3 class="mb-0">{{ storeCount }}</h3>
                      </div>
                    </BCardBody>
                  </BCard>
                </BCol>
                <BCol md="6">
                  <BCard bg-variant="light">
                    <BCardBody class="p-3">
                      <div class="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 class="mb-0">活躍店鋪</h6>
                          <small class="text-muted">目前啟用的店鋪數</small>
                        </div>
                        <h3 class="mb-0">{{ activeStoreCount }}</h3>
                      </div>
                    </BCardBody>
                  </BCard>
                </BCol>
              </BRow>

              <!-- 店鋪列表 -->
              <h6 class="mb-3">店鋪列表</h6>
              <BTableSimple responsive hover>
                <BThead>
                  <BTr>
                    <BTh>店鋪名稱</BTh>
                    <BTh>狀態</BTh>
                    <BTh>操作</BTh>
                  </BTr>
                </BThead>
                <BTbody>
                  <BTr v-for="store in stores" :key="store._id">
                    <BTd>{{ store.name }}</BTd>
                    <BTd>
                      <BBadge :variant="store.isActive ? 'success' : 'secondary'">
                        {{ store.isActive ? '啟用中' : '已停用' }}
                      </BBadge>
                    </BTd>
                    <BTd>
                      <router-link
                        :to="`/admin/${brand._id}?storeId=${store._id}`"
                        class="btn btn-sm btn-outline-primary"
                      >
                        <i class="bi bi-door-open me-1"></i>進入
                      </router-link>
                    </BTd>
                  </BTr>
                  <BTr v-if="stores.length === 0">
                    <BTd colspan="3" class="text-center py-3">尚無店鋪</BTd>
                  </BTr>
                </BTbody>
              </BTableSimple>

              <!-- 月報表預留區域 -->
              <div class="mt-4">
                <h6 class="mb-3">銷售報表</h6>
                <BAlert variant="info" show class="text-center py-5">
                  <i class="bi bi-bar-chart-line fs-4 mb-2"></i>
                  <p class="mb-0">月度銷售報表功能開發中</p>
                </BAlert>
              </div>
            </BCardBody>
          </BCard>
        </BCol>
      </BRow>
    </div>

    <!-- 刪除確認對話框 - 使用 BModal 元件 -->
    <BModal
      v-model="showDeleteModal"
      id="deleteBrandModal"
      title="確認刪除"
      centered
      @ok="handleDelete"
      @cancel="showDeleteModal = false"
    >
      <p v-if="brand">
        您確定要刪除品牌 <strong>{{ brand.name }}</strong> 嗎？
      </p>
      <BAlert variant="danger" show>
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        此操作無法撤銷，品牌相關的所有資料都將被永久刪除。
      </BAlert>
      <template #footer>
        <BButton variant="secondary" @click="showDeleteModal = false">取消</BButton>
        <BButton variant="danger" @click="handleDelete" :disabled="isDeleting">
          <BSpinner v-if="isDeleting" small class="me-1" />
          {{ isDeleting ? '處理中...' : '確認刪除' }}
        </BButton>
      </template>
    </BModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/api'
import {
  BAlert,
  BCard,
  BCardBody,
  BCardTitle,
  BCardFooter,
  BRow,
  BCol,
  BModal,
  BButton,
  BSpinner,
  BBadge,
  BImg,
  BTableSimple,
  BThead,
  BTbody,
  BTr,
  BTh,
  BTd,
} from 'bootstrap-vue-next'

// 路由
const router = useRouter()
const route = useRoute()

// 狀態
const brand = ref(null)
const stores = ref([])
const isLoading = ref(true)
const error = ref('')
const isDeleting = ref(false)
const storeCount = ref(0)
const activeStoreCount = ref(0)
const showDeleteModal = ref(false)

// 獲取品牌資料
const fetchBrandData = async () => {
  if (!route.params.id) return

  isLoading.value = true
  error.value = ''

  try {
    // 獲取品牌詳情
    const response = await api.brand.getBrandById(route.params.id)

    if (response && response.brand) {
      brand.value = response.brand

      // 獲取品牌下的店鋪
      const storesResponse = await api.store.getAllStores({
        brandId: route.params.id,
      })

      if (storesResponse && storesResponse.stores) {
        stores.value = storesResponse.stores
        storeCount.value = stores.value.length
        activeStoreCount.value = stores.value.filter((store) => store.isActive).length
      }
    } else {
      error.value = '獲取品牌資料失敗'
    }
  } catch (err) {
    console.error('獲取品牌資料時發生錯誤:', err)
    error.value = '獲取品牌資料時發生錯誤，請稍後再試'
  } finally {
    isLoading.value = false
  }
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '無資料'

  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 切換品牌啟用狀態
const toggleBrandActive = async () => {
  if (!brand.value) return

  try {
    const newStatus = !brand.value.isActive
    await api.brand.toggleBrandActive({
      id: brand.value._id,
      isActive: newStatus,
    })

    // 更新本地狀態
    brand.value.isActive = newStatus
  } catch (err) {
    console.error('切換品牌狀態失敗:', err)
    alert('切換品牌狀態時發生錯誤')
  }
}

// 處理刪除確認
const handleDelete = async () => {
  if (!brand.value) return

  isDeleting.value = true

  try {
    await api.brand.deleteBrand(brand.value._id)

    // 關閉模態對話框
    showDeleteModal.value = false

    // 返回品牌列表
    setTimeout(() => {
      router.push({ name: 'brand-list' })

      // 觸發刷新列表事件
      window.dispatchEvent(new CustomEvent('refresh-brand-list'))
    }, 300)
  } catch (err) {
    console.error('刪除品牌失敗:', err)

    if (err.response && err.response.data && err.response.data.message) {
      alert(`刪除失敗: ${err.response.data.message}`)
    } else {
      alert('刪除品牌時發生錯誤')
    }
  } finally {
    isDeleting.value = false
  }
}

// 生命週期鉤子
onMounted(() => {
  // 獲取品牌資料
  fetchBrandData()
})
</script>

<style scoped>
.object-fit-cover {
  object-fit: cover;
}

.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.card-title {
  font-weight: 600;
}

/* 表格樣式 */
.table th {
  font-weight: 600;
  background-color: #f8f9fa;
}

.table td,
.table th {
  vertical-align: middle;
}
</style>
