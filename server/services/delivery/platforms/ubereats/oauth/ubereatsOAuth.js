/**
 * Uber Eats OAuth 服務
 * 處理 Authorization Code Flow 的核心邏輯
 *
 * 流程：
 * 1. generateAuthorizationUrl() - 生成授權 URL
 * 2. 店家在 Uber 頁面授權
 * 3. exchangeCodeForToken() - 用 code 換取 tokens
 * 4. getAuthorizedStores() - Store Discovery API
 * 5. refreshUserToken() - 刷新 user access token
 */

import axios from 'axios'
import dotenv from 'dotenv'
import { AppError } from '../../../../../middlewares/error.js'

dotenv.config()

// ========================================
// 🔧 OAuth 配置
// ========================================

const AUTH_URL = 'https://auth.uber.com/oauth/v2/authorize'
const TOKEN_URL = 'https://auth.uber.com/oauth/v2/token'
const STORE_DISCOVERY_URL = 'https://api.uber.com/v1/eats/stores'

const CLIENT_ID = process.env.UBEREATS_PRODUCTION_CLIENT_ID
const CLIENT_SECRET = process.env.UBEREATS_PRODUCTION_CLIENT_SECRET
const REDIRECT_URI = process.env.UBEREATS_OAUTH_REDIRECT_URI
// 🔧 Authorization Code Flow 專用 Scope
// eats.pos_provisioning 包含以下權限：
// - Store Discovery: 查詢用戶授權的店舖列表
// - POS Provisioning: 設置/移除 POS 整合
//
// 注意：不能混合 Authorization Code 和 Client Credentials 的 scopes！
// Client Credentials scopes (eats.store, eats.order, etc.) 需要另外用 Client Credentials Flow 獲取
const SCOPE = 'eats.pos_provisioning'

// ========================================
// 🔐 OAuth 核心函數
// ========================================

/**
 * 生成授權 URL
 * @param {String} state - CSRF 防護用的隨機字串（存在 session）
 * @returns {String} - 完整的授權 URL
 *
 * @example
 * const authUrl = generateAuthorizationUrl('random-state-string')
 * // https://auth.uber.com/oauth/v2/authorize?client_id=...&response_type=code&...
 */
export const generateAuthorizationUrl = (state) => {
  // 驗證環境變數
  if (!CLIENT_ID) {
    throw new AppError('缺少 UBEREATS_PRODUCTION_CLIENT_ID 環境變數', 500)
  }

  if (!REDIRECT_URI) {
    throw new AppError('缺少 UBEREATS_OAUTH_REDIRECT_URI 環境變數', 500)
  }

  // 建立 URL 參數
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPE,
    state: state,
  })

  const authorizationUrl = `${AUTH_URL}?${params.toString()}`
  return authorizationUrl
}

/**
 * 用授權碼換取 access token
 * @param {String} code - Uber 回傳的授權碼
 * @returns {Promise<Object>} Token 資料
 * @returns {String} return.access_token - User access token
 * @returns {String} return.refresh_token - Refresh token
 * @returns {Number} return.expires_in - 過期時間（秒）
 * @returns {String} return.scope - 權限範圍
 *
 * @throws {AppError} Token exchange 失敗
 */
export const exchangeCodeForToken = async (code) => {
  try {
    // 驗證環境變數
    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
      throw new AppError(
        '缺少 Uber Eats OAuth 憑證，請檢查環境變數 UBEREATS_PRODUCTION_CLIENT_ID, UBEREATS_PRODUCTION_CLIENT_SECRET, UBEREATS_OAUTH_REDIRECT_URI',
        500,
      )
    }

    // 準備請求參數
    const formData = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI,
      code: code,
    })

    // 發送請求
    const response = await axios.post(TOKEN_URL, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    console.log('✅ 成功獲取 access token')

    // 返回格式：
    // {
    //   access_token: 'user-token-here',
    //   refresh_token: 'refresh-token-here',
    //   expires_in: 2592000,  // 30 天
    //   token_type: 'Bearer',
    //   scope: 'eats.pos_provisioning'
    // }
    return response.data
  } catch (error) {
    console.error('❌ Token exchange 失敗:', error.response?.data || error.message)

    // 處理常見錯誤
    if (error.response?.status === 400) {
      const errorData = error.response.data
      if (errorData.error === 'invalid_grant') {
        throw new AppError('授權碼無效或已過期，請重新授權', 400)
      }
    }

    throw new AppError(`無法獲取 access token: ${error.message}`, 500)
  }
}

