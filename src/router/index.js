import { createRouter, createWebHistory } from 'vue-router'
import api from '@/api'

// 檢查管理員登入狀態
const checkAdminAuth = async () => {
  // 測試階段使用真實 API 檢查登入狀態
  try {
    const response = await api.auth.checkAdminStatus()
    console.log('登入狀態:', response)
    return response;
  } catch (error) {
    console.error('檢查管理員登入狀態失敗', error)
    return { loggedIn: false, role: null, manage: [] }
  }
}

// // 檢查會員登入狀態 (目前在測試階段暫時不使用)
// const checkUserAuth = async () => {
//   // 使用統一的API檢查用戶登入狀態
//   const response = await api.auth.checkLoginStatus();
//   return {
//     loggedIn: response.loggedIn && response.role === 'customer',
//     userId: response.user_id
//   };
// };

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 首頁 - 重定向到適當的頁面
    {
      path: '/',
      name: 'home',
      redirect: to => {
        // 可以根據登入狀態決定重定向到哪個頁面
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
      name: 'boss',
      component: () => import('@/views/boss/index.vue'),
      meta: { requiresAdminAuth: true, role: 'boss' }
    },

    // 管理員後台
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/admin/index.vue'),
      meta: { requiresAdminAuth: true }
    },

    // // 店員前台 (點餐系統)
    // {
    //   path: '/staff/:storeId',
    //   name: 'staff',
    //   component: () => import('@/views/staff/index.vue'),
    //   meta: { requiresAdminAuth: true }
    // },

    // // 客人前台
    // {
    //   path: '/customer',
    //   component: () => import('@/views/customer/layout.vue'),
    //   children: [
    //     // 店鋪列表
    //     {
    //       path: 'stores',
    //       name: 'customer-stores',
    //       component: () => import('@/views/customer/stores.vue')
    //     },
    //     // 點餐頁面
    //     {
    //       path: 'ordering/:storeId',
    //       name: 'customer-ordering',
    //       component: () => import('@/views/customer/ordering.vue')
    //     },
    //     // 訂單確認頁面
    //     {
    //       path: 'confirmation/:orderId',
    //       name: 'customer-confirmation',
    //       component: () => import('@/views/customer/confirmation.vue')
    //     },
    //     // 會員登入/註冊
    //     {
    //       path: 'login',
    //       name: 'customer-login',
    //       component: () => import('@/views/customer/loginView.vue'),
    //       meta: { customerGuest: true }
    //     },
    //     // 會員中心
    //     {
    //       path: 'my-account',
    //       name: 'customer-my-account',
    //       component: () => import('@/views/customer/myAccount.vue'),
    //       meta: { requiresCustomerAuth: true }
    //     }
    //   ]
    // },

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
