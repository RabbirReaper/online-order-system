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
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {string} [params.inventoryType] - 庫存類型 ('DishTemplate' 或 'else')
     * @param {boolean} [params.onlyAvailable] - 是否只顯示有庫存的項目
     * @param {string} [params.search] - 搜尋關鍵字
     * @returns {Promise} - API 回應
     */
    getStoreInventory({ brandId, storeId, ...queryParams }) {
      return apiClient.get(`/inventory/brands/${brandId}/${storeId}/inventory`, {
        params: queryParams,
      })
    },

    /**
     * 獲取特定庫存項目詳情
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.inventoryId - 庫存ID (inventory._id)
     * @returns {Promise} - API 回應
     */
    getInventoryItem({ brandId, storeId, inventoryId }) {
      return apiClient.get(`/inventory/brands/${brandId}/${storeId}/inventory/${inventoryId}`)
    },

    /**
     * 創建新庫存項目
     * @param {Object} params - 庫存參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {Object} params.data - 庫存資料
     * @returns {Promise} - API 回應
     */
    createInventory({ brandId, storeId, data }) {
      return apiClient.post(`/inventory/brands/${brandId}/${storeId}/inventory`, data)
    },

    /**
     * 更新庫存資料
     * @param {Object} params - 更新參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.inventoryId - 庫存ID (inventory._id)
     * @param {Object} params.data - 更新的庫存資料
     * @returns {Promise} - API 回應
     */
    updateInventory({ brandId, storeId, inventoryId, data }) {
      return apiClient.put(`/inventory/brands/${brandId}/${storeId}/inventory/${inventoryId}`, data)
    },

    /**
     * 設定可用庫存
     * @param {Object} params - 設定參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.inventoryId - 庫存ID
     * @param {number} params.availableStock - 可用庫存數量
     * @param {string} params.reason - 調整原因
     * @returns {Promise} - API 回應
     */
    setAvailableStock({ brandId, storeId, inventoryId, availableStock, reason }) {
      return apiClient.put(
        `/inventory/brands/${brandId}/${storeId}/inventory/${inventoryId}/available-stock`,
        {
          availableStock,
          reason,
        },
      )
    },

    /**
     * 減少庫存（訂單消耗）
     * @param {Object} params - 減少參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.inventoryId - 庫存ID
     * @param {number} params.quantity - 減少數量
     * @param {string} params.reason - 減少原因
     * @param {string} params.orderId - 訂單ID
     * @param {string} [params.inventoryType='DishTemplate'] - 庫存類型
     * @returns {Promise} - API 回應
     */
    reduceStock({
      brandId,
      storeId,
      inventoryId,
      quantity,
      reason,
      orderId,
      inventoryType = 'DishTemplate',
    }) {
      return apiClient.post(
        `/inventory/brands/${brandId}/${storeId}/inventory/${inventoryId}/reduce`,
        {
          quantity,
          reason,
          orderId,
          inventoryType,
        },
      )
    },

    /**
     * 增加庫存
     * @param {Object} params - 增加參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.inventoryId - 庫存ID
     * @param {number} params.quantity - 增加數量
     * @param {string} params.reason - 增加原因
     * @param {string} [params.stockType='totalStock'] - 庫存類型
     * @param {string} [params.inventoryType='DishTemplate'] - 項目類型
     * @returns {Promise} - API 回應
     */
    addStock({
      brandId,
      storeId,
      inventoryId,
      quantity,
      reason,
      stockType = 'totalStock',
      inventoryType = 'DishTemplate',
    }) {
      return apiClient.post(
        `/inventory/brands/${brandId}/${storeId}/inventory/${inventoryId}/add`,
        {
          quantity,
          reason,
          stockType,
          inventoryType,
        },
      )
    },

    /**
     * 損耗處理
     * @param {Object} params - 損耗參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.inventoryId - 庫存ID
     * @param {number} params.quantity - 損耗數量
     * @param {string} params.reason - 損耗原因
     * @param {string} [params.stockType='totalStock'] - 庫存類型
     * @param {string} [params.inventoryType='DishTemplate'] - 項目類型
     * @returns {Promise} - API 回應
     */
    processDamage({
      brandId,
      storeId,
      inventoryId,
      quantity,
      reason,
      stockType = 'totalStock',
      inventoryType = 'DishTemplate',
    }) {
      return apiClient.post(
        `/inventory/brands/${brandId}/${storeId}/inventory/${inventoryId}/damage`,
        {
          quantity,
          reason,
          stockType,
          inventoryType,
        },
      )
    },

    /**
     * 切換售完狀態
     * @param {Object} params - 切換參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.inventoryId - 庫存ID
     * @param {boolean} params.isSoldOut - 是否售完
     * @returns {Promise} - API 回應
     */
    toggleSoldOut({ brandId, storeId, inventoryId, isSoldOut }) {
      return apiClient.put(
        `/inventory/brands/${brandId}/${storeId}/inventory/${inventoryId}/sold-out`,
        {
          isSoldOut,
        },
      )
    },

    /**
     * 初始化餐點庫存
     * @param {Object} params - 初始化參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @returns {Promise} - API 回應
     */
    initializeDishInventory({ brandId, storeId }) {
      return apiClient.post(`/inventory/brands/${brandId}/${storeId}/inventory/initialize-dishes`)
    },

    /**
     * 獲取庫存日誌
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {Date} [params.fromDate] - 開始日期
     * @param {Date} [params.toDate] - 結束日期
     * @param {string} [params.inventoryType] - 庫存類型
     * @param {number} [params.page] - 頁碼
     * @param {number} [params.limit] - 每頁數量
     * @returns {Promise} - API 回應
     */
    getInventoryLogs({ brandId, storeId, ...queryParams }) {
      return apiClient.get(`/inventory/brands/${brandId}/${storeId}/inventory/logs`, {
        params: queryParams,
      })
    },

    /**
     * 獲取項目庫存統計
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.inventoryId - 庫存ID
     * @param {string} [params.inventoryType='DishTemplate'] - 庫存類型
     * @returns {Promise} - API 回應
     */
    getItemInventoryStats({ brandId, storeId, inventoryId, inventoryType = 'DishTemplate' }) {
      return apiClient.get(
        `/inventory/brands/${brandId}/${storeId}/inventory/${inventoryId}/stats`,
        {
          params: { inventoryType },
        },
      )
    },

    /**
     * 獲取庫存健康狀況報告
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.inventoryType - 庫存類型
     * @param {number} [params.criticalDaysThreshold=3] - 關鍵天數門檻
     * @param {number} [params.overStockDaysThreshold=30] - 過量庫存天數門檻
     * @returns {Promise} - API 回應
     */
    getInventoryHealthReport({
      brandId,
      storeId,
      inventoryType,
      criticalDaysThreshold = 3,
      overStockDaysThreshold = 30,
    }) {
      return apiClient.get(`/inventory/brands/${brandId}/${storeId}/inventory/health`, {
        params: { inventoryType, criticalDaysThreshold, overStockDaysThreshold },
      })
    },

    /**
     * 批量更新庫存
     * @param {Object} params - 更新參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {Array} params.items - 批量更新項目
     * @returns {Promise} - API 回應
     */
    bulkUpdateInventory({ brandId, storeId, items }) {
      return apiClient.post(`/inventory/brands/${brandId}/${storeId}/inventory/bulk`, { items })
    },

    /**
     * 獲取庫存變更摘要
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {Date} [params.fromDate] - 開始日期
     * @param {Date} [params.toDate] - 結束日期
     * @param {string} [params.inventoryType] - 庫存類型
     * @returns {Promise} - API 回應
     */
    getStockChangeSummary({ brandId, storeId, ...queryParams }) {
      return apiClient.get(`/inventory/brands/${brandId}/${storeId}/inventory/summary`, {
        params: queryParams,
      })
    },
  }
}
