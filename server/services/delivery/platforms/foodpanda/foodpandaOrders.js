/**
 * Foodpanda 訂單操作服務
 * 處理訂單接受、拒絕、查詢等操作
 */

import axios from 'axios'
import { withPlatformToken } from '../../core/tokenManager.js'
import { AppError } from '../../../../middlewares/error.js'

const BASE_URL =
  process.env.FOODPANDA_BASE_URL || 'https://integration-middleware.as.restaurant-partners.com'

/**
 * 接受訂單
 * @param {String} orderId - Foodpanda 訂單 ID
 * @param {String} vendorCode - 店鋪代碼
 * @param {String} estimatedReadyTime - 預計完成時間 (ISO 8601 格式)
 * @returns {Promise<Object>} 接受結果
 */
export const acceptOrder = async (orderId, vendorCode, estimatedReadyTime = null) => {
  return await withPlatformToken('foodpanda', async (token) => {
    try {
      console.log('✅ 接受 Foodpanda 訂單:', orderId)

      // 準備請求資料
      const requestData = {
        vendor_code: vendorCode,
        order_status: 'order_accepted',
      }

      // 如果有提供預計完成時間，加入請求
      if (estimatedReadyTime) {
        requestData.estimated_ready_time = estimatedReadyTime
      }

      const response = await axios.post(`${BASE_URL}/v2/orders/${orderId}/status`, requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      })

      console.log('✅ 訂單接受成功:', orderId)
      return response.data
    } catch (error) {
      if (error.response) {
        console.error('❌ 接受訂單失敗:', {
          orderId,
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        })

        // 如果訂單已被接受或狀態已改變，不要拋出錯誤
        if (error.response.status === 400 || error.response.status === 409) {
          console.warn('⚠️ 訂單可能已被接受或狀態已改變:', orderId)
          return { success: false, reason: 'Order already processed' }
        }

        throw new AppError(
          `接受 Foodpanda 訂單失敗: ${error.response.status} ${error.response.statusText}`,
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
 * @param {String} orderId - Foodpanda 訂單 ID
 * @param {String} vendorCode - 店鋪代碼
 * @param {String} rejectReason - 拒絕原因
 * @returns {Promise<Object>} 拒絕結果
 */
export const rejectOrder = async (orderId, vendorCode, rejectReason) => {
  return await withPlatformToken('foodpanda', async (token) => {
    try {
      console.log('❌ 拒絕 Foodpanda 訂單:', orderId, '原因:', rejectReason)

      const requestData = {
        vendor_code: vendorCode,
        order_status: 'order_rejected',
        reject_reason: rejectReason || 'out_of_stock',
      }

      const response = await axios.post(`${BASE_URL}/v2/orders/${orderId}/status`, requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      })

      console.log('✅ 訂單拒絕成功:', orderId)
      return response.data
    } catch (error) {
      console.error('❌ 拒絕訂單失敗:', error.response?.data || error.message)
      throw new AppError(
        `拒絕 Foodpanda 訂單失敗: ${error.response?.data?.message || error.message}`,
        error.response?.status || 500,
      )
    }
  })
}

/**
 * 獲取訂單詳情
 * @param {String} orderId - Foodpanda 訂單 ID
 * @returns {Promise<Object>} 訂單詳情
 */
export const getOrderDetails = async (orderId) => {
  return await withPlatformToken('foodpanda', async (token) => {
    try {
      console.log('🔍 獲取 Foodpanda 訂單詳情:', orderId)

      const response = await axios.get(`${BASE_URL}/v2/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        timeout: 30000,
      })

      if (!response.data) {
        throw new AppError('獲取訂單詳情失敗：空回應', 500)
      }

      console.log('✅ 成功獲取訂單詳情:', {
        orderId: response.data.order_id,
        orderCode: response.data.order_code,
        status: response.data.order_status,
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
          `獲取 Foodpanda 訂單詳情失敗: ${error.response.status} ${error.response.statusText}`,
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

// /**
//  * 標記訂單為準備中
//  * @param {String} orderId - Foodpanda 訂單 ID
//  * @param {String} vendorCode - 店鋪代碼
//  * @returns {Promise<Object>} 更新結果
//  */
// export const markOrderInPreparation = async (orderId, vendorCode) => {
//   return await withPlatformToken('foodpanda', async (token) => {
//     try {
//       console.log('🔄 標記訂單為準備中:', orderId)

//       const requestData = {
//         vendor_code: vendorCode,
//         order_status: 'order_in_preparation',
//       }

//       const response = await axios.post(`${BASE_URL}/v2/orders/${orderId}/status`, requestData, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         timeout: 15000,
//       })

//       console.log('✅ 訂單狀態更新成功:', orderId)
//       return response.data
//     } catch (error) {
//       console.error('❌ 更新訂單狀態失敗:', error.response?.data || error.message)
//       throw new AppError(
//         `更新 Foodpanda 訂單狀態失敗: ${error.response?.data?.message || error.message}`,
//         error.response?.status || 500,
//       )
//     }
//   })
// }

// /**
//  * 標記訂單為已完成
//  * @param {String} orderId - Foodpanda 訂單 ID
//  * @param {String} vendorCode - 店鋪代碼
//  * @returns {Promise<Object>} 更新結果
//  */
// export const markOrderReady = async (orderId, vendorCode) => {
//   return await withPlatformToken('foodpanda', async (token) => {
//     try {
//       console.log('✅ 標記訂單為已完成:', orderId)

//       const requestData = {
//         vendor_code: vendorCode,
//         order_status: 'order_ready',
//       }

//       const response = await axios.post(`${BASE_URL}/v2/orders/${orderId}/status`, requestData, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         timeout: 15000,
//       })

//       console.log('✅ 訂單已標記為完成:', orderId)
//       return response.data
//     } catch (error) {
//       console.error('❌ 標記訂單完成失敗:', error.response?.data || error.message)
//       throw new AppError(
//         `標記 Foodpanda 訂單完成失敗: ${error.response?.data?.message || error.message}`,
//         error.response?.status || 500,
//       )
//     }
//   })
// }
