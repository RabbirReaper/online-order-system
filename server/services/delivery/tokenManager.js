/**
 * UberEats Token 管理服務
 * 處理兩種不同類型的 token：User Token 和 App Token
 * 支援 token 刷新機制和過期檢測
 */

import dotenv from 'dotenv'
import { AppError } from '../../middlewares/error.js'

dotenv.config()

// Token 類型定義
export const TOKEN_TYPES = {
  USER: 'user',     // 用於 Provisioning
  APP: 'app',       // 用於日常 API 操作
}

// UberEats OAuth 配置
const OAUTH_CONFIG = {
  tokenUrl: 'https://login.uber.com/oauth/v2/token',
  environment: process.env.UBEREATS_ENVIRONMENT || 'sandbox',
  clientId: process.env.UBEREATS_ENVIRONMENT === 'production'
    ? process.env.UBEREATS_PRODUCTION_CLIENT_ID
    : process.env.UBEREATS_SANDBOX_CLIENT_ID,
  clientSecret: process.env.UBEREATS_ENVIRONMENT === 'production'
    ? process.env.UBEREATS_PRODUCTION_CLIENT_SECRET
    : process.env.UBEREATS_SANDBOX_CLIENT_SECRET,
}

/**
 * UberEats Token 管理類
 */
export class UberEatsTokenManager {
  
  /**
   * 獲取 User Access Token (用於 Provisioning)
   * @returns {String} User Access Token
   */
  static getUserToken() {
    const token = process.env.UBEREATS_USER_ACCESS_TOKEN
    
    if (!token) {
      console.warn('⚠️  User Access Token not configured')
      return null
    }
    
    console.log('🔑 Using User Access Token for Provisioning')
    return token
  }

  /**
   * 獲取 App Access Token (用於日常 API 操作)
   * @returns {String} App Access Token
   */
  static getAppToken() {
    const token = process.env.UBEREATS_APP_ACCESS_TOKEN
    
    if (!token) {
      console.warn('⚠️  App Access Token not configured')
      return null
    }
    
    console.log('🔑 Using App Access Token for API operations')
    return token
  }

  /**
   * 根據操作類型自動選擇合適的 Token
   * @param {String} operation - 操作類型：'provisioning', 'orders', 'store', 'reports'
   * @returns {String} 適合的 Access Token
   */
  static getTokenForOperation(operation) {
    const provisioningOperations = ['provisioning', 'pos_data', 'setup']
    const isProvisioningOperation = provisioningOperations.some(op => 
      operation.toLowerCase().includes(op)
    )

    if (isProvisioningOperation) {
      const token = this.getUserToken()
      if (!token) {
        throw new AppError('User Access Token required for provisioning operations', 401)
      }
      return token
    } else {
      const token = this.getAppToken()
      if (!token) {
        throw new AppError('App Access Token required for API operations', 401)
      }
      return token
    }
  }

