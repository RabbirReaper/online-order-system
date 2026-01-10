<template>
  <div
    v-if="coupon"
    class="coupon-card border rounded p-3 mb-3"
    :class="{
      applied: isApplied,
      disabled: !canUse,
      'expiring-soon': isExpiringSoon,
    }"
  >
    <div class="d-flex justify-content-between align-items-start">
      <div class="coupon-info flex-grow-1">
        <div class="d-flex align-items-center mb-2">
          <i
            class="bi bi-percent text-primary fs-5 me-2"
            :class="isApplied ? 'text-success' : 'text-primary'"
          ></i>
          <h6 class="mb-0 fw-bold">{{ coupon?.couponName || '折價券' }}</h6>
          <span v-if="isApplied" class="badge bg-success ms-2">
            <i class="bi bi-check-circle me-1"></i>
            已套用
          </span>
        </div>

        <div class="description mb-2" v-if="coupon?.description">
          <small class="text-muted">{{ coupon.description }}</small>
        </div>

        <div class="discount-info mb-2">
          <span class="badge" :class="discountBadgeClass">
            <i class="bi" :class="discountIcon"></i>
            {{ discountText }}
          </span>
        </div>

        <div class="conditions mb-2" v-if="coupon?.discountInfo?.minPurchaseAmount">
          <small class="text-muted">
            <i class="bi bi-info-circle me-1"></i>
            滿 ${{ coupon.discountInfo.minPurchaseAmount }} 可用
          </small>
        </div>

        <div class="expiry-info">
          <small class="text-muted" :class="{ 'text-danger fw-bold': isExpiringSoon }">
            <i class="bi bi-clock me-1"></i>
            {{ coupon?.expiryDate ? formatExpiryDate(coupon.expiryDate) : '未知' }}
          </small>
        </div>
      </div>

      <div class="coupon-action ms-3">
        <button
          v-if="!isApplied"
          class="btn btn-sm btn-outline-primary"
          @click="handleApply"
          :disabled="!canUse || isProcessing"
        >
          <span v-if="isProcessing">
            <i class="bi bi-hourglass-split"></i>
            處理中...
          </span>
          <span v-else>
            <i class="bi bi-plus-circle"></i>
            套用
          </span>
        </button>

        <button v-else class="btn btn-sm btn-success" @click="handleRemove">
          <i class="bi bi-check-circle"></i>
          已套用
        </button>
      </div>
    </div>

    <!-- 顯示實際折扣金額 -->
    <div v-if="isApplied && calculatedDiscount > 0" class="actual-discount mt-2">
      <div class="alert alert-success py-2 mb-0">
        <small class="fw-bold">
          <i class="bi bi-gift me-1"></i>
          本次可折抵：${{ calculatedDiscount }}
        </small>
      </div>
    </div>

    <!-- 不可用原因提示 -->
    <div v-if="!canUse && !isApplied" class="reason mt-2">
      <small class="text-danger">
        <i class="bi bi-exclamation-triangle me-1"></i>
        {{ getUnusableReason() }}
      </small>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()

const props = defineProps({
  couponId: {
    type: String,
    required: true,
  },
})

// 從 store 獲取折價券資料
const coupon = computed(() => cartStore.getCouponById(props.couponId))

// 從 store 計算是否已套用
const isApplied = computed(() =>
  cartStore.appliedCoupons.some((c) => c.refId === props.couponId),
)

// 從 store 計算是否可用
const canUse = computed(() => cartStore.canUseCoupon(props.couponId))

// 從 store 獲取當前小計
const currentSubtotal = computed(() => cartStore.subtotal)

// 防止重複點擊
const isProcessing = ref(false)

// 計算屬性
const discountInfo = computed(() => coupon.value?.discountInfo || {})

const discountText = computed(() => {
  if (discountInfo.value.discountType === 'percentage') {
    let text = `${discountInfo.value.discountValue}% 折扣`
    if (discountInfo.value.maxDiscountAmount) {
      text += ` (最高$${discountInfo.value.maxDiscountAmount})`
    }
    return text
  } else if (discountInfo.value.discountType === 'fixed') {
    return `折抵 $${discountInfo.value.discountValue}`
  }
  return '優惠'
})

const discountIcon = computed(() => {
  return discountInfo.value.discountType === 'percentage' ? 'bi-percent' : 'bi-currency-dollar'
})

const discountBadgeClass = computed(() => {
  if (isApplied.value) {
    return 'bg-success'
  } else if (!canUse.value) {
    return 'bg-secondary'
  } else {
    return 'bg-primary'
  }
})

