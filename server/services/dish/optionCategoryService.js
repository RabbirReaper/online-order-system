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
 * 獲取所有選項類別（按品牌過濾）
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Array>} 選項類別列表
 */
export const getAllCategories = async (brandId) => {
  // 直接返回該品牌的所有類別，無分頁
  const categories = await OptionCategory.find({ brand: brandId })
    .sort({ name: 1 });

  return categories;
};

/**
 * 根據ID獲取選項類別（驗證品牌）
 * @param {String} categoryId - 類別ID
 * @param {String} brandId - 品牌ID
 * @param {Boolean} includeOptions - 是否包含選項詳情
 * @returns {Promise<Object>} 選項類別
 */
export const getCategoryById = async (categoryId, brandId, includeOptions = false) => {
  // 根據是否需要選項詳情選擇查詢
  let category;

  if (includeOptions) {
    category = await OptionCategory.findOne({
      _id: categoryId,
      brand: brandId
    }).populate({
      path: 'options.refOption',
      model: 'Option',
      populate: {
        path: 'refDishTemplate',
        model: 'DishTemplate',
        select: 'name'
      }
    });
  } else {
    category = await OptionCategory.findOne({
      _id: categoryId,
      brand: brandId
    });
  }

  if (!category) {
    throw new AppError('選項類別不存在或無權訪問', 404);
  }

  return category;
};

/**
 * 創建選項類別
 * @param {Object} categoryData - 類別數據
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 創建的選項類別
 */
export const createCategory = async (categoryData, brandId) => {
  // 基本驗證
  if (!categoryData.name || !categoryData.inputType) {
    throw new AppError('名稱和輸入類型為必填欄位', 400);
  }

  // 檢查名稱是否已存在於該品牌下
  const existingCategory = await OptionCategory.findOne({
    name: categoryData.name,
    brand: brandId
  });

  if (existingCategory) {
    throw new AppError('此選項類別名稱已存在', 400);
  }

  // 確保設置品牌ID
  categoryData.brand = brandId;

  // 創建選項類別
  const newCategory = new OptionCategory(categoryData);
  await newCategory.save();

  return newCategory;
};

/**
 * 更新選項類別
 * @param {String} categoryId - 類別ID
 * @param {Object} updateData - 更新數據
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 更新後的選項類別
 */
export const updateCategory = async (categoryId, updateData, brandId) => {
  // 檢查類別是否存在且屬於該品牌
  const category = await OptionCategory.findOne({
    _id: categoryId,
    brand: brandId
  });

  if (!category) {
    throw new AppError('選項類別不存在或無權訪問', 404);
  }

  // 檢查名稱是否已存在於該品牌下 (排除當前ID)
  if (updateData.name && updateData.name !== category.name) {
    const existingCategory = await OptionCategory.findOne({
      name: updateData.name,
      brand: brandId,
      _id: { $ne: categoryId }
    });

    if (existingCategory) {
      throw new AppError('此選項類別名稱已存在', 400);
    }
  }

  // 防止更改品牌
  delete updateData.brand;

  // 更新類別
  if (updateData.name) {
    category.name = updateData.name;
  }

  if (updateData.inputType) {
    category.inputType = updateData.inputType;
  }

  // 更新選項列表 (如果提供)
  if (updateData.options) {
    // 檢查所有選項是否存在且屬於該品牌
    for (const option of updateData.options) {
      if (!option.refOption) {
        throw new AppError('選項ID為必填欄位', 400);
      }

      const optionExists = await Option.findOne({
        _id: option.refOption,
        brand: brandId
      });

      if (!optionExists) {
        throw new AppError(`選項 ${option.refOption} 不存在或不屬於此品牌`, 404);
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
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 刪除結果
 */
export const deleteCategory = async (categoryId, brandId) => {
  // 檢查類別是否存在且屬於該品牌
  const category = await OptionCategory.findOne({
    _id: categoryId,
    brand: brandId
  });

  if (!category) {
    throw new AppError('選項類別不存在或無權訪問', 404);
  }

  // 檢查是否有餐點模板使用了此類別
  const templatesUsingCategory = await DishTemplate.countDocuments({
    'optionCategories.categoryId': new mongoose.Types.ObjectId(categoryId),
    brand: brandId
  });

  if (templatesUsingCategory > 0) {
    throw new AppError('此選項類別被餐點模板使用中，無法刪除', 400);
  }

  await category.deleteOne();

  return { success: true, message: '選項類別已刪除' };
};
