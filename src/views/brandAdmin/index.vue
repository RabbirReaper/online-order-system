<template>
  <div class="d-flex app-container">
    <!-- 側邊欄 -->
    <aside class="sidebar bg-dark" :class="{ show: showSidebar }">
      <div class="sidebar-wrapper">
        <div class="sidebar-header p-3 d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center">
            <img src="@/assets/logo.svg" alt="Logo" class="me-2" width="32" height="32" />
            <h1 class="h5 mb-0 text-white d-none d-lg-block sidebar-title">品牌管理系統</h1>
            <h1 class="h6 mb-0 text-white d-none d-md-block d-lg-none sidebar-title-compact">
              品牌系統
            </h1>
          </div>
          <button class="btn btn-link text-white d-md-none" @click="toggleSidebar">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <nav class="sidebar-nav flex-grow-1">
          <!-- 儀表板區塊 -->
          <div class="mb-1">
            <router-link
              class="nav-link px-3"
              :to="`/admin/${brandId}`"
              exact-active-class="active"
            >
              <i class="bi bi-speedometer2 me-2"></i>
              儀表板
            </router-link>
          </div>

          <!-- 店鋪管理 - 需要店鋪管理員(2)以上權限才顯示整個區塊 -->
          <div class="mb-1" v-if="hasRole(PERMISSIONS.STORE_ADMIN)">
            <CollapsibleSection
              title="店鋪管理"
              :initialExpanded="isExpanded('storeManagement')"
              @toggle="(expanded) => handleSectionToggle('storeManagement', expanded)"
            >
              <template #icon><i class="bi bi-shop me-2"></i></template>

              <!-- 店鋪列表 - 權限等級 2 -->
              <router-link
                class="nav-link ps-4 py-2"
                :to="`/admin/${brandId}/stores`"
                v-if="hasRole(PERMISSIONS.STORE_ADMIN)"
              >
                <i class="bi bi-list-ul me-2"></i>
                店鋪列表
              </router-link>

              <!-- 庫存狀態 - 權限等級 2 -->
              <router-link
                class="nav-link ps-4 py-2"
                :to="`/admin/${brandId}/inventory`"
                v-if="hasRole(PERMISSIONS.STORE_ADMIN)"
              >
                <i class="bi bi-box2 me-2"></i>
                庫存狀態
              </router-link>
            </CollapsibleSection>
          </div>

          <!-- 菜單管理 - 需要店鋪管理員(2)以上權限才顯示整個區塊 -->
          <div class="mb-1" v-if="hasRole(PERMISSIONS.STORE_ADMIN)">
            <CollapsibleSection
              title="菜單管理"
              :initialExpanded="isExpanded('menuManagement')"
              @toggle="(expanded) => handleSectionToggle('menuManagement', expanded)"
            >
              <template #icon><i class="bi bi-menu-button-wide me-2"></i></template>

              <!-- 菜單列表 - 權限等級 2 -->
              <router-link
                class="nav-link ps-4 py-2"
                :to="`/admin/${brandId}/menus`"
                v-if="hasRole(PERMISSIONS.STORE_ADMIN)"
              >
                <i class="bi bi-list-check me-2"></i>
                菜單列表
              </router-link>
            </CollapsibleSection>
          </div>

          <!-- 餐點管理 - 需要店鋪管理員(2)以上權限才顯示整個區塊 -->
          <div class="mb-1" v-if="hasRole(PERMISSIONS.STORE_ADMIN)">
            <CollapsibleSection
              title="餐點管理"
              :initialExpanded="isExpanded('dishManagement')"
              @toggle="(expanded) => handleSectionToggle('dishManagement', expanded)"
            >
              <template #icon><i class="bi bi-cup-hot me-2"></i></template>

              <!-- 餐點列表 - 權限等級 4 -->
              <router-link
                class="nav-link ps-4 py-2"
                :to="`/admin/${brandId}/dishes/template`"
                v-if="hasRole(PERMISSIONS.BRAND_ADMIN)"
              >
                <i class="bi bi-grid me-2"></i>
                餐點列表
              </router-link>

              <!-- 建立餐點模板 - 權限等級 4 -->
              <router-link
                class="nav-link ps-4 py-2"
                :to="`/admin/${brandId}/dishes/template/create`"
                v-if="hasRole(PERMISSIONS.BRAND_ADMIN)"
              >
                <i class="bi bi-card-list me-2"></i>
                建立餐點模板
              </router-link>

              <!-- 選項類別 - 權限等級 4 -->
              <router-link
                class="nav-link ps-4 py-2"
                :to="`/admin/${brandId}/option-categories`"
                v-if="hasRole(PERMISSIONS.BRAND_ADMIN)"
              >
                <i class="bi bi-tags me-2"></i>
                選項類別
              </router-link>

              <!-- 選項管理 - 權限等級 4 -->
              <router-link
                class="nav-link ps-4 py-2"
                :to="`/admin/${brandId}/options`"
                v-if="hasRole(PERMISSIONS.BRAND_ADMIN)"
              >
                <i class="bi bi-list-check me-2"></i>
                選項管理
              </router-link>
            </CollapsibleSection>
          </div>

          <!-- 訂單管理 - 需要店鋪管理員(2)以上權限才顯示整個區塊 -->
          <div class="mb-1" v-if="hasRole(PERMISSIONS.STORE_ADMIN)">
            <CollapsibleSection
              title="訂單管理"
              :initialExpanded="isExpanded('orderManagement')"
              @toggle="(expanded) => handleSectionToggle('orderManagement', expanded)"
            >
              <template #icon><i class="bi bi-receipt me-2"></i></template>

              <!-- 訂單列表 - 權限等級 2 -->
              <router-link
                class="nav-link ps-4 py-2"
                :to="`/admin/${brandId}/orders`"
                v-if="hasRole(PERMISSIONS.STORE_ADMIN)"
              >
                <i class="bi bi-list-ul me-2"></i>
                訂單列表
              </router-link>

              <!-- 銷售報表 - 權限等級 4 -->
              <router-link
                class="nav-link ps-4 py-2"
                :to="`/admin/${brandId}/orders/reports`"
                v-if="hasRole(PERMISSIONS.BRAND_ADMIN)"
              >
                <i class="bi bi-bar-chart me-2"></i>
                銷售報表
              </router-link>
            </CollapsibleSection>
          </div>

          <!-- 促銷管理 - 需要品牌管理員(4)以上權限才顯示整個區塊 -->
          <div class="mb-1" v-if="hasRole(PERMISSIONS.BRAND_ADMIN)">
            <CollapsibleSection
              title="促銷管理"
              :initialExpanded="isExpanded('promotionManagement')"
              @toggle="(expanded) => handleSectionToggle('promotionManagement', expanded)"
            >
              <template #icon><i class="bi bi-megaphone me-2"></i></template>

              <!-- 優惠券 - 權限等級 4 -->
              <router-link
                class="nav-link ps-4 py-2"
                :to="`/admin/${brandId}/coupons`"
                v-if="hasRole(PERMISSIONS.BRAND_ADMIN)"
              >
                <i class="bi bi-percent me-2"></i>
                優惠券
              </router-link>

              <!-- 兌換券 - 權限等級 4 -->
              <router-link
                class="nav-link ps-4 py-2"
                :to="`/admin/${brandId}/vouchers`"
                v-if="hasRole(PERMISSIONS.BRAND_ADMIN)"
              >
                <i class="bi bi-ticket-detailed me-2"></i>
                兌換券
              </router-link>

              <!-- 包裝商品 - 權限等級 4 -->
              <router-link
                class="nav-link ps-4 py-2"
                :to="`/admin/${brandId}/bundles`"
                v-if="hasRole(PERMISSIONS.BRAND_ADMIN)"
              >
                <i class="bi bi-box-seam me-2"></i>
                包裝商品
              </router-link>

              <!-- 點數規則 - 權限等級 4 -->
              <router-link
                class="nav-link ps-4 py-2"
                :to="`/admin/${brandId}/point-rules`"
                v-if="hasRole(PERMISSIONS.BRAND_ADMIN)"
              >
                <i class="bi bi-coin me-2"></i>
                點數規則
              </router-link>
            </CollapsibleSection>
          </div>

          <!-- 用戶管理 - 需要店鋪管理員(2)以上權限才顯示整個區塊 -->
          <div class="mb-1" v-if="hasRole(PERMISSIONS.STORE_ADMIN)">
            <CollapsibleSection
              title="用戶管理"
              :initialExpanded="isExpanded('userManagement')"
              @toggle="(expanded) => handleSectionToggle('userManagement', expanded)"
            >
              <template #icon><i class="bi bi-people me-2"></i></template>

              <!-- 店鋪管理員 - 權限等級 3 -->
              <router-link
                class="nav-link ps-4 py-2"
                :to="`/admin/${brandId}/store-admins`"
                v-if="hasRole(PERMISSIONS.PRIMARY_STORE_ADMIN)"
              >
                <i class="bi bi-person-workspace me-2"></i>
                店鋪管理員
              </router-link>

              <!-- 顧客管理 - 權限等級 2 -->
              <router-link
                class="nav-link ps-4 py-2"
                :to="`/admin/${brandId}/customers`"
                v-if="hasRole(PERMISSIONS.STORE_ADMIN)"
              >
                <i class="bi bi-person-vcard me-2"></i>
                顧客管理
              </router-link>
            </CollapsibleSection>
          </div>

          <!-- 系統設置 -->
          <div class="mb-1">
            <CollapsibleSection
              title="系統設置"
              :initialExpanded="isExpanded('systemSettings')"
              @toggle="(expanded) => handleSectionToggle('systemSettings', expanded)"
            >
              <template #icon><i class="bi bi-gear me-2"></i></template>

              <router-link class="nav-link ps-4 py-2" :to="`/admin/${brandId}/account-settings`">
                <i class="bi bi-person-gear me-2"></i>
                帳號設置
              </router-link>
            </CollapsibleSection>
          </div>
        </nav>

        <!-- 固定在底部的登出按鈕 -->
        <div class="sidebar-footer">
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
        class="d-flex d-md-none align-items-center justify-content-between bg-dark text-white p-3 sticky-top mobile-top-nav"
      >
        <div class="d-flex align-items-center">
          <button class="btn btn-link text-white me-2" @click="toggleSidebar">
            <i class="bi bi-list"></i>
          </button>
          <h1 class="h5 mb-0">品牌管理系統</h1>
        </div>
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
          class="d-none d-md-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom"
        >
          <h2>{{ getPageTitle() }}</h2>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { BDropdown, BDropdownItem, BDropdownDivider } from 'bootstrap-vue-next'
