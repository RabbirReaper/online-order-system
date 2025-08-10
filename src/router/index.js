// router/index.js - 簡化的 scrollBehavior 配置

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
import { landingRoutes } from './routes/landing.js'

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
    ...landingRoutes,
  ],

  // 簡化的滾動行為 - 依賴瀏覽器自動機制
  scrollBehavior(to, from, savedPosition) {
    // 開發環境調試信息

    // 1. 優先使用瀏覽器提供的 savedPosition
    if (savedPosition) {
      return savedPosition
    }

    // 2. MenuView 使用 KeepAlive，完全依賴瀏覽器處理
    if (to.name === 'menu') {
      if (from.name === 'dish-detail' || from.name === 'bundle-detail') {
        // 從詳情頁返回菜單頁 - 讓瀏覽器自動處理
        return false // 不執行路由級別的滾動控制
      } else {
        return { top: 0 }
      }
    }

    // 3. 進入詳情頁 - 滾動到頂部
    if (to.name === 'dish-detail' || to.name === 'bundle-detail') {
      return { top: 0 }
    }

    return { top: 0 }
  },
})

// 全局前置守衛
router.beforeEach(globalBeforeEach)

export default router
