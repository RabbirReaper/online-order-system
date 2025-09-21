import express from 'express'
import dotenv from 'dotenv'
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
import cashFlowRoutes from './cashFlow.js'
import cashFlowCategoryRoutes from './cashFlowCategory.js'
import platformStoreRoutes from './platformStore.js'

// 載入環境變數
dotenv.config()

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
apiRouter.use('/cash-flow', cashFlowRoutes) // 現金流記帳路由
apiRouter.use('/cash-flow-category', cashFlowCategoryRoutes) // 記帳分類路由
apiRouter.use('/platform-store', platformStoreRoutes) // 平台店鋪配置路由

// 訂單路由 - 按權限分離
apiRouter.use('/order-customer', orderCustomerRoutes) // 前台客戶訂單
apiRouter.use('/order-admin', orderAdminRoutes) // 後台管理員訂單

// API 健康檢查
apiRouter.get('/health', async (req, res) => {
  const ipResponse = await fetch('https://api.ipify.org?format=json')
  const ipData = await ipResponse.json()

  res.json({
    success: true,
    message: 'API 服務正常運行',
    timestamp: new Date().toISOString(),
    outboundIP: ipData.ip,
    expectedFixedIP: '35.201.160.235',
    isCorrect: ipData.ip === '35.201.160.235',
  })
})

apiRouter.get('/test-outbound-ip', async (req, res) => {
  try {
    // 獲取對外 IP 資訊
    const ipResponse = await fetch('https://api.ipify.org?format=json')
    const ipData = await ipResponse.json()

    const username = process.env.KOTSMS_USERNAME
    const password = process.env.KOTSMS_PASSWORD

    // 檢查環境變數
    if (!username || !password) {
      return res.status(400).json({
        error: '缺少 KOTSMS_USERNAME 或 KOTSMS_PASSWORD 環境變數',
      })
    }

    // 準備 KOTSMS API 請求資料（帳號餘額查詢）
    const kotsmsData = new URLSearchParams({
      username,
      password,
      // 注意：不提供 msgid 參數，這樣就是帳號餘額查詢
    })

    console.log('發送請求到 KOTSMS API...')

    // 呼叫 KOTSMS API - 先用最簡單的 headers
    const kotsmsResponse = await fetch('https://api.kotsms.com.tw:8515/kotsms/SmQuery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: kotsmsData,
    })

    // 正確讀取回應內容
    const kotsmsText = await kotsmsResponse.text()

    console.log('KOTSMS 回應狀態:', kotsmsResponse.status)
    console.log('KOTSMS 回應內容:', kotsmsText)

    // 解析回應
    let kotsmsResult = {
      status: kotsmsResponse.status,
      statusText: kotsmsResponse.statusText,
      body: kotsmsText,
      success: false,
      accountPoint: null,
      error: null,
    }

    if (kotsmsResponse.ok) {
      // 成功的回應格式應該是：AccountPoint=110
      if (kotsmsText.startsWith('AccountPoint=')) {
        kotsmsResult.success = true
        kotsmsResult.accountPoint = parseInt(kotsmsText.split('=')[1])
      } else {
        // 可能是錯誤回應，檢查是否為錯誤代碼
        kotsmsResult.error = kotsmsText
      }
    } else {
      kotsmsResult.error = `HTTP ${kotsmsResponse.status}: ${kotsmsResponse.statusText}`
    }

    res.json({
      outboundIP: ipData.ip,
      expectedFixedIP: '35.201.160.235',
      isCorrectIP: ipData.ip === '35.201.160.235',
      kotsms: kotsmsResult,
    })
  } catch (error) {
    console.error('API 測試錯誤:', error)
    res.status(500).json({
      error: error.message,
      stack: error.stack,
    })
  }
})

// 錯誤處理中介軟體
apiRouter.use(notFoundHandler)
apiRouter.use(errorHandler)

export default apiRouter
