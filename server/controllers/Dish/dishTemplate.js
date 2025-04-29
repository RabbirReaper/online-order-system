import * as dishTemplateService from '../../services/dish/dishTemplate.js';
import { asyncHandler } from '../../middlewares/error.js';

// 獲取所有餐點模板
export const getAllDishTemplates = asyncHandler(async (req, res) => {
  // 從當前登入的管理員中獲取品牌ID
  const brandId = req.adminRole === 'boss' ? req.query.brandId : req.adminBrand;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: 'brandId 為必須參數'
    });
  }

  const options = {
    query: req.query.query || '',
    tags: req.query.tags ? req.query.tags.split(',') : []
  };

  const templates = await dishTemplateService.getAllTemplates(brandId, options);

  res.json({
    success: true,
    templates
  });
});

// 獲取單個餐點模板
export const getDishTemplateById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const brandId = req.adminRole === 'boss' ? req.query.brandId : req.adminBrand;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: 'brandId 為必須參數'
    });
  }

  const template = await dishTemplateService.getTemplateById(id, brandId);

  res.json({
    success: true,
    template
  });
});

// 創建新餐點模板
export const createDishTemplate = asyncHandler(async (req, res) => {
  const brandId = req.adminRole === 'boss' ? req.body.brand : req.adminBrand;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: '品牌ID為必須參數'
    });
  }

  // 處理可能的圖片資料
  // 圖片資料可能來自表單的 base64 字串或檔案上傳
  if (req.file) {
    req.body.imageData = req.file.buffer;
  }

  const newTemplate = await dishTemplateService.createTemplate(req.body, brandId);

  res.status(201).json({
    success: true,
    message: '餐點模板創建成功',
    template: newTemplate
  });
});

// 更新餐點模板
export const updateDishTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const brandId = req.adminRole === 'boss' ? req.body.brand || req.query.brandId : req.adminBrand;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: '品牌ID為必須參數'
    });
  }

  // 處理圖片資料
  if (req.file) {
    req.body.imageData = req.file.buffer;
  }

  const updatedTemplate = await dishTemplateService.updateTemplate(id, req.body, brandId);

  res.json({
    success: true,
    message: '餐點模板更新成功',
    template: updatedTemplate
  });
});

// 刪除餐點模板
export const deleteDishTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const brandId = req.adminRole === 'boss' ? req.query.brandId : req.adminBrand;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: '品牌ID為必須參數'
    });
  }

  await dishTemplateService.deleteTemplate(id, brandId);

  res.json({
    success: true,
    message: '餐點模板刪除成功'
  });
});

// 獲取餐點模板的選項類別
export const getDishTemplateOptions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const brandId = req.adminRole === 'boss' ? req.query.brandId : req.adminBrand;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: '品牌ID為必須參數'
    });
  }

  const options = await dishTemplateService.getTemplateOptions(id, brandId);

  res.json({
    success: true,
    options
  });
});
