/**
 * 訂單 API 模組 - 重構版本
 * 按照業務領域進行組織，對應後端服務結構
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 訂單相關 API 方法
 */
export default function (apiClient) {
  // 訂單核心操作
  const orderCore = {
    // 創建訂單
    createOrder({ brandId, storeId, orderData }) {
      return apiClient.post(`/order/brands/${brandId}/stores/${storeId}/create`, orderData);
    },

    // 獲取店鋪訂單列表 (管理員功能)
    getStoreOrders({ brandId, storeId, ...queryParams }) {
      return apiClient.get(`/order/brands/${brandId}/stores/${storeId}/orders`, { params: queryParams });
    },

    // 獲取訂單詳情 (管理員功能)
    getOrderById({ brandId, storeId, orderId }) {
      return apiClient.get(`/order/brands/${brandId}/stores/${storeId}/orders/${orderId}`);
    },

    // 獲取用戶訂單列表
    getUserOrders({ brandId, ...queryParams }) {
      return apiClient.get(`/order/brands/${brandId}/my-orders`, { params: queryParams });
    },

    // 獲取用戶訂單詳情
    getUserOrderById({ brandId, orderId }) {
      return apiClient.get(`/order/brands/${brandId}/my-orders/${orderId}`);
    },

    // 獲取訪客訂單詳情
    getGuestOrderById({ brandId, orderId, phone, orderNumber }) {
      return apiClient.post(`/order/brands/${brandId}/guest/${orderId}`, { phone, orderNumber });
    }
  };

  // 訂單管理操作
  const orderManagement = {
    // 更新訂單狀態 (管理員功能)
    updateOrderStatus({ brandId, storeId, orderId, status }) {
      return apiClient.patch(`/order/brands/${brandId}/stores/${storeId}/orders/${orderId}/status`, { status });
    },

    // 更新訂單手動調整金額 (管理員功能)
    updateOrderManualAdjustment({ brandId, storeId, orderId, manualAdjustment }) {
      return apiClient.patch(`/order/brands/${brandId}/stores/${storeId}/orders/${orderId}/adjustment`, { manualAdjustment });
    },

    // 管理員取消訂單 (管理員功能)
    cancelOrder({ brandId, storeId, orderId, reason }) {
      return apiClient.post(`/order/brands/${brandId}/stores/${storeId}/orders/${orderId}/cancel`, { reason });
    },

    // 用戶取消訂單
    userCancelOrder({ brandId, orderId, reason }) {
      return apiClient.post(`/order/brands/${brandId}/my-orders/${orderId}/cancel`, { reason });
    }
  };

  // 訂單支付相關
  const orderPayment = {
    // 處理訂單支付
    processPayment({ brandId, orderId, paymentData }) {
      return apiClient.post(`/order/brands/${brandId}/orders/${orderId}/payment`, paymentData);
    },

    // 支付回調
    paymentCallback({ brandId, orderId, callbackData }) {
      return apiClient.post(`/order/brands/${brandId}/orders/${orderId}/payment/callback`, callbackData);
    }
  };

  // 訂單統計分析
  const orderStats = {
    // 獲取日訂單統計 (管理員功能)
    getDailyOrderStats({ brandId, storeId, date }) {
      return apiClient.get(`/order/brands/${brandId}/stores/${storeId}/stats/daily`, {
        params: date ? { date } : {}
      });
    },

    // 獲取月訂單統計 (管理員功能)
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
