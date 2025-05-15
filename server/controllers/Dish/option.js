import * as optionService from '../../services/dish/optionService.js';
import { asyncHandler } from '../../middlewares/error.js';

// 獲取所有選項
export const getAllOptions = asyncHandler(async (req, res) => {
  // 從當前登入的管理員中獲取品牌ID
  const brandId = req.brandId || req.params.brandId;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: 'brandId 為必須參數'
    });
  }

  const options = {
    categoryId: req.query.categoryId
  };

  const allOptions = await optionService.getAllOptions(brandId, options);

  res.json({
    success: true,
    options: allOptions
  });
});

// 獲取單個選項
export const getOptionById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const brandId = req.brandId || req.params.brandId;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: 'brandId 為必須參數'
    });
  }

  const option = await optionService.getOptionById(id, brandId);

  res.json({
    success: true,
    option
  });
});

// 創建新選項
export const createOption = asyncHandler(async (req, res) => {
  const brandId = req.brandId;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: '品牌ID為必須參數'
    });
  }

  const newOption = await optionService.createOption(req.body, brandId);

  res.status(201).json({
    success: true,
    message: '選項創建成功',
    option: newOption
  });
});

// 更新選項
export const updateOption = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const brandId = req.brandId;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: '品牌ID為必須參數'
    });
  }

  const updatedOption = await optionService.updateOption(id, req.body, brandId);

  res.json({
    success: true,
    message: '選項更新成功',
    option: updatedOption
  });
});

// 刪除選項
export const deleteOption = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const brandId = req.brandId;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: '品牌ID為必須參數'
    });
  }

  const result = await optionService.deleteOption(id, brandId);

  res.json({
    success: true,
    message: result.message
  });
});

// 獲取類別下的所有選項
export const getOptionsByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const brandId = req.brandId;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: 'brandId 為必須參數'
    });
  }

  const options = await optionService.getOptionsByCategoryId(categoryId, brandId);

  res.json({
    success: true,
    options
  });
});