import api from '@/api'
import CollapsibleSection from '@/components/common/CollapsibleSection.vue'
import { usePermissions } from '@/composables/usePermissions'

// 路由
const router = useRouter()
const route = useRoute()

// 引入權限管理功能
const {
  hasRole,
  PERMISSIONS,
  fetchUserPermissions,
  getRoleDisplayName: getPermissionRoleLabel,
  currentUserRole: permissionUserRole,
} = usePermissions()

// 品牌 ID 從路由中獲取
const brandId = computed(() => route.params.brandId)

// 側邊欄是否顯示 (用於移動版)
const showSidebar = ref(false)

// 狀態變數 (避免與 usePermissions 衝突，使用不同的變數名)
const localUserRole = ref('')
const currentUserRoleLabel = ref('載入中...')
const currentBrandName = ref('載入中...')
const isLoading = ref(true)

// 已展開的折疊項目ID列表
const expandedItems = ref([])

// 設置動態視窗高度
const setViewportHeight = () => {
  const vh = window.innerHeight * 0.01
  document.documentElement.style.setProperty('--vh', `${vh}px`)
}

// 角色標籤對應 (保持原有的邏輯，但使用不同的函數名避免衝突)
const getLocalRoleLabel = (role) => {
  const labels = {
    primary_system_admin: '系統主管理員',
    system_admin: '系統管理員',
    primary_brand_admin: '品牌主管理員',
    brand_admin: '品牌管理員',
    primary_store_admin: '店鋪主管理員',
    store_admin: '店鋪管理員',
    employee: '員工',
  }
  return labels[role] || role
}

