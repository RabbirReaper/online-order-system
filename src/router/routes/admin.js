export const adminRoutes = [
  // 系統管理員登入（不需要 brandId）
  {
    path: '/admin/login',
    name: 'system-admin-login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: {
      title: '系統管理員登入',
      loginType: 'system', // 用於區分登入類型
    },
  },
  // 品牌/店鋪管理員登入（需要 brandId）
  {
    path: '/admin/:brandId/login',
    name: 'brand-admin-login',
    component: () => import('@/views/auth/LoginView.vue'),
    props: true,
    meta: {
      title: '品牌管理員登入',
      loginType: 'brand', // 用於區分登入類型
    },
  },
]
