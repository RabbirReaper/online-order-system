<template>
  <div class="container-fluid p-0">
    <div class="component-header text-white p-3" :class="headerClass">
      <h4>{{ title }}</h4>
    </div>

    <!-- 加載提示 -->
    <div v-if="isLoading" class="d-flex justify-content-center align-items-center py-5">
      <div class="spinner-border" :class="spinnerClass" role="status">
        <span class="visually-hidden">載入中...</span>
      </div>
      <span class="ms-2">載入菜單資料中...</span>
    </div>

    <!-- 錯誤提示 -->
    <div v-if="errorMessage" class="alert alert-danger m-3" role="alert">
      {{ errorMessage }}
      <button class="btn btn-outline-danger btn-sm ms-2" @click="loadMenuData">重試</button>
    </div>

    <div v-if="!isLoading && !errorMessage" class="main-content">
      <!-- 左側類別導航欄 -->
      <div class="category-sidebar">
        <div class="category-nav">
          <div v-for="category in menuCategories" :key="category._id" class="category-nav-item"
            :class="{ 'active': selectedCategoryId === category._id }" @click="selectCategory(category._id)">
            <div class="category-nav-content">
              <div class="category-name">{{ category.name }}</div>
              <div class="category-count">{{ category.dishes.length }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右側內容區域 -->
      <div class="content-area">
        <div class="row g-0 h-100">
          <!-- 菜單選擇區域 -->
          <div class="col-12" :class="menuSectionClass">
            <div class="p-2">
              <!-- 顯示選中類別的餐點 -->
              <div v-if="selectedCategory" class="mb-3">
                <h5 class="category-title mb-3" :style="{ borderBottomColor: themeColor }">
                  {{ selectedCategory.name }}
                </h5>
                <div class="menu-items-grid">
                  <div v-for="dish in selectedCategory.dishes" :key="dish._id" class="menu-item-card" :class="{
                    'selected-dish': selectedDish && selectedDish._id === dish.dishTemplate._id,
                    'sold-out': isDishSoldOut(dish.dishTemplate._id)
                  }" @click="handleDishClick(dish.dishTemplate)">
                    <div class="card h-100">
                      <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                          <h6 class="card-title mb-0">{{ dish.dishTemplate.name }}</h6>
                          <!-- 庫存狀態顯示 -->
                          <div v-if="getInventoryInfo(dish.dishTemplate._id)" class="inventory-badge">
                            <span v-if="getInventoryInfo(dish.dishTemplate._id).enableAvailableStock" class="badge"
                              :class="getStockBadgeClass(dish.dishTemplate._id)">
                              {{ getInventoryInfo(dish.dishTemplate._id).availableStock }}
                            </span>
                          </div>
                        </div>
                        <p class="card-text price">${{ dish.price || dish.dishTemplate.basePrice }}</p>
                        <!-- 售完遮罩 -->
                        <div v-if="isDishSoldOut(dish.dishTemplate._id)" class="sold-out-overlay">
                          <span class="sold-out-text">售完</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <!-- 當沒有選中類別時的提示 -->
              <div v-else class="text-center py-4">
                <p class="text-muted">請從左側選擇餐點類別</p>
              </div>
            </div>
          </div>

          <!-- 選項設定區域 - 只在編輯模式時顯示 -->
          <div v-if="counterStore.isEditMode && selectedDish" class="col-12 options-section p-2">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h5 class="mb-0 fs-6 fw-semibold">{{ selectedDish.name }} - 選項設定</h5>
              <div class="d-flex align-items-center">
                <span class="text-danger fw-semibold">${{ currentPrice }}</span>
              </div>
            </div>

            <!-- 選項類別 -->
            <div v-for="optionCategory in dishOptionCategories" :key="optionCategory._id" class="mb-3">
              <h6 class="option-category-title mb-3" :style="{ borderLeftColor: themeColor }">{{ optionCategory.name }}
              </h6>

              <!-- 單選類型 -->
              <div v-if="optionCategory.inputType === 'single'" class="row g-2">
                <div v-for="option in optionCategory.options" :key="option._id" class="col-auto">
                  <div class="card p-2 text-center option-card"
                    :class="{ 'selected': isOptionSelected(optionCategory._id, getOptionId(option)) }"
                    @click="selectOption(optionCategory, option, 'single')">
                    <div class="card-body p-1">
                      <p class="fw-bold mb-0">{{ getOptionName(option) }}</p>
                      <small v-if="getOptionPrice(option) > 0" class="text-muted">+${{ getOptionPrice(option) }}</small>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 多選類型 -->
              <div v-else class="row g-2">
                <div v-for="option in optionCategory.options" :key="option._id" class="col-auto">
                  <div class="card p-2 text-center option-card h-100"
                    :class="{ 'selected': isOptionSelected(optionCategory._id, getOptionId(option)) }"
                    @click="selectOption(optionCategory, option, 'multiple')">
                    <div class="card-body p-1">
                      <p class="fw-bold mb-0">{{ getOptionName(option) }}</p>
                      <small v-if="getOptionPrice(option) > 0" class="text-muted">+${{ getOptionPrice(option) }}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 備註輸入 -->
            <div class="mb-2">
              <label class="form-label fs-7 fw-medium text-muted">備註</label>
              <textarea class="form-control form-control-sm" rows="2" v-model="itemNote" @input="updateItemRealtime"
                placeholder="請輸入特殊需求或備註...">
              </textarea>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useCounterStore } from '@/stores/counter';
