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

    <div v-if="!isLoading && !errorMessage" class="row g-0">
      <!-- 菜單選擇區域 -->
      <div class="col-12" :class="menuSectionClass">
        <div class="p-3">
          <div v-for="category in menuCategories" :key="category._id" class="mb-4">
            <h5 class="category-title mb-3" :style="{ borderBottomColor: themeColor }">{{ category.name }}</h5>
            <div class="menu-items-grid">
              <div v-for="dish in category.dishes" :key="dish._id" class="menu-item-card"
                @click="quickSelectDish(dish.dishTemplate)">
                <div class="card h-100">
                  <div class="card-body">
                    <h6 class="card-title">{{ dish.dishTemplate.name }}</h6>
                    <p class="card-text price">${{ dish.price || dish.dishTemplate.basePrice }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 選項設定區域 - 只在編輯模式時顯示 -->
      <div v-if="counterStore.isEditMode && selectedDish" class="col-12 options-section bg-light p-3">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5>{{ selectedDish.name }} - 選項設定</h5>
          <div class="d-flex align-items-center">
            <span class="text-danger fs-5 me-2">${{ currentPrice }}</span>
          </div>
        </div>

        <!-- 選項類別 -->
        <div v-for="optionCategory in dishOptionCategories" :key="optionCategory._id" class="mb-4">
          <h6 class="option-category-title mb-3" :style="{ borderLeftColor: themeColor }">{{ optionCategory.name }}</h6>

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
        <div class="mb-3">
          <label class="form-label">備註</label>
          <textarea class="form-control" rows="2" v-model="itemNote" @input="updateItemRealtime"
            placeholder="請輸入特殊需求或備註...">
          </textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useCounterStore } from '@/stores/counter';

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

// 方法
const loadMenuData = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    await counterStore.fetchMenuData(props.brandId, props.storeId);
  } catch (error) {
    console.error('載入菜單資料失敗:', error);
    errorMessage.value = error.message || '載入菜單資料失敗';
  } finally {
    isLoading.value = false;
  }
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
</script>

<style scoped>
.component-header {
  position: sticky;
  top: 0;
  z-index: 100;
}

.menu-section-full {
  height: 100vh;
  overflow-y: auto;
}

.menu-section-edit {
  height: 50vh;
  overflow-y: auto;
  border-bottom: 1px solid #dee2e6;
}

.options-section {
  height: 50vh;
  overflow-y: auto;
}

.category-title {
  color: #495057;
  border-bottom: 2px solid;
  padding-bottom: 0.5rem;
}

.menu-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.menu-item-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.menu-item-card:hover {
  transform: translateY(-3px);
}

.card-img-top {
  height: 150px;
  object-fit: cover;
}

.price {
  color: #dc3545;
  font-weight: bold;
  font-size: 1.1rem;
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
</style>
