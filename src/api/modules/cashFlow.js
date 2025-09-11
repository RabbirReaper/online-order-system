/**
 * 現金流記錄 API 模組
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 現金流記錄相關 API 方法
 */
export default function (apiClient) {
  return {
    /**
     * 獲取店鋪的現金流記錄
     * @param {string} brandId - 品牌ID
     * @param {string} storeId - 店鋪ID
     * @param {Object} params - 查詢參數
     * @returns {Promise} - API 回應
     */
    getCashFlowsByStore(brandId, storeId, params = {}) {
      return apiClient.get(`/cash-flow/${brandId}/${storeId}`, { params })
    },

    /**
     * 創建現金流記錄
     * @param {string} brandId - 品牌ID
     * @param {string} storeId - 店鋪ID
     * @param {Object} data - 現金流記錄資料
     * @returns {Promise} - API 回應
     */
    createCashFlow(brandId, storeId, data) {
      return apiClient.post(`/cash-flow/${brandId}/${storeId}`, data)
    },

    /**
     * 獲取現金流記錄詳情
     * @param {string} brandId - 品牌ID
     * @param {string} storeId - 店鋪ID
     * @param {string} cashFlowId - 現金流記錄ID
     * @returns {Promise} - API 回應
     */
    getCashFlowById(brandId, storeId, cashFlowId) {
      return apiClient.get(`/cash-flow/${brandId}/${storeId}/detail/${cashFlowId}`)
    },

    /**
     * 更新現金流記錄
     * @param {string} brandId - 品牌ID
     * @param {string} storeId - 店鋪ID
     * @param {string} cashFlowId - 現金流記錄ID
     * @param {Object} data - 更新資料
     * @returns {Promise} - API 回應
     */
    updateCashFlow(brandId, storeId, cashFlowId, data) {
      return apiClient.put(`/cash-flow/${brandId}/${storeId}/${cashFlowId}`, data)
    },

    /**
     * 刪除現金流記錄
     * @param {string} brandId - 品牌ID
     * @param {string} storeId - 店鋪ID
     * @param {string} cashFlowId - 現金流記錄ID
     * @returns {Promise} - API 回應
     */
    deleteCashFlow(brandId, storeId, cashFlowId) {
      return apiClient.delete(`/cash-flow/${brandId}/${storeId}/${cashFlowId}`)
    },

    /**
     * 獲取店鋪現金流統計
     * @param {string} brandId - 品牌ID
     * @param {string} storeId - 店鋪ID
     * @param {Object} params - 查詢參數
     * @returns {Promise} - API 回應
     */
    getCashFlowStatistics(brandId, storeId, params = {}) {
      return apiClient.get(`/cash-flow/${brandId}/${storeId}/statistics`, { params })
    },

    /**
     * 匯出現金流記錄為CSV
     * @param {string} brandId - 品牌ID
     * @param {string} storeId - 店鋪ID
     * @param {Object} params - 查詢參數
     * @returns {Promise} - API 回應
     */
    exportCashFlowCSV(brandId, storeId, params = {}) {
      return apiClient.get(`/cash-flow/${brandId}/${storeId}/export/csv`, {
        params,
        responseType: 'blob'
      })
    }
  }
}