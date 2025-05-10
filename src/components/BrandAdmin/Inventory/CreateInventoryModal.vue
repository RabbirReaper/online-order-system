<template>
  <BModal :model-value="show" @update:model-value="emit('close')" title="新增自訂義庫存" @ok="submitForm"
    :ok-disabled="isSubmitting" ok-title="建立庫存" cancel-title="取消" no-close-on-backdrop>
    <template #default>
      <form @submit.prevent="submitForm">
        <!-- 項目名稱 -->
        <div class="mb-3">
          <label class="form-label">項目名稱</label>
          <input type="text" v-model="form.itemName" class="form-control" required placeholder="例：外帶餐盒、餐具組等">
        </div>

        <!-- 基本設定 -->
        <div class="mb-3">
          <label class="form-label">初始總庫存</label>
          <input type="number" v-model.number="form.initialTotalStock" class="form-control" min="0" required>
        </div>

        <!-- 警告與限制 -->
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">最低庫存警告值</label>
            <input type="number" v-model.number="form.minStockAlert" class="form-control" min="0">
          </div>
          <div class="col-md-6">
            <label class="form-label">補貨目標數量</label>
            <input type="number" v-model.number="form.targetStockLevel" class="form-control" min="0"
              placeholder="選填，留空表示無設定">
          </div>
        </div>

        <!-- 錯誤提示 -->
        <div v-if="error" class="alert alert-danger mt-3">
          {{ error }}
        </div>
      </form>
    </template>

    <template #modal-footer>
      <BButton variant="secondary" @click="emit('close')">取消</BButton>
      <BButton variant="primary" :disabled="isSubmitting" @click="submitForm">
        <BSpinner small v-if="isSubmitting" class="me-1" />
        {{ isSubmitting ? '建立中...' : '建立庫存' }}
      </BButton>
    </template>
  </BModal>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { BModal, BButton, BSpinner } from 'bootstrap-vue-next';
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

// 控制 Modal 顯示
const show = ref(true);

// 狀態
const isSubmitting = ref(false);
const error = ref('');

// 表單數據
const form = reactive({
  inventoryType: 'else', // 固定為 else
  itemName: '',
  initialTotalStock: 0,
  minStockAlert: 5,
  targetStockLevel: null,
  // 以下預設都為 false
  isInventoryTracked: false,
  enableAvailableStock: false,
  isSoldOut: false,
  initialAvailableStock: 0
});

// 提交表單
const submitForm = async (evt) => {
  evt.preventDefault();

  // 驗證表單
  if (!form.itemName.trim()) {
    error.value = '請輸入項目名稱';
    return;
  }

  isSubmitting.value = true;
  error.value = '';

  try {
    const inventoryData = {
      inventoryType: form.inventoryType,
      itemName: form.itemName.trim(),
      initialTotalStock: form.initialTotalStock,
      initialAvailableStock: form.initialAvailableStock,
      minStockAlert: form.minStockAlert,
      targetStockLevel: form.targetStockLevel || undefined,
      isInventoryTracked: form.isInventoryTracked,
      enableAvailableStock: form.enableAvailableStock,
      isSoldOut: form.isSoldOut
    };

    await api.inventory.createInventory({
      storeId: props.storeId,
      data: inventoryData
    });

    emit('success');
    emit('close');
  } catch (err) {
    console.error('建立庫存失敗:', err);
    error.value = err.response?.data?.message || '建立庫存時發生錯誤';
  } finally {
    isSubmitting.value = false;
  }
};
</script>