import api from '@/api';

const props = defineProps({
  brandId: {
    type: String,
    required: true
  },
  storeId: {
    type: String,
    required: true
  },
  orderType: {
    type: String,
    required: true,
    validator: (value) => ['dine_in', 'takeout'].includes(value)
  },
  title: {
    type: String,
    required: true
  },
  themeColor: {
    type: String,
    default: '#007bff'
  },
  themeClass: {
    type: String,
    default: 'primary'
  }
});

// 使用 Pinia store
const counterStore = useCounterStore();

// 本地狀態
const isLoading = ref(false);
const errorMessage = ref('');
const selectedDish = ref(null);
const selectedOptions = ref({}); // { categoryId: [optionIds] }
const itemNote = ref('');
const selectedCategoryId = ref(null); // 新增：選中的類別ID
const inventoryData = ref({}); // 庫存資料 { dishTemplateId: inventoryInfo }
const isLoadingInventory = ref(false);

// 計算屬性 - 根據主題動態設定樣式
const headerClass = computed(() => `bg-${props.themeClass}`);
const spinnerClass = computed(() => `text-${props.themeClass}`);

// 動態調整菜單區域高度
const menuSectionClass = computed(() => {
  return counterStore.isEditMode ? 'menu-section-edit' : 'menu-section-full';
});

const menuCategories = computed(() => {
  return counterStore.menuData?.categories || [];
});

// 新增：選中的類別
const selectedCategory = computed(() => {
  if (!selectedCategoryId.value) return null;
  return menuCategories.value.find(cat => cat._id === selectedCategoryId.value);
});

const dishOptionCategories = computed(() => {
  if (!selectedDish.value) return [];

  const categories = [];
  selectedDish.value.optionCategories.forEach(categoryRef => {
    const category = counterStore.optionCategories.find(cat =>
      cat._id === categoryRef.categoryId
    );
    if (category) {
      categories.push({
        ...category,
        order: categoryRef.order
      });
    }
  });

  return categories.sort((a, b) => a.order - b.order);
});

const currentPrice = computed(() => {
  if (!selectedDish.value) return 0;

  let price = selectedDish.value.basePrice;

  // 加上選項價格
  Object.values(selectedOptions.value).forEach(optionIds => {
    if (Array.isArray(optionIds)) {
      optionIds.forEach(optionId => {
        const option = findOptionById(optionId);
        if (option) {
          price += getOptionPrice(option);
        }
      });
    }
  });

  return price;
});

// 統一的選項資料存取方法
const getOptionId = (option) => {
  return option.refOption ? option.refOption._id : option._id;
};

const getOptionName = (option) => {
  return option.refOption ? option.refOption.name : option.name;
};

const getOptionPrice = (option) => {
  return option.refOption ? (option.refOption.price || 0) : (option.price || 0);
};

// 庫存相關方法
const getInventoryInfo = (dishTemplateId) => {
  return inventoryData.value[dishTemplateId] || null;
};

