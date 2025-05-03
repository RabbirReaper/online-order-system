<template>
  <div class="d-flex vh-100 overflow-hidden">
    <!-- 側邊欄 -->
    <aside class="sidebar bg-dark" :class="{ 'show': showSidebar }">
      <div class="d-flex flex-column h-100">
        <div class="sidebar-header p-3 d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center">
            <img src="@/assets/logo.svg" alt="Logo" class="me-2" width="32" height="32" />
            <h1 class="h5 mb-0 text-white d-none d-md-block">品牌管理系統</h1>
          </div>
          <button class="btn btn-link text-white d-md-none" @click="toggleSidebar">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <nav class="pt-2 pb-2 flex-grow-1 sidebar-nav">
          <!-- 儀表板區塊 -->
          <div class="mb-1">
            <router-link class="nav-link px-3" :to="`/admin/${brandId}`" exact-active-class="active">
              <i class="bi bi-speedometer2 me-2"></i>
              儀表板
            </router-link>
          </div>

          <!-- 店鋪管理 -->
          <div class="mb-1">
            <div class="nav-section-header px-3 py-2" @click="toggleSection('storeManagement')"
              :aria-expanded="isExpanded('storeManagement')" aria-controls="storeManagement">
              <i class="bi bi-shop me-2"></i>
              店鋪管理
              <i class="bi float-end" :class="isExpanded('storeManagement') ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
            </div>
            <div class="collapse" :class="{ 'show': isExpanded('storeManagement') }" id="storeManagement"
              ref="storeManagementRef" :style="getCollapseStyle('storeManagement')">
              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/stores`">
                <i class="bi bi-list-ul me-2"></i>
                店鋪列表
              </router-link>
              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/stores/create`">
                <i class="bi bi-plus-circle me-2"></i>
                新增店鋪
              </router-link>
            </div>
          </div>

          <!-- 菜單管理 -->
          <div class="mb-1">
            <div class="nav-section-header px-3 py-2" @click="toggleSection('menuManagement')"
              :aria-expanded="isExpanded('menuManagement')" aria-controls="menuManagement">
              <i class="bi bi-menu-button-wide me-2"></i>
              菜單管理
              <i class="bi float-end" :class="isExpanded('menuManagement') ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
            </div>
            <div class="collapse" :class="{ 'show': isExpanded('menuManagement') }" id="menuManagement"
              ref="menuManagementRef" :style="getCollapseStyle('menuManagement')">
              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/menus`">
                <i class="bi bi-list-check me-2"></i>
                菜單列表
              </router-link>
              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/menus/template`">
                <i class="bi bi-card-list me-2"></i>
                菜單模板
              </router-link>
            </div>
          </div>

          <!-- 餐點管理 -->
          <div class="mb-1">
            <div class="nav-section-header px-3 py-2" @click="toggleSection('dishManagement')"
              :aria-expanded="isExpanded('dishManagement')" aria-controls="dishManagement">
              <i class="bi bi-cup-hot me-2"></i>
              餐點管理
              <i class="bi float-end" :class="isExpanded('dishManagement') ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
            </div>
            <div class="collapse" :class="{ 'show': isExpanded('dishManagement') }" id="dishManagement"
              ref="dishManagementRef" :style="getCollapseStyle('dishManagement')">
              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/dishes/template`">
                <i class="bi bi-grid me-2"></i>
                餐點列表
              </router-link>
              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/dishes/template/create`">
                <i class="bi bi-card-list me-2"></i>
                建立餐點模板
              </router-link>
              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/option-categories`">
                <i class="bi bi-tags me-2"></i>
                選項類別
              </router-link>
              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/options`">
                <i class="bi bi-list-check me-2"></i>
                選項管理
              </router-link>
            </div>
          </div>

          <!-- 庫存管理 -->
          <div class="mb-1">
            <div class="nav-section-header px-3 py-2" @click="toggleSection('inventoryManagement')"
              :aria-expanded="isExpanded('inventoryManagement')" aria-controls="inventoryManagement">
              <i class="bi bi-box-seam me-2"></i>
              庫存管理
              <i class="bi float-end"
                :class="isExpanded('inventoryManagement') ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
            </div>
            <div class="collapse" :class="{ 'show': isExpanded('inventoryManagement') }" id="inventoryManagement"
              ref="inventoryManagementRef" :style="getCollapseStyle('inventoryManagement')">
              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/inventory`">
                <i class="bi bi-box2 me-2"></i>
                庫存狀態
              </router-link>
              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/inventory/logs`">
                <i class="bi bi-clock-history me-2"></i>
                變更記錄
              </router-link>
            </div>
          </div>

          <!-- 訂單管理 -->
          <div class="mb-1">
            <div class="nav-section-header px-3 py-2" @click="toggleSection('orderManagement')"
              :aria-expanded="isExpanded('orderManagement')" aria-controls="orderManagement">
              <i class="bi bi-receipt me-2"></i>
              訂單管理
              <i class="bi float-end" :class="isExpanded('orderManagement') ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
            </div>
            <div class="collapse" :class="{ 'show': isExpanded('orderManagement') }" id="orderManagement"
              ref="orderManagementRef" :style="getCollapseStyle('orderManagement')">
              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/orders`">
                <i class="bi bi-list-ul me-2"></i>
                訂單列表
              </router-link>
              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/orders/reports`">
                <i class="bi bi-bar-chart me-2"></i>
                銷售報表
              </router-link>
            </div>
          </div>

          <!-- 促銷管理 -->
          <div class="mb-1">
            <div class="nav-section-header px-3 py-2" @click="toggleSection('promotionManagement')"
              :aria-expanded="isExpanded('promotionManagement')" aria-controls="promotionManagement">
              <i class="bi bi-megaphone me-2"></i>
              促銷管理
              <i class="bi float-end"
                :class="isExpanded('promotionManagement') ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
            </div>
            <div class="collapse" :class="{ 'show': isExpanded('promotionManagement') }" id="promotionManagement"
              ref="promotionManagementRef" :style="getCollapseStyle('promotionManagement')">
              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/coupons`">
                <i class="bi bi-ticket-perforated me-2"></i>
                優惠券
              </router-link>
              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/point-rules`">
                <i class="bi bi-coin me-2"></i>
                點數規則
              </router-link>
            </div>
          </div>

          <!-- 用戶管理 -->
          <div class="mb-1">
            <div class="nav-section-header px-3 py-2" @click="toggleSection('userManagement')"
              :aria-expanded="isExpanded('userManagement')" aria-controls="userManagement">
              <i class="bi bi-people me-2"></i>
              用戶管理
              <i class="bi float-end" :class="isExpanded('userManagement') ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
            </div>
            <div class="collapse" :class="{ 'show': isExpanded('userManagement') }" id="userManagement"
              ref="userManagementRef" :style="getCollapseStyle('userManagement')">
              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/store-admins`">
                <i class="bi bi-person-workspace me-2"></i>
                店鋪管理員
              </router-link>
              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/customers`">
                <i class="bi bi-person-vcard me-2"></i>
                顧客管理
              </router-link>
            </div>
          </div>

          <!-- 系統設置 -->
          <div class="mb-1">
            <div class="nav-section-header px-3 py-2" @click="toggleSection('systemSettings')"
              :aria-expanded="isExpanded('systemSettings')" aria-controls="systemSettings">
              <i class="bi bi-gear me-2"></i>
              系統設置
              <i class="bi float-end" :class="isExpanded('systemSettings') ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
            </div>
            <div class="collapse" :class="{ 'show': isExpanded('systemSettings') }" id="systemSettings"
              ref="systemSettingsRef" :style="getCollapseStyle('systemSettings')">
              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/settings`">
                <i class="bi bi-sliders me-2"></i>
                品牌設置
              </router-link>
              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/account-settings`">
                <i class="bi bi-person-gear me-2"></i>
                帳號設置
              </router-link>
            </div>
          </div>
        </nav>

        <div class="border-top p-3">
          <button class="btn btn-danger w-100" @click="handleLogout">
            <i class="bi bi-box-arrow-right me-2"></i>
            登出系統
          </button>
        </div>
      </div>
    </aside>

    <!-- 主要內容區 -->
    <main class="main-content">
      <!-- 移動版頂部導航欄 -->
      <div
        class="d-flex d-md-none align-items-center justify-content-between bg-dark text-white p-3 sticky-top mobile-top-nav">
        <div class="d-flex align-items-center">
          <button class="btn btn-link text-white me-2" @click="toggleSidebar">
            <i class="bi bi-list"></i>
          </button>
          <h1 class="h5 mb-0">品牌管理系統</h1>
        </div>
        <div class="dropdown">
          <button class="btn btn-link text-white dropdown-toggle" type="button" id="mobileDropdownMenuButton"
            data-bs-toggle="dropdown" aria-expanded="false">
            <i class="bi bi-person-circle"></i>
          </button>
          <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="mobileDropdownMenuButton">
            <li>
              <h6 class="dropdown-header">{{ currentUserRole }}</h6>
            </li>
            <li><router-link class="dropdown-item" :to="`/admin/${brandId}/account-settings`">設置</router-link></li>
            <li>
              <hr class="dropdown-divider">
            </li>
            <li><a class="dropdown-item" href="#" @click.prevent="handleLogout">登出</a></li>
          </ul>
        </div>
      </div>

      <div class="content-wrapper">
        <!-- 桌面版頂部標題欄 -->
        <div
          class="d-none d-md-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
          <h2>{{ getPageTitle() }}</h2>
          <div class="dropdown">
            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" id="dropdownMenuButton"
              data-bs-toggle="dropdown" aria-expanded="false">
              <i class="bi bi-person-circle me-1"></i>
              {{ currentUserRole }}
            </button>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenuButton">
              <li>
                <h6 class="dropdown-header">{{ currentBrandName }}</h6>
              </li>
              <li><router-link class="dropdown-item" :to="`/admin/${brandId}/account-settings`">設置</router-link></li>
              <li>
                <hr class="dropdown-divider">
              </li>
              <li><a class="dropdown-item" href="#" @click.prevent="handleLogout">登出</a></li>
            </ul>
          </div>
        </div>

        <div class="content pb-3">
          <router-view />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '@/api';
