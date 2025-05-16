<template>
  <div class="dish-detail-view">
    <!-- 頂部返回導航 -->
    <BNavbar toggleable="lg" type="dark" variant="dark" class="fixed-top">
      <BButton variant="link" class="text-white p-0 me-3" @click="$router.back()">
        <i class="bi bi-arrow-left fs-4"></i>
      </BButton>
      <BNavbarBrand class="me-auto">{{ dish?.name || '商品詳情' }}</BNavbarBrand>
      <BNavItem to="/cart" :active="false" class="ms-auto">
        <BButton variant="outline-light" class="position-relative">
          <i class="bi bi-cart"></i>
          <Bbadge v-if="itemCount > 0" variant="danger" pill class="position-absolute top-0 start-100 translate-middle">
            {{ itemCount }}
          </Bbadge>
        </BButton>
      </BNavItem>
    </BNavbar>

    <!-- 載入狀態 -->
    <div v-if="isLoading" class="loading-container d-flex justify-content-center align-items-center">
      <div class="text-center">
        <BSpinner variant="primary" label="載入中..."></BSpinner>
        <p class="mt-3">載入商品資訊...</p>
      </div>
    </div>

    <!-- 錯誤訊息 -->
    <div v-else-if="error" class="error-container mt-5 text-center">
      <i class="bi bi-exclamation-triangle text-warning display-1"></i>
      <p class="mt-3">{{ error }}</p>
      <BButton variant="primary" @click="$router.back()">返回菜單</BButton>
    </div>

    <!-- 商品詳情內容 -->
    <template v-else-if="dish">
      <!-- 商品圖片 -->
      <div class="dish-image-container">
        <img :src="dish.image?.url" :alt="dish.name" class="dish-image" :onerror="defaultImageHandler">
      </div>

      <!-- 商品基本信息 -->
      <div class="container mt-3">
        <h1 class="dish-name">{{ dish.name }}</h1>

        <div class="dish-price mb-3">{{ formattedPrice }}</div>

        <div v-if="dish.description" class="dish-description mb-3">
          {{ dish.description }}
        </div>

        <div v-if="dish.tags && dish.tags.length > 0" class="dish-tags mb-3">
          <span v-for="(tag, index) in dish.tags" :key="index" class="dish-tag">
            {{ tag }}
          </span>
        </div>

        <hr>

        <!-- 選項類別 -->
        <div v-if="optionCategories && optionCategories.length > 0" class="option-categories mt-4">
          <OptionSelector v-for="category in optionCategories" :key="category._id" :category="category"
            :options="getOptionsForCategory(category._id)" v-model="selectedOptions[category._id]" />
        </div>

        <div v-else class="no-options text-center py-3 mt-3">
          <p class="text-muted mb-0">此商品無需選擇選項</p>
        </div>

        <!-- 數量選擇 -->
        <div class="quantity-selector mt-4">
          <h5>數量</h5>
          <div class="d-flex align-items-center">
            <BButton variant="outline-secondary" size="sm" @click="decreaseQuantity" :disabled="quantity <= 1">
              <i class="bi bi-dash"></i>
            </BButton>
            <span class="mx-3 fs-5">{{ quantity }}</span>
            <BButton variant="outline-secondary" size="sm" @click="increaseQuantity">
              <i class="bi bi-plus"></i>
            </BButton>
          </div>
        </div>

        <!-- 備註 -->
        <div class="special-instructions mt-4">
          <h5>特殊要求</h5>
          <BFormTextarea v-model="specialInstructions" rows="2" placeholder="如有特殊要求，請在此處說明" maxlength="200">
          </BFormTextarea>
          <small class="text-muted">{{ specialInstructions.length }}/200</small>
        </div>
      </div>

      <!-- 底部固定添加到購物車按鈕 -->
      <div class="add-to-cart-container">
        <div class="container">
          <div class="d-flex justify-content-between align-items-center">
            <div class="total-price">
              總計: <span class="fw-bold">{{ formattedTotalPrice }}</span>
            </div>
            <BButton variant="primary" size="lg" class="add-to-cart-btn" @click="addToCart">
              加入購物車
            </BButton>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useCartStore } from '@/stores/cart';
import OptionSelector from '@/components/customer/dishDetail/OptionSelector.vue';
import api from '@/api';

// 路由相關
const router = useRouter();
const route = useRoute();

// 從路由參數中獲取數據
const brandId = computed(() => route.params.brandId);
const storeId = computed(() => route.params.storeId);
const dishId = computed(() => route.params.dishId);

// 購物車 store
const cartStore = useCartStore();
const { itemCount } = storeToRefs(cartStore);

// 狀態變數
const isLoading = ref(true);
const dish = ref(null);
const error = ref(null);
const optionCategories = ref([]);
const categoryOptions = ref({});  // 存儲每個類別的選項
const selectedOptions = reactive({});  // 存儲用戶選擇
const quantity = ref(1);
const specialInstructions = ref('');

// 處理圖片載入失敗
const defaultImageHandler = "this.onerror=null; this.src='data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22100%22%20height%3D%22100%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%20preserveAspectRatio%3D%22none%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23eee%22%3E%3C%2Frect%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-size%3D%2214%22%20text-anchor%3D%22middle%22%20alignment-baseline%3D%22middle%22%20font-family%3D%22sans-serif%22%20fill%3D%22%23aaa%22%3E%E6%9A%AB%E7%84%A1%E5%9C%96%E7%89%87%3C%2Ftext%3E%3C%2Fsvg%3E';";

// 計算屬性
const formattedPrice = computed(() => {
  if (!dish.value) return '$0';
  return `$${dish.value.basePrice.toLocaleString('zh-TW')}`;
});

