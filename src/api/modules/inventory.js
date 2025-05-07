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
     * @param {string} [params.inventoryType] - 庫存類型 ('dish' 或 'else')
     * @param {boolean} [params.onlyAvailable] - 是否只顯示有庫存的項目
     * @param {string} [params.search] - 搜尋關鍵字
     * @returns {Promise} - API 回應
     */
    getStoreInventory({ storeId, ...queryParams }) {
      return apiClient.get(`/store/${storeId}/inventory`, { params: queryParams });
    },

    /**
     * 獲取特定庫存項目詳情
     * @param {Object} params - 查詢參數
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.itemId - 項目ID（餐點ID或其他庫存ID）
     * @param {string} [params.inventoryType='dish'] - 庫存類型
     * @returns {Promise} - API 回應
     */
    getInventoryItem({ storeId, itemId, inventoryType = 'dish' }) {
      return apiClient.get(`/store/${storeId}/inventory/${itemId}`, {
        params: { inventoryType }
      });
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
     * @param {string} params.itemId - 項目ID
     * @param {Object} params.data - 更新的庫存資料
     * @returns {Promise} - API 回應
     */
    updateInventory({ storeId, itemId, data }) {
      // 如果 inventoryType 是 dish，則確保是餐點的 dishId
      // 如果是其他類型，則確保是庫存項目的 _id
      console.log('updateInventory called with:', { storeId, itemId, data });

      return apiClient.put(`/store/${storeId}/inventory/${itemId}`, data);
    },

    /**
     * 減少庫存（訂單消耗）
     * @param {Object} params - 減少參數
     * @returns {Promise} - API 回應
     */
    reduceStock({ storeId, itemId, quantity, reason, orderId, inventoryType = 'dish' }) {
      return apiClient.post(`/store/${storeId}/inventory/${itemId}/reduce`, {
        quantity,
        reason,
        orderId,
        inventoryType
      });
    },

    /**
     * 增加庫存
     * @param {Object} params - 增加參數
     * @returns {Promise} - API 回應
     */
    addStock({ storeId, itemId, quantity, reason, stockType = 'warehouseStock', inventoryType = 'dish' }) {
      return apiClient.post(`/store/${storeId}/inventory/${itemId}/add`, {
        quantity,
        reason,
        stockType,
        inventoryType
      });
    },

    /**
     * 庫存調撥（從倉庫到可販售）
     * @param {Object} params - 調撥參數
     * @returns {Promise} - API 回應
     */
    transferStock({ storeId, itemId, quantity, reason, inventoryType = 'dish' }) {
      return apiClient.post(`/store/${storeId}/inventory/${itemId}/transfer`, {
        quantity,
        reason,
        inventoryType
      });
    },

    /**
     * 損耗處理
     * @param {Object} params - 損耗參數
     * @returns {Promise} - API 回應
     */
    processDamage({ storeId, itemId, quantity, reason, stockType = 'warehouseStock', inventoryType = 'dish' }) {
      return apiClient.post(`/store/${storeId}/inventory/${itemId}/damage`, {
        quantity,
        reason,
        stockType,
        inventoryType
      });
    },

    /**
     * 獲取庫存日誌
     * @param {Object} params - 查詢參數
     * @returns {Promise} - API 回應
     */
    getInventoryLogs({ storeId, ...queryParams }) {
      return apiClient.get(`/store/${storeId}/inventory/logs`, { params: queryParams });
    },

    /**
     * 獲取庫存趨勢數據
     * @param {Object} params - 查詢參數
     * @returns {Promise} - API 回應
     */
    getStockTrends({ storeId, itemId, inventoryType = 'dish', stockType = 'warehouseStock', days = 30 }) {
      return apiClient.get(`/store/${storeId}/inventory/${itemId}/trends`, {
        params: { inventoryType, stockType, days }
      });
    },

    /**
     * 獲取項目庫存統計
     * @param {Object} params - 查詢參數
     * @returns {Promise} - API 回應
     */
    getItemInventoryStats({ storeId, itemId, inventoryType = 'dish' }) {
      return apiClient.get(`/store/${storeId}/inventory/${itemId}/stats`, {
        params: { inventoryType }
      });
    },

    /**
     * 獲取庫存健康狀況報告
     * @param {Object} params - 查詢參數
     * @returns {Promise} - API 回應
     */
    getInventoryHealthReport({ storeId, inventoryType, criticalDaysThreshold = 3, overStockDaysThreshold = 30 }) {
      return apiClient.get(`/store/${storeId}/inventory/health`, {
        params: { inventoryType, criticalDaysThreshold, overStockDaysThreshold }
      });
    },

    /**
     * 批量更新庫存
     * @param {Object} params - 更新參數
     * @returns {Promise} - API 回應
     */
    bulkUpdateInventory({ storeId, items }) {
      return apiClient.post(`/store/${storeId}/inventory/bulk`, { items });
    }
  };
}
