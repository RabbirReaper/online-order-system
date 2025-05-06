/**
 * 用戶管理 API 模組
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 用戶相關 API 方法
 */
export default function (apiClient) {
  return {
    /**
     * 用戶註冊
     * @param {Object} userData - 用戶資料
     * @returns {Promise} - API 回應
     */
    register(userData) {
      return apiClient.post('/user/register', userData);
    },

    /**
     * 用戶登入
     * @param {Object} credentials - 登入憑證
     * @param {string} credentials.email - 電子郵件
     * @param {string} credentials.password - 密碼
     * @returns {Promise} - API 回應
     */
    login(credentials) {
      return apiClient.post('/user/login', credentials);
    },

    /**
     * 用戶登出
     * @returns {Promise} - API 回應
     */
    logout() {
      return apiClient.post('/user/logout');
    },

    /**
     * 忘記密碼
     * @param {string} email - 用戶電子郵件
     * @returns {Promise} - API 回應
     */
    forgotPassword(email) {
      return apiClient.post('/user/forgot-password', { email });
    },

    /**
     * 重設密碼
     * @param {Object} params - 重設密碼參數
     * @param {string} params.token - 重設密碼令牌
     * @param {string} params.newPassword - 新密碼
     * @returns {Promise} - API 回應
     */
    resetPassword({ token, newPassword }) {
      return apiClient.post('/user/reset-password', { token, newPassword });
    },

    /**
     * 獲取用戶資料
     * @returns {Promise} - API 回應
     */
    getUserProfile() {
      return apiClient.get('/user/profile');
    },

    /**
     * 更新用戶資料
     * @param {Object} profileData - 更新的用戶資料
     * @returns {Promise} - API 回應
     */
    updateUserProfile(profileData) {
      return apiClient.put('/user/profile', profileData);
    },

    /**
     * 更改密碼
     * @param {Object} params - 密碼變更參數
     * @param {string} params.currentPassword - 當前密碼
     * @param {string} params.newPassword - 新密碼
     * @returns {Promise} - API 回應
     */
    changePassword({ currentPassword, newPassword }) {
      return apiClient.post('/user/profile/password', { currentPassword, newPassword });
    },

    /**
     * 添加地址
     * @param {Object} addressData - 地址資料
     * @returns {Promise} - API 回應
     */
    addAddress(addressData) {
      return apiClient.post('/user/profile/address', addressData);
    },

    /**
     * 更新地址
     * @param {Object} params - 更新參數
     * @param {string} params.addressId - 地址ID
     * @param {Object} params.data - 更新的地址資料
     * @returns {Promise} - API 回應
     */
    updateAddress({ addressId, data }) {
      return apiClient.put(`/user/profile/address/${addressId}`, data);
    },

    /**
     * 刪除地址
     * @param {string} addressId - 地址ID
     * @returns {Promise} - API 回應
     */
    deleteAddress(addressId) {
      return apiClient.delete(`/user/profile/address/${addressId}`);
    },

    // 後台管理功能 (需要管理員權限)
    /**
     * 獲取所有用戶 (管理員功能)
     * @param {Object} params - 查詢參數
     * @param {string} [params.search] - 搜尋關鍵字
     * @param {boolean} [params.activeOnly] - 是否只顯示啟用的用戶
     * @param {number} [params.page] - 頁碼 (默認 1)
     * @param {number} [params.limit] - 每頁數量 (默認 20)
     * @returns {Promise} - API 回應
     */
    getAllUsers(params = {}) {
      return apiClient.get('/user/all', { params });
    },

    /**
     * 獲取單個用戶詳情 (管理員功能)
     * @param {string} id - 用戶ID
     * @returns {Promise} - API 回應
     */
    getUserById(id) {
      return apiClient.get(`/user/${id}`);
    },

    /**
     * 切換用戶啟用狀態 (管理員功能)
     * @param {Object} params - 參數
     * @param {string} params.id - 用戶ID
     * @param {boolean} params.isActive - 是否啟用
     * @returns {Promise} - API 回應
     */
    toggleUserStatus({ id, isActive }) {
      return apiClient.put(`/user/${id}/status`, { isActive });
    }
  };
}
