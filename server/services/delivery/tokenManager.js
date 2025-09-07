/**
 * UberEats Token 管理服務
 * 處理兩種不同類型的 token：User Token 和 App Token
 * 支援 token 刷新機制和過期檢測
 */

import dotenv from 'dotenv'
import { AppError } from '../../middlewares/error.js'

dotenv.config()

// 重新設計 Token 類型 - 符合 UberEats 官方規範
export const TOKEN_TYPES = {
  CLIENT_CREDENTIALS: 'client_credentials', // 日常操作
  AUTHORIZATION_CODE: 'authorization_code', // POS Provisioning
}

// UberEats OAuth 配置
const OAUTH_CONFIG = {
  tokenUrl: 'https://login.uber.com/oauth/v2/token',
  environment: process.env.UBEREATS_ENVIRONMENT || 'sandbox',
  clientId:
    process.env.UBEREATS_ENVIRONMENT === 'production'
      ? process.env.UBEREATS_PRODUCTION_CLIENT_ID
      : process.env.UBEREATS_SANDBOX_CLIENT_ID,
  clientSecret:
    process.env.UBEREATS_ENVIRONMENT === 'production'
      ? process.env.UBEREATS_PRODUCTION_CLIENT_SECRET
      : process.env.UBEREATS_SANDBOX_CLIENT_SECRET,
}

/**
 * UberEats Token 管理類
 */
