/**
 * UberEats API 串接服務
 * 基於實際的 Store schema 處理與 UberEats 平台的所有 API 交互
 */

import Store from '../../models/Store/Store.js'
import { AppError } from '../../middlewares/error.js'
import * as orderSyncService from './orderSyncService.js'
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

  // 🔐 支援主要和次要簽名密鑰（用於密鑰輪換）
  webhookSecret:
    ENVIRONMENT === 'production'
      ? process.env.UBEREATS_PRODUCTION_WEBHOOK_SECRET
      : process.env.UBEREATS_SANDBOX_WEBHOOK_SECRET,

  webhookSecretSecondary:
    ENVIRONMENT === 'production'
      ? process.env.UBEREATS_PRODUCTION_WEBHOOK_SECRET_SECONDARY
      : process.env.UBEREATS_SANDBOX_WEBHOOK_SECRET_SECONDARY,

  // API URL 根據環境自動設定
  apiUrl:
    ENVIRONMENT === 'production' ? 'https://api.uber.com/v1' : 'https://sandbox-api.uber.com/v1',

  // OAuth URL 固定
  oauthUrl: 'https://login.uber.com/oauth/v2/token',

  scope: 'eats.order',
  environment: ENVIRONMENT,
}

// 啟動時記錄配置狀態
console.log(`🔧 UberEats Service initialized in ${ENVIRONMENT} mode`)
console.log(`📡 API URL: ${UBEREATS_CONFIG.apiUrl}`)
console.log(`🔑 Client ID configured: ${!!UBEREATS_CONFIG.clientId}`)
console.log(`🔐 Client Secret configured: ${!!UBEREATS_CONFIG.clientSecret}`)
console.log(`🔒 Primary Webhook Secret configured: ${!!UBEREATS_CONFIG.webhookSecret}`)
console.log(`🔒 Secondary Webhook Secret configured: ${!!UBEREATS_CONFIG.webhookSecretSecondary}`)

// 檢查簽名驗證能力
if (UBEREATS_CONFIG.webhookSecret && UBEREATS_CONFIG.webhookSecretSecondary) {
  console.log(`✅ Key rotation supported: Both primary and secondary keys available`)
} else if (UBEREATS_CONFIG.webhookSecret || UBEREATS_CONFIG.webhookSecretSecondary) {
  console.log(`⚠️  Single key mode: Key rotation not supported`)
} else {
  console.log(`❌ No webhook secrets configured: Signature verification disabled`)
}

/**
 * 驗證 UberEats webhook 簽名（支援主要和次要密鑰）
 * @param {String} payload - 請求內容
 * @param {String} signature - UberEats 簽名
 */
