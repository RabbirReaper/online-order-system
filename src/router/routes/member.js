import { requireAuth } from '../guards.js'

export const memberRoutes = [
  // 會員中心相關路由
  {
    path: '/member',
    name: 'member-center',
    component: () => import('@/components/customer/member/MemberCenter.vue'),
    beforeEnter: requireAuth,
    meta: {
      title: '會員中心',
      requiresCustomerAuth: true
    }
  },
  {
    path: '/member/profile',
    name: 'member-profile',
    component: () => import('@/components/customer/member/UserProfile.vue'),
    beforeEnter: requireAuth,
    meta: {
      title: '會員資料',
      requiresCustomerAuth: true
    }
  },
  {
    path: '/member/points',
    name: 'member-points',
    component: () => import('@/components/customer/member/PointsView.vue'),
    beforeEnter: requireAuth,
    meta: {
      title: '我的點數',
      requiresCustomerAuth: true
    }
  },
  {
    path: '/member/coupons',
    name: 'member-coupons',
    component: () => import('@/components/customer/member/CouponsView.vue'),
    beforeEnter: requireAuth,
    meta: {
      title: '我的優惠券',
      requiresCustomerAuth: true
    }
  },
  {
    path: '/member/order-history',
    name: 'member-order-history',
    component: () => import('@/components/customer/member/OrderHistoryView.vue'),
    beforeEnter: requireAuth,
    meta: {
      title: '我的訂單',
      requiresCustomerAuth: true
    }
  }
]
