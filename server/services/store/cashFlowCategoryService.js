/**
 * 記帳分類管理服務
 * 處理記帳分類相關業務邏輯
 */

import CashFlowCategory from '../../models/Store/CashFlowCategory.js'
import Store from '../../models/Store/Store.js'
import Brand from '../../models/Brand/Brand.js'
import { AppError } from '../../middlewares/error.js'

/**
 * 獲取店舖的所有記帳分類
 * @param {String} storeId - 店舖ID
 * @param {Object} options - 查詢選項
 * @returns {Promise<Array>} 記帳分類列表
 */
export const getCategoriesByStore = async (storeId, options = {}) => {
  const { type, activeOnly = true } = options

  // 驗證店舖是否存在
  const store = await Store.findById(storeId)
  if (!store) {
    throw new AppError('店舖不存在', 404)
  }

  // 構建查詢條件
  const queryConditions = { store: storeId }

  if (type && ['income', 'expense'].includes(type)) {
    queryConditions.type = type
  }

  const categories = await CashFlowCategory.find(queryConditions)
    .populate('brand', 'name')
    .populate('store', 'name')
    .sort({ type: 1, name: 1 })

  return categories
}

/**
 * 根據ID獲取記帳分類
 * @param {String} categoryId - 分類ID
 * @returns {Promise<Object>} 記帳分類
 */
export const getCategoryById = async (categoryId) => {
  const category = await CashFlowCategory.findById(categoryId)
    .populate('brand', 'name')
    .populate('store', 'name')

  if (!category) {
    throw new AppError('記帳分類不存在', 404)
  }

  return category
}

/**
 * 創建記帳分類
 * @param {Object} categoryData - 分類數據
 * @returns {Promise<Object>} 創建的記帳分類
 */
export const createCategory = async (categoryData) => {
  // 基本驗證
  if (!categoryData.name || !categoryData.store || !categoryData.type) {
    throw new AppError('分類名稱、店舖和類型為必填欄位', 400)
  }

  if (!['income', 'expense'].includes(categoryData.type)) {
    throw new AppError('類型必須為 income 或 expense', 400)
  }

  // 驗證店舖是否存在並獲取品牌資訊
  const store = await Store.findById(categoryData.store).populate('brand')
  if (!store) {
    throw new AppError('店舖不存在', 404)
  }

  // 設定品牌ID
  categoryData.brand = store.brand._id

  // 檢查同一店舖內是否已存在相同名稱的分類
  const existingCategory = await CashFlowCategory.findOne({
    store: categoryData.store,
    name: categoryData.name,
  })

  if (existingCategory) {
    throw new AppError('該店舖已存在相同名稱的記帳分類', 400)
  }

  // 創建分類
  const category = new CashFlowCategory(categoryData)
  await category.save()

  // 返回完整的分類資訊
  return await getCategoryById(category._id)
}

/**
 * 更新記帳分類
 * @param {String} categoryId - 分類ID
 * @param {Object} updateData - 更新數據
 * @returns {Promise<Object>} 更新後的記帳分類
 */
export const updateCategory = async (categoryId, updateData) => {
  const category = await CashFlowCategory.findById(categoryId)
  if (!category) {
    throw new AppError('記帳分類不存在', 404)
  }

  // 驗證類型
  if (updateData.type && !['income', 'expense'].includes(updateData.type)) {
    throw new AppError('類型必須為 income 或 expense', 400)
  }

  // 如果更新名稱，檢查是否重複
  if (updateData.name && updateData.name !== category.name) {
    const existingCategory = await CashFlowCategory.findOne({
      _id: { $ne: categoryId },
      store: category.store,
      name: updateData.name,
    })

    if (existingCategory) {
      throw new AppError('該店舖已存在相同名稱的記帳分類', 400)
    }
  }

  // 不允許修改 brand 和 store
  delete updateData.brand
  delete updateData.store

  // 更新分類
  const updatedCategory = await CashFlowCategory.findByIdAndUpdate(categoryId, updateData, {
    new: true,
  })
    .populate('brand', 'name')
    .populate('store', 'name')

  return updatedCategory
}

/**
 * 刪除記帳分類
 * @param {String} categoryId - 分類ID
 * @returns {Promise<Boolean>} 刪除結果
 */
export const deleteCategory = async (categoryId) => {
  const category = await CashFlowCategory.findById(categoryId)
  if (!category) {
    throw new AppError('記帳分類不存在', 404)
  }

  // TODO: 檢查是否有記帳記錄使用此分類
  // 可以選擇：1. 禁止刪除 2. 將關聯記錄移到預設分類 3. 軟刪除

  await CashFlowCategory.findByIdAndDelete(categoryId)
  return true
}
