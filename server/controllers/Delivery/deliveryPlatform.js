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
