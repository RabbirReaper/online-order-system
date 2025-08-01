/**
 * 外送平台管理服務
 * 基於實際的 Store 和 Order schema 設計
 * 使用 enum 控制支援的平台，確保每個平台都有對應的處理邏輯
 */

import Store from '../../models/Store/Store.js'
import { AppError } from '../../middlewares/error.js'
import * as ubereatsService from './ubereatsService.js'
// import * as orderSyncService from './orderSyncService.js'

// 🔧 支援的外送平台列表（與 schema enum 保持一致）
export const SUPPORTED_PLATFORMS = ['foodpanda', 'ubereats']

// 🔧 平台特定配置
const PLATFORM_CONFIGS = {
  ubereats: {
    name: 'UberEats',
    displayName: 'Uber Eats',
    defaultPrepTime: 30,
    features: {
      autoAccept: true,
      statusUpdates: false, // UberEats 不需要狀態更新
      menuSync: true,
    },
    requiredSettings: ['autoAcceptOrders', 'prepTime'],
  },
  foodpanda: {
    name: 'Foodpanda',
    displayName: 'foodpanda',
    defaultPrepTime: 25,
    features: {
      autoAccept: true,
      statusUpdates: true,
      menuSync: true,
    },
    requiredSettings: ['autoAcceptOrders', 'prepTime'],
  },
}

// 註解掉不必要的平台管理功能
/*
export const bindPlatformStore = async (storeId, platform, platformStoreId, settings = {}) => {
  // 綁定店鋪到平台的功能
}

export const unregisterPlatform = async (storeId, platform) => {
  // 取消註冊平台功能
}

export const updatePlatformSettings = async (storeId, platform, updates) => {
  // 更新平台設定功能
}

export const getPlatformConfig = async (storeId, platform) => {
  // 獲取平台設定功能
}
*/

/**
 * 處理來自外送平台的訂單 webhook
 * @param {String} platform - 平台名稱
 * @param {Object} webhookData - Webhook 資料
 * @param {String} signature - 簽名（來自 header）
 */
export const handleIncomingOrder = async (platform, webhookData, signature = null) => {
  try {
    console.log(`📨 Received webhook from ${platform}:`, webhookData.event_type || 'unknown')

    // 驗證平台是否支援
    if (!SUPPORTED_PLATFORMS.includes(platform)) {
      throw new AppError(`不支援的平台: ${platform}`, 400)
    }

    // 根據平台類型，呼叫對應的服務
    let result

    switch (platform) {
      case 'ubereats':
        result = await ubereatsService.receiveOrder(webhookData, signature)
        break
      case 'foodpanda':
        // TODO: 實作 foodpanda 訂單處理
        throw new AppError('Foodpanda 訂單處理尚未實作', 501)
      default:
        throw new AppError(`不支援的平台: ${platform}`, 400)
    }

    // 記錄成功處理
    if (
      webhookData.event_type === 'orders.notification' ||
      webhookData.event_type === 'order.placed'
    ) {
      const orderId = webhookData.meta?.resource_id || webhookData.order_id || 'unknown'
      console.log(`✅ Successfully processed ${platform} order: ${orderId}`)
    }

    return result
  } catch (error) {
    console.error(`❌ Failed to process ${platform} webhook:`, error)
    throw error
  }
}

// 註解掉訂單操作功能
/*
export const handleOrderAction = async (platform, platformOrderId, action, data = {}) => {
  // 處理訂單接受/拒絕功能
}

export const updateOrderStatus = async (orderId, status, additionalData = {}) => {
  // 更新訂單狀態功能
}

export const togglePlatformStatus = async (storeId, platform, isOnline) => {
  // 切換平台營業狀態功能
}

export const getPlatformStatuses = async (storeId) => {
  // 獲取平台狀態功能
}
*/

/**
 * 獲取支援的平台列表
 * @returns {Array} 支援的平台列表
 */
export const getSupportedPlatforms = () => {
  return SUPPORTED_PLATFORMS.map((platform) => ({
    platform,
    ...PLATFORM_CONFIGS[platform],
  }))
}

/**
 * 驗證平台設定
 * @param {String} platform - 平台名稱
 * @param {Object} settings - 設定物件
 * @returns {Object} 驗證結果
 */
export const validatePlatformSettings = (platform, settings) => {
  if (!SUPPORTED_PLATFORMS.includes(platform)) {
    return {
      valid: false,
      errors: [`不支援的平台: ${platform}`],
    }
  }

  const config = PLATFORM_CONFIGS[platform]
  const errors = []

  // 檢查必要設定
  for (const field of config.requiredSettings) {
    if (!(field in settings) || settings[field] === undefined || settings[field] === null) {
      errors.push(`缺少必要設定: ${field}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
