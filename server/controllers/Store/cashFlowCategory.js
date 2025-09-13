import * as cashFlowCategoryService from '../../services/store/cashFlowCategoryService.js'
import { asyncHandler } from '../../middlewares/error.js'

// 獲取店舖的所有記帳分類
export const getCategoriesByStore = asyncHandler(async (req, res) => {
  const { storeId } = req.params
  const options = {
    type: req.query.type,
    activeOnly: req.query.activeOnly === 'true',
  }

  const categories = await cashFlowCategoryService.getCategoriesByStore(storeId, options)

  res.json({
    success: true,
    message: '獲取記帳分類成功',
    data: categories,
  })
})

// 根據ID獲取記帳分類
export const getCategoryById = asyncHandler(async (req, res) => {
  const { categoryId } = req.params
  const category = await cashFlowCategoryService.getCategoryById(categoryId)

  res.json({
    success: true,
    message: '獲取記帳分類詳情成功',
    data: category,
  })
})

// 創建記帳分類
export const createCategory = asyncHandler(async (req, res) => {
  const category = await cashFlowCategoryService.createCategory(req.body)

  res.status(201).json({
    success: true,
    message: '創建記帳分類成功',
    data: category,
  })
})

// 更新記帳分類
export const updateCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params
  const updatedCategory = await cashFlowCategoryService.updateCategory(categoryId, req.body)

  res.json({
    success: true,
    message: '更新記帳分類成功',
    data: updatedCategory,
  })
})

// 刪除記帳分類
export const deleteCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params
  await cashFlowCategoryService.deleteCategory(categoryId)

  res.json({
    success: true,
    message: '刪除記帳分類成功',
  })
})
