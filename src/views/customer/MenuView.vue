<template>
  <div class="menu-view">
    <div class="container-wrapper">
      <!-- 店鋪標題區 -->
      <Transition name="fade-slide" appear>
        <MenuHeader v-if="!isLoadingStore || store.name" :store-name="store.name" :store-image="store.image"
          :announcements="store.announcements" :business-hours="store.businessHours"
          :is-logged-in="authStore.isLoggedIn" :customer-name="authStore.userName" :store-address="store.address"
          @login="handleLogin" @logout="handleLogout" />
      </Transition>

      <!-- 骨架載入動畫 -->
      <div v-if="isLoadingStore && !store.name" class="header-skeleton">
        <div class="skeleton-banner"></div>
        <div class="skeleton-title"></div>
        <div class="skeleton-subtitle"></div>
      </div>

      <!-- 菜單類型切換按鈕 -->
      <div class="menu-type-selector bg-white border-bottom">
        <div class="container px-3 py-2">
          <div class="btn-group w-100" role="group">
            <button type="button" class="btn menu-type-btn"
              :class="currentMenuType === 'food' ? 'btn-primary' : 'btn-outline-primary'"
              @click="switchMenuType('food')">
              <i class="bi bi-cup-hot me-2"></i>
              餐點菜單
            </button>
            <button type="button" class="btn menu-type-btn"
              :class="currentMenuType === 'cash_coupon' ? 'btn-primary' : 'btn-outline-primary'"
              @click="switchMenuType('cash_coupon')">
              <i class="bi bi-ticket-perforated me-2"></i>
              預購券
            </button>
            <button type="button" class="btn menu-type-btn"
              :class="currentMenuType === 'point_exchange' ? 'btn-primary' : 'btn-outline-primary'"
              @click="switchMenuType('point_exchange')">
              <i class="bi bi-gift me-2"></i>
              點數兌換
            </button>
          </div>
        </div>
      </div>

      <!-- 類別導航器 -->
      <Transition name="fade-slide" appear>
        <CategoryNavigator v-if="hasMenuCategories" :categories="navigationCategories" />
      </Transition>

      <!-- 載入狀態 -->
      <div v-if="isLoadingMenu" class="loading-container text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">載入菜單中...</span>
        </div>
        <p class="mt-3 text-muted">載入{{ getMenuTypeText(currentMenuType) }}中...</p>
      </div>

      <!-- 菜單列表骨架動畫 -->
      <div v-else-if="isLoadingStore" class="menu-skeleton">
        <div v-for="i in 3" :key="i" class="category-skeleton">
          <div class="skeleton-category-title"></div>
          <div class="items-skeleton">
            <div v-for="j in 4" :key="j" class="item-skeleton">
              <div class="skeleton-image"></div>
              <div class="skeleton-content">
                <div class="skeleton-name"></div>
                <div class="skeleton-description"></div>
                <div class="skeleton-price"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 錯誤狀態 -->
      <div v-else-if="menuError" class="error-container text-center py-5">
        <div class="alert alert-danger mx-3">
          <i class="bi bi-exclamation-triangle me-2"></i>
          {{ menuError }}
          <button class="btn btn-outline-danger btn-sm ms-3" @click="loadMenuData">
            重新載入
          </button>
        </div>
      </div>

      <!-- 菜單列表 -->
      <TransitionGroup name="stagger-fade" tag="div" appear>
        <MenuCategoryList v-if="!isLoadingMenu && !menuError && hasMenuCategories" key="menu-list"
          :categories="currentMenu.categories" :brand-id="brandId" :store-id="storeId" :menu-type="currentMenuType"
          @select-item="handleItemSelect" class="menu-content" />
      </TransitionGroup>

      <!-- 空狀態 -->
      <div v-if="!isLoadingMenu && !menuError && !hasMenuCategories" class="text-center py-5">
        <i class="bi bi-journal-x display-1 text-muted"></i>
        <h5 class="mt-3 text-muted">目前沒有可用的{{ getMenuTypeText(currentMenuType) }}</h5>
        <p class="text-muted">請稍後再試或聯繫店家</p>
      </div>

      <!-- 購物車按鈕 -->
      <Transition name="slide-up" appear>
        <div v-if="hasCartItems" class="position-fixed bottom-0 start-50 translate-middle-x mb-4"
          style="z-index: 1030; width: 100%; max-width: 540px;">
          <div class="container-fluid px-3">
            <button class="btn btn-primary rounded-pill shadow-lg px-4 py-2 w-100 cart-button" @click="goToCart">
              <i class="bi bi-cart-fill me-2"></i>
              {{ cartItemCount }} 項商品 - ${{ cartTotal }}
            </button>
          </div>
        </div>
      </Transition>

      <!-- 頁尾 -->
      <footer>
        <div class="text-center text-muted py-3">
          &copy; {{ new Date().getFullYear() }} Rabbir Company. All rights reserved.
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/api';
import MenuHeader from '@/components/customer/menu/MenuHeader.vue';
import CategoryNavigator from '@/components/customer/menu/CategoryNavigator.vue';
import MenuCategoryList from '@/components/customer/menu/MenuCategoryList.vue';
import { useCartStore } from '@/stores/cart';
import { useAuthStore } from '@/stores/customerAuth';

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();
const authStore = useAuthStore();

