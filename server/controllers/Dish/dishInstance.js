import * as dishService from '../../services/dish/index.js'
import { asyncHandler } from '../../middlewares/error.js'

// 獲取所有餐點實例
export const getAllDishInstances = asyncHandler(async (req, res) => {
  const options = {
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 20,
  }

  const result = await dishService.instance.getAllInstances(options)

  res.json({
    success: true,
    instances: result.instances,
    pagination: result.pagination,
  })
})

// 獲取單個餐點實例
export const getDishInstanceById = asyncHandler(async (req, res) => {
  const { id } = req.params

  const instance = await dishService.instance.getInstanceById(id)

  res.json({
    success: true,
    instance,
  })
})

// 創建餐點實例
export const createDishInstance = asyncHandler(async (req, res) => {
  const instanceData = req.body

  // 檢查必要欄位
  if (!instanceData.templateId || !instanceData.brand) {
    return res.status(400).json({
      success: false,
      message: '餐點模板ID和品牌ID為必填欄位',
    })
  }

  const newInstance = await dishService.instance.createInstance(instanceData)

  res.status(201).json({
    success: true,
    message: '餐點實例創建成功',
    instance: newInstance,
  })
})

// 更新餐點實例
export const updateDishInstance = asyncHandler(async (req, res) => {
  const { id } = req.params
  const updateData = req.body

  const updatedInstance = await dishService.instance.updateInstance(id, updateData)

  res.json({
    success: true,
    message: '餐點實例更新成功',
    instance: updatedInstance,
  })
})

// 刪除餐點實例
export const deleteDishInstance = asyncHandler(async (req, res) => {
  const { id } = req.params

  const result = await dishService.instance.deleteInstance(id)

  res.json({
    success: true,
    message: '餐點實例刪除成功',
  })
})

// 計算餐點最終價格
export const calculateFinalPrice = asyncHandler(async (req, res) => {
  const instanceData = req.body

  // 檢查必要欄位
  if (!instanceData.basePrice) {
    return res.status(400).json({
      success: false,
      message: '基本價格為必填欄位',
    })
  }

  const finalPrice = dishService.instance.calculateFinalPrice(instanceData)

  res.json({
    success: true,
    finalPrice,
  })
})
