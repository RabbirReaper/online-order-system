<template>
  <div class="menu-view">
    <!-- 隱藏/顯示的頂部導航欄 -->
    <div class="navbar-container" :class="{ 'navbar-hidden': isNavbarHidden }">
      <BNavbar toggleable="lg" type="dark" variant="dark" class="fixed-top">
        <BNavbarBrand href="#">
          <img src="@/assets/logo.svg" alt="Logo" height="30" class="d-inline-block align-top">
          {{ store?.name || '餐廳菜單' }}
        </BNavbarBrand>
        <BNavbarToggle target="nav-collapse"></BNavbarToggle>
        <BCollapse id="nav-collapse" is-nav>
          <BNavbarNav class="ml-auto">
            <BNavItem to="/cart" :active="false">
              <BButton variant="outline-light" class="position-relative">
                <i class="bi bi-cart"></i>
                <Bbadge v-if="itemCount > 0" variant="danger" pill
                  class="position-absolute top-0 start-100 translate-middle">
                  {{ itemCount }}
                </Bbadge>
              </BButton>
            </BNavItem>
          </BNavbarNav>
        </BCollapse>
      </BNavbar>
    </div>

    <!-- 店家圖片和基本信息 -->
    <MenuHeader :store="store" :isLoading="isLoading" :isOpen="isStoreOpen"
      @view-hours="showBusinessHoursModal = true" />

    <!-- 主內容區 -->
    <div class="container mt-4 mb-5 pb-5">
      <div class="row">
        <!-- 左側類別導航（大螢幕上顯示） -->
        <div class="col-lg-3 d-none d-lg-block">
          <CategoryNavigator :categories="menu?.categories || []" :activeCategory="activeCategory"
            @select-category="scrollToCategory" />
        </div>

        <!-- 右側菜單內容 -->
        <div class="col-lg-9">
          <!-- 頂部粘性類別欄（小螢幕上顯示） -->
          <div ref="stickyNav" class="d-lg-none sticky-top bg-white py-2 shadow-sm category-scroll-container">
            <div class="container">
              <div class="scrolling-wrapper">
                <BButton v-for="(category, index) in menu?.categories" :key="index"
                  :variant="activeCategory === category.name ? 'primary' : 'outline-secondary'" class="me-2 my-1"
                  @click="scrollToCategory(category.name)">
                  {{ category.name }}
                </BButton>
              </div>
            </div>
          </div>

          <!-- 菜單類別和商品 -->
          <div v-if="isLoading" class="text-center py-5">
            <BSpinner label="載入中..."></BSpinner>
            <p class="mt-3">載入菜單中，請稍候...</p>
          </div>

          <div v-else-if="!menu || menu.categories.length === 0" class="text-center py-5">
            <i class="bi bi-exclamation-circle text-warning display-1"></i>
            <p class="mt-3 h5">目前沒有可用的菜單</p>
          </div>

          <MenuCategoryList v-else :categories="menu.categories" @view-dish="navigateToDish" />

          <!-- 購物車提示 -->
          <div v-if="itemCount > 0" class="cart-button-container">
            <BButton variant="primary" size="lg" block class="position-relative" @click="$router.push('/cart')">
              <div class="d-flex justify-content-between align-items-center">
                <span class="cart-count">
                  <i class="bi bi-cart-fill me-2"></i>
                  {{ itemCount }} 項商品
                </span>
                <span class="cart-total">{{ formatPrice(subtotal) }}</span>
              </div>
            </BButton>
          </div>
        </div>
      </div>
    </div>

    <!-- 營業時間彈窗 -->
    <BModal v-model="showBusinessHoursModal" title="營業時間" hide-footer centered>
      <div v-if="store">
        <div v-for="(hours, index) in formattedBusinessHours" :key="index"
          class="d-flex justify-content-between mb-2 py-2 border-bottom">
          <div :class="{ 'font-weight-bold': isToday(hours.day) }">{{ hours.dayName }}</div>
          <div v-if="hours.isClosed" class="text-danger">休息</div>
          <div v-else>
            <span v-for="(period, pIndex) in hours.periods" :key="pIndex">
              {{ period.open }} - {{ period.close }}
              <span v-if="pIndex < hours.periods.length - 1" class="mx-2">|</span>
            </span>
          </div>
        </div>
      </div>
    </BModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useCartStore } from '@/stores/cart';

import MenuHeader from '@/components/customer/menu/MenuHeader.vue';
import CategoryNavigator from '@/components/customer/menu/CategoryNavigator.vue';
import MenuCategoryList from '@/components/customer/menu/MenuCategoryList.vue';

import api from '@/api';

// 路由相關
const router = useRouter();
const route = useRoute();

// 獲取品牌和店鋪 ID
const brandId = computed(() => route.params.brandId);
const storeId = computed(() => route.params.storeId);

// 購物車 store
const cartStore = useCartStore();
const { itemCount, subtotal } = storeToRefs(cartStore);

// 狀態變數
const isLoading = ref(true);
const menu = ref(null);
const store = ref(null);
const error = ref(null);
const showBusinessHoursModal = ref(false);
const isNavbarHidden = ref(false);
const lastScrollPosition = ref(0);
const activeCategory = ref('');
const categoryRefs = ref({});
const observer = ref(null);
const stickyNav = ref(null);

