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
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {boolean} [params.activeOnly] - 是否只顯示啟用的店鋪
     * @returns {Promise} - API 回應
     */
    getAllStores({ brandId, ...queryParams }) {
      return apiClient.get(`/store/brands/${brandId}`, { params: queryParams })
    },

    /**
     * 獲取特定店鋪詳情（完整資料，需要權限）
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.id - 店鋪ID
     * @returns {Promise} - API 回應
     */
    getStoreById({ brandId, id }) {
      return apiClient.get(`/store/brands/${brandId}/${id}`)
    },

    /**
     * 獲取店鋪公開資訊（給客戶端使用）
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.id - 店鋪ID
     * @returns {Promise} - API 回應
     */
    getStorePublicInfo({ brandId, id }) {
      return apiClient.get(`/store/public/brands/${brandId}/${id}`)
    },

    /**
     * 創建新店鋪
     * @param {Object} params - 店鋪參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {Object} params.data - 店鋪資料
     * @param {string} params.data.name - 店鋪名稱
     * @param {string} params.data.address - 店鋪地址
     * @param {string} params.data.phone - 店鋪電話
     * @param {string} [params.data.imageData] - 圖片資料 (Base64)
     * @param {Object} [params.data.image] - 現有圖片資訊
     * @param {Array} [params.data.businessHours] - 營業時間
     * @param {string} [params.data.menuId] - 菜單ID
     * @param {Array} [params.data.announcements] - 公告
     * @param {boolean} [params.data.isActive] - 是否啟用
     * @param {boolean} [params.data.enableLineOrdering] - 啟用LINE點餐
     * @param {boolean} [params.data.showTaxId] - 顯示統一編號欄位
     * @param {boolean} [params.data.provideReceipt] - 提供收據
     * @param {boolean} [params.data.enableDineIn] - 啟用內用
     * @param {boolean} [params.data.enableTakeOut] - 啟用外帶
     * @param {boolean} [params.data.enableDelivery] - 啟用外送
     * @param {number} [params.data.dineInPrepTime] - 內用準備時間
     * @param {number} [params.data.takeOutPrepTime] - 外帶準備時間
     * @param {number} [params.data.deliveryPrepTime] - 外送準備時間
     * @param {number} [params.data.minDeliveryAmount] - 最低外送金額
     * @param {number} [params.data.minDeliveryQuantity] - 最少外送數量
     * @param {number} [params.data.maxDeliveryDistance] - 最長外送距離
     * @param {number} [params.data.advanceOrderDays] - 可預訂天數
     * @returns {Promise} - API 回應
     */
    createStore({ brandId, data }) {
      return apiClient.post(`/store/brands/${brandId}`, data)
    },

    /**
     * 更新店鋪資料
     * @param {Object} params - 更新參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.id - 店鋪ID
     * @param {Object} params.data - 更新的店鋪資料
     * @param {string} [params.data.imageData] - 新圖片資料 (Base64)
     * @returns {Promise} - API 回應
     */
    updateStore({ brandId, id, data }) {
      return apiClient.put(`/store/brands/${brandId}/${id}`, data)
    },

    /**
     * 刪除店鋪
     * @param {Object} params - 刪除參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.id - 店鋪ID
     * @returns {Promise} - API 回應
     */
    deleteStore({ brandId, id }) {
      return apiClient.delete(`/store/brands/${brandId}/${id}`)
    },

    /**
     * 切換店鋪啟用狀態
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.id - 店鋪ID
     * @param {boolean} params.isActive - 是否啟用
     * @returns {Promise} - API 回應
     */
    toggleStoreActive({ brandId, id, isActive }) {
      return apiClient.put(`/store/brands/${brandId}/${id}`, { isActive })
    },

    /**
     * 獲取店鋪營業時間
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @returns {Promise} - API 回應
     */
    getBusinessHours({ brandId, storeId }) {
      return apiClient.get(`/store/brands/${brandId}/${storeId}/business-hours`)
    },

    /**
     * 更新店鋪營業時間
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {Array} params.businessHours - 營業時間資料
     * @returns {Promise} - API 回應
     */
    updateBusinessHours({ brandId, storeId, businessHours }) {
      return apiClient.put(`/store/brands/${brandId}/${storeId}/business-hours`, { businessHours })
    },

    /**
     * 更新店鋪公告
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {Array} params.announcements - 公告資料
     * @returns {Promise} - API 回應
     */
    updateAnnouncements({ brandId, storeId, announcements }) {
      return apiClient.put(`/store/brands/${brandId}/${storeId}/announcements`, { announcements })
    },

    /**
     * 獲取店鋪當前狀態
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.id - 店鋪ID
     * @returns {Promise} - API 回應
     */
    getStoreStatus({ brandId, id }) {
      return apiClient.get(`/store/brands/${brandId}/${id}/status`)
    },

    /**
     * 更新店鋪服務設定
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID
     * @param {Object} params.serviceSettings - 服務設定
     * @returns {Promise} - API 回應
     */
    updateServiceSettings({ brandId, storeId, serviceSettings }) {
      return apiClient.put(`/store/brands/${brandId}/${storeId}/service-settings`, {
        serviceSettings,
      })
    },

    /**
     * 獲取店鋪LINE Bot資訊
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.id - 店鋪ID
     * @returns {Promise} - API 回應
     */
    getLineBotInfo({ brandId, id }) {
      return apiClient.get(`/store/brands/${brandId}/${id}/line-bot-info`)
    },
  }
}
