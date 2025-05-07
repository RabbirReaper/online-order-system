<template>
  <div class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">調整庫存</h5>
          <button type="button" class="btn-close" @click="closeModal"></button>
        </div>
        <div class="modal-body" v-if="item">
          <h6 class="mb-3">{{ item.itemName }}</h6>

          <!-- 調整類型選擇 -->
          <div class="mb-3">
            <label class="form-label">調整類型</label>
            <select v-model="adjustForm.type" class="form-select" @change="resetForm">
              <option value="warehouse">調整倉庫庫存</option>
              <option value="available">調整可販售庫存</option>
              <option value="transfer">轉移到可販售</option>
              <option value="damage">損耗處理</option>
            </select>
          </div>

          <!-- 當前庫存顯示 -->
          <div class="row g-3 mb-3">
            <div class="col-6">
              <div class="bg-light p-3 rounded">
                <small class="text-muted">當前倉庫庫存</small>
                <h5 class="mb-0">{{ item.warehouseStock }}</h5>
              </div>
            </div>
            <div class="col-6">
              <div class="bg-light p-3 rounded">
                <small class="text-muted">當前可販售庫存</small>
                <h5 class="mb-0">{{ item.availableStock }}</h5>
              </div>
            </div>
          </div>

          <!-- 倉庫庫存調整 -->
          <div v-if="adjustForm.type === 'warehouse'" class="mb-3">
            <label class="form-label">新倉庫庫存數量</label>
            <input type="number" v-model.number="adjustForm.warehouseStock" class="form-control" min="0">
            <div class="form-text text-muted">
              變化量: {{ adjustForm.warehouseStock - item.warehouseStock }}
            </div>
          </div>

          <!-- 可販售庫存調整 -->
          <div v-if="adjustForm.type === 'available'" class="mb-3">
            <label class="form-label">新可販售庫存數量</label>
            <input type="number" v-model.number="adjustForm.availableStock" class="form-control" min="0"
              :max="item.warehouseStock">
            <div class="form-text text-muted">
              變化量: {{ adjustForm.availableStock - item.availableStock }}
            </div>
          </div>

          <!-- 轉移數量 -->
          <div v-if="adjustForm.type === 'transfer'" class="mb-3">
            <label class="form-label">轉移數量</label>
            <input type="number" v-model.number="adjustForm.transferQuantity" class="form-control" min="1"
              :max="Math.max(0, item.warehouseStock - item.availableStock)">
            <div class="form-text text-muted">
              最多可轉移: {{ Math.max(0, item.warehouseStock - item.availableStock) }}
            </div>
          </div>

          <!-- 損耗處理 -->
          <div v-if="adjustForm.type === 'damage'">
            <div class="mb-3">
              <label class="form-label">損耗來源</label>
              <select v-model="adjustForm.damageFrom" class="form-select">
                <option value="warehouse">倉庫庫存</option>
                <option value="available">可販售庫存</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">損耗數量</label>
              <input type="number" v-model.number="adjustForm.damageQuantity" class="form-control" min="1"
                :max="getDamageMaxQuantity()">
            </div>
          </div>

          <!-- 原因輸入 -->
          <div class="mb-3">
            <label class="form-label">調整原因</label>
            <textarea v-model="adjustForm.reason" class="form-control" rows="2" required></textarea>
          </div>

          <!-- 錯誤提示 -->
          <div v-if="error" class="alert alert-danger">
            {{ error }}
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal">取消</button>
          <button type="button" class="btn btn-primary" @click="submitAdjustment" :disabled="isSubmitting">
            <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1"></span>
            {{ isSubmitting ? '處理中...' : '確認調整' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import api from '@/api';

// Props
const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  storeId: {
    type: String,
    required: true
  },
  brandId: {
    type: String,
    required: true
  }
});

// Emits
const emit = defineEmits(['close', 'success']);

// 狀態
const isSubmitting = ref(false);
const error = ref('');

// 調整表單
const adjustForm = ref({
  type: 'warehouse',
  warehouseStock: 0,
  availableStock: 0,
  transferQuantity: 1,
  damageFrom: 'warehouse',
  damageQuantity: 1,
  reason: ''
});

