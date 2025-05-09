<template>
  <BModal :model-value="show" @update:model-value="emit('close')" title="調整庫存" @ok="submitAdjustment"
    :ok-disabled="isSubmitting" ok-title="確認調整" cancel-title="取消" no-close-on-backdrop>
    <template #default>
      <div v-if="item">
        <h6 class="mb-3">{{ item.itemName }}</h6>

        <!-- 調整類型選擇 -->
        <div class="mb-3">
          <label class="form-label">調整類型</label>
          <select v-model="adjustForm.type" class="form-select" @change="resetForm">
            <option value="add">增加庫存</option>
            <option value="subtract">減少庫存</option>
            <option value="transfer">轉移到可販售</option>
            <option value="damage">損耗處理</option>
            <option value="settings">修改設定</option>
          </select>
        </div>

        <!-- 當前庫存顯示 -->
        <div class="row g-3 mb-3">
          <div class="col-6">
            <div class="bg-light p-3 rounded">
              <small class="text-muted">當前總庫存</small>
              <h5 class="mb-0">{{ item.totalStock || 0 }}</h5>
            </div>
          </div>
          <div class="col-6">
            <div class="bg-light p-3 rounded">
              <small class="text-muted">當前可販售庫存</small>
              <h5 class="mb-0">{{ item.availableStock || 0 }}</h5>
              <small class="text-muted" v-if="!item.enableAvailableStock">（未啟用）</small>
            </div>
          </div>
        </div>

        <!-- 增加/減少庫存 -->
        <div v-if="adjustForm.type === 'add' || adjustForm.type === 'subtract'">
          <div class="mb-3">
            <label class="form-label">選擇庫存類型</label>
            <select v-model="adjustForm.stockType" class="form-select">
              <option value="totalStock">總庫存</option>
              <option value="availableStock" :disabled="!item.enableAvailableStock">可販售庫存</option>
            </select>
          </div>

          <div class="mb-3">
            <label class="form-label">{{ adjustForm.type === 'add' ? '增加' : '減少' }}數量</label>
            <input type="number" v-model.number="adjustForm.quantity" class="form-control" min="1"
              :max="adjustForm.type === 'subtract' ? item[adjustForm.stockType] : undefined">
            <div class="form-text text-muted" v-if="adjustForm.type === 'subtract'">
              最多可減少: {{ item[adjustForm.stockType] }}
            </div>
          </div>
        </div>

        <!-- 轉移數量 -->
        <div v-if="adjustForm.type === 'transfer'" class="mb-3">
          <div class="alert alert-info mb-3">
            <i class="bi bi-info-circle me-1"></i>
            將總庫存轉移到可販售庫存
          </div>
          <label class="form-label">轉移數量</label>
          <input type="number" v-model.number="adjustForm.transferQuantity" class="form-control" min="1"
            :max="Math.max(0, item.totalStock - item.availableStock)" :disabled="!item.enableAvailableStock">
          <div class="form-text text-muted">
            {{ item.enableAvailableStock ? `最多可轉移: ${Math.max(0, item.totalStock - item.availableStock)}` :
              '請先啟用可販售庫存功能' }}
          </div>
        </div>

        <!-- 損耗處理 -->
        <div v-if="adjustForm.type === 'damage'">
          <div class="mb-3">
            <label class="form-label">損耗來源</label>
            <select v-model="adjustForm.damageFrom" class="form-select">
              <option value="totalStock">總庫存</option>
              <option value="availableStock" :disabled="!item.enableAvailableStock">可販售庫存</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">損耗數量</label>
            <input type="number" v-model.number="adjustForm.damageQuantity" class="form-control" min="1"
              :max="getDamageMaxQuantity()">
            <div class="form-text text-muted">
              最多可處理: {{ getDamageMaxQuantity() }}
            </div>
          </div>
        </div>

        <!-- 庫存設定 -->
        <div v-if="adjustForm.type === 'settings'">
          <div class="mb-3">
            <label class="form-label">最低庫存警告值</label>
            <input type="number" v-model.number="adjustForm.minStockAlert" class="form-control" min="0">
          </div>

          <div class="mb-3">
            <label class="form-label">庫存補貨目標</label>
            <input type="number" v-model.number="adjustForm.targetStockLevel" class="form-control" min="0">
            <div class="form-text">留空表示無設定</div>
          </div>

          <div class="mb-3">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" v-model="adjustForm.isInventoryTracked"
                id="isInventoryTracked" @change="confirmInventoryTracking">
              <label class="form-check-label" for="isInventoryTracked">
                追蹤庫存 (自動扣除)
              </label>
            </div>
          </div>

          <div class="mb-3">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" v-model="adjustForm.enableAvailableStock"
                id="enableAvailableStock" @change="confirmAvailableStock">
              <label class="form-check-label" for="enableAvailableStock">
                啟用可販售庫存 (每日限量)
              </label>
            </div>
          </div>
        </div>

        <!-- 原因輸入 -->
        <div class="mb-3">
          <label class="form-label">調整原因</label>
          <textarea v-model="adjustForm.reason" class="form-control" rows="2" required
            :placeholder="getReasonPlaceholder()"></textarea>
        </div>

        <!-- 錯誤提示 -->
        <div v-if="error" class="alert alert-danger">
          {{ error }}
        </div>
      </div>
    </template>

    <template #modal-footer>
      <BButton variant="secondary" @click="emit('close')">取消</BButton>
      <BButton variant="primary" :disabled="isSubmitting" @click="submitAdjustment">
        <BSpinner small v-if="isSubmitting" class="me-1" />
        {{ isSubmitting ? '處理中...' : '確認調整' }}
      </BButton>
    </template>
  </BModal>

  <!-- 確認啟用/關閉庫存追蹤 Modal -->
  <BModal v-model="showInventoryTrackingConfirm" title="確認變更" @ok="confirmInventoryTrackingChange"
    @cancel="cancelInventoryTrackingChange">
    <p v-if="adjustForm.isInventoryTracked">
      確定要啟用庫存追蹤嗎？啟用後，訂單確認時將自動扣除庫存。
    </p>
    <p v-else>
      確定要關閉庫存追蹤嗎？關閉後，訂單將不會自動扣除庫存。
    </p>
  </BModal>

  <!-- 確認啟用/關閉可販售庫存 Modal -->
  <BModal v-model="showAvailableStockConfirm" title="確認變更" @ok="confirmAvailableStockChange"
    @cancel="cancelAvailableStockChange">
    <p v-if="adjustForm.enableAvailableStock">
      確定要啟用可販售庫存功能嗎？啟用後可以設定每日限量販售。
    </p>
    <p v-else>
      確定要關閉可販售庫存功能嗎？關閉後將不再顯示可販售數量。
    </p>
  </BModal>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { BModal, BButton, BSpinner } from 'bootstrap-vue-next';
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