const formattedTotalPrice = computed(() => {
  if (!dish.value) return '$0';

  // 基本價格
  let total = dish.value.basePrice;

  // 加上選項價格
  Object.keys(selectedOptions).forEach(categoryId => {
    const selections = Array.isArray(selectedOptions[categoryId])
      ? selectedOptions[categoryId]
      : [selectedOptions[categoryId]].filter(Boolean);

    selections.forEach(optionId => {
      const option = findOptionById(optionId);
      if (option) {
        total += option.price || 0;
      }
    });
  });

  // 乘以數量
  total *= quantity.value;

  return `$${total.toLocaleString('zh-TW')}`;
});

// 方法
const findOptionById = (optionId) => {
  for (const categoryId in categoryOptions.value) {
    const option = categoryOptions.value[categoryId].find(opt => opt._id === optionId);
    if (option) return option;
  }
  return null;
};

// 載入餐點數據和選項
const loadDishData = async () => {
  if (!brandId.value || !storeId.value || !dishId.value) {
    error.value = '無效的請求參數';
    isLoading.value = false;
    return;
  }

  try {
    // 設置購物車品牌和店鋪
    cartStore.setBrandAndStore(brandId.value, storeId.value);

    // 獲取餐點詳情
    const dishResponse = await api.dish.getDishTemplateById({
      brandId: brandId.value,
      id: dishId.value
    });

    if (dishResponse && dishResponse.template) {
      dish.value = dishResponse.template;

      // 獲取選項類別詳情
      if (dish.value.optionCategories && dish.value.optionCategories.length > 0) {
        await loadOptionCategories();
      }
    } else {
      error.value = '找不到該商品';
    }
  } catch (err) {
    console.error('獲取商品數據失敗', err);
    error.value = '獲取商品數據失敗，請稍後再試';
  } finally {
    isLoading.value = false;
  }
};

// 載入選項類別和選項
const loadOptionCategories = async () => {
  try {
    const categoriesPromises = dish.value.optionCategories.map(async (cat) => {
      return api.dish.getOptionCategoryById({
        brandId: brandId.value,
        id: cat.categoryId,
        includeOptions: true
      });
    });

    const results = await Promise.all(categoriesPromises);

    // 處理選項類別
    const categories = [];
    results.forEach(result => {
      if (result && result.category) {
        categories.push(result.category);

        // 初始化選項選擇狀態
        if (result.category.inputType === 'single') {
          selectedOptions[result.category._id] = '';
        } else {
          selectedOptions[result.category._id] = [];
        }

        // 保存該類別下的選項
        if (result.options) {
          categoryOptions.value[result.category._id] = result.options;
        }
      }
    });

    // 按照原始餐點中的順序排序類別
    const categoryOrder = dish.value.optionCategories.reduce((order, cat, index) => {
      order[cat.categoryId] = index;
      return order;
    }, {});

    optionCategories.value = categories.sort((a, b) => {
      return categoryOrder[a._id] - categoryOrder[b._id];
    });
  } catch (err) {
    console.error('載入選項類別失敗', err);
  }
};

// 獲取特定類別的選項
const getOptionsForCategory = (categoryId) => {
  return categoryOptions.value[categoryId] || [];
};

// 增加數量
const increaseQuantity = () => {
  quantity.value++;
};

// 減少數量
const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--;
  }
};

// 添加到購物車
const addToCart = () => {
  if (!dish.value) return;

  // 準備選項數據
  const selectedOptionsList = [];

  Object.keys(selectedOptions).forEach(categoryId => {
    const category = optionCategories.value.find(cat => cat._id === categoryId);

    if (category) {
      const selections = Array.isArray(selectedOptions[categoryId])
        ? selectedOptions[categoryId]
        : [selectedOptions[categoryId]].filter(Boolean);

      selections.forEach(optionId => {
        const option = findOptionById(optionId);
        if (option) {
          selectedOptionsList.push({
            _id: option._id,
            name: option.name,
            price: option.price || 0
          });
        }
      });
    }
  });

  // 創建餐點實例
  const dishInstance = {
    _id: dish.value._id,
    name: dish.value.name,
    basePrice: dish.value.basePrice,
    specialInstructions: specialInstructions.value
  };

  // 添加到購物車
  cartStore.addItem(dishInstance, quantity.value, selectedOptionsList);

  // 提示成功
  alert('已成功加入購物車');

  // 返回菜單頁面
  router.back();
};

// 生命週期鉤子
onMounted(() => {
  loadDishData();
});
</script>

<style scoped>
.dish-detail-view {
  padding-top: 56px;
  /* 頂部導航欄高度 */
  padding-bottom: 80px;
  /* 底部購物車按鈕高度 */
}

.loading-container,
.error-container {
  min-height: calc(100vh - 56px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.dish-image-container {
  width: 100%;
  height: 250px;
  overflow: hidden;
  position: relative;
}

.dish-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dish-name {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.dish-price {
  font-size: 1.5rem;
  font-weight: 600;
  color: #e74c3c;
}

.dish-description {
  font-size: 0.95rem;
  color: #666;
  white-space: pre-line;
}

.dish-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.dish-tag {
  display: inline-block;
  font-size: 0.8rem;
  background-color: #f1f1f1;
  color: #666;
  padding: 4px 8px;
  border-radius: 4px;
}

.add-to-cart-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  padding: 16px 0;
  z-index: 1000;
}

.total-price {
  font-size: 1.1rem;
}

.total-price span {
  color: #e74c3c;
  font-size: 1.3rem;
}

.add-to-cart-btn {
  min-width: 140px;
}
</style>
