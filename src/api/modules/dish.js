/**
 * 更新 src/api/modules/dish.js 文件
 * 添加選項類別和選項相關的 API 方法
 */
export default function (apiClient) {
  return {
    /**
     * 獲取所有餐點模板
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID
     * @param {string} [params.query] - 搜尋關鍵字
     * @param {string} [params.tags] - 標籤列表，逗號分隔
     * @returns {Promise} - API 回應
     */
    getAllDishTemplates(params = {}) {
      return apiClient.get('/dish/templates', { params });
    },

    /**
     * 獲取特定餐點模板詳情
     * @param {string} id - 模板ID
     * @param {string} brandId - 品牌ID
     * @returns {Promise} - API 回應
     */
    getDishTemplateById(id, brandId) {
      return apiClient.get(`/dish/templates/${id}`, { params: { brandId } });
    },

    /**
     * 創建新餐點模板
     * @param {Object} data - 模板資料
     * @param {string} data.brand - 品牌ID
     * @param {string} data.name - 名稱
     * @param {number} data.basePrice - 基本價格
     * @param {string} [data.imageData] - 圖片資料 (Base64)
     * @param {Object} [data.image] - 現有圖片資訊 (提供 imageData 時忽略)
     * @param {Array} [data.optionCategories] - 選項類別
     * @param {string} [data.description] - 描述
     * @param {Array} [data.tags] - 標籤
     * @returns {Promise} - API 回應
     */
    createDishTemplate(data) {
      return apiClient.post('/dish/templates', data);
    },

    /**
     * 更新餐點模板
     * @param {string} id - 模板ID
     * @param {Object} data - 更新資料
     * @param {string} data.brand - 品牌ID
     * @param {string} [data.imageData] - 新圖片資料 (Base64)
     * @returns {Promise} - API 回應
     */
    updateDishTemplate(id, data) {
      return apiClient.put(`/dish/templates/${id}`, data);
    },

    /**
     * 刪除餐點模板
     * @param {string} id - 模板ID
     * @param {string} brandId - 品牌ID
     * @returns {Promise} - API 回應
     */
    deleteDishTemplate(id, brandId) {
      return apiClient.delete(`/dish/templates/${id}`, { params: { brandId } });
    },

    /**
     * 獲取模板的選項類別
     * @param {string} id - 模板ID
     * @param {string} brandId - 品牌ID
     * @returns {Promise} - API 回應
     */
    getTemplateOptions(id, brandId) {
      return apiClient.get(`/dish/templates/${id}/options`, { params: { brandId } });
    },

    /**
     * 獲取所有選項類別
     * @param {string} brandId - 品牌ID
     * @returns {Promise} - API 回應
     */
    getAllOptionCategories(brandId) {
      return apiClient.get('/dish/option-categories', { params: { brandId } });
    },

    /**
     * 獲取特定選項類別
     * @param {string} id - 類別ID
     * @param {string} brandId - 品牌ID
     * @param {boolean} [includeOptions=false] - 是否包含選項
     * @returns {Promise} - API 回應
     */
    getOptionCategoryById(id, brandId, includeOptions = false) {
      return apiClient.get(`/dish/option-categories/${id}`, {
        params: { brandId, includeOptions }
      });
    },

    /**
     * 創建選項類別
     * @param {Object} data - 類別資料
     * @param {string} data.brand - 品牌ID
     * @param {string} data.name - 名稱
     * @param {string} data.inputType - 輸入類型（'single'或'multiple'）
     * @returns {Promise} - API 回應
     */
    createOptionCategory(data) {
      return apiClient.post('/dish/option-categories', data);
    },

    /**
     * 更新選項類別
     * @param {string} id - 類別ID
     * @param {Object} data - 更新資料
     * @param {string} data.brand - 品牌ID
     * @param {Array} [data.options] - 選項列表
     * @returns {Promise} - API 回應
     */
    updateOptionCategory(id, data) {
      return apiClient.put(`/dish/option-categories/${id}`, data);
    },

    /**
     * 刪除選項類別
     * @param {string} id - 類別ID
     * @param {string} brandId - 品牌ID
     * @returns {Promise} - API 回應
     */
    deleteOptionCategory(id, brandId) {
      return apiClient.delete(`/dish/option-categories/${id}`, { params: { brandId } });
    },

    /**
     * 獲取所有選項
     * @param {string} brandId - 品牌ID
     * @param {string} [categoryId] - 按類別篩選
     * @returns {Promise} - API 回應
     */
    getAllOptions(brandId, categoryId) {
      const params = { brandId };
      if (categoryId) params.categoryId = categoryId;
      return apiClient.get('/dish/options', { params });
    },

    /**
     * 獲取特定選項
     * @param {string} id - 選項ID
     * @param {string} brandId - 品牌ID
     * @returns {Promise} - API 回應
     */
    getOptionById(id, brandId) {
      return apiClient.get(`/dish/options/${id}`, { params: { brandId } });
    },

    /**
     * 創建新選項
     * @param {Object} data - 選項資料
     * @param {string} data.brand - 品牌ID
     * @param {string} data.name - 名稱
     * @param {number} [data.price=0] - 價格
     * @param {string} [data.refDishTemplate] - 關聯的餐點模板
     * @returns {Promise} - API 回應
     */
    createOption(data) {
      return apiClient.post('/dish/options', data);
    },

    /**
     * 更新選項
     * @param {string} id - 選項ID
     * @param {Object} data - 更新資料
     * @param {string} data.brand - 品牌ID
     * @param {string} [data.name] - 名稱
     * @param {number} [data.price] - 價格
     * @param {string} [data.refDishTemplate] - 關聯的餐點模板
     * @returns {Promise} - API 回應
     */
    updateOption(id, data) {
      return apiClient.put(`/dish/options/${id}`, data);
    },

    /**
     * 刪除選項
     * @param {string} id - 選項ID
     * @param {string} brandId - 品牌ID
     * @returns {Promise} - API 回應
     */
    deleteOption(id, brandId) {
      return apiClient.delete(`/dish/options/${id}`, { params: { brandId } });
    },

    /**
     * 獲取類別下的所有選項
     * @param {string} categoryId - 類別ID
     * @param {string} brandId - 品牌ID
     * @returns {Promise} - API 回應
     */
    getOptionsByCategory(categoryId, brandId) {
      return apiClient.get(`/dish/category/${categoryId}/options`, { params: { brandId } });
    }
  };
}
