/**
 * 選項服務
 * 處理餐點選項相關業務邏輯
 */

import Option from '../../models/Dish/Option.js'
import OptionCategory from '../../models/Dish/OptionCategory.js'
import DishTemplate from '../../models/Dish/DishTemplate.js'
import { AppError } from '../../middlewares/error.js'

/**
 * 獲取所有選項（按品牌和類別過濾）
 * @param {String} brandId - 品牌ID
 * @param {Object} options - 查詢選項
 * @param {String} options.categoryId - 按類別篩選
 * @param {Array} options.tags - 按標籤篩選
 * @returns {Promise<Array>} 選項列表
 */
export const getAllOptions = async (brandId, options = {}) => {
  const { categoryId, tags } = options

  // 構建查詢條件
  const queryConditions = { brand: brandId }

  // 按標籤篩選
  if (tags && Array.isArray(tags) && tags.length > 0) {
    queryConditions.tags = { $in: tags }
  }

  // 按類別篩選
  if (categoryId) {
    // 查找類別下的所有選項引用，確保類別屬於該品牌
    const category = await OptionCategory.findOne({
      _id: categoryId,
      brand: brandId,
    })

    if (category && category.options) {
      const optionIds = category.options.map((o) => o.refOption)
      queryConditions._id = { $in: optionIds }
    } else {
      // 如果類別不存在或沒有選項，返回空結果
      return []
    }
  }

  // 查詢選項，無分頁直接返回所有
  const optionsList = await Option.find(queryConditions)
    .sort({ name: 1 })
    .populate('refDishTemplate', 'name')

  return optionsList
}

/**
 * 根據類別ID獲取選項
 * @param {String} categoryId - 類別ID
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Array>} 選項列表
 */
export const getOptionsByCategoryId = async (categoryId, brandId) => {
  // 查找類別，確保屬於該品牌
  const category = await OptionCategory.findOne({
    _id: categoryId,
    brand: brandId,
  })

  if (!category) {
    throw new AppError('選項類別不存在或無權訪問', 404)
  }

  if (!category.options || category.options.length === 0) {
    return []
  }

  // 獲取類別中的選項ID
  const optionIds = category.options.map((o) => o.refOption)

  // 查詢選項
  const options = await Option.find({
    _id: { $in: optionIds },
    brand: brandId,
  }).populate('refDishTemplate', 'name')

  // 添加排序信息
  const optionsWithOrder = options.map((option) => {
    const optionConfig = category.options.find(
      (o) => o.refOption.toString() === option._id.toString(),
    )

    return {
      ...option.toObject(),
      order: optionConfig ? optionConfig.order : 0,
    }
  })

  // 按照類別中的順序排序
  optionsWithOrder.sort((a, b) => a.order - b.order)

  return optionsWithOrder
}

/**
 * 根據ID獲取選項
 * @param {String} optionId - 選項ID
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 選項
 */
export const getOptionById = async (optionId, brandId) => {
  const option = await Option.findOne({
    _id: optionId,
    brand: brandId,
  }).populate('refDishTemplate', 'name')

  if (!option) {
    throw new AppError('選項不存在或無權訪問', 404)
  }

  return option
}

/**
 * 創建選項
 * @param {Object} optionData - 選項數據
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 創建的選項
 */
export const createOption = async (optionData, brandId) => {
  // 基本驗證
  if (!optionData.name) {
    throw new AppError('選項名稱為必填欄位', 400)
  }

  // 檢查關聯的餐點模板是否存在且屬於該品牌
  if (optionData.refDishTemplate) {
    const template = await DishTemplate.findOne({
      _id: optionData.refDishTemplate,
      brand: brandId,
    })

    if (!template) {
      throw new AppError('關聯的餐點模板不存在或不屬於此品牌', 404)
    }
  }

  // 檢查名稱是否已存在於該品牌下
  const existingOption = await Option.findOne({
    name: optionData.name,
    brand: brandId,
  })

  if (existingOption) {
    throw new AppError('此選項名稱已存在', 400)
  }

  // 確保設置品牌ID
  optionData.brand = brandId

  // 確保 tags 是陣列
  if (optionData.tags && !Array.isArray(optionData.tags)) {
    optionData.tags = [optionData.tags]
  }

  // 創建選項
  const newOption = new Option(optionData)
  await newOption.save()

  return newOption
}

/**
 * 更新選項
 * @param {String} optionId - 選項ID
 * @param {Object} updateData - 更新數據
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 更新後的選項
 */
export const updateOption = async (optionId, updateData, brandId) => {
  // 檢查選項是否存在且屬於該品牌
  const option = await Option.findOne({
    _id: optionId,
    brand: brandId,
  })

  if (!option) {
    throw new AppError('選項不存在或無權訪問', 404)
  }

  // 基本驗證
  if (updateData.name) {
    // 檢查更新的名稱是否與其他選項重複
    const existingOption = await Option.findOne({
      name: updateData.name,
      brand: brandId,
      _id: { $ne: optionId }, // 排除當前選項
    })

    if (existingOption) {
      throw new AppError('此選項名稱已存在', 400)
    }
  }

  // 檢查關聯的餐點模板是否存在且屬於該品牌
  if (updateData.refDishTemplate) {
    const template = await DishTemplate.findOne({
      _id: updateData.refDishTemplate,
      brand: brandId,
    })

    if (!template) {
      throw new AppError('關聯的餐點模板不存在或不屬於此品牌', 404)
    }
  }

  // 確保 tags 是陣列
  if (updateData.tags && !Array.isArray(updateData.tags)) {
    updateData.tags = [updateData.tags]
  }

  // 更新選項
  Object.keys(updateData).forEach((key) => {
    option[key] = updateData[key]
  })

  await option.save()

  return option
}

/**
 * 刪除選項
 * @param {String} optionId - 選項ID
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 刪除結果
 */
export const deleteOption = async (optionId, brandId) => {
  // 檢查選項是否存在且屬於該品牌
  const option = await Option.findOne({
    _id: optionId,
    brand: brandId,
  })

  if (!option) {
    throw new AppError('選項不存在或無權訪問', 404)
  }

  // 檢查是否有類別引用了此選項
  const categories = await OptionCategory.find({
    'options.refOption': optionId,
    brand: brandId,
  })

  // 直接拒絕刪除被類別引用的選項
  if (categories.length > 0) {
    throw new AppError('無法刪除此選項，因為它已被一個或多個類別引用', 400)
  }

  await option.deleteOne()

  return { success: true, message: '選項已刪除' }
}
