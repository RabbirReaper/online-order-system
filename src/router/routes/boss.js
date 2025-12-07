import Placeholder from '@/components/common/Placeholder.vue'

export const bossRoutes = [
  // Boss 後台 (系統管理員)
  {
    path: '/boss',
    component: () => import('@/views/boss/index.vue'),
    meta: { requiresAdminAuth: true, role: ['primary_system_admin', 'system_admin'] },
    children: [
      {
        path: '',
        redirect: { name: 'brand-list' },
      },
      // 品牌管理路由
      {
        path: 'brands',
        name: 'brand-list',
        component: () => import('@/components/Boss/Brand/List.vue'),
      },
      {
        path: 'brands/create',
        name: 'brand-create',
        component: () => import('@/components/Boss/Brand/Form.vue'),
      },
      {
        path: 'brands/edit/:id',
        name: 'brand-edit',
        component: () => import('@/components/Boss/Brand/Form.vue'),
        props: true,
      },
      {
        path: 'brands/detail/:id',
        name: 'brand-detail',
        component: () => import('@/components/Boss/Brand/Detail.vue'),
        props: true,
      },
      // 管理員管理路由
      {
        path: 'admins',
        name: 'boss-admin-list',
        component: () => import('@/components/Boss/AdminManager/List.vue'),
      },
      {
        path: 'admins/create',
        name: 'boss-admin-create',
        component: () => import('@/components/Boss/AdminManager/Form.vue'),
      },
      {
        path: 'admins/edit/:id',
        name: 'boss-admin-edit',
        component: () => import('@/components/Boss/AdminManager/Form.vue'),
        props: true,
      },
      // 系統設置路由
      {
        path: 'settings',
        name: 'system-settings',
        component: Placeholder,
        props: {
          title: '系統設置功能',
          message: '這個區塊目前尚未開發，請稍後再試。',
        },
      },
      // Boss 路由中的帳號設置
      {
        path: 'account',
        name: 'account-settings',
        component: () => import('@/components/common/Account/Settings.vue'),
        meta: { requiresAuth: true, title: '帳號設置' },
      },
    ],
  },
]
