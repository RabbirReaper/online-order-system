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
     * @param {string} brandId - 品牌ID
     * @returns {Promise} - API 回應
     */
    getAllCouponTemplates(brandId) {
      return apiClient.get('/promotion/coupons/templates', { params: { brandId } });
    },

    /**
     * 獲取單個優惠券模板 (管理員功能)
     * @param {Object} params - 查詢參數
     * @param {string} params.id - 模板ID
     * @param {string} params.brandId - 品牌ID
     * @returns {Promise} - API 回應
     */
    getCouponTemplateById({ id, brandId }) {
      return apiClient.get(`/promotion/coupons/templates/${id}`, { params: { brandId } });
    },

    /**
     * 創建優惠券模板 (管理員功能)
     * @param {Object} templateData - 模板資料
     * @returns {Promise} - API 回應
     */
    createCouponTemplate(templateData) {
      return apiClient.post('/promotion/coupons/templates', templateData);
    },

    /**
     * 更新優惠券模板 (管理員功能)
     * @param {Object} params - 更新參數
     * @param {string} params.id - 模板ID
     * @param {Object} params.data - 更新資料
     * @returns {Promise} - API 回應
     */
    updateCouponTemplate({ id, data }) {
      return apiClient.put(`/promotion/coupons/templates/${id}`, data);
    },

    /**
     * 刪除優惠券模板 (管理員功能)
     * @param {Object} params - 刪除參數
     * @param {string} params.id - 模板ID
     * @param {string} params.brandId - 品牌ID
     * @returns {Promise} - API 回應
     */
    deleteCouponTemplate({ id, brandId }) {
      return apiClient.delete(`/promotion/coupons/templates/${id}`, { params: { brandId } });
    },

    // 優惠券實例相關
    /**
     * 獲取所有優惠券實例 (管理員功能)
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} [params.userId] - 用戶ID
     * @param {string} [params.templateId] - 模板ID
     * @param {boolean} [params.isUsed] - 是否已使用
     * @param {boolean} [params.includeExpired] - 是否包含過期的
     * @param {number} [params.page] - 頁碼
     * @param {number} [params.limit] - 每頁數量
     * @returns {Promise} - API 回應
     */
    getAllCouponInstances(params) {
      return apiClient.get('/promotion/coupons/instances/admin', { params });
    },

    /**
     * 發放優惠券給用戶 (管理員功能)
     * @param {Object} params - 發放參數
     * @param {string} params.userId - 用戶ID
     * @param {string} params.templateId - 模板ID
     * @returns {Promise} - API 回應
     */
    issueCouponToUser({ userId, templateId }) {
      return apiClient.post('/promotion/coupons/instances/issue', { userId, templateId });
    },

    /**
     * 獲取用戶優惠券
     * @param {Object} params - 查詢參數
     * @param {boolean} [params.includeUsed] - 是否包含已使用的
     * @param {boolean} [params.includeExpired] - 是否包含過期的
     * @returns {Promise} - API 回應
     */
    getUserCoupons(params = {}) {
      return apiClient.get('/promotion/coupons', { params });
    },

    /**
     * 兌換優惠券
     * @param {string} templateId - 模板ID
     * @returns {Promise} - API 回應
     */
    redeemCoupon(templateId) {
      return apiClient.post('/promotion/coupons/redeem', { templateId });
    },

    /**
     * 獲取可用的優惠券模板 (用戶)
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} [params.storeId] - 店鋪ID
     * @returns {Promise} - API 回應
     */
    getAvailableCouponTemplates({ brandId, storeId }) {
      return apiClient.get('/promotion/coupons/available', {
        params: { brandId, storeId }
      });
    },

    // 點數規則相關 (後台管理)
    /**
     * 獲取所有點數規則 (管理員功能)
     * @param {string} brandId - 品牌ID
     * @returns {Promise} - API 回應
     */
    getAllPointRules(brandId) {
      return apiClient.get('/promotion/points/rules', { params: { brandId } });
    },

    /**
     * 獲取單個點數規則 (管理員功能)
     * @param {Object} params - 查詢參數
     * @param {string} params.id - 規則ID
     * @param {string} params.brandId - 品牌ID
     * @returns {Promise} - API 回應
     */
    getPointRuleById({ id, brandId }) {
      return apiClient.get(`/promotion/points/rules/${id}`, { params: { brandId } });
    },

    /**
     * 創建點數規則 (管理員功能)
     * @param {Object} ruleData - 規則資料
     * @returns {Promise} - API 回應
     */
    createPointRule(ruleData) {
      return apiClient.post('/promotion/points/rules', ruleData);
    },

    /**
     * 更新點數規則 (管理員功能)
     * @param {Object} params - 更新參數
     * @param {string} params.id - 規則ID
     * @param {Object} params.data - 更新資料
     * @returns {Promise} - API 回應
     */
    updatePointRule({ id, data }) {
      return apiClient.put(`/promotion/points/rules/${id}`, data);
    },

    /**
     * 刪除點數規則 (管理員功能)
     * @param {Object} params - 刪除參數
     * @param {string} params.id - 規則ID
     * @param {string} params.brandId - 品牌ID
     * @returns {Promise} - API 回應
     */
    deletePointRule({ id, brandId }) {
      return apiClient.delete(`/promotion/points/rules/${id}`, { params: { brandId } });
    },

    // 點數相關 (用戶)
    /**
     * 獲取用戶點數
     * @param {string} brandId - 品牌ID
     * @returns {Promise} - API 回應
     */
    getUserPoints(brandId) {
      return apiClient.get('/promotion/points', { params: { brandId } });
    },

    /**
     * 獲取用戶點數歷史
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID
     * @param {number} [params.page] - 頁碼
     * @param {number} [params.limit] - 每頁數量
     * @returns {Promise} - API 回應
     */
    getUserPointHistory(params) {
      return apiClient.get('/promotion/points/history', { params });
    },

    /**
     * 給用戶添加點數 (管理員功能)
     * @param {Object} params - 添加參數
     * @param {string} params.userId - 用戶ID
     * @param {string} params.brandId - 品牌ID
     * @param {number} params.amount - 點數數量
     * @param {string} params.source - 來源
     * @param {number} [params.validityDays] - 有效期天數
     * @returns {Promise} - API 回應
     */
    addPointsToUser(params) {
      return apiClient.post('/promotion/points/add', params);
    }
  };
}
