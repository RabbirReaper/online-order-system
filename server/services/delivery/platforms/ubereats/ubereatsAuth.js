/**
 * Uber Eats 認證服務
 * 處理 Uber Eats 平台的 OAuth 認證
 */

import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

// Uber Eats OAuth 配置
const AUTH_URL = 'https://auth.uber.com/oauth/v2/token'
const CLIENT_ID = process.env.UBEREATS_PRODUCTION_CLIENT_ID
const CLIENT_SECRET = process.env.UBEREATS_PRODUCTION_CLIENT_SECRET
const SCOPE = 'eats.store eats.order eats.store.status.write'

/**
 * 獲取 Uber Eats Access Token
 * @returns {Promise<Object>} Token 資料
 * @returns {String} return.access_token - Access Token
 * @returns {String} return.token_type - Token 類型
 * @returns {Number} return.expires_in - 過期時間（秒）
 * @returns {String} return.scope - 權限範圍
 */
export const getAccessToken = async () => {
  try {
    // 驗證環境變數
    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error(
        '缺少 Uber Eats API 憑證，請檢查環境變數 UBEREATS_PRODUCTION_CLIENT_ID 和 UBEREATS_PRODUCTION_CLIENT_SECRET',
      )
    }

    // 準備請求參數
    const formData = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'client_credentials',
      scope: SCOPE,
    })

    // 發送請求
    const response = await axios.post(AUTH_URL, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    // console.log('✅ 成功獲取 Uber Eats Access Token')

    // 返回格式：
    // {
    //   access_token: 'IA.AQAAAAR1Fa9Ig89YzHzg0FfaKrmCbBTdn6MR0fsGhcSKqfWPsCAabFO9V_XCKi6Fziq3YFQiW-quky1GzcGH5rd_kl81CbDUcRYf1x6rNg6UcCvAPL7CbG6fDj1SASyQUTryzlU1PaAcV-CavHGaSNlsHLwAxei87JZmBRoLGqA',
    //   token_type: 'Bearer',
    //   expires_in: 2592000,  // 30 天
    //   scope: 'eats.order eats.store eats.store.status.write'
    // }
    return response.data
  } catch (error) {
    console.error('❌ 獲取 Uber Eats Access Token 失敗:', error.response?.data || error.message)
    throw error
  }
}
