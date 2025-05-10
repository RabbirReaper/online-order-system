<template>
  <BModal v-model="isModalOpen" title="調整庫存" size="lg" @ok="handleSubmit" @cancel="handleCancel">
    <div class="mb-3">
      <h6 class="mb-2">{{ item.itemName }}</h6>
      <div class="d-flex gap-3">
        <div>
          <span class="text-muted">總庫存：</span>
          <strong>{{ item.totalStock }}</strong>
        </div>
        <div v-if="item.enableAvailableStock">
          <span class="text-muted">可販售庫存：</span>
          <strong>{{ item.availableStock }}</strong>
        </div>
      </div>
    </div>

    <!-- 調整類型選擇 -->
    <div class="mb-3">
      <label class="form-label">調整類型</label>
      <select v-model="adjustmentType" class="form-select" @change="handleTypeChange">
        <option value="set">設定新值</option>
        <option value="add">增加庫存</option>
        <option value="reduce">減少庫存</option>
      </select>
    </div>

    <!-- 庫存類型選擇 -->
    <div class="mb-3">
      <label class="form-label">庫存類型</label>
      <select v-model="stockType" class="form-select">
        <option value="totalStock">總庫存</option>
        <option v-if="item.enableAvailableStock" value="availableStock">可販售庫存</option>
        <option v-if="item.enableAvailableStock && adjustmentType === 'set'" value="both">同時設定</option>
      </select>
    </div>

    <!-- 如果是設定新值 -->
    <div v-if="adjustmentType === 'set'">
      <div class="mb-3">
        <label class="form-label">
          {{ stockType === 'both' ? '新的總庫存' : '新的庫存值' }}
        </label>
        <input v-model.number="newStock" type="number" class="form-control" min="0" required>
      </div>

      <!-- 如果是同時設定，還需要輸入可販售庫存 -->
      <div v-if="stockType === 'both'" class="mb-3">
        <label class="form-label">新的可販售庫存</label>
        <input v-model.number="newAvailableStock" type="number" class="form-control" min="0" :max="newStock" required>
        <div class="form-text">可販售庫存不能超過總庫存</div>
      </div>

      <!-- 顯示差異 -->
      <div v-if="newStock !== null" class="alert alert-info">
        <div v-if="stockType !== 'both'">
          現有{{ stockTypeLabel }}：{{ currentStock }}
          <br>
          新{{ stockTypeLabel }}：{{ newStock }}
          <br>
          <strong>差異：{{ stockDifference }}</strong>
          <span v-if="stockDifference > 0" class="text-success">（增加）</span>
          <span v-else-if="stockDifference < 0" class="text-danger">（減少）</span>
        </div>
        <div v-else>
          <div>總庫存差異：{{ totalStockDifference }}
            <span v-if="totalStockDifference > 0" class="text-success">（增加）</span>
            <span v-else-if="totalStockDifference < 0" class="text-danger">（減少）</span>
          </div>
          <div>可販售庫存差異：{{ availableStockDifference }}
            <span v-if="availableStockDifference > 0" class="text-success">（增加）</span>
            <span v-else-if="availableStockDifference < 0" class="text-danger">（減少）</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 如果是增加或減少 -->
    <div v-else class="mb-3">
      <label class="form-label">{{ adjustmentType === 'add' ? '增加數量' : '減少數量' }}</label>
      <input v-model.number="adjustmentQuantity" type="number" class="form-control" min="1" required>
    </div>

    <!-- 調整原因（可選） -->
    <div class="mb-3">
      <label class="form-label">調整原因（選填）</label>
      <textarea v-model="reason" class="form-control" rows="3" placeholder="例如：定期盤點、實際清點差異等"></textarea>
    </div>
  </BModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { BModal } from 'bootstrap-vue-next';
import api from '@/api';

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

const emit = defineEmits(['close', 'success']);

const isModalOpen = ref(true);
const adjustmentType = ref('set'); // set, add, reduce
const stockType = ref('totalStock'); // totalStock, availableStock, both
const newStock = ref(null);
const newAvailableStock = ref(null);
const adjustmentQuantity = ref(1);
const reason = ref('');
const isSubmitting = ref(false);

// 計算屬性
const currentStock = computed(() => {
  return stockType.value === 'availableStock' ? props.item.availableStock : props.item.totalStock;
});

const stockTypeLabel = computed(() => {
  return stockType.value === 'availableStock' ? '可販售庫存' : '總庫存';
});

const stockDifference = computed(() => {
  if (adjustmentType.value === 'set' && newStock.value !== null) {
    return newStock.value - currentStock.value;
  }
  return 0;
});

const totalStockDifference = computed(() => {
  if (adjustmentType.value === 'set' && stockType.value === 'both' && newStock.value !== null) {
    return newStock.value - props.item.totalStock;
  }
  return 0;
});

const availableStockDifference = computed(() => {
  if (adjustmentType.value === 'set' && stockType.value === 'both' && newAvailableStock.value !== null) {
    return newAvailableStock.value - props.item.availableStock;
  }
  return 0;
});

// 監聽調整類型變化
const handleTypeChange = () => {
  // 重置值
  newStock.value = null;
  newAvailableStock.value = null;
  adjustmentQuantity.value = 1;

  // 如果選擇設定新值，設定預設值為當前庫存
  if (adjustmentType.value === 'set') {
    newStock.value = currentStock.value;
    if (stockType.value === 'both') {
      newAvailableStock.value = props.item.availableStock;
    }
  }
};

// 監聽庫存類型變化
watch(stockType, () => {
  if (adjustmentType.value === 'set') {
    newStock.value = currentStock.value;
    if (stockType.value === 'both') {
      newAvailableStock.value = props.item.availableStock;
    }
  }
});

// 提交處理
const handleSubmit = async () => {
  if (isSubmitting.value) return;

  try {
    isSubmitting.value = true;

    if (adjustmentType.value === 'set') {
      // 設定新值
      const updateData = {
        stockType: stockType.value,
        stock: newStock.value,
        reason: reason.value || undefined
      };

      // 如果是同時設定，添加可販售庫存
      if (stockType.value === 'both') {
        updateData.availableStock = newAvailableStock.value;
      }

      await api.inventory.updateInventory({
        storeId: props.storeId,
        inventoryId: props.item._id,
        data: updateData
      });
    } else if (adjustmentType.value === 'add') {
      // 增加庫存
      await api.inventory.addStock({
        storeId: props.storeId,
        inventoryId: props.item._id,
        quantity: adjustmentQuantity.value,
        stockType: stockType.value,
        reason: reason.value || undefined
      });
    } else if (adjustmentType.value === 'reduce') {
      // 減少庫存
      await api.inventory.reduceStock({
        storeId: props.storeId,
        inventoryId: props.item._id,
        quantity: adjustmentQuantity.value,
        reason: reason.value || undefined
      });
    }

    emit('success');
    handleCancel();
  } catch (error) {
    console.error('庫存調整失敗:', error);
    alert(error.response?.data?.message || '庫存調整時發生錯誤');
  } finally {
    isSubmitting.value = false;
  }
};

const handleCancel = () => {
  isModalOpen.value = false;
  emit('close');
};

// 初始化
handleTypeChange();
</script>

<style scoped>
.form-text {
  font-size: 0.875rem;
  color: #6c757d;
}

.alert {
  margin-bottom: 0;
}
</style>
