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

    <div v-if="coupon && !isLoading">
      <!-- 頁面頂部工具列 -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">{{ coupon.name }}</h4>
        <div class="d-flex">
          <router-link
            :to="`/admin/${brandId}/coupons/edit/${coupon._id}`"
            class="btn btn-primary me-2"
          >
            <i class="bi bi-pencil me-1"></i>編輯優惠券
          </router-link>
          <router-link :to="`/admin/${brandId}/coupons`" class="btn btn-secondary">
            <i class="bi bi-arrow-left me-1"></i>返回列表
          </router-link>
        </div>
      </div>

      <!-- 優惠券詳情卡片 -->
      <div class="row">
        <!-- 左側基本資訊 -->
        <div class="col-md-6 mb-4">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title mb-3">基本資訊</h5>

              <div class="mb-3">
                <h6 class="text-muted mb-1">優惠券名稱</h6>
                <p>{{ coupon.name }}</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">優惠券描述</h6>
                <p>{{ coupon.description || '無描述' }}</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">有效期限</h6>
                <p>{{ coupon.validityPeriod }} 天</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">狀態</h6>
                <p>
                  <span class="badge" :class="coupon.isActive ? 'bg-success' : 'bg-secondary'">
                    {{ coupon.isActive ? '啟用' : '停用' }}
                  </span>
                </p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">已發行數量</h6>
                <p>{{ coupon.totalIssued || 0 }}</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">創建時間</h6>
                <p>{{ formatDate(coupon.createdAt) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 右側折扣資訊 -->
        <div class="col-md-6 mb-4">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title mb-3">折扣設定</h5>

              <div class="mb-3">
                <h6 class="text-muted mb-1">折扣類型</h6>
                <p>
                  <span class="badge bg-info">
                    {{
                      coupon.discountInfo?.discountType === 'percentage'
                        ? '百分比折扣'
                        : '固定金額折抵'
                    }}
                  </span>
                </p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">折扣值</h6>
                <p class="fs-4 text-success">
                  <template v-if="coupon.discountInfo?.discountType === 'percentage'">
                    {{ coupon.discountInfo.discountValue }}% 折扣
                  </template>
                  <template v-else>
                    折抵 ${{ formatPrice(coupon.discountInfo?.discountValue || 0) }}
                  </template>
                </p>
              </div>

              <div
                class="mb-3"
                v-if="
                  coupon.discountInfo?.discountType === 'percentage' &&
                  coupon.discountInfo?.maxDiscountAmount
                "
              >
                <h6 class="text-muted mb-1">最高折扣金額</h6>
                <p>${{ formatPrice(coupon.discountInfo.maxDiscountAmount) }}</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">最低消費金額</h6>
                <p>
                  {{
                    coupon.discountInfo?.minPurchaseAmount > 0
                      ? `$${formatPrice(coupon.discountInfo.minPurchaseAmount)}`
                      : '無限制'
                  }}
                </p>
              </div>

              <!-- 使用規則說明 -->
              <div class="mt-4">
                <h6 class="text-muted mb-2">使用規則</h6>
                <div class="border rounded p-3 bg-light">
                  <ul class="mb-0 small">
                    <li>此優惠券自發放日起 {{ coupon.validityPeriod }} 天內有效</li>
                    <li v-if="coupon.discountInfo?.minPurchaseAmount > 0">
                      需滿足最低消費金額 ${{ formatPrice(coupon.discountInfo.minPurchaseAmount) }}
                    </li>
                    <li
                      v-if="
                        coupon.discountInfo?.discountType === 'percentage' &&
                        coupon.discountInfo?.maxDiscountAmount
                      "
                    >
                      百分比折扣最高不超過 ${{ formatPrice(coupon.discountInfo.maxDiscountAmount) }}
                    </li>
                    <li>每張優惠券限使用一次</li>
                    <li>不可與其他優惠同時使用</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 統計資訊 -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="card-title mb-0">發放統計</h5>
                <button
                  class="btn btn-outline-primary btn-sm"
                  @click="refreshStatistics"
                  :disabled="isLoadingStats"
                >
                  <i class="bi bi-arrow-clockwise me-1" :class="{ spin: isLoadingStats }"></i>
                  重新整理
                </button>
              </div>

              <!-- 統計載入中 -->
              <div v-if="isLoadingStats" class="text-center py-3">
                <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                正在載入統計資料...
              </div>

              <!-- 統計資料 -->
              <div v-else class="row text-center">
                <div class="col-md-4">
                  <div class="border-end">
                    <h3 class="text-primary mb-1">{{ statistics.totalIssued }}</h3>
                    <p class="text-muted mb-0">總發放數</p>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="border-end">
                    <h3 class="text-success mb-1">{{ statistics.totalUsed }}</h3>
                    <p class="text-muted mb-0">已使用</p>
                    <small class="text-muted d-block"> 使用率: {{ statistics.usageRate }}% </small>
                  </div>
                </div>
                <div class="col-md-4">
                  <h3 class="text-warning mb-1">{{ statistics.totalActive }}</h3>
                  <p class="text-muted mb-0">未使用</p>
                  <small class="text-muted d-block"> (過期: {{ statistics.totalExpired }}) </small>
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
import { useRoute } from 'vue-router'
import api from '@/api'

// 路由
const route = useRoute()

// 從路由中獲取品牌ID和優惠券ID
const brandId = computed(() => route.params.brandId)
const couponId = computed(() => route.params.id)

// 狀態
const isLoading = ref(false)
const isLoadingStats = ref(false)
const error = ref('')

// 優惠券資料
const coupon = ref(null)
const statistics = ref({
  totalIssued: 0,
  totalUsed: 0,
  totalActive: 0,
  totalExpired: 0,
  usageRate: 0,
})

// 格式化價格
const formatPrice = (price) => {
  return price?.toLocaleString('zh-TW') || '0'
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '無'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 獲取優惠券資料
const fetchCouponData = async () => {
  if (!couponId.value || !brandId.value) return

  isLoading.value = true
  error.value = ''

  try {
    const response = await api.promotion.getCouponTemplateById({
      id: couponId.value,
      brandId: brandId.value,
    })

    if (response.success && response.template) {
      coupon.value = response.template
    } else {
      error.value = '獲取優惠券資料失敗'
    }
  } catch (err) {
    console.error('獲取優惠券資料時發生錯誤:', err)
    if (err.response?.data?.message) {
      error.value = err.response.data.message
    } else {
      error.value = '獲取優惠券資料時發生錯誤，請稍後再試'
    }
  } finally {
    isLoading.value = false
  }
}

// 獲取統計資料
const fetchStatistics = async () => {
  if (!couponId.value || !brandId.value) return

  isLoadingStats.value = true

  try {
    // 注意：後端API需要支援管理員獲取優惠券實例的功能
    // 這裡假設有一個可以按模板ID過濾的API
    const response = await api.promotion.getAllCouponInstances(brandId.value, {
      templateId: couponId.value,
      includeExpired: true,
      limit: 1000, // 獲取所有實例來計算統計
    })

    if (response.success && response.coupons) {
      const instances = response.coupons
      const now = new Date()

      const totalIssued = instances.length
      const totalUsed = instances.filter((instance) => instance.isUsed).length
      const totalExpired = instances.filter(
        (instance) => !instance.isUsed && new Date(instance.expiryDate) < now,
      ).length
      const totalActive = totalIssued - totalUsed - totalExpired
      const usageRate = totalIssued > 0 ? Math.round((totalUsed / totalIssued) * 100) : 0

      statistics.value = {
        totalIssued,
        totalUsed,
        totalActive,
        totalExpired,
        usageRate,
      }
    }
  } catch (err) {
    console.error('獲取統計資料時發生錯誤:', err)
    // 如果統計資料獲取失敗，使用模板的基本資料
    statistics.value = {
      totalIssued: coupon.value?.totalIssued || 0,
      totalUsed: 0,
      totalActive: 0,
      totalExpired: 0,
      usageRate: 0,
    }
  } finally {
    isLoadingStats.value = false
  }
}

// 重新整理統計資料
const refreshStatistics = () => {
  fetchStatistics()
}

// 生命週期鉤子
onMounted(async () => {
  // 獲取優惠券資料
  await fetchCouponData()

  // 獲取統計資料
  if (coupon.value) {
    await fetchStatistics()
  }
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

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.spin {
  animation: spin 1s linear infinite;
}
</style>
