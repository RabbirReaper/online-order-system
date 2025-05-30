/**
 * 通用認證 API 模組（向後兼容）
 * 注意：此模組主要用於向後兼容，新的認證功能請使用 adminAuth 或 userAuth 模組
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 認證相關 API 方法
 */
export default function (apiClient) {
  return {
    /**
     * 管理員登入（向後兼容，建議使用 adminAuth.login）
     * @param {Object} params - 登入參數
     * @param {string} params.name - 管理員用戶名
     * @param {string} params.password - 密碼
     * @returns {Promise} - API 回應
     */
    login({ name, password }) {
      return apiClient.post('/admin-auth/login', { name, password });
    },

    /**
     * 登出（向後兼容，建議使用 adminAuth.logout）
     * @returns {Promise} - API 回應
     */
    logout() {
      return apiClient.post('/admin-auth/logout');
    },

    /**
     * 修改密碼（向後兼容，建議使用 adminAuth.changePassword）
     * @param {Object} params - 密碼資料
     * @param {string} params.currentPassword - 當前密碼
     * @param {string} params.newPassword - 新密碼
     * @returns {Promise} - API 回應
     */
    changePassword({ currentPassword, newPassword }) {
      return apiClient.post('/admin-auth/change-password', {
        currentPassword,
        newPassword
      });
    },

    /**
     * 檢查管理員登入狀態（向後兼容，建議使用 adminAuth.checkStatus）
     * @returns {Promise<Object>} - 登入狀態信息
     */
    async checkAdminStatus() {
      try {
        const res = await apiClient.get('/admin-auth/check-status');
        return {
          loggedIn: res.loggedIn,
          role: res.role,
          brand: res.brand,
          store: res.store
        };
      } catch (error) {
        return {
          loggedIn: false,
          role: null,
          brand: null,
          store: null
        };
      }
    },

    /**
     * 檢查顧客登入狀態
     * @param {string} brandId - 品牌ID
     * @returns {Promise<Object>} - 登入狀態信息
     */
    async checkUserStatus(brandId) {
      try {
        const res = await apiClient.get(`/user-auth/brands/${brandId}/check-status`);
        return {
          loggedIn: res.loggedIn,
          role: res.role,
          brandId: res.brandId
        };
      } catch (error) {
        return { loggedIn: false, role: null, brandId: null };
      }
    }
  };
}
