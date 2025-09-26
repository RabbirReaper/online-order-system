import axios from 'axios'
import { withPlatformToken } from '../../../core/tokenManager.js'
import { AppError } from '../../../../../middlewares/error.js'

/**
 * 從 resource_href 獲取完整訂單詳情
 * @param {String} resourceHref - 訂單資源連結
 * @returns {Promise<Object>} 完整訂單資料
 */
export const getOrderDetails = async (resourceHref) => {
  return await withPlatformToken('ubereats', async (token) => {
    try {
      console.log('🔍 獲取 Uber Eats 訂單詳情:', resourceHref)

      const response = await axios.get(resourceHref, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate, br',
        },
        timeout: 30000,
      })

      if (!response.data) {
        throw new AppError('獲取訂單詳情失敗：空回應', 500)
      }

      console.log('✅ 成功獲取訂單詳情:', {
        orderId: response.data.id,
        displayId: response.data.display_id,
        state: response.data.state,
        status: response.data.status,
        total: response.data.payment?.charges?.total,
      })

      return response.data
    } catch (error) {
      if (error.response) {
        console.error('❌ API 請求失敗:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        })
        throw new AppError(
          `獲取 Uber Eats 訂單詳情失敗: ${error.response.status} ${error.response.statusText}`,
          error.response.status,
        )
      } else if (error.request) {
        console.error('❌ 網路請求失敗:', error.message)
        throw new AppError('網路連線問題，無法獲取訂單詳情', 500)
      } else {
        console.error('❌ 獲取訂單詳情時發生錯誤:', error.message)
        throw error
      }
    }
  })
}
