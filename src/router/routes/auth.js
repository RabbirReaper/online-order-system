import { requireNoAuth } from '../guards.js'

export const authRoutes = [
  // 會員認證相關路由
  {
    path: '/auth/login',
    name: 'customer-login',
    component: () => import('@/components/customer/auth/Login.vue'),
    beforeEnter: requireNoAuth,
    meta: {
      title: '會員登入',
    },
  },
  {
    path: '/auth/forgot-password',
    name: 'customer-forgot-password',
    component: () => import('@/components/customer/auth/ForgotPassword.vue'),
    beforeEnter: requireNoAuth,
    meta: {
      title: '忘記密碼',
    },
  },
  {
    path: '/auth/register',
    name: 'register',
    component: () => import('@/components/customer/auth/RegisterPhone.vue'),
  },
  {
    path: '/auth/register/verify',
    name: 'register-verify',
    component: () => import('@/components/customer/auth/RegisterVerifyCode.vue'),
  },
  {
    path: '/auth/register/profile',
    name: 'register-profile',
    component: () => import('@/components/customer/auth/RegisterProfile.vue'),
  },
]
