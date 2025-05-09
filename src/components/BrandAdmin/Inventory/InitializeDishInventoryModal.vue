<template>
  <BModal :model-value="show" @update:model-value="emit('close')" size="lg" title="初始化餐點庫存"
    :ok-disabled="isSubmitting || selectedDishes.length === 0" @ok="submitInitialization" ok-title="初始化庫存"
    cancel-title="取消">
    <template #default>
      <!-- 搜尋餐點 -->
      <div class="mb-4">
        <input type="text" v-model="searchQuery" class="form-control" placeholder="搜尋餐點模板..."
          @input="searchDishTemplates">
      </div>

      <!-- 載入中提示 -->
      <div class="d-flex justify-content-center my-3" v-if="isSearching">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">搜尋中...</span>
        </div>
      </div>

      <!-- 餐點列表 -->
      <div v-if="!isSearching && dishTemplates.length > 0" class="mb-4">
        <div class="row g-3">
          <div v-for="dish in dishTemplates" :key="dish._id" class="col-md-6">
            <div class="card">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 class="card-title mb-1">{{ dish.name }}</h6>
                    <p class="text-muted small mb-2">基礎價格: ${{ dish.basePrice }}</p>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" :value="dish._id" v-model="selectedDishes"
                      :id="`dish-${dish._id}`">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 無搜尋結果 -->
      <div v-if="!isSearching && searchQuery && dishTemplates.length === 0" class="text-center text-muted my-4">
        沒有找到符合的餐點模板
      </div>

      <!-- 選中的餐點庫存設定 -->
      <div v-if="selectedDishes.length > 0" class="mt-4">
        <h6 class="mb-3">設定庫存初始值</h6>
        <div class="row g-3 mb-3">
          <div class="col-md-4">
            <label class="form-label">倉庫庫存</label>
            <input type="number" v-model.number="defaultSettings.warehouseStock" class="form-control" min="0">
          </div>
          <div class="col-md-4">
            <label class="form-label">可販售庫存</label>
            <input type="number" v-model.number="defaultSettings.availableStock" class="form-control" min="0">
          </div>
          <div class="col-md-4">
            <label class="form-label">最低警告值</label>
            <input type="number" v-model.number="defaultSettings.minStockAlert" class="form-control" min="0">
          </div>
        </div>

        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label">過高庫存警告</label>
            <input type="number" v-model.number="defaultSettings.maxStockAlert" class="form-control" min="0"
              placeholder="可選">
          </div>
          <div class="col-md-4">
            <label class="form-label">追蹤庫存</label>
            <select v-model="defaultSettings.isInventoryTracked" class="form-select">
              <option :value="true">追蹤</option>
              <option :value="false">不追蹤</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label">顯示給客人</label>
            <select v-model="defaultSettings.showAvailableStockToCustomer" class="form-select">
              <option :value="true">顯示</option>
              <option :value="false">不顯示</option>
            </select>
          </div>
        </div>

        <div class="mt-3">
          <button type="button" class="btn btn-sm btn-link text-decoration-none" @click="applyToAll">
            套用到所有選擇的餐點
          </button>
        </div>
      </div>

      <!-- 個別餐點設定 -->
      <div v-if="selectedDishes.length > 0" class="mt-4">
        <h6 class="mb-3">個別餐點設定</h6>
        <div>
          <div v-for="dishId in selectedDishes" :key="dishId" class="mb-3">
            <BCard :key="dishId" no-body>
              <BCardHeader class="p-0">
                <BButton variant="link"
                  class="w-100 text-start text-decoration-none d-flex justify-content-between align-items-center"
                  @click="toggleAccordion(dishId)">
                  <span>{{ getDishName(dishId) }}</span>
                  <i class="bi" :class="expandedItems[dishId] ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
                </BButton>
              </BCardHeader>
              <BCollapse :visible="expandedItems[dishId]">
                <BCardBody>
                  <div class="row g-3">
                    <div class="col-md-4">
                      <label class="form-label">倉庫庫存</label>
                      <input type="number" v-model.number="dishSettings[dishId].warehouseStock" class="form-control"
                        min="0">
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">可販售庫存</label>
                      <input type="number" v-model.number="dishSettings[dishId].availableStock" class="form-control"
                        min="0">
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">最低警告值</label>
                      <input type="number" v-model.number="dishSettings[dishId].minStockAlert" class="form-control"
                        min="0">
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">最高限制</label>
                      <input type="number" v-model.number="dishSettings[dishId].maxStockAlert" class="form-control"
                        min="0" placeholder="可選">
                    </div>
                    <div class="col-md-4">
                      <div class="form-check mt-4">
                        <input class="form-check-input" type="checkbox"
                          v-model="dishSettings[dishId].isInventoryTracked">
                        <label class="form-check-label">追蹤庫存</label>
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="form-check mt-4">
                        <input class="form-check-input" type="checkbox"
                          v-model="dishSettings[dishId].showAvailableStockToCustomer">
                        <label class="form-check-label">顯示給客人</label>
                      </div>
                    </div>
                  </div>
                </BCardBody>
              </BCollapse>
            </BCard>
          </div>
        </div>
      </div>

      <!-- 錯誤提示 -->
      <div v-if="error" class="alert alert-danger mt-3">
        {{ error }}
      </div>
    </template>

    <template #modal-footer>
      <BButton variant="secondary" @click="emit('close')">取消</BButton>
      <BButton variant="primary" :disabled="isSubmitting || selectedDishes.length === 0" @click="submitInitialization">
        <BSpinner small v-if="isSubmitting" class="me-1" />
        {{ isSubmitting ? '初始化中...' : '初始化庫存' }} ({{ selectedDishes.length }})
      </BButton>
    </template>
  </BModal>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { BModal, BButton, BSpinner, BCard, BCardHeader, BCardBody, BCollapse } from 'bootstrap-vue-next';
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
const isSearching = ref(false);
const isSubmitting = ref(false);
const error = ref('');
const searchQuery = ref('');
const dishTemplates = ref([]);
const selectedDishes = ref([]);
const dishSettings = ref({});
const expandedItems = ref({});

