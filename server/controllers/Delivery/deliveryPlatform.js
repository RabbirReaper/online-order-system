import * as deliveryService from '../../services/delivery/index.js'
import { asyncHandler } from '../../middlewares/error.js'

/**
 * 處理來自外送平台的 webhook
 */
export const handleWebhook = asyncHandler(async (req, res) => {
  const { platform } = req.params
  const webhookData = req.body
  const signature = req.headers['x-uber-signature'] || req.headers['x-foodpanda-signature'] || null

  console.log(`📨 Received ${platform} webhook:`, {
    eventType: webhookData.event_type || webhookData.type || 'unknown',
    timestamp: new Date().toISOString(),
  })

  const result = await deliveryService.handleIncomingOrder(platform, webhookData, signature)

  res.json({
    success: true,
    message: `${platform} webhook processed successfully`,
    result,
  })
})

/**
 * 獲取支援的外送平台列表
 */
export const getSupportedPlatforms = asyncHandler(async (req, res) => {
  const platforms = deliveryService.getSupportedPlatforms()

  res.json({
    success: true,
    platforms,
  })
})

/**
 * 驗證平台設定
 */
export const validatePlatformSettings = asyncHandler(async (req, res) => {
  const { platform, settings } = req.body

  if (!platform) {
    return res.status(400).json({
      success: false,
      message: '平台名稱為必填欄位',
    })
  }

  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({
      success: false,
      message: '設定資料為必填欄位',
    })
  }

  const validation = deliveryService.validatePlatformSettings(platform, settings)

  res.json({
    success: validation.valid,
    message: validation.valid ? '設定驗證通過' : '設定驗證失敗',
    validation,
  })
})

/**
 * 測試平台連接
 */
export const testPlatformConnection = asyncHandler(async (req, res) => {
  const { platform } = req.params

  if (!deliveryService.SUPPORTED_PLATFORMS.includes(platform)) {
    return res.status(400).json({
      success: false,
      message: `不支援的平台: ${platform}`,
    })
  }

  let testResult = {
    platform,
    success: false,
    timestamp: new Date().toISOString(),
  }

  try {
    switch (platform) {
      case 'ubereats':
        const ubereatsResult = await deliveryService.testUberEatsConnection()
        testResult.success = ubereatsResult
        break
      case 'foodpanda':
        // TODO: 實作 foodpanda 連接測試
        testResult.success = false
        testResult.error = 'Foodpanda 連接測試尚未實作'
        break
      default:
        testResult.error = `未知平台: ${platform}`
    }
  } catch (error) {
    testResult.error = error.message
  }

  res.json({
    success: testResult.success,
    message: testResult.success ? '平台連接測試成功' : '平台連接測試失敗',
    testResult,
  })
})

/**
 * 測試所有平台 API 連接狀態
 */
export const testAllConnections = asyncHandler(async (req, res) => {
  const testResults = await deliveryService.testUberEatsApiConnection()

  const overallSuccess = Object.values(testResults).every((result) => result.success)

  res.json({
    success: overallSuccess,
    message: overallSuccess ? '所有平台連接正常' : '部分平台連接異常',
    testResults,
  })
})

/**
 * 創建測試 webhook 資料（開發用）
 */
