import axios from 'axios'
import { withPlatformToken } from '../../../core/tokenManager.js'
import { AppError } from '../../../../../middlewares/error.js'

const BASE_URL = 'https://api.uber.com/v1/delivery'

/**
 * 直接根據訂單 ID 獲取訂單詳情
 * @param {String} orderId - 訂單 ID
 * @returns {Promise<Object>} 完整訂單資料
 */
export const getOrderById = async (orderId) => {
  return await withPlatformToken('ubereats', async (token) => {
    try {
      console.log('🔍 根據 ID 獲取 Uber Eats 訂單詳情:', orderId)

      const response = await axios.get(`${BASE_URL}/order/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        timeout: 30000,
      })

      if (!response.data) {
        throw new AppError('獲取訂單詳情失敗：空回應', 500)
      }

      console.log('✅ 成功獲取訂單詳情 (by ID):', {
        orderId: response.data.id,
        displayId: response.data.display_id,
        state: response.data.state,
        status: response.data.status,
      })

      return response.data
    } catch (error) {
      if (error.response) {
        console.error('❌ 根據 ID 獲取訂單詳情失敗:', {
          orderId,
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        })
        throw new AppError(
          `獲取 Uber Eats 訂單詳情失敗: ${error.response.status} ${error.response.statusText}`,
          error.response.status,
        )
      } else {
        console.error('❌ 獲取訂單詳情時發生錯誤:', error.message)
        throw error
      }
    }
  })
}
