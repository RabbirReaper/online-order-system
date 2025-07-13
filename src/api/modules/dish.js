/**
 * 更新 src/api/modules/dish.js 文件
 * 添加選項類別和選項相關的 API 方法
 */
export default function (apiClient) {
  return {
    /**
     * 獲取所有餐點模板
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} [params.query] - 搜尋關鍵字
     * @param {string} [params.tags] - 標籤列表，逗號分隔
     * @returns {Promise} - API 回應
     */
    getAllDishTemplates({ brandId, ...queryParams }) {
      return apiClient.get(`/dish/brands/${brandId}/templates`, { params: queryParams })
    },

    /**
     * 獲取特定餐點模板詳情
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.id - 模板ID
     * @returns {Promise} - API 回應
     */
    getDishTemplateById({ brandId, id }) {
      return apiClient.get(`/dish/brands/${brandId}/templates/${id}`)
    },

    /**
     * 創建新餐點模板
     * @param {Object} params - 模板參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {Object} params.data - 模板資料
     * @param {string} params.data.name - 名稱
     * @param {number} params.data.basePrice - 基本價格
     * @param {string} [params.data.imageData] - 圖片資料 (Base64)
     * @param {Object} [params.data.image] - 現有圖片資訊 (提供 imageData 時忽略)
     * @param {Array} [params.data.optionCategories] - 選項類別
     * @param {string} [params.data.description] - 描述
     * @param {Array} [params.data.tags] - 標籤
     * @returns {Promise} - API 回應
     */
    createDishTemplate({ brandId, data }) {
      return apiClient.post(`/dish/brands/${brandId}/templates`, data)
    },

    /**
     * 更新餐點模板
     * @param {Object} params - 更新參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.id - 模板ID
     * @param {Object} params.data - 更新資料
     * @param {string} [params.data.imageData] - 新圖片資料 (Base64)
     * @returns {Promise} - API 回應
     */
    updateDishTemplate({ brandId, id, data }) {
      return apiClient.put(`/dish/brands/${brandId}/templates/${id}`, data)
    },

    /**
     * 刪除餐點模板
     * @param {Object} params - 刪除參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.id - 模板ID
     * @returns {Promise} - API 回應
     */
    deleteDishTemplate({ brandId, id }) {
      return apiClient.delete(`/dish/brands/${brandId}/templates/${id}`)
    },

    /**
     * 獲取模板的選項類別
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.id - 模板ID
     * @returns {Promise} - API 回應
     */
    getTemplateOptions({ brandId, id }) {
      return apiClient.get(`/dish/brands/${brandId}/templates/${id}/options`)
    },

    /**
     * 獲取所有選項類別
     * @param {string} brandId - 品牌ID（必填）
     * @returns {Promise} - API 回應
     */
    getAllOptionCategories(brandId) {
      return apiClient.get(`/dish/brands/${brandId}/option-categories`)
    },

    /**
     * 獲取特定選項類別
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.id - 類別ID
     * @param {boolean} [params.includeOptions=false] - 是否包含選項
     * @returns {Promise} - API 回應
     */
    getOptionCategoryById({ brandId, id, includeOptions = false }) {
      return apiClient.get(`/dish/brands/${brandId}/option-categories/${id}`, {
        params: { includeOptions },
      })
    },

    /**
     * 創建選項類別
     * @param {Object} params - 類別參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {Object} params.data - 類別資料
     * @param {string} params.data.name - 名稱
     * @param {string} params.data.inputType - 輸入類型（'single'或'multiple'）
     * @returns {Promise} - API 回應
     */
    createOptionCategory({ brandId, data }) {
      return apiClient.post(`/dish/brands/${brandId}/option-categories`, data)
    },

    /**
     * 更新選項類別
     * @param {Object} params - 更新參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.id - 類別ID
     * @param {Object} params.data - 更新資料
     * @param {Array} [params.data.options] - 選項列表
     * @returns {Promise} - API 回應
     */
    updateOptionCategory({ brandId, id, data }) {
      return apiClient.put(`/dish/brands/${brandId}/option-categories/${id}`, data)
    },

    /**
     * 刪除選項類別
     * @param {Object} params - 刪除參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.id - 類別ID
     * @returns {Promise} - API 回應
     */
    deleteOptionCategory({ brandId, id }) {
      return apiClient.delete(`/dish/brands/${brandId}/option-categories/${id}`)
    },

    /**
     * 獲取所有選項
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} [params.categoryId] - 按類別篩選
     * @param {Array} [params.tags] - 按標籤篩選
     * @returns {Promise} - API 回應
     */
    getAllOptions({ brandId, ...queryParams }) {
      return apiClient.get(`/dish/brands/${brandId}/options`, { params: queryParams })
    },

    /**
     * 獲取特定選項
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.id - 選項ID
     * @returns {Promise} - API 回應
     */
    getOptionById({ brandId, id }) {
      return apiClient.get(`/dish/brands/${brandId}/options/${id}`)
    },

    /**
     * 創建新選項
     * @param {Object} params - 選項參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {Object} params.data - 選項資料
     * @param {string} params.data.name - 名稱
     * @param {number} [params.data.price=0] - 價格
     * @param {string} [params.data.refDishTemplate] - 關聯的餐點模板
     * @param {Array} [params.data.tags] - 標籤
     * @returns {Promise} - API 回應
     */
    createOption({ brandId, data }) {
      return apiClient.post(`/dish/brands/${brandId}/options`, data)
    },

    /**
     * 更新選項
     * @param {Object} params - 更新參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.id - 選項ID
     * @param {Object} params.data - 更新資料
     * @param {string} [params.data.name] - 名稱
     * @param {number} [params.data.price] - 價格
     * @param {string} [params.data.refDishTemplate] - 關聯的餐點模板
     * @param {Array} [params.data.tags] - 標籤
     * @returns {Promise} - API 回應
     */
    updateOption({ brandId, id, data }) {
      return apiClient.put(`/dish/brands/${brandId}/options/${id}`, data)
    },

    /**
     * 刪除選項
     * @param {Object} params - 刪除參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.id - 選項ID
     * @returns {Promise} - API 回應
     */
    deleteOption({ brandId, id }) {
      return apiClient.delete(`/dish/brands/${brandId}/options/${id}`)
    },

    /**
     * 獲取類別下的所有選項
     * @param {Object} params - 查詢參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.categoryId - 類別ID
     * @returns {Promise} - API 回應
     */
    getOptionsByCategory({ brandId, categoryId }) {
      return apiClient.get(`/dish/brands/${brandId}/category/${categoryId}/options`)
    },
  }
}
