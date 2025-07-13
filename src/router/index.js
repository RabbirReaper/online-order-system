import { createRouter, createWebHistory } from 'vue-router'
import { globalBeforeEach } from './guards.js'

// 導入各個路由模組
import { adminRoutes } from './routes/admin.js'
import { bossRoutes } from './routes/boss.js'
import { brandAdminRoutes } from './routes/brandAdmin.js'
import { customerRoutes } from './routes/customer.js'
import { authRoutes } from './routes/auth.js'
import { memberRoutes } from './routes/member.js'
import { commonRoutes } from './routes/common.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...adminRoutes,
    ...bossRoutes,
    ...brandAdminRoutes,
    ...customerRoutes,
    ...authRoutes,
    ...memberRoutes,
    ...commonRoutes,
  ],
  // 添加滾動行為配置
  scrollBehavior(to, from, savedPosition) {
    // 如果有保存的位置（瀏覽器前進/後退）
    if (savedPosition) {
      return savedPosition
    }

    // 如果是從詳情頁返回菜單頁，恢復之前的滾動位置
    if (from.name?.includes('detail') && to.name === 'menu') {
      const savedScrollPosition = sessionStorage.getItem(
        `scroll_${to.name}_${to.params.brandId}_${to.params.storeId}`,
      )
      if (savedScrollPosition) {
        return { top: parseInt(savedScrollPosition), behavior: 'instant' }
      }
    }

    // 如果是菜單頁面，不自動滾動到頂部
    if (to.name === 'menu') {
      return false // 保持當前位置
    }

    // 其他情況滾動到頂部
    return { top: 0 }
  },
})

// 全局前置守衛
router.beforeEach(globalBeforeEach)

export default router
