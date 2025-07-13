<template>
  <div class="payment-selector">
    <div class="card">
      <div class="card-body">
        <!-- 支付類型選擇 -->
        <div class="payment-type-selector mb-4">
          <div class="form-label mb-2">付款類型</div>
          <BButtonGroup class="w-100">
            <BButton
              v-for="type in paymentTypes"
              :key="type.value"
              :variant="paymentType === type.value ? 'primary' : 'outline-secondary'"
              class="payment-type-btn w-50"
              @click="selectPaymentType(type.value)"
            >
              <i :class="type.icon" class="me-2"></i>
              {{ type.label }}
            </BButton>
          </BButtonGroup>
        </div>

        <!-- 支付方式選擇 -->
        <div class="payment-method-options">
          <div class="form-label mb-2">付款方式</div>
          <BFormRadioGroup
            v-model="localModelValue"
            :options="availablePaymentMethods"
            stacked
            name="payment-methods"
            buttons
            button-variant="outline-primary"
            class="w-100"
          ></BFormRadioGroup>
        </div>

        <!-- 現金支付說明 -->
        <div
          v-if="localModelValue === 'cash'"
          class="payment-explanation mt-3 p-3 bg-light rounded"
        >
          <div class="d-flex align-items-start">
            <i class="bi bi-cash me-2 mt-1 text-success"></i>
            <div>
              <div class="fw-bold mb-1">現金付款</div>
              <p class="mb-0 small text-muted">請於取餐時支付。我們接受新台幣現金支付，可找零。</p>
            </div>
          </div>
        </div>

        <!-- 信用卡支付說明 -->
        <div
          v-else-if="localModelValue === 'credit_card'"
          class="payment-explanation mt-3 p-3 bg-light rounded"
        >
          <div class="d-flex align-items-start">
            <i class="bi bi-credit-card me-2 mt-1 text-primary"></i>
            <div>
              <div class="fw-bold mb-1">信用卡付款</div>
              <p class="mb-0 small text-muted">
                {{
                  paymentType === 'On-site'
                    ? '請於取餐時刷卡。我們接受 VISA、MasterCard、JCB 等主要信用卡。'
                    : '將轉跳至信用卡支付頁面，完成線上付款。'
                }}
              </p>
            </div>
          </div>
        </div>

        <!-- LINE Pay 支付說明 -->
        <div
          v-else-if="localModelValue === 'line_pay'"
          class="payment-explanation mt-3 p-3 bg-light rounded"
        >
          <div class="d-flex align-items-start">
            <i class="bi bi-phone me-2 mt-1 text-success"></i>
            <div>
              <div class="fw-bold mb-1">LINE Pay 支付</div>
              <p class="mb-0 small text-muted">
                {{
                  paymentType === 'On-site'
                    ? '請於取餐時出示 LINE Pay QR Code 進行掃描付款。'
                    : '將轉跳至 LINE Pay 頁面，完成線上付款。'
                }}
              </p>
            </div>
          </div>
        </div>

        <!-- 其他支付方式說明 -->
        <div
          v-else-if="localModelValue === 'other'"
          class="payment-explanation mt-3 p-3 bg-light rounded"
        >
          <div class="d-flex align-items-start">
            <i class="bi bi-wallet2 me-2 mt-1 text-secondary"></i>
            <div>
              <div class="fw-bold mb-1">其他付款方式</div>
              <p class="mb-0 small text-muted">
                {{
                  paymentType === 'On-site'
                    ? '請於取餐時詢問店員可用的其他支付方式。'
                    : '將轉跳至第三方支付頁面，完成線上付款。'
                }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// 定義 props
const props = defineProps({
  modelValue: {
    type: String,
    default: 'cash',
  },
  paymentType: {
    type: String,
    default: 'On-site',
  },
})

// 定義 emits
const emit = defineEmits(['update:modelValue', 'update:paymentType'])

// 本地響應式數據
const localModelValue = ref(props.modelValue)

// 支付類型選項
const paymentTypes = [
  {
    label: '現場付款',
    value: 'On-site',
    icon: 'bi bi-shop',
  },
  {
    label: '線上付款',
    value: 'Online',
    icon: 'bi bi-globe',
  },
]

// 根據支付類型篩選可用的支付方式
const availablePaymentMethods = computed(() => {
  // 現場支付和線上支付都支持的方法
  const commonMethods = [
    { text: '信用卡', value: 'credit_card' },
    { text: 'LINE Pay', value: 'line_pay' },
    { text: '其他方式', value: 'other' },
  ]

  // 現場支付特有的方法
  const onsiteMethods = [{ text: '現金', value: 'cash' }]

  if (props.paymentType === 'On-site') {
    return [...onsiteMethods, ...commonMethods]
  }

  return commonMethods
})

// 選擇支付類型
const selectPaymentType = (type) => {
  emit('update:paymentType', type)

  // 如果切換到線上支付，但當前選擇了現金，則自動切換到信用卡
  if (type === 'Online' && localModelValue.value === 'cash') {
    localModelValue.value = 'credit_card'
    emit('update:modelValue', 'credit_card')
  }
}

// 監聽本地值變化，更新父組件
watch(localModelValue, (newValue) => {
  emit('update:modelValue', newValue)
})

// 監聽 props 變化，更新本地值
watch(
  () => props.modelValue,
  (newValue) => {
    localModelValue.value = newValue
  },
)

// 監聽支付類型變化，確保支付方式合法
watch(
  () => props.paymentType,
  (newType) => {
    if (newType === 'Online' && localModelValue.value === 'cash') {
      localModelValue.value = 'credit_card'
      emit('update:modelValue', 'credit_card')
    }
  },
)
</script>

<style scoped>
.payment-selector {
  margin-bottom: 1.5rem;
}

.card {
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.payment-type-btn {
  padding: 0.6rem 1rem;
  font-weight: 500;
}

.payment-method-options .form-check-label {
  width: 100%;
  padding: 0.6rem 1rem;
}

.payment-explanation {
  border-left: 4px solid #dee2e6;
}
</style>
