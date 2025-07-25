/**
 * 訂單管理員 API 模組
 * 提供後台管理員使用的訂單相關功能
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 管理員訂單相關 API 方法
 */
export default function (apiClient) {
  return {
    /**
     * 獲取店鋪訂單列表 (管理員功能)
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID（必填）
     * @param {string} [params.status] - 訂單狀態篩選 ('unpaid', 'paid', 'cancelled')
     * @param {string} [params.orderType] - 訂單類型篩選 ('dine_in', 'takeout', 'delivery')
     * @param {string} [params.fromDate] - 開始日期 (YYYY-MM-DD，會在後端轉換為台灣時區的當日開始時間)
     * @param {string} [params.toDate] - 結束日期 (YYYY-MM-DD，會在後端轉換為台灣時區的當日結束時間)
     * @param {number} [params.page=1] - 頁碼
     * @param {number} [params.limit=20] - 每頁數量
     * @returns {Promise} - API 回應
     */
    getStoreOrders({ brandId, storeId, ...queryParams }) {
      return apiClient.get(`/order-admin/brands/${brandId}/stores/${storeId}/orders`, {
        params: queryParams,
      })
    },

    /**
     * 🆕 獲取特定用戶的所有訂單 (管理員功能)
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.userId - 用戶ID（必填）
     * @param {number} [params.page=1] - 頁碼
     * @param {number} [params.limit=10] - 每頁數量
     * @param {string} [params.sortBy='createdAt'] - 排序欄位
     * @param {string} [params.sortOrder='desc'] - 排序方向 ('asc' 或 'desc')
     * @returns {Promise} - API 回應
     */
    getUserOrders({ brandId, userId, ...queryParams }) {
      return apiClient.get(`/order-admin/brands/${brandId}/users/${userId}/orders`, {
        params: queryParams,
      })
    },

    /**
     * 獲取訂單詳情 (管理員功能)
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID（必填）
     * @param {string} params.orderId - 訂單ID（必填）
     * @returns {Promise} - API 回應
     */
    getOrderById({ brandId, storeId, orderId }) {
      return apiClient.get(`/order-admin/brands/${brandId}/stores/${storeId}/orders/${orderId}`)
    },

    /**
     * 更新訂單 (管理員功能) - 統一接口
     * @param {Object} params - 更新參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID（必填）
     * @param {string} params.orderId - 訂單ID（必填）
     * @param {Object} params.updateData - 更新資料
     * @param {string} [params.updateData.status] - 訂單狀態 ('unpaid', 'paid', 'cancelled')
     * @param {number} [params.updateData.manualAdjustment] - 手動調整金額
     * @param {string} [params.updateData.notes] - 訂單備註
     * @param {Date} [params.updateData.estimatedPickupTime] - 預計取餐時間
     * @param {Object} [params.updateData.deliveryInfo] - 配送資訊
     * @param {Object} [params.updateData.dineInInfo] - 內用資訊
     * @returns {Promise} - API 回應
     */
    updateOrder({ brandId, storeId, orderId, updateData }) {
      return apiClient.put(
        `/order-admin/brands/${brandId}/stores/${storeId}/orders/${orderId}`,
        updateData,
      )
    },

    /**
     * 管理員取消訂單 (管理員功能)
     * @param {Object} params - 取消參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID（必填）
     * @param {string} params.orderId - 訂單ID（必填）
     * @param {string} params.reason - 取消原因
     * @returns {Promise} - API 回應
     */
    cancelOrder({ brandId, storeId, orderId, reason }) {
      return apiClient.post(
        `/order-admin/brands/${brandId}/stores/${storeId}/orders/${orderId}/cancel`,
        { reason },
      )
    },
  }
}
