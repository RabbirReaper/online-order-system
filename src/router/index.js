import { createRouter, createWebHistory } from 'vue-router'
import api from '@/api'
import Placeholder from '@/components/common/Placeholder.vue'
import { useAuthStore } from '@/stores/customerAuth'

// 檢查管理員登入狀態
const checkAdminAuth = async () => {
  try {
    const response = await api.adminAuth.checkStatus()
    console.log('管理員登入狀態:', response)
    return response;
  } catch (error) {
    console.error('檢查管理員登入狀態失敗', error)
    return { loggedIn: false, role: null, brand: null, store: null }
  }
}

// 統一的用戶認證檢查 - 使用 authStore
const checkUserAuthStatus = async () => {
  const authStore = useAuthStore();

  // 確保有brandId
  if (!authStore.currentBrandId) {
    authStore.initializeBrandId(); // 從sessionStorage恢復
  }

  if (!authStore.currentBrandId) {
    return { loggedIn: false };
  }

  try {
    const result = await authStore.checkAuthStatus();
    return result;
  } catch (error) {
    console.error('檢查用戶登入狀態失敗', error);
    return { loggedIn: false };
  }
};

// 認證守衛 - 檢查用戶是否已登入
const requireAuth = async (to, from, next) => {
  const { loggedIn } = await checkUserAuthStatus();

  if (loggedIn) {
    next(); // 允許訪問
  } else {
    // 跳轉到登入頁面並保存原始請求路徑
    next({
      path: '/auth/login',
      query: { redirect: to.fullPath }
    });
  }
};

