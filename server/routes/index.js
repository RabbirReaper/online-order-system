import express from 'express'
import adminAuthRoutes from './adminAuth.js'
import userAuthRoutes from './userAuth.js'
import adminUserRoutes from './adminUser.js'
import dishRoutes from './dish.js'
import storeRoutes from './store.js'
import brandRoutes from './brand.js'
import promotionRoutes from './promotion.js'
import userRoutes from './user.js'
import adminRoutes from './admin.js'
import { errorHandler, notFoundHandler } from '../middlewares/error.js'
import orderCustomerRoutes from './orderCustomer.js'
import orderAdminRoutes from './orderAdmin.js'
import inventoryRoutes from './inventory.js'
import menuRoutes from './menu.js'
import bundleRoutes from './bundle.js'
import deliveryPlatformRoutes from './deliveryPlatform.js'
import cashFlowRoutes from './cashFlow.js'
import cashFlowCategoryRoutes from './cashFlowCategory.js'

// 創建一個主要的 API 路由器
const apiRouter = express.Router()

// 將所有路由掛載到 API 路由器上
apiRouter.use('/admin-auth', adminAuthRoutes) // 管理員認證路由
apiRouter.use('/user-auth', userAuthRoutes) // 用戶認證路由
apiRouter.use('/admin-user', adminUserRoutes) // 管理員用戶管理路由
apiRouter.use('/dish', dishRoutes)
apiRouter.use('/store', storeRoutes)
apiRouter.use('/brand', brandRoutes)
apiRouter.use('/promotion', promotionRoutes)
apiRouter.use('/user', userRoutes)
apiRouter.use('/admin', adminRoutes)
apiRouter.use('/inventory', inventoryRoutes) // 庫存管理路由
apiRouter.use('/menu', menuRoutes) // 菜單管理路由
apiRouter.use('/bundle', bundleRoutes) // 兌換券綑綁路由
apiRouter.use('/delivery', deliveryPlatformRoutes) // 外送平台路由
apiRouter.use('/cash-flow', cashFlowRoutes) // 現金流記帳路由
apiRouter.use('/cash-flow-category', cashFlowCategoryRoutes) // 記帳分類路由

// 訂單路由 - 按權限分離
apiRouter.use('/order-customer', orderCustomerRoutes) // 前台客戶訂單
apiRouter.use('/order-admin', orderAdminRoutes) // 後台管理員訂單

// API 健康檢查
apiRouter.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API 服務正常運行',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  })
})

apiRouter.get('/test-outbound-ip', async (req, res) => {
  try {
    // 獲取對外 IP 資訊
    const ipResponse = await fetch('https://api.ipify.org?format=json')
    const ipData = await ipResponse.json()

    // 拜訪指定的 kotsms 網頁並獲取 HTML
    const kotResponse = await fetch('https://www.kotsms.com.tw/index.php?selectpage=pagenews&kind=4&viewnum=238')
    const htmlContent = await kotResponse.text()

    res.json({
      outboundIP: ipData.ip,
      expectedFixedIP: '35.201.160.235',
      isCorrect: ipData.ip === '35.201.160.235',
      kotSmsHtml: htmlContent,
      kotSmsStatus: kotResponse.status,
      kotSmsStatusText: kotResponse.statusText
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 錯誤處理中介軟體
apiRouter.use(notFoundHandler)
apiRouter.use(errorHandler)

export default apiRouter
