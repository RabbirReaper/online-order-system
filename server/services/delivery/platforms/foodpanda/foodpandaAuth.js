/**
 * Foodpanda Authentication Service
 * Handles OAuth 2.0 authentication for Foodpanda API
 */

import axios from 'axios'
import { AppError } from '../../../../middlewares/error.js'

const BASE_URL =
  process.env.FOODPANDA_BASE_URL || 'https://integration-middleware.as.restaurant-partners.com'

/**
 * Get Foodpanda Access Token
 * @returns {Promise<Object>} Token data { access_token, expires_in, refresh_token }
 */
export const getAccessToken = async () => {
  try {
    const username = process.env.FOODPANDA_PRODUCTION_USERNAME
    const password = process.env.FOODPANDA_PRODUCTION_PASSWORD

    if (!username || !password) {
      throw new AppError(
        '缺少 Foodpanda API 憑證，請檢查環境變數 FOODPANDA_PRODUCTION_USERNAME 和 FOODPANDA_PRODUCTION_PASSWORD',
        500,
      )
    }

    // Construct form data
    const formData = new URLSearchParams({
      username: username,
      password: password,
      grant_type: 'client_credentials',
    })

    // Call Foodpanda OAuth 2.0 endpoint
    const response = await axios.post(`${BASE_URL}/v2/login`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 30000,
    })

    console.log('✅ 成功獲取 Foodpanda Access Token')

    // 返回格式與 UberEats 保持一致
    return {
      access_token: response.data.access_token,
      expires_in: response.data.expires_in || 3600, // Default 1 hour
      refresh_token: null, // Foodpanda 可能沒有 refresh token
    }
  } catch (error) {
    console.error('❌ 獲取 Foodpanda Access Token 失敗:', error.response?.data || error.message)
    throw new AppError(
      `Foodpanda 認證失敗: ${error.response?.data?.error_description || error.message}`,
      error.response?.status || 500,
    )
  }
}
