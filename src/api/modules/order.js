/**
 * 訂單 API 模組 - 重構版本
 * 按照業務領域進行組織，對應後端服務結構
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 訂單相關 API 方法
 */
export default function (apiClient) {
  // 訂單核心操作
  const orderCore = {
    /**
     * 創建訂單
     * @param {Object} params - 創建參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID（必填）
     * @param {Object} params.orderData - 訂單資料
     * @returns {Promise} - API 回應
     */
    createOrder({ brandId, storeId, orderData }) {
      return apiClient.post(`/order/brands/${brandId}/stores/${storeId}/create`, orderData);
    },

    /**
     * 獲取店鋪訂單列表 (管理員功能)
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID（必填）
     * @param {string} [params.status] - 訂單狀態篩選
     * @param {string} [params.orderType] - 訂單類型篩選
     * @param {Date} [params.fromDate] - 開始日期
     * @param {Date} [params.toDate] - 結束日期
     * @param {number} [params.page] - 頁碼
     * @param {number} [params.limit] - 每頁數量
     * @returns {Promise} - API 回應
     */
    getStoreOrders({ brandId, storeId, ...queryParams }) {
      return apiClient.get(`/order/brands/${brandId}/stores/${storeId}/orders`, { params: queryParams });
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
      return apiClient.get(`/order/brands/${brandId}/stores/${storeId}/orders/${orderId}`);
    },

    /**
     * 獲取用戶訂單列表
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {number} [params.page] - 頁碼
     * @param {number} [params.limit] - 每頁數量
     * @param {string} [params.sortBy] - 排序欄位
     * @param {string} [params.sortOrder] - 排序方向 ('asc' 或 'desc')
     * @returns {Promise} - API 回應
     */
    getUserOrders({ brandId, ...queryParams }) {
      return apiClient.get(`/order/brands/${brandId}/my-orders`, { params: queryParams });
    },

    /**
     * 獲取用戶訂單詳情
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.orderId - 訂單ID（必填）
     * @returns {Promise} - API 回應
     */
    getUserOrderById({ brandId, orderId }) {
      return apiClient.get(`/order/brands/${brandId}/my-orders/${orderId}`);
    },

    /**
     * 獲取訪客訂單詳情
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.orderId - 訂單ID（必填）
     * @param {string} params.phone - 電話號碼（必填）
     * @param {string} params.orderNumber - 訂單編號（必填）
     * @returns {Promise} - API 回應
     */
    getGuestOrderById({ brandId, orderId, phone, orderNumber }) {
      return apiClient.post(`/order/brands/${brandId}/guest/${orderId}`, { phone, orderNumber });
    }
  };

  // 訂單管理操作
  const orderManagement = {
    /**
     * 更新訂單狀態 (管理員功能)
     * @param {Object} params - 更新參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID（必填）
     * @param {string} params.orderId - 訂單ID（必填）
     * @param {string} params.status - 新狀態 ('pending', 'confirmed', 'preparing', 'completed', 'cancelled')
     * @returns {Promise} - API 回應
     */
    updateOrderStatus({ brandId, storeId, orderId, status }) {
      return apiClient.patch(`/order/brands/${brandId}/stores/${storeId}/orders/${orderId}/status`, { status });
    },

    /**
     * 更新訂單手動調整金額 (管理員功能)
     * @param {Object} params - 更新參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID（必填）
     * @param {string} params.orderId - 訂單ID（必填）
     * @param {number} params.manualAdjustment - 調整金額
     * @returns {Promise} - API 回應
     */
    updateOrderManualAdjustment({ brandId, storeId, orderId, manualAdjustment }) {
      return apiClient.patch(`/order/brands/${brandId}/stores/${storeId}/orders/${orderId}/adjustment`, { manualAdjustment });
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
      return apiClient.post(`/order/brands/${brandId}/stores/${storeId}/orders/${orderId}/cancel`, { reason });
    },

    /**
     * 用戶取消訂單
     * @param {Object} params - 取消參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.orderId - 訂單ID（必填）
     * @param {string} params.reason - 取消原因
     * @returns {Promise} - API 回應
     */
    userCancelOrder({ brandId, orderId, reason }) {
      return apiClient.post(`/order/brands/${brandId}/my-orders/${orderId}/cancel`, { reason });
    }
  };

  // 訂單支付相關
  const orderPayment = {
    /**
     * 處理訂單支付
     * @param {Object} params - 支付參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.orderId - 訂單ID（必填）
     * @param {Object} params.paymentData - 支付資料
     * @param {string} params.paymentData.paymentMethod - 支付方式 ('cash', 'credit_card', 'line_pay', 'other')
     * @param {string} [params.paymentData.onlinePaymentCode] - 線上支付代碼
     * @returns {Promise} - API 回應
     */
    processPayment({ brandId, orderId, paymentData }) {
      return apiClient.post(`/order/brands/${brandId}/orders/${orderId}/payment`, paymentData);
    },

    /**
     * 支付回調
     * @param {Object} params - 回調參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.orderId - 訂單ID（必填）
     * @param {Object} params.callbackData - 回調資料
     * @returns {Promise} - API 回應
     */
    paymentCallback({ brandId, orderId, callbackData }) {
      return apiClient.post(`/order/brands/${brandId}/orders/${orderId}/payment/callback`, callbackData);
    }
  };

  // 訂單統計分析
  const orderStats = {
    /**
     * 獲取日訂單統計 (管理員功能)
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID（必填）
     * @param {string} [params.date] - 日期，格式 YYYY-MM-DD，預設為今天
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
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID（必填）
     * @param {number} params.year - 年份
     * @param {number} params.month - 月份 (1-12)
     * @returns {Promise} - API 回應
     */
    getMonthlyOrderStats({ brandId, storeId, year, month }) {
      return apiClient.get(`/order/brands/${brandId}/stores/${storeId}/stats/monthly`, {
        params: { year, month }
      });
    }
  };

  // 合併所有方法並返回
  return {
    ...orderCore,
    ...orderManagement,
    ...orderPayment,
    ...orderStats,

    // 提供分類方法供高級用法
    core: orderCore,
    management: orderManagement,
    payment: orderPayment,
    stats: orderStats
  };
}
