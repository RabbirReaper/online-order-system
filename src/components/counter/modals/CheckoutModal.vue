<template>
  <BModal
    ref="modalRef"
    v-model="isVisible"
    title="選擇付款方式"
    size="lg"
    centered
    hide-footer
    @hide="handleClose"
  >
    <div class="text-center">
      <div class="mb-4">
        <h3>應付金額：${{ total }}</h3>
      </div>

      <div class="d-flex gap-3 justify-content-center flex-wrap">
        <!-- 現金付款 -->
        <div v-if="availablePayments.includes('cash')" class="col-4">
          <button class="btn btn-success btn-lg w-100 py-4" @click="handlePaymentMethod('cash')">
            <i class="bi bi-cash-stack fs-1 d-block mb-2"></i>
            現金付款
          </button>
        </div>

        <!-- 信用卡付款 -->
        <div v-if="availablePayments.includes('credit_card')" class="col-4">
          <button
            class="btn btn-primary btn-lg w-100 py-4"
            @click="handlePaymentMethod('credit_card')"
          >
            <i class="bi bi-credit-card fs-1 d-block mb-2"></i>
            信用卡
          </button>
        </div>

        <!-- LINE Pay -->
        <div v-if="availablePayments.includes('line_pay')" class="col-4">
          <button
            class="btn btn-warning btn-lg w-100 py-4"
            @click="handlePaymentMethod('line_pay')"
          >
            <i class="bi bi-line fs-1 d-block mb-2"></i>
            LINE Pay
          </button>
        </div>
      </div>

      <!-- 若無可用付款方式 -->
      <div v-if="availablePayments.length === 0" class="alert alert-warning mt-3">
        <i class="bi bi-exclamation-triangle me-2"></i>
        此門市尚未設定付款方式，請聯繫管理員
      </div>
    </div>
  </BModal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { BModal } from 'bootstrap-vue-next'
import { useCounterStore } from '@/stores/counter'

const counterStore = useCounterStore()

const props = defineProps({
  total: {
    type: Number,
    required: true,
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
  // 可選的 prop，如果父組件提供則使用，否則從 store 讀取
  counterPayments: {
    type: Array,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'close', 'paymentSelected'])

// 獲取可用的付款方式（優先使用 prop，否則從 store 讀取）
const availablePayments = computed(() => {
  // 如果 prop 有提供，則使用 prop
  if (props.counterPayments !== null) {
    return props.counterPayments
  }

  // 否則從 store 讀取
  if (counterStore.storeData && counterStore.storeData.counterPayments) {
    return counterStore.storeData.counterPayments
  }

  // 預設返回所有付款方式（向後兼容）
  return ['cash', 'credit_card', 'line_pay']
})

// Modal 顯示狀態
const modalRef = ref()
const isVisible = ref(props.modelValue)

// 監聽 modelValue 變化
watch(
  () => props.modelValue,
  (newValue) => {
    isVisible.value = newValue
  },
)

// 監聽 isVisible 變化，同步到父組件
watch(isVisible, (newValue) => {
  emit('update:modelValue', newValue)
})

// 處理付款方式選擇
const handlePaymentMethod = (paymentMethod) => {
  emit('paymentSelected', {
    paymentMethod,
    paymentType: 'On-site',
  })
  handleClose()
}

// 處理關閉
const handleClose = () => {
  isVisible.value = false
  emit('close')
}

// 暴露方法給父組件
defineExpose({
  show: () => {
    isVisible.value = true
  },
  hide: () => {
    isVisible.value = false
  },
})
</script>

<style scoped>
.btn-lg {
  transition: all 0.3s;
  min-height: 120px;
}

.btn-lg:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.bi {
  color: inherit;
}

/* LINE Pay 按鈕的特殊圖示樣式 */
.btn-warning .bi-line {
  color: #00c300;
}
</style>
