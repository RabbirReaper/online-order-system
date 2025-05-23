/**
 * 訂單客戶 API 模組
 * 提供前台客戶使用的訂單相關功能
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 客戶訂單相關 API 方法
 */
export default function (apiClient) {
  return {
    /**
     * 創建訂單
     * @param {Object} params - 創建參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID（必填）
     * @param {Object} params.orderData - 訂單資料
     * @param {Array} params.orderData.items - 訂單項目
     * @param {string} params.orderData.orderType - 訂單類型 ('dine_in', 'takeout', 'delivery')
     * @param {string} params.orderData.paymentType - 付款類型 ('On-site', 'Online')
     * @param {string} params.orderData.paymentMethod - 付款方式 ('cash', 'credit_card', 'line_pay', 'other')
     * @param {Object} [params.orderData.customerInfo] - 顧客資訊
     * @param {Object} [params.orderData.deliveryInfo] - 配送資訊（外送訂單）
     * @param {Object} [params.orderData.dineInInfo] - 內用資訊（內用訂單）
     * @param {Date} [params.orderData.estimatedPickupTime] - 預計取餐時間（外帶訂單）
     * @param {string} [params.orderData.notes] - 訂單備註
     * @returns {Promise} - API 回應
     */
    createOrder({ brandId, storeId, orderData }) {
      return apiClient.post(`/order-customer/brands/${brandId}/stores/${storeId}/create`, orderData);
    },

    /**
     * 獲取用戶訂單列表
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {number} [params.page=1] - 頁碼
     * @param {number} [params.limit=10] - 每頁數量
     * @param {string} [params.sortBy='createdAt'] - 排序欄位
     * @param {string} [params.sortOrder='desc'] - 排序方向 ('asc' 或 'desc')
     * @returns {Promise} - API 回應
     */
    getUserOrders({ brandId, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' }) {
      return apiClient.get(`/order-customer/brands/${brandId}/my-orders`, {
        params: { page, limit, sortBy, sortOrder }
      });
    },

    /**
     * 獲取用戶訂單詳情
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.orderId - 訂單ID（必填）
     * @returns {Promise} - API 回應
     */
    getUserOrderById({ brandId, orderId }) {
      return apiClient.get(`/order-customer/brands/${brandId}/my-orders/${orderId}`);
    },

    /**
     * 用戶取消訂單
     * @param {Object} params - 取消參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.orderId - 訂單ID（必填）
     * @param {string} params.reason - 取消原因
     * @returns {Promise} - API 回應
     */
    cancelOrder({ brandId, orderId, reason }) {
      return apiClient.post(`/order-customer/brands/${brandId}/my-orders/${orderId}/cancel`, { reason });
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
      return apiClient.post(`/order-customer/brands/${brandId}/guest/${orderId}`, { phone, orderNumber });
    },

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
      return apiClient.post(`/order-customer/brands/${brandId}/orders/${orderId}/payment`, paymentData);
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
      return apiClient.post(`/order-customer/brands/${brandId}/orders/${orderId}/payment/callback`, callbackData);
    }
  };
}