export const createTestWebhook = asyncHandler(async (req, res) => {
  const { platform } = req.params
  const { orderId } = req.body

  if (!deliveryService.SUPPORTED_PLATFORMS.includes(platform)) {
    return res.status(400).json({
      success: false,
      message: `不支援的平台: ${platform}`,
    })
  }

  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: '此功能僅限開發環境使用',
    })
  }

  try {
    const testData = deliveryService.createTestWebhookData(platform, orderId)

    res.json({
      success: true,
      message: '測試 webhook 資料創建成功',
      testData,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
})

/**
 * 檢查 UberEats 配置狀態
 */
export const checkUberEatsConfig = asyncHandler(async (req, res) => {
  const configStatus = deliveryService.checkUberEatsConfig()

  res.json({
    success: configStatus.isComplete,
    message: configStatus.isComplete ? 'UberEats 配置完整' : 'UberEats 配置不完整',
    configStatus,
  })
})

/**
 * 檢查 Token 狀態
 */
export const checkTokenStatus = asyncHandler(async (req, res) => {
  const tokenStatus = deliveryService.getTokenStatus()

  const allConfigured = tokenStatus.userToken.configured && tokenStatus.appToken.configured

  res.json({
    success: allConfigured,
    message: allConfigured ? 'Token 配置完整' : 'Token 配置不完整',
    tokenStatus,
  })
})

/**
 * 刷新 User Access Token
 */
export const refreshUserToken = asyncHandler(async (req, res) => {
  try {
    const newToken = await deliveryService.refreshUserToken()

    res.json({
      success: true,
      message: 'User Access Token 刷新成功',
      tokenLength: newToken ? newToken.length : 0,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Token 刷新失敗',
      error: error.message,
    })
  }
})

// ==========================================
// 🚀 Phase 1: UberEats 訂單同步功能 (優先實作)
// ==========================================

/**
 * 獲取 UberEats 店鋪訂單列表
 */
export const getUberEatsStoreOrders = asyncHandler(async (req, res) => {
  const { storeId } = req.params
  const options = req.query

  if (!storeId) {
    return res.status(400).json({
      success: false,
      message: '店鋪ID為必填欄位',
    })
  }

  const orders = await deliveryService.getUberEatsStoreOrders(storeId, options)

  res.json({
    success: true,
    message: '成功獲取店鋪訂單列表',
    storeId,
    orders,
  })
})

/**
 * 取消 UberEats 店鋪訂單
 */
export const cancelUberEatsOrder = asyncHandler(async (req, res) => {
  const { storeId, orderId } = req.params
  const { reason } = req.body

  if (!storeId || !orderId) {
    return res.status(400).json({
      success: false,
      message: '店鋪ID和訂單ID為必填欄位',
    })
  }

  const result = await deliveryService.cancelUberEatsOrder(storeId, orderId, reason)

  res.json({
    success: true,
    message: '訂單取消成功',
    storeId,
    orderId,
    result,
  })
})

/**
 * 自動 Provisioning UberEats 店鋪
 */
export const autoProvisionUberEatsStore = asyncHandler(async (req, res) => {
  const { storeId } = req.params
  const { userAccessToken } = req.body

  if (!storeId) {
    return res.status(400).json({
      success: false,
      message: '店鋪ID為必填欄位',
    })
  }

  if (!userAccessToken) {
    return res.status(400).json({
      success: false,
      message: '用戶存取令牌為必填欄位',
    })
  }

  const result = await deliveryService.autoProvisionUberEatsStore(storeId, userAccessToken)

  res.json({
    success: true,
    message: '店鋪自動整合成功',
    storeId,
    result,
  })
})

// ==========================================
// 📋 Phase 2: TODO - 其他 UberEats API 功能
// ==========================================

/**
 * TODO: 更新 UberEats 店鋪營業狀態
 */
/*
export const updateUberEatsStoreStatus = asyncHandler(async (req, res) => {
  const { storeId, status } = req.body

  if (!storeId || !status) {
    return res.status(400).json({
      success: false,
      message: '店鋪ID和狀態為必填欄位',
    })
  }

  const result = await deliveryService.updateUberEatsStoreStatus(storeId, status)

  res.json({
    success: true,
    message: '店鋪狀態更新成功',
    storeId,
    status,
    result,
  })
})
*/

/**
 * TODO: 獲取 UberEats 店鋪營業狀態
 */
/*
export const getUberEatsStoreStatus = asyncHandler(async (req, res) => {
  const { storeId } = req.params

  if (!storeId) {
    return res.status(400).json({
      success: false,
      message: '店鋪ID為必填欄位',
    })
  }

  const status = await deliveryService.getUberEatsStoreStatus(storeId)

  res.json({
    success: true,
    message: '成功獲取店鋪狀態',
    storeId,
    status,
  })
})
*/

/**
 * TODO: 獲取 UberEats 店鋪資訊
 */
/*
export const getUberEatsStoreInfo = asyncHandler(async (req, res) => {
  const { storeId } = req.params

  if (!storeId) {
    return res.status(400).json({
      success: false,
      message: '店鋪ID為必填欄位',
    })
  }

  const storeInfo = await deliveryService.getUberEatsStoreInfo(storeId)

  res.json({
    success: true,
    message: '成功獲取店鋪資訊',
    storeId,
    storeInfo,
  })
})
*/
