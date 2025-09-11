/**
 * 現金流分類 API 模組
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 現金流分類相關 API 方法
 */
export default function (apiClient) {
  return {
    /**
     * 獲取店鋪的現金流分類
     * @param {string} storeId - 店鋪ID
     * @returns {Promise} - API 回應
     */
    getCategoriesByStore(storeId) {
      return apiClient.get(`/cash-flow-category/${storeId}`)
    },

    /**
     * 創建現金流分類
     * @param {Object} data - 分類資料
     * @returns {Promise} - API 回應
     */
    createCategory(data) {
      return apiClient.post('/cash-flow-category', data)
    },

    /**
     * 獲取分類詳情
     * @param {string} id - 分類ID
     * @returns {Promise} - API 回應
     */
    getCategoryById(id) {
      return apiClient.get(`/cash-flow-category/detail/${id}`)
    },

    /**
     * 更新分類
     * @param {string} id - 分類ID
     * @param {Object} data - 更新資料
     * @returns {Promise} - API 回應
     */
    updateCategory(id, data) {
      return apiClient.put(`/cash-flow-category/${id}`, data)
    },

    /**
     * 刪除分類
     * @param {string} id - 分類ID
     * @returns {Promise} - API 回應
     */
    deleteCategory(id) {
      return apiClient.delete(`/cash-flow-category/${id}`)
    },

    /**
     * 獲取分類使用統計
     * @param {string} storeId - 店鋪ID
     * @returns {Promise} - API 回應
     */
    getCategoryUsageStats(storeId) {
      return apiClient.get(`/cash-flow-category/${storeId}/stats`)
    },

  }
}