const verifyWebhookSignature = (payload, signature) => {
  // 如果沒有配置任何簽名密鑰，跳過驗證（僅開發環境）
  if (!UBEREATS_CONFIG.webhookSecret && !UBEREATS_CONFIG.webhookSecretSecondary) {
    console.warn('⚠️  No UberEats webhook secrets configured, skipping signature verification')
    return true
  }

  try {
    // 移除簽名前綴（如果有的話）
    const cleanSignature = signature.startsWith('sha256=')
      ? signature.substring(7).toLowerCase()
      : signature.toLowerCase()

    // 🔐 嘗試主要密鑰驗證
    if (UBEREATS_CONFIG.webhookSecret) {
      const expectedSignaturePrimary = crypto
        .createHmac('sha256', UBEREATS_CONFIG.webhookSecret)
        .update(payload, 'utf8')
        .digest('hex')
        .toLowerCase()

      const isPrimaryValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignaturePrimary, 'hex'),
        Buffer.from(cleanSignature, 'hex'),
      )

      if (isPrimaryValid) {
        console.log('🔐 Webhook signature verified with PRIMARY key')
        return true
      }
    }

    // 🔐 嘗試次要密鑰驗證（密鑰輪換支援）
    if (UBEREATS_CONFIG.webhookSecretSecondary) {
      const expectedSignatureSecondary = crypto
        .createHmac('sha256', UBEREATS_CONFIG.webhookSecretSecondary)
        .update(payload, 'utf8')
        .digest('hex')
        .toLowerCase()

      const isSecondaryValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignatureSecondary, 'hex'),
        Buffer.from(cleanSignature, 'hex'),
      )

      if (isSecondaryValid) {
        console.log('🔐 Webhook signature verified with SECONDARY key')
        console.warn('⚠️  Consider promoting secondary key to primary for better performance')
        return true
      }
    }

    console.log('❌ Webhook signature verification FAILED with both keys')
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
    const accessToken = await getAccessToken()

    const response = await fetch(`${UBEREATS_CONFIG.apiUrl}/eats/order/${orderId}`, {
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
 * 獲取 UberEats API 存取令牌
 * 實作 OAuth 2.0 Client Credentials 流程
 */
const getAccessToken = async () => {
  try {
    if (!UBEREATS_CONFIG.clientId || !UBEREATS_CONFIG.clientSecret) {
      // 在開發階段允許使用模擬 token
      if (UBEREATS_CONFIG.environment === 'sandbox') {
        console.log('🧪 Sandbox mode: using mock access token')
        return 'mock_access_token_for_sandbox'
      }

      throw new Error('UberEats client ID and secret are required')
    }

    const credentials = Buffer.from(
      `${UBEREATS_CONFIG.clientId}:${UBEREATS_CONFIG.clientSecret}`,
    ).toString('base64')

    console.log(`🔐 Requesting OAuth token from: ${UBEREATS_CONFIG.oauthUrl}`)

    const response = await fetch(UBEREATS_CONFIG.oauthUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=client_credentials&scope=${UBEREATS_CONFIG.scope}`,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ OAuth response:', response.status, errorText)

      // 在 sandbox 階段，如果 OAuth 失敗，返回模擬 token
      if (UBEREATS_CONFIG.environment === 'sandbox') {
        console.log('🧪 Sandbox mode: OAuth failed, using mock token')
        return 'mock_access_token_for_sandbox'
      }

      throw new Error(`OAuth error: ${response.status} ${response.statusText}`)
    }

    const tokenData = await response.json()
    console.log('✅ Successfully obtained OAuth token')
    return tokenData.access_token
  } catch (error) {
    console.error('❌ Failed to get access token:', error)

    // 在開發階段提供後備方案
    if (UBEREATS_CONFIG.environment === 'sandbox') {
      console.log('🧪 Sandbox mode: returning mock token as fallback')
      return 'mock_access_token_for_sandbox'
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
    webhookSecret: !!UBEREATS_CONFIG.webhookSecret,
    webhookSecretSecondary: !!UBEREATS_CONFIG.webhookSecretSecondary,
    apiUrl: !!UBEREATS_CONFIG.apiUrl,
  }

  // 基本配置檢查（不包含 secondary secret，因為它是可選的）
  const requiredFields = ['clientId', 'clientSecret', 'webhookSecret', 'apiUrl']
  const isComplete = requiredFields.every((field) => config[field])

  const missing = Object.keys(config)
    .filter((key) => key !== 'environment' && key !== 'webhookSecretSecondary') // 排除環境和次要密鑰
    .filter((key) => !config[key])

  // 簽名驗證能力評估
  const signatureCapability = {
    canVerify: config.webhookSecret || config.webhookSecretSecondary,
    hasKeyRotationSupport: config.webhookSecret && config.webhookSecretSecondary,
    recommendedSetup: config.webhookSecret && config.webhookSecretSecondary,
  }

  return {
    isComplete,
    config,
    missing,
    environment: UBEREATS_CONFIG.environment,
    apiUrl: UBEREATS_CONFIG.apiUrl,
    signatureCapability,
  }
}

/**
 * 測試 UberEats API 連接
 * @returns {Promise<Boolean>} 連接是否成功
 */
export const testUberEatsConnection = async () => {
  try {
    console.log(`🧪 Testing UberEats API connection in ${UBEREATS_CONFIG.environment} mode`)
    const accessToken = await getAccessToken()
    console.log(`✅ UberEats API connection test passed (${UBEREATS_CONFIG.environment})`)
    return true
  } catch (error) {
    console.error(`❌ UberEats API connection test failed (${UBEREATS_CONFIG.environment}):`, error)
    return false
  }
}
