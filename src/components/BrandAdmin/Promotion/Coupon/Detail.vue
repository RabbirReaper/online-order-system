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

              <div class="mb-3" v-if="coupon.description">
                <h6 class="text-muted mb-1">優惠券描述</h6>
                <p>{{ coupon.description }}</p>
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
                <h6 class="text-muted mb-1">創建時間</h6>
                <p>{{ formatDateTime(coupon.createdAt) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 右側折扣設定 -->
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
                <p class="fs-4 text-success mb-0">
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
              <h5 class="card-title mb-3">優惠券統計</h5>

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
                    <h3 class="text-primary mb-1">{{ couponStats.totalIssued }}</h3>
                    <p class="text-muted mb-0">總發行</p>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="border-end">
                    <h3 class="text-success mb-1">{{ couponStats.totalUsed }}</h3>
                    <p class="text-muted mb-0">已使用</p>
                  </div>
                </div>
                <div class="col-md-4">
                  <h3 class="text-info mb-1">{{ couponStats.usageRate }}%</h3>
                  <p class="text-muted mb-0">使用率</p>
                </div>
              </div>

              <!-- 過期統計 -->
              <div class="row text-center mt-3 pt-3 border-top">
                <div class="col-md-6">
                  <h5 class="text-warning mb-1">{{ couponStats.totalExpired }}</h5>
                  <p class="text-muted mb-0">已過期</p>
                </div>
                <div class="col-md-6">
                  <h5 class="text-success mb-1">{{ couponStats.totalActive }}</h5>
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
import { useRoute } from 'vue-router'
import api from '@/api'

// 路由
const route = useRoute()

// 從路由中獲取品牌ID和優惠券ID
const brandId = computed(() => route.params.brandId)
const couponId = computed(() => route.params.id)

// 狀態
const isLoading = ref(false)
const isStatsLoading = ref(false)
const error = ref('')

// 優惠券和統計資料
const coupon = ref(null)

// 優惠券統計數據
const couponStats = ref({
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

// 獲取優惠券實例統計
const fetchCouponInstanceStats = async () => {
  if (!couponId.value || !brandId.value) return

  isStatsLoading.value = true

  try {
    const response = await api.promotion.getCouponInstanceStatsByTemplate({
      brandId: brandId.value,
      templateId: couponId.value,
    })
    couponStats.value = response.stats
  } catch (err) {
    console.error('獲取優惠券統計時發生錯誤:', err)
    // 使用預設值
    couponStats.value = {
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

// 獲取優惠券資料
const fetchCouponData = async () => {
  if (!couponId.value || !brandId.value) return

  isLoading.value = true
  error.value = ''

  try {
    const response = await api.promotion.getCouponTemplateById({
      brandId: brandId.value,
      id: couponId.value,
    })

    if (response && response.template) {
      coupon.value = response.template

      // 獲取優惠券實例統計
      await fetchCouponInstanceStats()
    } else {
      error.value = '獲取優惠券資料失敗'
    }
  } catch (err) {
    console.error('獲取優惠券資料時發生錯誤:', err)
    error.value = '獲取優惠券資料時發生錯誤，請稍後再試'
  } finally {
    isLoading.value = false
  }
}

// 生命週期鉤子
onMounted(() => {
  // 獲取優惠券資料
  fetchCouponData()
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
</style>
