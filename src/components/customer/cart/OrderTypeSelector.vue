<template>
  <div class="order-type-container mb-4">
    <!-- 取餐方式 -->
    <h6 class="mb-3 fw-bold">取餐方式</h6>

    <!-- 沒有可用的訂單類型時顯示警告 -->
    <div v-if="!hasAvailableOrderType" class="alert alert-warning" role="alert">
      目前店鋪暫時無法接受訂單，請稍後再試。
    </div>

    <div v-else class="d-flex flex-wrap">
      <div v-if="storeData.enableDineIn" class="form-check me-4 mb-3">
        <input
          class="form-check-input"
          type="radio"
          name="orderType"
          id="dineIn"
          value="dineIn"
          v-model="localOrderType"
        />
        <label class="form-check-label" for="dineIn">內用</label>
      </div>
      <div v-if="storeData.enableTakeOut" class="form-check me-4 mb-3">
        <input
          class="form-check-input"
          type="radio"
          name="orderType"
          id="selfPickup"
          value="selfPickup"
          v-model="localOrderType"
        />
        <label class="form-check-label" for="selfPickup">自取</label>
      </div>
      <div v-if="storeData.enableDelivery" class="form-check mb-3">
        <input
          class="form-check-input"
          type="radio"
          name="orderType"
          id="delivery"
          value="delivery"
          v-model="localOrderType"
        />
        <label class="form-check-label" for="delivery">外送</label>
      </div>
    </div>

    <!-- 內用選項 -->
    <div v-if="localOrderType === 'dineIn'" class="mt-3">
      <label for="tableNumber" class="form-label">桌號 <span class="text-danger">*</span></label>
      <input
        type="text"
        class="form-control"
        :class="{ 'is-invalid': tableNumberError }"
        id="tableNumber"
        v-model="localTableNumber"
        placeholder="請輸入桌號"
        @input="validateTableNumber"
        maxlength="6"
      />
      <div v-if="tableNumberError" class="invalid-feedback">
        {{ tableNumberError }}
      </div>
      <small class="text-muted">請輸入英文或數字，最多6個字元</small>
    </div>

    <!-- 外送選項 -->
    <div v-if="localOrderType === 'delivery'" class="mt-3">
      <label for="deliveryAddress" class="form-label"
        >外送地址 <span class="text-danger">*</span></label
      >
      <textarea
        class="form-control"
        id="deliveryAddress"
        rows="2"
        v-model="localDeliveryAddress"
        placeholder="請輸入詳細外送地址"
      ></textarea>
      <div class="d-flex justify-content-between align-items-center mt-2">
        <small class="text-muted">外送範圍僅限方圓 3 公里內</small>
        <div class="delivery-fee-badge">外送費: ${{ deliveryFee }}</div>
      </div>
    </div>

    <!-- 取餐/配送時間 (僅限外帶和外送) -->
    <div
      v-if="localOrderType === 'selfPickup' || localOrderType === 'delivery'"
      class="pickup-time-container mt-4"
    >
      <h6 class="mb-3 fw-bold">{{ localOrderType === 'delivery' ? '配送時間' : '取餐時間' }}</h6>
      <div class="d-flex">
        <div class="form-check me-4">
          <input
            class="form-check-input"
            type="radio"
            name="pickupTime"
            id="asap"
            value="asap"
            v-model="localPickupTime"
          />
          <label class="form-check-label" for="asap">
            {{ localOrderType === 'delivery' ? '盡快配送' : '盡快取餐' }}
            <small class="d-block text-muted">
              約 {{ estimatedMinTime }} 分鐘{{
                localOrderType === 'delivery' ? '後送達' : '後可取餐'
              }}
            </small>
          </label>
        </div>
        <div class="form-check">
          <input
            class="form-check-input"
            type="radio"
            name="pickupTime"
            id="scheduled"
            value="scheduled"
            v-model="localPickupTime"
          />
          <label class="form-check-label" for="scheduled">預約時間</label>
        </div>
      </div>

      <div v-if="localPickupTime === 'scheduled'" class="mt-3">
        <label for="scheduledTime" class="form-label">
          預約{{ localOrderType === 'delivery' ? '配送' : '取餐' }}時間
          <span class="text-danger">*</span>
        </label>
        <input
          type="datetime-local"
          class="form-control"
          id="scheduledTime"
          v-model="localScheduledTime"
          :min="minScheduledTime"
        />
        <small class="text-muted">請選擇至少 {{ estimatedMinTime }} 分鐘後的時間</small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import api from '@/api'

