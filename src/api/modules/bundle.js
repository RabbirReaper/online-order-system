/**
 * Bundle (兌換券綑綁) API 模組
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - Bundle 相關 API 方法
 */
export default function (apiClient) {
  return {
    // ========== 管理員功能 ==========

    /**
     * 獲取所有 Bundle (管理員功能)
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {boolean} [params.includeInactive=false] - 是否包含未啟用的 Bundle
     * @param {number} [params.page=1] - 頁碼
     * @param {number} [params.limit=20] - 每頁數量
     * @returns {Promise} - API 回應，包含 bundles 和 pagination
     */
    getAllBundles({ brandId, includeInactive = false, page = 1, limit = 20 }) {
      return apiClient.get(`/bundle/brands/${brandId}/bundles`, {
        params: { includeInactive, page, limit }
      });
    },

    /**
     * 獲取單個 Bundle 詳情 (管理員功能)
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.id - Bundle ID（必填）
     * @returns {Promise} - API 回應
     */
    getBundleById({ brandId, id }) {
      return apiClient.get(`/bundle/brands/${brandId}/bundles/${id}`);
    },

    /**
     * 創建新 Bundle (管理員功能)
     * @param {Object} params - 創建參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {Object} params.data - Bundle 資料
     * @param {string} params.data.name - Bundle 名稱
     * @param {string} params.data.description - Bundle 描述
     * @param {Object} params.data.cashPrice - 現金價格
     * @param {Object} params.data.pointPrice - 點數價格
     * @param {Array} params.data.bundleItems - Bundle 項目列表
     * @param {boolean} [params.data.isActive=true] - 是否啟用
     * @param {boolean} [params.data.autoStatusControl=false] - 是否自動控制狀態
     * @param {Date} [params.data.validFrom] - 有效期起始時間
     * @param {Date} [params.data.validTo] - 有效期結束時間
     * @param {number} [params.data.voucherValidityDays=30] - 兌換券有效期天數
     * @param {number} [params.data.purchaseLimitPerUser] - 購買限制
     * @returns {Promise} - API 回應
     */
    createBundle({ brandId, data }) {
      return apiClient.post(`/bundle/brands/${brandId}/bundles`, data);
    },

    /**
     * 更新 Bundle (管理員功能)
     * @param {Object} params - 更新參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.id - Bundle ID（必填）
     * @param {Object} params.data - 更新資料
     * @returns {Promise} - API 回應
     */
    updateBundle({ brandId, id, data }) {
      return apiClient.put(`/bundle/brands/${brandId}/bundles/${id}`, data);
    },

    /**
     * 刪除 Bundle (管理員功能)
     * @param {Object} params - 刪除參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.id - Bundle ID（必填）
     * @returns {Promise} - API 回應
     */
    deleteBundle({ brandId, id }) {
      return apiClient.delete(`/bundle/brands/${brandId}/bundles/${id}`);
    },

    // ========== 客戶端功能 ==========

    /**
     * 檢查用戶購買限制 (客戶端)
     * @param {Object} params - 檢查參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.bundleId - Bundle ID（必填）
     * @returns {Promise} - API 回應，包含是否可購買和剩餘限制
     */
    checkPurchaseLimit({ brandId, bundleId }) {
      return apiClient.get(`/bundle/brands/${brandId}/bundles/${bundleId}/purchase-limit`);
    },

    // ========== Bundle 實例相關 ==========

    /**
     * 獲取單個 Bundle 實例 (管理員功能)
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.instanceId - 實例ID（必填）
     * @returns {Promise} - API 回應
     */
    getBundleInstanceById({ brandId, instanceId }) {
      return apiClient.get(`/bundle/brands/${brandId}/bundles/instances/${instanceId}`);
    },

    /**
     * 創建 Bundle 實例 (通常由訂單系統調用)
     * @param {Object} params - 創建參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {Object} params.data - 實例資料
     * @param {string} params.data.templateId - Bundle 模板ID
     * @param {string} params.data.user - 用戶ID
     * @param {string} params.data.order - 訂單ID
     * @returns {Promise} - API 回應
     */
    createBundleInstance({ brandId, data }) {
      return apiClient.post(`/bundle/brands/${brandId}/bundles/instances`, data);
    },

    /**
     * 自動為兌換券創建Bundle包裝 (管理員功能)
     * @param {Object} params - 創建參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @returns {Promise} - API 回應，包含創建統計和詳情
     */
    autoCreateBundlesForVouchers({ brandId }) {
      return apiClient.post(`/bundle/brands/${brandId}/bundles/auto-create`);
    },
  };
}
