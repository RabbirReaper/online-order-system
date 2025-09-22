import * as platformStoreService from '../../services/delivery/core/platformStoreService.js'
import { asyncHandler } from '../../middlewares/error.js'

// 獲取所有平台店鋪配置
export const getAllPlatformStores = asyncHandler(async (req, res) => {
  const options = {
    brandId: req.params.brandId,
    storeId: req.params.storeId,
    platform: req.query.platform,
    status: req.query.status,
  }

  const platformStores = await platformStoreService.getAllPlatformStores(options)

  res.status(200).json({
    success: true,
    message: '獲取平台店鋪配置列表成功',
    platformStores,
  })
})

// 根據店鋪ID和平台獲取配置
export const getPlatformStoreByStoreAndPlatform = asyncHandler(async (req, res) => {
  const { storeId } = req.params
  const { platform } = req.query

  if (!platform) {
    return res.status(400).json({
      success: false,
      message: '缺少參數 platform',
    })
  }

  const platformStore = await platformStoreService.getPlatformStoreByStoreAndPlatform(
    storeId,
    platform,
  )

  res.status(200).json({
    success: true,
    message: '獲取平台店鋪配置成功',
    platformStore,
  })
})

// 創建平台店鋪配置
export const createPlatformStore = asyncHandler(async (req, res) => {
  const platformStoreData = {
    ...req.body,
    brand: req.params.brandId,
    store: req.params.storeId,
  }

  const newPlatformStore = await platformStoreService.createPlatformStore(platformStoreData)

  res.status(201).json({
    success: true,
    message: '平台店鋪配置創建成功',
    platformStore: newPlatformStore,
  })
})

// 更新平台店鋪配置
export const updatePlatformStore = asyncHandler(async (req, res) => {
  const { platformStoreId } = req.params
  const updateData = req.body

  const updatedPlatformStore = await platformStoreService.updatePlatformStore(
    platformStoreId,
    updateData,
  )

  res.status(200).json({
    success: true,
    message: '平台店鋪配置更新成功',
    platformStore: updatedPlatformStore,
  })
})

// 刪除平台店鋪配置
export const deletePlatformStore = asyncHandler(async (req, res) => {
  const { platformStoreId } = req.params

  const result = await platformStoreService.deletePlatformStore(platformStoreId)

  res.status(200).json({
    success: true,
    message: '平台店鋪配置刪除成功',
  })
})

// 切換平台店鋪營運狀態
export const togglePlatformStoreStatus = asyncHandler(async (req, res) => {
  const { platformStoreId } = req.params
  const { status } = req.body

  if (!status) {
    return res.status(400).json({
      success: false,
      message: '缺少參數 status',
    })
  }

  const updatedPlatformStore = await platformStoreService.togglePlatformStoreStatus(
    platformStoreId,
    status,
  )

  res.status(200).json({
    success: true,
    message: '平台店鋪營運狀態更新成功',
    platformStore: updatedPlatformStore,
  })
})

// 更新菜單同步時間
export const updateMenuSyncTime = asyncHandler(async (req, res) => {
  const { platformStoreId } = req.params

  const updatedPlatformStore = await platformStoreService.updateMenuSyncTime(platformStoreId)

  res.status(200).json({
    success: true,
    message: '菜單同步時間更新成功',
    platformStore: updatedPlatformStore,
  })
})
