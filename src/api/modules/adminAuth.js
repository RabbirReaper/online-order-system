/**
 * 管理員認證 API 模組
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 管理員認證相關 API 方法
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
      return apiClient.post('/admin-auth/login', { name, password });
    },

    /**
     * 管理員登出
     * @returns {Promise} - API 回應
     */
    logout() {
      return apiClient.post('/admin-auth/logout');
    },

    /**
     * 修改管理員密碼
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
     * 檢查管理員登入狀態
     * @returns {Promise<Object>} - 登入狀態信息
     */
    async checkStatus() {
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
     * 獲取當前管理員的完整資料
     * @returns {Promise<Object>} - 管理員資料
     */
    async getProfile() {
      try {
        const res = await apiClient.get('/admin-auth/profile');
        return res;
      } catch (error) {
        throw error;
      }
    },

    /**
     * 更新當前管理員的基本資料
     * @param {Object} data - 更新資料
     * @param {string} data.name - 用戶名
     * @param {string} [data.phone] - 電話號碼
     * @returns {Promise<Object>} - 更新結果
     */
    async updateProfile(data) {
      try {
        const res = await apiClient.put('/admin-auth/profile', data);
        return res;
      } catch (error) {
        throw error;
      }
    }
  };
}