const isDishSoldOut = (dishTemplateId) => {
  const inventory = getInventoryInfo(dishTemplateId);
  if (!inventory) return false;

  // 如果啟用了可用庫存機制，檢查可用庫存是否為 0
  if (inventory.enableAvailableStock) {
    return inventory.availableStock <= 0;
  }

  // 檢查是否手動設為售完
  return inventory.isSoldOut;
};

const getStockBadgeClass = (dishTemplateId) => {
  const inventory = getInventoryInfo(dishTemplateId);
  if (!inventory || !inventory.enableAvailableStock) return '';

  if (inventory.availableStock <= 0) {
    return 'bg-danger text-white';
  } else if (inventory.availableStock <= 5) {
    return 'bg-warning text-dark';
  } else {
    return 'bg-success text-white';
  }
};

// 載入庫存資料
const loadInventoryData = async () => {
  if (!props.brandId || !props.storeId || !menuCategories.value.length) return;

  isLoadingInventory.value = true;

  try {
    // 獲取店鋪所有餐點庫存
    const response = await api.inventory.getStoreInventory({
      brandId: props.brandId,
      storeId: props.storeId,
      inventoryType: 'DishTemplate'
    });

    if (response.success) {
      const inventoryMap = {};

      // 將庫存資料按餐點模板 ID 建立對應關係
      response.inventory.forEach(item => {
        if (item.dish && item.dish._id) {
          inventoryMap[item.dish._id] = {
            inventoryId: item._id,
            enableAvailableStock: item.enableAvailableStock,
            availableStock: item.availableStock,
            totalStock: item.totalStock,
            isSoldOut: item.isSoldOut,
            isInventoryTracked: item.isInventoryTracked
          };
        }
      });

      inventoryData.value = inventoryMap;
    }
  } catch (error) {
    console.error('載入庫存資料失敗:', error);
  } finally {
    isLoadingInventory.value = false;
  }
};

// 方法
const loadMenuData = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    await counterStore.fetchMenuData(props.brandId, props.storeId);
    // 載入完成後自動選擇第一個類別
    if (menuCategories.value.length > 0) {
      selectedCategoryId.value = menuCategories.value[0]._id;
    }
    // 載入庫存資料
    await loadInventoryData();
  } catch (error) {
    console.error('載入菜單資料失敗:', error);
    errorMessage.value = error.message || '載入菜單資料失敗';
  } finally {
    isLoading.value = false;
  }
};

// 新增：選擇類別
const selectCategory = (categoryId) => {
  selectedCategoryId.value = categoryId;
};

// 處理餐點點擊
const handleDishClick = (dishTemplate) => {
  // 檢查餐點是否售完
  if (isDishSoldOut(dishTemplate._id)) {
    // 可以顯示提示訊息
    // alert('此餐點目前售完，無法點選');
    return;
  }

  // 原來的快速選擇邏輯
  quickSelectDish(dishTemplate);
};

// 快速選擇餐點（加入購物車並進入編輯模式）
const quickSelectDish = (dishTemplate) => {
  // 先加入購物車
  counterStore.quickAddDishToCart(dishTemplate);

  // 找到剛加入的項目（最後一個）
  const lastIndex = counterStore.cart.length - 1;
  const lastItem = counterStore.cart[lastIndex];

  // 立即進入編輯模式
  counterStore.selectCurrentItem(lastItem, lastIndex);
};

// 選擇選項
const selectOption = (category, option, inputType) => {
  const categoryId = category._id;
  const optionId = getOptionId(option);

  // 確保該類別的選項陣列存在
  if (!selectedOptions.value[categoryId]) {
    selectedOptions.value[categoryId] = [];
  }

  if (inputType === 'single') {
    // 單選：替換選中的選項
    selectedOptions.value[categoryId] = [optionId];
  } else {
    // 多選：切換選項
    const currentOptions = [...selectedOptions.value[categoryId]];
    const index = currentOptions.indexOf(optionId);

    if (index > -1) {
      currentOptions.splice(index, 1);
    } else {
      currentOptions.push(optionId);
    }

    selectedOptions.value[categoryId] = currentOptions;
  }

  // 即時更新購物車
  updateItemRealtime();
};

const isOptionSelected = (categoryId, optionId) => {
  const categoryOptions = selectedOptions.value[categoryId];
  return Array.isArray(categoryOptions) && categoryOptions.includes(optionId);
};

