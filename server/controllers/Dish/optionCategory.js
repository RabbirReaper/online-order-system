import * as optionCategoryService from '../../services/dish/optionCategoryService.js';
import { asyncHandler } from '../../middlewares/error.js';

// 獲取所有選項類別
export const getAllOptionCategories = asyncHandler(async (req, res) => {
  // 從當前登入的管理員中獲取品牌ID
  const brandId = req.brandId;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: 'brandId 為必須參數'
    });
  }

  const categories = await optionCategoryService.getAllCategories(brandId);

  res.json({
    success: true,
    categories
  });
});

// 獲取單個選項類別
export const getOptionCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const brandId = req.brandId;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: 'brandId 為必須參數'
    });
  }

  const includeOptions = req.query.includeOptions === 'true';
  const category = await optionCategoryService.getCategoryById(id, brandId, includeOptions);

  res.json({
    success: true,
    category
  });
});

// 創建新選項類別
export const createOptionCategory = asyncHandler(async (req, res) => {
  const brandId = req.brandId;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: '品牌ID為必須參數'
    });
  }

  const newCategory = await optionCategoryService.createCategory(req.body, brandId);

  res.status(201).json({
    success: true,
    message: '選項類別創建成功',
    category: newCategory
  });
});

// 更新選項類別
export const updateOptionCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const brandId = req.brandId;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: '品牌ID為必須參數'
    });
  }

  const updatedCategory = await optionCategoryService.updateCategory(id, req.body, brandId);

  res.json({
    success: true,
    message: '選項類別更新成功',
    category: updatedCategory
  });
});

// 刪除選項類別
export const deleteOptionCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const brandId = req.brandId;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: '品牌ID為必須參數'
    });
  }

  const result = await optionCategoryService.deleteCategory(id, brandId);

  res.json({
    success: true,
    message: result.message
  });
});
