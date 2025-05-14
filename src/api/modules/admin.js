/**
 * 管理員管理 API 模組
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 管理員相關 API 方法
 */
export default function (apiClient) {
  return {
    /**
     * 獲取所有管理員（不帶brandId時）
     * @param {Object} params - 查詢參數
     * @param {string} [params.role] - 按角色篩選 ('boss', 'brand_admin', 'store_admin')
     * @param {string} [params.brandId] - 按品牌篩選（boss角色使用）
     * @param {number} [params.page] - 頁碼（默認 1）
     * @param {number} [params.limit] - 每頁數量（默認 20）
     * @returns {Promise} - API 回應
     */
    getAllAdmins(params = {}) {
      // 如果有 brandId，使用帶品牌的路徑
      if (params.brandId) {
        const { brandId, ...queryParams } = params;
        return apiClient.get(`/admin/brands/${brandId}`, { params: queryParams });
      }
      // 否則使用基本路徑（僅限boss）
      return apiClient.get('/admin', { params });
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
     * @param {string} [params.brandId] - 品牌ID（創建品牌管理員或店鋪管理員時需要）
     * @param {Object} params.data - 管理員資料
     * @param {string} params.data.name - 用戶名（必填）
     * @param {string} params.data.password - 密碼（必填）
     * @param {string} params.data.role - 角色（必填）：'boss', 'brand_admin', 'store_admin'
     * @param {Array} [params.data.manage] - 管理權限配置
     * @param {string} [params.data.manage[].store] - 店鋪ID
     * @param {Array} [params.data.manage[].permission] - 權限列表
     * @returns {Promise} - API 回應
     */
    createAdmin({ brandId, data }) {
      // 如果有 brandId，使用帶品牌的路徑
      if (brandId) {
        return apiClient.post(`/admin/brands/${brandId}`, data);
      }
      // 否則使用基本路徑（僅限boss創建boss）
      return apiClient.post('/admin', data);
    },

    /**
     * 更新管理員資料
     * @param {Object} params - 更新參數
     * @param {string} params.id - 管理員ID
     * @param {Object} params.data - 更新資料
     * @param {string} [params.data.role] - 角色
     * @param {string} [params.data.brand] - 品牌ID
     * @param {Array} [params.data.manage] - 管理權限配置
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
    },
  };
}
