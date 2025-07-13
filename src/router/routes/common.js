export const commonRoutes = [
  // 404 頁面
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/notFound.vue'),
  },
]
