export const customerRoutes = [
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
  }
]
