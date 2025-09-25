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

/**
 * 拒絕訂單
 * @param {String} orderId - 訂單 ID
 * @param {String} reason - 拒絕原因
 * @param {String} reasonCode - 拒絕原因代碼
 * @returns {Promise<Object>} 拒絕結果
 */
export const denyOrder = async (
  orderId,
  reason = 'Unable to fulfill order',
  reasonCode = 'out_of_stock',
) => {
  return await withPlatformToken('ubereats', async (token) => {
    try {
      console.log('❌ 拒絕 Uber Eats 訂單:', orderId)

      // 🔧 使用正確的 delivery API 端點
      const response = await axios.post(
        `${BASE_URL}/order/${orderId}/deny`,
        {
          reason: reason,
          reason_code: reasonCode,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      )

      console.log('❌ 訂單拒絕成功:', orderId)
      return response.data
    } catch (error) {
      if (error.response) {
        console.error('❌ 拒絕訂單失敗:', {
          orderId,
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        })

        throw new AppError(
          `拒絕 Uber Eats 訂單失敗: ${error.response.status} ${error.response.statusText}`,
          error.response.status,
        )
      } else {
        console.error('❌ 拒絕訂單時發生錯誤:', error.message)
        throw error
      }
    }
  })
}

/**
 * 更新訂單準備狀態 (訂單開始準備)
 * @param {String} orderId - 訂單 ID
 * @returns {Promise<Object>} 更新結果
 */
export const markOrderInProgress = async (orderId) => {
  return await withPlatformToken('ubereats', async (token) => {
    try {
      console.log('🍳 標記 Uber Eats 訂單為準備中:', orderId)

      // 🔧 使用正確的 delivery API 端點
      const response = await axios.patch(
        `${BASE_URL}/order/${orderId}`,
        {
          status: 'in_progress',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      )

      console.log('🍳 訂單狀態更新成功 (準備中):', orderId)
      return response.data
    } catch (error) {
      if (error.response) {
        console.error('❌ 更新訂單狀態失敗:', {
          orderId,
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        })

        throw new AppError(
          `更新 Uber Eats 訂單狀態失敗: ${error.response.status} ${error.response.statusText}`,
          error.response.status,
        )
      } else {
        console.error('❌ 更新訂單狀態時發生錯誤:', error.message)
        throw error
      }
    }
  })
}

/**
 * 標記訂單為準備完成 (可供外送員取餐)
 * @param {String} orderId - 訂單 ID
 * @returns {Promise<Object>} 更新結果
 */
export const markOrderReady = async (orderId) => {
  return await withPlatformToken('ubereats', async (token) => {
    try {
      console.log('✅ 標記 Uber Eats 訂單為準備完成:', orderId)

      // 🔧 使用正確的 delivery API 端點
      const response = await axios.patch(
        `${BASE_URL}/order/${orderId}`,
        {
          status: 'ready_for_pickup',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      )

      console.log('✅ 訂單狀態更新成功 (準備完成):', orderId)
      return response.data
    } catch (error) {
      if (error.response) {
        console.error('❌ 更新訂單狀態失敗:', {
          orderId,
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        })

        throw new AppError(
          `更新 Uber Eats 訂單狀態失敗: ${error.response.status} ${error.response.statusText}`,
          error.response.status,
        )
      } else {
        console.error('❌ 更新訂單狀態時發生錯誤:', error.message)
        throw error
      }
    }
  })
}

/**
 * 獲取店鋪訂單列表 (適用於手動同步)
 * @param {String} storeId - Uber Eats 店鋪 ID
 * @param {Object} options - 查詢選項
 * @returns {Promise<Array>} 訂單列表
 */
export const getStoreOrders = async (storeId, options = {}) => {
  return await withPlatformToken('ubereats', async (token) => {
    try {
      const { startDate, endDate, limit = 20, offset = 0, status } = options

      console.log('📋 獲取 Uber Eats 店鋪訂單列表:', { storeId, options })

      // 構建查詢參數
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      })

      if (startDate) {
        params.append('since', startDate)
      }

      if (endDate) {
        params.append('until', endDate)
      }

      if (status) {
        params.append('status', status)
      }

      // 🔧 使用正確的 delivery API 端點
      const response = await axios.get(
        `${BASE_URL}/stores/${storeId}/orders?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          timeout: 30000,
        },
      )

      console.log('📋 成功獲取訂單列表:', {
        count: response.data?.orders?.length || 0,
        hasMore: response.data?.has_more,
      })

      return response.data?.orders || []
    } catch (error) {
      if (error.response) {
        console.error('❌ 獲取店鋪訂單列表失敗:', {
          storeId,
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        })

        throw new AppError(
          `獲取 Uber Eats 訂單列表失敗: ${error.response.status} ${error.response.statusText}`,
          error.response.status,
        )
      } else {
        console.error('❌ 獲取訂單列表時發生錯誤:', error.message)
        throw error
      }
    }
  })
}

/**
 * 取消訂單 (僅在特定情況下可用)
 * @param {String} orderId - 訂單 ID
 * @param {String} reason - 取消原因
 * @returns {Promise<Object>} 取消結果
 */
export const cancelOrder = async (orderId, reason = 'Order cancelled by restaurant') => {
  return await withPlatformToken('ubereats', async (token) => {
    try {
      console.log('🚫 取消 Uber Eats 訂單:', orderId)

      // 🔧 使用正確的 delivery API 端點
      const response = await axios.post(
        `${BASE_URL}/order/${orderId}/cancel`,
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

      console.log('🚫 訂單取消成功:', orderId)
      return response.data
    } catch (error) {
      if (error.response) {
        console.error('❌ 取消訂單失敗:', {
          orderId,
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        })

        throw new AppError(
          `取消 Uber Eats 訂單失敗: ${error.response.status} ${error.response.statusText}`,
          error.response.status,
        )
      } else {
        console.error('❌ 取消訂單時發生錯誤:', error.message)
        throw error
      }
    }
  })
}
