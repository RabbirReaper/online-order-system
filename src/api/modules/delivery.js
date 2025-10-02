/**
 * 外送平台管理 API 模組
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 外送平台管理相關 API 方法
 */
export default function (apiClient) {
  return {
    /**
     * 同步菜單到所有啟用的外送平台
     * @param {Object} params - 同步參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID（必填）
     * @returns {Promise} - API 回應
     * @description 將店鋪菜單同步到所有已啟用的外送平台（如 UberEats、foodpanda 等）
     */
    syncMenuToAllPlatforms({ brandId, storeId }) {
      return apiClient.post(`/delivery/brands/${brandId}/${storeId}/sync-menu`)
    },

    /**
     * 獲取菜單同步狀態
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID（必填）
     * @returns {Promise} - API 回應
     * @description 查詢店鋪在各外送平台的菜單同步狀態和最後同步時間
     */
    getMenuSyncStatus({ brandId, storeId }) {
      return apiClient.get(`/delivery/brands/${brandId}/${storeId}/sync-status`)
    },

    /**
     * 同步庫存狀態到 UberEats
     * @param {Object} params - 同步參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID（必填）
     * @returns {Promise} - API 回應
     * @description 將店鋪當前庫存狀態同步到 UberEats 平台（停售/恢復商品）
     */
    syncInventoryToUberEats({ brandId, storeId }) {
      return apiClient.post(`/delivery/brands/${brandId}/${storeId}/sync-inventory`)
    },
  }
}
