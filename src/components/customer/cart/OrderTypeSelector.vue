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

    <!-- 取餐/配送時間 (僅限外帶和外送) -->
    <div v-if="localOrderType === 'takeout' || localOrderType === 'delivery'" class="pickup-time-container mt-4">
      <h6 class="mb-3 fw-bold">{{ localOrderType === 'delivery' ? '配送時間' : '取餐時間' }}</h6>
      <div class="d-flex">
        <div class="form-check me-4">
          <input class="form-check-input" type="radio" name="pickupTime" id="asap" value="asap"
            v-model="localPickupTime">
          <label class="form-check-label" for="asap">
            {{ localOrderType === 'delivery' ? '盡快配送' : '盡快取餐' }}
            <small class="d-block text-muted">
              約 {{ estimatedMinTime }} 分鐘{{ localOrderType === 'delivery' ? '後送達' : '後可取餐' }}
            </small>
          </label>
        </div>
        <div class="form-check">
          <input class="form-check-input" type="radio" name="pickupTime" id="scheduled" value="scheduled"
            v-model="localPickupTime">
          <label class="form-check-label" for="scheduled">預約時間</label>
        </div>
      </div>

      <div v-if="localPickupTime === 'scheduled'" class="mt-3">
        <label for="scheduledTime" class="form-label">
          預約{{ localOrderType === 'delivery' ? '配送' : '取餐' }}時間 <span class="text-danger">*</span>
        </label>
        <input type="datetime-local" class="form-control" id="scheduledTime" v-model="localScheduledTime"
          :min="minScheduledTime">
        <small class="text-muted">請選擇至少 {{ estimatedMinTime }} 分鐘後的時間</small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import api from '@/api';

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
  },
  storeInfo: {
    type: Object,
    default: () => ({})
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

// 店鋪資訊
const storeData = ref(props.storeInfo || {});

// 計算預估時間
const estimatedMinTime = computed(() => {
  if (localOrderType.value === 'takeout') {
    return storeData.value.takeOutPrepTime || 15; // 預設15分鐘
  } else if (localOrderType.value === 'delivery') {
    return storeData.value.deliveryPrepTime || 30; // 預設30分鐘
  }
  return 15;
});

// 最小預約時間（當前時間 + 預估時間）
const minScheduledTime = computed(() => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + estimatedMinTime.value);
  return date.toISOString().slice(0, 16);
});

// 載入店鋪資訊
const loadStoreInfo = async () => {
  try {
    const brandId = sessionStorage.getItem('currentBrandId');
    const storeId = sessionStorage.getItem('currentStoreId');

    if (brandId && storeId) {
      const response = await api.store.getStoreById({
        brandId: brandId,
        id: storeId
      });

      if (response && response.success) {
        storeData.value = response.store;
      }
    }
  } catch (error) {
    console.error('載入店鋪資訊失敗:', error);
  }
};

// 初始化預約時間
const initializeScheduledTime = () => {
  if (!localScheduledTime.value) {
    localScheduledTime.value = minScheduledTime.value;
  }
};

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

watch(() => props.storeInfo, (newVal) => {
  storeData.value = newVal || {};
}, { deep: true });

// 監聽本地狀態變化並向上傳遞
watch(localOrderType, (newVal) => {
  emit('update:orderType', newVal);

  // 重置相關欄位
  if (newVal === 'delivery') {
    emit('update:delivery-fee', deliveryFee.value);
  } else {
    emit('update:delivery-fee', 0);
  }

  // 當訂單類型改變時，重新初始化預約時間
  if (newVal === 'takeout' || newVal === 'delivery') {
    initializeScheduledTime();
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

// 監聽預估時間變化，更新最小預約時間
watch(estimatedMinTime, () => {
  if (localPickupTime.value === 'scheduled') {
    const newMinTime = minScheduledTime.value;
    if (localScheduledTime.value < newMinTime) {
      localScheduledTime.value = newMinTime;
      emit('update:scheduledTime', newMinTime);
    }
  }
});

onMounted(async () => {
  await loadStoreInfo();
  initializeScheduledTime();
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

.form-check-label small {
  font-weight: 400;
  margin-top: 2px;
}
</style>