// 非認證守衛 - 檢查用戶是否未登入
const requireNoAuth = async (to, from, next) => {
  const { loggedIn } = await checkUserAuthStatus();

  if (!loggedIn) {
    next(); // 允許訪問
  } else {
    // 如果已登入，跳轉到會員中心
    next('/member');
  }
};

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [

    // 管理員認證
    {
      path: '/admin/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
    },

    // Boss 後台 (系統管理員)
    {
      path: '/boss',
      component: () => import('@/views/boss/index.vue'),
      meta: { requiresAdminAuth: true, role: ['primary_system_admin', 'system_admin'] },
      children: [
        {
          path: '',
          redirect: { name: 'brand-list' }
        },
        // 品牌管理路由
        {
          path: 'brands',
          name: 'brand-list',
          component: () => import('@/components/Boss/Brand/List.vue')
        },
        {
          path: 'brands/create',
          name: 'brand-create',
          component: () => import('@/components/Boss/Brand/Form.vue')
        },
        {
          path: 'brands/edit/:id',
          name: 'brand-edit',
          component: () => import('@/components/Boss/Brand/Form.vue'),
          props: true
        },
        {
          path: 'brands/detail/:id',
          name: 'brand-detail',
          component: () => import('@/components/Boss/Brand/Detail.vue'),
          props: true
        },
        // 管理員管理路由
        {
          path: 'admins',
          name: 'boss-admin-list',
          component: () => import('@/components/Boss/AdminManager/List.vue')
        },
        {
          path: 'admins/create',
          name: 'boss-admin-create',
          component: () => import('@/components/Boss/AdminManager/Form.vue')
        },
        {
          path: 'admins/edit/:id',
          name: 'boss-admin-edit',
          component: () => import('@/components/Boss/AdminManager/Form.vue'),
          props: true
        },
        // 系統設置路由
        {
          path: 'settings',
          name: 'system-settings',
          component: Placeholder,
          props: {
            title: '系統設置功能',
            message: '這個區塊目前尚未開發，請稍後再試。'
          }
        },
        // Boss 路由中的帳號設置 (大約在第 89 行)
        {
          path: 'account',
          name: 'account-settings',
          component: () => import('@/components/Boss/Account/Settings.vue'),
          meta: { requiresAuth: true, title: '帳號設置' }
        }
      ]
    },

    // 品牌管理員後台
    {
      path: '/admin/:brandId',
      component: () => import('@/views/brandAdmin/index.vue'),
      meta: { requiresAdminAuth: true },
      props: true,
      children: [
        {
          path: '',
          name: 'brand-admin-dashboard',
          component: () => import('@/components/BrandAdmin/DashBoard/Dashboard.vue')
        },

        // 店鋪管理路由
        {
          path: 'stores',
          name: 'brand-admin-stores',
          component: () => import('@/components/BrandAdmin/Store/StoreList.vue')
        },
        {
          path: 'stores/create',
          name: 'brand-admin-store-create',
          component: () => import('@/components/BrandAdmin/Store/StoreForm.vue')
        },
        {
          path: 'stores/edit/:id',
          name: 'brand-admin-store-edit',
          component: () => import('@/components/BrandAdmin/Store/StoreForm.vue'),
          props: true
        },
        {
          path: 'stores/detail/:id',
          name: 'brand-admin-store-detail',
          component: () => import('@/components/BrandAdmin/Store/StoreDetail.vue'),
          props: true
        },

        // 菜單管理路由
        {
          path: 'menus',
          name: 'brand-admin-menus',
          component: () => import('@/components/BrandAdmin/Menu/MenuStoreSelect.vue'),
          meta: { requiresAuth: true, title: '選擇店鋪' }
        },
        {
          path: 'menus/store/:storeId',
          name: 'brand-admin-store-menu',
          component: () => import('@/components/BrandAdmin/Menu/MenuList.vue'),
          meta: { requiresAuth: true, title: '店鋪菜單' }
        },
        {
          path: 'menus/create/:storeId',
          name: 'brand-admin-menu-create',
          component: () => import('@/components/BrandAdmin/Menu/MenuForm.vue'),
          meta: { requiresAuth: true, title: '新增菜單' }
        },
        {
          path: 'menus/edit/:storeId/:menuId',
          name: 'brand-admin-menu-edit',
          component: () => import('@/components/BrandAdmin/Menu/MenuForm.vue'),
          meta: { requiresAuth: true, title: '編輯菜單' }
        },
        {
          path: 'menus/detail/:storeId/:menuId',
          name: 'brand-admin-menu-detail',
          component: () => import('@/components/BrandAdmin/Menu/MenuDetail.vue'),
          meta: { requiresAuth: true, title: '菜單詳情' }
        },

        // 餐點模板路由
        {
          path: 'dishes/template',
          name: 'DishTemplateList',
          component: () => import('@/components/BrandAdmin/Dish/DishTemplate/List.vue'),
          meta: { requiresAuth: true, title: '餐點模板' }
        },
        {
          path: 'dishes/template/create',
          name: 'DishTemplateCreate',
          component: () => import('@/components/BrandAdmin/Dish/DishTemplate/Form.vue'),
          meta: { requiresAuth: true, title: '新增餐點' }
        },
        {
          path: 'dishes/template/edit/:id',
          name: 'DishTemplateEdit',
          component: () => import('@/components/BrandAdmin/Dish/DishTemplate/Form.vue'),
          meta: { requiresAuth: true, title: '編輯餐點' }
        },
        {
          path: 'dishes/template/detail/:id',
          name: 'DishTemplateDetail',
          component: () => import('@/components/BrandAdmin/Dish/DishTemplate/Detail.vue'),
          meta: { requiresAuth: true, title: '餐點詳情' }
        },

        // 選項類別路由
        {
          path: 'option-categories',
          name: 'brand-admin-option-categories',
          component: () => import('@/components/BrandAdmin/Dish/OptionCategory/List.vue'),
          meta: { requiresAuth: true, title: '選項類別管理' }
        },
        {
          path: 'option-categories/create',
          name: 'brand-admin-option-category-create',
          component: () => import('@/components/BrandAdmin/Dish/OptionCategory/Form.vue'),
          meta: { requiresAuth: true, title: '新增選項類別' }
        },
        {
          path: 'option-categories/edit/:id',
          name: 'brand-admin-option-category-edit',
          component: () => import('@/components/BrandAdmin/Dish/OptionCategory/Form.vue'),
          props: true,
          meta: { requiresAuth: true, title: '編輯選項類別' }
        },
        {
          path: 'option-categories/detail/:id',
          name: 'brand-admin-option-category-detail',
          component: () => import('@/components/BrandAdmin/Dish/OptionCategory/Detail.vue'),
          props: true,
          meta: { requiresAuth: true, title: '選項類別詳情' }
        },

        // 選項管理路由
        {
          path: 'options',
          name: 'brand-admin-options',
          component: () => import('@/components/BrandAdmin/Dish/Option/List.vue'),
          meta: { requiresAuth: true, title: '選項管理' }
        },
        {
          path: 'options/create',
          name: 'brand-admin-option-create',
          component: () => import('@/components/BrandAdmin/Dish/Option/Form.vue'),
          meta: { requiresAuth: true, title: '新增選項' }
        },
        {
          path: 'options/edit/:id',
          name: 'brand-admin-option-edit',
          component: () => import('@/components/BrandAdmin/Dish/Option/Form.vue'),
          props: true,
          meta: { requiresAuth: true, title: '編輯選項' }
        },

        // 庫存管理
        {
          path: 'inventory',
          name: 'brand-admin-inventory',
          component: () => import('@/components/BrandAdmin/Inventory/StoreSelect.vue'),
          meta: { requiresAuth: true, title: '選擇店鋪' }
        },
        {
          path: 'inventory/store/:storeId',
          name: 'brand-admin-store-inventory',
          component: () => import('@/components/BrandAdmin/Inventory/StockStatus.vue'),
          meta: { requiresAuth: true, title: '店鋪庫存管理' }
        },
        {
          path: 'inventory/store/:storeId/detail/:id',
          name: 'brand-admin-inventory-detail',
          component: () => import('@/components/BrandAdmin/Inventory/StockDetail.vue'),
          meta: { requiresAuth: true, title: '庫存詳情' }
        },
        {
          path: 'inventory/logs',
          name: 'brand-admin-inventory-logs',
          component: () => import('@/components/BrandAdmin/Inventory/StockLog.vue'),
          meta: { requiresAuth: true, title: '庫存變更記錄' }
        },
        // 訂單管理路由
        {
          path: 'orders',
          name: 'brand-admin-orders',
          component: () => import('@/components/BrandAdmin/Order/OrderStoreSelect.vue'),
          meta: { requiresAuth: true, title: '選擇店鋪' }
        },
        {
          path: 'orders/store/:storeId',
          name: 'brand-admin-store-orders',
          component: () => import('@/components/BrandAdmin/Order/OrderList.vue'),
          meta: { requiresAuth: true, title: '訂單列表' }
        },
        {
          path: 'orders/reports',
          name: 'brand-admin-reports',
          component: () => import('@/components/BrandAdmin/Order/Reports/ReportsView.vue'),
          meta: { requiresAuth: true, title: '銷售報表' }
        },
        // 促銷管理 - 優惠券
        {
          path: 'coupons',
          name: 'brand-admin-coupons',
          component: () => import('@/components/BrandAdmin/Promotion/Coupon/List.vue'),
          meta: { requiresAuth: true, title: '優惠券管理' }
        },
        {
          path: 'coupons/create',
          name: 'brand-admin-coupon-create',
          component: () => import('@/components/BrandAdmin/Promotion/Coupon/Form.vue'),
          meta: { requiresAuth: true, title: '新增優惠券' }
        },
        {
          path: 'coupons/edit/:id',
          name: 'brand-admin-coupon-edit',
          component: () => import('@/components/BrandAdmin/Promotion/Coupon/Form.vue'),
          props: true,
          meta: { requiresAuth: true, title: '編輯優惠券' }
        },
        {
          path: 'coupons/detail/:id',
          name: 'brand-admin-coupon-detail',
          component: () => import('@/components/BrandAdmin/Promotion/Coupon/Detail.vue'),
          props: true,
          meta: { requiresAuth: true, title: '優惠券詳情' }
        },
        // 點數規則
        {
          path: '/admin/:brandId/point-rules',
          name: 'PointRuleList',
          component: () => import('@/components/BrandAdmin/Promotion/PointRule/List.vue')
        },
        {
          path: '/admin/:brandId/point-rules/create',
          name: 'PointRuleCreate',
          component: () => import('@/components/BrandAdmin/Promotion/PointRule/Form.vue')
        },
        {
          path: '/admin/:brandId/point-rules/edit/:id',
          name: 'PointRuleEdit',
          component: () => import('@/components/BrandAdmin/Promotion/PointRule/Form.vue')
        },
        // 用戶管理（預留）
        // 管理員管理
        {
          path: 'store-admins',
          name: 'brand-admin-admins',
          component: () => import('@/components/BrandAdmin/AdminManager/List.vue'),
          meta: { requiresAuth: true, title: '管理員管理' }
        },
        {
          path: 'store-admins/create',
          name: 'brand-admin-admin-create',
          component: () => import('@/components/BrandAdmin/AdminManager/Form.vue'),
          meta: { requiresAuth: true, title: '新增管理員' }
        },
        {
          path: 'store-admins/edit/:id',
          name: 'brand-admin-admin-edit',
          component: () => import('@/components/BrandAdmin/AdminManager/Form.vue'),
          props: true,
          meta: { requiresAuth: true, title: '編輯管理員' }
        },
        {
          path: 'customers',
          name: 'brand-admin-customers',
          component: () => import('@/components/BrandAdmin/Customer/List.vue'),
          meta: { requiresAuth: true, title: '顧客管理' }
        },
        // 系統設置（預留）
        {
          path: 'settings',
          name: 'brand-admin-settings',
          component: Placeholder,
          props: {
            title: '品牌設置功能',
            message: '這個區塊目前尚未開發，請稍後再試。'
          }
        },
        // 品牌管理員路由中的帳號設置
        {
          path: 'account-settings',
          name: 'brand-admin-account-settings',
          component: () => import('@/components/BrandAdmin/Account/Settings.vue'),
          meta: { requiresAuth: true, title: '帳號設置' }
        }
      ]
    },

    // 櫃檯點餐系統路由
    {
      path: '/counter/:brandId/:storeId',
      name: 'counter',
      component: () => import('@/views/counter/index.vue'),
      meta: {
        requiresAdminAuth: true,
        title: '櫃檯點餐系統'
      },
      props: true
    },

    // 菜單頁面
    {
      path: '/stores/:brandId/:storeId',
      name: 'menu',
      component: () => import('@/views/customer/MenuView.vue')
    },

    // 餐點詳情頁面
    {
      path: '/stores/:brandId/:storeId/dish/:dishId',
      name: 'dish-detail',
      component: () => import('@/views/customer/DishDetailView.vue')
    },

    // 套餐詳情頁面路由
    {
      path: '/stores/:brandId/:storeId/bundles/:bundleId',
      name: 'bundle-detail',
      component: () => import('@/views/customer/BundleDetailView.vue'),
      meta: {
        title: '套餐詳情',
        requiresAuth: false
      }
    },

    // 購物車頁面
    {
      path: '/cart',
      name: 'cart',
      component: () => import('@/views/customer/CartView.vue')
    },

    // 訂單確認頁面
    {
      path: '/stores/:brandId/:storeId/order-confirm/:orderId',
      name: 'order-confirm',
      component: () => import('@/views/customer/OrderConfirmView.vue')
    },

    // 會員認證相關路由
    {
      path: '/auth/login',
      name: 'customer-login',
      component: () => import('@/components/customer/auth/Login.vue'),
      beforeEnter: requireNoAuth,
      meta: {
        title: '會員登入'
      }
    },
    {
      path: '/auth/register',
      name: 'customer-register',
      component: () => import('@/components/customer/auth/Register.vue'),
      beforeEnter: requireNoAuth,
      meta: {
        title: '會員註冊'
      }
    },
    {
      path: '/auth/forgot-password',
      name: 'customer-forgot-password',
      component: () => import('@/components/customer/auth/ForgotPassword.vue'),
      beforeEnter: requireNoAuth,
      meta: {
        title: '忘記密碼'
      }
    },

    // 會員中心相關路由
    {
      path: '/member',
      name: 'member-center',
      component: () => import('@/components/customer/member/MemberCenter.vue'),
      beforeEnter: requireAuth,
      meta: {
        title: '會員中心',
        requiresCustomerAuth: true
      }
    },
    {
      path: '/member/profile',
      name: 'member-profile',
      component: () => import('@/components/customer/member/UserProfile.vue'),
      beforeEnter: requireAuth,
      meta: {
        title: '會員資料',
        requiresCustomerAuth: true
      }
    },
    {
      path: '/member/points',
      name: 'member-points',
      component: () => import('@/components/customer/member/PointsView.vue'),
      beforeEnter: requireAuth,
      meta: {
        title: '我的點數',
        requiresCustomerAuth: true
      }
    },
    {
      path: '/member/coupons',
      name: 'member-coupons',
      component: () => import('@/components/customer/member/CouponsView.vue'),
      beforeEnter: requireAuth,
      meta: {
        title: '我的優惠券',
        requiresCustomerAuth: true
      }
    },
    {
      path: '/member/order-history',
      name: 'member-order-history',
      component: () => import('@/components/customer/member/OrderHistoryView.vue'),
      beforeEnter: requireAuth,
      meta: {
        title: '我的訂單',
        requiresCustomerAuth: true
      }
    },

    // 404 頁面
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/notFound.vue')
    }
  ]
})

