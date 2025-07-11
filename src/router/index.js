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
    ...commonRoutes
  ]
})

// 全局前置守衛
router.beforeEach(globalBeforeEach)

export default router
