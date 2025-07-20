import * as bundleInstanceService from '../../services/bundle/bundleInstance.js'
import { asyncHandler } from '../../middlewares/error.js'

// 獲取單個 Bundle 實例
export const getBundleInstanceById = asyncHandler(async (req, res) => {
  const { id } = req.params

  const instance = await bundleInstanceService.getInstanceById(id)

  res.json({
    success: true,
    instance,
  })
})

// 創建 Bundle 實例（通常由訂單系統調用）
export const createBundleInstance = asyncHandler(async (req, res) => {
  const instanceData = req.body

  const newInstance = await bundleInstanceService.createInstance(instanceData)

  res.status(201).json({
    success: true,
    message: 'Bundle 實例創建成功',
    instance: newInstance,
  })
})

// 使用點數兌換 Bundle（用戶端功能）
export const redeemBundleWithPoints = asyncHandler(async (req, res) => {
  const { brandId, bundleId } = req.params
  const userId = req.auth.userId // 從認證中間件獲取用戶ID

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: '用戶未認證',
    })
  }

  if (!brandId || !bundleId) {
    return res.status(400).json({
      success: false,
      message: '品牌ID和Bundle ID為必需參數',
    })
  }

  // 調用服務層進行點數兌換
  const result = await bundleInstanceService.redeemBundleWithPoints(bundleId, userId, brandId)

  res.json({
    success: true,
    message: '點數兌換成功',
    data: {
      bundleInstance: result.bundleInstance,
      pointsUsed: result.pointsUsed,
      remainingPoints: result.remainingPoints,
    },
  })
})