// 控制 Modal 顯示
const show = ref(true);

// 狀態
const isSubmitting = ref(false);
const error = ref('');

// 確認 Modal
const showInventoryTrackingConfirm = ref(false);
const showAvailableStockConfirm = ref(false);
const tempInventoryTracked = ref(false);
const tempEnableAvailableStock = ref(false);

// 調整表單
const adjustForm = ref({
  type: 'add',
  stockType: 'totalStock',
  quantity: 1,
  transferQuantity: 1,
  damageFrom: 'totalStock',
  damageQuantity: 1,
  minStockAlert: 0,
  targetStockLevel: null,
  isInventoryTracked: false,
  enableAvailableStock: false,
  reason: ''
});

// 初始化表單值
const initForm = () => {
  if (props.item) {
    adjustForm.value.minStockAlert = props.item.minStockAlert || 0;
    adjustForm.value.targetStockLevel = props.item.targetStockLevel;
    adjustForm.value.isInventoryTracked = props.item.isInventoryTracked || false;
    adjustForm.value.enableAvailableStock = props.item.enableAvailableStock || false;
  }
};

// 重置表單
const resetForm = () => {
  adjustForm.value.reason = '';
  adjustForm.value.quantity = 1;
  adjustForm.value.transferQuantity = 1;
  adjustForm.value.damageQuantity = 1;
  adjustForm.value.stockType = 'totalStock';
  adjustForm.value.damageFrom = 'totalStock';
  initForm();
};

