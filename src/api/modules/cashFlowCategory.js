/**
 * 現金流分類 API 模組
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 現金流分類相關 API 方法
 */
export default function (apiClient) {
  return {
    /**
     * 獲取店鋪的現金流分類
     * @param {string} brandId - 品牌ID
     * @param {string} storeId - 店鋪ID
     * @returns {Promise} - API 回應
     */
    getCategoriesByStore(brandId, storeId) {
      return apiClient.get(`/cash-flow-category/${brandId}/${storeId}`)
    },

    /**
     * 創建現金流分類
     * @param {string} brandId - 品牌ID
     * @param {string} storeId - 店鋪ID
     * @param {Object} data - 分類資料
     * @returns {Promise} - API 回應
     */
    createCategory(brandId, storeId, data) {
      return apiClient.post(`/cash-flow-category/${brandId}/${storeId}`, data)
    },

    /**
     * 獲取分類詳情
     * @param {string} brandId - 品牌ID
     * @param {string} storeId - 店鋪ID
     * @param {string} categoryId - 分類ID
     * @returns {Promise} - API 回應
     */
    getCategoryById(brandId, storeId, categoryId) {
      return apiClient.get(`/cash-flow-category/${brandId}/${storeId}/detail/${categoryId}`)
    },

    /**
     * 更新分類
     * @param {string} brandId - 品牌ID
     * @param {string} storeId - 店鋪ID
     * @param {string} categoryId - 分類ID
     * @param {Object} data - 更新資料
     * @returns {Promise} - API 回應
     */
    updateCategory(brandId, storeId, categoryId, data) {
      return apiClient.put(`/cash-flow-category/${brandId}/${storeId}/${categoryId}`, data)
    },

    /**
     * 刪除分類
     * @param {string} brandId - 品牌ID
     * @param {string} storeId - 店鋪ID
     * @param {string} categoryId - 分類ID
     * @returns {Promise} - API 回應
     */
    deleteCategory(brandId, storeId, categoryId) {
      return apiClient.delete(`/cash-flow-category/${brandId}/${storeId}/${categoryId}`)
    },
  }
}
