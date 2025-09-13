<template>
  <div>
    <!-- 頁面標題 -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="mb-0">店家獨立記帳 - 選擇店鋪</h4>
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

    <!-- 店鋪列表 -->
    <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xxl-4 g-4" v-if="!isLoading">
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
          </div>

          <div class="card-footer bg-transparent">
            <div class="d-flex gap-2">
              <router-link
                :to="`/admin/${brandId}/cash-flow/${store._id}/show`"
                class="btn btn-primary flex-grow-1"
              >
                <i class="bi bi-cash-stack me-1"></i>記帳管理
              </router-link>
              <router-link
                :to="`/admin/${brandId}/cash-flow/${store._id}/category`"
                class="btn btn-outline-secondary"
              >
                <i class="bi bi-tags"></i>
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- 無資料提示 -->
      <div class="col-12" v-if="stores.length === 0">
        <div class="alert alert-info text-center py-4">
          <i class="bi bi-info-circle me-2 fs-4"></i>
          <p class="mb-0">尚未創建任何店鋪</p>
          <div class="mt-3">
            <router-link :to="`/admin/${brandId}/stores/create`" class="btn btn-primary">
              <i class="bi bi-plus-lg me-1"></i>新增店鋪
            </router-link>
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

// 狀態
const isLoading = ref(false)
const error = ref('')
const stores = ref([])

// 獲取店鋪列表
const fetchStores = async () => {
  isLoading.value = true
  error.value = ''

  try {
    const response = await api.store.getAllStores({ brandId: brandId.value })
    stores.value = response.stores || []
  } catch (err) {
    console.error('獲取店鋪列表失敗:', err)
    error.value = err.response?.data?.message || '獲取店鋪列表時發生錯誤'
  } finally {
    isLoading.value = false
  }
}

// 生命週期
onMounted(() => {
  fetchStores()
})
</script>

<style scoped>
.object-fit-cover {
  object-fit: cover;
}

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

.card-footer {
  border-top: 1px solid rgba(0, 0, 0, 0.125);
}
</style>
