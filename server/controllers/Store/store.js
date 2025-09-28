import * as storeService from '../../services/store/storeManagement.js'
import { asyncHandler } from '../../middlewares/error.js'

// 獲取所有店家
export const getAllStores = async (req, res, next) => {
  const options = {
    brandId: req.params.brandId,
    activeOnly: req.query.activeOnly === 'true',
    search: req.query.search,
  }

  // ✅ 新增：傳入管理員資訊進行權限過濾
  const adminInfo = {
    role: req.auth.role,
    brand: req.auth.brand,
    store: req.auth.store,
  }

  const stores = await storeService.getAllStores(options, adminInfo)

  res.status(200).json({
    success: true,
    message: '獲取店鋪列表成功',
    stores,
  })
}

// 獲取單個店家（完整資料，需要權限）
export const getStoreById = asyncHandler(async (req, res) => {
  try {
    const { storeId } = req.params
    const store = await storeService.getStoreById(storeId)

    res.json({
      success: true,
      store,
    })
  } catch (error) {
    console.error('Error getting store:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
})

// 獲取店家公開資訊（給客戶端使用）
export const getStorePublicInfo = asyncHandler(async (req, res) => {
  try {
    const { storeId } = req.params
    const store = await storeService.getStorePublicInfo(storeId)

    res.json({
      success: true,
      store,
    })
  } catch (error) {
    console.error('Error getting store public info:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
})

// 創建店家
export const createStore = asyncHandler(async (req, res) => {
  try {
    // 使用從 middleware 設置的 brandId
    const storeData = {
      ...req.body,
      brand: req.brandId, // 從 requireBrandAccess middleware 取得
    }

    const newStore = await storeService.createStore(storeData)

    res.json({
      success: true,
      message: 'Store created successfully',
      store: newStore,
    })
  } catch (error) {
    console.error('Error creating store:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
})

// 更新店家
export const updateStore = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params

    const updatedStore = await storeService.updateStore(id, req.body)

    res.json({
      success: true,
      message: 'Store updated successfully',
      store: updatedStore,
    })
  } catch (error) {
    console.error('Error updating store:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
})

// 刪除店家
export const deleteStore = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params
    const result = await storeService.deleteStore(id)

    res.json({
      success: true,
      message: 'Store deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting store:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
})

// 切換店家啟用狀態
export const toggleStoreActive = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params
    const { isActive } = req.body

    if (isActive === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少參數 isActive',
      })
    }

    const store = await storeService.toggleStoreActive(id, isActive)

    res.json({
      success: true,
      message: `Store ${isActive ? 'activated' : 'deactivated'} successfully`,
      store,
    })
  } catch (error) {
    console.error('Error toggling store status:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
})

// 獲取店家營業時間
export const getStoreBusinessHours = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params
    const businessHours = await storeService.getStoreBusinessHours(id)

    res.json({
      success: true,
      businessHours,
    })
  } catch (error) {
    console.error('Error getting business hours:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
})

// 更新店家營業時間
export const updateStoreBusinessHours = asyncHandler(async (req, res) => {
  try {
    const { storeId } = req.params
    const { businessHours } = req.body

    if (!businessHours) {
      return res.status(400).json({
        success: false,
        message: '缺少參數 businessHours',
      })
    }

    const store = await storeService.updateStoreBusinessHours(storeId, businessHours)

    res.json({
      success: true,
      message: 'Business hours updated successfully',
      store,
    })
  } catch (error) {
    console.error('Error updating business hours:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
})

// 更新店家公告
export const updateStoreAnnouncements = asyncHandler(async (req, res) => {
  try {
    const { storeId } = req.params
    const { announcements } = req.body

    if (!announcements) {
      return res.status(400).json({
        success: false,
        message: '缺少參數 announcements',
      })
    }

    const store = await storeService.updateStoreAnnouncements(storeId, announcements)

    res.json({
      success: true,
      message: 'Announcements updated successfully',
      store,
    })
  } catch (error) {
    console.error('Error updating announcements:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
})

// 獲取店家當前營業狀態
export const getStoreCurrentStatus = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params
    const status = await storeService.getStoreCurrentStatus(id)

    res.json({
      success: true,
      status,
    })
  } catch (error) {
    console.error('Error getting store status:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
})

// 更新店家服務設定
export const updateServiceSettings = asyncHandler(async (req, res) => {
  try {
    const { storeId } = req.params
    const { serviceSettings } = req.body

    if (!serviceSettings) {
      return res.status(400).json({
        success: false,
        message: '缺少參數 serviceSettings',
      })
    }

    const store = await storeService.updateStoreServiceSettings(storeId, serviceSettings)

    res.json({
      success: true,
      message: '服務設定更新成功',
      store,
    })
  } catch (error) {
    console.error('Error updating service settings:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
})

// 獲取店家LINE Bot資訊
export const getStoreLineBotInfo = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params
    const lineBotInfo = await storeService.getStoreLineBotInfo(id)

    res.json({
      success: true,
      lineBotInfo,
    })
  } catch (error) {
    console.error('Error getting store LINE bot info:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
})
