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
            <CollapsibleSection title="店鋪管理" :initialExpanded="isExpanded('storeManagement')"
              @toggle="(expanded) => handleSectionToggle('storeManagement', expanded)">
              <template #icon><i class="bi bi-shop me-2"></i></template>

              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/stores`">
                <i class="bi bi-list-ul me-2"></i>
                店鋪列表
              </router-link>

              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/stores/create`">
                <i class="bi bi-plus-circle me-2"></i>
                新增店鋪
              </router-link>
              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/inventory`">
                <i class="bi bi-box2 me-2"></i>
                庫存狀態
              </router-link>
            </CollapsibleSection>
          </div>

          <!-- 菜單管理 -->
          <div class="mb-1">
            <CollapsibleSection title="菜單管理" :initialExpanded="isExpanded('menuManagement')"
              @toggle="(expanded) => handleSectionToggle('menuManagement', expanded)">
              <template #icon><i class="bi bi-menu-button-wide me-2"></i></template>

              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/menus`">
                <i class="bi bi-list-check me-2"></i>
                菜單列表
              </router-link>

            </CollapsibleSection>
          </div>

          <!-- 餐點管理 -->
          <div class="mb-1">
            <CollapsibleSection title="餐點管理" :initialExpanded="isExpanded('dishManagement')"
              @toggle="(expanded) => handleSectionToggle('dishManagement', expanded)">
              <template #icon><i class="bi bi-cup-hot me-2"></i></template>

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
            </CollapsibleSection>
          </div>

          <!-- 訂單管理 -->
          <div class="mb-1">
            <CollapsibleSection title="訂單管理" :initialExpanded="isExpanded('orderManagement')"
              @toggle="(expanded) => handleSectionToggle('orderManagement', expanded)">
              <template #icon><i class="bi bi-receipt me-2"></i></template>

              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/orders`">
                <i class="bi bi-list-ul me-2"></i>
                訂單列表
              </router-link>

              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/orders/reports`">
                <i class="bi bi-bar-chart me-2"></i>
                銷售報表
              </router-link>
            </CollapsibleSection>
          </div>

          <!-- 促銷管理 -->
          <div class="mb-1">
            <CollapsibleSection title="促銷管理" :initialExpanded="isExpanded('promotionManagement')"
              @toggle="(expanded) => handleSectionToggle('promotionManagement', expanded)">
              <template #icon><i class="bi bi-megaphone me-2"></i></template>

              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/coupons`">
                <i class="bi bi-ticket-perforated me-2"></i>
                優惠券
              </router-link>

              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/point-rules`">
                <i class="bi bi-coin me-2"></i>
                點數規則
              </router-link>
            </CollapsibleSection>
          </div>

          <!-- 用戶管理 -->
          <div class="mb-1">
            <CollapsibleSection title="用戶管理" :initialExpanded="isExpanded('userManagement')"
              @toggle="(expanded) => handleSectionToggle('userManagement', expanded)">
              <template #icon><i class="bi bi-people me-2"></i></template>

              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/store-admins`">
                <i class="bi bi-person-workspace me-2"></i>
                店鋪管理員
              </router-link>

              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/customers`">
                <i class="bi bi-person-vcard me-2"></i>
                顧客管理
              </router-link>
            </CollapsibleSection>
          </div>

          <!-- 系統設置 -->
          <div class="mb-1">
            <CollapsibleSection title="系統設置" :initialExpanded="isExpanded('systemSettings')"
              @toggle="(expanded) => handleSectionToggle('systemSettings', expanded)">
              <template #icon><i class="bi bi-gear me-2"></i></template>

              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/account-settings`">
                <i class="bi bi-person-gear me-2"></i>
                帳號設置
              </router-link>
            </CollapsibleSection>
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
        <!-- 使用 b-dropdown 替代原生的 dropdown -->
        <BDropdown variant="link" no-caret class="text-white">
          <template #button-content>
            <i class="bi bi-person-circle"></i>
          </template>
          <h6 class="dropdown-header">{{ currentUserRoleLabel }}</h6>
          <b-dropdown-item :to="`/admin/${brandId}/account-settings`">設置</b-dropdown-item>
          <b-dropdown-divider></b-dropdown-divider>
          <b-dropdown-item @click="handleLogout">登出</b-dropdown-item>
        </BDropdown>
      </div>

      <div class="content-wrapper">
        <!-- 桌面版頂部標題欄 -->
        <div
          class="d-none d-md-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
          <h2>{{ getPageTitle() }}</h2>
          <!-- 使用 b-dropdown 替代原生的 dropdown -->
          <BDropdown text="" size="sm" variant="outline-secondary">
            <template #button-content>
              <i class="bi bi-person-circle me-1"></i>
              {{ currentUserRoleLabel }}
            </template>
            <h6 class="dropdown-header">{{ currentBrandName }}</h6>
            <b-dropdown-item :to="`/admin/${brandId}/account-settings`">設置</b-dropdown-item>
            <b-dropdown-divider></b-dropdown-divider>
            <b-dropdown-item @click="handleLogout">登出</b-dropdown-item>
          </BDropdown>
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
import { BDropdown, BDropdownItem, BDropdownDivider } from 'bootstrap-vue-next';
import api from '@/api';
import CollapsibleSection from '@/components/common/CollapsibleSection.vue';

// 路由
const router = useRouter();
const route = useRoute();

// 品牌 ID 從路由中獲取
const brandId = computed(() => route.params.brandId);

// 側邊欄是否顯示 (用於移動版)
const showSidebar = ref(false);

// 狀態變數
const currentUserRole = ref('');
const currentUserRoleLabel = ref('載入中...');
const currentBrandName = ref('載入中...');
const isLoading = ref(true);

// 已展開的折疊項目ID列表
const expandedItems = ref([]);

// 角色標籤對應
const getRoleLabel = (role) => {
  const labels = {
    'primary_system_admin': '系統主管理員',
    'system_admin': '系統管理員',
    'primary_brand_admin': '品牌主管理員',
    'brand_admin': '品牌管理員',
    'primary_store_admin': '店鋪主管理員',
    'store_admin': '店鋪管理員',
    'employee': '員工'
  };
  return labels[role] || role;
};

// 檢查特定折疊項是否應該展開
const isExpanded = (id) => {
  return expandedItems.value.includes(id);
};

// 處理區段折疊/展開
const handleSectionToggle = (sectionId, isExpanded) => {
  const index = expandedItems.value.indexOf(sectionId);

  if (isExpanded && index === -1) {
    // 展開該區段
    expandedItems.value.push(sectionId);
  } else if (!isExpanded && index !== -1) {
    // 折疊該區段
    expandedItems.value.splice(index, 1);
  }
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

// 獲取當前用戶角色
const fetchCurrentUserRole = async () => {
  try {
    const response = await api.adminAuth.checkStatus();
    if (response.loggedIn) {
      currentUserRole.value = response.role;
      currentUserRoleLabel.value = getRoleLabel(response.role);
    } else {
      // 如果未登入，重定向到登入頁面
      router.push('/admin/login');
    }
  } catch (error) {
    console.error('獲取用戶角色失敗:', error);
    currentUserRoleLabel.value = '未知角色';
  }
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
    await api.adminAuth.logout();
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

// 生命週期鉤子
onMounted(() => {
  // 載入用戶角色和品牌資訊
  fetchCurrentUserRole();
  fetchBrandInfo();
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

/* 調整 Bootstrap Vue Next dropdown 在黑色背景上的樣式 */
:deep(.text-white .btn-link) {
  color: rgba(255, 255, 255, 0.8) !important;
}

:deep(.text-white .btn-link:hover) {
  color: #fff !important;
}
</style>
