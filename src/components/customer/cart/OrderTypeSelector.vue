<template>
  <div class="order-type-selector">
    <!-- 訂單類型選擇 -->
    <div class="order-type-buttons mb-4">
      <BButtonGroup>
        <BButton v-for="(type, index) in orderTypes" :key="index"
          :variant="modelValue === type.value ? 'primary' : 'outline-secondary'" class="order-type-btn"
          @click="selectOrderType(type.value)">
          <i :class="type.icon" class="me-2"></i>
          {{ type.label }}
        </BButton>
      </BButtonGroup>
    </div>

    <!-- 根據選擇的訂單類型顯示不同的選項 -->
    <div v-if="modelValue" class="order-type-details">
      <!-- 內用選項 -->
      <div v-if="modelValue === 'dine_in'" class="dine-in-options">
        <BFormGroup label="桌號" label-for="table-number" class="mb-3">
          <BFormInput id="table-number" v-model="tableNumber" placeholder="請輸入桌號" required></BFormInput>
        </BFormGroup>

        <BFormGroup label="用餐人數" label-for="number-of-guests" class="mb-3">
          <BFormInput id="number-of-guests" v-model="numberOfGuests" type="number" min="1" placeholder="請輸入人數">
          </BFormInput>
        </BFormGroup>
      </div>

      <!-- 外帶選項 -->
      <div v-else-if="modelValue === 'takeout'" class="takeout-options">
        <BFormGroup label="預計取餐時間" label-for="pickup-time">
          <BFormTimepicker id="pickup-time" v-model="pickupTime" locale="zh" placeholder="選擇取餐時間" required>
          </BFormTimepicker>
        </BFormGroup>

        <small class="text-muted">
          <i class="bi bi-info-circle me-1"></i>
          請至少提前 15 分鐘預訂，以確保餐點準備完畢
        </small>
      </div>

      <!-- 外送選項 -->
      <div v-else-if="modelValue === 'delivery'" class="delivery-options">
        <BFormGroup label="配送地址" label-for="delivery-address" class="mb-3">
          <BFormTextarea id="delivery-address" v-model="deliveryAddress" rows="2" placeholder="請輸入完整配送地址" required>
          </BFormTextarea>
        </BFormGroup>

        <div class="delivery-fee-info alert alert-info">
          <i class="bi bi-truck me-2"></i>
          配送費: ${{ deliveryFee }}
        </div>

        <small class="text-muted">
          <i class="bi bi-info-circle me-1"></i>
          配送時間約 30-45 分鐘，視距離和天氣情況而定
        </small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

// 定義 props
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
});

// 定義 emits
const emit = defineEmits(['update:modelValue', 'pickup-time-selected', 'dine-in-info-updated', 'delivery-info-updated']);

// 訂單類型選項
const orderTypes = [
  {
    label: '內用',
    value: 'dine_in',
    icon: 'bi bi-cup-hot'
  },
  {
    label: '外帶',
    value: 'takeout',
    icon: 'bi bi-bag'
  },
  {
    label: '外送',
    value: 'delivery',
    icon: 'bi bi-truck'
  }
];

// 內用選項
const tableNumber = ref('');
const numberOfGuests = ref(1);

// 外帶選項
const pickupTime = ref('');

// 外送選項
const deliveryAddress = ref('');
const deliveryFee = ref(60); // 預設配送費

// 選擇訂單類型
const selectOrderType = (type) => {
  emit('update:modelValue', type);
};

// 監聽內用信息變化
watch([tableNumber, numberOfGuests], () => {
  if (props.modelValue === 'dine_in') {
    emit('dine-in-info-updated', {
      tableNumber: tableNumber.value,
      numberOfGuests: parseInt(numberOfGuests.value) || 1
    });
  }
}, { deep: true });

// 監聽外帶取餐時間變化
watch(pickupTime, (newValue) => {
  if (props.modelValue === 'takeout' && newValue) {
    // 將時間字符串轉換為日期對象
    let selectedTime;
    if (typeof newValue === 'string') {
      const today = new Date();
      const [hours, minutes] = newValue.split(':').map(Number);
      selectedTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
    } else {
      selectedTime = newValue;
    }

    emit('pickup-time-selected', selectedTime);
  }
});

// 監聽外送信息變化
watch([deliveryAddress, deliveryFee], () => {
  if (props.modelValue === 'delivery') {
    emit('delivery-info-updated', {
      address: deliveryAddress.value,
      deliveryFee: deliveryFee.value
    });
  }
}, { deep: true });

// 監聽選擇類型的變化，更新對應信息
watch(() => props.modelValue, (newType) => {
  if (newType === 'dine_in') {
    emit('dine-in-info-updated', {
      tableNumber: tableNumber.value,
      numberOfGuests: parseInt(numberOfGuests.value) || 1
    });
  } else if (newType === 'takeout' && pickupTime.value) {
    let selectedTime;
    if (typeof pickupTime.value === 'string') {
      const today = new Date();
      const [hours, minutes] = pickupTime.value.split(':').map(Number);
      selectedTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
    } else {
      selectedTime = pickupTime.value;
    }

    emit('pickup-time-selected', selectedTime);
  } else if (newType === 'delivery') {
    emit('delivery-info-updated', {
      address: deliveryAddress.value,
      deliveryFee: deliveryFee.value
    });
  }
});
</script>

<style scoped>
.order-type-selector {
  margin-bottom: 1.5rem;
}

.order-type-btn {
  padding: 0.5rem 1rem;
  font-weight: 500;
}

.order-type-details {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.delivery-fee-info {
  padding: 0.75rem;
  margin-bottom: 1rem;
  font-weight: 500;
}
</style>
