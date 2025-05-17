<template>
  <div class="order-type-container mb-4">
    <!-- 取餐方式 -->
    <h6 class="mb-3 fw-bold">取餐方式</h6>
    <div class="d-flex flex-wrap">
      <div class="form-check me-4 mb-3">
        <input class="form-check-input" type="radio" name="orderType" id="dineIn" value="dine_in"
          v-model="localOrderType">
        <label class="form-check-label" for="dineIn">內用</label>
      </div>
      <div class="form-check me-4 mb-3">
        <input class="form-check-input" type="radio" name="orderType" id="selfPickup" value="takeout"
          v-model="localOrderType">
        <label class="form-check-label" for="selfPickup">自取</label>
      </div>
      <div class="form-check mb-3">
        <input class="form-check-input" type="radio" name="orderType" id="delivery" value="delivery"
          v-model="localOrderType">
        <label class="form-check-label" for="delivery">外送</label>
      </div>
    </div>

    <!-- 內用選項 -->
    <div v-if="localOrderType === 'dine_in'" class="mt-3">
      <label for="tableNumber" class="form-label">桌號 <span class="text-danger">*</span></label>
      <input type="text" class="form-control" id="tableNumber" v-model="localTableNumber" placeholder="請輸入桌號">
      <small class="text-muted">請向服務人員確認您的桌號</small>
    </div>

    <!-- 外送選項 -->
    <div v-if="localOrderType === 'delivery'" class="mt-3">
      <label for="deliveryAddress" class="form-label">外送地址 <span class="text-danger">*</span></label>
      <textarea class="form-control" id="deliveryAddress" rows="2" v-model="localDeliveryAddress"
        placeholder="請輸入詳細外送地址"></textarea>
      <div class="d-flex justify-content-between align-items-center mt-2">
        <small class="text-muted">外送範圍僅限方圓 3 公里內</small>
        <div class="delivery-fee-badge">
          外送費: ${{ deliveryFee }}
        </div>
      </div>
    </div>

    <!-- 取餐時間 -->
    <div class="pickup-time-container mt-4">
      <h6 class="mb-3 fw-bold">取餐時間</h6>
      <div class="d-flex">
        <div class="form-check me-4">
          <input class="form-check-input" type="radio" name="pickupTime" id="asap" value="asap"
            v-model="localPickupTime">
          <label class="form-check-label" for="asap">盡快取餐</label>
        </div>
        <div class="form-check">
          <input class="form-check-input" type="radio" name="pickupTime" id="scheduled" value="scheduled"
            v-model="localPickupTime">
          <label class="form-check-label" for="scheduled">預約時間</label>
        </div>
      </div>

      <div v-if="localPickupTime === 'scheduled'" class="mt-3">
        <label for="scheduledTime" class="form-label">預約時間 <span class="text-danger">*</span></label>
        <input type="datetime-local" class="form-control" id="scheduledTime" v-model="localScheduledTime"
          :min="minPickupTime">
        <small class="text-muted">請選擇至少 30 分鐘後的時間</small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  orderType: {
    type: String,
    default: 'takeout' // 默認為自取
  },
  tableNumber: {
    type: String,
    default: ''
  },
  deliveryAddress: {
    type: String,
    default: ''
  },
  pickupTime: {
    type: String,
    default: 'asap' // 'asap' 或 'scheduled'
  },
  scheduledTime: {
    type: String,
    default: ''
  }
});

const emit = defineEmits([
  'update:orderType',
  'update:tableNumber',
  'update:deliveryAddress',
  'update:pickupTime',
  'update:scheduledTime',
  'update:delivery-fee'
]);

// 本地狀態
const localOrderType = ref(props.orderType);
const localTableNumber = ref(props.tableNumber);
const localDeliveryAddress = ref(props.deliveryAddress);
const localPickupTime = ref(props.pickupTime);
const localScheduledTime = ref(props.scheduledTime);
const deliveryFee = ref(60); // 默認外送費

// 最小取餐時間（當前時間 + 30 分鐘）
const minPickupTime = computed(() => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 30);
  return date.toISOString().slice(0, 16);
});

// 初始化 localScheduledTime 如果為空
if (!localScheduledTime.value) {
  localScheduledTime.value = minPickupTime.value;
}

// 監聽 props 變化
watch(() => props.orderType, (newVal) => {
  localOrderType.value = newVal;
});

watch(() => props.tableNumber, (newVal) => {
  localTableNumber.value = newVal;
});

watch(() => props.deliveryAddress, (newVal) => {
  localDeliveryAddress.value = newVal;
});

watch(() => props.pickupTime, (newVal) => {
  localPickupTime.value = newVal;
});

watch(() => props.scheduledTime, (newVal) => {
  localScheduledTime.value = newVal;
});

// 監聽本地狀態變化並向上傳遞
watch(localOrderType, (newVal) => {
  emit('update:orderType', newVal);

  // 如果選擇外送，更新外送費
  if (newVal === 'delivery') {
    emit('update:delivery-fee', deliveryFee.value);
  } else {
    emit('update:delivery-fee', 0);
  }
});

watch(localTableNumber, (newVal) => {
  emit('update:tableNumber', newVal);
});

watch(localDeliveryAddress, (newVal) => {
  emit('update:deliveryAddress', newVal);
});

watch(localPickupTime, (newVal) => {
  emit('update:pickupTime', newVal);
});

watch(localScheduledTime, (newVal) => {
  emit('update:scheduledTime', newVal);
});
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
input[type="datetime-local"] {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.order-type-container label {
  font-weight: 500;
}
</style>
