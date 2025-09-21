/**
 * 平台店鋪配置管理 API 模組
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 平台店鋪配置相關 API 方法
 */
export default function (apiClient) {
  return {
    /**
     * 獲取特定店鋪的所有平台配置
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID（必填）
     * @param {string} [params.platform] - 過濾特定平台
     * @param {string} [params.status] - 過濾特定狀態
     * @returns {Promise} - API 回應
     */
    getAllPlatformStores({ brandId, storeId, ...queryParams }) {
      return apiClient.get(`/platform-store/brands/${brandId}/${storeId}`, {
        params: queryParams,
      })
    },

    /**
     * 根據平台獲取特定店鋪的平台配置
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID（必填）
     * @param {string} params.platform - 平台類型（必填）
     * @returns {Promise} - API 回應
     */
    getPlatformStoreByPlatform({ brandId, storeId, platform }) {
      return apiClient.get(`/platform-store/brands/${brandId}/${storeId}/platform`, {
        params: { platform },
      })
    },

    /**
     * 為特定店鋪創建平台配置
     * @param {Object} params - 創建參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID（必填）
     * @param {Object} params.data - 平台配置資料
     * @param {string} params.data.platform - 平台類型（必填）
     * @param {string} params.data.platformStoreId - 平台店鋪ID（必填）
     * @param {string} [params.data.status] - 營運狀態
     * @param {number} [params.data.prepTime] - 準備時間
     * @param {number} [params.data.busyPrepTime] - 忙碌時準備時間
     * @param {boolean} [params.data.autoAccept] - 是否自動接單
     * @param {Object} [params.data.platformSpecific] - 平台特定設定
     * @returns {Promise} - API 回應
     */
    createPlatformStore({ brandId, storeId, data }) {
      return apiClient.post(`/platform-store/brands/${brandId}/${storeId}`, data)
    },

    /**
     * 更新平台店鋪配置
     * @param {Object} params - 更新參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID（必填）
     * @param {string} params.platformStoreId - 平台配置ID（必填）
     * @param {Object} params.data - 更新的配置資料
     * @returns {Promise} - API 回應
     */
    updatePlatformStore({ brandId, storeId, platformStoreId, data }) {
      return apiClient.put(
        `/platform-store/brands/${brandId}/${storeId}/platform-stores/${platformStoreId}`,
        data,
      )
    },

    /**
     * 刪除平台店鋪配置
     * @param {Object} params - 刪除參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID（必填）
     * @param {string} params.platformStoreId - 平台配置ID（必填）
     * @returns {Promise} - API 回應
     */
    deletePlatformStore({ brandId, storeId, platformStoreId }) {
      return apiClient.delete(
        `/platform-store/brands/${brandId}/${storeId}/platform-stores/${platformStoreId}`,
      )
    },

    /**
     * 切換平台店鋪營運狀態
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID（必填）
     * @param {string} params.platformStoreId - 平台配置ID（必填）
     * @param {string} params.status - 營運狀態（ONLINE, BUSY, OFFLINE）
     * @returns {Promise} - API 回應
     */
    togglePlatformStoreStatus({ brandId, storeId, platformStoreId, status }) {
      return apiClient.patch(
        `/platform-store/brands/${brandId}/${storeId}/platform-stores/${platformStoreId}/status`,
        { status },
      )
    },

    /**
     * 更新菜單同步時間
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID（必填）
     * @param {string} params.platformStoreId - 平台配置ID（必填）
     * @returns {Promise} - API 回應
     */
    updateMenuSyncTime({ brandId, storeId, platformStoreId }) {
      return apiClient.patch(
        `/platform-store/brands/${brandId}/${storeId}/platform-stores/${platformStoreId}/menu-sync`,
      )
    },
  }
}