const findOptionById = (optionId) => {
  for (const category of counterStore.optionCategories) {
    if (category.options) {
      const option = category.options.find(opt => getOptionId(opt) === optionId);
      if (option) return option;
    }
  }
  return null;
};

// 即時更新購物車項目
const updateItemRealtime = () => {
  if (!counterStore.isEditMode) return;

  // 構建選項資料
  const options = [];
  Object.entries(selectedOptions.value).forEach(([categoryId, optionIds]) => {
    if (optionIds.length > 0) {
      const category = counterStore.optionCategories.find(cat => cat._id === categoryId);
      if (category) {
        const selections = optionIds.map(optionId => {
          const option = category.options?.find(opt => getOptionId(opt) === optionId);
          return option ? {
            optionId: getOptionId(option),
            name: getOptionName(option),
            price: getOptionPrice(option)
          } : null;
        }).filter(Boolean);

        if (selections.length > 0) {
          options.push({
            optionCategoryId: categoryId,
            optionCategoryName: category.name,
            selections: selections
          });
        }
      }
    }
  });

  // 即時更新購物車
  counterStore.updateCartItemRealtime(options, itemNote.value);
};

// 設置編輯模式的選項
const setupEditMode = async (currentItem) => {
  if (!currentItem || !currentItem.dishInstance) return;

  // 找到對應的餐點模板
  const template = counterStore.getDishTemplate(currentItem.dishInstance.templateId);

  if (!template) {
    console.error('找不到餐點模板:', currentItem.dishInstance.templateId);
    return;
  }

  // 設置選中的餐點
  selectedDish.value = template;

  // 設置備註
  itemNote.value = currentItem.note || '';

  // 等待下一個 tick 確保響應式系統準備好
  await nextTick();

  // 重建選項狀態
  const newSelectedOptions = {};

  if (currentItem.dishInstance.options) {
    currentItem.dishInstance.options.forEach(optionCategory => {

      const optionIds = optionCategory.selections.map(selection => {
        return selection.optionId;
      });

      newSelectedOptions[optionCategory.optionCategoryId] = optionIds;
    });
  }

  // 設置選項狀態
  selectedOptions.value = newSelectedOptions;

};

// 生命周期
onMounted(async () => {
  if (!counterStore.menuData) {
    await loadMenuData();
  } else if (menuCategories.value.length > 0) {
    // 如果菜單資料已存在，自動選擇第一個類別
    selectedCategoryId.value = menuCategories.value[0]._id;
    // 載入庫存資料
    await loadInventoryData();
  }
});

// 監聽編輯模式
watch(
  [() => counterStore.currentItem, () => counterStore.isEditMode, () => counterStore.optionCategories],
  async ([currentItem, isEditMode, optionCategories]) => {
    if (isEditMode && currentItem && currentItem.dishInstance && optionCategories.length > 0) {
      await setupEditMode(currentItem);
    } else if (!isEditMode) {
      // 退出編輯模式時清空狀態
      selectedDish.value = null;
      selectedOptions.value = {};
      itemNote.value = '';
    }
  },
  { immediate: true }
);

// 監聽菜單類別變化，自動選擇第一個類別
watch(
  menuCategories,
  (newCategories) => {
    if (newCategories.length > 0 && !selectedCategoryId.value) {
      selectedCategoryId.value = newCategories[0]._id;
    }
  },
  { immediate: true }
);

// 監聽菜單變化，載入庫存資料
watch(
  menuCategories,
  async (newCategories) => {
    if (newCategories.length > 0) {
      await loadInventoryData();
    }
  }
);
</script>

<style scoped>
.component-header {
  position: sticky;
  top: 0;
  z-index: 100;
}

.main-content {
  display: flex;
  height: calc(100vh - 60px);
  /* 減去header高度 */
}

/* 左側類別導航欄樣式 */
.category-sidebar {
  width: 180px;
  min-width: 180px;
  background-color: #ffffff;
  border-right: 1px solid #f1f3f4;
  overflow-y: auto;
}

.category-nav {
  padding: 0.5rem 0;
}

.category-nav-item {
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: all 0.15s ease;
  margin: 0 0.5rem;
  border-radius: 6px;
}

.category-nav-item:hover {
  background-color: #f8f9fa;
}

