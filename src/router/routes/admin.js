export const adminRoutes = [
  // 管理員認證
  {
    path: '/admin/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
  }
]
