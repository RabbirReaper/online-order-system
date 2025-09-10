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
    type: categoryData.type
  })

  if (existingCategory) {
    throw new AppError('該店舖已存在相同名稱和類型的記帳分類', 400)
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
      type: updateData.type || category.type
    })

    if (existingCategory) {
      throw new AppError('該店舖已存在相同名稱和類型的記帳分類', 400)
    }
  }

  // 不允許修改 brand 和 store
  delete updateData.brand
  delete updateData.store

  // 更新分類
  const updatedCategory = await CashFlowCategory.findByIdAndUpdate(
    categoryId,
    updateData,
    { new: true }
  ).populate('brand', 'name').populate('store', 'name')

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

/**
 * 創建店舖預設記帳分類
 * @param {String} storeId - 店舖ID
 * @returns {Promise<Array>} 創建的預設分類列表
 */
export const createDefaultCategories = async (storeId) => {
  // 驗證店舖是否存在
  const store = await Store.findById(storeId).populate('brand')
  if (!store) {
    throw new AppError('店舖不存在', 404)
  }

  const brandId = store.brand._id

  // 預設收入分類
  const defaultIncomeCategories = [
    { name: '餐點銷售', icon: 'fa-utensils', color: '#28a745' },
    { name: '飲料銷售', icon: 'fa-coffee', color: '#17a2b8' },
    { name: '其他收入', icon: 'fa-plus-circle', color: '#6c757d' }
  ]

  // 預設支出分類
  const defaultExpenseCategories = [
    { name: '食材採購', icon: 'fa-shopping-cart', color: '#dc3545' },
    { name: '人事費用', icon: 'fa-users', color: '#fd7e14' },
    { name: '租金', icon: 'fa-home', color: '#6f42c1' },
    { name: '水電費', icon: 'fa-bolt', color: '#e83e8c' },
    { name: '設備維護', icon: 'fa-tools', color: '#20c997' },
    { name: '行銷費用', icon: 'fa-bullhorn', color: '#ffc107' },
    { name: '其他支出', icon: 'fa-minus-circle', color: '#6c757d' }
  ]

  const createdCategories = []

  // 創建收入分類
  for (const categoryData of defaultIncomeCategories) {
    const category = new CashFlowCategory({
      ...categoryData,
      type: 'income',
      brand: brandId,
      store: storeId
    })
    await category.save()
    createdCategories.push(category)
  }

  // 創建支出分類
  for (const categoryData of defaultExpenseCategories) {
    const category = new CashFlowCategory({
      ...categoryData,
      type: 'expense',
      brand: brandId,
      store: storeId
    })
    await category.save()
    createdCategories.push(category)
  }

  return createdCategories
}