// 載入店鋪和菜單數據
const loadStoreData = async () => {
  if (!brandId.value || !storeId.value) {
    error.value = '無效的店鋪或品牌 ID';
    isLoading.value = false;
    return;
  }

  try {
    // 先獲取店鋪信息
    const storeResponse = await api.store.getStoreById({
      brandId: brandId.value,
      id: storeId.value
    });

    if (storeResponse && storeResponse.store) {
      store.value = storeResponse.store;

      // 然後獲取菜單
      const menuResponse = await api.menu.getStoreMenu({
        brandId: brandId.value,
        storeId: storeId.value,
        includeUnpublished: false
      });

      if (menuResponse && menuResponse.menu) {
        menu.value = menuResponse.menu;

        // 如果有類別，設置第一個為活動類別
        if (menuResponse.menu.categories && menuResponse.menu.categories.length > 0) {
          activeCategory.value = menuResponse.menu.categories[0].name;
        }
      }
    }

    // 設置購物車品牌和店鋪
    cartStore.setBrandAndStore(brandId.value, storeId.value);

  } catch (err) {
    console.error('獲取店鋪和菜單數據失敗', err);
    error.value = '獲取店鋪和菜單數據失敗，請稍後再試';
  } finally {
    isLoading.value = false;
  }
};

// 判斷店鋪是否營業中
const isStoreOpen = computed(() => {
  if (!store.value || !store.value.businessHours) return false;

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0-6, 0 是星期日
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;

  // 查找當天的營業時間
  const todayHours = store.value.businessHours.find(hours => hours.day === dayOfWeek);

  if (!todayHours || todayHours.isClosed) return false;

  // 檢查是否在任何一個營業時段內
  return todayHours.periods.some(period => {
    return currentTime >= period.open && currentTime <= period.close;
  });
});

// 格式化營業時間顯示
const formattedBusinessHours = computed(() => {
  if (!store.value || !store.value.businessHours) return [];

  const dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

  // 按日期順序排序
  const sortedHours = [...store.value.businessHours].sort((a, b) => a.day - b.day);

  return sortedHours.map(hours => ({
    day: hours.day,
    dayName: dayNames[hours.day],
    isClosed: hours.isClosed,
    periods: hours.periods || []
  }));
});

// 判斷是否為今天
const isToday = (day) => {
  return new Date().getDay() === day;
};

// 處理頁面滾動
const handleScroll = () => {
  const currentScrollPosition = window.pageYOffset;

  // 控制導航欄隱藏/顯示
  if (currentScrollPosition < 0) {
    return;
  }

  // 向下滾動時隱藏，向上滾動時顯示
  if (currentScrollPosition > 100) {
    isNavbarHidden.value = currentScrollPosition > lastScrollPosition.value;
  } else {
    isNavbarHidden.value = false;
  }

  lastScrollPosition.value = currentScrollPosition;
};

// 滾動到特定類別
const scrollToCategory = (categoryName) => {
  const element = document.getElementById(`category-${categoryName}`);
  if (element) {
    const yOffset = -100; // 頂部導航欄的高度
    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: 'smooth' });
    activeCategory.value = categoryName;
  }
};

// 導航到餐點詳情頁
const navigateToDish = (dish) => {
  router.push({
    name: 'dish-detail',
    params: {
      brandId: brandId.value,
      storeId: storeId.value,
      dishId: dish._id
    }
  });
};

// 格式化價格顯示
const formatPrice = (price) => {
  return `$${price.toLocaleString('zh-TW')}`;
};

// 設置 Intersection Observer 監控類別滾動
const setupIntersectionObserver = () => {
  if (typeof IntersectionObserver === 'undefined') return;

  // 如果已有 observer，先斷開連接
  if (observer.value) {
    observer.value.disconnect();
  }

  observer.value = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const categoryId = entry.target.id;
        if (categoryId.startsWith('category-')) {
          activeCategory.value = categoryId.replace('category-', '');
        }
      }
    });
  }, {
    rootMargin: '-100px 0px -80% 0px', // 根據導航欄高度調整
    threshold: 0
  });

  // 監控所有類別元素
  const categoryElements = document.querySelectorAll('[id^="category-"]');
  categoryElements.forEach(element => {
    observer.value.observe(element);
  });
};

// 生命週期鉤子
onMounted(() => {
  loadStoreData();
  window.addEventListener('scroll', handleScroll);

  // 等待 DOM 渲染後設置 Intersection Observer
  setTimeout(() => {
    setupIntersectionObserver();
  }, 1000);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);

  // 斷開 observer 連接
  if (observer.value) {
    observer.value.disconnect();
  }
});

// 監聽菜單數據變化，更新 Intersection Observer
watch(() => menu.value, () => {
  if (menu.value) {
    // 等待 DOM 渲染後設置 observer
    setTimeout(() => {
      setupIntersectionObserver();
    }, 500);
  }
});
</script>

<style scoped>
.navbar-container {
  height: 56px;
  transition: transform 0.3s;
}

.navbar-hidden {
  transform: translateY(-100%);
}

.category-scroll-container {
  z-index: 1020;
  padding: 8px 0;
  background-color: rgba(255, 255, 255, 0.95) !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.scrolling-wrapper {
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 5px;
  scrollbar-width: thin;
}

.scrolling-wrapper::-webkit-scrollbar {
  height: 4px;
}

.scrolling-wrapper::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.cart-button-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background-color: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.cart-count {
  font-weight: 500;
}

.cart-total {
  font-weight: bold;
  font-size: 1.1rem;
}
</style>
