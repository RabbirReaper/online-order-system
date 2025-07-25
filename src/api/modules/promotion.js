/**
 * 促銷管理 API 模組
 * 對應後端 server/routes/promotion.js
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 促銷相關 API 方法
 */
export default function (apiClient) {
  return {
    // =============================================================================
    // 優惠券模板相關 API（後台管理）- Coupon 系統
    // =============================================================================

    /**
     * 獲取所有優惠券模板
     * @param {string} brandId - 品牌ID
     * @returns {Promise} - API 回應
     */
    getAllCouponTemplates(brandId) {
      return apiClient.get(`/promotion/brands/${brandId}/coupons/templates`)
    },

    /**
     * 獲取單個優惠券模板
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.id - 模板ID
     * @returns {Promise} - API 回應
     */
    getCouponTemplateById({ brandId, id }) {
      return apiClient.get(`/promotion/brands/${brandId}/coupons/templates/${id}`)
    },

    /**
     * 創建優惠券模板
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID
     * @param {Object} params.data - 模板數據
     * @param {string} params.data.name - 優惠券名稱
     * @param {string} [params.data.description] - 優惠券描述
     * @param {Object} params.data.discountInfo - 折扣資訊
     * @param {string} params.data.discountInfo.discountType - 折扣類型 ('percentage' | 'fixed')
     * @param {number} params.data.discountInfo.discountValue - 折扣值
     * @param {number} [params.data.discountInfo.maxDiscountAmount] - 最大折扣金額（百分比折扣時）
     * @param {number} [params.data.discountInfo.minPurchaseAmount] - 最低消費金額
     * @param {number} params.data.validityPeriod - 有效期（天數）
     * @param {boolean} [params.data.isActive] - 是否啟用
     * @returns {Promise} - API 回應
     */
    createCouponTemplate({ brandId, data }) {
      return apiClient.post(`/promotion/brands/${brandId}/coupons/templates`, data)
    },

    /**
     * 更新優惠券模板
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.id - 模板ID
     * @param {Object} params.data - 更新數據
     * @returns {Promise} - API 回應
     */
    updateCouponTemplate({ brandId, id, data }) {
      return apiClient.put(`/promotion/brands/${brandId}/coupons/templates/${id}`, data)
    },

    /**
     * 刪除優惠券模板
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.id - 模板ID
     * @returns {Promise} - API 回應
     */
    deleteCouponTemplate({ brandId, id }) {
      return apiClient.delete(`/promotion/brands/${brandId}/coupons/templates/${id}`)
    },

    // =============================================================================
    // 優惠券實例相關 API（後台管理）- Coupon 系統
    // =============================================================================

    /**
     * 發放優惠券給用戶
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID
     * @param {Object} params.data - 發放數據
     * @param {string} params.data.userId - 用戶ID
     * @param {string} params.data.templateId - 模板ID
     * @param {string} [params.data.reason] - 發放原因
     * @returns {Promise} - API 回應
     */
    issueCouponToUser({ brandId, data }) {
      return apiClient.post(`/promotion/brands/${brandId}/coupons/instances/issue`, data)
    },

    // =============================================================================
    // 優惠券用戶相關 API - Coupon 系統
    // =============================================================================

    /**
     * 獲取用戶優惠券
     * @param {string} brandId - 品牌ID
     * @param {Object} params - 查詢參數
     * @param {boolean} [params.includeUsed=false] - 是否包含已使用的優惠券
     * @param {boolean} [params.includeExpired=false] - 是否包含已過期的優惠券
     * @returns {Promise} - API 回應
     */
    getUserCoupons(brandId, params = {}) {
      return apiClient.get(`/promotion/brands/${brandId}/coupons`, { params })
    },

    /**
     * 使用優惠券
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID
     * @param {Object} params.data - 使用數據
     * @param {string} params.data.couponId - 優惠券ID
     * @param {string} [params.data.orderId] - 訂單ID
     * @returns {Promise} - API 回應
     */
    useCoupon({ brandId, data }) {
      return apiClient.post(`/promotion/brands/${brandId}/coupons/use`, data)
    },

    /**
     * 驗證優惠券
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.couponId - 優惠券ID
     * @returns {Promise} - API 回應
     */
    validateCoupon({ brandId, couponId }) {
      return apiClient.get(`/promotion/brands/${brandId}/coupons/${couponId}/validate`)
    },

    // =============================================================================
    // 兌換券模板相關 API（後台管理）- Voucher 系統
    // =============================================================================

    /**
     * 獲取所有兌換券模板
     * @param {string} brandId - 品牌ID
     * @returns {Promise} - API 回應
     */
    getAllVoucherTemplates(brandId) {
      return apiClient.get(`/promotion/brands/${brandId}/vouchers/templates`)
    },

    /**
     * 獲取單個兌換券模板
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.id - 模板ID
     * @returns {Promise} - API 回應
     */
    getVoucherTemplateById({ brandId, id }) {
      return apiClient.get(`/promotion/brands/${brandId}/vouchers/templates/${id}`)
    },

    /**
     * 創建兌換券模板
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID
     * @param {Object} params.data - 模板數據
     * @returns {Promise} - API 回應
     */
    createVoucherTemplate({ brandId, data }) {
      return apiClient.post(`/promotion/brands/${brandId}/vouchers/templates`, data)
    },

    /**
     * 更新兌換券模板
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.id - 模板ID
     * @param {Object} params.data - 更新數據
     * @returns {Promise} - API 回應
     */
    updateVoucherTemplate({ brandId, id, data }) {
      return apiClient.put(`/promotion/brands/${brandId}/vouchers/templates/${id}`, data)
    },

    /**
     * 刪除兌換券模板
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.id - 模板ID
     * @returns {Promise} - API 回應
     */
    deleteVoucherTemplate({ brandId, id }) {
      return apiClient.delete(`/promotion/brands/${brandId}/vouchers/templates/${id}`)
    },

    /**
     * 獲取可用的兌換券模板（供 Bundle 創建時使用）
     * @param {string} brandId - 品牌ID
     * @returns {Promise} - API 回應
     */
    getAvailableVoucherTemplates(brandId) {
      return apiClient.get(`/promotion/brands/${brandId}/vouchers/templates/available`)
    },

    /**
     * 自動為餐點創建兌換券模板
     * @param {string} brandId - 品牌ID
     * @returns {Promise} - API 回應
     */
    autoCreateVoucherTemplatesForDishes(brandId) {
      return apiClient.post(`/promotion/brands/${brandId}/vouchers/templates/auto-create`)
    },

    /**
     * 根據模板ID獲取兌換券統計（管理員功能）
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.templateId - 兌換券模板ID
     * @returns {Promise} - API 回應
     */
    getVoucherInstanceStatsByTemplate({ brandId, templateId }) {
      return apiClient.get(
        `/promotion/brands/${brandId}/vouchers/templates/${templateId}/instances`,
      )
    },

    // =============================================================================
    // 兌換券用戶相關 API - Voucher 系統
    // =============================================================================

    /**
     * 獲取用戶兌換券
     * @param {string} brandId - 品牌ID
     * @param {Object} params - 查詢參數
     * @returns {Promise} - API 回應
     */
    getUserVouchers(brandId, params = {}) {
      return apiClient.get(`/promotion/brands/${brandId}/vouchers`, { params })
    },

    /**
     * 使用兌換券
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID
     * @param {Object} params.data - 使用數據
     * @returns {Promise} - API 回應
     */
    useVoucher({ brandId, data }) {
      return apiClient.post(`/promotion/brands/${brandId}/vouchers/use`, data)
    },

    /**
     * 驗證兌換券
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.voucherId - 兌換券ID
     * @returns {Promise} - API 回應
     */
    validateVoucher({ brandId, voucherId }) {
      return apiClient.get(`/promotion/brands/${brandId}/vouchers/${voucherId}/validate`)
    },

    // =============================================================================
    // 點數規則相關 API（後台管理）
    // =============================================================================

    /**
     * 獲取所有點數規則
     * @param {string} brandId - 品牌ID
     * @returns {Promise} - API 回應
     */
    getAllPointRules(brandId) {
      return apiClient.get(`/promotion/brands/${brandId}/points/rules`)
    },

    /**
     * 獲取單個點數規則
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.id - 規則ID
     * @returns {Promise} - API 回應
     */
    getPointRuleById({ brandId, id }) {
      return apiClient.get(`/promotion/brands/${brandId}/points/rules/${id}`)
    },

    /**
     * 創建點數規則
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID
     * @param {Object} params.data - 規則數據
     * @returns {Promise} - API 回應
     */
    createPointRule({ brandId, data }) {
      return apiClient.post(`/promotion/brands/${brandId}/points/rules`, data)
    },

    /**
     * 更新點數規則
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.id - 規則ID
     * @param {Object} params.data - 更新數據
     * @returns {Promise} - API 回應
     */
    updatePointRule({ brandId, id, data }) {
      return apiClient.put(`/promotion/brands/${brandId}/points/rules/${id}`, data)
    },

    /**
     * 刪除點數規則
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.id - 規則ID
     * @returns {Promise} - API 回應
     */
    deletePointRule({ brandId, id }) {
      return apiClient.delete(`/promotion/brands/${brandId}/points/rules/${id}`)
    },

    // =============================================================================
    // 點數用戶相關 API
    // =============================================================================

    /**
     * 獲取用戶點數餘額
     * @param {string} brandId - 品牌ID
     * @returns {Promise} - API 回應
     */
    getUserPointsBalance(brandId) {
      return apiClient.get(`/promotion/brands/${brandId}/points/balance`)
    },

    /**
     * 獲取用戶點數歷史
     * @param {string} brandId - 品牌ID
     * @param {Object} params - 查詢參數
     * @returns {Promise} - API 回應
     */
    getUserPointHistory(brandId, params = {}) {
      return apiClient.get(`/promotion/brands/${brandId}/points/history`, { params })
    },
  }
}
