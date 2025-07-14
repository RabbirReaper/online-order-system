import * as dishTemplateService from '../../services/dish/dishTemplate.js'
import { asyncHandler } from '../../middlewares/error.js'

// 獲取所有餐點模板
export const getAllDishTemplates = asyncHandler(async (req, res) => {
  const brandId = req.brandId || req.params.brandId // 從 requireBrandAccess middleware 取得

  const options = {
    query: req.query.query || '',
    tags: req.query.tags ? req.query.tags.split(',') : [],
  }

  const templates = await dishTemplateService.getAllTemplates(brandId, options)

  res.json({
    success: true,
    templates,
  })
})

// 獲取單個餐點模板
export const getDishTemplateById = asyncHandler(async (req, res) => {
  const { id } = req.params
  const brandId = req.brandId || req.params.brandId // 從 requireBrandAccess middleware 取得

  const template = await dishTemplateService.getTemplateById(id, brandId)

  res.json({
    success: true,
    template,
  })
})

// 創建新餐點模板
export const createDishTemplate = asyncHandler(async (req, res) => {
  const brandId = req.brandId // 從 requireBrandAccess middleware 取得

  const newTemplate = await dishTemplateService.createTemplate(req.body, brandId)

  res.status(201).json({
    success: true,
    message: '餐點模板創建成功',
    template: newTemplate,
  })
})

// 更新餐點模板
export const updateDishTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params
  const brandId = req.brandId // 從 requireBrandAccess middleware 取得

  const updatedTemplate = await dishTemplateService.updateTemplate(id, req.body, brandId)

  res.json({
    success: true,
    message: '餐點模板更新成功',
    template: updatedTemplate,
  })
})

// 刪除餐點模板
export const deleteDishTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params
  const brandId = req.brandId // 從 requireBrandAccess middleware 取得

  await dishTemplateService.deleteTemplate(id, brandId)

  res.json({
    success: true,
    message: '餐點模板刪除成功',
  })
})

// 獲取餐點模板的選項類別
export const getDishTemplateOptions = asyncHandler(async (req, res) => {
  const { id } = req.params
  const brandId = req.brandId || req.params.brandId // 從 requireBrandAccess middleware 取得

  const options = await dishTemplateService.getTemplateOptions(id, brandId)

  res.json({
    success: true,
    options,
  })
})
