import { createRouter, createWebHistory } from 'vue-router'
import api from '@/api'
import Placeholder from '@/components/common/Placeholder.vue'

// 檢查管理員登入狀態
const checkAdminAuth = async () => {
  // 測試階段使用真實 API 檢查登入狀態
  // try {
  //   const response = await api.auth.checkAdminStatus()
  //   console.log('登入狀態:', response)
  //   return response;
  // } catch (error) {
  //   console.error('檢查管理員登入狀態失敗', error)
  //   return { loggedIn: false, role: null, manage: [] }
  // }
  return { loggedIn: true, role: 'boss', manage: [] }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 首頁 - 重定向到適當的頁面
    {
      path: '/',
      name: 'home',
      redirect: to => {
        return { path: '/admin' }
      }
    },

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
      meta: { requiresAdminAuth: true, role: 'boss' },
      children: [
        {
          path: '',
          redirect: { name: 'brand-list' }
        },
        {
          path: 'brands',
          name: 'brand-list',
          component: () => import('@/components/Boss/BrandList.vue')
        },
        {
          path: 'brands/create',
          name: 'brand-create',
          component: () => import('@/components/Boss/BrandForm.vue')
        },
        {
          path: 'brands/edit/:id',
          name: 'brand-edit',
          component: () => import('@/components/Boss/BrandForm.vue'),
          props: true
        },
        {
          path: 'brands/detail/:id',
          name: 'brand-detail',
          component: () => import('@/components/Boss/BrandDetail.vue'),
          props: true
        },
        {
          path: 'admins',
          name: 'admin-list',
          component: Placeholder,
          props: {
            title: '管理員功能',
            message: '這個區塊目前尚未開發，請稍後再試。'
          }
        },
        {
          path: 'admins/create',
          name: 'admin-create',
          component: Placeholder,
          props: {
            title: '管理員功能',
            message: '這個區塊目前尚未開發，請稍後再試。'
          }
        },
        {
          path: 'settings',
          name: 'system-settings',
          component: Placeholder,
          props: {
            title: '系統設置功能',
            message: '這個區塊目前尚未開發，請稍後再試。'
          }
        },
        {
          path: 'account',
          name: 'account-settings',
          component: Placeholder,
          props: {
            title: '系統設置功能',
            message: '這個區塊目前尚未開發，請稍後再試。'
          }
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

        // 訂單管理（預留）
        {
          path: 'orders',
          name: 'brand-admin-orders',
          component: Placeholder,
          props: {
            title: '訂單管理功能',
            message: '這個區塊目前尚未開發，請稍後再試。'
          }
        },
        {
          path: 'orders/reports',
          name: 'brand-admin-reports',
          component: Placeholder,
          props: {
            title: '銷售報表功能',
            message: '這個區塊目前尚未開發，請稍後再試。'
          }
        },
        // 促銷管理（預留）
        {
          path: 'coupons',
          name: 'brand-admin-coupons',
          component: Placeholder,
          props: {
            title: '優惠券功能',
            message: '這個區塊目前尚未開發，請稍後再試。'
          }
        },
        {
          path: 'point-rules',
          name: 'brand-admin-point-rules',
          component: Placeholder,
          props: {
            title: '點數規則功能',
            message: '這個區塊目前尚未開發，請稍後再試。'
          }
        },
        // 用戶管理（預留）
        {
          path: 'store-admins',
          name: 'brand-admin-store-admins',
          component: Placeholder,
          props: {
            title: '店鋪管理員功能',
            message: '這個區塊目前尚未開發，請稍後再試。'
          }
        },
        {
          path: 'customers',
          name: 'brand-admin-customers',
          component: Placeholder,
          props: {
            title: '顧客管理功能',
            message: '這個區塊目前尚未開發，請稍後再試。'
          }
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
        {
          path: 'account-settings',
          name: 'brand-admin-account-settings',
          component: Placeholder,
          props: {
            title: '帳號設置功能',
            message: '這個區塊目前尚未開發，請稍後再試。'
          }
        }
      ]
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
    const { loggedIn, role, manage } = await checkAdminAuth()

    if (!loggedIn) {
      return next({
        path: '/admin/login',
        query: { redirect: to.fullPath }
      })
    }

    // 檢查角色權限
    if (to.meta.role && to.meta.role !== role) {
      if (role === 'boss') {
        // boss 擁有所有權限，允許訪問
        return next()
      }

      // 根據路徑選擇重定向
      if (role === 'brand_admin' || role === 'store_admin') {
        alert('您沒有權限訪問此頁面')
        return next('/admin')
      }

      return next('/admin/login')
    }

    // 檢查店鋪權限
    if (to.params.storeId && role !== 'boss') {
      const hasStorePermission = manage.some(
        m => m.store === to.params.storeId
      )

      if (!hasStorePermission) {
        alert('您沒有權限管理此店鋪')
        return next('/admin')
      }
    }
  }

  // // 會員授權檢查
  // if (to.matched.some(record => record.meta.requiresCustomerAuth)) {
  //   const { loggedIn } = await checkUserAuth()

  //   if (!loggedIn) {
  //     return next({
  //       path: '/customer/login',
  //       query: { redirect: to.fullPath }
  //     })
  //   }
  // }
  next()
})

export default router