.category-nav-item.active {
  background-color: #f0f7ff;
  color: #1976d2;
  border: 1px solid #e3f2fd;
}

.category-nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.category-name {
  font-weight: 500;
  font-size: 0.875rem;
  line-height: 1.2;
  flex: 1;
}

.category-count {
  font-size: 0.75rem;
  color: #6b7280;
  background-color: #f3f4f6;
  padding: 0.125rem 0.375rem;
  border-radius: 10px;
  min-width: 24px;
  text-align: center;
}

.category-nav-item.active .category-count {
  background-color: #e3f2fd;
  color: #1976d2;
}

/* 右側內容區域 */
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.menu-section-full {
  height: 100%;
  overflow-y: auto;
}

.menu-section-edit {
  height: 50%;
  overflow-y: auto;
  border-bottom: 1px solid #dee2e6;
}

.options-section {
  height: 50%;
  overflow-y: auto;
}

.category-title {
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
  font-size: 1rem;
  font-weight: 600;
}

.menu-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.75rem;
}

.menu-item-card {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  position: relative;
}

.menu-item-card:not(.sold-out):hover {
  transform: translateY(-1px);
}

.menu-item-card .card {
  border: 1px solid #1b5a7a;
  border-radius: 8px;
  box-shadow: none;
  transition: all 0.15s ease;
  position: relative;
}

.menu-item-card:not(.sold-out):hover .card {
  border-color: #b89e5c;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.menu-item-card.selected-dish .card {
  border-color: #f97316;
  border-width: 2px;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
  background-color: #fff7ed;
}

/* 售完狀態樣式 */
.menu-item-card.sold-out {
  cursor: not-allowed;
}

.menu-item-card.sold-out .card {
  opacity: 0.6;
  border-color: #dc3545;
  background-color: #f8f9fa;
}

.menu-item-card .card-body {
  padding: 0.75rem;
}

.menu-item-card .card-title {
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
  color: #111827;
  line-height: 1.3;
}

.card-img-top {
  height: 120px;
  object-fit: cover;
  border-radius: 8px 8px 0 0;
}

.price {
  color: #dc2626;
  font-weight: 600;
  font-size: 0.875rem;
  margin: 0;
}

/* 庫存相關樣式 */
.inventory-badge {
  position: relative;
  z-index: 1;
}

.inventory-badge .badge {
  font-size: 0.65rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-weight: 600;
  min-width: 24px;
  text-align: center;
}

/* 售完遮罩 */
.sold-out-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  z-index: 2;
}

.sold-out-text {
  color: white;
  font-weight: bold;
  font-size: 1.1rem;
  background-color: #dc3545;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.option-category-title {
  color: #6c757d;
  border-left: 4px solid;
  padding-left: 0.5rem;
}

.option-card {
  cursor: pointer;
  transition: all 0.2s;
  border-width: 2px;
  min-width: 80px;
}

.option-card:hover {
  background-color: #f8f9fa;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.option-card.selected {
  background-color: var(--bs-blue-100, #e3f2fd);
  border-color: var(--bs-blue-500, #2196f3);
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
}

/* 響應式設計 */
@media (max-width: 768px) {
  .category-sidebar {
    width: 150px;
    min-width: 150px;
  }

  .category-name {
    font-size: 0.8rem;
  }

  .menu-items-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 0.5rem;
  }

  .menu-item-card .card-body {
    padding: 0.5rem;
  }
}

@media (max-width: 576px) {
  .main-content {
    flex-direction: column;
  }

  .category-sidebar {
    width: 100%;
    height: 60px;
    border-right: none;
    border-bottom: 1px solid #f1f3f4;
  }

  .category-nav {
    display: flex;
    overflow-x: auto;
    padding: 0.25rem 0.5rem;
    gap: 0.25rem;
  }

  .category-nav-item {
    white-space: nowrap;
    min-width: 100px;
    margin: 0;
    border-radius: 20px;
    padding: 0.375rem 0.75rem;
  }

  .category-nav-content {
    flex-direction: column;
    gap: 0;
  }

  .category-name {
    font-size: 0.75rem;
  }

  .category-count {
    font-size: 0.7rem;
    padding: 0.125rem 0.25rem;
  }

  .content-area {
    height: calc(100vh - 120px);
  }

  .menu-items-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
}
</style>
