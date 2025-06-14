<template>
  <div class="menu-view">
    <div class="container-wrapper">
      <!-- 店鋪標題區 -->
      <Transition name="fade-slide" appear>
        <MenuHeader v-if="!isLoading || store.name" :store-name="store.name" :store-image="store.image"
          :announcements="store.announcements" :business-hours="store.businessHours" :is-logged-in="isLoggedIn"
          :customer-name="customerName" :store-address="store.address" @login="handleLogin" @logout="handleLogout" />
      </Transition>

      <!-- 骨架載入動畫 -->
      <div v-if="isLoading && !store.name" class="header-skeleton">
        <div class="skeleton-banner"></div>
        <div class="skeleton-title"></div>
        <div class="skeleton-subtitle"></div>
      </div>

      <!-- 類別導航器 -->
      <Transition name="fade-slide" appear>
        <CategoryNavigator v-if="hasMenuCategories" :categories="navigationCategories" />
      </Transition>

      <!-- 菜單列表骨架動畫 -->
      <div v-if="isLoading" class="menu-skeleton">
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

      <!-- 菜單列表 -->
      <TransitionGroup name="stagger-fade" tag="div" appear>
        <MenuCategoryList v-if="!isLoading && hasMenuCategories" key="menu-list" :categories="menu.categories"
          :brand-id="brandId" :store-id="storeId" @select-item="handleItemSelect" class="menu-content" />
      </TransitionGroup>

      <!-- 空狀態 -->
      <div v-if="!isLoading && !hasMenuCategories" class="text-center py-5">
        <i class="bi bi-journal-x display-1 text-muted"></i>
        <p class="text-muted mt-3">店鋪尚未設定菜單</p>
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
import { ref, onMounted, computed } from 'vue';
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
const menu = ref({
  categories: []
});
const isLoading = ref(true);
const isLoggedIn = ref(false);
const customerName = ref('');

// 計算屬性
const hasMenuCategories = computed(() => {
  return menu.value.categories && menu.value.categories.length > 0;
});

const navigationCategories = computed(() => {
  if (!hasMenuCategories.value) return [];

  return menu.value.categories.map(category => ({
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
  try {
    const menuData = await api.menu.getStoreMenu({
      brandId: brandId.value,
      storeId: storeId.value,
      includeUnpublished: false
    });

    if (menuData.success && menuData.menu) {
      // 檢查菜單是否存在
      if (menuData.menu.exists === false) {
        console.warn('店鋪尚未設定菜單');
        menu.value = { categories: [] };
        return;
      }

      // 使用後端回傳的完整菜單資料
      menu.value = menuData.menu;

      // 確保分類按順序排列
      if (menu.value.categories) {
        menu.value.categories.sort((a, b) => (a.order || 0) - (b.order || 0));

        // 確保每個分類的商品按順序排列
        menu.value.categories.forEach(category => {
          if (category.items) {
            category.items.sort((a, b) => (a.order || 0) - (b.order || 0));
          }
        });
      }

      console.log('菜單載入成功:', menu.value);
    } else {
      console.error('Invalid menu data structure:', menuData);
    }
  } catch (error) {
    console.error('無法載入菜單數據:', error);
  } finally {
    setTimeout(() => {
      isLoading.value = false;
    }, 200);
  }
};

// 處理項目選擇
const handleItemSelect = (item) => {
  console.log('MenuView: 選擇項目', item);

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

// 登入相關方法
const handleLogin = () => {
  router.push({ name: 'customer-login' });
};

const handleLogout = async () => {
  try {
    await authStore.logout();
    isLoggedIn.value = false;
    customerName.value = '';
  } catch (error) {
    console.error('登出失敗:', error);
    alert('登出失敗: ' + error.message);
  }
};

// 購物車相關方法
const goToCart = () => {
  router.push({ name: 'cart' });
};

// 生命周期
onMounted(async () => {
  // 檢查登入狀態
  if (authStore.isLoggedIn) {
    isLoggedIn.value = true;
    customerName.value = authStore.user?.name || '';
  }

  // 並行載入數據
  await Promise.all([
    loadStoreData(),
    loadMenuData()
  ]);
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

/* ===== 響應式設計 ===== */
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