// 檢查特定折疊項是否應該展開
const isExpanded = (id) => {
  return expandedItems.value.includes(id)
}

// 處理區段折疊/展開
const handleSectionToggle = (sectionId, isExpanded) => {
  const index = expandedItems.value.indexOf(sectionId)

  if (isExpanded && index === -1) {
    expandedItems.value.push(sectionId)
  } else if (!isExpanded && index !== -1) {
    expandedItems.value.splice(index, 1)
  }
}

// 切換側邊欄顯示
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

// 關閉側邊欄當選擇一個項目時
const closeSidebarOnMobile = () => {
  if (window.innerWidth < 768) {
    showSidebar.value = false
  }
}

// 根據當前路由名稱獲取頁面標題
const getPageTitle = () => {
  const routePath = route.path

  if (routePath.includes('/stores/create')) return '新增店鋪'
  if (routePath.includes('/stores/edit')) return '編輯店鋪'
  if (routePath.includes('/stores/detail')) return '店鋪詳情'
  if (routePath.includes('/stores')) return '店鋪管理'
  if (routePath.includes('/inventory')) return '庫存管理'
  if (routePath.includes('/menus')) return '菜單管理'
  if (routePath.includes('/dishes')) return '餐點管理'
  if (routePath.includes('/orders/reports')) return '銷售報表'
  if (routePath.includes('/orders')) return '訂單管理'
  if (routePath.includes('/coupons')) return '優惠券管理'
  if (routePath.includes('/vouchers')) return '兌換券管理'
  if (routePath.includes('/bundles')) return '包裝商品管理'
  if (routePath.includes('/point-rules')) return '點數規則管理'
  if (routePath.includes('/store-admins')) return '店鋪管理員'
  if (routePath.includes('/customers')) return '顧客管理'
  if (routePath.includes('/account-settings')) return '帳號設置'

  return '品牌儀表板'
}

