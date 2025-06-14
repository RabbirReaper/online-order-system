/**
 * 菜單管理 API 模組
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 菜單相關 API 方法
 */
export default function (apiClient) {
  return {
    /**
     * 獲取店鋪菜單
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {boolean} [params.includeUnpublished] - 是否包含未發布的項目（可選）
     * @returns {Promise} - API 回應
     */
    getStoreMenu({ brandId, storeId, includeUnpublished = true }) {
      return apiClient.get(`/menu/brands/${brandId}/${storeId}/menu`, {
        params: { includeUnpublished }
      });
    },

    /**
     * 創建店鋪菜單
     * @param {Object} params - 菜單參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {Object} params.data - 菜單資料
     * @returns {Promise} - API 回應
     */
    createMenu({ brandId, storeId, data }) {
      return apiClient.post(`/menu/brands/${brandId}/${storeId}/menu`, data);
    },

    /**
     * 更新菜單資料
     * @param {Object} params - 更新參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.menuId - 菜單ID
     * @param {Object} params.data - 更新的菜單資料
     * @returns {Promise} - API 回應
     */
    updateMenu({ brandId, storeId, menuId, data }) {
      return apiClient.put(`/menu/brands/${brandId}/${storeId}/menu/${menuId}`, data);
    },

    /**
     * 刪除菜單
     * @param {Object} params - 刪除參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.menuId - 菜單ID
     * @returns {Promise} - API 回應
     */
    deleteMenu({ brandId, storeId, menuId }) {
      return apiClient.delete(`/menu/brands/${brandId}/${storeId}/menu/${menuId}`);
    },

    /**
     * 啟用/停用菜單
     * @param {Object} params - 狀態參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.menuId - 菜單ID
     * @param {boolean} params.active - 是否啟用
     * @returns {Promise} - API 回應
     */
    toggleMenuActive({ brandId, storeId, menuId, active }) {
      return apiClient.put(`/menu/brands/${brandId}/${storeId}/menu/${menuId}/toggle`, { active });
    },

    /**
     * 切換菜單項目啟用狀態
     * @param {Object} params - 狀態參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.menuId - 菜單ID
     * @param {number} params.categoryIndex - 分類索引
     * @param {number} params.itemIndex - 商品索引
     * @param {boolean} params.isShowing - 是否啟用
     * @returns {Promise} - API 回應
     */
    toggleMenuItem({ brandId, storeId, menuId, categoryIndex, itemIndex, isShowing }) {
      return apiClient.put(`/menu/brands/${brandId}/${storeId}/menu/${menuId}/toggle-item`, {
        categoryIndex: parseInt(categoryIndex, 10),
        itemIndex: parseInt(itemIndex, 10),
        isShowing
      });
    },

    /**
     * 更新分類順序
     * @param {Object} params - 順序參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.menuId - 菜單ID
     * @param {Array} params.categoryOrders - 分類順序 [{ categoryIndex, order }]
     * @returns {Promise} - API 回應
     */
    updateCategoryOrder({ brandId, storeId, menuId, categoryOrders }) {
      return apiClient.put(`/menu/brands/${brandId}/${storeId}/menu/${menuId}/category-order`, {
        categoryOrders: categoryOrders.map(item => ({
          ...item,
          categoryIndex: parseInt(item.categoryIndex, 10),
          order: parseInt(item.order, 10)
        }))
      });
    },

    /**
     * 更新商品順序
     * @param {Object} params - 順序參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.menuId - 菜單ID
     * @param {number} params.categoryIndex - 分類索引
     * @param {Array} params.itemOrders - 商品順序 [{ itemIndex, order }]
     * @returns {Promise} - API 回應
     */
    updateItemOrder({ brandId, storeId, menuId, categoryIndex, itemOrders }) {
      return apiClient.put(`/menu/brands/${brandId}/${storeId}/menu/${menuId}/item-order`, {
        categoryIndex: parseInt(categoryIndex, 10),
        itemOrders: itemOrders.map(item => ({
          ...item,
          itemIndex: parseInt(item.itemIndex, 10),
          order: parseInt(item.order, 10)
        }))
      });
    },

    /**
     * 添加商品到菜單
     * @param {Object} params - 添加參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.menuId - 菜單ID
     * @param {number} params.categoryIndex - 分類索引
     * @param {Object} params.itemData - 商品資料
     * @returns {Promise} - API 回應
     */
    addItemToMenu({ brandId, storeId, menuId, categoryIndex, itemData }) {
      return apiClient.post(`/menu/brands/${brandId}/${storeId}/menu/${menuId}/item`, {
        categoryIndex: parseInt(categoryIndex, 10),
        itemData
      });
    },

    /**
     * 從菜單中移除商品
     * @param {Object} params - 移除參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.menuId - 菜單ID
     * @param {number} params.categoryIndex - 分類索引
     * @param {number} params.itemIndex - 商品索引
     * @returns {Promise} - API 回應
     */
    removeItemFromMenu({ brandId, storeId, menuId, categoryIndex, itemIndex }) {
      return apiClient.delete(`/menu/brands/${brandId}/${storeId}/menu/${menuId}/item`, {
        data: {
          categoryIndex: parseInt(categoryIndex, 10),
          itemIndex: parseInt(itemIndex, 10)
        }
      });
    }
  };
}