// 全局前置守衛
router.beforeEach(async (to, from, next) => {

  if (to.path === '/admin/login') {
    return next()
  }

  // 管理員授權檢查
  if (to.matched.some(record => record.meta.requiresAdminAuth)) {
    const { loggedIn, role, brand, store } = await checkAdminAuth()

    if (!loggedIn) {
      return next({
        path: '/admin/login',
        query: { redirect: to.fullPath }
      })
    }

    // 檢查角色權限
    if (to.meta.role) {
      const allowedRoles = Array.isArray(to.meta.role) ? to.meta.role : [to.meta.role];

      if (!allowedRoles.includes(role)) {
        // 根據角色選擇重定向路徑
        let redirectPath = '/admin/login';

        if (role === 'primary_system_admin' || role === 'system_admin') {
          redirectPath = '/boss';
        } else if (brand?._id) {
          redirectPath = `/admin/${brand._id}`;
        }

        alert('您沒有權限訪問此頁面')
        return next(redirectPath)
      }
    }

    // 檢查品牌權限
    if (to.params.brandId && role !== 'primary_system_admin' && role !== 'system_admin') {
      if (!brand || brand._id !== to.params.brandId) {
        alert('您沒有權限管理此品牌')
        return next('/admin/login')
      }
    }

    // 檢查店鋪權限
    if (to.params.storeId &&
      (role === 'primary_store_admin' || role === 'store_admin' || role === 'employee')) {
      if (!store || store._id !== to.params.storeId) {
        alert('您沒有權限管理此店鋪')
        return next(`/admin/${brand._id}`)
      }
    }
  }

  // 會員授權檢查 - 已在路由守衛中處理
  // 統一的 brandId 設置和狀態同步
  if (to.params.brandId) {
    const authStore = useAuthStore();
    authStore.setBrandId(to.params.brandId);
  }

  next();
})

export default router
