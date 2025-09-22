<template>
  <div class="container-fluid py-4">
    <!-- 頁面頂部工具列 -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="mb-0">{{ storeName }} 的菜單詳情</h4>
        <p class="text-muted mb-0" v-if="store">
          店鋪狀態:
          <span class="badge" :class="store.isActive ? 'bg-success' : 'bg-secondary'">
            {{ store.isActive ? '啟用中' : '已停用' }}
          </span>
        </p>
      </div>
      <div class="d-flex">
        <router-link
          :to="`/admin/${brandId}/menus/store/${storeId}`"
          class="btn btn-outline-secondary me-2"
        >
          <i class="bi bi-arrow-left me-1"></i>返回菜單管理
        </router-link>
        <router-link
          v-if="menu"
          :to="`/admin/${brandId}/menus/edit/${storeId}/${menu._id}`"
          class="btn btn-primary me-2"
        >
          <i class="bi bi-pencil me-1"></i>編輯菜單
        </router-link>
        <button
          class="btn btn-primary"
          v-if="menu && menu.isActive === true && menu.menuType === 'food'"
          @click="uploadToUberEats"
          :disabled="isUploading"
        >
          <span
            v-if="isUploading"
            class="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          ></span>
          <i v-else-if="uploadSuccess" class="bi bi-check-circle me-1"></i>
          <i v-else class="bi bi-cloud-upload me-1"></i>
          {{ isUploading ? '上傳中...' : uploadSuccess ? '上傳成功' : '同步到外送平台' }}
        </button>
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

    <!-- 上傳狀態提示 -->
    <div v-if="uploadError" class="alert alert-danger alert-dismissible fade show">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ uploadError }}
      <button type="button" class="btn-close" @click="uploadError = ''" aria-label="Close"></button>
    </div>

    <div v-if="uploadSuccess" class="alert alert-success alert-dismissible fade show">
      <i class="bi bi-check-circle-fill me-2"></i>
      菜單已成功上傳到 UberEats！
      <button
        type="button"
        class="btn-close"
        @click="uploadSuccess = false"
        aria-label="Close"
      ></button>
    </div>

    <!-- 菜單詳情內容 -->
    <div v-else-if="menu" class="row">
      <div class="col-12">
        <!-- 菜單資訊卡片 -->
        <div class="card mb-4">
          <div
            class="card-header d-flex justify-content-between align-items-center"
            :class="menu.isActive ? 'bg-success text-white' : 'bg-secondary text-white'"
          >
            <div class="d-flex align-items-center">
              <h5 class="mb-0">{{ menu.name }}</h5>
              <span class="badge rounded-pill bg-light text-dark ms-2">
                {{ menu.isActive ? '啟用中' : '已停用' }}
              </span>
              <span class="badge rounded-pill bg-info text-white ms-2">
                {{ getMenuTypeText(menu.menuType) }}
              </span>
            </div>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <p class="mb-2"><strong>菜單ID:</strong> {{ menu._id }}</p>
                <p class="mb-2"><strong>所屬店鋪:</strong> {{ storeName }}</p>
                <p class="mb-2"><strong>菜單類型:</strong> {{ getMenuTypeText(menu.menuType) }}</p>
                <p class="mb-2">
                  <strong>分類數量:</strong> {{ menu.categories ? menu.categories.length : 0 }}
                </p>
                <p class="mb-2"><strong>商品數量:</strong> {{ countTotalItems(menu) }}</p>
              </div>
              <div class="col-md-6">
                <p class="mb-2"><strong>顯示商品數量:</strong> {{ countActiveItems(menu) }}</p>
                <p class="mb-2"><strong>建立時間:</strong> {{ formatDate(menu.createdAt) }}</p>
                <p class="mb-2"><strong>最後更新:</strong> {{ formatDate(menu.updatedAt) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 菜單預覽 -->
        <div class="card mb-4">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0">菜單預覽</h5>
          </div>
          <div class="card-body">
            <!-- 無分類提示 -->
            <div v-if="!menu.categories || menu.categories.length === 0" class="text-center py-4">
              <p class="mb-0 text-muted">此菜單尚未設置任何分類</p>
            </div>

            <!-- 菜單內容 -->
            <div v-else class="menu-preview">
              <div
                v-for="category in sortedCategories"
                :key="category._id"
                class="menu-category mb-4"
              >
                <h5 class="category-title">{{ category.name }}</h5>
                <p v-if="category.description" class="category-description text-muted">
                  {{ category.description }}
                </p>

                <!-- 分類商品 -->
                <div class="category-items">
                  <div
                    v-if="category.items && category.items.length > 0"
                    class="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xxl-4 g-4"
                  >
                    <div v-for="item in sortItems(category.items)" :key="item._id" class="col">
                      <div
                        class="card h-100 item-card"
                        :class="{ 'item-disabled': !item.isShowing }"
                      >
                        <!-- 商品圖片 -->
                        <img
                          :src="getItemImage(item)"
                          class="card-img-top item-image"
                          :alt="getItemName(item)"
                        />

                        <!-- 商品類型標記 -->
                        <div class="item-type-badge">
                          <span class="badge" :class="getItemTypeBadgeClass(item.itemType)">
                            {{ getItemTypeText(item.itemType) }}
                          </span>
                        </div>

                        <!-- 停用標記 -->
                        <div class="item-status-badge" v-if="!item.isShowing">
                          <span class="badge bg-secondary">已隱藏</span>
                        </div>

                        <div class="card-body">
                          <h6 class="item-name">{{ getItemName(item) }}</h6>
                          <p class="item-description text-muted small">
                            {{ getItemDescription(item) }}
                          </p>

                          <!-- 價格顯示 -->
                          <div class="item-pricing">
                            <!-- 現金價格 -->

                            <div>
                              <p class="item-price mb-1">
                                現金價: {{ formatPrice(getItemOriginalPrice(item)) }}
                              </p>
                              <p class="item-price mb-1" v-if="item.priceOverride">
                                外送價格平台價: {{ formatPrice(item.priceOverride) }}
                              </p>
                            </div>

                            <!-- 點數價格 -->
                            <div
                              v-if="item.pointOverride !== null && item.pointOverride !== undefined"
                            >
                              <p class="item-points text-warning mb-0">
                                <strong>點數價: {{ formatPoints(item.pointOverride) }}</strong>
                              </p>
                              <p
                                class="original-points text-muted small text-decoration-line-through"
                              >
                                原點數: {{ formatPoints(getItemOriginalPoints(item)) }}
                              </p>
                            </div>
                            <div v-else-if="getItemOriginalPoints(item) > 0">
                              <p class="item-points text-warning mb-0">
                                點數價: {{ formatPoints(getItemOriginalPoints(item)) }}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-center py-3 bg-light rounded">
                    <p class="mb-0 text-muted">此分類尚未添加商品</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 詳細資料表格 -->
        <div class="card">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0">詳細資料</h5>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover table-striped mb-0">
                <thead>
                  <tr>
                    <th>分類</th>
                    <th>商品類型</th>
                    <th>商品名稱</th>
                    <th>現金價格</th>
                    <th>點數價格</th>
                    <th>狀態</th>
                    <th>排序</th>
                  </tr>
                </thead>
                <tbody>
                  <template
                    v-for="(category, categoryIndex) in sortedCategories"
                    :key="categoryIndex"
                  >
                    <tr>
                      <td
                        :rowspan="
                          category.items && category.items.length > 0
                            ? category.items.length + 1
                            : 2
                        "
                        class="align-middle fw-bold border-end"
                      >
                        {{ category.name }}
                        <div class="small text-muted">順序: {{ category.order }}</div>
                      </td>
                    </tr>
                    <template v-if="category.items && category.items.length > 0">
                      <tr v-for="item in sortItems(category.items)" :key="item._id">
                        <td>
                          <span class="badge" :class="getItemTypeBadgeClass(item.itemType)">
                            {{ getItemTypeText(item.itemType) }}
                          </span>
                        </td>
                        <td>{{ getItemName(item) }}</td>
                        <td>
                          <div>
                            <span v-if="item.priceOverride" class="text-success">
                              外送: {{ formatPrice(item.priceOverride) }}</span
                            >
                            <small class="text-muted">
                              原價: {{ formatPrice(getItemOriginalPrice(item)) }}
                            </small>
                          </div>
                        </td>
                        <td>
                          <div
                            v-if="item.pointOverride !== null && item.pointOverride !== undefined"
                          >
                            <span class="text-warning fw-bold">{{
                              formatPoints(item.pointOverride)
                            }}</span>
                            <small class="text-muted text-decoration-line-through d-block">
                              原點數: {{ formatPoints(getItemOriginalPoints(item)) }}
                            </small>
                          </div>
                          <div v-else>
                            {{ formatPoints(getItemOriginalPoints(item)) }}
                          </div>
                        </td>
                        <td>
                          <span
                            class="badge"
                            :class="item.isShowing ? 'bg-success' : 'bg-secondary'"
                          >
                            {{ item.isShowing ? '顯示' : '隱藏' }}
                          </span>
                        </td>
                        <td>{{ item.order }}</td>
                      </tr>
                    </template>
                    <tr v-else>
                      <td colspan="6" class="text-center text-muted">此分類尚未添加商品</td>
                    </tr>
                  </template>
                  <tr v-if="!menu.categories || menu.categories.length === 0">
                    <td colspan="7" class="text-center text-muted py-3">此菜單尚未設置任何分類</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api'
import {
  getMenuTypeText,
  getItemTypeText,
  getItemTypeBadgeClass,
  formatPrice,
  formatPoints,
  formatDate,
  countTotalItems,
  countActiveItems,
  sortCategories,
  sortItems,
  getItemName,
  getItemDescription,
  getItemImage,
  getItemOriginalPrice,
  getItemOriginalPoints,
} from './menuUtils'

// 路由相關
const route = useRoute()
const brandId = computed(() => route.params.brandId)
const storeId = computed(() => route.params.storeId)
const menuId = computed(() => route.params.menuId)

// 狀態變數
const store = ref(null)
const menu = ref(null)
const isLoading = ref(true)
const error = ref('')
const storeName = ref('載入中...')
const isUploading = ref(false)
const uploadSuccess = ref(false)
const uploadError = ref('')

// 計算屬性
const sortedCategories = computed(() => {
  if (!menu.value || !menu.value.categories) return []
  return sortCategories(menu.value.categories)
})

// 獲取店鋪和菜單資料
const fetchData = async () => {
  if (!storeId.value || !menuId.value || !brandId.value) return

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

    // 2. 獲取菜單資料
    const menuResponse = await api.menu.getMenuById({
      brandId: brandId.value,
      storeId: storeId.value,
      menuId: menuId.value,
      includeUnpublished: true, // 管理界面顯示所有商品
    })

    if (menuResponse && menuResponse.menu) {
      menu.value = menuResponse.menu
    } else {
      error.value = '無法獲取菜單資訊'
    }
  } catch (err) {
    console.error('獲取資料失敗:', err)
    if (err.response && err.response.status === 404) {
      error.value = '找不到指定的菜單'
    } else {
      error.value = '獲取資料時發生錯誤，請稍後再試'
    }
  } finally {
    isLoading.value = false
  }
}

// 監聽ID變化
watch([storeId, menuId, brandId], ([newStoreId, newMenuId, newBrandId]) => {
  if (newStoreId && newMenuId && newBrandId) {
    fetchData()
  }
})

// 生命週期鉤子
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
/* 菜單預覽樣式 */
.menu-preview {
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 0.5rem;
}

.category-title {
  border-bottom: 2px solid #0d6efd;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
  color: #0d6efd;
}

.category-description {
  margin-bottom: 1.5rem;
  font-style: italic;
}

.item-card {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  overflow: hidden;
  position: relative;
}

.item-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.item-disabled {
  opacity: 0.6;
}

.item-disabled::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.item-image {
  height: 160px;
  object-fit: cover;
}

.item-type-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
}

.item-status-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
}

.item-name {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.item-description {
  height: 3em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
}

.item-price {
  font-weight: bold;
  color: #dc3545;
  margin-bottom: 0;
}

.item-points {
  font-weight: bold;
  color: #ffc107;
}

.original-price,
.original-points {
  font-size: 0.8em;
}

/* 表格樣式 */
.table th {
  background-color: #f1f3f5;
}

.table td.align-middle {
  vertical-align: middle;
}

.badge {
  font-weight: 500;
}
</style>
