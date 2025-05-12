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

    // 優惠券實例相關 - 這些功能現在需要重新實作

    // 點數相關功能保持不變
    getAllPointRules(brandId) {
      return apiClient.get('/promotion/points/rules', { params: { brandId } });
    },

    getPointRuleById({ id, brandId }) {
      return apiClient.get(`/promotion/points/rules/${id}`, { params: { brandId } });
    },

    createPointRule(ruleData) {
      return apiClient.post('/promotion/points/rules', ruleData);
    },

    updatePointRule({ id, data }) {
      return apiClient.put(`/promotion/points/rules/${id}`, data);
    },

    deletePointRule({ id, brandId }) {
      return apiClient.delete(`/promotion/points/rules/${id}`, { params: { brandId } });
    },

    getUserPoints(brandId) {
      return apiClient.get('/promotion/points', { params: { brandId } });
    },

    getUserPointHistory(params) {
      return apiClient.get('/promotion/points/history', { params });
    },

    addPointsToUser(params) {
      return apiClient.post('/promotion/points/add', params);
    }
  };
}
