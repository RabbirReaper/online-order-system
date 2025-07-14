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
