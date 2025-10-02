import * as platformManagerService from '../../services/delivery/core/platformManager.js'
import * as orderSyncService from '../../services/delivery/core/orderSyncService.js'
import * as ubereatsInventorySync from '../../services/delivery/platforms/ubereats/ubereatsInventorySync.js'
import { asyncHandler, AppError } from '../../middlewares/error.js'

/**
 * 同步菜單到所有啟用的外送平台
 * @param {Object} req - Express 請求物件
 * @param {Object} res - Express 回應物件
 */
export const syncMenuToAllPlatforms = asyncHandler(async (req, res) => {
  const { brandId, storeId } = req.params

  const result = await platformManagerService.syncMenu(brandId, storeId)

  res.status(200).json({
    success: true,
    message: '菜單同步完成',
    data: result,
  })
})

/**
 * 獲取菜單同步狀態
 * @param {Object} req - Express 請求物件
 * @param {Object} res - Express 回應物件
 */
export const getMenuSyncStatus = asyncHandler(async (req, res) => {
  // 這個功能可以後續擴展，用來查詢同步狀態
  res.status(200).json({
    success: true,
    message: '功能開發中',
    data: null,
  })
})

/**
 * 處理 Uber Eats Webhook
 * @param {Object} req - Express 請求物件
 * @param {Object} res - Express 回應物件
 */
export const handleUberEatsWebhook = asyncHandler(async (req, res) => {
  const webhookData = req.body

  console.log('🍔 收到 Uber Eats Webhook:', {
    event_type: webhookData.event_type,
    resource_href: webhookData.resource_href,
  })

  try {
    await orderSyncService.processUberEatsWebhook(webhookData)

    // Uber Eats 要求回應 200 狀態碼
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
    })
  } catch (error) {
    console.error('❌ 處理 Uber Eats Webhook 失敗:', error)

    // 即使處理失敗，也要回應 200，避免 Uber 重複發送
    res.status(200).json({
      success: false,
      message: 'Webhook processed with errors',
      error: error.message,
    })
  }
})

/**
 * 處理 Foodpanda Webhook
 * @param {Object} req - Express 請求物件
 * @param {Object} res - Express 回應物件
 */
export const handleFoodpandaWebhook = asyncHandler(async (req, res) => {
  const webhookData = req.body

  console.log('🐼 收到 Foodpanda Webhook:', {
    event_type: webhookData.event_type || webhookData.type,
    order_id: webhookData.order_id,
  })

  try {
    await orderSyncService.processFoodpandaWebhook(webhookData)

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
    })
  } catch (error) {
    console.error('❌ 處理 Foodpanda Webhook 失敗:', error)

    res.status(200).json({
      success: false,
      message: 'Webhook processed with errors',
      error: error.message,
    })
  }
})

/**
 * 同步庫存狀態到 UberEats
 * @param {Object} req - Express 請求物件
 * @param {Object} res - Express 回應物件
 */
export const syncInventoryStatusToUberEats = asyncHandler(async (req, res) => {
  const { brandId, storeId } = req.params
  console.log('controller UberEats:', { brandId, storeId })
  const result = await ubereatsInventorySync.syncInventoryStatusToUberEats(brandId, storeId)

  res.status(200).json({
    success: true,
    message: '庫存狀態同步完成',
    data: result,
  })
})

/**
 * 處理 Foodpanda Catalog Callback Webhook
 * @param {Object} req - Express 請求物件
 * @param {Object} res - Express 回應物件
 */
export const handleFoodpandaCatalogCallback = asyncHandler(async (req, res) => {
  const webhookData = req.body
  const headers = req.headers

  console.log('🐼 收到 Foodpanda Catalog Callback Webhook')
  console.log('='.repeat(80))
  console.log('📋 Headers:', JSON.stringify(headers, null, 2))
  console.log('📦 Body:', JSON.stringify(webhookData, null, 2))
  console.log('🕐 Time:', new Date().toISOString())
  console.log('='.repeat(80))

  try {
    // 這裡可以加入處理邏輯
    // await foodpandaService.processCatalogCallback(webhookData)

    res.status(200).json({
      success: true,
      message: 'Catalog callback received successfully',
    })
  } catch (error) {
    console.error('❌ 處理 Foodpanda Catalog Callback 失敗:', error)
    console.error('錯誤詳情:', {
      message: error.message,
      stack: error.stack,
    })

    res.status(200).json({
      success: false,
      message: 'Catalog callback processed with errors',
      error: error.message,
    })
  }
})
