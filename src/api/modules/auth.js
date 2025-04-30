/**
 * 認證 API 模組
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 認證相關 API 方法
 */
export default function (apiClient) {
  return {
    /**
     * 管理員登入
     * @param {Object} params - 登入參數
     * @param {string} params.name - 管理員用戶名
     * @param {string} params.password - 密碼
     * @returns {Promise} - API 回應
     */
    login({ name, password }) {
      return apiClient.post('/auth/login', { name, password });
    },

    /**
     * 建立新管理員帳號（需要高級權限）
     * @param {Object} params - 管理員資料
     * @param {string} params.name - 用戶名
     * @param {string} params.password - 密碼
     * @param {string} params.role - 角色
     * @param {Array} params.manage - 管理權限
     * @returns {Promise} - API 回應
     */
    createAdmin(params) {
      return apiClient.post('/auth/admin', params);
    },

    /**
     * 登出
     * @returns {Promise} - API 回應
     */
    logout() {
      return apiClient.post('/auth/logout');
    },

    /**
     * 修改密碼
     * @param {Object} params - 密碼資料
     * @param {string} params.currentPassword - 當前密碼
     * @param {string} params.newPassword - 新密碼
     * @returns {Promise} - API 回應
     */
    changePassword({ currentPassword, newPassword }) {
      return apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
    },

    /**
     * 檢查登入狀態
     * @returns {Promise<Object>} - 登入狀態信息
     */
    async checkAdminStatus() {
      try {
        const res = await apiClient.get('/auth/check-admin-status');
        return {
          loggedIn: res.loggedIn,
          role: res.role,
          manage: res.manage || []
        };
      } catch (error) {
        return { loggedIn: false, role: null, manage: [] };
      }
    }
  };
}
