/**
 * 餐點模板服務
 * 處理餐點模板相關業務邏輯
 */

import DishTemplate from '../../models/Dish/DishTemplate.js';
import OptionCategory from '../../models/Dish/OptionCategory.js';
import { AppError } from '../../middlewares/error.js';

/**
 * 獲取所有餐點模板（按品牌過濾）
 * @param {String} brandId - 品牌ID
 * @param {Object} options - 查詢選項
 * @param {String} options.query - 搜尋關鍵字 (名稱)
 * @param {Array} options.tags - 標籤列表
 * @returns {Promise<Array>} 餐點模板列表
 */
export const getAllTemplates = async (brandId, options = {}) => {
  const { query = '', tags = [] } = options;

  // 構建查詢條件
  const queryConditions = { brand: brandId };

  if (query) {
    queryConditions.name = { $regex: query, $options: 'i' };
  }

  if (tags && tags.length > 0) {
    queryConditions.tags = { $in: tags };
  }

  // 查詢餐點模板 - 移除分頁，直接返回所有結果
  const templates = await DishTemplate.find(queryConditions)
    .sort({ name: 1 });

  return templates;
};

/**
 * 根據ID獲取餐點模板（驗證品牌）
 * @param {String} templateId - 模板ID
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 餐點模板
 */
export const getTemplateById = async (templateId, brandId) => {
  const template = await DishTemplate.findOne({
    _id: templateId,
    brand: brandId
  });

  if (!template) {
    throw new AppError('餐點模板不存在或無權訪問', 404);
  }

  return template;
};

/**
 * 創建餐點模板
 * @param {Object} templateData - 模板數據
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 創建的餐點模板
 */
export const createTemplate = async (templateData, brandId) => {
  // 基本驗證
  if (!templateData.name || !templateData.basePrice) {
    throw new AppError('名稱和基本價格為必填欄位', 400);
  }

  // 驗證圖片欄位
  if (!templateData.image || !templateData.image.url || !templateData.image.key) {
    throw new AppError('圖片資訊不完整', 400);
  }

  // 檢查選項類別是否存在且屬於同一品牌
  if (templateData.optionCategories && templateData.optionCategories.length > 0) {
    const categoryIds = templateData.optionCategories.map(oc => oc.categoryId);
    const categories = await OptionCategory.find({
      _id: { $in: categoryIds },
      brand: brandId
    });

    if (categories.length !== categoryIds.length) {
      throw new AppError('部分選項類別不存在或不屬於此品牌', 400);
    }
  }

  // 確保設置品牌ID
  templateData.brand = brandId;

  // 創建餐點模板
  const newTemplate = new DishTemplate(templateData);
  await newTemplate.save();

  return newTemplate;
};

/**
 * 更新餐點模板
 * @param {String} templateId - 模板ID
 * @param {Object} updateData - 更新數據
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 更新後的餐點模板
 */
export const updateTemplate = async (templateId, updateData, brandId) => {
  // 檢查模板是否存在且屬於該品牌
  const template = await DishTemplate.findOne({
    _id: templateId,
    brand: brandId
  });

  if (!template) {
    throw new AppError('餐點模板不存在或無權訪問', 404);
  }

  // 如果更新選項類別，檢查它們是否存在且屬於同一品牌
  if (updateData.optionCategories && updateData.optionCategories.length > 0) {
    const categoryIds = updateData.optionCategories.map(oc => oc.categoryId);
    const categories = await OptionCategory.find({
      _id: { $in: categoryIds },
      brand: brandId
    });

    if (categories.length !== categoryIds.length) {
      throw new AppError('部分選項類別不存在或不屬於此品牌', 400);
    }
  }

  // 防止更改品牌
  delete updateData.brand;

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
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 刪除結果
 */
export const deleteTemplate = async (templateId, brandId) => {
  // 檢查模板是否存在且屬於該品牌
  const template = await DishTemplate.findOne({
    _id: templateId,
    brand: brandId
  });

  if (!template) {
    throw new AppError('餐點模板不存在或無權訪問', 404);
  }

  // TODO: 檢查是否有關聯的菜單項目、餐點實例等，如果有則拒絕刪除

  await template.deleteOne();

  return { success: true, message: '餐點模板已刪除' };
};

/**
 * 獲取餐點模板的所有可用選項
 * @param {String} templateId - 模板ID
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Array>} 選項類別及其選項列表
 */
export const getTemplateOptions = async (templateId, brandId) => {
  // 獲取模板
  const template = await DishTemplate.findOne({
    _id: templateId,
    brand: brandId
  });

  if (!template) {
    throw new AppError('餐點模板不存在或無權訪問', 404);
  }

  if (!template.optionCategories || template.optionCategories.length === 0) {
    return [];
  }

  // 獲取模板關聯的所有選項類別
  const categoryIds = template.optionCategories.map(oc => oc.categoryId);
  const categories = await OptionCategory.find({
    _id: { $in: categoryIds },
    brand: brandId
  }).populate('options.refOption');

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
