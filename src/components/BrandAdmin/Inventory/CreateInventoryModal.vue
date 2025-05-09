<template>
  <BModal :model-value="show" @update:model-value="emit('close')" title="新增自訂義庫存" @ok="submitForm"
    :ok-disabled="isSubmitting" ok-title="建立庫存" cancel-title="取消">
    <template #default>
      <form @submit.prevent="submitForm">
        <!-- 庫存類型 -->
        <div class="mb-3">
          <label class="form-label">庫存類型</label>
          <select v-model="form.inventoryType" class="form-select" required>
            <option value="else">其他</option>
            <option value="DishTemplate">餐點</option>
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
            <label class="form-label">初始總庫存</label>
            <input type="number" v-model.number="form.initialTotalStock" class="form-control" min="0" required>
          </div>
          <div class="col-md-6">
            <label class="form-label">初始可販售庫存</label>
            <input type="number" v-model.number="form.initialAvailableStock" class="form-control" min="0"
              :max="form.initialTotalStock" :disabled="!form.enableAvailableStock">
            <small class="form-text text-muted" v-if="!form.enableAvailableStock">需先啟用可販售庫存功能</small>
          </div>
        </div>

        <!-- 警告與限制 -->
        <div class="row g-3 mt-3">
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

        <!-- 追蹤設定 -->
        <div class="mt-4">
          <div class="form-check mb-2">
            <input class="form-check-input" type="checkbox" v-model="form.isInventoryTracked" id="isInventoryTracked">
            <label class="form-check-label" for="isInventoryTracked">
              追蹤庫存 (訂單自動扣除)
            </label>
          </div>

          <div class="form-check mb-2">
            <input class="form-check-input" type="checkbox" v-model="form.enableAvailableStock"
              id="enableAvailableStock">
            <label class="form-check-label" for="enableAvailableStock">
              啟用可販售庫存 (每日限量)
            </label>
          </div>

          <div class="form-check">
            <input class="form-check-input" type="checkbox" v-model="form.isSoldOut" id="isSoldOut">
            <label class="form-check-label" for="isSoldOut">
              設為售完狀態
            </label>
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
import { ref, reactive, watch } from 'vue';
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
  inventoryType: 'else',
  itemName: '',
  initialTotalStock: 0,
  initialAvailableStock: 0,
  minStockAlert: 5,
  targetStockLevel: null,
  isInventoryTracked: true,
  enableAvailableStock: false,
  isSoldOut: false
});

// 監聽總庫存變化，確保可販售庫存不超過總庫存
watch(() => form.initialTotalStock, (newValue) => {
  if (form.initialAvailableStock > newValue) {
    form.initialAvailableStock = newValue;
  }
});

// 監聽可販售庫存功能開關
watch(() => form.enableAvailableStock, (newValue) => {
  if (!newValue) {
    form.initialAvailableStock = 0;
  }
});

// 提交表單
const submitForm = async (evt) => {
  evt.preventDefault();

  // 驗證表單
  if (!form.itemName.trim()) {
    error.value = '請輸入項目名稱';
    return;
  }

  if (form.enableAvailableStock && form.initialAvailableStock > form.initialTotalStock) {
    error.value = '可販售庫存不能超過總庫存';
    return;
  }

  isSubmitting.value = true;
  error.value = '';

  try {
    const inventoryData = {
      inventoryType: form.inventoryType,
      itemName: form.itemName.trim(),
      initialTotalStock: form.initialTotalStock,
      initialAvailableStock: form.enableAvailableStock ? form.initialAvailableStock : 0,
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
