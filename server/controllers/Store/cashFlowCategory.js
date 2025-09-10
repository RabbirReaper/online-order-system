import * as cashFlowCategoryService from '../../services/store/cashFlowCategoryService.js'
import { asyncHandler } from '../../middlewares/error.js'

// 獲取店舖的所有記帳分類
export const getCategoriesByStore = asyncHandler(async (req, res) => {
  try {
    const { storeId } = req.params
    const options = {
      type: req.query.type,
      activeOnly: req.query.activeOnly === 'true'
    }

    const categories = await cashFlowCategoryService.getCategoriesByStore(storeId, options)

    res.json({
      success: true,
      message: '獲取記帳分類成功',
      data: categories
    })
  } catch (error) {
    console.error('Error getting categories:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    })
  }
})

// 根據ID獲取記帳分類
export const getCategoryById = asyncHandler(async (req, res) => {
  try {
    const { categoryId } = req.params
    const category = await cashFlowCategoryService.getCategoryById(categoryId)

    res.json({
      success: true,
      message: '獲取記帳分類詳情成功',
      data: category
    })
  } catch (error) {
    console.error('Error getting category:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    })
  }
})

// 創建記帳分類
export const createCategory = asyncHandler(async (req, res) => {
  try {
    const category = await cashFlowCategoryService.createCategory(req.body)

    res.status(201).json({
      success: true,
      message: '創建記帳分類成功',
      data: category
    })
  } catch (error) {
    console.error('Error creating category:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    })
  }
})

// 更新記帳分類
export const updateCategory = asyncHandler(async (req, res) => {
  try {
    const { categoryId } = req.params
    const updatedCategory = await cashFlowCategoryService.updateCategory(categoryId, req.body)

    res.json({
      success: true,
      message: '更新記帳分類成功',
      data: updatedCategory
    })
  } catch (error) {
    console.error('Error updating category:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    })
  }
})

// 刪除記帳分類
export const deleteCategory = asyncHandler(async (req, res) => {
  try {
    const { categoryId } = req.params
    await cashFlowCategoryService.deleteCategory(categoryId)

    res.json({
      success: true,
      message: '刪除記帳分類成功'
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    })
  }
})

// 創建店舖預設記帳分類
export const createDefaultCategories = asyncHandler(async (req, res) => {
  try {
    const { storeId } = req.params
    const categories = await cashFlowCategoryService.createDefaultCategories(storeId)

    res.status(201).json({
      success: true,
      message: '創建預設記帳分類成功',
      data: categories
    })
  } catch (error) {
    console.error('Error creating default categories:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    })
  }
})