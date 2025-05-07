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
     * @param {string} params.data.inventoryType - 庫存類型 ('dish' 或 'else')
     * @param {string} [params.data.dishId] - 餐點ID（當 inventoryType 為 'dish' 時必填）
     * @param {string} params.data.itemName - 項目名稱
     * @param {number} [params.data.initialWarehouseStock=0] - 初始倉庫庫存
     * @param {number} [params.data.initialAvailableStock=0] - 初始可販售庫存
     * @param {number} [params.data.minStockAlert=0] - 最低庫存警告值
     * @param {number} [params.data.maxStockLimit] - 最高庫存限制
     * @param {boolean} [params.data.isInventoryTracked=true] - 是否追蹤庫存
     * @param {boolean} [params.data.showAvailableStockToCustomer=false] - 是否顯示庫存數量給客人
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
     * @param {string} [params.data.inventoryType='dish'] - 庫存類型
     * @param {string} [params.data.stockType='warehouseStock'] - 庫存類型（倉庫或可販售）
     * @param {number} [params.data.stock] - 新庫存量
     * @param {number} [params.data.changeAmount] - 變化量
     * @param {string} [params.data.reason] - 變更原因
     * @param {number} [params.data.minStockAlert] - 最低庫存警告值
     * @param {number} [params.data.maxStockLimit] - 最高庫存限制
     * @param {boolean} [params.data.isInventoryTracked] - 是否追蹤庫存
     * @param {boolean} [params.data.showAvailableStockToCustomer] - 是否顯示庫存數量給客人
     * @returns {Promise} - API 回應
     */
    updateInventory({ storeId, itemId, data }) {
      return apiClient.put(`/store/${storeId}/inventory/${itemId}`, data);
    },

    /**
     * 減少庫存（訂單消耗）
     * @param {Object} params - 減少參數
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.itemId - 項目ID
     * @param {number} params.quantity - 減少數量
     * @param {string} [params.reason] - 減少原因
     * @param {string} [params.orderId] - 關聯訂單ID
     * @param {string} [params.inventoryType='dish'] - 庫存類型
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
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.itemId - 項目ID
     * @param {number} params.quantity - 增加數量
     * @param {string} [params.reason] - 增加原因
     * @param {string} [params.stockType='warehouseStock'] - 庫存類型（倉庫或可販售）
     * @param {string} [params.inventoryType='dish'] - 庫存類型
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
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.itemId - 項目ID
     * @param {number} params.quantity - 調撥數量
     * @param {string} [params.reason] - 調撥原因
     * @param {string} [params.inventoryType='dish'] - 庫存類型
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
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.itemId - 項目ID
     * @param {number} params.quantity - 損耗數量
     * @param {string} params.reason - 損耗原因
     * @param {string} [params.stockType='warehouseStock'] - 庫存類型（倉庫或可販售）
     * @param {string} [params.inventoryType='dish'] - 庫存類型
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
     * @param {string} params.storeId - 店鋪ID
     * @param {string} [params.itemId] - 項目ID (可選)
     * @param {string} [params.inventoryType] - 庫存類型 (可選)
     * @param {string} [params.stockType] - 庫存變更類型（倉庫或可販售）
     * @param {Date} [params.startDate] - 開始日期 (可選)
     * @param {Date} [params.endDate] - 結束日期 (可選)
     * @param {string} [params.changeType] - 變更類型 (可選)
     * @param {number} [params.page] - 頁碼 (默認 1)
     * @param {number} [params.limit] - 每頁數量 (默認 20)
     * @returns {Promise} - API 回應
     */
    getInventoryLogs({ storeId, ...queryParams }) {
      return apiClient.get(`/store/${storeId}/inventory/logs`, { params: queryParams });
    },

    /**
     * 獲取庫存趨勢數據
     * @param {Object} params - 查詢參數
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.itemId - 項目ID
     * @param {string} [params.inventoryType='dish'] - 庫存類型
     * @param {string} [params.stockType='warehouseStock'] - 庫存類型（倉庫或可販售）
     * @param {number} [params.days=30] - 天數
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
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.itemId - 項目ID
     * @param {string} [params.inventoryType='dish'] - 庫存類型
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
     * @param {string} params.storeId - 店鋪ID
     * @param {string} [params.inventoryType] - 庫存類型
     * @param {number} [params.criticalDaysThreshold=3] - 庫存即將不足的天數閾值
     * @param {number} [params.overStockDaysThreshold=30] - 庫存過多的天數閾值
     * @returns {Promise} - API 回應
     */
    getInventoryHealthReport({ storeId, inventoryType, criticalDaysThreshold = 3, overStockDaysThreshold = 30 }) {
      return apiClient.get(`/store/${storeId}/inventory/health`, {
        params: { inventoryType, criticalDaysThreshold, overStockDaysThreshold }
      });
    },

    /**
     * 獲取庫存變更摘要
     * @param {Object} params - 查詢參數
     * @param {string} params.storeId - 店鋪ID
     * @param {Date} [params.startDate] - 開始日期
     * @param {Date} [params.endDate] - 結束日期
     * @param {string} [params.inventoryType] - 庫存類型
     * @param {string} [params.groupBy='changeType'] - 分組方式（'changeType', 'itemName', 'stockType'）
     * @returns {Promise} - API 回應
     */
    getStockChangeSummary({ storeId, startDate, endDate, inventoryType, groupBy = 'changeType' }) {
      return apiClient.get(`/store/${storeId}/inventory/summary`, {
        params: { startDate, endDate, inventoryType, groupBy }
      });
    },

    /**
     * 批量更新庫存
     * @param {Object} params - 更新參數
     * @param {string} params.storeId - 店鋪ID
     * @param {Array} params.items - 庫存數據陣列
     * @param {Object[]} params.items - 庫存項目陣列
     * @param {string} params.items[].itemId - 項目ID
     * @param {string} params.items[].itemName - 項目名稱
     * @param {string} params.items[].inventoryType - 庫存類型
     * @param {number} [params.items[].warehouseStock] - 倉庫庫存
     * @param {number} [params.items[].availableStock] - 可販售庫存
     * @param {string} [params.items[].stockType='warehouseStock'] - 庫存類型
     * @param {number} [params.items[].stock] - 庫存量
     * @param {string} [params.items[].reason] - 變更原因
     * @param {number} [params.items[].minStockAlert] - 最低庫存警告值
     * @param {number} [params.items[].maxStockLimit] - 最高庫存限制
     * @param {boolean} [params.items[].isInventoryTracked] - 是否追蹤庫存
     * @param {boolean} [params.items[].showAvailableStockToCustomer] - 是否顯示庫存數量給客人
     * @returns {Promise} - API 回應
     */
    bulkUpdateInventory({ storeId, items }) {
      return apiClient.post(`/store/${storeId}/inventory/bulk`, { items });
    }
  };
}
