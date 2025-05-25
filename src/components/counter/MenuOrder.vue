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
      <!-- 上半部：菜單選擇區域 -->
      <div class="col-12 menu-section p-3">
        <div v-for="category in menuCategories" :key="category._id" class="mb-4">
          <h5 class="category-title mb-3" :style="{ borderBottomColor: themeColor }">{{ category.name }}</h5>
          <div class="menu-items-grid">
            <div v-for="dish in category.dishes" :key="dish._id" class="menu-item-card"
              @click="selectDish(dish.dishTemplate)">
              <div class="card h-100">
                <div class="card-body">
                  <h6 class="card-title">{{ dish.dishTemplate.name }}</h6>
                  <p class="card-text price">${{ dish.price || dish.dishTemplate.basePrice }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按鈕 -->
        <div class="d-flex justify-content-between mt-4">
          <button class="btn btn-outline-secondary" @click="cancelSelection">
            取消
          </button>
          <button class="btn" :class="buttonClass" @click="addToCart">
            {{ buttonText }}
          </button>
        </div>
      </div>

      <!-- 下半部：選項設定區域 -->
      <div class="col-12 options-section bg-light p-3" v-if="selectedDish">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5>{{ selectedDish.name }} - 選項設定</h5>
          <div class="d-flex align-items-center">
            <span class="text-danger fs-5 me-2">${{ currentPrice }}</span>
            <button class="btn btn-secondary btn-sm" @click="cancelSelection">
              <i class="bi bi-x"></i>
            </button>
          </div>
        </div>

        <!-- 選項類別 -->
        <div v-for="optionCategory in dishOptionCategories" :key="optionCategory._id" class="mb-4">
          <h6 class="option-category-title mb-3" :style="{ borderLeftColor: themeColor }">{{ optionCategory.name }}</h6>

          <!-- 單選類型 -->
          <div v-if="optionCategory.inputType === 'single'" class="row g-2">
            <div v-for="option in optionCategory.options" :key="option._id" class="col-4 col-md-2">
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
            <div v-for="option in optionCategory.options" :key="option._id" class="col-4 col-md-2">
              <div class="card p-2 text-center option-card"
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
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

// 計算屬性 - 根據主題動態設定樣式
const headerClass = computed(() => `bg-${props.themeClass}`);
const spinnerClass = computed(() => `text-${props.themeClass}`);
const buttonClass = computed(() => `btn-${props.themeClass}`);

// 計算按鈕文字
const buttonText = computed(() => {
  const isEditing = counterStore.currentItem && counterStore.currentItemIndex !== null;
  return isEditing ? `更新餐點 - ${currentPrice.value}` : `加入購物車 - ${currentPrice.value}`;
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

const selectDish = (dishTemplate) => {
  // 設置選中的餐點和預設選項
  selectedDish.value = dishTemplate;
  selectedOptions.value = {};

  // 為單選類型的選項類別預設選擇第一個選項
  if (dishTemplate.optionCategories && dishTemplate.optionCategories.length > 0) {
    dishTemplate.optionCategories.forEach(categoryRef => {
      const category = counterStore.optionCategories.find(cat =>
        cat._id === categoryRef.categoryId
      );

      if (category && category.inputType === 'single' && category.options && category.options.length > 0) {
        const firstOption = category.options[0];
        const optionId = getOptionId(firstOption);
        selectedOptions.value[category._id] = [optionId];
      }
    });
  }

  // 直接加入購物車（使用預設選項）
  addToCartDirectly();
};

// 直接加入購物車的函數（用於上半部點擊）
const addToCartDirectly = () => {
  if (!selectedDish.value) return;

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

  // 添加到購物車
  counterStore.addDishToCart(selectedDish.value, options, '');
};

const selectOption = (category, option, inputType) => {
  const categoryId = category._id;
  const optionId = getOptionId(option);

  if (inputType === 'single') {
    // 單選：替換選中的選項
    selectedOptions.value[categoryId] = [optionId];
  } else {
    // 多選：切換選項
    if (!selectedOptions.value[categoryId]) {
      selectedOptions.value[categoryId] = [];
    }

    const index = selectedOptions.value[categoryId].indexOf(optionId);
    if (index > -1) {
      selectedOptions.value[categoryId].splice(index, 1);
    } else {
      selectedOptions.value[categoryId].push(optionId);
    }
  }

  // 下半部選項變更時，不直接加入購物車，只更新價格顯示
};

const isOptionSelected = (categoryId, optionId) => {
  const isSelected = selectedOptions.value[categoryId]?.includes(optionId) || false;

  // 調試信息
  if (counterStore.currentItem) {
    console.log(`檢查選項: 類別${categoryId}, 選項${optionId}, 結果:${isSelected}`);
    console.log('當前 selectedOptions:', selectedOptions.value);
    console.log('該類別的選項:', selectedOptions.value[categoryId]);
  }

  return isSelected;
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

const addToCart = () => {
  if (!selectedDish.value) return;

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

  // 檢查是否為編輯模式
  if (counterStore.currentItem && counterStore.currentItemIndex !== null) {
    // 編輯模式：更新現有項目
    const updatedItem = {
      ...counterStore.currentItem,
      dishInstance: {
        ...counterStore.currentItem.dishInstance,
        options: options,
        finalPrice: currentPrice.value
      },
      subtotal: currentPrice.value * counterStore.currentItem.quantity
    };
    counterStore.updateCurrentItem(updatedItem);
  } else {
    // 新增模式：添加到購物車
    counterStore.addDishToCart(selectedDish.value, options, '');
  }

  // 清空選擇
  cancelSelection();
};

const cancelSelection = () => {
  selectedDish.value = null;
  selectedOptions.value = {};

  // 清空編輯狀態
  counterStore.clearCurrentItem();
};

// 生命周期
onMounted(async () => {
  if (!counterStore.menuData) {
    await loadMenuData();
  }
});

// 監聽編輯模式
watch([() => counterStore.currentItem, () => counterStore.optionCategories], ([currentItem, optionCategories]) => {
  if (currentItem && currentItem.dishInstance && optionCategories.length > 0) {
    console.log('=== 編輯模式觸發 ===');
    console.log('currentItem:', currentItem);
    console.log('dishInstance:', currentItem.dishInstance);
    console.log('options:', currentItem.dishInstance.options);

    // 進入編輯模式
    const template = counterStore.getDishTemplate(currentItem.dishInstance.templateId);
    console.log('找到的模板:', template);

    if (template) {
      selectedDish.value = template;

      // 先清空再重新設置，確保響應式更新
      selectedOptions.value = {};

      // 等待下一個 tick 再設置選項，確保響應式系統正確處理
      setTimeout(() => {
        const newSelectedOptions = {};

        // 恢復原有的選項配置到 selectedOptions
        if (currentItem.dishInstance.options) {
          currentItem.dishInstance.options.forEach(optionCategory => {
            console.log('處理選項類別:', optionCategory);
            console.log('類別ID:', optionCategory.optionCategoryId);
            console.log('選項:', optionCategory.selections);

            newSelectedOptions[optionCategory.optionCategoryId] =
              optionCategory.selections.map(selection => {
                console.log('選項ID:', selection.optionId);
                return selection.optionId;
              });
          });
        }

        selectedOptions.value = newSelectedOptions;
        console.log('最終設置的 selectedOptions:', selectedOptions.value);
        console.log('=== 編輯模式設置完成 ===');
      }, 0);
    }
  }
}, { immediate: true });
</script>

<style scoped>
.component-header {
  position: sticky;
  top: 0;
  z-index: 100;
}

.menu-section {
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
