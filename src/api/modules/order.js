/**
 * 訂單管理 API 模組
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 訂單相關 API 方法
 */
export default function (apiClient) {
  return {
    /**
     * 創建訂單
     * @param {Object} orderData - 訂單資料
     * @returns {Promise} - API 回應
     */
    createOrder(orderData) {
      return apiClient.post('/order', orderData);
    },

    /**
     * 獲取用戶訂單列表
     * @param {Object} params - 查詢參數
     * @param {number} [params.page] - 頁碼 (默認 1)
     * @param {number} [params.limit] - 每頁數量 (默認 10)
     * @param {string} [params.sortBy] - 排序欄位 (默認 'createdAt')
     * @param {string} [params.sortOrder] - 排序方向 (默認 'desc')
     * @returns {Promise} - API 回應
     */
    getUserOrders(params = {}) {
      return apiClient.get('/order/user', { params });
    },

    /**
     * 獲取用戶訂單詳情
     * @param {string} orderId - 訂單ID
     * @returns {Promise} - API 回應
     */
    getUserOrderById(orderId) {
      return apiClient.get(`/order/user/${orderId}`);
    },

    /**
     * 用戶取消訂單
     * @param {Object} params - 取消參數
     * @param {string} params.orderId - 訂單ID
     * @param {string} params.reason - 取消原因
     * @returns {Promise} - API 回應
     */
    userCancelOrder({ orderId, reason }) {
      return apiClient.post(`/order/user/${orderId}/cancel`, { reason });
    },

    /**
     * 獲取訪客訂單詳情
     * @param {Object} params - 查詢參數
     * @param {string} params.orderId - 訂單ID
     * @param {string} params.phone - 電話號碼
     * @param {string} params.orderNumber - 訂單編號
     * @returns {Promise} - API 回應
     */
    getGuestOrderById({ orderId, phone, orderNumber }) {
      return apiClient.post(`/order/user/guest/${orderId}`, { phone, orderNumber });
    },

    /**
     * 處理訂單支付
     * @param {Object} params - 支付參數
     * @param {string} params.orderId - 訂單ID
     * @param {Object} params.paymentData - 支付資料
     * @returns {Promise} - API 回應
     */
    processPayment({ orderId, paymentData }) {
      return apiClient.post(`/order/${orderId}/payment`, paymentData);
    },

    // 後台管理功能 (需要管理員權限)
    /**
     * 獲取店鋪訂單列表 (管理員功能)
     * @param {Object} params - 查詢參數
     * @param {string} params.storeId - 店鋪ID
     * @param {string} [params.status] - 訂單狀態
     * @param {string} [params.orderType] - 訂單類型
     * @param {Date} [params.fromDate] - 開始日期
     * @param {Date} [params.toDate] - 結束日期
     * @param {number} [params.page] - 頁碼 (默認 1)
     * @param {number} [params.limit] - 每頁數量 (默認 20)
     * @returns {Promise} - API 回應
     */
    getStoreOrders({ storeId, ...queryParams }) {
      return apiClient.get(`/order/admin/${storeId}`, { params: queryParams });
    },

    /**
     * 獲取訂單詳情 (管理員功能)
     * @param {Object} params - 查詢參數
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.orderId - 訂單ID
     * @returns {Promise} - API 回應
     */
    getOrderById({ storeId, orderId }) {
      return apiClient.get(`/order/admin/${storeId}/${orderId}`);
    },

    /**
     * 更新訂單狀態 (管理員功能)
     * @param {Object} params - 更新參數
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.orderId - 訂單ID
     * @param {string} params.status - 新狀態
     * @returns {Promise} - API 回應
     */
    updateOrderStatus({ storeId, orderId, status }) {
      return apiClient.put(`/order/admin/${storeId}/${orderId}/status`, { status });
    },

    /**
     * 管理員取消訂單 (管理員功能)
     * @param {Object} params - 取消參數
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.orderId - 訂單ID
     * @param {string} params.reason - 取消原因
     * @returns {Promise} - API 回應
     */
    cancelOrder({ storeId, orderId, reason }) {
      return apiClient.post(`/order/admin/${storeId}/${orderId}/cancel`, { reason });
    },

    /**
     * 獲取日訂單統計 (管理員功能)
     * @param {Object} params - 查詢參數
     * @param {string} params.storeId - 店鋪ID
     * @param {string} [params.date] - 日期 (YYYY-MM-DD)
     * @returns {Promise} - API 回應
     */
    getDailyOrderStats({ storeId, date }) {
      return apiClient.get(`/order/admin/${storeId}/stats/daily`, {
        params: date ? { date } : {}
      });
    },

    /**
     * 獲取月訂單統計 (管理員功能)
     * @param {Object} params - 查詢參數
     * @param {string} params.storeId - 店鋪ID
     * @param {number} [params.year] - 年份
     * @param {number} [params.month] - 月份
     * @returns {Promise} - API 回應
     */
    getMonthlyOrderStats({ storeId, year, month }) {
      return apiClient.get(`/order/admin/${storeId}/stats/monthly`, {
        params: { year, month }
      });
    }
  };
}