export class UberEatsTokenManager {
  /**
   * 獲取 Client Credentials Token (用於日常 API 操作)
   * 使用正確的 OAuth2 client_credentials 流程
   * @returns {Promise<String>} Access Token
   */
  static async getClientCredentialsToken() {
    try {
      if (!OAUTH_CONFIG.clientId || !OAUTH_CONFIG.clientSecret) {
        throw new Error('OAuth credentials not configured')
      }

      console.log('🔑 Requesting Client Credentials Token...')

      const response = await fetch(OAUTH_CONFIG.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: OAUTH_CONFIG.clientId,
          client_secret: OAUTH_CONFIG.clientSecret,
          scope: 'eats.store eats.order eats.store.status.write eats.store.status.read eats.store.orders.read eats.store.orders.cancel',
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Client credentials token request failed: ${response.status} - ${errorText}`)
      }

      const tokenData = await response.json()
      console.log('✅ Client Credentials Token obtained successfully')
      return tokenData.access_token
    } catch (error) {
      console.error('❌ Failed to get Client Credentials Token:', error)
      throw new AppError(`Token request failed: ${error.message}`, 500)
    }
  }

  /**
   * 獲取 Authorization Code Token (用於 POS Provisioning)
   * 需要預先配置的 User Access Token
   * @returns {String} User Access Token for Provisioning
   */
  static getAuthorizationCodeToken() {
    const token = process.env.UBEREATS_USER_ACCESS_TOKEN

    if (!token) {
      console.warn('⚠️  User Access Token not configured for provisioning')
      console.log('💡 For provisioning operations, you need to obtain a User Access Token through the Authorization Code flow')
      return null
    }

    console.log('🔑 Using User Access Token for POS Provisioning')
    return token
  }

  /**
   * 根據 scopes 自動選擇認證流程並獲取 Token
   * @param {Array} scopes - 所需的權限範圍，預設為基本 API 操作權限
   * @returns {Promise<String>} 適合的 Access Token
   */
  static async getToken(scopes = ['eats.store', 'eats.order']) {
    const provisioningScopes = ['eats.pos_provisioning']
    const needsProvisioning = scopes.some(scope => 
      provisioningScopes.includes(scope)
    )

    if (needsProvisioning) {
      // POS Provisioning 需要 User Access Token (Authorization Code 流程)
      const token = this.getAuthorizationCodeToken()
      if (!token) {
        throw new AppError('User Access Token required for provisioning operations. Please configure UBEREATS_USER_ACCESS_TOKEN.', 401)
      }
      return token
    } else {
      // 日常操作使用 Client Credentials 流程
      return await this.getClientCredentialsToken()
    }
  }

  /**
   * 根據操作類型自動選擇合適的 Token（向後相容）
   * @param {String} operation - 操作類型：'provisioning', 'orders', 'store', 'reports'
   * @returns {Promise<String>} 適合的 Access Token
   */
  static async getTokenForOperation(operation) {
    const provisioningOperations = ['provisioning', 'pos_data', 'setup']
    const isProvisioningOperation = provisioningOperations.some((op) =>
      operation.toLowerCase().includes(op),
    )

    if (isProvisioningOperation) {
      return await this.getToken(['eats.pos_provisioning'])
    } else {
      return await this.getToken(['eats.store', 'eats.order'])
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
   * @param {String} flow - OAuth 流程類型
   * @returns {Promise<Boolean>} token 是否有效
   */
  static async validateToken(token, flow = TOKEN_TYPES.CLIENT_CREDENTIALS) {
    try {
      if (!token) {
        return false
      }

      // 使用統一的測試端點驗證 token
      const testEndpoint = `${this.getApiUrl()}/stores`

      const response = await fetch(testEndpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const isValid = response.status !== 401 && response.status !== 403

      if (isValid) {
        console.log(`✅ ${flow} token validation successful`)
      } else {
        console.log(`❌ ${flow} token validation failed: ${response.status}`)
      }

      return isValid
    } catch (error) {
      console.error(`❌ Token validation error for ${flow}:`, error)
      return false
    }
  }

  /**
   * 獲取 API URL - 統一使用官方生產端點
   * @returns {String} API URL
   */
  static getApiUrl() {
    return 'https://api.uber.com/v1/eats'
  }

  /**
   * 檢查所有 token 的配置狀態
   * @returns {Object} token 配置狀態報告
   */
  static getTokenStatus() {
    const userToken = process.env.UBEREATS_USER_ACCESS_TOKEN
    const refreshToken = process.env.UBEREATS_REFRESH_TOKEN

    return {
      clientCredentials: {
        canGenerate: !!OAUTH_CONFIG.clientId && !!OAUTH_CONFIG.clientSecret,
        clientId: !!OAUTH_CONFIG.clientId,
        clientSecret: !!OAUTH_CONFIG.clientSecret,
        flow: TOKEN_TYPES.CLIENT_CREDENTIALS,
      },
      authorizationCode: {
        configured: !!userToken,
        tokenLength: userToken ? userToken.length : 0,
        hasRefreshCapability: !!refreshToken,
        flow: TOKEN_TYPES.AUTHORIZATION_CODE,
      },
      refreshToken: {
        configured: !!refreshToken,
        length: refreshToken ? refreshToken.length : 0,
      },
      environment: OAUTH_CONFIG.environment,
      apiUrl: this.getApiUrl(),
    }
  }

  /**
   * 生成用於測試的模擬 token（僅開發環境）
   * @param {String} flow - OAuth 流程類型
   * @returns {String} 模擬 token
   */
  static getMockToken(flow = TOKEN_TYPES.CLIENT_CREDENTIALS) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Mock tokens are not available in production')
    }

    const mockTokens = {
      [TOKEN_TYPES.CLIENT_CREDENTIALS]: 'mock_client_credentials_token_for_api_operations',
      [TOKEN_TYPES.AUTHORIZATION_CODE]: 'mock_authorization_code_token_for_provisioning',
    }

    console.log(`🧪 Using mock ${flow} token for ${OAUTH_CONFIG.environment} environment`)
    return mockTokens[flow] || mockTokens[TOKEN_TYPES.CLIENT_CREDENTIALS]
  }
}

/**
 * 便捷函數：獲取 Client Credentials Token
 */
export const getClientCredentialsToken = () => UberEatsTokenManager.getClientCredentialsToken()

/**
 * 便捷函數：獲取 Authorization Code Token
 */
export const getAuthorizationCodeToken = () => UberEatsTokenManager.getAuthorizationCodeToken()

/**
 * 便捷函數：根據 scopes 自動選擇並獲取 Token
 */
export const getToken = (scopes) => UberEatsTokenManager.getToken(scopes)

/**
 * 便捷函數：根據操作自動選擇 Token（向後相容）
 */
export const getTokenForOperation = (operation) =>
  UberEatsTokenManager.getTokenForOperation(operation)

/**
 * 向後相容：舊的 getUserToken 和 getAppToken 函數
 */
export const getUserToken = () => UberEatsTokenManager.getAuthorizationCodeToken()
export const getAppToken = () => UberEatsTokenManager.getClientCredentialsToken()

/**
 * 便捷函數：刷新 User Token
 */
export const refreshUserToken = () => UberEatsTokenManager.refreshUserToken()

// 啟動時記錄 token 狀態
const tokenStatus = UberEatsTokenManager.getTokenStatus()
console.log('🔑 Token Manager initialized with OAuth2 flows')
console.log(`📊 Client Credentials: ${tokenStatus.clientCredentials.canGenerate ? '✅ Ready' : '❌ Missing credentials'}`)
console.log(`📊 Authorization Code: ${tokenStatus.authorizationCode.configured ? '✅ Configured' : '❌ Missing user token'}`)
console.log(
  `📊 Refresh Token: ${tokenStatus.refreshToken.configured ? '✅ Available' : '❌ Missing'}`,
)
console.log(`🌍 Environment: ${tokenStatus.environment}`)
console.log(`🔗 API URL: ${tokenStatus.apiUrl}`)

export default UberEatsTokenManager
