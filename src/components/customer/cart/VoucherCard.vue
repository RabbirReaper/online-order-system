<template>
  <div
    v-if="voucher"
    class="voucher-card border rounded p-3 mb-3"
    :class="{
      selected: isSelected,
      available: !isSelected,
      'expiring-soon': isExpiringSoon,
    }"
  >
    <div class="d-flex justify-content-between align-items-start">
      <div class="voucher-info flex-grow-1">
        <div class="d-flex align-items-center mb-2">
          <i
            class="bi bi-ticket-perforated fs-5 me-2"
            :class="isSelected ? 'text-success' : 'text-warning'"
          ></i>
          <h6 class="mb-0 fw-bold">{{ voucher?.voucherName || '兌換券' }}</h6>
          <span v-if="isSelected" class="badge bg-success ms-2">
            <i class="bi bi-check-circle me-1"></i>
            已選用
          </span>
        </div>

        <div class="matched-dish mb-2">
          <small class="text-muted">
            <i class="bi bi-arrow-right me-1"></i>
            可兌換：{{ matchedItem?.dishName || '餐點' }}
          </small>
        </div>

        <div class="savings mb-2">
          <span class="badge" :class="isSelected ? 'bg-success' : 'bg-warning text-dark'">
            <i class="bi bi-tag-fill me-1"></i>
            省下 ${{ matchedItem?.originalPrice || 0 }}
          </span>
        </div>

        <div class="expiry-info">
          <small class="text-muted" :class="{ 'text-danger fw-bold': isExpiringSoon }">
            <i class="bi bi-clock me-1"></i>
            {{ voucher?.expiryDate ? formatExpiryDate(voucher.expiryDate) : '未知' }}
          </small>
        </div>
      </div>

      <div class="voucher-action ms-3">
        <button
          v-if="!isSelected"
          class="btn btn-sm btn-outline-warning"
          @click="handleUse"
          :disabled="isProcessing"
        >
          <span v-if="isProcessing">
            <i class="bi bi-hourglass-split"></i>
            處理中...
          </span>
          <span v-else>
            <i class="bi bi-ticket"></i>
            選用
          </span>
        </button>

        <button v-else class="btn btn-sm btn-success" @click="handleCancel">
          <i class="bi bi-check-circle"></i>
          已選用
        </button>
      </div>
    </div>

    <!-- 如果有關聯的餐點圖片可以顯示 -->
    <div v-if="voucher?.exchangeDishTemplate?.image" class="dish-preview mt-2">
      <div class="d-flex align-items-center">
        <img
          :src="voucher.exchangeDishTemplate.image.url"
          :alt="voucher.exchangeDishTemplate.name"
          class="dish-thumb me-2"
        />
        <small class="text-muted">
          {{ voucher.exchangeDishTemplate.name }}
          <span class="text-success fw-bold"
            >(${{ voucher.exchangeDishTemplate.basePrice }})</span
          >
        </small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()

const props = defineProps({
  voucherId: {
    type: String,
    required: true,
  },
})

// 從 store 獲取兌換券資料
const voucher = computed(() => cartStore.getVoucherById(props.voucherId))

// 從 store 計算是否已選用
const isSelected = computed(() =>
  cartStore.usedVouchers.some((v) => v.voucherId === props.voucherId),
)

// 獲取匹配的餐點資訊
const matchedItem = computed(() => voucher.value?.matchedItem || {})

// 防止重複點擊
const isProcessing = ref(false)

// 計算屬性
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
  if (!voucher.value) return false
  const date = new Date(voucher.value.expiryDate)
  const now = new Date()
  const diffTime = date - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= 3 && diffDays > 0
})

// 方法 - 直接調用 store actions
const handleUse = async () => {
  if (isProcessing.value || isSelected.value || !voucher.value) {
    return
  }

  try {
    isProcessing.value = true
    cartStore.useVoucher(props.voucherId, matchedItem.value)

    // 給一點時間讓 UI 更新
    setTimeout(() => {
      isProcessing.value = false
    }, 500)
  } catch (error) {
    isProcessing.value = false
    console.error('選用兌換券失敗:', error)
    alert(error.message || '選用兌換券失敗')
  }
}

const handleCancel = () => {
  cartStore.cancelVoucher(props.voucherId)
}
</script>

<style scoped>
.voucher-card {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.voucher-card.available {
  background: linear-gradient(135deg, #fff8e1 0%, #fffbf0 100%);
  border-left: 4px solid #ffc107;
  cursor: pointer;
}

.voucher-card.available:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.2);
}

.voucher-card.selected {
  background: linear-gradient(135deg, #e8f5e8 0%, #f0fff0 100%);
  border-left: 4px solid #198754;
  box-shadow: 0 0 0 2px rgba(25, 135, 84, 0.2);
}

.voucher-card.selected::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    45deg,
    transparent 45%,
    rgba(25, 135, 84, 0.05) 49%,
    rgba(25, 135, 84, 0.05) 51%,
    transparent 55%
  );
  background-size: 20px 20px;
  pointer-events: none;
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

.voucher-info h6 {
  color: #d97706;
}

.voucher-card.selected .voucher-info h6 {
  color: #198754;
}

.savings .badge {
  font-size: 0.75rem;
  font-weight: 600;
}

.dish-thumb {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 6px;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.voucher-action .btn {
  min-width: 70px;
  font-weight: 600;
}

.btn-outline-warning:hover {
  background-color: #ffc107;
  border-color: #ffc107;
  color: #000;
}

.btn-success {
  cursor: pointer;
}

.btn-success:hover {
  background-color: #157347;
  border-color: #146c43;
}

/* 即將到期警告樣式 */
.voucher-card.expiring-soon {
  border-left-color: #dc3545;
}

.voucher-card.expiring-soon:not(.selected) {
  background: linear-gradient(135deg, #ffeaea 0%, #fff5f5 100%);
}

.voucher-card.expiring-soon .expiry-info {
  color: #dc3545 !important;
  font-weight: 600;
}

/* 響應式設計 */
@media (max-width: 576px) {
  .voucher-card {
    padding: 12px;
  }

  .voucher-info h6 {
    font-size: 0.9rem;
  }

  .dish-thumb {
    width: 35px;
    height: 35px;
  }

  .voucher-action .btn {
    min-width: 60px;
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
