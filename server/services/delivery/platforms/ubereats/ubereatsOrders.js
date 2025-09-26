/**
 * Uber Eats 訂單服務
 * 處理 Uber Eats 訂單相關的 API 操作
 */

import axios from 'axios'
import { withPlatformToken } from '../../core/tokenManager.js'
import { AppError } from '../../../../middlewares/error.js'

// 🔧 修正 API 基礎 URL - 使用正確的 delivery API
const BASE_URL = 'https://api.uber.com/v1/delivery'

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

/**
 * 直接根據訂單 ID 獲取訂單詳情
 * @param {String} orderId - 訂單 ID
 * @returns {Promise<Object>} 完整訂單資料
 */
export const getOrderById = async (orderId) => {
  return await withPlatformToken('ubereats', async (token) => {
    try {
      console.log('🔍 根據 ID 獲取 Uber Eats 訂單詳情:', orderId)

      // 🔧 使用正確的 delivery API 端點
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

/**
 * 接受訂單 (必須在 11.5 分鐘內完成)
 * @param {String} orderId - 訂單 ID
 * @param {String} reason - 接受原因
 * @returns {Promise<Object>} 接受結果
 */
export const acceptOrder = async (orderId, reason = 'Order accepted by POS system') => {
  return await withPlatformToken('ubereats', async (token) => {
    try {
      console.log('✅ 接受 Uber Eats 訂單:', orderId)

      // 🔧 使用正確的 delivery API 端點
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

      console.log('✅ 訂單接受成功:', orderId)
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
