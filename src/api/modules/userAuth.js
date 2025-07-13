/**
 * 用戶認證 API 模組
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 用戶認證相關 API 方法
 */
export default function (apiClient) {
  return {
    /**
     * 發送手機驗證碼
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.phone - 手機號碼
     * @param {string} [params.purpose='register'] - 用途：register, login, reset_password
     * @returns {Promise} - API 回應
     */
    sendVerificationCode({ brandId, phone, purpose = 'register' }) {
      return apiClient.post(`/user-auth/brands/${brandId}/send-verification`, { phone, purpose })
    },

    /**
     * 驗證手機驗證碼
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.phone - 手機號碼
     * @param {string} params.code - 驗證碼
     * @param {string} [params.purpose='register'] - 用途
     * @returns {Promise} - API 回應
     */
    verifyCode({ brandId, phone, code, purpose = 'register' }) {
      return apiClient.post(`/user-auth/brands/${brandId}/verify-code`, { phone, code, purpose })
    },

    /**
     * 用戶註冊
     * @param {Object} params - 註冊參數
     * @param {string} params.brandId - 品牌ID
     * @param {Object} params.userData - 用戶資料
     * @param {string} params.userData.name - 姓名
     * @param {string} params.userData.phone - 手機號碼
     * @param {string} [params.userData.email] - 電子郵件 (選填)
     * @param {string} params.userData.password - 密碼
     * @param {string} params.code - 手機驗證碼
     * @returns {Promise} - API 回應
     */
    register({ brandId, userData, code }) {
      return apiClient.post(`/user-auth/brands/${brandId}/register`, { ...userData, code })
    },

    /**
     * 用戶登入
     * @param {Object} params - 登入參數
     * @param {string} params.brandId - 品牌ID
     * @param {Object} params.credentials - 登入憑證
     * @param {string} params.credentials.phone - 手機號碼
     * @param {string} params.credentials.password - 密碼
     * @returns {Promise} - API 回應
     */
    login({ brandId, credentials }) {
      return apiClient.post(`/user-auth/brands/${brandId}/login`, credentials)
    },

    /**
     * 用戶登出
     * @param {string} brandId - 品牌ID
     * @returns {Promise} - API 回應
     */
    logout(brandId) {
      return apiClient.post(`/user-auth/brands/${brandId}/logout`)
    },

    /**
     * 忘記密碼
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.phone - 用戶手機號碼
     * @returns {Promise} - API 回應
     */
    forgotPassword({ brandId, phone }) {
      return apiClient.post(`/user-auth/brands/${brandId}/forgot-password`, { phone })
    },

    /**
     * 重設密碼
     * @param {Object} params - 重設密碼參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.phone - 手機號碼
     * @param {string} params.code - 驗證碼
     * @param {string} params.newPassword - 新密碼
     * @returns {Promise} - API 回應
     */
    resetPassword({ brandId, phone, code, newPassword }) {
      return apiClient.post(`/user-auth/brands/${brandId}/reset-password`, {
        phone,
        code,
        newPassword,
      })
    },

    /**
     * 更改密碼
     * @param {Object} params - 密碼變更參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.currentPassword - 當前密碼
     * @param {string} params.newPassword - 新密碼
     * @returns {Promise} - API 回應
     */
    changePassword({ brandId, currentPassword, newPassword }) {
      return apiClient.post(`/user-auth/brands/${brandId}/change-password`, {
        currentPassword,
        newPassword,
      })
    },

    /**
     * 檢查用戶登入狀態
     * @param {string} brandId - 品牌ID
     * @returns {Promise<Object>} - 登入狀態信息
     */
    async checkStatus(brandId) {
      try {
        const res = await apiClient.get(`/user-auth/brands/${brandId}/check-status`)
        return {
          loggedIn: res.loggedIn,
          role: res.role,
          brandId: res.brandId,
        }
      } catch (error) {
        return { loggedIn: false, role: null, brandId: null }
      }
    },
  }
}
