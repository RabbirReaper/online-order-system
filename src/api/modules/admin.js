/**
 * 管理員管理 API 模組
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 管理員相關 API 方法
 */
export default function (apiClient) {
  return {
    /**
     * 獲取所有管理員
     * @param {Object} params - 查詢參數
     * @param {string} [params.role] - 按角色篩選
     * @param {string} [params.brandId] - 按品牌篩選
     * @param {string} [params.storeId] - 按店鋪篩選
     * @param {number} [params.page] - 頁碼（默認 1）
     * @param {number} [params.limit] - 每頁數量（默認 20）
     * @returns {Promise} - API 回應
     */
    getAllAdmins(params = {}) {
      // 根據參數構建路徑
      if (params.brandId && params.storeId) {
        // 店鋪級別的管理員查詢
        const { brandId, storeId, ...queryParams } = params;
        return apiClient.get(`/admin/brands/${brandId}/stores/${storeId}`, { params: queryParams });
      } else if (params.brandId) {
        // 品牌級別的管理員查詢 - 只顯示品牌相關的管理員，不包括系統管理員
        const { brandId, ...queryParams } = params;
        return apiClient.get(`/admin/brands/${brandId}`, { params: queryParams });
      } else {
        // 系統級別的管理員查詢 - 顯示所有管理員
        return apiClient.get('/admin', { params });
      }
    },

    /**
     * 獲取特定管理員詳情
     * @param {string} id - 管理員ID
     * @returns {Promise} - API 回應
     */
    getAdminById(id) {
      return apiClient.get(`/admin/${id}`);
    },

    /**
     * 創建新管理員
     * @param {Object} params - 管理員參數
     * @param {string} [params.brandId] - 品牌ID（創建品牌級或店鋪級管理員時需要）
     * @param {string} [params.storeId] - 店鋪ID（創建店鋪級管理員時需要）
     * @param {Object} params.data - 管理員資料
     * @param {string} params.data.name - 用戶名（必填）
     * @param {string} params.data.password - 密碼（必填）
     * @param {string} params.data.role - 角色（必填）
     * @param {string} [params.data.brand] - 品牌ID
     * @param {string} [params.data.store] - 店鋪ID
     * @param {boolean} [params.data.isActive] - 是否啟用
     * @returns {Promise} - API 回應
     */
    createAdmin({ brandId, storeId, data }) {
      // 根據參數構建路徑
      if (brandId && storeId) {
        // 在店鋪級別創建管理員
        return apiClient.post(`/admin/brands/${brandId}/stores/${storeId}`, data);
      } else if (brandId) {
        // 在品牌級別創建管理員
        return apiClient.post(`/admin/brands/${brandId}`, data);
      } else {
        // 在系統級別創建管理員
        return apiClient.post('/admin', data);
      }
    },

    /**
     * 更新管理員資料
     * @param {Object} params - 更新參數
     * @param {string} params.id - 管理員ID
     * @param {Object} params.data - 更新資料
     * @param {string} [params.data.role] - 角色
     * @param {string} [params.data.brand] - 品牌ID
     * @param {string} [params.data.store] - 店鋪ID
     * @param {boolean} [params.data.isActive] - 是否啟用
     * @returns {Promise} - API 回應
     */
    updateAdmin({ id, data }) {
      return apiClient.put(`/admin/${id}`, data);
    },

    /**
     * 刪除管理員
     * @param {string} id - 管理員ID
     * @returns {Promise} - API 回應
     */
    deleteAdmin(id) {
      return apiClient.delete(`/admin/${id}`);
    },

    /**
     * 切換管理員啟用狀態
     * @param {Object} params - 參數
     * @param {string} params.id - 管理員ID
     * @param {boolean} params.isActive - 是否啟用
     * @returns {Promise} - API 回應
     */
    toggleAdminStatus({ id, isActive }) {
      return apiClient.patch(`/admin/${id}/status`, { isActive });
    }
  };
}
