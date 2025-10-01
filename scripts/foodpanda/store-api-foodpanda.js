import dotenv from 'dotenv'
import axios from 'axios'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// 載入環境變數
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const baseUrl = 'https://integration-middleware.as.restaurant-partners.com'
const username = process.env.FOODPANDA_PRODUCTION_USERNAME
const password = process.env.FOODPANDA_PRODUCTION_PASSWORD
const secret = process.env.FOODPANDA_PRODUCTION_SECRET

const chainCode = 't7c1'
const posVendorId = 'RabbirOrder001'

const getAccessToken = async () => {
  try {
    // 構造 form data
    const formData = new URLSearchParams({
      username: username,
      password: password,
      grant_type: 'client_credentials',
    })

    // 正確的 API 端點
    const response = await axios.post(`${baseUrl}/v2/login`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    return response.data.access_token
  } catch (error) {
    console.error('獲取 Access Token 失敗:', error.response?.data || error.message)
    throw error
  }
}

const getAvailableStatus = async (accessToken) => {
  try {
    const response = await axios.get(
      `${baseUrl}/v2/chains/${chainCode}/remoteVendors/${posVendorId}/availability`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    return response.data
  } catch (error) {
    console.error('獲取可用狀態失敗:', error.response?.data || error.message)
    throw error
  }
}

const main = async () => {
  try {
    const token = await getAccessToken()

    if (!token) {
      throw new Error('無法獲取存取權杖')
    }

    const status = await getAvailableStatus(token)
    console.log(status)
  } catch (error) {
    console.error('發生錯誤:', error.message)
  }
}

main()