// 預設設定
const defaultSettings = reactive({
  warehouseStock: 0,
  availableStock: 0,
  minStockAlert: 5,
  maxStockAlert: null,
  isInventoryTracked: true,
  showAvailableStockToCustomer: false
});

// 切換 Accordion 開合狀態
const toggleAccordion = (dishId) => {
  expandedItems.value[dishId] = !expandedItems.value[dishId];
};

// 搜尋餐點模板
let searchTimeout = null;
const searchDishTemplates = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    isSearching.value = true;
    error.value = '';

    try {
      const response = await api.dish.getAllDishTemplates({
        brandId: props.brandId,
        query: searchQuery.value
      });

      if (response && response.templates) {
        dishTemplates.value = response.templates;
      }
    } catch (err) {
      console.error('搜尋餐點模板失敗:', err);
      error.value = '搜尋餐點失敗';
    } finally {
      isSearching.value = false;
    }
  }, 300);
};

// 獲取餐點名稱
const getDishName = (dishId) => {
  const dish = dishTemplates.value.find(d => d._id === dishId);
  return dish ? dish.name : '未知餐點';
};

// 套用到所有選擇的餐點
const applyToAll = () => {
  selectedDishes.value.forEach(dishId => {
    dishSettings.value[dishId] = { ...defaultSettings };
  });
};

// 監聽選擇的餐點變化
watch(selectedDishes, (newValue, oldValue) => {
  // 新增的餐點
  newValue.forEach(dishId => {
    if (!dishSettings.value[dishId]) {
      dishSettings.value[dishId] = { ...defaultSettings };
      expandedItems.value[dishId] = false;
    }
  });

  // 移除的餐點
  oldValue.forEach(dishId => {
    if (!newValue.includes(dishId)) {
      delete dishSettings.value[dishId];
      delete expandedItems.value[dishId];
    }
  });
});

// 提交初始化
const submitInitialization = async () => {
  if (selectedDishes.value.length === 0) {
    error.value = '請選擇至少一個餐點';
    return;
  }

  isSubmitting.value = true;
  error.value = '';

  try {
    const createPromises = selectedDishes.value.map(dishId => {
      const dish = dishTemplates.value.find(d => d._id === dishId);
      const settings = dishSettings.value[dishId];

      const inventoryData = {
        inventoryType: 'dish',
        dishId: dishId,
        itemName: dish.name,
        initialWarehouseStock: settings.warehouseStock,
        initialAvailableStock: settings.availableStock,
        minStockAlert: settings.minStockAlert,
        maxStockAlert: settings.maxStockAlert,
        isInventoryTracked: settings.isInventoryTracked,
        showAvailableStockToCustomer: settings.showAvailableStockToCustomer
      };

      return api.inventory.createInventory({
        storeId: props.storeId,
        data: inventoryData
      });
    });

    await Promise.all(createPromises);
    emit('success');
    emit('close');
  } catch (err) {
    console.error('初始化庫存失敗:', err);
    error.value = err.response?.data?.message || '初始化庫存時發生錯誤';
  } finally {
    isSubmitting.value = false;
  }
};

// 生命週期
onMounted(() => {
  searchDishTemplates();
});
</script>

<style scoped>
.card-title {
  font-size: 0.95rem;
  margin-bottom: 0;
}
</style>
