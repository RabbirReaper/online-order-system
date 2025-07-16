<template>
  <div>
    <!-- 載入中提示 -->
    <div class="d-flex justify-content-center my-5" v-if="isLoading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加載中...</span>
      </div>
    </div>

    <!-- 錯誤提示 -->
    <div class="alert alert-danger" v-if="error">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ error }}
    </div>

    <div v-if="voucher && !isLoading">
      <!-- 頁面頂部工具列 -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">{{ voucher.name }}</h4>
        <div class="d-flex">
          <router-link
            :to="`/admin/${brandId}/vouchers/edit/${voucher._id}`"
            class="btn btn-primary me-2"
          >
            <i class="bi bi-pencil me-1"></i>編輯兌換券
          </router-link>
          <router-link :to="`/admin/${brandId}/vouchers`" class="btn btn-secondary">
            <i class="bi bi-arrow-left me-1"></i>返回列表
          </router-link>
        </div>
      </div>

      <!-- 兌換券詳情卡片 -->
      <div class="row">
        <!-- 左側基本資訊 -->
        <div class="col-md-6 mb-4">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title mb-3">基本資訊</h5>

              <div class="mb-3">
                <h6 class="text-muted mb-1">兌換券名稱</h6>
                <p>{{ voucher.name }}</p>
              </div>

              <div class="mb-3" v-if="voucher.sellingPoint">
                <h6 class="text-muted mb-1">賣點</h6>
                <p class="text-primary">{{ voucher.sellingPoint }}</p>
              </div>

              <div class="mb-3" v-if="voucher.description">
                <h6 class="text-muted mb-1">詳細描述</h6>
                <p>{{ voucher.description }}</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">狀態</h6>
                <p>
                  <span class="badge" :class="getStatusBadgeClass(voucher)">
                    {{ getStatusText(voucher) }}
                  </span>
                  <span v-if="voucher.autoStatusControl" class="badge bg-info ms-2">
                    自動控制
                  </span>
                </p>
              </div>

              <div class="mb-3" v-if="voucher.image">
                <h6 class="text-muted mb-1">兌換券圖片</h6>
                <img :src="voucher.image.url" class="img-fluid rounded" style="max-width: 300px" />
              </div>
            </div>
          </div>
        </div>

        <!-- 右側價格和期限資訊 -->
        <div class="col-md-6 mb-4">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title mb-3">價格設定</h5>

              <div class="row mb-3" v-if="voucher.cashPrice">
                <div class="col-6">
                  <h6 class="text-muted mb-1">現金價格</h6>
                  <p class="fs-4 text-success mb-0">
                    ${{ formatPrice(voucher.cashPrice.selling || voucher.cashPrice.original) }}
                  </p>
                  <small
                    v-if="
                      voucher.cashPrice.selling &&
                      voucher.cashPrice.selling < voucher.cashPrice.original
                    "
                    class="text-muted text-decoration-line-through"
                  >
                    原價 ${{ formatPrice(voucher.cashPrice.original) }}
                  </small>
                </div>
              </div>

              <div class="row mb-3" v-if="voucher.pointPrice">
                <div class="col-6">
                  <h6 class="text-muted mb-1">點數價格</h6>
                  <p class="fs-4 text-primary mb-0">
                    {{ voucher.pointPrice.selling || voucher.pointPrice.original }} 點
                  </p>
                  <small
                    v-if="
                      voucher.pointPrice.selling &&
                      voucher.pointPrice.selling < voucher.pointPrice.original
                    "
                    class="text-muted text-decoration-line-through"
                  >
                    原價 {{ voucher.pointPrice.original }} 點
                  </small>
                </div>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">購買限制</h6>
                <p>
                  {{
                    voucher.purchaseLimitPerUser
                      ? `每人限購 ${voucher.purchaseLimitPerUser} 個`
                      : '無限制'
                  }}
                </p>
              </div>

              <!-- 計算節省金額 -->
              <div class="mb-3" v-if="bundleValue > 0">
                <h6 class="text-muted mb-1">價值分析</h6>
                <div class="border rounded p-3 bg-light">
                  <div class="row text-center">
                    <div class="col-6">
                      <div class="border-end">
                        <h5 class="text-primary mb-1">{{ bundleValue }}</h5>
                        <p class="text-muted mb-0 small">總價值（點數）</p>
                      </div>
                    </div>
                    <div class="col-6">
                      <h5 class="text-success mb-1">{{ savings }}</h5>
                      <p class="text-muted mb-0 small">節省（點數）</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 兌換內容 -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title mb-3">兌換內容</h5>

              <!-- 載入餐點詳情中 -->
              <div v-if="isDishLoading" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">載入餐點詳情中...</span>
                </div>
              </div>

              <!-- 顯示餐點詳情 -->
              <div v-else-if="dishTemplate" class="border rounded p-3 bg-light">
                <div class="row">
                  <div class="col-md-8">
                    <h6 class="mb-2">{{ dishTemplate.name }}</h6>
                    <p class="fs-5 text-success mb-2">
                      <strong>${{ formatPrice(dishTemplate.basePrice) }}</strong>
                    </p>
                    <p class="text-muted small mb-0">
                      {{ dishTemplate.description || '無描述' }}
                    </p>
                    <!-- 顯示標籤 -->
                    <div v-if="dishTemplate.tags && dishTemplate.tags.length > 0" class="mt-2">
                      <span
                        v-for="tag in dishTemplate.tags"
                        :key="tag"
                        class="badge bg-secondary me-1 small"
                      >
                        {{ tag }}
                      </span>
                    </div>
                  </div>
                  <div class="col-md-4" v-if="dishTemplate.image">
                    <img
                      :src="dishTemplate.image.url"
                      class="img-fluid rounded"
                      style="max-height: 120px; object-fit: cover"
                      :alt="dishTemplate.image.alt || dishTemplate.name"
                    />
                  </div>
                </div>
              </div>

              <!-- 無法載入餐點詳情 -->
              <div v-else-if="dishError" class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                無法載入兌換餐點詳情：{{ dishError }}
              </div>

              <!-- 沒有兌換內容 -->
              <div v-else class="text-center text-muted py-4">
                <i class="bi bi-inbox display-6 d-block mb-2"></i>
                <p>尚未設定兌換內容</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 統計資訊 -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title mb-3">兌換券統計</h5>

              <!-- 載入統計中 -->
              <div v-if="isStatsLoading" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">載入統計中...</span>
                </div>
              </div>

              <!-- 統計數據 -->
              <div v-else class="row text-center">
                <div class="col-md-4">
                  <div class="border-end">
                    <h3 class="text-primary mb-1">{{ voucherStats.totalIssued }}</h3>
                    <p class="text-muted mb-0">總發行</p>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="border-end">
                    <h3 class="text-success mb-1">{{ voucherStats.totalUsed }}</h3>
                    <p class="text-muted mb-0">已使用</p>
                  </div>
                </div>
                <div class="col-md-4">
                  <h3 class="text-info mb-1">{{ voucherStats.usageRate }}%</h3>
                  <p class="text-muted mb-0">使用率</p>
                </div>
              </div>

              <!-- 過期統計 -->
              <div class="row text-center mt-3 pt-3 border-top">
                <div class="col-md-6">
                  <h5 class="text-warning mb-1">{{ voucherStats.totalExpired }}</h5>
                  <p class="text-muted mb-0">已過期</p>
                </div>
                <div class="col-md-6">
                  <h5 class="text-success mb-1">{{ voucherStats.totalActive }}</h5>
                  <p class="text-muted mb-0">可使用</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'