import _ from 'lodash';

// 路由
const router = useRouter();
const route = useRoute();

// 品牌 ID 從路由中獲取
const brandId = computed(() => route.params.brandId);

// 側邊欄是否顯示 (用於移動版)
const showSidebar = ref(false);

// 狀態變數
const currentUserRole = ref('品牌管理員');
const currentBrandName = ref('載入中...');
const isLoading = ref(true);

// 為各個折疊區塊創建refs
const storeManagementRef = ref(null);
const menuManagementRef = ref(null);
const dishManagementRef = ref(null);
const inventoryManagementRef = ref(null);
const orderManagementRef = ref(null);
const promotionManagementRef = ref(null);
const userManagementRef = ref(null);
const systemSettingsRef = ref(null);

// 建立一個map來方便存取各個區塊的ref
const sectionRefs = {
  storeManagement: storeManagementRef,
  menuManagement: menuManagementRef,
  dishManagement: dishManagementRef,
  inventoryManagement: inventoryManagementRef,
  orderManagement: orderManagementRef,
  promotionManagement: promotionManagementRef,
  userManagement: userManagementRef,
  systemSettings: systemSettingsRef
};

// 保存每個折疊區塊的實際高度
const sectionHeights = ref({});

// 已展開的折疊項目ID列表 - 使用響應式方式管理折疊狀態
const expandedItems = ref([]);

