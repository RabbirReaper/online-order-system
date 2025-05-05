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
     * @param {boolean} includeUnpublished - 是否包含未發布的項目（可選）
     * @returns {Promise} - API 回應
     */
    getStoreMenu(storeId, includeUnpublished = false) {
      return apiClient.get(`/store/${storeId}/menu`, {
        params: { includeUnpublished }
      });
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
    },

    /**
     * 切換菜單項目啟用狀態
     * @param {Object} params - 狀態參數
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.menuId - 菜單ID
     * @param {number} params.categoryIndex - 分類索引
     * @param {number} params.dishIndex - 餐點索引
     * @param {boolean} params.isPublished - 是否啟用
     * @returns {Promise} - API 回應
     */
    toggleMenuItem({ storeId, menuId, categoryIndex, dishIndex, isPublished }) {
      return apiClient.put(`/store/${storeId}/menu/${menuId}/toggle-item`, {
        categoryIndex: parseInt(categoryIndex, 10),
        dishIndex: parseInt(dishIndex, 10),
        isPublished
      });
    },

    /**
     * 更新分類順序
     * @param {Object} params - 順序參數
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.menuId - 菜單ID
     * @param {Array} params.categoryOrders - 分類順序 [{ categoryIndex, order }]
     * @returns {Promise} - API 回應
     */
    updateCategoryOrder({ storeId, menuId, categoryOrders }) {
      return apiClient.put(`/store/${storeId}/menu/${menuId}/category-order`, {
        categoryOrders: categoryOrders.map(item => ({
          ...item,
          categoryIndex: parseInt(item.categoryIndex, 10),
          order: parseInt(item.order, 10)
        }))
      });
    },

    /**
     * 更新餐點順序
     * @param {Object} params - 順序參數
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.menuId - 菜單ID
     * @param {number} params.categoryIndex - 分類索引
     * @param {Array} params.dishOrders - 餐點順序 [{ dishIndex, order }]
     * @returns {Promise} - API 回應
     */
    updateDishOrder({ storeId, menuId, categoryIndex, dishOrders }) {
      return apiClient.put(`/store/${storeId}/menu/${menuId}/dish-order`, {
        categoryIndex: parseInt(categoryIndex, 10),
        dishOrders: dishOrders.map(item => ({
          ...item,
          dishIndex: parseInt(item.dishIndex, 10),
          order: parseInt(item.order, 10)
        }))
      });
    },

    /**
     * 添加餐點到菜單
     * @param {Object} params - 添加參數
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.menuId - 菜單ID
     * @param {number} params.categoryIndex - 分類索引
     * @param {Object} params.dishData - 餐點資料
     * @returns {Promise} - API 回應
     */
    addDishToMenu({ storeId, menuId, categoryIndex, dishData }) {
      return apiClient.post(`/store/${storeId}/menu/${menuId}/dish`, {
        categoryIndex: parseInt(categoryIndex, 10),
        dishData
      });
    },

    /**
     * 從菜單中移除餐點
     * @param {Object} params - 移除參數
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.menuId - 菜單ID
     * @param {number} params.categoryIndex - 分類索引
     * @param {number} params.dishIndex - 餐點索引
     * @returns {Promise} - API 回應
     */
    removeDishFromMenu({ storeId, menuId, categoryIndex, dishIndex }) {
      return apiClient.delete(`/store/${storeId}/menu/${menuId}/dish`, {
        data: {
          categoryIndex: parseInt(categoryIndex, 10),
          dishIndex: parseInt(dishIndex, 10)
        }
      });
    }
  };
}