// 路由
const route = useRoute()
const router = useRouter()

// 從路由中獲取品牌ID和兌換券ID
const brandId = computed(() => route.params.brandId)
const voucherId = computed(() => route.params.id)

// 狀態
const isLoading = ref(false)
const isDishLoading = ref(false)
const isStatsLoading = ref(false)
const error = ref('')
const dishError = ref('')

// 兌換券和餐點資料
const voucher = ref(null)
const dishTemplate = ref(null)
const voucherInstances = ref([])

// 兌換券統計數據
const voucherStats = ref({
  totalIssued: 0,
  totalUsed: 0,
  totalExpired: 0,
  totalActive: 0,
  usageRate: 0,
})

// 格式化價格
const formatPrice = (price) => {
  return price?.toLocaleString('zh-TW') || '0'
}

// 格式化日期時間
const formatDateTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 獲取狀態徽章樣式
const getStatusBadgeClass = (voucher) => {
  if (!voucher.isActive) return 'bg-secondary'

  const now = new Date()
  if (voucher.autoStatusControl && voucher.validTo && new Date(voucher.validTo) < now) {
    return 'bg-warning'
  }

  return 'bg-success'
}

// 獲取狀態文字
const getStatusText = (voucher) => {
  if (!voucher.isActive) return '停用'

  const now = new Date()
  if (voucher.autoStatusControl && voucher.validTo && new Date(voucher.validTo) < now) {
    return '已過期'
  }

  return '啟用'
}