// 檢查特定折疊項是否應該展開
const isExpanded = (id) => {
  return expandedItems.value.includes(id);
};

// 獲取折疊區塊的樣式
const getCollapseStyle = (section) => {
  if (!sectionHeights.value[section]) return {};

  return {
    maxHeight: isExpanded(section) ? sectionHeights.value[section] : '0px'
  };
};

// 計算所有折疊區塊的實際高度
const calculateSectionHeights = () => {
  const sections = Object.keys(sectionRefs);

  sections.forEach(section => {
    const element = sectionRefs[section].value;
    if (element) {
      // 臨時移除max-height限制來測量真實高度
      element.style.maxHeight = 'none';
      element.style.height = 'auto';
      // 保存計算出的高度
      sectionHeights.value[section] = element.scrollHeight + 'px';
      // 重設樣式
      element.style.maxHeight = isExpanded(section) ? sectionHeights.value[section] : '0px';
    }
  });
};

// 切換折疊狀態
const toggleSection = (id) => {
  // 檢查項目是否已展開
  const index = expandedItems.value.indexOf(id);

  if (index === -1) {
    // 如果沒有展開，則添加到展開列表
    expandedItems.value.push(id);
  } else {
    // 如果已展開，則從列表中移除
    expandedItems.value.splice(index, 1);
  }

  // 確保高度已經計算
  if (!sectionHeights.value[id] && sectionRefs[id].value) {
    const element = sectionRefs[id].value;
    element.style.maxHeight = 'none';
    element.style.height = 'auto';
    sectionHeights.value[id] = element.scrollHeight + 'px';
  }
};

