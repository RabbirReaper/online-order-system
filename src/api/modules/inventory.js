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
     * @param {string} [params.inventoryType] - 庫存類型 ('DishTemplate' 或 'else')
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
     * @param {string} params.inventoryId - 庫存ID (inventory._id)
     * @returns {Promise} - API 回應
     */
    getInventoryItem({ storeId, inventoryId }) {
      return apiClient.get(`/store/${storeId}/inventory/${inventoryId}`);
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
     * @param {string} params.inventoryId - 庫存ID (inventory._id)
     * @param {Object} params.data - 更新的庫存資料
     * @returns {Promise} - API 回應
     */
    updateInventory({ storeId, inventoryId, data }) {
      return apiClient.put(`/store/${storeId}/inventory/${inventoryId}`, data);
    },

    /**
     * 設定可用庫存
     * @param {Object} params - 設定參數
     * @returns {Promise} - API 回應
     */
    setAvailableStock({ storeId, inventoryId, availableStock, reason }) {
      return apiClient.put(`/store/${storeId}/inventory/${inventoryId}/available-stock`, {
        availableStock,
        reason
      });
    },

    /**
     * 減少庫存（訂單消耗）
     * @param {Object} params - 減少參數
     * @returns {Promise} - API 回應
     */
    reduceStock({ storeId, inventoryId, quantity, reason, orderId, inventoryType = 'DishTemplate' }) {
      return apiClient.post(`/store/${storeId}/inventory/${inventoryId}/reduce`, {
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
    addStock({ storeId, inventoryId, quantity, reason, stockType = 'totalStock', inventoryType = 'DishTemplate' }) {
      return apiClient.post(`/store/${storeId}/inventory/${inventoryId}/add`, {
        quantity,
        reason,
        stockType,
        inventoryType
      });
    },

    /**
     * 損耗處理
     * @param {Object} params - 損耗參數
     * @returns {Promise} - API 回應
     */
    processDamage({ storeId, inventoryId, quantity, reason, stockType = 'totalStock', inventoryType = 'DishTemplate' }) {
      return apiClient.post(`/store/${storeId}/inventory/${inventoryId}/damage`, {
        quantity,
        reason,
        stockType,
        inventoryType
      });
    },

    /**
     * 切換售完狀態
     * @param {Object} params - 切換參數
     * @returns {Promise} - API 回應
     */
    toggleSoldOut({ storeId, inventoryId, isSoldOut }) {
      return apiClient.put(`/store/${storeId}/inventory/${inventoryId}/sold-out`, {
        isSoldOut
      });
    },

    /**
     * 初始化餐點庫存
     * @param {Object} params - 初始化參數
     * @returns {Promise} - API 回應
     */
    initializeDishInventory({ storeId }) {
      return apiClient.post(`/store/${storeId}/inventory/initialize-dishes`);
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
    getStockTrends({ storeId, inventoryId, inventoryType = 'DishTemplate', stockType = 'totalStock', days = 30 }) {
      return apiClient.get(`/store/${storeId}/inventory/${inventoryId}/trends`, {
        params: { inventoryType, stockType, days }
      });
    },

    /**
     * 獲取項目庫存統計
     * @param {Object} params - 查詢參數
     * @returns {Promise} - API 回應
     */
    getItemInventoryStats({ storeId, inventoryId, inventoryType = 'DishTemplate' }) {
      return apiClient.get(`/store/${storeId}/inventory/${inventoryId}/stats`, {
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
    },

    /**
     * 獲取庫存變更摘要
     * @param {Object} params - 查詢參數
     * @returns {Promise} - API 回應
     */
    getStockChangeSummary({ storeId, ...queryParams }) {
      return apiClient.get(`/store/${storeId}/inventory/summary`, { params: queryParams });
    }
  };
}