// 獲取當前用戶角色 (整合兩個權限系統)
const fetchCurrentUserRole = async () => {
  try {
    const response = await api.adminAuth.checkStatus()
    if (response.loggedIn) {
      localUserRole.value = response.role
      currentUserRoleLabel.value = getLocalRoleLabel(response.role)

      // 同時更新 usePermissions 的狀態
      await fetchUserPermissions()
    } else {
      router.push('/admin/login')
    }
  } catch (error) {
    console.error('獲取用戶角色失敗:', error)
    currentUserRoleLabel.value = '未知角色'
  }
}

// 獲取品牌資訊
const fetchBrandInfo = async () => {
  if (!brandId.value) return

  isLoading.value = true

  try {
    const response = await api.brand.getBrandById(brandId.value)
    if (response && response.brand) {
      currentBrandName.value = response.brand.name
    }
  } catch (error) {
    console.error('獲取品牌資訊失敗', error)
  } finally {
    isLoading.value = false
  }
}

// 處理登出
const handleLogout = async () => {
  try {
    await api.adminAuth.logout()
    // 登出後重定向到當前品牌的登入頁面
    router.push(`/admin/${brandId.value}/login`)
  } catch (error) {
    console.error('登出失敗', error)
    // 即使登出 API 失敗，也重定向到登入頁面
    router.push(`/admin/${brandId.value}/login`)
  }
}

// 監聽路由變化
watch(
  () => route.path,
  () => {
    closeSidebarOnMobile()
  },
)

// 監聽品牌ID變化
watch(
  () => brandId.value,
  (newId, oldId) => {
    if (newId !== oldId) {
      fetchBrandInfo()
    }
  },
)

// 生命週期鉤子
onMounted(async () => {
  // 設置動態視窗高度
  setViewportHeight()

  // 監聽視窗大小變化
  window.addEventListener('resize', setViewportHeight)
  window.addEventListener('orientationchange', () => {
    setTimeout(setViewportHeight, 100)
  })

  // 載入用戶角色和品牌資訊
  await fetchCurrentUserRole()
  await fetchBrandInfo()
})
</script>