// 初始化折疊狀態
const initCollapseStates = () => {
  // 基於路由路徑決定哪些折疊項應該展開
  if (route.path.includes('/stores') && !expandedItems.value.includes('storeManagement'))
    expandedItems.value.push('storeManagement');

  if (route.path.includes('/menus') && !expandedItems.value.includes('menuManagement'))
    expandedItems.value.push('menuManagement');

  if ((route.path.includes('/dishes') ||
    route.path.includes('/option-categories') ||
    route.path.includes('/options')) && !expandedItems.value.includes('dishManagement'))
    expandedItems.value.push('dishManagement');

  if (route.path.includes('/inventory') && !expandedItems.value.includes('inventoryManagement'))
    expandedItems.value.push('inventoryManagement');

  if (route.path.includes('/orders') && !expandedItems.value.includes('orderManagement'))
    expandedItems.value.push('orderManagement');

  if ((route.path.includes('/coupons') ||
    route.path.includes('/point-rules')) && !expandedItems.value.includes('promotionManagement'))
    expandedItems.value.push('promotionManagement');

  if ((route.path.includes('/store-admins') ||
    route.path.includes('/customers')) && !expandedItems.value.includes('userManagement'))
    expandedItems.value.push('userManagement');

  if ((route.path.includes('/settings') ||
    route.path.includes('/account-settings')) && !expandedItems.value.includes('systemSettings'))
    expandedItems.value.push('systemSettings');
};

// 切換側邊欄顯示 (用於移動版)
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value;
};

// 關閉側邊欄當選擇一個項目時 (移動版)
const closeSidebarOnMobile = () => {
  if (window.innerWidth < 768) {
    showSidebar.value = false;
  }
};

// 根據當前路由名稱獲取頁面標題
const getPageTitle = () => {
  const routeName = route.name;
  const routePath = route.path;

  // 根據路由路徑或名稱返回相應標題
  if (routePath.includes('/stores/create')) return '新增店鋪';
  if (routePath.includes('/stores/edit')) return '編輯店鋪';
  if (routePath.includes('/stores/detail')) return '店鋪詳情';
  if (routePath.includes('/stores')) return '店鋪管理';

  if (routePath.includes('/inventory/logs')) return '庫存變更記錄';
  if (routePath.includes('/inventory')) return '庫存管理';

  if (routePath.includes('/menus')) return '菜單管理';
  if (routePath.includes('/dishes')) return '餐點管理';
  if (routePath.includes('/option-categories')) return '選項類別';
  if (routePath.includes('/options')) return '選項管理';

  if (routePath.includes('/orders/reports')) return '銷售報表';
  if (routePath.includes('/orders')) return '訂單管理';

  if (routePath.includes('/coupons')) return '優惠券管理';
  if (routePath.includes('/point-rules')) return '點數規則';

  if (routePath.includes('/store-admins')) return '店鋪管理員';
  if (routePath.includes('/customers')) return '顧客管理';

  if (routePath.includes('/settings')) return '品牌設置';
  if (routePath.includes('/account-settings')) return '帳號設置';

  // 預設標題
  return '品牌儀表板';
};

