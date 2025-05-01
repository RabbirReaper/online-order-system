import { createRouter, createWebHistory } from 'vue-router'
import api from '@/api'

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
          component: {
            template: '<div class="alert alert-info">管理員功能（待開發）</div>'
          }
        },
        {
          path: 'admins/create',
          name: 'admin-create',
          component: {
            template: '<div class="alert alert-info">管理員功能（待開發）</div>'
          }
        },
        {
          path: 'settings',
          name: 'system-settings',
          component: {
            template: '<div class="alert alert-info">系統設置功能（待開發）</div>'
          }
        },
        {
          path: 'account',
          name: 'account-settings',
          component: {
            template: '<div class="alert alert-info">系統設置功能（待開發）</div>'
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
          component: () => import('@/components/BrandAdmin/Dashboard.vue')
        },
        // 店鋪管理路由
        {
          path: 'stores',
          name: 'brand-admin-stores',
          component: () => import('@/components/BrandAdmin/StoreList.vue')
        },
        {
          path: 'stores/create',
          name: 'brand-admin-store-create',
          component: () => import('@/components/BrandAdmin/StoreForm.vue')
        },
        {
          path: 'stores/edit/:id',
          name: 'brand-admin-store-edit',
          component: () => import('@/components/BrandAdmin/StoreForm.vue'),
          props: true
        },
        {
          path: 'stores/detail/:id',
          name: 'brand-admin-store-detail',
          component: () => import('@/components/BrandAdmin/StoreDetail.vue'),
          props: true
        },
        // 菜單管理（預留）
        {
          path: 'menus',
          name: 'brand-admin-menus',
          component: {
            template: '<div class="alert alert-info">菜單管理功能（待開發）</div>'
          }
        },
        // 餐點管理（預留）
        {
          path: 'dishes',
          name: 'brand-admin-dishes',
          component: {
            template: '<div class="alert alert-info">餐點管理功能（待開發）</div>'
          }
        },
        {
          path: 'option-categories',
          name: 'brand-admin-option-categories',
          component: {
            template: '<div class="alert alert-info">選項類別功能（待開發）</div>'
          }
        },
        {
          path: 'options',
          name: 'brand-admin-options',
          component: {
            template: '<div class="alert alert-info">選項管理功能（待開發）</div>'
          }
        },
        // 庫存管理（預留）
        {
          path: 'inventory',
          name: 'brand-admin-inventory',
          component: {
            template: '<div class="alert alert-info">庫存管理功能（待開發）</div>'
          }
        },
        {
          path: 'inventory/logs',
          name: 'brand-admin-inventory-logs',
          component: {
            template: '<div class="alert alert-info">庫存變更記錄功能（待開發）</div>'
          }
        },
        // 訂單管理（預留）
        {
          path: 'orders',
          name: 'brand-admin-orders',
          component: {
            template: '<div class="alert alert-info">訂單管理功能（待開發）</div>'
          }
        },
        {
          path: 'orders/reports',
          name: 'brand-admin-reports',
          component: {
            template: '<div class="alert alert-info">銷售報表功能（待開發）</div>'
          }
        },
        // 促銷管理（預留）
        {
          path: 'coupons',
          name: 'brand-admin-coupons',
          component: {
            template: '<div class="alert alert-info">優惠券功能（待開發）</div>'
          }
        },
        {
          path: 'point-rules',
          name: 'brand-admin-point-rules',
          component: {
            template: '<div class="alert alert-info">點數規則功能（待開發）</div>'
          }
        },
        // 用戶管理（預留）
        {
          path: 'store-admins',
          name: 'brand-admin-store-admins',
          component: {
            template: '<div class="alert alert-info">店鋪管理員功能（待開發）</div>'
          }
        },
        {
          path: 'customers',
          name: 'brand-admin-customers',
          component: {
            template: '<div class="alert alert-info">顧客管理功能（待開發）</div>'
          }
        },
        // 系統設置（預留）
        {
          path: 'settings',
          name: 'brand-admin-settings',
          component: {
            template: '<div class="alert alert-info">品牌設置功能（待開發）</div>'
          }
        },
        {
          path: 'account-settings',
          name: 'brand-admin-account-settings',
          component: {
            template: '<div class="alert alert-info">帳號設置功能（待開發）</div>'
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
