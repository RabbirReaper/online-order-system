import * as platformManagerService from '../../services/delivery/core/platformManager.js'
import * as orderSyncService from '../../services/delivery/core/orderSyncService.js'
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
 * 獲取外送平台訂單列表
 * @param {Object} req - Express 請求物件
 * @param {Object} res - Express 回應物件
 */
export const getDeliveryOrders = asyncHandler(async (req, res) => {
  const { brandId, storeId } = req.params
  const { platform, status, startDate, endDate, page = 1, limit = 20 } = req.query

  const options = {
    platform,
    status,
    startDate,
    endDate,
    page: parseInt(page),
    limit: parseInt(limit),
  }

  const result = await orderSyncService.getDeliveryOrders(brandId, storeId, options)

  res.status(200).json({
    success: true,
    message: '獲取外送訂單列表成功',
    data: result,
  })
})

/**
 * 手動同步特定平台訂單
 * @param {Object} req - Express 請求物件
 * @param {Object} res - Express 回應物件
 */
export const syncOrdersFromPlatform = asyncHandler(async (req, res) => {
  const { brandId, storeId } = req.params
  const { platform, startDate, endDate } = req.body

  if (!platform) {
    throw new AppError('缺少必要參數：platform', 400)
  }

  const result = await orderSyncService.syncOrdersFromPlatform(brandId, storeId, platform, {
    startDate,
    endDate,
  })

  res.status(200).json({
    success: true,
    message: '訂單同步完成',
    data: result,
  })
})
