import * as voucherService from '../../services/promotion/index.js'
import { asyncHandler } from '../../middlewares/error.js'

// 獲取所有兌換券模板
export const getAllVoucherTemplates = asyncHandler(async (req, res) => {
  const brandId = req.brandId || req.params.brandId

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: 'brandId 為必須參數',
    })
  }

  const templates = await voucherService.voucher.getAllVoucherTemplates(brandId)

  res.json({
    success: true,
    templates,
  })
})

// 獲取單個兌換券模板
export const getVoucherTemplateById = asyncHandler(async (req, res) => {
  const { id } = req.params
  const brandId = req.brandId || req.params.brandId

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: 'brandId 為必須參數',
    })
  }

  const template = await voucherService.voucher.getVoucherTemplateById(id, brandId)

  res.json({
    success: true,
    template,
  })
})

// 創建兌換券模板
export const createVoucherTemplate = asyncHandler(async (req, res) => {
  const brandId = req.brandId || req.params.brandId

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: '品牌ID為必須參數',
    })
  }

  const templateData = req.body
  templateData.brand = brandId

  const newTemplate = await voucherService.voucher.createVoucherTemplate(templateData)

  res.status(201).json({
    success: true,
    message: '兌換券模板創建成功',
    template: newTemplate,
  })
})

// 更新兌換券模板
export const updateVoucherTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params
  const brandId = req.brandId || req.params.brandId

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: '品牌ID為必須參數',
    })
  }

  const updateData = req.body

  const updatedTemplate = await voucherService.voucher.updateVoucherTemplate(
    id,
    updateData,
    brandId,
  )

  res.json({
    success: true,
    message: '兌換券模板更新成功',
    template: updatedTemplate,
  })
})

// 刪除兌換券模板
export const deleteVoucherTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params
  const brandId = req.brandId || req.params.brandId

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: '品牌ID為必須參數',
    })
  }

  await voucherService.voucher.deleteVoucherTemplate(id, brandId)

  res.json({
    success: true,
    message: '兌換券模板刪除成功',
  })
})

// 獲取可用的兌換券模板（供 Bundle 創建時使用）
export const getAvailableVoucherTemplates = asyncHandler(async (req, res) => {
  const brandId = req.brandId || req.params.brandId

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: 'brandId 為必須參數',
    })
  }

  const templates = await voucherService.voucher.getAvailableVoucherTemplates(brandId)

  res.json({
    success: true,
    templates,
  })
})

// 自動檢查並創建餐點兌換券模板
export const autoCreateVoucherTemplatesForDishes = asyncHandler(async (req, res) => {
  const brandId = req.brandId || req.params.brandId

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: '品牌ID為必須參數',
    })
  }

  const result = await voucherService.voucher.autoCreateVoucherTemplatesForDishes(brandId)

  res.json({
    success: true,
    message: `自動創建兌換券模板完成`,
    statistics: result.statistics,
    createdTemplates: result.createdTemplates,
  })
})
