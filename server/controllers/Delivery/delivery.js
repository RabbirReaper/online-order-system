import * as platformManagerService from '../../services/delivery/core/platformManager.js'
import { asyncHandler } from '../../middlewares/error.js'

/**
 * 同步菜單到所有啟用的外送平台
 * @param {Object} req - Express 請求物件
 * @param {Object} res - Express 回應物件
 */
export const syncMenuToAllPlatforms = asyncHandler(async (req, res) => {
  const { brandId, storeId } = req.params

  const result = await platformManagerService.syncMenu(brandId, storeId)

  res.status(200).json({
    success: true,
    message: '菜單同步完成',
    data: result,
  })
})

/**
 * 獲取菜單同步狀態
 * @param {Object} req - Express 請求物件
 * @param {Object} res - Express 回應物件
 */
export const getMenuSyncStatus = asyncHandler(async (req, res) => {
  // 這個功能可以後續擴展，用來查詢同步狀態
  res.status(200).json({
    success: true,
    message: '功能開發中',
    data: null,
  })
})
