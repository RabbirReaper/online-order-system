<template>
  <div class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">新增自訂義庫存</h5>
          <button type="button" class="btn-close" @click="closeModal"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitForm">
            <!-- 庫存類型 -->
            <div class="mb-3">
              <label class="form-label">庫存類型</label>
              <select v-model="form.inventoryType" class="form-select" required>
                <option value="else">其他</option>
                <option value="dish">餐點</option>
              </select>
            </div>

            <!-- 項目名稱 -->
            <div class="mb-3">
              <label class="form-label">項目名稱</label>
              <input type="text" v-model="form.itemName" class="form-control" required placeholder="例：外帶餐盒、餐具組等">
            </div>

            <!-- 基本設定 -->
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">初始倉庫庫存</label>
                <input type="number" v-model.number="form.initialWarehouseStock" class="form-control" min="0" required>
              </div>
              <div class="col-md-6">
                <label class="form-label">初始可販售庫存</label>
                <input type="number" v-model.number="form.initialAvailableStock" class="form-control" min="0"
                  :max="form.initialWarehouseStock" required>
              </div>
            </div>

            <!-- 警告與限制 -->
            <div class="row g-3 mt-3">
              <div class="col-md-6">
                <label class="form-label">最低庫存警告值</label>
                <input type="number" v-model.number="form.minStockAlert" class="form-control" min="0">
              </div>
              <div class="col-md-6">
                <label class="form-label">最高庫存限制</label>
                <input type="number" v-model.number="form.maxStockLimit" class="form-control" min="0"
                  placeholder="選填，留空表示無限制">
              </div>
            </div>

            <!-- 追蹤設定 -->
            <div class="mt-4">
              <div class="form-check mb-2">
                <input class="form-check-input" type="checkbox" v-model="form.isInventoryTracked"
                  id="isInventoryTracked">
                <label class="form-check-label" for="isInventoryTracked">
                  追蹤庫存
                </label>
              </div>

              <div class="form-check">
                <input class="form-check-input" type="checkbox" v-model="form.showAvailableStockToCustomer"
                  id="showAvailableStockToCustomer">
                <label class="form-check-label" for="showAvailableStockToCustomer">
                  顯示庫存數量給客人
                </label>
              </div>
            </div>

            <!-- 錯誤提示 -->
            <div v-if="error" class="alert alert-danger mt-3">
              {{ error }}
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal">取消</button>
          <button type="button" class="btn btn-primary" @click="submitForm" :disabled="isSubmitting">
            <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1"></span>
            {{ isSubmitting ? '建立中...' : '建立庫存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import api from '@/api';

// Props
const props = defineProps({
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

// 表單數據
const form = reactive({
  inventoryType: 'else',
  itemName: '',
  initialWarehouseStock: 0,
  initialAvailableStock: 0,
  minStockAlert: 5,
  maxStockLimit: null,
  isInventoryTracked: true,
  showAvailableStockToCustomer: false
});

// 監聽倉庫庫存變化，確保可販售庫存不超過倉庫庫存
watch(() => form.initialWarehouseStock, (newValue) => {
  if (form.initialAvailableStock > newValue) {
    form.initialAvailableStock = newValue;
  }
});

// 提交表單
const submitForm = async () => {
  // 驗證表單
  if (!form.itemName.trim()) {
    error.value = '請輸入項目名稱';
    return;
  }

  if (form.initialAvailableStock > form.initialWarehouseStock) {
    error.value = '可販售庫存不能超過倉庫庫存';
    return;
  }

  isSubmitting.value = true;
  error.value = '';

  try {
    const inventoryData = {
      inventoryType: form.inventoryType,
      itemName: form.itemName.trim(),
      initialWarehouseStock: form.initialWarehouseStock,
      initialAvailableStock: form.initialAvailableStock,
      minStockAlert: form.minStockAlert,
      maxStockLimit: form.maxStockLimit || undefined,
      isInventoryTracked: form.isInventoryTracked,
      showAvailableStockToCustomer: form.showAvailableStockToCustomer
    };

    await api.inventory.createInventory({
      storeId: props.storeId,
      data: inventoryData
    });

    emit('success');
  } catch (err) {
    console.error('建立庫存失敗:', err);
    error.value = err.response?.data?.message || '建立庫存時發生錯誤';
  } finally {
    isSubmitting.value = false;
  }
};

// 關閉 Modal
const closeModal = () => {
  emit('close');
};
</script>

<style scoped>
.modal {
  display: block;
}
</style>
