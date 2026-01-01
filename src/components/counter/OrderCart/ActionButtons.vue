<template>
  <div class="action-buttons mt-3 pt-3 border-top">
    <template v-if="isOrdersActive && selectedOrder">
      <!-- 訂單管理模式下的按鈕 -->
      <div class="d-flex justify-content-between mb-3">
        <button
          class="btn btn-danger btn-lg"
          style="width: 48%"
          @click="showCancelOrderModal"
          :disabled="selectedOrder.status === 'paid' || selectedOrder.status === 'cancelled'"
        >
          <i class="bi bi-x-circle me-1"></i> 取消訂單
        </button>
        <button
          class="btn btn-secondary btn-lg"
          style="width: 48%"
          @click="handlePrintOrder"
          :disabled="!selectedOrder || isPrinting"
        >
          <template v-if="isPrinting">
            <span
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            列印中...
          </template>
          <template v-else>
            <i class="bi bi-printer me-1"></i> 列印訂單
          </template>
        </button>
      </div>
      <button
        class="btn btn-success btn-lg w-100 py-3"
        @click="$emit('updateOrderStatus', selectedOrder._id, 'paid')"
        :disabled="selectedOrder.status === 'paid' || selectedOrder.status === 'cancelled'"
      >
        <i class="bi bi-credit-card me-1"></i> 結帳
      </button>
    </template>

    <template v-else>
      <!-- 購物車模式下的按鈕 -->
      <div class="d-flex justify-content-between mb-3">
        <button
          class="btn btn-danger btn-lg"
          style="width: 48%"
          :disabled="cartLength === 0"
          @click="showCancelCartModal"
        >
          <i class="bi bi-x-circle me-1"></i> 取消訂單
        </button>
        <button class="btn btn-secondary btn-lg" style="width: 48%" disabled>
          <i class="bi bi-printer me-1"></i> 重印訂單
        </button>
      </div>
      <button
        class="btn btn-success btn-lg w-100 py-3"
        :disabled="cartLength === 0 || isCheckingOut"
        @click="handleSubmit"
      >
        <template v-if="isCheckingOut">
          <span
            class="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          ></span>
          處理中...
        </template>
        <template v-else> <i class="bi bi-check-circle me-1"></i> 提交訂單 </template>
      </button>
    </template>

    <!-- 取消訂單確認對話框 -->
    <BModal
      v-model="showCancelModal"
      title="確認取消訂單"
      ok-title="確認取消"
      cancel-title="返回"
      ok-variant="danger"
      @ok="handleCancelConfirm"
    >
      <p class="mb-0">
        {{ cancelModalMessage }}
      </p>
    </BModal>

    <!-- 列印成功對話框 -->
    <BModal
      v-model="showPrintSuccessModal"
      title="列印成功"
      ok-only
      ok-title="確定"
      ok-variant="success"
    >
      <div class="text-center py-3">
        <i class="bi bi-check-circle-fill text-success" style="font-size: 3rem"></i>
        <p class="mt-3 mb-0">訂單已成功送至列印機</p>
      </div>
    </BModal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { BModal } from 'bootstrap-vue-next'

const props = defineProps({
  isOrdersActive: {
    type: Boolean,
    required: true,
  },
  selectedOrder: {
    type: Object,
    default: null,
  },
  cartLength: {
    type: Number,
    default: 0,
  },
  isCheckingOut: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['updateOrderStatus', 'printOrder', 'cancelOrder', 'submitOrder'])

// 取消確認對話框狀態
const showCancelModal = ref(false)
const cancelType = ref('')

// 列印狀態
const isPrinting = ref(false)
const showPrintSuccessModal = ref(false)

// 動態確認訊息
const cancelModalMessage = computed(() => {
  if (cancelType.value === 'order') {
    return `確定要取消訂單 #${props.selectedOrder?.orderNumber || props.selectedOrder?._id} 嗎？此操作將無法復原。`
  } else {
    return '確定要清空購物車嗎？這將移除所有已選擇的商品。'
  }
})

// 顯示取消訂單確認對話框（訂單管理模式）
const showCancelOrderModal = () => {
  cancelType.value = 'order'
  showCancelModal.value = true
}

// 顯示取消購物車確認對話框（購物車模式）
const showCancelCartModal = () => {
  cancelType.value = 'cart'
  showCancelModal.value = true
}

// 處理確認取消
const handleCancelConfirm = () => {
  if (cancelType.value === 'order') {
    emit('updateOrderStatus', props.selectedOrder._id, 'cancelled')
  } else {
    emit('cancelOrder')
  }
  showCancelModal.value = false
}

// 處理提交按鈕點擊
const handleSubmit = () => {
  if (props.isCheckingOut) return // 防止重複點擊
  emit('submitOrder')
}

// 處理列印訂單
const handlePrintOrder = async () => {
  if (isPrinting.value || !props.selectedOrder) return // 防止重複點擊

  isPrinting.value = true
  try {
    // 觸發列印事件，父組件會處理實際的列印邏輯
    await new Promise((resolve, reject) => {
      emit('printOrder', { resolve, reject })
    })

    // 列印成功，顯示成功對話框
    showPrintSuccessModal.value = true
  } catch (error) {
    console.error('列印失敗:', error)
    // 這裡可以添加錯誤提示
  } finally {
    isPrinting.value = false
  }
}
</script>

<style scoped>
.btn {
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-lg {
  font-size: 1.1rem;
  border-radius: 8px;
}

.btn-success {
  font-size: 1.25rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.btn-success:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
}

/* 添加旋轉動畫的自定義樣式 */
.spinner-border {
  vertical-align: middle;
}

/* 禁用按鈕時的樣式 */
.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
</style>
