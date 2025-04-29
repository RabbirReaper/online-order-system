/**
 * 餐點模板服務
 * 處理餐點模板相關業務邏輯
 */

import DishTemplate from '../../models/Dish/DishTemplate.js';
import OptionCategory from '../../models/Dish/OptionCategory.js';
import { AppError } from '../../middlewares/error.js';

/**
 * 獲取所有餐點模板
 * @param {Object} options - 查詢選項
 * @param {String} options.query - 搜尋關鍵字 (名稱)
 * @param {Array} options.tags - 標籤列表
 * @param {Number} options.page - 頁碼
 * @param {Number} options.limit - 每頁數量
 * @returns {Promise<Object>} 餐點模板列表與分頁資訊
 */
export const getAllTemplates = async (options = {}) => {
  const { query = '', tags = [], page = 1, limit = 20 } = options;

  // 構建查詢條件
  const queryConditions = {};

  if (query) {
    queryConditions.name = { $regex: query, $options: 'i' };
  }

  if (tags && tags.length > 0) {
    queryConditions.tags = { $in: tags };
  }

  // 計算分頁
  const skip = (page - 1) * limit;

  // 查詢總數
  const total = await DishTemplate.countDocuments(queryConditions);

  // 查詢餐點模板
  const templates = await DishTemplate.find(queryConditions)
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);

  // 處理分頁信息
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    templates,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage,
      hasPrevPage
    }
  };
};

/**
 * 根據ID獲取餐點模板
 * @param {String} templateId - 模板ID
 * @returns {Promise<Object>} 餐點模板
 */
export const getTemplateById = async (templateId) => {
  const template = await DishTemplate.findById(templateId);

  if (!template) {
    throw new AppError('餐點模板不存在', 404);
  }

  return template;
};

/**
 * 創建餐點模板
 * @param {Object} templateData - 模板數據
 * @returns {Promise<Object>} 創建的餐點模板
 */
export const createTemplate = async (templateData) => {
  // 基本驗證
  if (!templateData.name || !templateData.basePrice) {
    throw new AppError('名稱和基本價格為必填欄位', 400);
  }

  // 驗證圖片欄位
  if (!templateData.image || !templateData.image.url || !templateData.image.key) {
    throw new AppError('圖片資訊不完整', 400);
  }

  // 檢查選項類別是否存在
  if (templateData.optionCategories && templateData.optionCategories.length > 0) {
    const categoryIds = templateData.optionCategories.map(oc => oc.categoryId);
    const categories = await OptionCategory.find({ _id: { $in: categoryIds } });

    if (categories.length !== categoryIds.length) {
      throw new AppError('部分選項類別不存在', 400);
    }
  }

  // 創建餐點模板
  const newTemplate = new DishTemplate(templateData);
  await newTemplate.save();

  return newTemplate;
};

/**
 * 更新餐點模板
 * @param {String} templateId - 模板ID
 * @param {Object} updateData - 更新數據
 * @returns {Promise<Object>} 更新後的餐點模板
 */
export const updateTemplate = async (templateId, updateData) => {
  // 檢查模板是否存在
  const template = await DishTemplate.findById(templateId);

  if (!template) {
    throw new AppError('餐點模板不存在', 404);
  }

  // 如果更新選項類別，檢查它們是否存在
  if (updateData.optionCategories && updateData.optionCategories.length > 0) {
    const categoryIds = updateData.optionCategories.map(oc => oc.categoryId);
    const categories = await OptionCategory.find({ _id: { $in: categoryIds } });

    if (categories.length !== categoryIds.length) {
      throw new AppError('部分選項類別不存在', 400);
    }
  }

  // 更新模板
  Object.keys(updateData).forEach(key => {
    template[key] = updateData[key];
  });

  await template.save();

  return template;
};

/**
 * 刪除餐點模板
 * @param {String} templateId - 模板ID
 * @returns {Promise<Object>} 刪除結果
 */
export const deleteTemplate = async (templateId) => {
  // 檢查模板是否存在
  const template = await DishTemplate.findById(templateId);

  if (!template) {
    throw new AppError('餐點模板不存在', 404);
  }

  // TODO: 檢查是否有關聯的菜單項目、餐點實例等，如果有則拒絕刪除

  await template.deleteOne();

  return { success: true, message: '餐點模板已刪除' };
};

/**
 * 獲取餐點模板的所有可用選項
 * @param {String} templateId - 模板ID
 * @returns {Promise<Array>} 選項類別及其選項列表
 */
export const getTemplateOptions = async (templateId) => {
  // 獲取模板
  const template = await DishTemplate.findById(templateId);

  if (!template) {
    throw new AppError('餐點模板不存在', 404);
  }

  if (!template.optionCategories || template.optionCategories.length === 0) {
    return [];
  }

  // 獲取模板關聯的所有選項類別
  const categoryIds = template.optionCategories.map(oc => oc.categoryId);
  const categories = await OptionCategory.find({ _id: { $in: categoryIds } }).populate('options.refOption');

  // 組織返回數據結構
  const result = [];

  for (const category of categories) {
    // 找到對應的排序
    const categoryConfig = template.optionCategories.find(
      oc => oc.categoryId.toString() === category._id.toString()
    );

    // 組織選項數據
    const options = category.options.map(o => ({
      option: o.refOption,
      order: o.order
    }));

    // 按排序順序排列選項
    options.sort((a, b) => a.order - b.order);

    result.push({
      category: {
        _id: category._id,
        name: category.name,
        inputType: category.inputType
      },
      order: categoryConfig ? categoryConfig.order : 0,
      options: options.map(o => o.option)
    });
  }

  // 按照模板中的類別順序排序
  result.sort((a, b) => a.order - b.order);

  return result;
};
