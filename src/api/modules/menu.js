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
    getAllStoreMenus({
      brandId,
      storeId,
      includeUnpublished = false,
      activeOnly = false,
      menuType,
    }) {
      return apiClient.get(`/menu/brands/${brandId}/${storeId}/menus`, {
        params: {
          includeUnpublished,
          activeOnly,
          menuType,
        },
      })
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
        params: { includeUnpublished },
      })
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
      return apiClient.post(`/menu/brands/${brandId}/${storeId}/menu`, data)
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
      return apiClient.put(`/menu/brands/${brandId}/${storeId}/menu/${menuId}`, data)
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
      return apiClient.delete(`/menu/brands/${brandId}/${storeId}/menu/${menuId}`)
    },

    /**
     * 根據ID獲取菜單且完整填充商品與選項 - 用於外送平台上傳Menu
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {string} params.menuId - 菜單ID
     * @param {boolean} [params.includeUnpublished=false] - 是否包含未發布的項目
     * @returns {Promise} - API 回應
     */
    getMenuAllPopulateById({ brandId, storeId, menuId, includeUnpublished = false }) {
      return apiClient.get(`/menu/brands/${brandId}/${storeId}/menu/${menuId}/full-populate`, {
        params: { includeUnpublished },
      })
    },
  }
}
