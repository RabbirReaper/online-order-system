/**
 * 現金流記錄 API 模組
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 現金流記錄相關 API 方法
 */
export default function (apiClient) {
  return {
    /**
     * 獲取店鋪的現金流記錄
     * @param {string} storeId - 店鋪ID
     * @param {Object} params - 查詢參數
     * @returns {Promise} - API 回應
     */
    getCashFlowsByStore(storeId, params = {}) {
      return apiClient.get(`/cash-flow/${storeId}`, { params })
    },

    /**
     * 創建現金流記錄
     * @param {Object} data - 現金流記錄資料
     * @returns {Promise} - API 回應
     */
    createCashFlow(data) {
      return apiClient.post('/cash-flow', data)
    },

    /**
     * 獲取現金流記錄詳情
     * @param {string} id - 記錄ID
     * @returns {Promise} - API 回應
     */
    getCashFlowById(id) {
      return apiClient.get(`/cash-flow/detail/${id}`)
    },

    /**
     * 更新現金流記錄
     * @param {string} id - 記錄ID
     * @param {Object} data - 更新資料
     * @returns {Promise} - API 回應
     */
    updateCashFlow(id, data) {
      return apiClient.put(`/cash-flow/${id}`, data)
    },

    /**
     * 刪除現金流記錄
     * @param {string} id - 記錄ID
     * @returns {Promise} - API 回應
     */
    deleteCashFlow(id) {
      return apiClient.delete(`/cash-flow/${id}`)
    },

    /**
     * 獲取店鋪現金流統計
     * @param {string} storeId - 店鋪ID
     * @param {Object} params - 查詢參數
     * @returns {Promise} - API 回應
     */
    getCashFlowStatistics(storeId, params = {}) {
      return apiClient.get(`/cash-flow/${storeId}/statistics`, { params })
    },

    /**
     * 匯出現金流記錄為CSV
     * @param {string} storeId - 店鋪ID
     * @param {Object} params - 查詢參數
     * @returns {Promise} - API 回應
     */
    exportCashFlowCSV(storeId, params = {}) {
      return apiClient.get(`/cash-flow/${storeId}/export/csv`, {
        params,
        responseType: 'blob'
      })
    }
  }
}