/**
 * 菜單管理 API 模組
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 菜單相關 API 方法
 */
export default function (apiClient) {
  return {
    /**
     * 獲取店鋪菜單
     * @param {string} storeId - 店鋪ID
     * @returns {Promise} - API 回應
     */
    getStoreMenu(storeId) {
      return apiClient.get(`/store/${storeId}/menu`);
    },

    /**
     * 創建店鋪菜單
     * @param {Object} params - 菜單參數
     * @param {string} params.storeId - 店鋪ID
     * @param {Object} params.data - 菜單資料
     * @returns {Promise} - API 回應
     */
    createMenu({ storeId, data }) {
      return apiClient.post(`/store/${storeId}/menu`, data);
    },

    /**
     * 更新菜單資料
     * @param {Object} params - 更新參數
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.menuId - 菜單ID
     * @param {Object} params.data - 更新的菜單資料
     * @returns {Promise} - API 回應
     */
    updateMenu({ storeId, menuId, data }) {
      return apiClient.put(`/store/${storeId}/menu/${menuId}`, data);
    },

    /**
     * 刪除菜單
     * @param {Object} params - 刪除參數
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.menuId - 菜單ID
     * @returns {Promise} - API 回應
     */
    deleteMenu({ storeId, menuId }) {
      return apiClient.delete(`/store/${storeId}/menu/${menuId}`);
    },

    /**
     * 啟用/停用菜單
     * @param {Object} params - 狀態參數
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.menuId - 菜單ID
     * @param {boolean} params.active - 是否啟用
     * @returns {Promise} - API 回應
     */
    toggleMenuActive({ storeId, menuId, active }) {
      return apiClient.put(`/store/${storeId}/menu/${menuId}/toggle`, { active });
    }
  };
}
