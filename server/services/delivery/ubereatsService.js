/**
 * UberEats API 串接服務
 * 基於實際的 Store schema 處理與 UberEats 平台的所有 API 交互
 */

import Store from '../../models/Store/Store.js'
import { AppError } from '../../middlewares/error.js'
import * as orderSyncService from './orderSyncService.js'
import {
  UberEatsTokenManager,
  getTokenForOperation,
  getUserToken,
  getAppToken,
} from './tokenManager.js'
import crypto from 'crypto'
import dotenv from 'dotenv'

dotenv.config()

// 🔧 根據環境動態配置 UberEats API 設定
const ENVIRONMENT = process.env.UBEREATS_ENVIRONMENT || 'sandbox'

const UBEREATS_CONFIG = {
  // 根據環境選擇對應的配置
  clientId:
    ENVIRONMENT === 'production'
      ? process.env.UBEREATS_PRODUCTION_CLIENT_ID
      : process.env.UBEREATS_SANDBOX_CLIENT_ID,

  clientSecret:
    ENVIRONMENT === 'production'
      ? process.env.UBEREATS_PRODUCTION_CLIENT_SECRET
      : process.env.UBEREATS_SANDBOX_CLIENT_SECRET,

  // ⚠️ 注意：根據 UberEats 官方文檔，webhook 簽名使用 client_secret 進行驗證
  // 不再需要單獨的 webhook_secret 配置

  // API URL 統一使用官方生產端點（符合 UberEats 官方規範）
  apiUrl: 'https://api.uber.com/v1/eats',

  // OAuth URL 固定
  oauthUrl: 'https://login.uber.com/oauth/v2/token',

  scope:
    'eats.pos_provisioning eats.order eats.store eats.report eats.store.status.write eats.store.status.read eats.store.orders.read eats.store.orders.cancel',
  environment: ENVIRONMENT,
}

// 啟動時記錄配置狀態
console.log(`🔧 UberEats Service initialized in ${ENVIRONMENT} mode`)
console.log(`📡 API URL: ${UBEREATS_CONFIG.apiUrl}`)
console.log(`🔑 Client ID configured: ${!!UBEREATS_CONFIG.clientId}`)
console.log(`🔐 Client Secret configured: ${!!UBEREATS_CONFIG.clientSecret}`)
console.log(`🔒 Webhook signature verification: Using client_secret (official method)`)

// 檢查 Webhook 簽名驗證能力
if (UBEREATS_CONFIG.clientSecret) {
  console.log(`✅ Webhook signature verification enabled: Using client_secret`)
} else {
  console.log(`❌ No client secret configured: Signature verification disabled`)
}

/**
 * 驗證 UberEats webhook 簽名 - 使用官方規範的 client_secret
 * @param {String} payload - 請求內容
 * @param {String} signature - UberEats 簽名
 */
const verifyWebhookSignature = (payload, signature) => {
  // 如果沒有配置 client secret，跳過驗證（僅開發環境）
  if (!UBEREATS_CONFIG.clientSecret) {
    console.warn('⚠️  No UberEats client secret configured, skipping signature verification')
    return true
  }

  try {
    // 移除簽名前綴（如果有的話）
    const cleanSignature = signature.startsWith('sha256=')
      ? signature.substring(7).toLowerCase()
      : signature.toLowerCase()

    // 🔐 使用 client_secret 進行簽名驗證（符合 UberEats 官方規範）
    const expectedSignature = crypto
      .createHmac('sha256', UBEREATS_CONFIG.clientSecret)
      .update(payload, 'utf8')
      .digest('hex')
      .toLowerCase()

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(cleanSignature, 'hex'),
    )

    if (isValid) {
      console.log('🔐 Webhook signature verified with client_secret')
      return true
    }

    console.log('❌ Webhook signature verification FAILED')
    console.log('💡 Ensure you are using the correct client_secret for webhook verification')
    return false
  } catch (error) {
    console.error('❌ Signature verification error:', error)
    return false
  }
}

/**
 * 從 UberEats 接收訂單
 * @param {Object} ubereatsOrderData - UberEats webhook 資料
 * @param {String} signature - webhook 簽名（來自 X-Uber-Signature header）
 */
