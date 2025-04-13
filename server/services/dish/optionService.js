/**
 * 選項服務
 * 處理餐點選項相關業務邏輯
 */

import Option from '../../models/Dish/Option.js';
import OptionCategory from '../../models/Dish/OptionCategory.js';
import DishTemplate from '../../models/Dish/DishTemplate.js';
import { AppError } from '../../middlewares/error.js';

/**
 * 獲取所有選項
 * @param {Object} options - 查詢選項
 * @param {String} options.categoryId - 按類別篩選
 * @param {Number} options.page - 頁碼
 * @param {Number} options.limit - 每頁數量
 * @returns {Promise<Object>} 選項列表與分頁資訊
 */
export const getAllOptions = async (options = {}) => {
  const { categoryId, page = 1, limit = 50 } = options;

  // 構建查詢條件
  const queryConditions = {};

  // 過濾條件
  if (categoryId) {
    // 查找類別下的所有選項引用
    const category = await OptionCategory.findById(categoryId);
    if (category && category.options) {
      const optionIds = category.options.map(o => o.refOption);
      queryConditions._id = { $in: optionIds };
    } else {
      // 如果類別不存在或沒有選項，返回空結果
      return {
        options: [],
        pagination: {
          total: 0,
          totalPages: 0,
          currentPage: page,
          limit,
          hasNextPage: false,
          hasPrevPage: false
        }
      };
    }
  }

  // 計算分頁
  const skip = (page - 1) * limit;

  // 查詢總數
  const total = await Option.countDocuments(queryConditions);

  // 查詢選項
  const options = await Option.find(queryConditions)
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit)
    .populate('refDishTemplate', 'name');

  // 處理分頁信息
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    options,
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
 * 根據類別ID獲取選項
 * @param {String} categoryId - 類別ID
 * @returns {Promise<Array>} 選項列表
 */
export const getOptionsByCategoryId = async (categoryId) => {
  // 查找類別
  const category = await OptionCategory.findById(categoryId);

  if (!category) {
    throw new AppError('選項類別不存在', 404);
  }

  if (!category.options || category.options.length === 0) {
    return [];
  }

  // 獲取類別中的選項ID
  const optionIds = category.options.map(o => o.refOption);

  // 查詢選項
  const options = await Option.find({ _id: { $in: optionIds } })
    .populate('refDishTemplate', 'name');

  // 添加排序信息
  const optionsWithOrder = options.map(option => {
    const optionConfig = category.options.find(
      o => o.refOption.toString() === option._id.toString()
    );

    return {
      ...option.toObject(),
      order: optionConfig ? optionConfig.order : 0
    };
  });

  // 按照類別中的順序排序
  optionsWithOrder.sort((a, b) => a.order - b.order);

  return optionsWithOrder;
};

/**
 * 根據ID獲取選項
 * @param {String} optionId - 選項ID
 * @returns {Promise<Object>} 選項
 */
export const getOptionById = async (optionId) => {
  const option = await Option.findById(optionId)
    .populate('refDishTemplate', 'name');

  if (!option) {
    throw new AppError('選項不存在', 404);
  }

  return option;
};

/**
 * 創建選項
 * @param {Object} optionData - 選項數據
 * @returns {Promise<Object>} 創建的選項
 */
export const createOption = async (optionData) => {
  // 基本驗證
  if (!optionData.name) {
    throw new AppError('選項名稱為必填欄位', 400);
  }

  // 檢查關聯的餐點模板是否存在
  if (optionData.refDishTemplate) {
    const template = await DishTemplate.findById(optionData.refDishTemplate);

    if (!template) {
      throw new AppError('關聯的餐點模板不存在', 404);
    }
  }

  // 創建選項
  const newOption = new Option(optionData);
  await newOption.save();

  return newOption;
};

/**
 * 更新選項
 * @param {String} optionId - 選項ID
 * @param {Object} updateData - 更新數據
 * @returns {Promise<Object>} 更新後的選項
 */
export const updateOption = async (optionId, updateData) => {
  // 檢查選項是否存在
  const option = await Option.findById(optionId);

  if (!option) {
    throw new AppError('選項不存在', 404);
  }

  // 檢查關聯的餐點模板是否存在
  if (updateData.refDishTemplate) {
    const template = await DishTemplate.findById(updateData.refDishTemplate);

    if (!template) {
      throw new AppError('關聯的餐點模板不存在', 404);
    }
  }

  // 更新選項
  Object.keys(updateData).forEach(key => {
    option[key] = updateData[key];
  });

  await option.save();

  return option;
};

