/**
 * 點數規則管理 API 模組
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 點數規則相關 API 方法
 */
export default function (apiClient) {
  return {
    /**
     * 獲取所有點數規則
     * @param {string} brandId - 品牌ID
     * @returns {Promise} - API 回應
     */
    getAllPointRules(brandId) {
      return apiClient.get('/promotion/points/rules', { params: { brandId } });
    },

    /**
     * 獲取單個點數規則
     * @param {Object} params - 查詢參數
     * @param {string} params.id - 規則ID
     * @param {string} params.brandId - 品牌ID
     * @returns {Promise} - API 回應
     */
    getPointRuleById({ id, brandId }) {
      return apiClient.get(`/promotion/points/rules/${id}`, { params: { brandId } });
    },

    /**
     * 創建點數規則
     * @param {Object} ruleData - 規則資料
     * @param {string} ruleData.brand - 品牌ID
     * @param {string} ruleData.name - 規則名稱
     * @param {string} ruleData.type - 規則類型 ('purchase_amount', 'first_purchase', 'recurring_visit')
     * @param {number} ruleData.conversionRate - 轉換率
     * @param {number} [ruleData.minimumAmount] - 最低消費金額
     * @param {boolean} [ruleData.isActive] - 是否啟用
     * @param {string} [ruleData.description] - 規則描述
     * @returns {Promise} - API 回應
     */
    createPointRule(ruleData) {
      return apiClient.post('/promotion/points/rules', ruleData);
    },

    /**
     * 更新點數規則
     * @param {Object} params - 更新參數
     * @param {string} params.id - 規則ID
     * @param {Object} params.data - 更新資料
     * @param {string} [params.data.name] - 規則名稱
     * @param {string} [params.data.description] - 規則描述
     * @param {string} [params.data.type] - 規則類型
     * @param {number} [params.data.conversionRate] - 轉換率
     * @param {number} [params.data.minimumAmount] - 最低消費金額
     * @param {boolean} [params.data.isActive] - 是否啟用
     * @returns {Promise} - API 回應
     */
    updatePointRule({ id, data }) {
      return apiClient.put(`/promotion/points/rules/${id}`, data);
    },

    /**
     * 刪除點數規則
     * @param {Object} params - 刪除參數
     * @param {string} params.id - 規則ID
     * @param {string} params.brandId - 品牌ID
     * @returns {Promise} - API 回應
     */
    deletePointRule({ id, brandId }) {
      return apiClient.delete(`/promotion/points/rules/${id}`, { params: { brandId } });
    },

    /**
     * 切換點數規則啟用狀態
     * @param {Object} params - 參數
     * @param {string} params.id - 規則ID
     * @param {boolean} params.isActive - 是否啟用
     * @param {string} params.brandId - 品牌ID (如果當前用戶是 boss 角色時需要)
     * @returns {Promise} - API 回應
     */
    togglePointRuleActive({ id, isActive, brandId }) {
      const data = { isActive };
      if (brandId) data.brand = brandId;
      return apiClient.put(`/promotion/points/rules/${id}`, data);
    },

    /**
     * 獲取品牌的啟用點數規則
     * @param {string} brandId - 品牌ID
     * @returns {Promise} - API 回應
     */
    getActivePointRules(brandId) {
      return apiClient.get('/promotion/points/rules', {
        params: {
          brandId,
          activeOnly: true
        }
      });
    }
  };
}
