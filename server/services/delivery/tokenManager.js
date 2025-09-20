/**
 * UberEats Token 管理服務 - 重構版
 * 簡化的 token 管理，支援自動獲取和快取
 */

import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()

// OAuth 設定
const OAUTH_CONFIG = {
  tokenUrl: 'https://auth.uber.com/oauth/v2/token',
  clientId: process.env.UBEREATS_PRODUCTION_CLIENT_ID,
  clientSecret: process.env.UBEREATS_PRODUCTION_CLIENT_SECRET,
  scope: 'eats.store eats.order eats.store.status.write',
}

// Token 快取
let tokenCache = {
  accessToken: null,
  expiresAt: null,
}

/**
 * 獲取 Access Token（基於用戶提供的程式碼）
 * @returns {Promise<Object>} Token 資料物件，包含 access_token 和 expires_in
 */
const fetchAccessToken = async () => {
  try {
    if (!OAUTH_CONFIG.clientId || !OAUTH_CONFIG.clientSecret) {
      throw new Error('UberEats OAuth credentials not configured')
    }

    // console.log('🔑 正在獲取新的 Access Token...')

    // 使用 URLSearchParams（用戶推薦的方式）
    const formData = new URLSearchParams({
      client_id: OAUTH_CONFIG.clientId,
      client_secret: OAUTH_CONFIG.clientSecret,
      grant_type: 'client_credentials',
      scope: OAUTH_CONFIG.scope,
    })

    const response = await axios.post(OAUTH_CONFIG.tokenUrl, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    if (!response.data.access_token) {
      throw new Error('No access token received from UberEats')
    }

    // console.log('✅ 成功獲取 Access Token')
    // console.log(`⏰ Token 有效期: ${response.data.expires_in} 秒 (${Math.round(response.data.expires_in / 86400)} 天)`)

    return {
      access_token: response.data.access_token,
      expires_in: response.data.expires_in || 2592000, // 預設 30 天
    }
  } catch (error) {
    console.error('❌ 獲取 Access Token 失敗:', error.response?.data || error.message)
    throw new Error(`Failed to get access token: ${error.message}`)
  }
}

/**
 * 檢查 token 是否已過期
 * @returns {Boolean} token 是否過期
 */
const isTokenExpired = () => {
  if (!tokenCache.accessToken || !tokenCache.expiresAt) {
    return true
  }

  // 提前 5 分鐘刷新 token
  const bufferTime = 5 * 60 * 1000 // 5 分鐘
  return Date.now() >= tokenCache.expiresAt - bufferTime
}

/**
 * 獲取有效的 Access Token（自動管理版本）
 * 這是主要的公開函數，會自動處理 token 的獲取、快取和刷新
 * @returns {Promise<String>} 有效的 Access Token
 */
export const getAccessToken = async () => {
  try {
    // 檢查是否需要獲取新的 token
    if (isTokenExpired()) {
      // console.log('🔄 Token 已過期或不存在，正在獲取新的 token...')

      const tokenData = await fetchAccessToken()

      // 快取新的 token，使用 API 回應中的 expires_in 計算過期時間
      tokenCache.accessToken = tokenData.access_token
      tokenCache.expiresAt = Date.now() + tokenData.expires_in * 1000 // 使用實際的過期時間（秒轉毫秒）

      // console.log('✅ Token 已更新並快取')
      // console.log(`⏰ Token 將於 ${new Date(tokenCache.expiresAt).toLocaleString('zh-TW')} 過期`)
    } else {
      // console.log('🔄 使用快取的 Token')
    }

    return tokenCache.accessToken
  } catch (error) {
    console.error('❌ 獲取 Access Token 失敗:', error)
    throw error
  }
}

/**
 * 強制刷新 token（清除快取並獲取新的 token）
 * @returns {Promise<String>} 新的 Access Token
 */
export const refreshToken = async () => {
  // console.log('🔄 強制刷新 Token...')

  // 清除快取
  tokenCache.accessToken = null
  tokenCache.expiresAt = null

  // 獲取新的 token
  return await getAccessToken()
}

/**
 * 檢查 token 配置狀態
 * @returns {Object} 配置狀態
 */
export const getTokenStatus = () => {
  return {
    configured: !!OAUTH_CONFIG.clientId && !!OAUTH_CONFIG.clientSecret,
    clientId: !!OAUTH_CONFIG.clientId,
    clientSecret: !!OAUTH_CONFIG.clientSecret,
    cached: !!tokenCache.accessToken,
    expires: tokenCache.expiresAt ? new Date(tokenCache.expiresAt).toISOString() : null,
    isValid: !isTokenExpired(),
  }
}

/**
 * 清除快取的 token
 */
export const clearTokenCache = () => {
  // console.log('🗑️ 清除 Token 快取')
  tokenCache.accessToken = null
  tokenCache.expiresAt = null
}

/**
 * 測試 token 是否有效（通過嘗試簡單的 API 呼叫）
 * @returns {Promise<Boolean>} token 是否有效
 */
export const validateToken = async () => {
  try {
    const token = await getAccessToken()

    // 嘗試呼叫一個簡單的 API 來驗證 token
    const response = await axios.get('https://api.uber.com/v1/delivery/stores', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const isValid = response.status === 200
    // console.log(isValid ? '✅ Token 驗證成功' : '❌ Token 驗證失敗')
    return isValid
  } catch (error) {
    // console.log('❌ Token 驗證失敗:', error.response?.status || error.message)
    return false
  }
}

// 啟動時記錄配置狀態
const status = getTokenStatus()
// console.log('🔑 Token Manager 已初始化')
// console.log(`📊 配置狀態: ${status.configured ? '✅ 已配置' : '❌ 缺少配置'}`)
if (!status.configured) {
  // if (!status.clientId) console.log('❌ 缺少 UBEREATS_PRODUCTION_CLIENT_ID')
  // if (!status.clientSecret) console.log('❌ 缺少 UBEREATS_PRODUCTION_CLIENT_SECRET')
}

// 預設導出
export default {
  getAccessToken,
  refreshToken,
  getTokenStatus,
  clearTokenCache,
  validateToken,
}