// 獲取損耗最大數量
const getDamageMaxQuantity = () => {
  if (!props.item) return 0;
  return props.item[adjustForm.value.damageFrom] || 0;
};

// 獲取原因占位符
const getReasonPlaceholder = () => {
  switch (adjustForm.value.type) {
    case 'add':
      return '例：進貨、補貨';
    case 'subtract':
      return '例：盤點差異、過期';
    case 'transfer':
      return '例：移至前台銷售';
    case 'damage':
      return '例：破損、過期';
    case 'settings':
      return '例：調整庫存管理設定';
    default:
      return '請輸入調整原因';
  }
};

// 確認庫存追蹤變更
const confirmInventoryTracking = () => {
  tempInventoryTracked.value = adjustForm.value.isInventoryTracked;
  showInventoryTrackingConfirm.value = true;
};

const confirmInventoryTrackingChange = () => {
  showInventoryTrackingConfirm.value = false;
};

const cancelInventoryTrackingChange = () => {
  adjustForm.value.isInventoryTracked = !adjustForm.value.isInventoryTracked;
  showInventoryTrackingConfirm.value = false;
};

// 確認可販售庫存變更
const confirmAvailableStock = () => {
  tempEnableAvailableStock.value = adjustForm.value.enableAvailableStock;
  showAvailableStockConfirm.value = true;
};

const confirmAvailableStockChange = () => {
  showAvailableStockConfirm.value = false;
};

const cancelAvailableStockChange = () => {
  adjustForm.value.enableAvailableStock = !adjustForm.value.enableAvailableStock;
  showAvailableStockConfirm.value = false;
};

// 提交調整
const submitAdjustment = async (evt) => {
  evt.preventDefault();

  if (!props.item || !adjustForm.value.reason.trim()) {
    error.value = '請填寫調整原因';
    return;
  }

  isSubmitting.value = true;
  error.value = '';

  try {
    const itemId = props.item._id;
    const inventoryType = props.item.inventoryType || 'DishTemplate';

    switch (adjustForm.value.type) {
      case 'add':
        await api.inventory.addStock({
          storeId: props.storeId,
          itemId,
          quantity: adjustForm.value.quantity,
          reason: adjustForm.value.reason,
          stockType: adjustForm.value.stockType,
          inventoryType
        });
        break;

      case 'subtract':
        // 使用手動減少，而不是訂單消耗
        await api.inventory.updateInventory({
          storeId: props.storeId,
          itemId,
          data: {
            inventoryType,
            stockType: adjustForm.value.stockType,
            changeAmount: -adjustForm.value.quantity,
            reason: adjustForm.value.reason
          }
        });
        break;

      case 'transfer':
        await api.inventory.transferStock({
          storeId: props.storeId,
          itemId,
          quantity: adjustForm.value.transferQuantity,
          reason: adjustForm.value.reason,
          inventoryType
        });
        break;

      case 'damage':
        await api.inventory.processDamage({
          storeId: props.storeId,
          itemId,
          quantity: adjustForm.value.damageQuantity,
          reason: adjustForm.value.reason,
          stockType: adjustForm.value.damageFrom,
          inventoryType
        });
        break;

      case 'settings':
        await api.inventory.updateInventory({
          storeId: props.storeId,
          itemId,
          data: {
            inventoryType,
            minStockAlert: adjustForm.value.minStockAlert,
            targetStockLevel: adjustForm.value.targetStockLevel || undefined,
            isInventoryTracked: adjustForm.value.isInventoryTracked,
            enableAvailableStock: adjustForm.value.enableAvailableStock,
            reason: adjustForm.value.reason
          }
        });
        break;
    }

    emit('success');
    emit('close');
  } catch (err) {
    console.error('調整庫存失敗:', err);
    error.value = err.response?.data?.message || '調整庫存時發生錯誤';
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
});
</script>
