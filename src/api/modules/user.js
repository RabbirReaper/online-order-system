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
  };
}
