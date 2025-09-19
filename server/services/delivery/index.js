/**
 * 外送平台服務入口文件
 * 基於實際的 Store 和 Order schema 匯總並導出所有外送平台相關服務
 */

// 導入外送平台相關服務
import * as deliveryPlatformManager from './deliveryPlatformManager.js'
import * as ubereatsService from './ubereatsService.js'
import * as orderSyncService from './orderSyncService.js'

// 導出平台管理服務
export const platformManager = deliveryPlatformManager

// 導出平台專用服務
export const ubereats = ubereatsService

// 導出訂單同步服務
export const orderSync = orderSyncService

// === 核心功能 - 接收訂單相關導出 ===
export const {
  handleIncomingOrder, // 處理來自平台的訂單 webhook
  getSupportedPlatforms, // 獲取支援的平台列表
  validatePlatformSettings, // 驗證平台設定
  SUPPORTED_PLATFORMS, // 支援的平台常數
} = deliveryPlatformManager

// === UberEats 專用服務導出 ===
export const {
  receiveOrder, // 接收 UberEats 訂單
  checkUberEatsConfig, // 檢查 UberEats 配置
  testUberEatsConnection, // 測試 UberEats API 連接
  // Phase 1: 優先實作的訂單同步功能
  getStoreOrders, // 獲取店鋪訂單列表
  cancelStoreOrder, // 取消店鋪訂單
  // 自動 Provisioning 功能
  autoProvisionStore, // 自動配置店鋪整合
} = ubereatsService

// === Token 管理服務導出 ===
import { getTokenStatus as tokenStatus, refreshToken } from './tokenManager.js'

export const getTokenStatus = () => {
  const status = tokenStatus()
  return {
    userToken: {
      configured: status.configured,
      cached: status.cached,
      expires: status.expires,
      isValid: status.isValid
    },
    appToken: {
      configured: status.configured,
      cached: status.cached,
      expires: status.expires,
      isValid: status.isValid
    }
  }
}
export const refreshUserToken = refreshToken

// === 便捷別名導出（方便控制器調用）===
export const getUberEatsStoreOrders = ubereatsService.getStoreOrders
export const cancelUberEatsOrder = ubereatsService.cancelStoreOrder
export const autoProvisionUberEatsStore = ubereatsService.autoProvisionStore

// === Phase 2: UberEats 店鋪管理功能（已實作）===
export const {
  getStoreDetails, // 獲取店鋪詳細資訊
  setStoreDetails, // 設定店鋪詳細資訊
  getStoreStatus, // 獲取店鋪營業狀態
  setStoreStatus, // 設定店鋪營業狀態
  setPrepTime, // 設定準備時間
  uploadMenu, // 上傳菜單到 UberEats
} = ubereatsService

// 便捷別名導出
export const getUberEatsStoreDetails = ubereatsService.getStoreDetails
export const setUberEatsStoreDetails = ubereatsService.setStoreDetails
export const getUberEatsStoreStatus = ubereatsService.getStoreStatus
export const setUberEatsStoreStatus = ubereatsService.setStoreStatus
export const setUberEatsPrepTime = ubereatsService.setPrepTime
export const uploadUberEatsMenu = ubereatsService.uploadMenu

// === 訂單同步服務導出 ===
export const {
  syncOrderFromPlatform, // 從平台同步訂單
  convertPlatformOrderToInternal, // 轉換平台訂單格式
} = orderSyncService

// 註解掉不必要的管理功能
/*
export const {
  bindPlatformStore, // 綁定店鋪到外送平台
  unregisterPlatform, // 取消註冊平台
  updatePlatformSettings, // 更新平台設定
  getPlatformConfig, // 獲取平台設定
  handleOrderAction, // 處理訂單接受/拒絕
  updateOrderStatus, // 更新訂單狀態到平台
  togglePlatformStatus, // 切換平台營業狀態
  getPlatformStatuses, // 獲取店鋪的所有平台狀態
} = deliveryPlatformManager

export const {
  acceptOrder, // 接受 UberEats 訂單
  rejectOrder, // 拒絕 UberEats 訂單
  updateOrderStatus: updateUberEatsOrderStatus, // UberEats 狀態更新
} = ubereatsService

export const {
  updatePlatformOrderStatus, // 更新平台訂單狀態
} = orderSyncService
*/

// === 🔧 便捷功能函數（保留基本設定） ===

/**
 * 一鍵設定店鋪的 UberEats 平台（註解掉，只保留接收功能）
 */
/*
export const setupUberEatsForStore = async (storeId, ubereatsStoreId, options = {}) => {
  // 設定功能
}

export const setupFoodpandaForStore = async (storeId, foodpandaStoreId, options = {}) => {
  // 設定功能
}

export const toggleAllPlatformsStatus = async (storeId, isOnline) => {
  // 批次狀態切換功能
}

export const getStoreIntegrationOverview = async (storeId) => {
  // 整合概覽功能
}

export const validateAllPlatformConfigs = async (storeId) => {
  // 配置驗證功能
}
*/

// === 🧪 開發和測試工具（保留基本測試） ===

/**
 * 創建測試 webhook 資料（僅供開發使用）
 * @param {String} platform - 平台名稱
 * @param {String} orderId - 訂單ID
 */
export const createTestWebhookData = (platform, orderId = 'test-order-123') => {
  switch (platform) {
    case 'ubereats':
      return {
        event_type: 'orders.notification',
        event_id: 'test-event-123',
        event_time: Math.floor(Date.now() / 1000),
        meta: {
          resource_id: orderId,
          status: 'pos',
          user_id: 'test-user-123',
        },
        resource_href: `https://api.uber.com/v2/eats/order/${orderId}`,
      }
    case 'foodpanda':
      return {
        event_type: 'order.placed',
        order_id: orderId,
        restaurant_id: 'test-restaurant-123',
        timestamp: new Date().toISOString(),
      }
    default:
      throw new Error(`Test data not available for platform: ${platform}`)
  }
}

/**
 * 測試 UberEats API 連接
 */
export const testUberEatsApiConnection = async () => {
  try {
    const result = await ubereatsService.testUberEatsConnection()
    return {
      ubereats: {
        success: result,
        timestamp: new Date().toISOString(),
      },
    }
  } catch (error) {
    return {
      ubereats: {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
    }
  }
}

// 註解掉複雜的測試功能
/*
export const testAllPlatformConnections = async (storeId = null) => {
  // 所有平台連接測試功能
}
*/