// 計算兌換券總價值
const bundleValue = computed(() => {
  if (!voucher.value || !voucher.value.bundleItems) return 0

  return voucher.value.bundleItems.reduce((total, item) => {
    const itemValue = (item.couponTemplate?.pointCost || 0) * item.quantity
    return total + itemValue
  }, 0)
})

// 計算節省的點數
const savings = computed(() => {
  if (!voucher.value || !voucher.value.pointPrice) return 0

  const cost = voucher.value.pointPrice.selling || voucher.value.pointPrice.original || 0
  return Math.max(0, bundleValue.value - cost)
})

// 計算兌換券統計
const calculateVoucherStats = (instances) => {
  const now = new Date()

  const stats = {
    totalIssued: instances.length,
    totalUsed: 0,
    totalExpired: 0,
    totalActive: 0,
    usageRate: 0,
  }

  instances.forEach((instance) => {
    if (instance.isUsed) {
      stats.totalUsed++
    } else if (new Date(instance.expiryDate) < now) {
      stats.totalExpired++
    } else {
      stats.totalActive++
    }
  })

  // 計算使用率
  if (stats.totalIssued > 0) {
    stats.usageRate = Math.round((stats.totalUsed / stats.totalIssued) * 100)
  }

  return stats
}

// 獲取兌換券實例統計
const fetchVoucherInstanceStats = async () => {
  if (!voucherId.value || !brandId.value) return

  isStatsLoading.value = true

  try {
    const response = await api.promotion.getVoucherInstanceStatsByTemplate({
      brandId: brandId.value,
      templateId: voucherId.value,
    })
    voucherStats.value = response.stats
  } catch (err) {
    console.error('獲取兌換券統計時發生錯誤:', err)
    // 使用預設值
    voucherInstances.value = []
    voucherStats.value = {
      totalIssued: 0,
      totalUsed: 0,
      totalExpired: 0,
      totalActive: 0,
      usageRate: 0,
    }
  } finally {
    isStatsLoading.value = false
  }
}

// 獲取餐點模板詳情
const fetchDishTemplate = async (dishTemplateId) => {
  if (!dishTemplateId || !brandId.value) return

  isDishLoading.value = true
  dishError.value = ''

  try {
    const response = await api.dish.getDishTemplateById({
      brandId: brandId.value,
      id: dishTemplateId,
    })

    if (response && response.template) {
      dishTemplate.value = response.template
    } else {
      dishError.value = '餐點模板不存在'
    }
  } catch (err) {
    console.error('獲取餐點模板詳情時發生錯誤:', err)
    dishError.value = '載入餐點詳情失敗'
  } finally {
    isDishLoading.value = false
  }
}

// 獲取兌換券資料
const fetchVoucherData = async () => {
  if (!voucherId.value || !brandId.value) return

  isLoading.value = true
  error.value = ''

  try {
    const response = await api.promotion.getVoucherTemplateById({
      brandId: brandId.value,
      id: voucherId.value,
    })
    console.log('獲取兌換券資料:', response)
    if (response && response.template) {
      voucher.value = response.template

      // 如果有關聯的餐點模板，獲取詳細資訊
      if (response.template.exchangeDishTemplate) {
        await fetchDishTemplate(response.template.exchangeDishTemplate)
      }

      // 獲取兌換券實例統計
      await fetchVoucherInstanceStats()
    } else {
      error.value = '獲取兌換券資料失敗'
    }
  } catch (err) {
    console.error('獲取兌換券資料時發生錯誤:', err)
    error.value = '獲取兌換券資料時發生錯誤，請稍後再試'
  } finally {
    isLoading.value = false
  }
}

// 生命週期鉤子
onMounted(() => {
  // 獲取兌換券資料
  fetchVoucherData()
})
</script>

<style scoped>
.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.card-title {
  font-weight: 600;
}

.badge {
  font-weight: 500;
  font-size: 0.85rem;
}

.bg-light {
  background-color: #f8f9fa !important;
}

.border-end {
  border-right: 1px solid #dee2e6 !important;
}

.border-end:last-child {
  border-right: none !important;
}

.img-fluid {
  max-height: 200px;
  object-fit: cover;
}
</style>