  /**
   * 刷新 User Access Token
   * @returns {Promise<String>} 新的 User Access Token
   */
  static async refreshUserToken() {
    try {
      const refreshToken = process.env.UBEREATS_REFRESH_TOKEN

      if (!refreshToken) {
        throw new Error('Refresh token not available')
      }

      if (!OAUTH_CONFIG.clientId || !OAUTH_CONFIG.clientSecret) {
        throw new Error('OAuth credentials not configured')
      }

      console.log('🔄 Refreshing User Access Token...')

      const response = await fetch(OAUTH_CONFIG.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: OAUTH_CONFIG.clientId,
          client_secret: OAUTH_CONFIG.clientSecret,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Token refresh failed: ${response.status} - ${errorText}`)
      }

      const tokenData = await response.json()

      // 記錄新的 token 資訊（不記錄實際 token 值）
      console.log('✅ User Access Token refreshed successfully')
      console.log(`📋 New token expires in: ${tokenData.expires_in} seconds`)
      
      if (tokenData.refresh_token) {
        console.log('🔄 New refresh token also received')
      }

      // 這裡您可能需要將新的 token 儲存到資料庫或更新環境變數
      // TODO: 實作 token 持久化儲存
      console.log('⚠️  Remember to update UBEREATS_USER_ACCESS_TOKEN in your environment')

      return tokenData.access_token
    } catch (error) {
      console.error('❌ Failed to refresh User Access Token:', error)
      throw new AppError(`Token refresh failed: ${error.message}`, 500)
    }
  }

  /**
   * 驗證 Token 是否有效
   * @param {String} token - 要驗證的 token
   * @param {String} type - token 類型 ('user' 或 'app')
   * @returns {Promise<Boolean>} token 是否有效
   */
  static async validateToken(token, type = TOKEN_TYPES.APP) {
    try {
      if (!token) {
        return false
      }

      // 根據 token 類型選擇驗證端點
      let testEndpoint
      if (type === TOKEN_TYPES.USER) {
        // User token 通常用於 provisioning，測試店鋪列表端點
        testEndpoint = `${this.getApiUrl()}/eats/stores`
      } else {
        // App token 用於日常操作，測試一般 API 端點
        testEndpoint = `${this.getApiUrl()}/eats/stores`
      }

      const response = await fetch(testEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const isValid = response.status !== 401 && response.status !== 403
      
      if (isValid) {
        console.log(`✅ ${type.toUpperCase()} token validation successful`)
      } else {
        console.log(`❌ ${type.toUpperCase()} token validation failed: ${response.status}`)
      }

      return isValid
    } catch (error) {
      console.error(`❌ Token validation error for ${type}:`, error)
      return false
    }
  }

  /**
   * 獲取 API URL
   * @returns {String} API URL
   */
  static getApiUrl() {
    return OAUTH_CONFIG.environment === 'production' 
      ? 'https://api.uber.com/v1'
      : 'https://sandbox-api.uber.com/v1'
  }

  /**
   * 檢查所有 token 的配置狀態
   * @returns {Object} token 配置狀態報告
   */
  static getTokenStatus() {
    const userToken = process.env.UBEREATS_USER_ACCESS_TOKEN
    const appToken = process.env.UBEREATS_APP_ACCESS_TOKEN
    const refreshToken = process.env.UBEREATS_REFRESH_TOKEN

    return {
      userToken: {
        configured: !!userToken,
        length: userToken ? userToken.length : 0,
        hasRefreshCapability: !!refreshToken,
      },
      appToken: {
        configured: !!appToken,
        length: appToken ? appToken.length : 0,
        hasRefreshCapability: false, // App tokens 通常不支援刷新
      },
      refreshToken: {
        configured: !!refreshToken,
        length: refreshToken ? refreshToken.length : 0,
      },
      environment: OAUTH_CONFIG.environment,
      clientCredentials: {
        clientId: !!OAUTH_CONFIG.clientId,
        clientSecret: !!OAUTH_CONFIG.clientSecret,
      },
    }
  }

  /**
   * 生成用於測試的模擬 token（僅開發環境）
   * @param {String} type - token 類型
   * @returns {String} 模擬 token
   */
  static getMockToken(type = TOKEN_TYPES.APP) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Mock tokens are not available in production')
    }

    const mockTokens = {
      [TOKEN_TYPES.USER]: 'mock_user_token_for_provisioning',
      [TOKEN_TYPES.APP]: 'mock_app_token_for_operations',
    }

    console.log(`🧪 Using mock ${type} token for ${OAUTH_CONFIG.environment} environment`)
    return mockTokens[type] || mockTokens[TOKEN_TYPES.APP]
  }
}

/**
 * 便捷函數：獲取 User Token
 */
export const getUserToken = () => UberEatsTokenManager.getUserToken()

/**
 * 便捷函數：獲取 App Token  
 */
export const getAppToken = () => UberEatsTokenManager.getAppToken()

/**
 * 便捷函數：根據操作自動選擇 Token
 */
export const getTokenForOperation = (operation) => 
  UberEatsTokenManager.getTokenForOperation(operation)

/**
 * 便捷函數：刷新 User Token
 */
export const refreshUserToken = () => UberEatsTokenManager.refreshUserToken()

// 啟動時記錄 token 狀態
const tokenStatus = UberEatsTokenManager.getTokenStatus()
console.log('🔑 Token Manager initialized')
console.log(`📊 User Token: ${tokenStatus.userToken.configured ? '✅ Configured' : '❌ Missing'}`)
console.log(`📊 App Token: ${tokenStatus.appToken.configured ? '✅ Configured' : '❌ Missing'}`)
console.log(`📊 Refresh Token: ${tokenStatus.refreshToken.configured ? '✅ Available' : '❌ Missing'}`)
console.log(`🌍 Environment: ${tokenStatus.environment}`)

export default UberEatsTokenManager