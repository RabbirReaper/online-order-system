/**
 * 品牌管理 API 模組
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 品牌相關 API 方法
 */
export default function (apiClient) {
  return {
    /**
     * 獲取所有品牌
     * @param {Object} [params] - 查詢參數
     * @param {number} [params.page] - 頁碼
     * @param {number} [params.limit] - 每頁數量
     * @returns {Promise} - API 回應
     */
    getAllBrands(params = {}) {
      return apiClient.get('/store/brands', { params });
    },

    /**
     * 獲取特定品牌詳情
     * @param {string} id - 品牌ID
     * @returns {Promise} - API 回應
     */
    getBrandById(id) {
      return apiClient.get(`/store/brands/${id}`);
    },

    /**
     * 創建新品牌
     * @param {Object} data - 品牌資料
     * @returns {Promise} - API 回應
     */
    createBrand(data) {
      return apiClient.post('/store/brands', data);
    },

    /**
     * 更新品牌資料
     * @param {Object} params - 更新參數
     * @param {string} params.id - 品牌ID
     * @param {Object} params.data - 更新的品牌資料
     * @returns {Promise} - API 回應
     */
    updateBrand({ id, data }) {
      return apiClient.put(`/store/brands/${id}`, data);
    },

    /**
     * 刪除品牌
     * @param {string} id - 品牌ID
     * @returns {Promise} - API 回應
     */
    deleteBrand(id) {
      return apiClient.delete(`/store/brands/${id}`);
    }
  };
}
