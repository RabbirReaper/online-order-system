import axios from 'axios'
import { withPlatformToken } from '../../../core/tokenManager.js'
import { AppError } from '../../../../../middlewares/error.js'

const BASE_URL = 'https://api.uber.com/v1/delivery'

/**
 * 接受訂單 (必須在 11.5 分鐘內完成)
 * @param {String} orderId - 訂單 ID
 * @param {String} reason - 接受原因
 * @returns {Promise<Object>} 接受結果
 */
export const acceptOrder = async (orderId, reason = 'Order accepted by POS system') => {
  return await withPlatformToken('ubereats', async (token) => {
    try {
      // console.log('✅ 接受 Uber Eats 訂單:', orderId)

      const response = await axios.post(
        `${BASE_URL}/order/${orderId}/accept`,
        {
          reason: reason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      )

      // console.log('✅ 訂單接受成功:', orderId)
      return response.data
    } catch (error) {
      if (error.response) {
        console.error('❌ 接受訂單失敗:', {
          orderId,
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          requestUrl: `${BASE_URL}/order/${orderId}/accept`,
        })

        // 如果訂單已被接受或超時，不要拋出錯誤
        if (error.response.status === 400 || error.response.status === 409) {
          console.warn('⚠️ 訂單可能已被接受或狀態已改變:', orderId)
          return { success: false, reason: 'Order already processed' }
        }

        throw new AppError(
          `接受 Uber Eats 訂單失敗: ${error.response.status} ${error.response.statusText}`,
          error.response.status,
        )
      } else {
        console.error('❌ 接受訂單時發生錯誤:', error.message)
        throw error
      }
    }
  })
}
