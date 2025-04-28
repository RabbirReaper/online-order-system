/**
 * 庫存管理 API 模組
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 庫存相關 API 方法
 */
export default function (apiClient) {
  return {
    /**
     * 獲取店鋪庫存
     * @param {Object} params - 查詢參數
     * @param {string} params.storeId - 店鋪ID
     * @param {boolean} [params.onlyAvailable] - 是否只顯示有庫存的項目
     * @param {string} [params.search] - 搜尋關鍵字
     * @returns {Promise} - API 回應
     */
    getStoreInventory({ storeId, ...queryParams }) {
      return apiClient.get(`/store/${storeId}/inventory`, { params: queryParams });
    },

    /**
     * 獲取特定商品庫存詳情
     * @param {Object} params - 查詢參數
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.dishId - 餐點ID
     * @returns {Promise} - API 回應
     */
    getInventoryItem({ storeId, dishId }) {
      return apiClient.get(`/store/${storeId}/inventory/${dishId}`);
    },

    /**
     * 創建新庫存項目
     * @param {Object} params - 庫存參數
     * @param {string} params.storeId - 店鋪ID
     * @param {Object} params.data - 庫存資料
     * @returns {Promise} - API 回應
     */
    createInventory({ storeId, data }) {
      return apiClient.post(`/store/${storeId}/inventory`, data);
    },

    /**
     * 更新庫存資料
     * @param {Object} params - 更新參數
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.dishId - 餐點ID
     * @param {Object} params.data - 更新的庫存資料
     * @returns {Promise} - API 回應
     */
    updateInventory({ storeId, dishId, data }) {
      return apiClient.put(`/store/${storeId}/inventory/${dishId}`, data);
    },

    /**
     * 獲取庫存日誌
     * @param {Object} params - 查詢參數
     * @param {string} params.storeId - 店鋪ID
     * @param {string} [params.dishId] - 餐點ID (可選)
     * @param {Date} [params.startDate] - 開始日期 (可選)
     * @param {Date} [params.endDate] - 結束日期 (可選)
     * @param {string} [params.changeType] - 變更類型 (可選)
     * @param {number} [params.page] - 頁碼 (默認 1)
     * @param {number} [params.limit] - 每頁數量 (默認 20)
     * @returns {Promise} - API 回應
     */
    getInventoryLogs({ storeId, ...queryParams }) {
      return apiClient.get(`/store/${storeId}/inventory/logs`, { params: queryParams });
    }
  };
}
