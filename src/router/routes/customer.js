export const customerRoutes = [
  // LINE Entry 頁面 - 處理 LINE 進入點自動跳轉
  {
    path: '/line-entry',
    name: 'line-entry',
    component: () => import('@/views/customer/LineEntry.vue'),
    meta: {
      title: 'LINE 登入中...',
      requiresAuth: false,
      layout: 'minimal', // 使用最簡潔的布局
      robots: 'noindex, nofollow', // 不允許搜尋引擎索引
    },
  },

  // 櫃檯點餐系統路由
  {
    path: '/counter/:brandId/:storeId',
    name: 'counter',
    component: () => import('@/views/counter/index.vue'),
    meta: {
      requiresAdminAuth: true,
      title: '櫃檯點餐系統',
      robots: 'noindex, nofollow',
    },
    props: true,
  },

  // 菜單頁面
  {
    path: '/stores/:brandId/:storeId',
    name: 'menu',
    component: () => import('@/views/customer/MenuView.vue'),
    meta: {
      title: '菜單',
      robots: 'index, follow',
    },
  },

  // 餐點詳情頁面
  {
    path: '/stores/:brandId/:storeId/dish/:dishId',
    name: 'dish-detail',
    component: () => import('@/views/customer/DishDetailView.vue'),
    meta: {
      title: '餐點詳情',
      robots: 'noindex, nofollow',
    },
  },

  // 套餐詳情頁面路由
  {
    path: '/stores/:brandId/:storeId/bundles/:bundleId',
    name: 'bundle-detail',
    component: () => import('@/views/customer/BundleDetailView.vue'),
    meta: {
      title: '套餐詳情',
      requiresAuth: false,
      robots: 'noindex, nofollow',
    },
  },

  // 購物車頁面
  {
    path: '/cart',
    name: 'cart',
    component: () => import('@/views/customer/CartView.vue'),
    meta: {
      title: '購物車',
      robots: 'noindex, nofollow',
    },
  },

  // 訂單確認頁面
  {
    path: '/stores/:brandId/:storeId/order-confirm/:orderId',
    name: 'order-confirm',
    component: () => import('@/views/customer/OrderConfirmView.vue'),
    meta: {
      title: '訂單確認',
      robots: 'noindex, nofollow',
    },
  },
]