// 路由參數
const brandId = computed(() => route.params.brandId);
const storeId = computed(() => route.params.storeId);

// 響應式資料
const store = ref({
  name: '',
  image: null,
  announcements: [],
  businessHours: null,
  address: ''
});

const currentMenuType = ref('food'); // 預設顯示餐點菜單
const currentMenu = ref({ categories: [] });
const isLoadingStore = ref(true);
const isLoadingMenu = ref(false);
const menuError = ref(null);

// 計算屬性
const hasMenuCategories = computed(() => {
  return currentMenu.value.categories && currentMenu.value.categories.length > 0;
});

const navigationCategories = computed(() => {
  if (!hasMenuCategories.value) return [];

  return currentMenu.value.categories.map(category => ({
    categoryName: category.name,
    categoryId: category._id,
    description: category.description,
    order: category.order || 0
  })).sort((a, b) => a.order - b.order);
});

const hasCartItems = computed(() => {
  return cartStore.itemCount > 0;
});

const cartItemCount = computed(() => {
  return cartStore.itemCount;
});

const cartTotal = computed(() => {
  return cartStore.total;
});

// 方法
const getMenuTypeText = (type) => {
  const typeMap = {
    'food': '餐點菜單',
    'cash_coupon': '預購券',
    'point_exchange': '點數兌換'
  };
  return typeMap[type] || type;
};

const switchMenuType = async (type) => {
  if (currentMenuType.value === type || isLoadingMenu.value) return;

  currentMenuType.value = type;
  await loadMenuData();
};

const loadStoreData = async () => {
  try {
    const storeData = await api.store.getStoreById({
      brandId: brandId.value,
      id: storeId.value
    });

    if (storeData && storeData.success) {
      await new Promise(resolve => setTimeout(resolve, 100));
      store.value = storeData.store;
    } else {
      console.error('無效的店鋪數據或 API 呼叫失敗:', storeData);
    }
  } catch (error) {
    console.error('無法載入店鋪數據:', error);
  }
};

const loadMenuData = async () => {
  if (!brandId.value || !storeId.value) {
    menuError.value = '缺少必要的店鋪資訊';
    return;
  }

  isLoadingMenu.value = true;
  menuError.value = null;

  try {
    // 獲取指定類型的啟用菜單
    const response = await api.menu.getAllStoreMenus({
      brandId: brandId.value,
      storeId: storeId.value,
      includeUnpublished: false,
      activeOnly: true,
      menuType: currentMenuType.value
    });

    if (response.success && response.menus && response.menus.length > 0) {
      // 取第一個啟用的菜單（同類型應該只有一個啟用）
      currentMenu.value = response.menus[0];

      // 確保分類按順序排列
      if (currentMenu.value.categories) {
        currentMenu.value.categories.sort((a, b) => (a.order || 0) - (b.order || 0));

        // 確保每個分類的商品按順序排列
        currentMenu.value.categories.forEach(category => {
          if (category.items) {
            category.items.sort((a, b) => (a.order || 0) - (b.order || 0));
          }
        });
      }
    } else {
      currentMenu.value = { categories: [] };
      console.warn(`沒有找到啟用的${getMenuTypeText(currentMenuType.value)}`);
    }
  } catch (err) {
    console.error('載入菜單資料失敗:', err);
    menuError.value = err.response?.data?.message || err.message || '載入菜單失敗，請稍後再試';
    currentMenu.value = { categories: [] };
  } finally {
    isLoadingMenu.value = false;
  }
};

// 處理項目選擇
const handleItemSelect = (item) => {
  // 根據商品類型導航到不同的詳情頁面
  if (item.itemType === 'dish' && item.dishTemplate) {
    router.push({
      name: 'dish-detail',
      params: {
        brandId: brandId.value,
        storeId: storeId.value,
        dishId: item.dishTemplate._id
      }
    });
  } else if (item.itemType === 'bundle' && item.bundle) {
    router.push({
      name: 'bundle-detail',
      params: {
        brandId: brandId.value,
        storeId: storeId.value,
        bundleId: item.bundle._id
      }
    });
  } else {
    console.error('無效的項目類型或缺少必要資料:', item);
  }
};

// 登入相關方法 - 直接使用 authStore 方法
const handleLogin = () => {
  router.push({ name: 'customer-login' });
};

const handleLogout = async () => {
  try {
    await authStore.logout();
  } catch (error) {
    console.error('登出失敗:', error);
    alert('登出失敗: ' + error.message);
  }
};

// 購物車相關方法
const goToCart = () => {
  router.push({ name: 'cart' });
};

// 監聽 brandId 變化，確保 authStore 有正確的 brandId
watch(() => brandId.value, (newBrandId) => {
  if (newBrandId) {
    authStore.setBrandId(newBrandId);
  }
}, { immediate: true });