/**
 * 刷新 user access token
 * @param {String} refreshToken - Refresh token
 * @returns {Promise<Object>} 新的 token 資料
 *
 * @throws {AppError} Token refresh 失敗
 */
export const refreshUserToken = async (refreshToken) => {
  try {
    // 驗證環境變數
    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new AppError(
        '缺少 Uber Eats OAuth 憑證，請檢查環境變數 UBEREATS_PRODUCTION_CLIENT_ID, UBEREATS_PRODUCTION_CLIENT_SECRET',
        500,
      )
    }

    // 準備請求參數
    const formData = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    })

    // 發送請求
    const response = await axios.post(TOKEN_URL, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    console.log('✅ 成功刷新 access token')

    return response.data
  } catch (error) {
    console.error('❌ Token refresh 失敗:', error.response?.data || error.message)

    if (error.response?.status === 400) {
      throw new AppError('Refresh token 無效或已過期，請重新授權', 400)
    }

    throw new AppError(`無法刷新 access token: ${error.message}`, 500)
  }
}

/**
 * Store Discovery - 取得授權帳號下的所有店舖
 * @param {String} userAccessToken - User access token (Authorization Code Flow 取得)
 * @returns {Promise<Array>} 店舖列表
 * @returns {String} return[].id - Uber Eats 店舖 ID
 * @returns {String} return[].name - 店舖名稱
 * @returns {Object} return[].location - 店舖位置資訊
 *
 * @throws {AppError} Store Discovery 失敗
 *
 * @example
 * const stores = await getAuthorizedStores(userToken)
 * // [{ id: 'store-uuid', name: 'My Restaurant', location: {...} }]
 */
export const getAuthorizedStores = async (userAccessToken) => {
  try {
    // 呼叫 Store Discovery API
    const response = await axios.get(STORE_DISCOVERY_URL, {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
        'Content-Type': 'application/json',
      },
    })

    const stores = response.data.stores || []
    console.log(`✅ 發現 ${stores.length} 個店舖`)

    // 回傳簡化的店舖資訊
    return stores.map((store) => ({
      id: store.id || store.store_id || store.uuid,
      name: store.name,
      location: store.location,
      // 可以根據需要新增更多欄位
    }))
  } catch (error) {
    console.error('❌ Store Discovery 失敗:', error.response?.data || error.message)

    // 處理常見錯誤
    if (error.response?.status === 401) {
      throw new AppError('Access token 無效或已過期，請重新授權', 401)
    }

    if (error.response?.status === 403) {
      throw new AppError('權限不足，請確認您的 Uber Eats 帳號有管理權限', 403)
    }

    throw new AppError(`無法取得店舖列表: ${error.message}`, 500)
  }
}

/**
 * 激活店舖整合（POS Data API）
 * 通知 Uber Eats 這個店舖已連接到我們的 POS 系統
 *
 * @param {String} userAccessToken - User access token
 * @param {String} storeId - Uber Eats 店舖 ID
 * @param {String} externalReferenceId - 我們系統中的店舖 ID
 * @returns {Promise<Object>} API 回應
 *
 * @throws {AppError} 激活失敗
 */
export const activateStoreIntegration = async (userAccessToken, storeId, externalReferenceId) => {
  try {
    const url = `https://api.uber.com/v1/eats/stores/${storeId}/pos_data`

    const response = await axios.post(
      url,
      {
        external_reference_id: externalReferenceId,
        provider: 'YourPOSName', // 可以改成你的 POS 系統名稱
      },
      {
        headers: {
          Authorization: `Bearer ${userAccessToken}`,
          'Content-Type': 'application/json',
        },
      },
    )

    console.log(`✅ 激活店舖整合: ${storeId}`)

    return response.data
  } catch (error) {
    console.error('❌ 激活店舖整合失敗:', error.response?.data || error.message)

    if (error.response?.status === 401) {
      throw new AppError('Access token 無效或已過期', 401)
    }

    if (error.response?.status === 404) {
      throw new AppError('找不到指定的店舖', 404)
    }

    throw new AppError(`無法激活店舖整合: ${error.message}`, 500)
  }
}
