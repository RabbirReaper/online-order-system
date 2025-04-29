/**
 * 選項類別服務
 * 處理餐點選項類別相關業務邏輯
 */

import OptionCategory from '../../models/Dish/OptionCategory.js';
import Option from '../../models/Dish/Option.js';
import DishTemplate from '../../models/Dish/DishTemplate.js';
import mongoose from 'mongoose';
import { AppError } from '../../middlewares/error.js';

/**
 * 獲取所有選項類別
 * @param {Object} options - 查詢選項
 * @param {Number} options.page - 頁碼
 * @param {Number} options.limit - 每頁數量
 * @returns {Promise<Object>} 選項類別列表與分頁資訊
 */
export const getAllCategories = async (options = {}) => {
  const { page = 1, limit = 20 } = options;

  // 計算分頁
  const skip = (page - 1) * limit;

  // 查詢總數
  const total = await OptionCategory.countDocuments();

  // 查詢選項類別
  const categories = await OptionCategory.find()
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);

  // 處理分頁信息
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    categories,
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
 * 根據ID獲取選項類別
 * @param {String} categoryId - 類別ID
 * @param {Boolean} includeOptions - 是否包含選項詳情
 * @returns {Promise<Object>} 選項類別
 */
export const getCategoryById = async (categoryId, includeOptions = false) => {
  // 根據是否需要選項詳情選擇查詢
  let category;

  if (includeOptions) {
    category = await OptionCategory.findById(categoryId)
      .populate({
        path: 'options.refOption',
        model: 'Option',
        populate: {
          path: 'refDishTemplate',
          model: 'DishTemplate',
          select: 'name'
        }
      });
  } else {
    category = await OptionCategory.findById(categoryId);
  }

  if (!category) {
    throw new AppError('選項類別不存在', 404);
  }

  return category;
};

/**
 * 創建選項類別
 * @param {Object} categoryData - 類別數據
 * @returns {Promise<Object>} 創建的選項類別
 */
export const createCategory = async (categoryData) => {
  // 基本驗證
  if (!categoryData.name || !categoryData.inputType) {
    throw new AppError('名稱和輸入類型為必填欄位', 400);
  }

  // 檢查名稱是否已存在
  const existingCategory = await OptionCategory.findOne({ name: categoryData.name });
  if (existingCategory) {
    throw new AppError('此選項類別名稱已存在', 400);
  }

  // 創建選項類別
  const newCategory = new OptionCategory(categoryData);
  await newCategory.save();

  return newCategory;
};

/**
 * 更新選項類別
 * @param {String} categoryId - 類別ID
 * @param {Object} updateData - 更新數據
 * @returns {Promise<Object>} 更新後的選項類別
 */
export const updateCategory = async (categoryId, updateData) => {
  // 檢查類別是否存在
  const category = await OptionCategory.findById(categoryId);

  if (!category) {
    throw new AppError('選項類別不存在', 404);
  }

  // 檢查名稱是否已存在 (排除當前ID)
  if (updateData.name && updateData.name !== category.name) {
    const existingCategory = await OptionCategory.findOne({
      name: updateData.name,
      _id: { $ne: categoryId }
    });

    if (existingCategory) {
      throw new AppError('此選項類別名稱已存在', 400);
    }
  }

  // 更新類別
  if (updateData.name) {
    category.name = updateData.name;
  }

  if (updateData.inputType) {
    category.inputType = updateData.inputType;
  }

  // 更新選項列表 (如果提供)
  if (updateData.options) {
    // 檢查所有選項是否存在
    for (const option of updateData.options) {
      if (!option.refOption) {
        throw new AppError('選項ID為必填欄位', 400);
      }

      const optionExists = await Option.findById(option.refOption);
      if (!optionExists) {
        throw new AppError(`選項 ${option.refOption} 不存在`, 404);
      }
    }

    category.options = updateData.options;
  }

  await category.save();

  return category;
};

/**
 * 刪除選項類別
 * @param {String} categoryId - 類別ID
 * @returns {Promise<Object>} 刪除結果
 */
export const deleteCategory = async (categoryId) => {
  // 檢查類別是否存在
  const category = await OptionCategory.findById(categoryId);

  if (!category) {
    throw new AppError('選項類別不存在', 404);
  }

  // 檢查是否有餐點模板使用了此類別
  const templatesUsingCategory = await DishTemplate.countDocuments({
    'optionCategories.categoryId': mongoose.Types.ObjectId(categoryId)
  });

  if (templatesUsingCategory > 0) {
    throw new AppError('此選項類別被餐點模板使用中，無法刪除', 400);
  }

  await category.deleteOne();

  return { success: true, message: '選項類別已刪除' };
};
