/**
 * 訂單管理 API 模組
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 訂單相關 API 方法
 */
export default function (apiClient) {
  return {
    /**
     * 創建訂單
     * @param {Object} params - 訂單參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.storeId - 店鋪ID
     * @param {Object} params.orderData - 訂單資料
     * @returns {Promise} - API 回應
     */
    createOrder({ brandId, storeId, orderData }) {
      return apiClient.post(`/order/brands/${brandId}/stores/${storeId}/create`, orderData);
    },

    /**
     * 獲取用戶訂單列表
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID
     * @param {number} [params.page] - 頁碼 (默認 1)
     * @param {number} [params.limit] - 每頁數量 (默認 10)
     * @param {string} [params.sortBy] - 排序欄位 (默認 'createdAt')
     * @param {string} [params.sortOrder] - 排序方向 (默認 'desc')
     * @returns {Promise} - API 回應
     */
    getUserOrders({ brandId, ...queryParams }) {
      return apiClient.get(`/order/brands/${brandId}/my-orders`, { params: queryParams });
    },

    /**
     * 獲取用戶訂單詳情
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.orderId - 訂單ID
     * @returns {Promise} - API 回應
     */
    getUserOrderById({ brandId, orderId }) {
      return apiClient.get(`/order/brands/${brandId}/my-orders/${orderId}`);
    },

    /**
     * 用戶取消訂單
     * @param {Object} params - 取消參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.orderId - 訂單ID
     * @param {string} params.reason - 取消原因
     * @returns {Promise} - API 回應
     */
    userCancelOrder({ brandId, orderId, reason }) {
      return apiClient.post(`/order/brands/${brandId}/my-orders/${orderId}/cancel`, { reason });
    },

    /**
     * 獲取訪客訂單詳情
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.orderId - 訂單ID
     * @param {string} params.phone - 電話號碼
     * @param {string} params.orderNumber - 訂單編號
     * @returns {Promise} - API 回應
     */
    getGuestOrderById({ brandId, orderId, phone, orderNumber }) {
      return apiClient.post(`/order/brands/${brandId}/guest/${orderId}`, { phone, orderNumber });
    },

    /**
     * 處理訂單支付
     * @param {Object} params - 支付參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.orderId - 訂單ID
     * @param {Object} params.paymentData - 支付資料
     * @returns {Promise} - API 回應
     */
    processPayment({ brandId, orderId, paymentData }) {
      return apiClient.post(`/order/brands/${brandId}/orders/${orderId}/payment`, paymentData);
    },

    /**
     * 支付回調
     * @param {Object} params - 回調參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.orderId - 訂單ID
     * @param {Object} params.callbackData - 回調資料
     * @returns {Promise} - API 回應
     */
    paymentCallback({ brandId, orderId, callbackData }) {
      return apiClient.post(`/order/brands/${brandId}/orders/${orderId}/payment/callback`, callbackData);
    },

    // 後台管理功能 (需要管理員權限)
    /**
     * 獲取店鋪訂單列表 (管理員功能)
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.storeId - 店鋪ID
     * @param {string} [params.status] - 訂單狀態
     * @param {string} [params.orderType] - 訂單類型
     * @param {Date} [params.fromDate] - 開始日期
     * @param {Date} [params.toDate] - 結束日期
     * @param {number} [params.page] - 頁碼 (默認 1)
     * @param {number} [params.limit] - 每頁數量 (默認 20)
     * @returns {Promise} - API 回應
     */
    getStoreOrders({ brandId, storeId, ...queryParams }) {
      return apiClient.get(`/order/brands/${brandId}/stores/${storeId}/orders`, { params: queryParams });
    },

    /**
     * 獲取訂單詳情 (管理員功能)
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.orderId - 訂單ID
     * @returns {Promise} - API 回應
     */
    getOrderById({ brandId, storeId, orderId }) {
      return apiClient.get(`/order/brands/${brandId}/stores/${storeId}/orders/${orderId}`);
    },

    /**
     * 更新訂單狀態 (管理員功能)
     * @param {Object} params - 更新參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.orderId - 訂單ID
     * @param {string} params.status - 新狀態
     * @returns {Promise} - API 回應
     */
    updateOrderStatus({ brandId, storeId, orderId, status }) {
      return apiClient.patch(`/order/brands/${brandId}/stores/${storeId}/orders/${orderId}/status`, { status });
    },

    /**
     * 管理員取消訂單 (管理員功能)
     * @param {Object} params - 取消參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.orderId - 訂單ID
     * @param {string} params.reason - 取消原因
     * @returns {Promise} - API 回應
     */
    cancelOrder({ brandId, storeId, orderId, reason }) {
      return apiClient.post(`/order/brands/${brandId}/stores/${storeId}/orders/${orderId}/cancel`, { reason });
    },

    /**
     * 獲取日訂單統計 (管理員功能)
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.storeId - 店鋪ID
     * @param {string} [params.date] - 日期 (YYYY-MM-DD)
     * @returns {Promise} - API 回應
     */
    getDailyOrderStats({ brandId, storeId, date }) {
      return apiClient.get(`/order/brands/${brandId}/stores/${storeId}/stats/daily`, {
        params: date ? { date } : {}
      });
    },

    /**
     * 獲取月訂單統計 (管理員功能)
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.storeId - 店鋪ID
     * @param {number} [params.year] - 年份
     * @param {number} [params.month] - 月份
     * @returns {Promise} - API 回應
     */
    getMonthlyOrderStats({ brandId, storeId, year, month }) {
      return apiClient.get(`/order/brands/${brandId}/stores/${storeId}/stats/monthly`, {
        params: { year, month }
      });
    }
  };
}
