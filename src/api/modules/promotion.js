/**
 * 促銷管理 API 模組
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 促銷相關 API 方法
 */
export default function (apiClient) {
  return {
    // 優惠券模板相關 (後台管理)
    /**
     * 獲取所有優惠券模板 (管理員功能)
     * @param {string} brandId - 品牌ID（必填）
     * @returns {Promise} - API 回應
     */
    getAllCouponTemplates(brandId) {
      return apiClient.get(`/promotion/brands/${brandId}/coupons/templates`);
    },

    /**
     * 獲取單個優惠券模板 (管理員功能)
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.id - 模板ID
     * @returns {Promise} - API 回應
     */
    getCouponTemplateById({ brandId, id }) {
      return apiClient.get(`/promotion/brands/${brandId}/coupons/templates/${id}`);
    },

    /**
     * 創建優惠券模板 (管理員功能)
     * @param {Object} params - 模板參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {Object} params.data - 模板資料
     * @returns {Promise} - API 回應
     */
    createCouponTemplate({ brandId, data }) {
      return apiClient.post(`/promotion/brands/${brandId}/coupons/templates`, data);
    },

    /**
     * 更新優惠券模板 (管理員功能)
     * @param {Object} params - 更新參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.id - 模板ID
     * @param {Object} params.data - 更新資料
     * @returns {Promise} - API 回應
     */
    updateCouponTemplate({ brandId, id, data }) {
      return apiClient.put(`/promotion/brands/${brandId}/coupons/templates/${id}`, data);
    },

    /**
     * 刪除優惠券模板 (管理員功能)
     * @param {Object} params - 刪除參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.id - 模板ID
     * @returns {Promise} - API 回應
     */
    deleteCouponTemplate({ brandId, id }) {
      return apiClient.delete(`/promotion/brands/${brandId}/coupons/templates/${id}`);
    },

    // 優惠券實例相關 (後台)
    /**
     * 獲取所有優惠券實例 (管理員功能)
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {number} [params.page] - 頁碼
     * @param {number} [params.limit] - 每頁數量
     * @returns {Promise} - API 回應
     */
    // getAllCouponInstances({ brandId, ...queryParams }) {
    //   return apiClient.get(`/promotion/brands/${brandId}/coupons/instances/admin`, { params: queryParams });
    // },

    /**
     * 發放優惠券給用戶 (管理員功能)
     * @param {Object} params - 發放參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {Object} params.data - 發放資料
     * @param {string} params.data.templateId - 模板ID
     * @param {string} params.data.userId - 用戶ID
     * @returns {Promise} - API 回應
     */
    // issueCouponToUser({ brandId, data }) {
    //   return apiClient.post(`/promotion/brands/${brandId}/coupons/instances/issue`, data);
    // },

    // 用戶優惠券相關
    /**
     * 獲取用戶優惠券
     * @param {string} brandId - 品牌ID（必填）
     * @returns {Promise} - API 回應
     */
    getUserCoupons(brandId) {
      return apiClient.get(`/promotion/brands/${brandId}/coupons`);
    },

    /**
     * 兌換優惠券
     * @param {Object} params - 兌換參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {Object} params.data - 兌換資料
     * @param {string} params.data.code - 兌換碼
     * @returns {Promise} - API 回應
     */
    redeemCoupon({ brandId, data }) {
      return apiClient.post(`/promotion/brands/${brandId}/coupons/redeem`, data);
    },

    // 點數規則相關
    /**
     * 獲取所有點數規則
     * @param {string} brandId - 品牌ID（必填）
     * @returns {Promise} - API 回應
     */
    getAllPointRules(brandId) {
      return apiClient.get(`/promotion/brands/${brandId}/points/rules`);
    },

    /**
     * 獲取單個點數規則
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.id - 規則ID
     * @returns {Promise} - API 回應
     */
    getPointRuleById({ brandId, id }) {
      return apiClient.get(`/promotion/brands/${brandId}/points/rules/${id}`);
    },

    /**
     * 創建點數規則
     * @param {Object} params - 規則參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {Object} params.data - 規則資料
     * @returns {Promise} - API 回應
     */
    createPointRule({ brandId, data }) {
      return apiClient.post(`/promotion/brands/${brandId}/points/rules`, data);
    },

    /**
     * 更新點數規則
     * @param {Object} params - 更新參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.id - 規則ID
     * @param {Object} params.data - 更新資料
     * @returns {Promise} - API 回應
     */
    updatePointRule({ brandId, id, data }) {
      return apiClient.put(`/promotion/brands/${brandId}/points/rules/${id}`, data);
    },

    /**
     * 刪除點數規則
     * @param {Object} params - 刪除參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.id - 規則ID
     * @returns {Promise} - API 回應
     */
    deletePointRule({ brandId, id }) {
      return apiClient.delete(`/promotion/brands/${brandId}/points/rules/${id}`);
    },

    // 點數相關（用戶）
    /**
     * 獲取用戶點數
     * @param {string} brandId - 品牌ID（必填）
     * @returns {Promise} - API 回應
     */
    getUserPoints(brandId) {
      return apiClient.get(`/promotion/brands/${brandId}/points`);
    },

    /**
     * 獲取用戶點數歷史
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {number} [params.page] - 頁碼
     * @param {number} [params.limit] - 每頁數量
     * @returns {Promise} - API 回應
     */
    getUserPointHistory({ brandId, ...queryParams }) {
      return apiClient.get(`/promotion/brands/${brandId}/points/history`, { params: queryParams });
    },

    // 點數管理（後台）
    /**
     * 給用戶添加點數 (管理員功能)
     * @param {Object} params - 添加參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {Object} params.data - 點數資料
     * @param {string} params.data.userId - 用戶ID
     * @param {number} params.data.points - 點數數量
     * @param {string} params.data.reason - 原因
     * @returns {Promise} - API 回應
     */
    addPointsToUser({ brandId, data }) {
      return apiClient.post(`/promotion/brands/${brandId}/points/add`, data);
    }
  };
}