const props = defineProps({
  orderType: {
    type: String,
    default: 'selfPickup', // 默認為自取，使用前端格式
  },
  tableNumber: {
    type: String,
    default: '',
  },
  deliveryAddress: {
    type: String,
    default: '',
  },
  pickupTime: {
    type: String,
    default: 'asap', // 'asap' 或 'scheduled'
  },
  scheduledTime: {
    type: String,
    default: '',
  },
  storeInfo: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits([
  'update:orderType',
  'update:tableNumber',
  'update:deliveryAddress',
  'update:pickupTime',
  'update:scheduledTime',
  'update:delivery-fee',
])

// 本地狀態
const localOrderType = ref(props.orderType)
const localTableNumber = ref(props.tableNumber)
const localDeliveryAddress = ref(props.deliveryAddress)
const localPickupTime = ref(props.pickupTime)
const localScheduledTime = ref(props.scheduledTime)
const deliveryFee = ref(60) // 默認外送費

// 驗證狀態
const tableNumberError = ref('')

// 店鋪資訊
const storeData = ref(props.storeInfo || {})

// 檢查是否有可用的訂單類型
const hasAvailableOrderType = computed(() => {
  return (
    storeData.value.enableDineIn || storeData.value.enableTakeOut || storeData.value.enableDelivery
  )
})

// 計算預估時間
const estimatedMinTime = computed(() => {
  if (localOrderType.value === 'selfPickup') {
    return storeData.value.takeOutPrepTime || 15 // 預設15分鐘
  } else if (localOrderType.value === 'delivery') {
    return storeData.value.deliveryPrepTime || 30 // 預設30分鐘
  }
  return 15
})

// 最小預約時間（當前時間 + 預估時間）
const minScheduledTime = computed(() => {
  const date = new Date()
  date.setMinutes(date.getMinutes() + estimatedMinTime.value)
  return date.toISOString().slice(0, 16)
})

// 桌號驗證函數
const validateTableNumber = () => {
  const value = localTableNumber.value

  // 清空錯誤
  tableNumberError.value = ''

  if (!value) {
    tableNumberError.value = '請輸入桌號'
    return false
  }

  // 檢查長度
  if (value.length > 6) {
    tableNumberError.value = '桌號不能超過6個字元'
    return false
  }

  // 檢查格式（只允許英文字母和數字）
  const alphanumericRegex = /^[a-zA-Z0-9]+$/
  if (!alphanumericRegex.test(value)) {
    tableNumberError.value = '桌號只能包含英文字母和數字'
    return false
  }

  return true
}

// 載入店鋪資訊
const loadStoreInfo = async () => {
  try {
    const brandId = sessionStorage.getItem('currentBrandId')
    const storeId = sessionStorage.getItem('currentStoreId')

    if (brandId && storeId) {
      const response = await api.store.getStorePublicInfo({
        brandId: brandId,
        id: storeId,
      })

      if (response && response.success) {
        storeData.value = response.store
        // 檢查當前訂單類型是否可用,如果不可用則設定為第一個可用的類型
        setDefaultOrderType()
      }
    }
  } catch (error) {
    console.error('載入店鋪資訊失敗:', error)
  }
}

// 設定預設訂單類型
const setDefaultOrderType = () => {
  const orderTypeMap = {
    dineIn: storeData.value.enableDineIn,
    selfPickup: storeData.value.enableTakeOut,
    delivery: storeData.value.enableDelivery,
  }

  // 如果當前選擇的類型未啟用,自動選擇第一個可用的類型
  if (!orderTypeMap[localOrderType.value]) {
    if (storeData.value.enableTakeOut) {
      localOrderType.value = 'selfPickup'
    } else if (storeData.value.enableDineIn) {
      localOrderType.value = 'dineIn'
    } else if (storeData.value.enableDelivery) {
      localOrderType.value = 'delivery'
    }
  }
}

// 初始化預約時間
const initializeScheduledTime = () => {
  if (!localScheduledTime.value) {
    localScheduledTime.value = minScheduledTime.value
  }
}

// 監聽 props 變化
watch(
  () => props.orderType,
  (newVal) => {
    localOrderType.value = newVal
  },
)

watch(
  () => props.tableNumber,
  (newVal) => {
    localTableNumber.value = newVal
    // 當外部設定桌號時清除錯誤狀態
    if (tableNumberError.value) {
      tableNumberError.value = ''
    }
  },
)

watch(
  () => props.deliveryAddress,
  (newVal) => {
    localDeliveryAddress.value = newVal
  },
)

watch(
  () => props.pickupTime,
  (newVal) => {
    localPickupTime.value = newVal
  },
)

watch(
  () => props.scheduledTime,
  (newVal) => {
    localScheduledTime.value = newVal
  },
)

watch(
  () => props.storeInfo,
  (newVal) => {
    storeData.value = newVal || {}
    if (newVal && Object.keys(newVal).length > 0) {
      setDefaultOrderType()
    }
  },
  { deep: true },
)

// 監聽本地狀態變化並向上傳遞
watch(localOrderType, (newVal) => {
  emit('update:orderType', newVal)

  // 重置相關欄位
  if (newVal === 'delivery') {
    emit('update:delivery-fee', deliveryFee.value)
  } else {
    emit('update:delivery-fee', 0)
  }

  // 當訂單類型改變時，重新初始化預約時間
  if (newVal === 'selfPickup' || newVal === 'delivery') {
    initializeScheduledTime()
  }
})

watch(localTableNumber, (newVal) => {
  emit('update:tableNumber', newVal)
  // 當桌號改變時清除錯誤狀態（用戶正在輸入時）
  if (tableNumberError.value) {
    tableNumberError.value = ''
  }
})

watch(localDeliveryAddress, (newVal) => {
  emit('update:deliveryAddress', newVal)
})

watch(localPickupTime, (newVal) => {
  emit('update:pickupTime', newVal)
})

watch(localScheduledTime, (newVal) => {
  emit('update:scheduledTime', newVal)
})

// 監聽預估時間變化，更新最小預約時間
watch(estimatedMinTime, () => {
  if (localPickupTime.value === 'scheduled') {
    const newMinTime = minScheduledTime.value
    if (localScheduledTime.value < newMinTime) {
      localScheduledTime.value = newMinTime
      emit('update:scheduledTime', newMinTime)
    }
  }
})

onMounted(async () => {
  await loadStoreInfo()
  initializeScheduledTime()
})
</script>

<style scoped>
.form-check-input {
  border: 2px solid #495057;
}

.form-check-input:checked {
  background-color: #d35400;
  border-color: #d35400;
}

.delivery-fee-badge {
  background-color: #f8d7da;
  color: #721c24;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Fix for iOS input styling */
input[type='datetime-local'] {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.order-type-container label {
  font-weight: 500;
}

.form-check-label small {
  font-weight: 400;
  margin-top: 2px;
}
</style>