// 獲取正確的項目 ID
// 根據後端邏輯，dish 類型的庫存使用 dish ID，其他類型使用 _id
const getItemId = () => {
  if (props.item.inventoryType === 'dish') {
    // 對於餐點類型，使用 dish 字段（可能是對象或 ID）
    return typeof props.item.dish === 'object' ? props.item.dish._id : props.item.dish;
  } else {
    // 對於其他類型，使用庫存項目的 _id
    return props.item._id;
  }
};

// 初始化表單值
const initForm = () => {
  if (props.item) {
    adjustForm.value.warehouseStock = props.item.warehouseStock;
    adjustForm.value.availableStock = props.item.availableStock;
  }
};

// 重置表單
const resetForm = () => {
  adjustForm.value.reason = '';
  adjustForm.value.transferQuantity = 1;
  adjustForm.value.damageQuantity = 1;
  initForm();
};

// 獲取損耗最大數量
const getDamageMaxQuantity = () => {
  if (!props.item) return 0;
  if (adjustForm.value.damageFrom === 'warehouse') {
    return props.item.warehouseStock;
  } else {
    return props.item.availableStock;
  }
};

// 關閉 Modal
const closeModal = () => {
  emit('close');
};

// 提交調整
const submitAdjustment = async () => {
  if (!props.item || !adjustForm.value.reason.trim()) {
    error.value = '請填寫調整原因';
    return;
  }

  isSubmitting.value = true;
  error.value = '';

  try {
    let response;
    const itemId = getItemId();
    const inventoryType = props.item.inventoryType || 'dish';

    console.log('提交庫存調整:', {
      itemId,
      inventoryType,
      storeId: props.storeId,
      type: adjustForm.value.type,
      dish: props.item.dish,
      _id: props.item._id
    });

    switch (adjustForm.value.type) {
      case 'warehouse':
        response = await api.inventory.updateInventory({
          storeId: props.storeId,
          itemId,
          data: {
            inventoryType,
            stockType: 'warehouseStock',
            stock: adjustForm.value.warehouseStock,
            reason: adjustForm.value.reason
          }
        });
        break;

      case 'available':
        response = await api.inventory.updateInventory({
          storeId: props.storeId,
          itemId,
          data: {
            inventoryType,
            stockType: 'availableStock',
            stock: adjustForm.value.availableStock,
            reason: adjustForm.value.reason
          }
        });
        break;

      case 'transfer':
        response = await api.inventory.transferStock({
          storeId: props.storeId,
          itemId,
          quantity: adjustForm.value.transferQuantity,
          reason: adjustForm.value.reason,
          inventoryType
        });
        break;

      case 'damage':
        response = await api.inventory.processDamage({
          storeId: props.storeId,
          itemId,
          quantity: adjustForm.value.damageQuantity,
          reason: adjustForm.value.reason,
          stockType: adjustForm.value.damageFrom === 'warehouse' ? 'warehouseStock' : 'availableStock',
          inventoryType
        });
        break;
    }

    if (response) {
      emit('success');
    }
  } catch (err) {
    console.error('調整庫存失敗:', err);
    console.error('錯誤詳情:', {
      response: err.response,
      data: err.response?.data,
      status: err.response?.status,
      url: err.config?.url,
      method: err.config?.method,
      itemId: getItemId(),
      item: props.item
    });

    // 更詳細的錯誤處理
    if (err.response?.status === 404) {
      error.value = '找不到此庫存項目。對於餐點類型，請確認使用正確的 ID。';
    } else if (err.response?.status === 403) {
      error.value = '權限不足，請確認您有 order_system 權限';
    } else if (err.response?.data?.message) {
      error.value = err.response.data.message;
    } else {
      error.value = '調整庫存時發生錯誤，請稍後再試';
    }
  } finally {
    isSubmitting.value = false;
  }
};

// 監聽 item 變化
watch(() => props.item, () => {
  initForm();
});

// 生命週期
onMounted(() => {
  initForm();
  console.log('庫存項目資料:', props.item);
});
</script>

<style scoped>
.modal {
  display: block;
}
</style>
