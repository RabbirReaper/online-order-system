<template>
  <div class="menu-view">
    <div class="container-wrapper">
      <MenuHeader :store-name="store.name" :store-image="store.image" :announcements="store.announcements"
        :business-hours="store.businessHours" :is-logged-in="isLoggedIn" :customer-name="customerName"
        :store-address="store.address" @login="handleLogin" @account="handleAccount" @logout="handleLogout" />

      <CategoryNavigator v-if="menu.list && menu.list.length > 0" :categories="menu.list" />

      <MenuCategoryList :menu-list="menu.list" :menu-items="menuItems" @select-item="selectItem" />

      <!-- Shopping Cart Button -->
      <div v-if="cart.length > 0" class="position-fixed bottom-0 start-50 translate-middle-x mb-4"
        style="z-index: 1030; width: 100%; max-width: 540px;">
        <div class="container-fluid px-3">
          <button class="btn btn-primary rounded-pill shadow-lg px-4 py-2 w-100" @click="goToCart">
            <i class="bi bi-cart-fill me-2"></i>
            {{ getTotalItems() }} 項商品 - ${{ calculateTotal() }}
          </button>
        </div>
      </div>
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
import { useAuthStore } from '@/stores/auth'; // 添加 authStore

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();
const authStore = useAuthStore(); // 初始化 authStore

// 獲取路由參數
const brandId = computed(() => route.params.brandId);
const storeId = computed(() => route.params.storeId);

// 響應式數據
const store = ref({
  name: '',
  image: null,
  announcements: []
});
const menu = ref({
  list: []
});
const menuItems = ref([]);
const isLoading = ref(true);
const isLoggedIn = ref(false);
const customerName = ref('');

// 計算屬性
const cart = computed(() => {
  return cartStore.items;
});

// 方法
const loadStoreData = async () => {
  try {
    const storeData = await api.store.getStoreById({ brandId: brandId.value, id: storeId.value });
    // console.log('Loaded store data:', storeData);

    if (storeData && storeData.success) { // 添加對 success 的檢查
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

    // console.log('Loaded menu data:', menuData);

    if (menuData.success && menuData.menu) {
      menu.value.list = menuData.menu.categories.map(category => ({
        categoryName: category.name,
        categoryId: category._id,
        description: category.description,
        order: category.order,
        items: category.dishes.map(dish => {
          // 檢查 dishTemplate 是否為物件，若是則獲取其 _id
          const dishId = typeof dish.dishTemplate === 'object' && dish.dishTemplate !== null
            ? dish.dishTemplate._id  // 若是物件則取其 _id
            : dish.dishTemplate;     // 否則直接使用

          return {
            itemId: dishId,
            order: dish.order,
            price: dish.price
          };
        }).filter(item => item.itemId)
      })).sort((a, b) => a.order - b.order);

      // 載入所有餐點詳情
      await loadMenuItems();
    } else {
      console.error('Invalid menu data structure:', menuData);
    }
  } catch (error) {
    console.error('無法載入菜單數據:', error);
  } finally {
    isLoading.value = false;
  }
};

const loadMenuItems = async () => {
  try {
    // 收集需要獲取詳情的所有餐點ID
    const dishIds = menu.value.list.flatMap(category =>
      category.items.map(item => item.itemId)
    );

    // 使用唯一ID避免重複請求
    const uniqueDishIds = [...new Set(dishIds)].filter(id =>
      typeof id === 'string' && id.trim() !== ''
    );

    // console.log('Loading dish details for IDs:', uniqueDishIds);

    if (uniqueDishIds.length === 0) {
      console.warn('No dish IDs found in menu');
      return;
    }

    // 獲取所有餐點詳情
    const dishDetails = await Promise.all(
      uniqueDishIds.map(id =>
        api.dish.getDishTemplateById({
          brandId: brandId.value,
          id: id
        })
      )
    );

    // console.log('Loaded dish details:', dishDetails);

    // 將價格資訊從菜單中合併到餐點詳情
    menuItems.value = dishDetails
      .filter(dish => dish && dish.success) // 確保 API 回應成功
      .map(dish => dish.template) // 修改這裡：正確使用 template 欄位而不是 data
      .filter(Boolean)
      .map(dish => {
        // 確保圖片URL是正確的
        if (!dish.image || !dish.image.url) {
          console.warn(`Dish image URL is missing for ${dish.name}:`, dish.image);
          dish.image = {
            url: '/placeholder.jpg',
            alt: dish.name
          };
        }

        // 在所有類別中查找該餐點
        for (const category of menu.value.list) {
          const menuItem = category.items.find(item => item.itemId === dish._id);
          if (menuItem) {
            // 如果菜單中有特定價格，則使用菜單價格
            return {
              ...dish,
              price: menuItem.price || dish.basePrice,
              _id: dish._id
            };
          }
        }

        // 如果在菜單中未找到，使用基本價格
        return {
          ...dish,
          price: dish.basePrice,
          _id: dish._id
        };
      });

    // console.log('Final menuItems data:', menuItems.value);
  } catch (error) {
    console.error('無法載入餐點詳情:', error);
  }
};

// 登入相關方法
const handleLogin = () => {
  router.push({
    name: 'customer-login',
    // params: {
    //   brandId: brandId.value,
    //   storeId: storeId.value
    // }
  });
};

const handleAccount = () => {
  router.push({
    name: 'customer-profile',
    // params: {
    //   brandId: brandId.value,
    //   storeId: storeId.value
    // }
  });
};

const handleLogout = async () => {
  try {
    // 使用 authStore 進行登出，brandId 已在 onMounted 中設置
    await authStore.logout();

    // 更新本地 UI 狀態
    isLoggedIn.value = false;
    customerName.value = '';

  } catch (error) {
    console.error('登出失敗:', error);
    alert('登出失敗: ' + error.message);
  }
};

// 購物車相關方法
const selectItem = (dishId) => {
  router.push({
    name: 'dish-detail',
    params: {
      brandId: brandId.value,
      storeId: storeId.value,
      dishId: dishId
    }
  });
};

const goToCart = () => {
  router.push({ name: 'cart' });
};

const getTotalItems = () => {
  return cartStore.itemCount;
};

const calculateTotal = () => {
  return cartStore.total;
};

// 生命週期鉤子
onMounted(async () => {
  // 設置 brandId 到 authStore，解決登出時找不到 brandId 的問題
  if (brandId.value) {
    authStore.setBrandId(brandId.value);

    // 將 brandId 也存入 sessionStorage，確保頁面刷新後仍能訪問
    sessionStorage.setItem('currentBrandId', brandId.value);
  }

  // 設置 storeId 到購物車
  if (storeId.value) {
    sessionStorage.setItem('currentStoreId', storeId.value);
  }

  // 檢查登入狀態
  try {
    const status = await authStore.checkAuthStatus();
    isLoggedIn.value = status.loggedIn;
    if (status.loggedIn && authStore.user) {
      customerName.value = authStore.user.name || '';
    }
  } catch (error) {
    console.error('檢查登入狀態失敗:', error);
  }

  // 載入數據
  try {
    await Promise.all([
      loadStoreData(),
      loadMenuData()
    ]);

    // 設置品牌和商店ID到購物車
    cartStore.setBrandAndStore(brandId.value, storeId.value);
  } catch (error) {
    console.error('載入數據失敗:', error);
  }
});
</script>

<style scoped>
.menu-view {
  min-height: 100vh;
  background-color: #f8f9fa;
  padding-bottom: 80px;
  /* 為底部購物車按鈕預留空間 */
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

@media (max-width: 576px) {
  .container-wrapper {
    max-width: 100%;
  }
}
</style>
