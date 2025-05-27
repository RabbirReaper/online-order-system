<template>
  <BModal 
    v-model="isVisible" 
    :title="modalTitle"
    @hide="handleClose"
    @ok="handleConfirm"
    @cancel="handleClose"
    ok-title="確認取消"
    cancel-title="保留訂單"
    ok-variant="danger"
    cancel-variant="secondary"
    :ok-disabled="!cancelReason.trim()"
    size="md"
    centered
    no-close-on-backdrop
    no-close-on-esc
  >
    <div class="cancel-confirm-content">
      <!-- 警告訊息 -->
      <div class="alert alert-warning d-flex align-items-center mb-3" role="alert">
        <i class="bi bi-exclamation-triangle-fill me-2 text-warning" style="font-size: 1.2rem;"></i>
        <div>
          <strong>注意！</strong> 此操作將無法復原，訂單一旦取消後無法恢復。
        </div>
      </div>

      <!-- 訂單資訊 -->
      <div v-if="orderInfo" class="order-info-section mb-3">
        <h6 class="fw-bold mb-2">訂單資訊</h6>
        <div class="border rounded p-3 bg-light">
          <div class="row">
            <div class="col-6">
              <small class="text-muted">訂單編號：</small>
              <div class="fw-bold">{{ orderInfo.orderNumber || orderInfo._id?.slice(-6) }}</div>
            </div>
            <div class="col-6">
              <small class="text-muted">訂單金額：</small>
              <div class="fw-bold text-primary">${{ orderInfo.total?.toLocaleString('en-US') || 0 }}</div>
            </div>
          </div>
          <div class="row mt-2">
            <div class="col-6">
              <small class="text-muted">取餐方式：</small>
              <div>{{ formatOrderType(orderInfo.orderType) }}</div>
            </div>
            <div class="col-6">
              <small class="text-muted">訂單狀態：</small>
              <div>
                <BBadge :variant="getStatusVariant(orderInfo.status)">
                  {{ formatOrderStatus(orderInfo.status) }}
                </BBadge>
              </div>
            </div>
          </div>
          <div v-if="orderInfo.dineInInfo?.tableNumber" class="row mt-2">
            <div class="col-12">
              <small class="text-muted">桌號：</small>
              <div>{{ orderInfo.dineInInfo.tableNumber }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 取消原因輸入 -->
      <div class="cancel-reason-section">
        <BFormGroup 
          label="取消原因" 
          label-for="cancel-reason"
          :invalid-feedback="reasonError"
          :state="reasonState"
        >
          <BFormSelect 
            id="cancel-reason" 
            v-model="cancelReason"
            :options="cancelReasonOptions"
            :state="reasonState"
            @change="clearError"
          />
        </BFormGroup>

        <!-- 自訂原因輸入框 -->
        <BFormGroup 
          v-if="cancelReason === 'custom'"
          label="請輸入自訂原因"
          label-for="custom-reason"
        >
          <BFormTextarea
            id="custom-reason"
            v-model="customReason"
            rows="3"
            placeholder="請詳細說明取消原因..."
            maxlength="200"
            :state="customReasonState"
          />
          <small class="text-muted">{{ customReason.length }}/200</small>
        </BFormGroup>
      </div>
    </div>
  </BModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { 
  BModal, 
  BFormGroup, 
  BFormSelect, 
  BFormTextarea,
  BBadge
} from 'bootstrap-vue-next';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  orderInfo: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

// 響應式數據
const cancelReason = ref('');
const customReason = ref('');
const reasonError = ref('');

// 計算屬性
const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const modalTitle = computed(() => {
  return props.orderInfo 
    ? `取消訂單 #${props.orderInfo.orderNumber || props.orderInfo._id?.slice(-6)}` 
    : '取消訂單';
});

const reasonState = computed(() => {
  if (reasonError.value) return false;
  if (cancelReason.value.trim()) return true;
  return null;
});

const customReasonState = computed(() => {
  if (cancelReason.value === 'custom') {
    return customReason.value.trim().length >= 5 ? true : false;
  }
  return null;
});

// 取消原因選項
const cancelReasonOptions = [
  { value: '', text: '請選擇取消原因', disabled: true },
  { value: '客戶要求取消', text: '客戶要求取消' },
  { value: '餐點缺貨', text: '餐點缺貨' },
  { value: '廚房問題', text: '廚房問題' },
  { value: '系統錯誤', text: '系統錯誤' },
  { value: '重複訂單', text: '重複訂單' },
  { value: '付款問題', text: '付款問題' },
  { value: '營業時間外', text: '營業時間外' },
  { value: 'custom', text: '其他原因（請說明）' }
];

// 監聽取消原因變化，清空自訂原因
watch(cancelReason, (newValue) => {
  if (newValue !== 'custom') {
    customReason.value = '';
  }
  clearError();
});

// 方法
const clearError = () => {
  reasonError.value = '';
};

const validateReason = () => {
  if (!cancelReason.value.trim()) {
    reasonError.value = '請選擇取消原因';
    return false;
  }
  
  if (cancelReason.value === 'custom' && customReason.value.trim().length < 5) {
    reasonError.value = '自訂原因至少需要5個字符';
    return false;
  }
  
  return true;
};

const handleConfirm = (bvModalEvent) => {
  // 阻止modal關閉
  bvModalEvent.preventDefault();
  
  if (!validateReason()) {
    return;
  }

  const finalReason = cancelReason.value === 'custom' 
    ? customReason.value.trim() 
    : cancelReason.value;

  emit('confirm', {
    orderId: props.orderInfo?._id,
    reason: finalReason
  });
};

const handleClose = () => {
  emit('cancel');
  resetForm();
};

const resetForm = () => {
  cancelReason.value = '';
  customReason.value = '';
  reasonError.value = '';
};

// 輔助函數
const formatOrderType = (orderType) => {
  const typeMap = {
    'dine_in': '內用',
    'takeout': '外帶',
    'delivery': '外送'
  };
  return typeMap[orderType] || orderType;
};

const formatOrderStatus = (status) => {
  const statusMap = {
    'unpaid': '未付款',
    'paid': '已付款',
    'cancelled': '已取消',
    'preparing': '製作中',
    'ready': '已完成',
    'completed': '已完成'
  };
  return statusMap[status] || status;
};

const getStatusVariant = (status) => {
  const variantMap = {
    'unpaid': 'warning',
    'paid': 'success',
    'cancelled': 'danger',
    'preparing': 'info',
    'ready': 'primary',
    'completed': 'success'
  };
  return variantMap[status] || 'secondary';
};

// 當modal關閉時重置表單
watch(isVisible, (newValue) => {
  if (!newValue) {
    resetForm();
  }
});
</script>

<style scoped>
.cancel-confirm-content {
  font-size: 0.95rem;
}

.order-info-section .border {
  border-color: #dee2e6 !important;
}

.alert {
  border-radius: 0.375rem;
}

.cancel-reason-section {
  margin-top: 1rem;
}
</style>