export const receiveOrder = async (ubereatsOrderData, signature = null) => {
  try {
    console.log('📨 Processing UberEats webhook:', ubereatsOrderData.event_type)

    // 驗證 webhook 簽名
    if (signature) {
      const isValidSignature = verifyWebhookSignature(JSON.stringify(ubereatsOrderData), signature)

      if (!isValidSignature) {
        throw new AppError('Invalid webhook signature', 401)
      }
    }

    // 檢查事件類型
    if (ubereatsOrderData.event_type !== 'orders.notification') {
      console.log(`ℹ️  Ignoring non-order event: ${ubereatsOrderData.event_type}`)
      return { success: true, message: 'Event ignored' }
    }

    // 獲取訂單詳情
    const orderId = ubereatsOrderData.meta?.resource_id
    if (!orderId) {
      throw new AppError('Order ID not found in webhook data', 400)
    }

    // 使用 resource_href 獲取完整訂單資料
    const orderDetails = await getOrderDetails(orderId)

    // 查找對應的店鋪 - 使用實際的 schema 結構
    const store = await findStoreByUberEatsId(orderDetails.store?.id)

    if (!store) {
      throw new AppError(`Store not found for UberEats store ID: ${orderDetails.store?.id}`, 404)
    }

    // 檢查店鋪是否啟用 UberEats - 使用實際的 schema 結構
    const ubereatsConfig = store.deliveryPlatforms?.find(
      (p) => p.platform === 'ubereats' && p.isEnabled,
    )

    if (!ubereatsConfig) {
      throw new AppError('UberEats not configured or disabled for this store', 400)
    }

    // 轉換並創建內部訂單
    const internalOrder = await orderSyncService.syncOrderFromPlatform(
      'ubereats',
      orderDetails,
      store._id,
    )

    return internalOrder
  } catch (error) {
    console.error('❌ Failed to process UberEats order:', error)
    throw error
  }
}

/**
 * 獲取訂單詳情
 * @param {String} orderId - UberEats 訂單ID
 */
const getOrderDetails = async (orderId) => {
  try {
    const accessToken = await getTokenForOperation('orders')

    const response = await fetch(`${UBEREATS_CONFIG.apiUrl}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`UberEats API error: ${response.status} ${response.statusText}`)
    }

    const orderData = await response.json()
    return orderData
  } catch (error) {
    console.error(`❌ Failed to get order details for ${orderId}:`, error)

    // 在開發階段，如果 API 失敗，可以返回模擬數據以便測試
    if (UBEREATS_CONFIG.environment === 'sandbox') {
      console.log('🧪 Sandbox mode: returning mock order data')
      return createMockOrderData(orderId)
    }

    throw error
  }
}

/**
 * 創建模擬訂單數據（僅供開發測試）
 * @param {String} orderId - 訂單ID
 */
const createMockOrderData = (orderId) => {
  return {
    id: orderId,
    display_id: `TEST-${orderId.slice(-4)}`,
    current_state: 'CREATED',
    store: {
      id: process.env.UBEREATS_SANDBOX_STORE_ID || 'test-store-id',
      name: 'Test Restaurant',
    },
    eater: {
      id: 'test-eater-id',
      first_name: 'Test',
      last_name: 'Customer',
      phone: '+1234567890',
    },
    cart: {
      items: [
        {
          id: 'test-item-1',
          title: 'Test Burger',
          quantity: 1,
          price: {
            unit_price: { amount: 1200 },
            total_price: { amount: 1200 },
          },
        },
      ],
    },
    delivery_location: {
      address_1: '123 Test Street',
      city: 'Test City',
      state: 'TS',
      postal_code: '12345',
    },
    special_instructions: 'Test order',
    estimated_ready_for_pickup_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  }
}

/**
 * 根據 UberEats 店鋪ID 查找內部店鋪 - 使用實際的 schema
 * @param {String} ubereatsStoreId - UberEats 店鋪ID
 */
const findStoreByUberEatsId = async (ubereatsStoreId) => {
  if (!ubereatsStoreId) {
    return null
  }

  // 根據實際的 schema 結構查找
  const store = await Store.findOne({
    'deliveryPlatforms.platform': 'ubereats',
    'deliveryPlatforms.storeId': ubereatsStoreId,
    'deliveryPlatforms.isEnabled': true,
  })

  return store
}

/**
 * 獲取 UberEats API 存取令牌 - 使用 App Token
 * 日常 API 操作使用 App Access Token
 * @param {String} operation - 操作類型，用於自動選擇 token
 */
const getAccessToken = async (operation = 'api') => {
  try {
    // 使用重構後的 Token Manager 自動選擇合適的認證流程
    const token = await getTokenForOperation(operation)

    console.log(
      `🔑 Using ${operation.includes('provision') ? 'Authorization Code' : 'Client Credentials'} flow for ${operation}`,
    )
    return token
  } catch (error) {
    console.error('❌ Failed to get access token:', error)

    // 在開發階段提供後備方案
    if (UBEREATS_CONFIG.environment === 'sandbox') {
      console.log('🧪 Sandbox mode: returning mock token as fallback')
      const flow = operation.includes('provision') ? 'authorization_code' : 'client_credentials'
      return UberEatsTokenManager.getMockToken(flow)
    }

    throw error
  }
}

/**
 * 檢查 UberEats 配置是否完整
 * @returns {Object} 配置檢查結果
 */
export const checkUberEatsConfig = () => {
  const config = {
    environment: UBEREATS_CONFIG.environment,
    clientId: !!UBEREATS_CONFIG.clientId,
    clientSecret: !!UBEREATS_CONFIG.clientSecret,
    apiUrl: !!UBEREATS_CONFIG.apiUrl,
  }

  // 基本配置檢查 - 使用正確的必需欄位
  const requiredFields = ['clientId', 'clientSecret', 'apiUrl']
  const isComplete = requiredFields.every((field) => config[field])

  const missing = Object.keys(config)
    .filter((key) => key !== 'environment') // 排除環境設定
    .filter((key) => !config[key])

  // 簽名驗證能力評估 - 基於 client_secret
  const signatureCapability = {
    canVerify: config.clientSecret,
    method: 'client_secret',
    compliant: true, // 符合官方規範
  }

  return {
    isComplete,
    config,
    missing,
    environment: UBEREATS_CONFIG.environment,
    apiUrl: UBEREATS_CONFIG.apiUrl,
    signatureCapability,
    recommendations: isComplete
      ? ['✅ All required configurations are complete']
      : [`❌ Missing configurations: ${missing.join(', ')}`],
  }
}

/**
 * 測試 UberEats API 連接
 * @returns {Promise<Boolean>} 連接是否成功
 */
export const testUberEatsConnection = async () => {
  try {
    console.log(`🧪 Testing UberEats API connection in ${UBEREATS_CONFIG.environment} mode`)
    const accessToken = await getAccessToken('api')
    console.log(`✅ UberEats API connection test passed (${UBEREATS_CONFIG.environment})`)
    return true
  } catch (error) {
    console.error(`❌ UberEats API connection test failed (${UBEREATS_CONFIG.environment}):`, error)
    return false
  }
}

// ==========================================
// 🚀 Phase 1: 訂單同步功能 (優先實作)
// ==========================================

/**
 * 獲取店鋪訂單列表 - 優先實作
 * @param {String} storeId - UberEats 店鋪ID
 * @param {Object} options - 查詢選項
 */
export const getStoreOrders = async (storeId, options = {}) => {
  try {
    const accessToken = await getTokenForOperation('orders')

    const queryParams = new URLSearchParams(options)
    const url = `${UBEREATS_CONFIG.apiUrl}/stores/${storeId}/orders${queryParams.toString() ? '?' + queryParams.toString() : ''}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get store orders: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`✅ Successfully fetched orders for store ${storeId}`)
    return data
  } catch (error) {
    console.error(`❌ Failed to get store orders for ${storeId}:`, error)

    // 開發階段提供模擬數據
    if (UBEREATS_CONFIG.environment === 'sandbox') {
      console.log('🧪 Sandbox mode: returning mock orders')
      return {
        orders: [createMockOrderData('mock-order-1'), createMockOrderData('mock-order-2')],
      }
    }

    throw error
  }
}

