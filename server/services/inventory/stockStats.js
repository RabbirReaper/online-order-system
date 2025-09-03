/**
 * 庫存統計服務
 * 處理庫存統計、分析和日誌查詢
 */

import mongoose from 'mongoose'
import Inventory from '../../models/Store/Inventory.js'
import StockLog from '../../models/Store/StockLog.js'
import {
  parseDateString,
  getStartOfDay,
  getEndOfDay,
  createDateRange,
  getTaiwanDateTime,
  dateDifference,
} from '../../utils/date.js'

/**
 * 獲取庫存變更日誌
 * @param {Object} options - 查詢選項
 * @returns {Promise<Object>} 庫存日誌及分頁資訊
 */
export const getInventoryLogs = async (options = {}) => {
  const {
    storeId,
    itemId, // 這是 inventory._id
    inventoryType,
    stockType,
    startDate,
    endDate,
    changeType,
    page = 1,
    limit = 20,
  } = options

  // 構建查詢條件
  const query = { store: storeId }

  // 篩選庫存類型
  if (inventoryType) {
    query.inventoryType = inventoryType
  }

  // 篩選特定項目
  if (itemId) {
    // 首先查找 inventory 項目
    const inventory = await Inventory.findOne({
      _id: itemId,
      store: storeId,
    })

    if (inventory) {
      if (inventory.inventoryType === 'DishTemplate' && inventory.dish) {
        query.dish = inventory.dish
      } else {
        query.itemName = inventory.itemName
      }
    }
  }

  // 篩選庫存類型（總庫存或可販售）
  if (stockType) {
    query.stockType = stockType
  }

  // 使用新的日期工具處理日期範圍
  if (startDate || endDate) {
    query.createdAt = {}

    if (startDate) {
      try {
        const startDateTime = getStartOfDay(parseDateString(startDate))
        query.createdAt.$gte = startDateTime.toJSDate()
      } catch (error) {
        console.error('解析開始日期失敗:', error)
        throw new Error('無效的開始日期格式')
      }
    }

    if (endDate) {
      try {
        const endDateTime = getEndOfDay(parseDateString(endDate))
        query.createdAt.$lte = endDateTime.toJSDate()
      } catch (error) {
        console.error('解析結束日期失敗:', error)
        throw new Error('無效的結束日期格式')
      }
    }
  }

  // 過濾變更類型
  if (changeType) {
    query.changeType = changeType
  }

  // 計算分頁
  const skip = (page - 1) * limit

  // 查詢總數
  const total = await StockLog.countDocuments(query)

  // 查詢日誌
  const logs = await StockLog.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('admin', 'name')
    .populate('order', 'orderDateCode sequence')
    .populate('dish', 'name')
    .populate('store', 'name')

  // 處理分頁資訊
  const totalPages = Math.ceil(total / limit)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return {
    logs,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage,
      hasPrevPage,
    },
  }
}


/**
 * 獲取項目庫存統計
 * @param {Object} options - 查詢選項
 * @returns {Promise<Object>} 庫存統計
 */
export const getItemInventoryStats = async (options = {}) => {
  const {
    storeId,
    itemId, // 這是 inventory._id
    inventoryType = 'DishTemplate',
  } = options

  // 首先查找 inventory 項目
  const inventory = await Inventory.findOne({
    _id: itemId,
    store: storeId,
  })

  if (!inventory) {
    return {
      currentTotalStock: 0,
      currentAvailableStock: 0,
      minStockAlert: 0,
      targetStockLevel: null,
      isTracked: false,
      enableAvailableStock: false,
      isSoldOut: false,
      consumptionRate: 0,
      estimatedDaysLeft: 0,
      lastUpdate: null,
      needsRestock: false,
      stats: {
        last7Days: {
          consumed: 0,
          added: 0,
          damaged: 0,
          netChange: 0,
        },
        last30Days: {
          consumed: 0,
          added: 0,
          damaged: 0,
          netChange: 0,
        },
      },
    }
  }

  // 使用新的日期範圍功能
  const last7DaysRange = createDateRange('last7Days')
  const last30DaysRange = createDateRange('last30Days')

  // 構建查詢條件
  const logQuery = {
    store: storeId,
    inventoryType: inventory.inventoryType,
    createdAt: { $gte: last30DaysRange.start.toJSDate() },
  }

  // 根據庫存類型設置正確的查詢條件
  if (inventory.inventoryType === 'DishTemplate' && inventory.dish) {
    logQuery.dish = inventory.dish
  } else {
    logQuery.itemName = inventory.itemName
  }

  const logs = await StockLog.find(logQuery)

  // 處理統計數據
  const last7DaysLogs = logs.filter((log) => log.createdAt >= last7DaysRange.start.toJSDate())
  const stats = {
    last7Days: {
      consumed: 0,
      added: 0,
      damaged: 0,
      netChange: 0,
    },
    last30Days: {
      consumed: 0,
      added: 0,
      damaged: 0,
      netChange: 0,
    },
  }

  // 計算 7 天內的統計
  last7DaysLogs.forEach((log) => {
    stats.last7Days.netChange += log.changeAmount

    if (log.changeAmount > 0) {
      stats.last7Days.added += log.changeAmount
    } else {
      if (log.changeType === 'order') {
        stats.last7Days.consumed += Math.abs(log.changeAmount)
      } else if (log.changeType === 'damage') {
        stats.last7Days.damaged += Math.abs(log.changeAmount)
      }
    }
  })

  // 計算 30 天內的統計
  logs.forEach((log) => {
    stats.last30Days.netChange += log.changeAmount

    if (log.changeAmount > 0) {
      stats.last30Days.added += log.changeAmount
    } else {
      if (log.changeType === 'order') {
        stats.last30Days.consumed += Math.abs(log.changeAmount)
      } else if (log.changeType === 'damage') {
        stats.last30Days.damaged += Math.abs(log.changeAmount)
      }
    }
  })

  // 計算消耗率 (每天平均消耗量)
  const dailyConsumptionRate = stats.last30Days.consumed / 30

  // 計算預估剩餘天數
  let estimatedDaysLeft = 0
  const effectiveStock = inventory.enableAvailableStock
    ? inventory.availableStock
    : inventory.totalStock

  if (dailyConsumptionRate > 0) {
    estimatedDaysLeft = Math.floor(effectiveStock / dailyConsumptionRate)
  }

  // 查詢最後更新時間
  const lastLog = await StockLog.findOne(logQuery).sort({ createdAt: -1 })

  return {
    currentTotalStock: inventory.totalStock,
    currentAvailableStock: inventory.availableStock,
    minStockAlert: inventory.minStockAlert,
    targetStockLevel: inventory.targetStockLevel,
    isTracked: inventory.isInventoryTracked,
    enableAvailableStock: inventory.enableAvailableStock,
    isSoldOut: inventory.isSoldOut,
    consumptionRate: dailyConsumptionRate,
    estimatedDaysLeft: estimatedDaysLeft,
    lastUpdate: lastLog ? lastLog.createdAt : null,
    needsRestock: inventory.needsRestock,
    stats,
  }
}

