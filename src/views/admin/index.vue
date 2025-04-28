<template>
  <div class="container-fluid p-0 vh-100 overflow-hidden">
    <div class="row g-0 vh-100">
      <!-- 側邊欄 -->
      <aside class="col-md-3 col-lg-2 d-md-block bg-dark sidebar collapse">
        <div class="d-flex flex-column h-100">
          <div class="sidebar-header p-3 d-flex align-items-center">
            <img src="@/assets/logo.svg" alt="Logo" class="me-2" width="32" height="32" />
            <h1 class="h5 mb-0 text-white">後台管理系統</h1>
          </div>

          <nav class="pt-2 pb-2 flex-grow-1">
            <div class="mb-3">
              <h6 class="sidebar-heading px-3 mt-4 mb-1 text-muted">
                <span>系統管理</span>
              </h6>
              <ul class="nav flex-column">
                <li class="nav-item">
                  <a class="nav-link" :class="{ active: activeMenu === 'dashboard' }" href="#"
                    @click.prevent="setActiveMenu('dashboard')">
                    <i class="bi bi-speedometer2 me-2"></i>
                    首頁儀表板
                  </a>
                </li>
              </ul>
            </div>

            <div class="mb-3">
              <h6 class="sidebar-heading px-3 mt-4 mb-1 text-muted">
                <span>品牌管理</span>
              </h6>
              <ul class="nav flex-column">
                <li class="nav-item">
                  <a class="nav-link" :class="{ active: activeMenu === 'brand-list' }" href="#"
                    @click.prevent="setActiveMenu('brand-list')">
                    <i class="bi bi-building me-2"></i>
                    品牌列表
                  </a>
                </li>
              </ul>
            </div>

            <div class="mb-3">
              <h6 class="sidebar-heading px-3 mt-4 mb-1 text-muted">
                <span>店鋪管理</span>
              </h6>
              <ul class="nav flex-column">
                <li class="nav-item">
                  <a class="nav-link" :class="{ active: activeMenu === 'store-list' }" href="#"
                    @click.prevent="setActiveMenu('store-list')">
                    <i class="bi bi-shop me-2"></i>
                    店鋪列表
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" :class="{ active: activeMenu === 'store-inventory' }" href="#"
                    @click.prevent="setActiveMenu('store-inventory')">
                    <i class="bi bi-box-seam me-2"></i>
                    庫存管理
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" :class="{ active: activeMenu === 'store-menu' }" href="#"
                    @click.prevent="setActiveMenu('store-menu')">
                    <i class="bi bi-menu-button-wide me-2"></i>
                    菜單管理
                  </a>
                </li>
              </ul>
            </div>

            <div class="mb-3">
              <h6 class="sidebar-heading px-3 mt-4 mb-1 text-muted">
                <span>系統設置</span>
              </h6>
              <ul class="nav flex-column">
                <li class="nav-item">
                  <a class="nav-link" :class="{ active: activeMenu === 'admin-users' }" href="#"
                    @click.prevent="setActiveMenu('admin-users')">
                    <i class="bi bi-people me-2"></i>
                    管理員設置
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" :class="{ active: activeMenu === 'account-settings' }" href="#"
                    @click.prevent="setActiveMenu('account-settings')">
                    <i class="bi bi-gear me-2"></i>
                    帳號設置
                  </a>
                </li>
              </ul>
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
      <main class="col-md-9 col-lg-10 ms-sm-auto px-md-3 overflow-auto">
        <div
          class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
          <h2>{{ getMenuTitle() }}</h2>
          <div class="dropdown">
            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" id="dropdownMenuButton"
              data-bs-toggle="dropdown" aria-expanded="false">
              <i class="bi bi-person-circle me-1"></i>
              管理員
            </button>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenuButton">
              <li>
                <h6 class="dropdown-header">超級管理員</h6>
              </li>
              <li><a class="dropdown-item" href="#" @click.prevent="setActiveMenu('account-settings')">設置</a></li>
              <li>
                <hr class="dropdown-divider">
              </li>
              <li><a class="dropdown-item" href="#" @click.prevent="handleLogout">登出</a></li>
            </ul>
          </div>
        </div>

        <div class="content">
          <!-- 根據選中的選單來渲染對應的組件 -->
          <component :is="activeComponent" />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api';

// 模擬組件（實際使用時需要引入真實組件）
const Dashboard = { template: '<div>儀表板內容</div>' };
const BrandList = { template: '<div>品牌列表內容</div>' };
const StoreList = { template: '<div>店鋪列表內容</div>' };
const StoreInventory = { template: '<div>庫存管理內容</div>' };
const StoreMenu = { template: '<div>菜單管理內容</div>' };
const AdminUsers = { template: '<div>管理員設置內容</div>' };
const AccountSettings = { template: '<div>帳號設置內容</div>' };

// 路由
const router = useRouter();

// 當前選中的選單
const activeMenu = ref('dashboard');

// 根據選中的選單返回對應的組件
const activeComponent = computed(() => {
  switch (activeMenu.value) {
    case 'dashboard': return Dashboard;
    case 'brand-list': return BrandList;
    case 'store-list': return StoreList;
    case 'store-inventory': return StoreInventory;
    case 'store-menu': return StoreMenu;
    case 'admin-users': return AdminUsers;
    case 'account-settings': return AccountSettings;
    default: return Dashboard;
  }
});

// 設置當前選中的選單
const setActiveMenu = (menu) => {
  activeMenu.value = menu;
};

// 根據選中的選單返回對應的標題
const getMenuTitle = () => {
  switch (activeMenu.value) {
    case 'dashboard': return '首頁儀表板';
    case 'brand-list': return '品牌列表';
    case 'store-list': return '店鋪列表';
    case 'store-inventory': return '庫存管理';
    case 'store-menu': return '菜單管理';
    case 'admin-users': return '管理員設置';
    case 'account-settings': return '帳號設置';
    default: return '首頁儀表板';
  }
};

// 處理登出
const handleLogout = async () => {
  try {
    await api.auth.logout();
    router.push('/login');
  } catch (error) {
    console.error('登出失敗', error);
  }
};
</script>

<style scoped>
/* Bootstrap 5 已經提供了大部分樣式，只需添加一些自定義樣式 */
body {
  overflow-x: hidden;
  /* 防止頁面水平滾動 */
}

.sidebar {
  background-color: #212529;
}

.sidebar-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-heading {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1rem;
}

.nav-link {
  color: rgba(255, 255, 255, 0.8);
  padding: 0.5rem 1rem;
  margin: 0.2rem 0;
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

.content {
  padding: 1rem;
  min-height: calc(100vh - 70px);
}

/* 確保側邊欄在移動設備上可折疊 */
@media (max-width: 767.98px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 100;
    width: 280px;
    transform: translateX(-100%);
    transition: transform 0.3s ease-in-out;
  }

  .sidebar.show {
    transform: translateX(0);
  }
}
</style>