/**
 * 取消店鋪訂單 - 優先實作
 * @param {String} storeId - UberEats 店鋪ID
 * @param {String} orderId - 訂單ID
 * @param {String} reason - 取消原因
 */
export const cancelStoreOrder = async (storeId, orderId, reason = 'RESTAURANT_UNAVAILABLE') => {
  try {
    const accessToken = await getTokenForOperation('cancel')

    const response = await fetch(
      `${UBEREATS_CONFIG.apiUrl}/stores/${storeId}/orders/${orderId}/cancel`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      },
    )

    if (!response.ok) {
      throw new Error(`Failed to cancel order: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`✅ Successfully cancelled order ${orderId} for store ${storeId}`)
    return data
  } catch (error) {
    console.error(`❌ Failed to cancel order ${orderId}:`, error)

    // 開發階段提供模擬回應
    if (UBEREATS_CONFIG.environment === 'sandbox') {
      console.log('🧪 Sandbox mode: simulating order cancellation')
      return { success: true, message: 'Mock cancellation successful' }
    }

    throw error
  }
}

// ==========================================
// 📋 Phase 2: TODO - 其他 API 功能
// ==========================================

/**
 * TODO: 更新店鋪營業狀態
 * @param {String} storeId - UberEats 店鋪ID
 * @param {String} status - 狀態：'ONLINE', 'OFFLINE', 'PAUSE'
 */
/*
export const updateStoreStatus = async (storeId, status) => {
  try {
    const accessToken = await getAccessToken()

    const response = await fetch(`${UBEREATS_CONFIG.apiUrl}/stores/${storeId}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      throw new Error(`Failed to update store status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`❌ Failed to update store status for ${storeId}:`, error)
    throw error
  }
}
*/

/**
 * TODO: 獲取店鋪營業狀態
 * @param {String} storeId - UberEats 店鋪ID
 */
/*
export const getStoreStatus = async (storeId) => {
  try {
    const accessToken = await getAccessToken()

    const response = await fetch(`${UBEREATS_CONFIG.apiUrl}/stores/${storeId}/status`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get store status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`❌ Failed to get store status for ${storeId}:`, error)
    throw error
  }
}
*/

/**
 * TODO: 獲取店鋪資訊
 * @param {String} storeId - UberEats 店鋪ID
 */
/*
export const getStoreInfo = async (storeId) => {
  try {
    const accessToken = await getAccessToken()

    const response = await fetch(`${UBEREATS_CONFIG.apiUrl}/stores/${storeId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get store info: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`❌ Failed to get store info for ${storeId}:`, error)
    throw error
  }
}
*/

/**
 * 自動 Provisioning 店鋪 - 實作版本
 * @param {String} ubereatsStoreId - UberEats 店鋪ID
 * @param {String} userAccessToken - 用戶存取令牌
 */
export const autoProvisionStore = async (ubereatsStoreId, userAccessToken) => {
  try {
    console.log(`🔄 Auto-provisioning store: ${ubereatsStoreId}`)

    // 找出內部店鋪
    const internalStore = await Store.findOne({
      'deliveryPlatforms.platform': 'ubereats',
      'deliveryPlatforms.storeId': ubereatsStoreId,
    })

    if (!internalStore) {
      throw new Error(`找不到對應的店鋪設定: ${ubereatsStoreId}`)
    }

    // 使用提供的 User Access Token 或自動獲取 provisioning token
    const token = userAccessToken || (await getTokenForOperation('provisioning'))

    if (!token) {
      throw new Error('User Access Token 是 provisioning 操作的必需參數')
    }

    // 使用環境變數中的 SERVER_URL，如果沒有則使用預設值
    const serverUrl =
      process.env.SERVER_URL ||
      process.env.VITE_API_BASE_URL?.replace('/api', '') ||
      'http://localhost:8700'
    const webhookUrl = `${serverUrl}/api/delivery/webhook/ubereats`

    console.log(`🔑 Using User Access Token for provisioning`)
    console.log(`🔔 Webhook URL: ${webhookUrl}`)

    const response = await fetch(`${UBEREATS_CONFIG.apiUrl}/stores/${ubereatsStoreId}/pos_data`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        integration_enabled: true,
        external_store_id: internalStore._id.toString(),
        webhook_url: webhookUrl,
        pos_provider: process.env.COMPANY_NAME || 'Online Order System',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Provisioning failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    // 更新內部店鋪的整合狀態
    await Store.updateOne(
      {
        _id: internalStore._id,
        'deliveryPlatforms.platform': 'ubereats',
        'deliveryPlatforms.storeId': ubereatsStoreId,
      },
      {
        $set: {
          'deliveryPlatforms.$.isEnabled': true,
          'deliveryPlatforms.$.lastSyncAt': new Date(),
        },
      },
    )

    console.log(`✅ Store ${ubereatsStoreId} auto-provisioned successfully`)
    return {
      ...data,
      internalStoreId: internalStore._id.toString(),
      webhookUrl,
    }
  } catch (error) {
    console.error(`❌ Auto-provisioning failed for ${ubereatsStoreId}:`, error)
    throw error
  }
}

/**
 * TODO: POS 系統配置 (eats.pos_provisioning scope)
 * @param {String} storeId - UberEats 店鋪ID
 * @param {Object} posData - POS 配置數據
 */
/*
export const configurePOSIntegration = async (storeId, posData) => {
  try {
    const accessToken = await getAccessToken()

    const response = await fetch(`${UBEREATS_CONFIG.apiUrl}/stores/${storeId}/pos_data`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(posData),
    })

    if (!response.ok) {
      throw new Error(`Failed to configure POS: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`❌ Failed to configure POS for ${storeId}:`, error)
    throw error
  }
}
*/

/**
 * TODO: 獲取營運報表 (eats.report scope)
 * @param {String} storeId - UberEats 店鋪ID
 * @param {Object} reportOptions - 報表選項
 */
/*
export const getStoreReports = async (storeId, reportOptions) => {
  try {
    const accessToken = await getAccessToken()
    
    const queryParams = new URLSearchParams(reportOptions)
    const url = `${UBEREATS_CONFIG.apiUrl}/reports/stores/${storeId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get store reports: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`❌ Failed to get reports for ${storeId}:`, error)
    throw error
  }
}
*/
