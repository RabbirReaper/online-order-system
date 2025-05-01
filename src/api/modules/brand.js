/**
 * 品牌管理 API 模組
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 品牌相關 API 方法
 */
export default function (apiClient) {
  return {
    /**
     * 獲取所有品牌
     * @returns {Promise} - API 回應
     */
    getAllBrands() {
      return apiClient.get('/store/brands');
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
     * @param {string} data.name - 品牌名稱
     * @param {string} [data.description] - 品牌描述
     * @param {string} [data.imageData] - 圖片資料 (Base64)
     * @param {Object} [data.image] - 現有圖片資訊 (提供 imageData 時忽略)
     * @returns {Promise} - API 回應
     */
    createBrand(data) {
      return apiClient.post('/store/brands', data);
    },

    /**
     * 更新品牌資料
     * @param {Object} params - 更新參數
     * @param {string} params.id - 品牌ID
     * @param {Object} params.data - 更新資料
     * @param {string} [params.data.name] - 品牌名稱
     * @param {string} [params.data.description] - 品牌描述
     * @param {string} [params.data.imageData] - 新圖片資料 (Base64)
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
    },

    /**
     * 獲取品牌下的所有店鋪
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID
     * @param {boolean} [params.activeOnly] - 是否只顯示啟用的店鋪
     * @returns {Promise} - API 回應
     */
    getBrandStores(params) {
      return apiClient.get(`/store/brands/${params.brandId}/stores`, {
        params: { activeOnly: params.activeOnly }
      });
    },

    /**
     * 獲取品牌統計數據
     * @param {string} brandId - 品牌ID
     * @returns {Promise} - API 回應
     */
    getBrandStats(brandId) {
      return apiClient.get(`/store/brands/${brandId}/stats`);
    },

    /**
     * 切換品牌啟用狀態
     * @param {Object} params - 參數
     * @param {string} params.id - 品牌ID
     * @param {boolean} params.isActive - 是否啟用
     * @returns {Promise} - API 回應
     */
    toggleBrandActive({ id, isActive }) {
      return apiClient.put(`/store/brands/${id}/toggle`, { isActive });
    }
  };
}
