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
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()

// 訂單類型 - 雙向綁定到 store，處理前後端格式轉換
const localOrderType = computed({
  get: () => {
    // 後端格式 → 前端格式
    switch (cartStore.orderType) {
      case 'dine_in':
        return 'dineIn'
      case 'takeout':
        return 'selfPickup'
      case 'delivery':
        return 'delivery'
      default:
        return 'selfPickup'
    }
  },
  set: (value) => {
    // 前端格式 → 後端格式
    const mappedType = {
      dineIn: 'dine_in',
      selfPickup: 'takeout',
      delivery: 'delivery',
    }[value]
    cartStore.setOrderType(mappedType)
  },
})

// 桌號 - 雙向綁定到 store
const localTableNumber = computed({
  get: () => cartStore.dineInInfo?.tableNumber || '',
  set: (value) => {
    cartStore.setDineInInfo({ tableNumber: value })
  },
})

// 外送地址 - 雙向綁定到 store
const localDeliveryAddress = computed({
  get: () => cartStore.deliveryInfo?.address || '',
  set: (value) => {
    cartStore.setDeliveryInfo({
      ...cartStore.deliveryInfo,
      address: value,
    })
  },
})

// 取餐時間類型 - 雙向綁定到 store
const localPickupTime = computed({
  get: () => cartStore.pickupInfo?.pickupTime || 'asap',
  set: (value) => {
    cartStore.setPickupInfo({
      ...cartStore.pickupInfo,
      pickupTime: value,
    })
  },
})

// 預約時間 - 雙向綁定到 store
const localScheduledTime = computed({
  get: () => cartStore.pickupInfo?.scheduledTime || '',
  set: (value) => {
    cartStore.setPickupInfo({
      ...cartStore.pickupInfo,
      scheduledTime: value,
    })
  },
})

// 外送費
const deliveryFee = ref(60) // 默認外送費

// 驗證狀態
const tableNumberError = ref('')

// 店鋪資訊 - 從 store 讀取
const storeData = computed(() => cartStore.storeInfo || {})

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

// 店鋪資訊由 CartView 載入到 store，這裡不需要重複載入

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

// 監聽店鋪資訊變化，設定預設訂單類型
watch(
  storeData,
  (newVal) => {
    if (newVal && Object.keys(newVal).length > 0) {
      setDefaultOrderType()
    }
  },
  { deep: true },
)

// 監聽訂單類型變化
watch(localOrderType, (newVal) => {
  // 設定外送費（如果是外送則設定，否則為0）
  if (newVal === 'delivery') {
    cartStore.setDeliveryInfo({
      ...cartStore.deliveryInfo,
      deliveryFee: deliveryFee.value,
    })
  } else {
    if (cartStore.deliveryInfo) {
      cartStore.setDeliveryInfo({
        ...cartStore.deliveryInfo,
        deliveryFee: 0,
      })
    }
  }

  // 當訂單類型改變時，重新初始化預約時間
  if (newVal === 'selfPickup' || newVal === 'delivery') {
    initializeScheduledTime()
  }
})

// 監聽預估時間變化，更新最小預約時間
watch(estimatedMinTime, () => {
  if (localPickupTime.value === 'scheduled') {
    const newMinTime = minScheduledTime.value
    if (localScheduledTime.value < newMinTime) {
      localScheduledTime.value = newMinTime
    }
  }
})

onMounted(() => {
  // 店鋪資訊由 CartView 載入到 store
  // 初始化預約時間和設定預設訂單類型
  if (storeData.value && Object.keys(storeData.value).length > 0) {
    setDefaultOrderType()
  }
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
