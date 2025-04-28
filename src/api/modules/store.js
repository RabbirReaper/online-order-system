/**
 * 店鋪管理 API 模組
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 店鋪相關 API 方法
 */
export default function (apiClient) {
  return {
    /**
     * 獲取所有店鋪
     * @param {Object} params - 查詢參數
     * @param {string} [params.brandId] - 按品牌篩選
     * @param {boolean} [params.activeOnly] - 是否只顯示啟用的店鋪
     * @param {number} [params.page] - 頁碼
     * @param {number} [params.limit] - 每頁數量
     * @returns {Promise} - API 回應
     */
    getAllStores(params = {}) {
      return apiClient.get('/store', { params });
    },

    /**
     * 獲取特定店鋪詳情
     * @param {string} id - 店鋪ID
     * @returns {Promise} - API 回應
     */
    getStoreById(id) {
      return apiClient.get(`/store/${id}`);
    },

    /**
     * 創建新店鋪
     * @param {Object} data - 店鋪資料
     * @returns {Promise} - API 回應
     */
    createStore(data) {
      return apiClient.post('/store', data);
    },

    /**
     * 更新店鋪資料
     * @param {Object} params - 更新參數
     * @param {string} params.id - 店鋪ID
     * @param {Object} params.data - 更新的店鋪資料
     * @returns {Promise} - API 回應
     */
    updateStore({ id, data }) {
      return apiClient.put(`/store/${id}`, data);
    },

    /**
     * 刪除店鋪
     * @param {string} id - 店鋪ID
     * @returns {Promise} - API 回應
     */
    deleteStore(id) {
      return apiClient.delete(`/store/${id}`);
    }
  };
}