// 獲取品牌資訊
const fetchBrandInfo = async () => {
  if (!brandId.value) return;

  isLoading.value = true;

  try {
    const response = await api.brand.getBrandById(brandId.value);
    if (response && response.brand) {
      currentBrandName.value = response.brand.name;
    }
  } catch (error) {
    console.error('獲取品牌資訊失敗', error);
  } finally {
    isLoading.value = false;
  }
};

// 處理登出
const handleLogout = async () => {
  try {
    await api.auth.logout();
    router.push('/admin/login');
  } catch (error) {
    console.error('登出失敗', error);
    router.push('/admin/login');
  }
};

// 監聽路由變化
watch(() => route.path, () => {
  closeSidebarOnMobile();
  // 不再重設折疊狀態，只在初始化時設定一次
});

// 監聽品牌ID變化
watch(() => brandId.value, (newId, oldId) => {
  if (newId !== oldId) {
    fetchBrandInfo();
  }
});

// 當折疊狀態變化時重新應用樣式
watch(expandedItems, () => {
  nextTick(() => {
    // 可能需要重新計算，因為DOM可能已經變更
    calculateSectionHeights();
  });
});

// 生命週期鉤子
onMounted(() => {
  // 載入品牌資訊
  fetchBrandInfo();

  // 初始化折疊狀態
  initCollapseStates();

  // 確保DOM已經渲染後再計算高度
  nextTick(() => {
    calculateSectionHeights();
  });

  // 監聽視窗大小變化，使用lodash的debounce函數來優化性能
  window.addEventListener('resize', _.debounce(() => {
    nextTick(() => {
      calculateSectionHeights();
    });
  }, 200));
});
</script>

<style scoped>
/* 全局布局 */
.d-flex.vh-100 {
  width: 100%;
  overflow: hidden;
}

/* 側邊欄樣式 */
.sidebar {
  width: 280px;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  background-color: #212529;
  z-index: 1030;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease-in-out;
}

.sidebar-nav {
  overflow-y: auto;
  scrollbar-width: thin;
}

.sidebar-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* 主要內容區域 */
.main-content {
  flex: 1;
  height: 100vh;
  margin-left: 280px;
  /* 與sidebar寬度相同 */
  display: flex;
  flex-direction: column;
  width: calc(100% - 280px);
}

.content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 0 1rem;
}

.content {
  min-height: calc(100vh - 70px);
}

/* 導航菜單樣式 */
.nav-section-header {
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
  font-weight: 500;
  border-radius: 0.25rem;
}

.nav-section-header:hover {
  color: #fff;
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-link {
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.2s;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
}

.nav-link:hover {
  color: #fff;
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-link.active {
  color: #fff;
  background-color: #0d6efd;
}

/* 移動版樣式 */
.mobile-top-nav {
  z-index: 1020;
}

/* 提高 z-index 以確保下拉選單在上層 */
.dropdown-menu {
  z-index: 1031;
}

/* 移動裝置側邊欄 */
@media (max-width: 767.98px) {
  .sidebar {
    transform: translateX(-100%);
    width: 100%;
    max-width: 280px;
  }

  .sidebar.show {
    transform: translateX(0);
  }

  .main-content {
    margin-left: 0;
    width: 100%;
  }
}

/* 桌面版側邊欄 */
@media (min-width: 768px) {
  .sidebar {
    transform: none !important;
  }
}

/* 折疊展開/收合動畫 */
.collapse {
  display: block;
  overflow: hidden;
  transition: max-height 0.5s ease;
}
</style>
