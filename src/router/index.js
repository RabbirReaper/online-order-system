import { createRouter, createWebHistory } from 'vue-router'
import api from '@/api'

// 檢查管理員登入狀態
const checkAdminAuth = async () => {
  // 測試階段直接返回已登入狀態和最高權限
  return {
    loggedIn: true,
    role: 'boss',
    manage: [] // 可以根據需要添加模擬的店鋪權限
  }

  // try {
  //   const response = await api.auth.checkAdmin()
  //   return {
  //     loggedIn: response.data.loggedIn,
  //     role: response.data.role,
  //     manage: response.data.manage || []
  //   }
  // } catch (error) {
  //   console.error('檢查管理員登入狀態失敗', error)
  //   return { loggedIn: false, role: null, manage: [] }
  // }
}

// 檢查會員登入狀態 (目前在測試階段暫時不使用)
const checkUserAuth = async () => {
  // 測試階段直接返回已登入狀態
  return {
    loggedIn: true,
    userData: { id: 'test-user-id', name: '測試用戶' }
  }

  // 正式環境程式碼 (暫時註解)
  /*
  try {
    const response = await api.auth.checkUser()
    return {
      loggedIn: response.data.loggedIn,
      userData: response.data.user
    }
  } catch (error) {
    console.error('檢查會員登入狀態失敗', error)
    return { loggedIn: false, userData: null }
  }
  */
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 首頁 - 重定向到適當的頁面
    {
      path: '/',
      name: 'home',
      redirect: to => {
        // 可以根據登入狀態決定重定向到哪個頁面
        return { path: '/customer/stores' }
      }
    },

    // 管理員認證
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('@/views/auth/loginView.vue'),
      meta: { guest: true }
    },

    // 管理員後台
    {
      path: '/admin',
      component: () => import('@/views/admin/index.vue'),
      meta: { requiresAdminAuth: true },
      children: [
        {
          path: '',
          name: 'admin-dashboard',
          component: () => import('@/views/admin/dashboard.vue')
        },
        // 餐點模板管理
        {
          path: 'dish-templates',
          name: 'admin-dish-templates',
          component: () => import('@/views/admin/dish/templates.vue')
        },
        {
          path: 'dish-templates/create',
          name: 'admin-dish-template-create',
          component: () => import('@/views/admin/dish/templateForm.vue')
        },
        {
          path: 'dish-templates/:id',
          name: 'admin-dish-template-edit',
          component: () => import('@/views/admin/dish/templateForm.vue')
        },
        // 選項類別管理
        {
          path: 'option-categories',
          name: 'admin-option-categories',
          component: () => import('@/views/admin/option/categories.vue')
        },
        {
          path: 'option-categories/create',
          name: 'admin-option-category-create',
          component: () => import('@/views/admin/option/categoryForm.vue')
        },
        {
          path: 'option-categories/:id',
          name: 'admin-option-category-edit',
          component: () => import('@/views/admin/option/categoryForm.vue')
        },
        // 選項管理
        {
          path: 'options',
          name: 'admin-options',
          component: () => import('@/views/admin/option/options.vue')
        },
        {
          path: 'options/create',
          name: 'admin-option-create',
          component: () => import('@/views/admin/option/optionForm.vue')
        },
        {
          path: 'options/:id',
          name: 'admin-option-edit',
          component: () => import('@/views/admin/option/optionForm.vue')
        },
        // 品牌管理
        {
          path: 'brands',
          name: 'admin-brands',
          component: () => import('@/views/admin/brand/list.vue'),
          meta: { role: 'boss' }
        },
        {
          path: 'brands/create',
          name: 'admin-brand-create',
          component: () => import('@/views/admin/brand/form.vue'),
          meta: { role: 'boss' }
        },
        {
          path: 'brands/:id',
          name: 'admin-brand-edit',
          component: () => import('@/views/admin/brand/form.vue'),
          meta: { role: 'boss' }
        },
        // 店鋪管理
        {
          path: 'stores',
          name: 'admin-stores',
          component: () => import('@/views/admin/store/list.vue')
        },
        {
          path: 'stores/create',
          name: 'admin-store-create',
          component: () => import('@/views/admin/store/form.vue'),
          meta: { role: 'boss' }
        },
        {
          path: 'stores/:id',
          name: 'admin-store-edit',
          component: () => import('@/views/admin/store/form.vue')
        },
        // 菜單管理
        {
          path: 'menus',
          name: 'admin-menus',
          component: () => import('@/views/admin/menu/list.vue')
        },
        {
          path: 'menus/create',
          name: 'admin-menu-create',
          component: () => import('@/views/admin/menu/form.vue')
        },
        {
          path: 'menus/:id',
          name: 'admin-menu-edit',
          component: () => import('@/views/admin/menu/form.vue')
        },
        // 庫存管理
        {
          path: 'inventory/:storeId',
          name: 'admin-inventory',
          component: () => import('@/views/admin/inventory/list.vue')
        },
        // 訂單管理
        {
          path: 'orders/:storeId',
          name: 'admin-orders',
          component: () => import('@/views/admin/order/list.vue')
        },
        {
          path: 'orders/:storeId/:orderId',
          name: 'admin-order-detail',
          component: () => import('@/views/admin/order/detail.vue')
        },
        // 點數與優惠券管理
        {
          path: 'point-rules',
          name: 'admin-point-rules',
          component: () => import('@/views/admin/promotion/pointRules.vue')
        },
        {
          path: 'coupons',
          name: 'admin-coupons',
          component: () => import('@/views/admin/promotion/coupons.vue')
        },
        // 管理員管理
        {
          path: 'admins',
          name: 'admin-admins',
          component: () => import('@/views/admin/admin/list.vue'),
          meta: { role: 'boss' }
        },
        {
          path: 'admins/create',
          name: 'admin-admin-create',
          component: () => import('@/views/admin/admin/form.vue'),
          meta: { role: 'boss' }
        },
        {
          path: 'admins/:id',
          name: 'admin-admin-edit',
          component: () => import('@/views/admin/admin/form.vue'),
          meta: { role: 'boss' }
        },
        // 用戶管理
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('@/views/admin/user/list.vue')
        },
        {
          path: 'users/:id',
          name: 'admin-user-detail',
          component: () => import('@/views/admin/user/detail.vue')
        }
      ]
    },

    // 店員前台 (點餐系統)
    {
      path: '/staff/:storeId',
      name: 'staff',
      component: () => import('@/views/staff/index.vue'),
      meta: { requiresAdminAuth: true }
    },

    // 客人前台
    {
      path: '/customer',
      component: () => import('@/views/customer/layout.vue'),
      children: [
        // 店鋪列表
        {
          path: 'stores',
          name: 'customer-stores',
          component: () => import('@/views/customer/stores.vue')
        },
        // 點餐頁面
        {
          path: 'ordering/:storeId',
          name: 'customer-ordering',
          component: () => import('@/views/customer/ordering.vue')
        },
        // 訂單確認頁面
        {
          path: 'confirmation/:orderId',
          name: 'customer-confirmation',
          component: () => import('@/views/customer/confirmation.vue')
        },
        // 會員登入/註冊
        {
          path: 'login',
          name: 'customer-login',
          component: () => import('@/views/customer/loginView.vue'),
          meta: { customerGuest: true },
          children: [
            {
              path: '',
              name: 'customer-login-form',
              component: () => import('@/components/Customer/LoginForm.vue')
            },
            {
              path: 'register',
              name: 'customer-register',
              component: () => import('@/components/Customer/Register.vue')
            },
            {
              path: 'forgot-password',
              name: 'customer-forgot-password',
              component: () => import('@/components/Customer/ForgotPassword.vue')
            }
          ]
        },
        // 會員中心
        {
          path: 'my-account',
          name: 'customer-my-account',
          component: () => import('@/views/customer/myAccount.vue'),
          meta: { requiresCustomerAuth: true },
          children: [
            {
              path: '',
              name: 'customer-account-home',
              component: () => import('@/components/Customer/AccountHome.vue')
            },
            {
              path: 'edit',
              name: 'customer-account-edit',
              component: () => import('@/components/Customer/AccountEdit.vue')
            },
            {
              path: 'points',
              name: 'customer-points',
              component: () => import('@/components/Customer/Points.vue')
            },
            {
              path: 'coupons',
              name: 'customer-coupons',
              component: () => import('@/components/Customer/Coupons.vue')
            },
            {
              path: 'orders',
              name: 'customer-orders',
              component: () => import('@/components/Customer/Orders.vue')
            }
          ]
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
        // 老闆擁有所有權限
        return next()
      }

      alert('您沒有權限訪問此頁面')
      return next('/admin')
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

  // 會員授權檢查
  if (to.matched.some(record => record.meta.requiresCustomerAuth)) {
    const { loggedIn } = await checkUserAuth()

    if (!loggedIn) {
      return next({
        path: '/customer/login',
        query: { redirect: to.fullPath }
      })
    }
  }

  // 已登入用戶重定向
  if (to.matched.some(record => record.meta.guest) && (await checkAdminAuth()).loggedIn) {
    return next('/admin')
  }

  if (to.matched.some(record => record.meta.customerGuest) && (await checkUserAuth()).loggedIn) {
    return next('/customer/my-account')
  }

  next()
})

export default router