const calculatedDiscount = computed(() => {
  if (!isApplied.value || !currentSubtotal.value || !coupon.value) return 0

  if (discountInfo.value.discountType === 'percentage') {
    let discount = Math.floor(currentSubtotal.value * (discountInfo.value.discountValue / 100))
    if (discountInfo.value.maxDiscountAmount) {
      discount = Math.min(discount, discountInfo.value.maxDiscountAmount)
    }
    return discount
  } else if (discountInfo.value.discountType === 'fixed') {
    return Math.min(discountInfo.value.discountValue, currentSubtotal.value)
  }

  return 0
})

const formatExpiryDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = date - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return '已過期'
  } else if (diffDays === 0) {
    return '今天到期'
  } else if (diffDays === 1) {
    return '明天到期'
  } else if (diffDays <= 7) {
    return `${diffDays}天後到期`
  } else {
    return (
      date.toLocaleDateString('zh-TW', {
        month: 'short',
        day: 'numeric',
      }) + '到期'
    )
  }
}

const isExpiringSoon = computed(() => {
  if (!coupon.value) return false
  const date = new Date(coupon.value.expiryDate)
  const now = new Date()
  const diffTime = date - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= 3 && diffDays > 0
})

// 方法
const getUnusableReason = () => {
  const minAmount = discountInfo.value.minPurchaseAmount || 0
  if (currentSubtotal.value < minAmount) {
    return `需滿 $${minAmount} 才能使用 (目前 $${currentSubtotal.value})`
  }
  return '暫時無法使用'
}

// 直接調用 store actions
const handleApply = async () => {
  if (!canUse.value || isApplied.value || isProcessing.value || !coupon.value) {
    return
  }

  try {
    isProcessing.value = true
    cartStore.applyStoreCoupon(props.couponId)

    // 給一點時間讓 UI 更新
    setTimeout(() => {
      isProcessing.value = false
    }, 500)
  } catch (error) {
    isProcessing.value = false
    console.error('套用折價券失敗:', error)
    alert(error.message || '套用折價券失敗')
  }
}

const handleRemove = () => {
  if (isApplied.value) {
    cartStore.removeStoreCoupon(props.couponId)
  }
}
</script>

<style scoped>
.coupon-card {
  background: linear-gradient(135deg, #e8f4fd 0%, #f0f9ff 100%);
  border-left: 4px solid #0d6efd;
  transition: all 0.3s ease;
  position: relative;
}

.coupon-card:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.2);
}

.coupon-card.applied {
  background: linear-gradient(135deg, #e8f5e8 0%, #f0fff0 100%);
  border-left-color: #198754;
}

.coupon-card.disabled {
  background: #f8f9fa;
  border-left-color: #6c757d;
  opacity: 0.6;
}

/* 取消按鈕樣式 */
.cancel-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  padding: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  opacity: 0.7;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  opacity: 1;
  background-color: #dc3545;
  border-color: #dc3545;
  color: white;
}

.coupon-info h6 {
  color: #0d6efd;
}

.coupon-card.applied .coupon-info h6 {
  color: #198754;
}

.coupon-card.disabled .coupon-info h6 {
  color: #6c757d;
}

.discount-info .badge {
  font-size: 0.75rem;
  font-weight: 600;
}

.coupon-action .btn {
  min-width: 80px;
  font-weight: 600;
}

.btn-outline-primary:hover {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.btn-success {
  cursor: pointer;
}

.btn-success:hover {
  background-color: #157347;
  border-color: #146c43;
}

.actual-discount .alert {
  background-color: rgba(25, 135, 84, 0.1);
  border: 1px solid rgba(25, 135, 84, 0.2);
  color: #198754;
}

/* 即將到期警告樣式 */
.coupon-card.expiring-soon {
  border-left-color: #dc3545;
}

.coupon-card.expiring-soon:not(.disabled) {
  background: linear-gradient(135deg, #ffeaea 0%, #fff5f5 100%);
}

.coupon-card.expiring-soon .expiry-info {
  color: #dc3545 !important;
  font-weight: 600;
}

/* 條件不滿足的樣式 */
.reason {
  padding: 8px;
  background-color: rgba(220, 53, 69, 0.1);
  border-radius: 4px;
  border-left: 3px solid #dc3545;
}

/* 響應式設計 */
@media (max-width: 576px) {
  .coupon-card {
    padding: 12px;
  }

  .coupon-info h6 {
    font-size: 0.9rem;
  }

  .coupon-action .btn {
    min-width: 70px;
    font-size: 0.8rem;
  }

  .cancel-btn {
    width: 20px;
    height: 20px;
    top: 6px;
    right: 6px;
  }
}
</style>
