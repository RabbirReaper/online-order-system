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
        <div v-if="canScheduleOrder" class="form-check">
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
        <label class="form-label">
          預約{{ localOrderType === 'delivery' ? '配送' : '取餐' }}時間
          <span class="text-danger">*</span>
        </label>

        <!-- 日期選擇 -->
        <div class="mb-2">
          <label for="scheduledDate" class="form-label small">日期</label>
          <input
            type="date"
            class="form-control"
            id="scheduledDate"
            v-model="scheduledDate"
            :min="minScheduledDate"
            :max="maxScheduledDate"
          />
        </div>

        <!-- 時間選擇 -->
        <div class="mb-2">
          <label for="scheduledTimeSlot" class="form-label small">時間</label>
          <select
            class="form-select"
            id="scheduledTimeSlot"
            v-model="scheduledTimeSlot"
            :disabled="!scheduledDate || availableTimeSlots.length === 0"
          >
            <option value="" disabled>{{ getTimeSlotPlaceholder }}</option>
            <option v-for="slot in availableTimeSlots" :key="slot.value" :value="slot.value">
              {{ slot.label }}
            </option>
          </select>
        </div>

        <small class="text-muted">
          請選擇至少 {{ estimatedMinTime }} 分鐘後的營業時間（每 5 分鐘一個時段）
        </small>
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

// 預約日期和時間選擇
const scheduledDate = ref('')
const scheduledTimeSlot = ref('')

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

// 最小預約日期（今天）
const minScheduledDate = computed(() => {
  const date = new Date()
  return date.toISOString().split('T')[0]
})

// 是否可以預約訂單（根據 advanceOrderDays）
const canScheduleOrder = computed(() => {
  const advanceOrderDays = storeData.value?.advanceOrderDays ?? 1
  return advanceOrderDays > 0
})

// 最大預約日期（根據 advanceOrderDays 計算）
const maxScheduledDate = computed(() => {
  const advanceOrderDays = storeData.value?.advanceOrderDays ?? 1
  const date = new Date()
  // advanceOrderDays - 1 是因為 1 表示當天，2 表示隔天
  const daysToAdd = Math.max(0, advanceOrderDays - 1)
  date.setDate(date.getDate() + daysToAdd)
  return date.toISOString().split('T')[0]
})

// 根據日期和營業時間計算可用時段（每5分鐘間隔）
const availableTimeSlots = computed(() => {
  if (!scheduledDate.value || !storeData.value?.businessHours) {
    return []
  }

  const selectedDate = new Date(scheduledDate.value + 'T00:00:00')
  const dayOfWeek = selectedDate.getDay() // 0=Sunday, 1=Monday, ..., 6=Saturday

  // 找出該天的營業時間
  const dayHours = storeData.value.businessHours.find((h) => h.day === dayOfWeek)

  if (!dayHours || dayHours.isClosed || !dayHours.periods || dayHours.periods.length === 0) {
    return []
  }

  const slots = []
  const now = new Date()
  const minTime = new Date(now.getTime() + estimatedMinTime.value * 60000)
  const isToday = selectedDate.toDateString() === now.toDateString()

  // 遍歷該天的所有營業時段
  for (const period of dayHours.periods) {
    if (!period.open || !period.close) continue

    const [openHour, openMin] = period.open.split(':').map(Number)
    const [closeHour, closeMin] = period.close.split(':').map(Number)

    // 營業時段的開始和結束時間
    let currentSlot = new Date(selectedDate)
    currentSlot.setHours(openHour, openMin, 0, 0)

    const endTime = new Date(selectedDate)
    endTime.setHours(closeHour, closeMin, 0, 0)

    // 如果是今天，確保開始時間不早於最小預約時間
    if (isToday && currentSlot < minTime) {
      // 將當前時段調整到最小預約時間後的下一個5分鐘整數倍
      currentSlot = new Date(minTime)
      const minutes = currentSlot.getMinutes()
      const roundedMinutes = Math.ceil(minutes / 5) * 5
      currentSlot.setMinutes(roundedMinutes, 0, 0)
    }

    // 生成該時段的所有5分鐘間隔時段
    while (currentSlot < endTime) {
      // 確保時段符合最小預約時間（如果是今天的話）
      if (!isToday || currentSlot >= minTime) {
        const hours = currentSlot.getHours().toString().padStart(2, '0')
        const minutes = currentSlot.getMinutes().toString().padStart(2, '0')
        const timeValue = `${hours}:${minutes}`

        slots.push({
          value: timeValue,
          label: timeValue,
        })
      }

      // 增加5分鐘
      currentSlot = new Date(currentSlot.getTime() + 5 * 60000)
    }
  }

  return slots
})

// 時段選擇提示文字
const getTimeSlotPlaceholder = computed(() => {
  if (!scheduledDate.value) {
    return '請先選擇日期'
  }
  if (availableTimeSlots.value.length === 0) {
    return '當日無可用時段'
  }
  return '請選擇時間'
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
    // 初始化為今天的日期
    scheduledDate.value = minScheduledDate.value
  } else {
    // 如果已有預約時間，解析並設定日期和時段
    const [datePart, timePart] = localScheduledTime.value.split('T')
    if (datePart) {
      scheduledDate.value = datePart
    }
    if (timePart) {
      scheduledTimeSlot.value = timePart
    }
  }
}

// 監聽日期變化，重置時段選擇
watch(scheduledDate, () => {
  scheduledTimeSlot.value = ''
})

// 監聽日期和時段變化，更新 localScheduledTime
watch([scheduledDate, scheduledTimeSlot], ([date, time]) => {
  if (date && time) {
    // 組合成 ISO 格式的日期時間字符串
    localScheduledTime.value = `${date}T${time}`
  } else if (date && !time) {
    // 只有日期沒有時段時，清空 localScheduledTime
    localScheduledTime.value = ''
  }
})

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
    // 重新計算可用時段（由於最小時間改變）
    // 如果當前選擇的時段不再可用，重置時段選擇
    if (scheduledDate.value && scheduledTimeSlot.value) {
      const newMinTime = minScheduledTime.value
      const currentScheduledTime = `${scheduledDate.value}T${scheduledTimeSlot.value}`
      if (currentScheduledTime < newMinTime) {
        // 當前選擇的時間早於新的最小時間，重置選擇
        scheduledTimeSlot.value = ''
      }
    }
  }
})

// 監聽取餐時間類型變化
watch(localPickupTime, (newVal) => {
  if (newVal === 'scheduled') {
    // 切換到預約時間時，初始化日期和時段
    initializeScheduledTime()
  }
})

// 監聽 advanceOrderDays 變化，如果不允許預約則自動切換到 asap
watch(canScheduleOrder, (newVal) => {
  if (!newVal && localPickupTime.value === 'scheduled') {
    // 如果不允許預約且當前選擇了預約時間，切換回 asap
    localPickupTime.value = 'asap'
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