// 生命周期
onMounted(async () => {
  // 設置購物車的品牌和店鋪ID
  cartStore.setBrandAndStore(brandId.value, storeId.value);

  // 設置 authStore 的 brandId 並檢查登入狀態
  if (brandId.value) {
    authStore.setBrandId(brandId.value);

    // 檢查並更新登入狀態
    try {
      await authStore.checkAuthStatus();
    } catch (error) {
      console.error('檢查登入狀態失敗:', error);
    }
  }

  // 載入數據
  await loadStoreData();
  isLoadingStore.value = false;
  await loadMenuData();
});
</script>

<style scoped>
.menu-view {
  min-height: 100vh;
  background-color: #f8f9fa;
  padding-bottom: 80px;
  display: flex;
  justify-content: center;
}

.container-wrapper {
  max-width: 736px;
  width: 100%;
  background-color: #fff;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  min-height: 100vh;
  position: relative;
}

/* 菜單類型切換器樣式 */
.menu-type-selector {
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.menu-type-btn {
  font-weight: 500;
  border-radius: 0;
  transition: all 0.3s ease;
}

.menu-type-btn:first-child {
  border-top-left-radius: 0.375rem;
  border-bottom-left-radius: 0.375rem;
}

.menu-type-btn:last-child {
  border-top-right-radius: 0.375rem;
  border-bottom-right-radius: 0.375rem;
}

.btn-primary {
  background-color: #d35400;
  border-color: #d35400;
}

.btn-primary:hover {
  background-color: #e67e22;
  border-color: #e67e22;
}

.btn-outline-primary {
  color: #d35400;
  border-color: #d35400;
}

.btn-outline-primary:hover {
  background-color: #d35400;
  border-color: #d35400;
  color: white;
}

/* ===== 動畫效果 ===== */

/* 淡入滑動動畫 */
.fade-slide-enter-active {
  transition: all 0.6s ease-out;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-enter-to {
  opacity: 1;
  transform: translateY(0);
}

/* 錯開淡入動畫 */
.stagger-fade-enter-active {
  transition: all 0.8s ease-out;
}

.stagger-fade-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.stagger-fade-enter-to {
  opacity: 1;
  transform: translateY(0);
}

/* 滑入動畫 */
.slide-up-enter-active {
  transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(100px);
}

.slide-up-enter-to {
  opacity: 1;
  transform: translateY(0);
}

/* ===== 骨架載入動畫 ===== */

@keyframes shimmer {
  0% {
    background-position: -468px 0;
  }

  100% {
    background-position: 468px 0;
  }
}

/* 基礎骨架樣式 */
.skeleton-banner,
.skeleton-title,
.skeleton-subtitle,
.skeleton-category-title,
.skeleton-image,
.skeleton-name,
.skeleton-description,
.skeleton-price {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 400% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}

/* Header 骨架 */
.header-skeleton {
  padding: 20px;
  margin-bottom: 20px;
}

.skeleton-banner {
  height: 180px;
  width: 100%;
  margin-bottom: 16px;
  border-radius: 12px;
}

.skeleton-title {
  height: 32px;
  width: 60%;
  margin-bottom: 12px;
}

.skeleton-subtitle {
  height: 20px;
  width: 40%;
}

/* 菜單骨架 */
.menu-skeleton {
  padding: 20px;
}

.category-skeleton {
  margin-bottom: 32px;
}

.skeleton-category-title {
  height: 28px;
  width: 50%;
  margin-bottom: 16px;
}

.items-skeleton {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.item-skeleton {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  background-color: #fafafa;
}

.skeleton-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  flex-shrink: 0;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-name {
  height: 20px;
  width: 70%;
}

.skeleton-description {
  height: 16px;
  width: 90%;
}

.skeleton-price {
  height: 18px;
  width: 30%;
}

/* ===== 購物車按鈕動畫 ===== */
.cart-button {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.cart-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 123, 255, 0.3) !important;
}

.cart-button:active {
  transform: translateY(0);
}

/* 載入容器 */
.loading-container,
.error-container {
  min-height: 30vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* ===== 響應式設計 ===== */
@media (max-width: 768px) {
  .menu-type-btn {
    font-size: 0.9rem;
    padding: 0.6rem 0.5rem;
  }

  .menu-type-btn i {
    font-size: 0.8rem;
  }
}

@media (max-width: 576px) {
  .container-wrapper {
    max-width: 100%;
  }

  .skeleton-image {
    width: 60px;
    height: 60px;
  }

  .item-skeleton {
    padding: 12px;
  }

  .menu-type-btn {
    font-size: 0.8rem;
    padding: 0.5rem 0.25rem;
  }

  .menu-type-btn .me-2 {
    margin-right: 0.25rem !important;
  }
}

/* ===== 平滑圖片載入 ===== */
:deep(.menu-item-image) {
  transition: opacity 0.3s ease;
}

:deep(.menu-item-image[data-loading]) {
  opacity: 0.5;
}

:deep(.menu-item-image[data-loaded]) {
  opacity: 1;
}
</style>
