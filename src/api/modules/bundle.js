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
      return apiClient.get(`/bundle/admin/brands/${brandId}/bundles`, {
        params: { includeInactive, page, limit }
      });
    },

    /**
     * 獲取單個 Bundle 詳情 (管理員功能)
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.bundleId - Bundle ID（必填）
     * @returns {Promise} - API 回應
     */
    getBundleById({ brandId, bundleId }) {
      return apiClient.get(`/bundle/admin/brands/${brandId}/bundles/${bundleId}`);
    },

    /**
     * 創建新 Bundle (管理員功能)
     * @param {Object} params - 創建參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {Object} params.data - Bundle 資料
     * @param {string} params.data.name - Bundle 名稱
     * @param {string} params.data.description - Bundle 描述
     * @param {number} params.data.pointCost - 所需點數
     * @param {Array} params.data.bundleItems - Bundle 項目列表
     * @param {Array} [params.data.stores] - 適用店鋪ID列表
     * @param {boolean} [params.data.isActive=true] - 是否啟用
     * @param {boolean} [params.data.autoStatusControl=false] - 是否自動控制狀態
     * @param {Date} [params.data.validFrom] - 有效期起始時間
     * @param {Date} [params.data.validTo] - 有效期結束時間
     * @param {number} [params.data.purchaseLimitPerUser] - 每人購買限制
     * @returns {Promise} - API 回應
     */
    createBundle({ brandId, data }) {
      return apiClient.post(`/bundle/admin/brands/${brandId}/bundles`, data);
    },

    /**
     * 更新 Bundle (管理員功能)
     * @param {Object} params - 更新參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.bundleId - Bundle ID（必填）
     * @param {Object} params.data - 更新資料
     * @returns {Promise} - API 回應
     */
    updateBundle({ brandId, bundleId, data }) {
      return apiClient.put(`/bundle/admin/brands/${brandId}/bundles/${bundleId}`, data);
    },

    /**
     * 刪除 Bundle (管理員功能)
     * @param {Object} params - 刪除參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.bundleId - Bundle ID（必填）
     * @returns {Promise} - API 回應
     */
    deleteBundle({ brandId, bundleId }) {
      return apiClient.delete(`/bundle/admin/brands/${brandId}/bundles/${bundleId}`);
    },

    // ========== 客戶端功能 ==========

    /**
     * 獲取可購買的 Bundle (客戶端)
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} [params.storeId] - 店鋪ID（可選，用於過濾適用店鋪）
     * @returns {Promise} - API 回應
     */
    getAvailableBundles({ brandId, storeId = null }) {
      if (storeId) {
        return apiClient.get(`/bundle/customer/brands/${brandId}/stores/${storeId}/bundles`);
      } else {
        return apiClient.get(`/bundle/customer/brands/${brandId}/bundles`);
      }
    },

    /**
     * 檢查用戶購買限制 (客戶端)
     * @param {Object} params - 檢查參數
     * @param {string} params.bundleId - Bundle ID（必填）
     * @param {number} [params.quantity=1] - 要購買的數量
     * @returns {Promise} - API 回應，包含是否可購買和剩餘限制
     */
    checkPurchaseLimit({ bundleId, quantity = 1 }) {
      return apiClient.get(`/bundle/customer/bundles/${bundleId}/purchase-limit`, {
        params: { quantity }
      });
    },

    /**
     * 驗證 Bundle 購買資格 (客戶端)
     * @param {Object} params - 驗證參數
     * @param {string} params.storeId - 店鋪ID（必填）
     * @param {string} params.bundleId - Bundle ID（必填）
     * @param {number} [params.quantity=1] - 購買數量
     * @returns {Promise} - API 回應
     */
    validateBundlePurchase({ storeId, bundleId, quantity = 1 }) {
      return apiClient.get(`/bundle/customer/stores/${storeId}/bundles/${bundleId}/validate`, {
        params: { quantity }
      });
    },

    // ========== 系統功能 ==========

    /**
     * 自動更新 Bundle 狀態 (系統任務)
     * 通常用於定時任務，更新過期的 Bundle 狀態
     * @returns {Promise} - API 回應
     */
    autoUpdateBundleStatus() {
      return apiClient.post('/bundle/system/bundles/auto-update-status');
    },

    // ========== 便利方法 ==========

    /**
     * 取得特定店鋪的可用 Bundle (便利方法)
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID（必填）
     * @returns {Promise} - API 回應
     */
    getBundlesForStore({ brandId, storeId }) {
      return this.getAvailableBundles({ brandId, storeId });
    },

    /**
     * 檢查並驗證 Bundle 購買 (組合方法)
     * 先檢查購買限制，再驗證購買資格
     * @param {Object} params - 驗證參數
     * @param {string} params.storeId - 店鋪ID（必填）
     * @param {string} params.bundleId - Bundle ID（必填）
     * @param {number} [params.quantity=1] - 購買數量
     * @returns {Promise} - 包含限制檢查和購買驗證的結果
     */
    async checkAndValidatePurchase({ storeId, bundleId, quantity = 1 }) {
      try {
        // 並行執行限制檢查和購買驗證
        const [limitResult, validationResult] = await Promise.all([
          this.checkPurchaseLimit({ bundleId, quantity }),
          this.validateBundlePurchase({ storeId, bundleId, quantity })
        ]);

        return {
          success: true,
          canPurchase: limitResult.canPurchase && validationResult.valid,
          limitCheck: limitResult,
          validation: validationResult,
          message: limitResult.canPurchase && validationResult.valid
            ? 'success'
            : '購買條件不符合'
        };
      } catch (error) {
        return {
          success: false,
          canPurchase: false,
          error: error.response?.data?.message || '檢查失敗',
          limitCheck: null,
          validation: null
        };
      }
    }
  };
}
