/**
 * 餐點實例服務
 * 處理餐點實例相關業務邏輯
 */

import DishInstance from '../../models/Dish/DishInstance.js'
import DishTemplate from '../../models/Dish/DishTemplate.js'
import Option from '../../models/Dish/Option.js'
import { AppError } from '../../middlewares/error.js'

/**
 * 獲取所有餐點實例
 * @param {Object} options - 查詢選項
 * @param {Number} options.page - 頁碼
 * @param {Number} options.limit - 每頁數量
 * @returns {Promise<Object>} 餐點實例列表與分頁資訊
 */
export const getAllInstances = async (options = {}) => {
  const { page = 1, limit = 20 } = options

  // 計算分頁
  const skip = (page - 1) * limit

  // 查詢總數
  const total = await DishInstance.countDocuments()

  // 查詢餐點實例
  const instances = await DishInstance.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('templateId')

  // 處理分頁信息
  const totalPages = Math.ceil(total / limit)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return {
    instances,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage,
      hasPrevPage,
    },
  }
}

/**
 * 根據ID獲取餐點實例
 * @param {String} instanceId - 實例ID
 * @returns {Promise<Object>} 餐點實例
 */
export const getInstanceById = async (instanceId) => {
  const instance = await DishInstance.findById(instanceId).populate('templateId')

  if (!instance) {
    throw new AppError('餐點實例不存在', 404)
  }

  return instance
}

/**
 * 創建餐點實例
 * @param {Object} instanceData - 實例數據
 * @returns {Promise<Object>} 創建的餐點實例
 */
export const createInstance = async (instanceData) => {
  // 基本驗證
  if (!instanceData.templateId) {
    throw new AppError('餐點模板ID為必填欄位', 400)
  }

  // 查找對應的餐點模板
  const template = await DishTemplate.findById(instanceData.templateId)

  if (!template) {
    throw new AppError('餐點模板不存在', 404)
  }

  // 添加冗余模板信息
  instanceData.name = template.name
  instanceData.basePrice = template.basePrice

  // 驗證選項
  if (instanceData.options && instanceData.options.length > 0) {
    for (const category of instanceData.options) {
      if (!category.optionCategoryId) {
        throw new AppError('選項類別ID為必填欄位', 400)
      }

      // 驗證選項
      if (category.selections && category.selections.length > 0) {
        for (const selection of category.selections) {
          if (!selection.optionId) {
            throw new AppError('選項ID為必填欄位', 400)
          }

          // 查找選項以獲取名稱和價格
          const option = await Option.findById(selection.optionId)

          if (!option) {
            throw new AppError(`選項 ${selection.optionId} 不存在`, 404)
          }

          // 添加冗余選項信息
          selection.name = option.name
          selection.price = option.price
        }
      }
    }
  }

  // 計算最終價格
  const finalPrice = calculateFinalPrice(instanceData)
  instanceData.finalPrice = finalPrice

  // 創建餐點實例
  const newInstance = new DishInstance(instanceData)
  await newInstance.save()

  return newInstance
}

/**
 * 更新餐點實例
 * @param {String} instanceId - 實例ID
 * @param {Object} updateData - 更新數據
 * @returns {Promise<Object>} 更新後的餐點實例
 */
export const updateInstance = async (instanceId, updateData) => {
  // 檢查實例是否存在
  const instance = await DishInstance.findById(instanceId)

  if (!instance) {
    throw new AppError('餐點實例不存在', 404)
  }

  // 如果更新了選項
  if (updateData.options) {
    for (const category of updateData.options) {
      if (category.selections && category.selections.length > 0) {
        for (const selection of category.selections) {
          if (selection.optionId) {
            // 查找選項以獲取名稱和價格
            const option = await Option.findById(selection.optionId)

            if (!option) {
              throw new AppError(`選項 ${selection.optionId} 不存在`, 404)
            }

            // 添加冗余選項信息
            selection.name = option.name
            selection.price = option.price
          }
        }
      }
    }

    // 更新選項
    instance.options = updateData.options
  }

  // 更新特殊要求
  if (updateData.specialInstructions !== undefined) {
    instance.specialInstructions = updateData.specialInstructions
  }

  // 重新計算最終價格
  instance.finalPrice = calculateFinalPrice(instance)

  await instance.save()

  return instance
}

/**
 * 刪除餐點實例
 * @param {String} instanceId - 實例ID
 * @returns {Promise<Object>} 刪除結果
 */
export const deleteInstance = async (instanceId) => {
  // 檢查實例是否存在
  const instance = await DishInstance.findById(instanceId)

  if (!instance) {
    throw new AppError('餐點實例不存在', 404)
  }

  // TODO: 檢查是否有關聯的訂單，如果有則拒絕刪除

  await instance.deleteOne()

  return { success: true, message: '餐點實例已刪除' }
}

/**
 * 計算餐點最終價格
 * @param {Object} instance - 餐點實例對象
 * @returns {Number} 最終價格
 */
export const calculateFinalPrice = (instance) => {
  let finalPrice = instance.basePrice

  // 加上選項的額外費用
  if (instance.options && instance.options.length > 0) {
    for (const category of instance.options) {
      if (category.selections && category.selections.length > 0) {
        for (const selection of category.selections) {
          finalPrice += selection.price || 0
        }
      }
    }
  }

  return finalPrice
}
