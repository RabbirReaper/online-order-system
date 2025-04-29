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
     * @param {string} data.name - 店鋪名稱
     * @param {string} data.brand - 品牌ID
     * @param {string|Buffer} [data.imageData] - 圖片資料 (Base64 或 Buffer)
     * @param {Object} [data.image] - 現有圖片資訊 (提供 imageData 時忽略)
     * @param {Array} [data.businessHours] - 營業時間
     * @param {string} [data.menuId] - 菜單ID
     * @param {Array} [data.announcements] - 公告
     * @param {boolean} [data.isActive] - 是否啟用
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
     * @param {string|Buffer} [params.data.imageData] - 新圖片資料 (Base64 或 Buffer)
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
    },

    /**
     * 切換店鋪啟用狀態
     * @param {Object} params - 參數
     * @param {string} params.id - 店鋪ID
     * @param {boolean} params.isActive - 是否啟用
     * @returns {Promise} - API 回應
     */
    toggleStoreActive({ id, isActive }) {
      return apiClient.put(`/store/${id}`, { isActive });
    },

    /**
     * 獲取店鋪營業時間
     * @param {string} id - 店鋪ID
     * @returns {Promise} - API 回應
     */
    getBusinessHours(id) {
      return apiClient.get(`/store/${id}/business-hours`);
    },

    /**
     * 更新店鋪營業時間
     * @param {Object} params - 參數
     * @param {string} params.id - 店鋪ID
     * @param {Array} params.businessHours - 營業時間資料
     * @returns {Promise} - API 回應
     */
    updateBusinessHours({ id, businessHours }) {
      return apiClient.put(`/store/${id}/business-hours`, { businessHours });
    },

    /**
     * 更新店鋪公告
     * @param {Object} params - 參數
     * @param {string} params.id - 店鋪ID
     * @param {Array} params.announcements - 公告資料
     * @returns {Promise} - API 回應
     */
    updateAnnouncements({ id, announcements }) {
      return apiClient.put(`/store/${id}/announcements`, { announcements });
    },

    /**
     * 獲取店鋪當前狀態
     * @param {string} id - 店鋪ID
     * @returns {Promise} - API 回應
     */
    getStoreStatus(id) {
      return apiClient.get(`/store/${id}/status`);
    }
  };
}
