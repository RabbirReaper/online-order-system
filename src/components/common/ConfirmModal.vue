<template>
  <BModal :id="modalId" :title="title" :ok-title="confirmText" :cancel-title="cancelText" :ok-variant="variantType"
    :ok-disabled="isDeleting" @ok="handleDelete" @hidden="$emit('close')">
    <p v-if="item">{{ confirmMessage }} <strong>{{ getItemName() }}</strong> 嗎？</p>
    <div class="alert" :class="`alert-${alertType}`">
      <i class="bi" :class="iconClass + ' me-2'"></i>
      {{ warningMessage }}
    </div>
    <div v-if="isDeleting" class="text-center mt-3">
      <div class="spinner-border" :class="`text-${variantType}`" role="status">
        <span class="visually-hidden">{{ loadingText }}</span>
      </div>
    </div>

    <template #modal-footer="{ ok, cancel }">
      <BButton variant="secondary" @click="cancel()">
        {{ cancelText }}
      </BButton>
      <BButton :variant="variantType" @click="ok()" :disabled="isDeleting">
        <span v-if="isDeleting" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
        {{ isDeleting ? loadingText : confirmText }}
      </BButton>
    </template>
  </BModal>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { BModal, BButton } from 'bootstrap-vue-next';

// 接收的屬性
const props = defineProps({
  // 對話框ID，用於初始化Bootstrap Modal
  modalId: {
    type: String,
    default: 'confirmModal'
  },
  // 對話框標題
  title: {
    type: String,
    default: '確認操作'
  },
  // 確認提示訊息
  confirmMessage: {
    type: String,
    default: '確定要刪除'
  },
  // 警告訊息
  warningMessage: {
    type: String,
    default: '此操作無法撤銷，請謹慎選擇！'
  },
  // 當前要刪除的項目
  item: {
    type: Object,
    default: null
  },
  // 用於顯示物件名稱的鍵值，如 'name'
  nameKey: {
    type: String,
    default: 'name'
  },
  // 提交按鈕文字
  confirmText: {
    type: String,
    default: '確認'
  },
  // 取消按鈕文字
  cancelText: {
    type: String,
    default: '取消'
  },
  // 刪除中按鈕文字
  loadingText: {
    type: String,
    default: '處理中...'
  },
  // 警告框類型
  alertType: {
    type: String,
    default: 'warning', // warning, danger, info, success
    validator: (value) => ['warning', 'danger', 'info', 'success'].includes(value)
  },
  // 警告框圖示
  alertIcon: {
    type: String,
    default: 'exclamation-triangle-fill' // 默認感嘆號三角圖示
  },
  // 模態框類型（顏色變體）
  variant: {
    type: String,
    default: 'primary', // 'success'（綠色）、'warning'（黃色）、'danger'（紅色）、'primary'（藍色）
    validator: (value) => ['success', 'warning', 'danger', 'primary', 'info', 'secondary'].includes(value)
  }
});

// 定義事件
const emit = defineEmits(['delete', 'close']);

// 響應式變數
const isDeleting = ref(false);
const modalVisible = ref(false);

// 根據 variant 屬性設置模態框按鈕顏色
const variantType = computed(() => props.variant);

// 計算alert類與圖示類
const iconClass = computed(() => `bi-${props.alertIcon}`);

// 獲取項目名稱
const getItemName = () => {
  if (!props.item) return '';
  return props.item[props.nameKey] || '未命名項目';
};

// 處理刪除操作
const handleDelete = async () => {
  isDeleting.value = true;

  try {
    // 通知父組件執行刪除操作
    await emit('delete', props.item);
  } catch (error) {
    console.error('操作失敗:', error);
  } finally {
    isDeleting.value = false;
  }
};

// 顯示對話框
const show = () => {
  modalVisible.value = true;
};

// 監聽項目變化，當有新項目時自動顯示對話框
watch(() => props.item, (newItem) => {
  if (newItem) {
    modalVisible.value = true;
  }
});

// 將方法暴露給父組件使用
defineExpose({
  show
});
</script>
