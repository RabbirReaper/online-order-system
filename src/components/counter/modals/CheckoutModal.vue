<template>
  <BModal ref="modalRef" v-model="isVisible" title="選擇付款方式" size="lg" centered hide-footer @hide="handleClose">
    <div class="text-center">
      <div class="mb-4">
        <h3>應付金額：${{ total }}</h3>
      </div>

      <div class="row g-3">
        <!-- 現金付款 -->
        <div class="col-4">
          <button class="btn btn-success btn-lg w-100 py-4" @click="handlePaymentMethod('cash')">
            <i class="bi bi-cash-stack fs-1 d-block mb-2"></i>
            現金付款
          </button>
        </div>

        <!-- 信用卡付款 -->
        <div class="col-4">
          <button class="btn btn-primary btn-lg w-100 py-4" @click="handlePaymentMethod('credit_card')">
            <i class="bi bi-credit-card fs-1 d-block mb-2"></i>
            信用卡
          </button>
        </div>

        <!-- LINE Pay -->
        <div class="col-4">
          <button class="btn btn-warning btn-lg w-100 py-4" @click="handlePaymentMethod('line_pay')">
            <i class="bi bi-line fs-1 d-block mb-2"></i>
            LINE Pay
          </button>
        </div>
      </div>
    </div>
  </BModal>
</template>

<script setup>
import { ref, watch } from 'vue';
import { BModal } from 'bootstrap-vue-next';

const props = defineProps({
  total: {
    type: Number,
    required: true
  },
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'close', 'paymentSelected']);

// Modal 顯示狀態
const modalRef = ref();
const isVisible = ref(props.modelValue);

// 監聽 modelValue 變化
watch(() => props.modelValue, (newValue) => {
  isVisible.value = newValue;
});

// 監聽 isVisible 變化，同步到父組件
watch(isVisible, (newValue) => {
  emit('update:modelValue', newValue);
});

// 處理付款方式選擇
const handlePaymentMethod = (paymentMethod) => {
  emit('paymentSelected', {
    paymentMethod,
    paymentType: 'On-site'
  });
  handleClose();
};

// 處理關閉
const handleClose = () => {
  isVisible.value = false;
  emit('close');
};

// 暴露方法給父組件
defineExpose({
  show: () => {
    isVisible.value = true;
  },
  hide: () => {
    isVisible.value = false;
  }
});
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
