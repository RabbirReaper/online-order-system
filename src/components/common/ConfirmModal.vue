<template>
  <div class="modal fade" :id="modalId" tabindex="-1" aria-hidden="true" ref="modalRef">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ title }}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body" v-if="item">
          <p>{{ confirmMessage }} <strong>{{ getItemName() }}</strong> 嗎？</p>
          <div class="alert alert-danger" :class="alertClass">
            <i class="bi" :class="iconClass + ' me-2'"></i>
            {{ warningMessage }}
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ cancelText }}</button>
          <button type="button" class="btn btn-danger" @click="handleDelete" :disabled="isDeleting">
            <span v-if="isDeleting" class="spinner-border spinner-border-sm me-1" role="status"
              aria-hidden="true"></span>
            {{ isDeleting ? loadingText : confirmText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { Modal } from 'bootstrap';

// 接收的屬性
const props = defineProps({
  // 對話框ID，用於初始化Bootstrap Modal
  modalId: {
    type: String,
    default: 'deleteConfirmModal'
  },
  // 對話框標題
  title: {
    type: String,
    default: '確認刪除'
  },
  // 確認提示訊息
  confirmMessage: {
    type: String,
    default: '確定要刪除'
  },
  // 警告訊息
  warningMessage: {
    type: String,
    default: '此操作無法撤銷，刪除後將無法復原！'
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
    default: '確認刪除'
  },
  // 取消按鈕文字
  cancelText: {
    type: String,
    default: '取消'
  },
  // 刪除中按鈕文字
  loadingText: {
    type: String,
    default: '刪除中...'
  },
  // 警告框類型
  alertType: {
    type: String,
    default: 'warning', // warning, danger 等
    validator: (value) => ['warning', 'danger', 'info'].includes(value)
  },
  // 警告框圖示
  alertIcon: {
    type: String,
    default: 'exclamation-triangle-fill' // 默認感嘆號三角圖示
  }
});

// 定義事件
const emit = defineEmits(['delete', 'close']);

// 響應式變數
const isDeleting = ref(false);
const modalRef = ref(null);
const modalInstance = ref(null);

// 計算alert類與圖示類
const alertClass = computed(() => `alert-${props.alertType}`);
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
    // 隱藏對話框
    hide();
  } catch (error) {
    console.error('刪除操作失敗:', error);
  } finally {
    isDeleting.value = false;
  }
};

// 顯示對話框
const show = () => {
  if (modalInstance.value) {
    modalInstance.value.show();
  }
};

// 隱藏對話框
const hide = () => {
  if (modalInstance.value) {
    modalInstance.value.hide();
    emit('close');
  }
};

// 監聽項目變化，當有新項目時自動顯示對話框
watch(() => props.item, (newItem) => {
  if (newItem && modalInstance.value) {
    show();
  }
});

// 初始化Modal
onMounted(() => {
  if (modalRef.value) {
    modalInstance.value = new Modal(modalRef.value);

    // 監聽對話框關閉事件，告知父組件
    modalRef.value.addEventListener('hidden.bs.modal', () => {
      emit('close');
    });
  }
});

// 將方法暴露給父組件使用
defineExpose({
  show,
  hide
});
</script>