/**
 * 獲取庫存健康狀況報告
 * @param {String} storeId - 店鋪ID
 * @param {Object} options - 選項
 * @returns {Promise<Object>} 庫存健康報告
 */
export const getInventoryHealthReport = async (storeId, options = {}) => {
  const { inventoryType, criticalDaysThreshold = 3, overStockDaysThreshold = 30 } = options

  // 構建查詢條件
  const query = {
    store: storeId,
    isInventoryTracked: true,
  }

  if (inventoryType) {
    query.inventoryType = inventoryType
  }

  // 獲取店鋪所有庫存項目
  const inventoryItems = await Inventory.find(query)
    .populate('dish', 'name')
    .populate('brand', 'name')

  // 初始化結果
  const result = {
    total: inventoryItems.length,
    needsRestock: [],
    critical: [],
    soldOut: [],
    healthy: [],
  }

  // 逐一檢查每個庫存項目
  for (const item of inventoryItems) {
    // 獲取詳細統計
    const stats = await getItemInventoryStats({
      storeId,
      itemId: item._id, // 傳入 inventory._id
      inventoryType: item.inventoryType,
    })

    const healthStatus = {
      id: item._id,
      itemType: item.inventoryType,
      itemName: item.itemName,
      dishName: item.dish?.name,
      totalStock: item.totalStock,
      availableStock: item.availableStock,
      dailyConsumption: stats.consumptionRate,
      estimatedDaysLeft: stats.estimatedDaysLeft,
      enableAvailableStock: item.enableAvailableStock,
      isTracked: item.isInventoryTracked,
      isSoldOut: item.isSoldOut,
    }

    // 分類庫存健康狀況
    if (item.isSoldOut) {
      // 售完狀態
      healthStatus.status = 'sold_out'
      result.soldOut.push(healthStatus)
    } else if (item.needsRestock) {
      // 需要補貨（低於警告值）
      healthStatus.status = 'needs_restock'
      result.needsRestock.push(healthStatus)
    } else if (stats.estimatedDaysLeft <= criticalDaysThreshold) {
      // 庫存即將不足
      healthStatus.status = 'critical'
      result.critical.push(healthStatus)
    } else {
      // 健康庫存
      healthStatus.status = 'healthy'
      result.healthy.push(healthStatus)
    }
  }

  return result
}

/**
 * 獲取庫存變更摘要
 * @param {Object} options - 查詢選項
 * @returns {Promise<Object>} 變更摘要
 */
export const getStockChangeSummary = async (options = {}) => {
  const {
    storeId,
    startDate,
    endDate,
    inventoryType,
    groupBy = 'changeType',
    period = null, // 新增：支援使用預設期間
  } = options

  // 構建查詢條件
  const matchConditions = {
    store: new mongoose.Types.ObjectId(storeId),
  }

  if (inventoryType) {
    matchConditions.inventoryType = inventoryType
  }

  // 處理日期範圍
  if (period) {
    // 使用預設期間
    const range = createDateRange(period)
    matchConditions.createdAt = {
      $gte: range.start.toJSDate(),
      $lte: range.end.toJSDate(),
    }
  } else if (startDate || endDate) {
    // 使用自訂日期範圍
    matchConditions.createdAt = {}
    if (startDate) {
      const startDateTime = getStartOfDay(parseDateString(startDate))
      matchConditions.createdAt.$gte = startDateTime.toJSDate()
    }
    if (endDate) {
      const endDateTime = getEndOfDay(parseDateString(endDate))
      matchConditions.createdAt.$lte = endDateTime.toJSDate()
    }
  }

  // 構建聚合管道
  const pipeline = [
    { $match: matchConditions },
    {
      $group: {
        _id: `$${groupBy}`,
        totalChanges: { $sum: 1 },
        totalAmount: { $sum: '$changeAmount' },
        increases: {
          $sum: {
            $cond: [{ $gt: ['$changeAmount', 0] }, '$changeAmount', 0],
          },
        },
        decreases: {
          $sum: {
            $cond: [{ $lt: ['$changeAmount', 0] }, '$changeAmount', 0],
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]

  const summary = await StockLog.aggregate(pipeline)

  return summary.reduce((acc, item) => {
    acc[item._id] = {
      totalChanges: item.totalChanges,
      totalAmount: item.totalAmount,
      increases: item.increases,
      decreases: Math.abs(item.decreases),
    }
    return acc
  }, {})
}
