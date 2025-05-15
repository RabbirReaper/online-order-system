/**
 * 用戶管理 API 模組
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 用戶相關 API 方法
 */
export default function (apiClient) {
  return {
    /**
     * 用戶註冊
     * @param {Object} params - 註冊參數
     * @param {string} params.brandId - 品牌ID
     * @param {Object} params.userData - 用戶資料
     * @returns {Promise} - API 回應
     */
    register({ brandId, userData }) {
      return apiClient.post(`/user/brands/${brandId}/register`, userData);
    },

    /**
     * 用戶登入
     * @param {Object} params - 登入參數
     * @param {string} params.brandId - 品牌ID
     * @param {Object} params.credentials - 登入憑證
     * @param {string} params.credentials.email - 電子郵件
     * @param {string} params.credentials.password - 密碼
     * @returns {Promise} - API 回應
     */
    login({ brandId, credentials }) {
      return apiClient.post(`/user/brands/${brandId}/login`, credentials);
    },

    /**
     * 用戶登出
     * @param {string} brandId - 品牌ID
     * @returns {Promise} - API 回應
     */
    logout(brandId) {
      return apiClient.post(`/user/brands/${brandId}/logout`);
    },

    /**
     * 忘記密碼
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.email - 用戶電子郵件
     * @returns {Promise} - API 回應
     */
    forgotPassword({ brandId, email }) {
      return apiClient.post(`/user/brands/${brandId}/forgot-password`, { email });
    },

    /**
     * 重設密碼
     * @param {Object} params - 重設密碼參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.token - 重設密碼令牌
     * @param {string} params.newPassword - 新密碼
     * @returns {Promise} - API 回應
     */
    resetPassword({ brandId, token, newPassword }) {
      return apiClient.post(`/user/brands/${brandId}/reset-password`, { token, newPassword });
    },

    /**
     * 獲取用戶資料
     * @param {string} brandId - 品牌ID
     * @returns {Promise} - API 回應
     */
    getUserProfile(brandId) {
      return apiClient.get(`/user/brands/${brandId}/profile`);
    },

    /**
     * 更新用戶資料
     * @param {Object} params - 更新參數
     * @param {string} params.brandId - 品牌ID
     * @param {Object} params.profileData - 更新的用戶資料
     * @returns {Promise} - API 回應
     */
    updateUserProfile({ brandId, profileData }) {
      return apiClient.put(`/user/brands/${brandId}/profile`, profileData);
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
      return apiClient.post(`/user/brands/${brandId}/change-password`, { currentPassword, newPassword });
    },

    /**
     * 添加地址
     * @param {Object} params - 地址參數
     * @param {string} params.brandId - 品牌ID
     * @param {Object} params.addressData - 地址資料
     * @returns {Promise} - API 回應
     */
    addAddress({ brandId, addressData }) {
      return apiClient.post(`/user/brands/${brandId}/addresses`, addressData);
    },

    /**
     * 更新地址
     * @param {Object} params - 更新參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.addressId - 地址ID
     * @param {Object} params.data - 更新的地址資料
     * @returns {Promise} - API 回應
     */
    updateAddress({ brandId, addressId, data }) {
      return apiClient.put(`/user/brands/${brandId}/addresses/${addressId}`, data);
    },

    /**
     * 刪除地址
     * @param {Object} params - 刪除參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.addressId - 地址ID
     * @returns {Promise} - API 回應
     */
    deleteAddress({ brandId, addressId }) {
      return apiClient.delete(`/user/brands/${brandId}/addresses/${addressId}`);
    },

    // 後台管理功能 (需要管理員權限)
    /**
     * 獲取所有用戶 (管理員功能)
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} [params.search] - 搜尋關鍵字
     * @param {boolean} [params.activeOnly] - 是否只顯示啟用的用戶
     * @param {number} [params.page] - 頁碼 (默認 1)
     * @param {number} [params.limit] - 每頁數量 (默認 20)
     * @returns {Promise} - API 回應
     */
    getAllUsers({ brandId, ...queryParams }) {
      return apiClient.get(`/user/brands/${brandId}/users`, { params: queryParams });
    },

    /**
     * 獲取單個用戶詳情 (管理員功能)
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.id - 用戶ID
     * @returns {Promise} - API 回應
     */
    getUserById({ brandId, id }) {
      return apiClient.get(`/user/brands/${brandId}/users/${id}`);
    },

    /**
     * 切換用戶啟用狀態 (管理員功能)
     * @param {Object} params - 參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.id - 用戶ID
     * @param {boolean} params.isActive - 是否啟用
     * @returns {Promise} - API 回應
     */
    toggleUserStatus({ brandId, id, isActive }) {
      return apiClient.patch(`/user/brands/${brandId}/users/${id}/status`, { isActive });
    }
  };
}
