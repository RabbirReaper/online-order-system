import * as inventoryService from '../../services/inventory/index.js'
import { asyncHandler } from '../../middlewares/error.js'

// 獲取店鋪庫存列表
export const getStoreInventory = asyncHandler(async (req, res) => {
  try {
    const { storeId } = req.params
    const options = {
      inventoryType: req.query.inventoryType,
      onlyAvailable: req.query.onlyAvailable === 'true',
      search: req.query.search || '',
    }

    const inventory = await inventoryService.management.getStoreInventory(storeId, options)

    res.json({
      success: true,
      inventory,
    })
  } catch (error) {
    console.error('Error getting store inventory:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
})

// 獲取單個庫存項目
export const getInventoryItem = asyncHandler(async (req, res) => {
  try {
    const { storeId, inventoryId } = req.params

    const inventoryItem = await inventoryService.management.getInventoryItem(storeId, inventoryId)

    res.json({
      success: true,
      inventoryItem,
    })
  } catch (error) {
    console.error('Error getting inventory item:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
})

// 創建庫存項目
export const createInventory = asyncHandler(async (req, res) => {
  try {
    const { storeId } = req.params
    const adminId = req.auth.id // 使用新的 auth 物件
    const brandId = req.brandId // 從 requireBrandAccess middleware 取得

    const inventoryData = {
      ...req.body,
      brandId,
      storeId,
    }

    const newInventoryItem = await inventoryService.management.createInventory(
      inventoryData,
      adminId,
    )

    res.status(201).json({
      success: true,
      message: '庫存創建成功',
      inventoryItem: newInventoryItem,
    })
  } catch (error) {
    console.error('Error creating inventory:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
})

// 更新庫存項目
export const updateInventory = asyncHandler(async (req, res) => {
  try {
    const { storeId, inventoryId } = req.params
    const adminId = req.auth.id

    const updateData = {
      ...req.body,
      storeId,
      inventoryId,
    }

    const updatedInventoryItem = await inventoryService.management.updateInventory(
      updateData,
      adminId,
    )

    res.json({
      success: true,
      message: '庫存更新成功',
      inventoryItem: updatedInventoryItem,
    })
  } catch (error) {
    console.error('Error updating inventory:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
})

// 設定可用庫存
export const setAvailableStock = asyncHandler(async (req, res) => {
  try {
    const { storeId, inventoryId } = req.params
    const { availableStock, reason } = req.body
    const adminId = req.auth.id

    const setData = {
      storeId,
      inventoryId,
      availableStock,
      reason,
      adminId,
    }

    const updatedInventoryItem = await inventoryService.management.setAvailableStock(setData)

    res.json({
      success: true,
      message: '可用庫存設定成功',
      inventoryItem: updatedInventoryItem,
    })
  } catch (error) {
    console.error('Error setting available stock:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
})

// 減少庫存（訂單消耗）
export const reduceStock = asyncHandler(async (req, res) => {
  try {
    const { storeId, inventoryId } = req.params
    const { quantity, reason, orderId } = req.body
    const adminId = req.auth.id

    const reduceData = {
      storeId,
      inventoryId,
      quantity,
      reason,
      orderId,
      adminId,
      inventoryType: req.body.inventoryType || 'DishTemplate',
    }

    await inventoryService.management.reduceStock(reduceData)

    res.json({
      success: true,
      message: '庫存減少成功',
    })
  } catch (error) {
    console.error('Error reducing stock:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
})

// 增加庫存
export const addStock = asyncHandler(async (req, res) => {
  try {
    const { storeId, inventoryId } = req.params
    const { quantity, reason, stockType = 'totalStock' } = req.body
    const adminId = req.auth.id

    const addData = {
      storeId,
      inventoryId,
      quantity,
      reason,
      stockType,
      adminId,
      inventoryType: req.body.inventoryType || 'DishTemplate',
    }

    await inventoryService.management.addStock(addData)

    res.json({
      success: true,
      message: '庫存增加成功',
    })
  } catch (error) {
    console.error('Error adding stock:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
})

// 損耗處理
export const processDamage = asyncHandler(async (req, res) => {
  try {
    const { storeId, inventoryId } = req.params
    const { quantity, reason, stockType = 'totalStock' } = req.body
    const adminId = req.auth.id

    const damageData = {
      storeId,
      inventoryId,
      quantity,
      reason,
      stockType,
      adminId,
      inventoryType: req.body.inventoryType || 'DishTemplate',
    }

    await inventoryService.management.processDamage(damageData)

    res.json({
      success: true,
      message: '損耗處理成功',
    })
  } catch (error) {
    console.error('Error processing damage:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
})

// 初始化店鋪所有餐點的庫存
export const initializeDishInventory = asyncHandler(async (req, res) => {
  try {
    const { storeId } = req.params
    const adminId = req.auth.id

    const result = await inventoryService.management.initializeDishInventory(storeId, adminId)

    res.json({
      success: true,
      message: '餐點庫存初始化成功',
      result,
    })
  } catch (error) {
    console.error('Error initializing dish inventory:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
})

// 切換庫存項目售完狀態
export const toggleSoldOut = asyncHandler(async (req, res) => {
  try {
    const { storeId, inventoryId } = req.params
    const { isSoldOut } = req.body
    const adminId = req.auth.id

    if (isSoldOut === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少參數 isSoldOut',
      })
    }

    const inventoryItem = await inventoryService.management.toggleSoldOut(
      storeId,
      inventoryId,
      isSoldOut,
      adminId,
    )

    res.json({
      success: true,
      message: `庫存項目已${isSoldOut ? '設為售完' : '取消售完'}`,
      inventoryItem,
    })
  } catch (error) {
    console.error('Error toggling sold out status:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
})

// 獲取庫存變更日誌
export const getInventoryLogs = asyncHandler(async (req, res) => {
  try {
    const { storeId } = req.params
    const options = {
      storeId,
      itemId: req.query.inventoryId || req.query.itemId, // 向後兼容
      inventoryType: req.query.inventoryType,
      stockType: req.query.stockType,
      startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
      changeType: req.query.changeType,
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 20,
    }

    const logs = await inventoryService.stats.getInventoryLogs(options)

    res.json({
      success: true,
      logs: logs.logs,
      pagination: logs.pagination,
    })
  } catch (error) {
    console.error('Error getting inventory logs:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
})

// 獲取庫存趨勢
export const getStockTrends = asyncHandler(async (req, res) => {
  try {
    const { storeId, inventoryId } = req.params
    const options = {
      storeId,
      itemId: inventoryId, // 服務層內部仍使用 itemId，所以這裡轉換
      inventoryType: req.query.inventoryType || 'DishTemplate',
      stockType: req.query.stockType || 'totalStock',
      days: parseInt(req.query.days, 10) || 30,
    }

    const trends = await inventoryService.stats.getStockTrends(options)

    res.json({
      success: true,
      trends,
    })
  } catch (error) {
    console.error('Error getting stock trends:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
})

// 獲取項目庫存統計
export const getItemInventoryStats = asyncHandler(async (req, res) => {
  try {
    const { storeId, inventoryId } = req.params
    const options = {
      storeId,
      itemId: inventoryId, // 服務層內部仍使用 itemId，所以這裡轉換
      inventoryType: req.query.inventoryType || 'DishTemplate',
    }

    const stats = await inventoryService.stats.getItemInventoryStats(options)

    res.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error('Error getting item inventory stats:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
})

// 獲取庫存健康狀況報告
export const getInventoryHealthReport = asyncHandler(async (req, res) => {
  try {
    const { storeId } = req.params
    const options = {
      inventoryType: req.query.inventoryType,
      criticalDaysThreshold: parseInt(req.query.criticalDaysThreshold, 10) || 3,
      overStockDaysThreshold: parseInt(req.query.overStockDaysThreshold, 10) || 30,
    }

    const report = await inventoryService.stats.getInventoryHealthReport(storeId, options)

    res.json({
      success: true,
      report,
    })
  } catch (error) {
    console.error('Error getting inventory health report:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
})

// 批量更新庫存
export const bulkUpdateInventory = asyncHandler(async (req, res) => {
  try {
    const { storeId } = req.params
    const { items } = req.body
    const adminId = req.auth.id

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: '缺少有效的庫存數據',
      })
    }

    const results = await inventoryService.management.bulkUpdateInventory(storeId, items, adminId)

    res.json({
      success: true,
      message: '批量庫存更新成功',
      results,
    })
  } catch (error) {
    console.error('Error bulk updating inventory:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
})

// 獲取庫存變更摘要
export const getStockChangeSummary = asyncHandler(async (req, res) => {
  try {
    const { storeId } = req.params
    const options = {
      storeId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      inventoryType: req.query.inventoryType,
      groupBy: req.query.groupBy || 'changeType',
    }

    const summary = await inventoryService.stats.getStockChangeSummary(options)

    res.json({
      success: true,
      summary,
    })
  } catch (error) {
    console.error('Error getting stock change summary:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
})
