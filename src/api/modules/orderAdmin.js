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
     * @param {string} [params.status] - 訂單狀態篩選 ('pending', 'confirmed', 'preparing', 'completed', 'cancelled')
     * @param {string} [params.orderType] - 訂單類型篩選 ('dine_in', 'takeout', 'delivery')
     * @param {string} [params.fromDate] - 開始日期 (YYYY-MM-DD)
     * @param {string} [params.toDate] - 結束日期 (YYYY-MM-DD)
     * @param {number} [params.page=1] - 頁碼
     * @param {number} [params.limit=20] - 每頁數量
     * @returns {Promise} - API 回應
     */
    getStoreOrders({ brandId, storeId, ...queryParams }) {
      return apiClient.get(`/order-admin/brands/${brandId}/stores/${storeId}/orders`, { params: queryParams });
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
      return apiClient.get(`/order-admin/brands/${brandId}/stores/${storeId}/orders/${orderId}`);
    },

    /**
     * 更新訂單 (管理員功能) - 統一接口
     * @param {Object} params - 更新參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID（必填）
     * @param {string} params.orderId - 訂單ID（必填）
     * @param {Object} params.updateData - 更新資料
     * @param {string} [params.updateData.status] - 訂單狀態
     * @param {number} [params.updateData.manualAdjustment] - 手動調整金額
     * @param {string} [params.updateData.notes] - 訂單備註
     * @param {Date} [params.updateData.estimatedPickupTime] - 預計取餐時間
     * @param {Object} [params.updateData.deliveryInfo] - 配送資訊
     * @param {Object} [params.updateData.dineInInfo] - 內用資訊
     * @returns {Promise} - API 回應
     */
    updateOrder({ brandId, storeId, orderId, updateData }) {
      return apiClient.put(`/order-admin/brands/${brandId}/stores/${storeId}/orders/${orderId}`, updateData);
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
      return apiClient.post(`/order-admin/brands/${brandId}/stores/${storeId}/orders/${orderId}/cancel`, { reason });
    },

    /**
     * 獲取訂單統計 (管理員功能)
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID（必填）
     * @param {string} [params.fromDate] - 開始日期 (YYYY-MM-DD)
     * @param {string} [params.toDate] - 結束日期 (YYYY-MM-DD)
     * @param {string} [params.groupBy='day'] - 分組方式 ('hour', 'day', 'month')
     * @returns {Promise} - API 回應
     */
    getOrderStats({ brandId, storeId, fromDate, toDate, groupBy = 'day' }) {
      return apiClient.get(`/order-admin/brands/${brandId}/stores/${storeId}/stats`, {
        params: { fromDate, toDate, groupBy }
      });
    },

    /**
     * 獲取熱門餐點 (管理員功能)
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID（必填）
     * @param {string} [params.fromDate] - 開始日期 (YYYY-MM-DD)
     * @param {string} [params.toDate] - 結束日期 (YYYY-MM-DD)
     * @param {number} [params.limit=10] - 返回數量限制
     * @returns {Promise} - API 回應
     */
    getPopularDishes({ brandId, storeId, fromDate, toDate, limit = 10 }) {
      return apiClient.get(`/order-admin/brands/${brandId}/stores/${storeId}/popular-dishes`, {
        params: { fromDate, toDate, limit }
      });
    },

    // 便利方法 - 更新訂單狀態
    /**
     * 更新訂單狀態 (便利方法)
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.orderId - 訂單ID
     * @param {string} params.status - 新狀態
     * @returns {Promise} - API 回應
     */
    updateOrderStatus({ brandId, storeId, orderId, status }) {
      return this.updateOrder({ brandId, storeId, orderId, updateData: { status } });
    },

    // 便利方法 - 更新手動調整金額
    /**
     * 更新訂單手動調整金額 (便利方法)
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.orderId - 訂單ID
     * @param {number} params.manualAdjustment - 調整金額
     * @returns {Promise} - API 回應
     */
    updateOrderManualAdjustment({ brandId, storeId, orderId, manualAdjustment }) {
      return this.updateOrder({ brandId, storeId, orderId, updateData: { manualAdjustment } });
    },

    // 便利方法 - 獲取今日統計
    /**
     * 獲取今日訂單統計 (便利方法)
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.storeId - 店鋪ID
     * @returns {Promise} - API 回應
     */
    getTodayStats({ brandId, storeId }) {
      const today = new Date().toISOString().split('T')[0];
      return this.getOrderStats({ brandId, storeId, fromDate: today, toDate: today, groupBy: 'hour' });
    },

    // 便利方法 - 獲取月度統計
    /**
     * 獲取月度訂單統計 (便利方法)
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.storeId - 店鋪ID
     * @param {number} [params.year] - 年份
     * @param {number} [params.month] - 月份 (1-12)
     * @returns {Promise} - API 回應
     */
    getMonthlyStats({ brandId, storeId, year, month }) {
      const currentDate = new Date();
      const targetYear = year || currentDate.getFullYear();
      const targetMonth = month || (currentDate.getMonth() + 1);

      const fromDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
      const toDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${new Date(targetYear, targetMonth, 0).getDate()}`;

      return this.getOrderStats({ brandId, storeId, fromDate, toDate, groupBy: 'day' });
    }
  };
}
