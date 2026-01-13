<template>
  <div class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0, 0, 0, 0.5)">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">現金結帳</h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">
          <div class="calculator-display mb-4">
            <div class="row g-3">
              <div class="col-4">
                <div class="card bg-light">
                  <div class="card-body text-center">
                    <h6 class="mb-2">應付金額</h6>
                    <h4 class="mb-0">${{ total }}</h4>
                  </div>
                </div>
              </div>
              <div class="col-4">
                <div class="card bg-primary text-white">
                  <div class="card-body text-center">
                    <h6 class="mb-2">收款金額</h6>
                    <h4 class="mb-0">${{ inputAmount }}</h4>
                  </div>
                </div>
              </div>
              <div class="col-4">
                <div :class="['card', changeAmount < 0 ? 'bg-danger' : 'bg-success', 'text-white']">
                  <div class="card-body text-center">
                    <h6 class="mb-2">{{ changeAmount < 0 ? '差額' : '找零' }}</h6>
                    <h4 class="mb-0">${{ Math.abs(changeAmount) }}</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 快速金額按鈕 -->
          <div class="quick-amounts mb-4">
            <div class="d-flex flex-wrap justify-content-center gap-2">
              <button
                v-for="amount in quickAmounts"
                :key="amount"
                class="btn btn-outline-secondary quick-amount-btn"
                @click="addInputAmount(amount)"
              >
                ${{ amount }}
              </button>
            </div>
          </div>

          <!-- 數字鍵盤 -->
          <div class="number-keypad">
            <div class="row g-2">
              <div class="col-4" v-for="num in [1, 2, 3, 4, 5, 6, 7, 8, 9]" :key="num">
                <button class="btn btn-outline-secondary w-100" @click="appendToInput(num)">
                  {{ num }}
                </button>
              </div>
              <div class="col-4">
                <button class="btn btn-outline-secondary w-100" @click="appendToInput(0)">0</button>
              </div>
              <div class="col-4">
                <button class="btn btn-outline-secondary w-100" @click="appendToInput('00')">
                  00
                </button>
              </div>
              <div class="col-4">
                <button class="btn btn-outline-danger w-100" @click="clearInput">清除</button>
              </div>
              <div class="col-8">
                <button class="btn btn-outline-primary w-100" @click="addSmallChange">
                  補零錢 <small v-if="changeToAdd > 0">+${{ changeToAdd }}</small>
                </button>
              </div>
              <div class="col-4">
                <button class="btn btn-outline-primary w-100" @click="setExactAmount">剛好</button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer d-flex justify-content-between">
          <button type="button" class="btn btn-secondary" @click="$emit('close')" :disabled="isLoading">
            取消
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="handleComplete"
            :disabled="inputAmount < total || isLoading"
          >
            <span
              v-if="isLoading"
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            {{ isLoading ? '處理中...' : '完成結帳' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  total: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['close', 'complete'])

// 快速金額按鈕
const quickAmounts = [100, 500, 1000]

// 輸入金額
const inputAmount = ref(0)

// Loading 狀態
const isLoading = ref(false)

// 計算找零金額
const changeAmount = computed(() => {
  return inputAmount.value - props.total
})

// 計算需要補的零錢金額
const changeToAdd = computed(() => {
  if (changeAmount.value <= 0) return 0

  // 找出應付金額的個位數
  const unitDigit = changeAmount.value % 10
  // 找出應付金額的十位數
  const tenthDigit = changeAmount.value % 100

  // 如果個位數不是0，補到整十
  if (unitDigit !== 0) {
    return 10 - unitDigit
  }
  // 如果十位數不是0，補到整百
  else if (tenthDigit !== 0) {
    return 100 - tenthDigit
  }

  // 已經是整百了，不需要補零錢
  return 0
})

// 設置輸入金額
const addInputAmount = (amount) => {
  inputAmount.value += amount
}

// 加入數字到輸入金額
const appendToInput = (num) => {
  if (inputAmount.value === 0 && num !== '00') {
    inputAmount.value = parseInt(num)
  } else {
    inputAmount.value = parseInt(`${inputAmount.value}${num}`)
  }
}

// 清除輸入金額
const clearInput = () => {
  inputAmount.value = 0
}

// 補零錢功能
const addSmallChange = () => {
  if (changeToAdd.value > 0) {
    inputAmount.value += changeToAdd.value
  }
}

// 設定為剛好金額
const setExactAmount = () => {
  inputAmount.value = props.total
}

// 處理完成結帳
const handleComplete = () => {
  isLoading.value = true
  emit('complete')
}
</script>

<style scoped>
.calculator-display .card {
  height: 100%;
}

.card-body {
  padding: 1rem;
}

.number-keypad {
  max-width: 300px;
  margin: 0 auto;
}

.number-keypad .btn {
  height: 50px;
  font-size: 1.2rem;
}

.quick-amount-btn {
  height: 50px;
  font-size: 1.2rem;
  min-width: 100px;
  flex: 0 0 auto;
}
</style>
