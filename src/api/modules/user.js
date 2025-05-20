/**
 * 用戶管理 API 模組
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 用戶相關 API 方法
 */
export default function (apiClient) {
  return {
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
