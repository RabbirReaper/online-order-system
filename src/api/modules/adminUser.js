/**
 * 管理員用戶管理 API 模組
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 管理員用戶管理相關 API 方法
 */
export default function (apiClient) {
  return {
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
      return apiClient.get(`/admin-user/brands/${brandId}/users`, { params: queryParams })
    },

    /**
     * 獲取指定日期範圍內新加入的用戶 (管理員功能)
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.startDate - 開始日期 (YYYY-MM-DD 格式)
     * @param {string} params.endDate - 結束日期 (YYYY-MM-DD 格式)
     * @param {number} [params.page] - 頁碼 (默認 1)
     * @param {number} [params.limit] - 每頁數量 (默認 20)
     * @returns {Promise} - API 回應
     */
    getNewUsersInRange({ brandId, startDate, endDate, ...queryParams }) {
      return apiClient.get(`/admin-user/brands/${brandId}/users/new-in-range`, {
        params: {
          startDate,
          endDate,
          ...queryParams,
        },
      })
    },

    /**
     * 獲取單個用戶詳情 (管理員功能)
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} params.id - 用戶ID
     * @returns {Promise} - API 回應
     */
    getUserById({ brandId, id }) {
      return apiClient.get(`/admin-user/brands/${brandId}/users/${id}`)
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
      return apiClient.patch(`/admin-user/brands/${brandId}/users/${id}/status`, { isActive })
    },
  }
}