<style scoped>
/* CSS 自定義屬性用於動態視窗高度 */
:root {
  --vh: 1vh;
}

/* 全局布局 */
.app-container {
  width: 100%;
  height: calc(var(--vh, 1vh) * 100);
  overflow: hidden;
}

/* 側邊欄樣式 */
.sidebar {
  width: 280px;
  height: calc(var(--vh, 1vh) * 100);
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  background-color: #212529;
  z-index: 1030;
  transition:
    transform 0.3s ease-in-out,
    width 0.3s ease-in-out;
}

.sidebar-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: calc(var(--vh, 1vh) * 100);
}

.sidebar-header {
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  padding: 0.5rem 0;
}

.sidebar-footer {
  flex-shrink: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem;
  background-color: #212529;
}

/* 主要內容區域 */
.main-content {
  flex: 1;
  height: calc(var(--vh, 1vh) * 100);
  margin-left: 280px;
  display: flex;
  flex-direction: column;
  width: calc(100% - 280px);
  transition:
    margin-left 0.3s ease-in-out,
    width 0.3s ease-in-out;
}

.content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 0 1rem;
}

.content {
  min-height: calc(100vh - 70px);
}

/* 側邊欄標題樣式 */
.sidebar-title-compact {
  display: none;
}

/* 導航菜單樣式 */
.nav-link {
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.2s;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  margin: 0.125rem 0.5rem;
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

/* 中等屏幕優化 (1400px以下) */
@media (max-width: 1399.98px) and (min-width: 768px) {
  .sidebar {
    width: 220px;
  }

  .main-content {
    margin-left: 220px;
    width: calc(100% - 220px);
  }

  /* 側邊欄標題調整 */
  .sidebar-title {
    display: none !important;
  }

  .sidebar-title-compact {
    display: block !important;
    font-size: 0.95rem;
  }

  .sidebar-footer {
    padding: 0.75rem;
  }

  .sidebar-footer .btn {
    font-size: 0.9rem;
    padding: 0.5rem;
  }

  /* CollapsibleSection 標題調整 */
  :deep(.collapsible-section .section-title) {
    font-size: 0.9rem;
  }
}

/* 大屏幕樣式 (1400px以上) */
@media (min-width: 1400px) {
  .sidebar-title-compact {
    display: none !important;
  }
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

  /* 移動版恢復完整標題 */
  .sidebar-title {
    display: block !important;
  }

  .sidebar-title-compact {
    display: none !important;
  }
}

/* 平板橫向模式優化 */
@media (max-width: 1024px) and (min-width: 768px) and (orientation: landscape) {
  .sidebar {
    width: 200px;
  }

  .main-content {
    margin-left: 200px;
    width: calc(100% - 200px);
  }

  .sidebar-title-compact {
    font-size: 0.9rem;
  }
}

/* 桌面版側邊欄 (1400px以上) */
@media (min-width: 1400px) {
  .sidebar {
    transform: none !important;
    width: 280px;
  }

  .main-content {
    margin-left: 280px;
    width: calc(100% - 280px);
  }

  .sidebar-title-compact {
    display: none !important;
  }
}

/* 中大型桌面版側邊欄 (768px-1399px) */
@media (min-width: 768px) and (max-width: 1399.98px) {
  .sidebar {
    transform: none !important;
  }
}

/* 滾動條樣式 */
.sidebar-nav::-webkit-scrollbar {
  width: 6px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* 確保在所有平板設備上都能正確顯示 */
@media (max-width: 1024px) and (orientation: portrait) {
  .app-container,
  .sidebar,
  .main-content {
    height: calc(var(--vh, 1vh) * 100);
    max-height: calc(var(--vh, 1vh) * 100);
  }
}

@media (max-width: 1024px) and (orientation: landscape) {
  .app-container,
  .sidebar,
  .main-content {
    height: calc(var(--vh, 1vh) * 100);
    max-height: calc(var(--vh, 1vh) * 100);
  }
}
</style>
