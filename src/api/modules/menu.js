/**
 * 菜單管理 API 模組
 * 支援多菜單邏輯：一個店鋪可以有多個菜單，但同種類型一次只能有一個啟用
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 菜單相關 API 方法
 */
export default function (apiClient) {
  return {
    /**
     * 獲取店鋪的所有菜單
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {boolean} [params.includeUnpublished=false] - 是否包含未發布的項目
     * @param {boolean} [params.activeOnly=false] - 是否只返回啟用的菜單
     * @param {string} [params.menuType] - 篩選特定類型的菜單 (food, cash_coupon, point_exchange)
     * @returns {Promise} - API 回應，包含 menus 陣列
     */
    getAllStoreMenus({ brandId, storeId, includeUnpublished = false, activeOnly = false, menuType }) {
      return apiClient.get(`/menu/brands/${brandId}/${storeId}/menus`, {
        params: {
          includeUnpublished,
          activeOnly,
          menuType
        }
      });
    },

    /**
     * 獲取店鋪菜單（單個，向後兼容）
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {boolean} [params.includeUnpublished=true] - 是否包含未發布的項目
     * @param {string} [params.menuType] - 指定菜單類型，不指定則返回第一個啟用的菜單
     * @returns {Promise} - API 回應
     */
    getStoreMenu({ brandId, storeId, includeUnpublished = true, menuType }) {
      return apiClient.get(`/menu/brands/${brandId}/${storeId}/menu`, {
        params: {
          includeUnpublished,
          menuType
        }
      });
    },

    /**
     * 根據ID獲取特定菜單
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.menuId - 菜單ID
     * @param {boolean} [params.includeUnpublished=true] - 是否包含未發布的項目
     * @returns {Promise} - API 回應
     */
    getMenuById({ brandId, storeId, menuId, includeUnpublished = true }) {
      return apiClient.get(`/menu/brands/${brandId}/${storeId}/menu/${menuId}`, {
        params: { includeUnpublished }
      });
    },

    /**
     * 創建店鋪菜單
     * @param {Object} params - 菜單參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {Object} params.data - 菜單資料
     * @param {string} params.data.name - 菜單名稱
     * @param {string} params.data.menuType - 菜單類型 (food, cash_coupon, point_exchange)
     * @param {boolean} [params.data.isActive=true] - 是否啟用
     * @param {Array} [params.data.categories] - 菜單分類
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