/**
 * 刪除選項
 * @param {String} optionId - 選項ID
 * @returns {Promise<Object>} 刪除結果
 */
export const deleteOption = async (optionId) => {
  // 檢查選項是否存在
  const option = await Option.findById(optionId);

  if (!option) {
    throw new AppError('選項不存在', 404);
  }

  // 檢查是否有類別引用了此選項
  const categories = await OptionCategory.find({
    'options.refOption': optionId
  });

  if (categories.length > 0) {
    // 不直接拒絕，而是從類別中移除選項引用
    for (const category of categories) {
      category.options = category.options.filter(
        o => o.refOption.toString() !== optionId
      );
      await category.save();
    }
  }

  // TODO: 檢查是否有餐點實例使用了此選項，如果有則拒絕刪除

  await option.deleteOne();

  return { success: true, message: '選項已刪除' };
};

/**
 * 將選項添加到類別
 * @param {String} categoryId - 類別ID
 * @param {String} optionId - 選項ID
 * @param {Number} order - 排序順序 (可選)
 * @returns {Promise<Object>} 更新後的類別
 */
export const addOptionToCategory = async (categoryId, optionId, order = 0) => {
  // 檢查類別是否存在
  const category = await OptionCategory.findById(categoryId);

  if (!category) {
    throw new AppError('選項類別不存在', 404);
  }

  // 檢查選項是否存在
  const option = await Option.findById(optionId);

  if (!option) {
    throw new AppError('選項不存在', 404);
  }

  // 檢查選項是否已在類別中
  const optionExists = category.options.some(
    o => o.refOption.toString() === optionId
  );

  if (optionExists) {
    throw new AppError('選項已存在於類別中', 400);
  }

  // 添加選項到類別
  category.options.push({
    refOption: optionId,
    order
  });

  await category.save();

  return category;
};

/**
 * 從類別中移除選項
 * @param {String} categoryId - 類別ID
 * @param {String} optionId - 選項ID
 * @returns {Promise<Object>} 更新後的類別
 */
export const removeOptionFromCategory = async (categoryId, optionId) => {
  // 檢查類別是否存在
  const category = await OptionCategory.findById(categoryId);

  if (!category) {
    throw new AppError('選項類別不存在', 404);
  }

  // 檢查選項是否在類別中
  const optionExists = category.options.some(
    o => o.refOption.toString() === optionId
  );

  if (!optionExists) {
    throw new AppError('選項不存在於類別中', 400);
  }

  // 從類別中移除選項
  category.options = category.options.filter(
    o => o.refOption.toString() !== optionId
  );

  await category.save();

  return category;
};

/**
 * 更新類別中選項的順序
 * @param {String} categoryId - 類別ID
 * @param {Array} orderData - 順序數據 [{ optionId, order }]
 * @returns {Promise<Object>} 更新後的類別
 */
export const updateOptionsOrder = async (categoryId, orderData) => {
  // 檢查類別是否存在
  const category = await OptionCategory.findById(categoryId);

  if (!category) {
    throw new AppError('選項類別不存在', 404);
  }

  // 檢查所有選項是否存在於類別中
  for (const item of orderData) {
    const optionExists = category.options.some(
      o => o.refOption.toString() === item.optionId
    );

    if (!optionExists) {
      throw new AppError(`選項 ${item.optionId} 不存在於類別中`, 400);
    }
  }

  // 更新選項順序
  for (const item of orderData) {
    const option = category.options.find(
      o => o.refOption.toString() === item.optionId
    );

    if (option) {
      option.order = item.order;
    }
  }

  await category.save();

  return category;
};

/**
 * 批量創建選項
 * @param {Array} optionsData - 選項數據陣列
 * @returns {Promise<Array>} 創建的選項列表
 */
export const bulkCreateOptions = async (optionsData) => {
  if (!Array.isArray(optionsData) || optionsData.length === 0) {
    throw new AppError('無效的選項數據', 400);
  }

  const createdOptions = [];

  for (const optionData of optionsData) {
    // 基本驗證
    if (!optionData.name) {
      throw new AppError('選項名稱為必填欄位', 400);
    }

    // 檢查關聯的餐點模板是否存在
    if (optionData.refDishTemplate) {
      const template = await DishTemplate.findById(optionData.refDishTemplate);

      if (!template) {
        throw new AppError(`關聯的餐點模板 ${optionData.refDishTemplate} 不存在`, 404);
      }
    }

    // 創建選項
    const newOption = new Option(optionData);
    await newOption.save();

    createdOptions.push(newOption);
  }

  return createdOptions;
};
