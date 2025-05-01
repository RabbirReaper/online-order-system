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
            <div class="nav-section-header px-3 py-2" data-bs-toggle="collapse" data-bs-target="#storeManagement"
              aria-expanded="false">
              <i class="bi bi-shop me-2"></i>
              店鋪管理
              <i class="bi bi-chevron-down float-end"></i>
            </div>
            <div class="collapse" id="storeManagement">
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
            <div class="nav-section-header px-3 py-2" data-bs-toggle="collapse" data-bs-target="#menuManagement"
              aria-expanded="false">
              <i class="bi bi-menu-button-wide me-2"></i>
              菜單管理
              <i class="bi bi-chevron-down float-end"></i>
            </div>
            <div class="collapse" id="menuManagement">
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
            <div class="nav-section-header px-3 py-2" data-bs-toggle="collapse" data-bs-target="#dishManagement"
              aria-expanded="false">
              <i class="bi bi-cup-hot me-2"></i>
              餐點管理
              <i class="bi bi-chevron-down float-end"></i>
            </div>
            <div class="collapse" id="dishManagement">
              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/dishes`">
                <i class="bi bi-grid me-2"></i>
                餐點列表
              </router-link>
              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/dishes/template`">
                <i class="bi bi-card-list me-2"></i>
                餐點模板
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
            <div class="nav-section-header px-3 py-2" data-bs-toggle="collapse" data-bs-target="#inventoryManagement"
              aria-expanded="false">
              <i class="bi bi-box-seam me-2"></i>
              庫存管理
              <i class="bi bi-chevron-down float-end"></i>
            </div>
            <div class="collapse" id="inventoryManagement">
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
            <div class="nav-section-header px-3 py-2" data-bs-toggle="collapse" data-bs-target="#orderManagement"
              aria-expanded="false">
              <i class="bi bi-receipt me-2"></i>
              訂單管理
              <i class="bi bi-chevron-down float-end"></i>
            </div>
            <div class="collapse" id="orderManagement">
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
            <div class="nav-section-header px-3 py-2" data-bs-toggle="collapse" data-bs-target="#promotionManagement"
              aria-expanded="false">
              <i class="bi bi-megaphone me-2"></i>
              促銷管理
              <i class="bi bi-chevron-down float-end"></i>
            </div>
            <div class="collapse" id="promotionManagement">
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
            <div class="nav-section-header px-3 py-2" data-bs-toggle="collapse" data-bs-target="#userManagement"
              aria-expanded="false">
              <i class="bi bi-people me-2"></i>
              用戶管理
              <i class="bi bi-chevron-down float-end"></i>
            </div>
            <div class="collapse" id="userManagement">
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
            <div class="nav-section-header px-3 py-2" data-bs-toggle="collapse" data-bs-target="#systemSettings"
              aria-expanded="false">
              <i class="bi bi-gear me-2"></i>
              系統設置
              <i class="bi bi-chevron-down float-end"></i>
            </div>
            <div class="collapse" id="systemSettings">
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
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '@/api';

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
});

// 監聽品牌ID變化
watch(() => brandId.value, (newId, oldId) => {
  if (newId !== oldId) {
    fetchBrandInfo();
  }
});

// 生命週期鉤子
onMounted(() => {
  // 載入品牌資訊
  fetchBrandInfo();

  // 監聽視窗大小變化
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      showSidebar.value = false;
    }
  });

  // 增加點擊事件監聽器到導航連結，在移動裝置上點擊後關閉側邊欄
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', closeSidebarOnMobile);
  });

  // 初始化 Bootstrap 摺疊功能
  document.querySelectorAll('.collapse').forEach(collapse => {
    // 檢查當前頁面是否應該展開對應的折疊項目
    const links = collapse.querySelectorAll('.nav-link');
    const shouldExpand = Array.from(links).some(link => {
      const href = link.getAttribute('href');
      return href && route.path.includes(href.split('?')[0]);
    });

    if (shouldExpand) {
      collapse.classList.add('show');
    }
  });
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
</style>
