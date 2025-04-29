<template>
  <div class="container-fluid p-0 vh-100 overflow-hidden">
    <div class="row g-0 vh-100">
      <!-- 側邊欄 -->
      <aside class="col-md-3 col-lg-2 d-md-block bg-dark sidebar collapse">
        <div class="d-flex flex-column h-100">
          <div class="sidebar-header p-3 d-flex align-items-center">
            <img src="@/assets/logo.svg" alt="Logo" class="me-2" width="32" height="32" />
            <h1 class="h5 mb-0 text-white">店鋪管理系統</h1>
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
                    儀表板
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
                <span>餐點管理</span>
              </h6>
              <ul class="nav flex-column">
                <li class="nav-item">
                  <a class="nav-link" :class="{ active: activeMenu === 'dish-templates' }" href="#"
                    @click.prevent="setActiveMenu('dish-templates')">
                    <i class="bi bi-card-list me-2"></i>
                    餐點模板
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" :class="{ active: activeMenu === 'option-categories' }" href="#"
                    @click.prevent="setActiveMenu('option-categories')">
                    <i class="bi bi-tags me-2"></i>
                    選項類別
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" :class="{ active: activeMenu === 'options' }" href="#"
                    @click.prevent="setActiveMenu('options')">
                    <i class="bi bi-list-check me-2"></i>
                    選項管理
                  </a>
                </li>
              </ul>
            </div>

            <div class="mb-3">
              <h6 class="sidebar-heading px-3 mt-4 mb-1 text-muted">
                <span>訂單管理</span>
              </h6>
              <ul class="nav flex-column">
                <li class="nav-item">
                  <a class="nav-link" :class="{ active: activeMenu === 'orders' }" href="#"
                    @click.prevent="setActiveMenu('orders')">
                    <i class="bi bi-receipt me-2"></i>
                    訂單列表
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" :class="{ active: activeMenu === 'order-reports' }" href="#"
                    @click.prevent="setActiveMenu('order-reports')">
                    <i class="bi bi-bar-chart me-2"></i>
                    銷售報表
                  </a>
                </li>
              </ul>
            </div>

            <div class="mb-3">
              <h6 class="sidebar-heading px-3 mt-4 mb-1 text-muted">
                <span>促銷管理</span>
              </h6>
              <ul class="nav flex-column">
                <li class="nav-item">
                  <a class="nav-link" :class="{ active: activeMenu === 'coupons' }" href="#"
                    @click.prevent="setActiveMenu('coupons')">
                    <i class="bi bi-ticket-perforated me-2"></i>
                    優惠券
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" :class="{ active: activeMenu === 'point-rules' }" href="#"
                    @click.prevent="setActiveMenu('point-rules')">
                    <i class="bi bi-coin me-2"></i>
                    點數規則
                  </a>
                </li>
              </ul>
            </div>

            <div class="mb-3">
              <h6 class="sidebar-heading px-3 mt-4 mb-1 text-muted">
                <span>用戶管理</span>
              </h6>
              <ul class="nav flex-column">
                <li class="nav-item">
                  <a class="nav-link" :class="{ active: activeMenu === 'store-admins' }" href="#"
                    @click.prevent="setActiveMenu('store-admins')">
                    <i class="bi bi-people me-2"></i>
                    店鋪管理員
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" :class="{ active: activeMenu === 'customers' }" href="#"
                    @click.prevent="setActiveMenu('customers')">
                    <i class="bi bi-person-vcard me-2"></i>
                    顧客管理
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
              {{ currentUserRole }}
            </button>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenuButton">
              <li>
                <h6 class="dropdown-header">{{ currentStoreName }}</h6>
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
import { ref, computed, defineAsyncComponent, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api';

// 懶加載組件
const Dashboard = defineAsyncComponent(() =>
  Promise.resolve({ template: '<div class="alert alert-info">歡迎使用店鋪管理系統儀表板</div>' }));
const StoreList = defineAsyncComponent(() =>
  Promise.resolve({ template: '<div class="alert alert-info">店鋪列表功能（待開發）</div>' }));
const StoreInventory = defineAsyncComponent(() =>
  Promise.resolve({ template: '<div class="alert alert-info">庫存管理功能（待開發）</div>' }));
const StoreMenu = defineAsyncComponent(() =>
  Promise.resolve({ template: '<div class="alert alert-info">菜單管理功能（待開發）</div>' }));
const DishTemplates = defineAsyncComponent(() =>
  Promise.resolve({ template: '<div class="alert alert-info">餐點模板功能（待開發）</div>' }));
const OptionCategories = defineAsyncComponent(() =>
  Promise.resolve({ template: '<div class="alert alert-info">選項類別功能（待開發）</div>' }));
const Options = defineAsyncComponent(() =>
  Promise.resolve({ template: '<div class="alert alert-info">選項管理功能（待開發）</div>' }));
const Orders = defineAsyncComponent(() =>
  Promise.resolve({ template: '<div class="alert alert-info">訂單列表功能（待開發）</div>' }));
const OrderReports = defineAsyncComponent(() =>
  Promise.resolve({ template: '<div class="alert alert-info">銷售報表功能（待開發）</div>' }));
const Coupons = defineAsyncComponent(() =>
  Promise.resolve({ template: '<div class="alert alert-info">優惠券功能（待開發）</div>' }));
const PointRules = defineAsyncComponent(() =>
  Promise.resolve({ template: '<div class="alert alert-info">點數規則功能（待開發）</div>' }));
const StoreAdmins = defineAsyncComponent(() =>
  Promise.resolve({ template: '<div class="alert alert-info">店鋪管理員功能（待開發）</div>' }));
const Customers = defineAsyncComponent(() =>
  Promise.resolve({ template: '<div class="alert alert-info">顧客管理功能（待開發）</div>' }));
const AccountSettings = defineAsyncComponent(() =>
  Promise.resolve({ template: '<div class="alert alert-info">帳號設置功能（待開發）</div>' }));

// 路由
const router = useRouter();

// 當前選中的選單
const activeMenu = ref('dashboard');

// 當前使用者角色和店鋪名稱
const currentUserRole = ref('店鋪管理員');
const currentStoreName = ref('好味餐廳 - 中正店');

// 根據選中的選單返回對應的組件
const activeComponent = computed(() => {
  switch (activeMenu.value) {
    case 'dashboard': return Dashboard;
    case 'store-list': return StoreList;
    case 'store-inventory': return StoreInventory;
    case 'store-menu': return StoreMenu;
    case 'dish-templates': return DishTemplates;
    case 'option-categories': return OptionCategories;
    case 'options': return Options;
    case 'orders': return Orders;
    case 'order-reports': return OrderReports;
    case 'coupons': return Coupons;
    case 'point-rules': return PointRules;
    case 'store-admins': return StoreAdmins;
    case 'customers': return Customers;
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
    case 'dashboard': return '儀表板';
    case 'store-list': return '店鋪列表';
    case 'store-inventory': return '庫存管理';
    case 'store-menu': return '菜單管理';
    case 'dish-templates': return '餐點模板';
    case 'option-categories': return '選項類別';
    case 'options': return '選項管理';
    case 'orders': return '訂單列表';
    case 'order-reports': return '銷售報表';
    case 'coupons': return '優惠券';
    case 'point-rules': return '點數規則';
    case 'store-admins': return '店鋪管理員';
    case 'customers': return '顧客管理';
    case 'account-settings': return '帳號設置';
    default: return '儀表板';
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

// 生命週期鉤子
onMounted(() => {
  // 可以在這裡查詢用戶資訊、權限等
  // 例如根據角色動態顯示不同菜單項

  // 模擬獲取用戶資訊
  setTimeout(() => {
    // 實際環境中應該是從 API 或 store 中獲取
    const userInfo = {
      role: 'store_admin',
      permissions: ['order_system', 'view_reports', 'edit_backend'],
      storeName: '好味餐廳 - 中正店'
    };

    currentUserRole.value = userInfo.role === 'store_admin' ? '店鋪管理員' :
      userInfo.role === 'brand_admin' ? '品牌管理員' : '管理員';
    currentStoreName.value = userInfo.storeName;

  }, 500);
});
</script>

<style scoped>
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
