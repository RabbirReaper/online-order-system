/**
 * 庫存統計服務
 * 處理庫存統計、分析和日誌查詢
 */

import mongoose from 'mongoose';
import Inventory from '../../models/Store/Inventory.js';
import StockLog from '../../models/Store/StockLog.js';
import { getStartOfDay, getEndOfDay } from '../../utils/date.js';

/**
 * 獲取庫存變更日誌
 * @param {Object} options - 查詢選項
 * @returns {Promise<Object>} 庫存日誌及分頁資訊
 */
export const getInventoryLogs = async (options = {}) => {
  const {
    storeId,
    itemId,
    inventoryType = 'dish',
    stockType,
    startDate,
    endDate,
    changeType,
    page = 1,
    limit = 20
  } = options;

  // 構建查詢條件
  const query = { store: storeId };

  // 篩選庫存類型
  if (inventoryType) {
    query.inventoryType = inventoryType;
  }

  // 篩選特定項目
  if (itemId) {
    if (inventoryType === 'dish') {
      query.dish = itemId;
    } else {
      // 對於非餐點類型，itemId 可能是項目名稱
      query.itemName = itemId;
    }
  }

  // 篩選庫存類型（倉庫或可販售）
  if (stockType) {
    query.stockType = stockType;
  }

  // 過濾日期範圍
  if (startDate || endDate) {
    query.createdAt = {};

    if (startDate) {
      query.createdAt.$gte = startDate;
    }

    if (endDate) {
      query.createdAt.$lte = endDate;
    }
  }

  // 過濾變更類型
  if (changeType) {
    query.changeType = changeType;
  }

  // 計算分頁
  const skip = (page - 1) * limit;

  // 查詢總數
  const total = await StockLog.countDocuments(query);

  // 查詢日誌
  const logs = await StockLog.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('admin', 'name')
    .populate('order', 'orderDateCode sequence')
    .populate('dish', 'name')
    .populate('store', 'name');

  // 處理分頁資訊
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    logs,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage,
      hasPrevPage
    }
  };
};

/**
 * 獲取庫存趨勢數據
 * @param {Object} options - 查詢選項
 * @returns {Promise<Array>} 庫存趨勢數據
 */
export const getStockTrends = async (options = {}) => {
  const {
    storeId,
    itemId,
    inventoryType = 'dish',
    stockType = 'warehouseStock',
    days = 30
  } = options;

  // 計算開始日期
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  // 構建查詢條件
  const logQuery = {
    store: storeId,
    inventoryType,
    stockType,
    createdAt: { $gte: startDate }
  };

  if (inventoryType === 'dish' && itemId) {
    logQuery.dish = itemId;
  } else if (itemId) {
    logQuery.itemName = itemId;
  }

  // 查詢此期間的所有庫存日誌
  const logs = await StockLog.find(logQuery).sort({ createdAt: 1 });

  // 初始化結果數組
  const trends = [];

  // 生成日期範圍內的每一天
  const currentDate = new Date(startDate);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // 查詢初始庫存
  let initialStock = 0;
  const initialLogBefore = await StockLog.findOne({
    ...logQuery,
    createdAt: { $lt: startDate }
  }).sort({ createdAt: -1 });

  if (initialLogBefore) {
    initialStock = initialLogBefore.newStock;
  } else {
    // 如果沒有之前的日誌，使用第一筆日誌的 previousStock
    initialStock = logs.length > 0 ? logs[0].previousStock : 0;
  }

  // 初始化當前庫存
  let currentStock = initialStock;

  // 為每一天生成數據
  while (currentDate <= today) {
    const dayStart = getStartOfDay(currentDate).toJSDate();
    const dayEnd = getEndOfDay(currentDate).toJSDate();

    // 查找此日期的日誌
    const dayLogs = logs.filter(log =>
      log.createdAt >= dayStart && log.createdAt <= dayEnd
    );

    // 計算當天的變化量
    let dayChange = 0;
    let additions = 0;
    let subtractions = 0;
    let orderConsumption = 0;
    let damages = 0;

    dayLogs.forEach(log => {
      dayChange += log.changeAmount;

      if (log.changeAmount > 0) {
        additions += log.changeAmount;
      } else if (log.changeAmount < 0) {
        if (log.changeType === 'order') {
          orderConsumption += Math.abs(log.changeAmount);
        } else if (log.changeType === 'damage') {
          damages += Math.abs(log.changeAmount);
        }
        subtractions += Math.abs(log.changeAmount);
      }
    });

    // 更新當前庫存
    currentStock += dayChange;

    // 添加到趨勢數據
    trends.push({
      date: new Date(currentDate),
      endOfDayStock: currentStock,
      dayChange,
      additions,
      subtractions,
      orderConsumption,
      damages,
      adjustments: subtractions - orderConsumption - damages
    });

    // 移至下一天
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return trends;
};

/**
 * 獲取項目庫存統計
 * @param {Object} options - 查詢選項
 * @returns {Promise<Object>} 庫存統計
 */
export const getItemInventoryStats = async (options = {}) => {
  const {
    storeId,
    itemId,
    inventoryType = 'dish'
  } = options;

  // 查詢當前庫存
  const query = {
    store: storeId,
    inventoryType
  };

  if (inventoryType === 'dish') {
    query.dish = itemId;
  } else {
    query._id = itemId;
  }

  const inventory = await Inventory.findOne(query);

  if (!inventory) {
    return {
      currentWarehouseStock: 0,
      currentAvailableStock: 0,
      minStockAlert: 0,
      maxStockLimit: null,
      isTracked: false,
      showToCustomer: false,
      consumptionRate: 0,
      estimatedDaysLeft: 0,
      lastUpdate: null,
      needsRestock: false,
      isOverstock: false,
      stats: {
        last7Days: {
          consumed: 0,
          added: 0,
          damaged: 0,
          netChange: 0
        },
        last30Days: {
          consumed: 0,
          added: 0,
          damaged: 0,
          netChange: 0
        }
      }
    };
  }

  // 計算 7 天和 30 天前的日期
  const today = new Date();
  const last7Days = new Date(today);
  last7Days.setDate(last7Days.getDate() - 7);

  const last30Days = new Date(today);
  last30Days.setDate(last30Days.getDate() - 30);

  // 查詢最近 30 天的庫存變更日誌
  const logQuery = {
    store: storeId,
    inventoryType,
    createdAt: { $gte: last30Days }
  };

  if (inventoryType === 'dish') {
    logQuery.dish = itemId;
  } else {
    logQuery.itemName = inventory.itemName;
  }

  const logs = await StockLog.find(logQuery);

  // 處理統計數據
  const last7DaysLogs = logs.filter(log => log.createdAt >= last7Days);
  const stats = {
    last7Days: {
      consumed: 0,
      added: 0,
      damaged: 0,
      netChange: 0
    },
    last30Days: {
      consumed: 0,
      added: 0,
      damaged: 0,
      netChange: 0
    }
  };

  // 計算 7 天內的統計
  last7DaysLogs.forEach(log => {
    stats.last7Days.netChange += log.changeAmount;

    if (log.changeAmount > 0) {
      stats.last7Days.added += log.changeAmount;
    } else {
      if (log.changeType === 'order') {
        stats.last7Days.consumed += Math.abs(log.changeAmount);
      } else if (log.changeType === 'damage') {
        stats.last7Days.damaged += Math.abs(log.changeAmount);
      }
    }
  });

  // 計算 30 天內的統計
  logs.forEach(log => {
    stats.last30Days.netChange += log.changeAmount;

    if (log.changeAmount > 0) {
      stats.last30Days.added += log.changeAmount;
    } else {
      if (log.changeType === 'order') {
        stats.last30Days.consumed += Math.abs(log.changeAmount);
      } else if (log.changeType === 'damage') {
        stats.last30Days.damaged += Math.abs(log.changeAmount);
      }
    }
  });

  // 計算消耗率 (每天平均消耗量)
  const dailyConsumptionRate = stats.last30Days.consumed / 30;

  // 計算預估剩餘天數（基於可販售庫存）
  let estimatedDaysLeft = 0;
  if (dailyConsumptionRate > 0) {
    estimatedDaysLeft = Math.floor(inventory.availableStock / dailyConsumptionRate);
  }

  // 查詢最後更新時間
  const lastLog = await StockLog.findOne(logQuery).sort({ createdAt: -1 });

  return {
    currentWarehouseStock: inventory.warehouseStock,
    currentAvailableStock: inventory.availableStock,
    minStockAlert: inventory.minStockAlert,
    maxStockLimit: inventory.maxStockLimit,
    isTracked: inventory.isInventoryTracked,
    showToCustomer: inventory.showAvailableStockToCustomer,
    consumptionRate: dailyConsumptionRate,
    estimatedDaysLeft: estimatedDaysLeft,
    lastUpdate: lastLog ? lastLog.createdAt : null,
    needsRestock: inventory.needsRestock,
    isOverstock: inventory.isOverstock,
    stats
  };
};

/**
 * 獲取庫存健康狀況報告
 * @param {String} storeId - 店鋪ID
 * @param {Object} options - 選項
 * @returns {Promise<Object>} 庫存健康報告
 */
export const getInventoryHealthReport = async (storeId, options = {}) => {
  const {
    inventoryType,
    criticalDaysThreshold = 3,
    overStockDaysThreshold = 30
  } = options;

  // 構建查詢條件
  const query = {
    store: storeId,
    isInventoryTracked: true
  };

  if (inventoryType) {
    query.inventoryType = inventoryType;
  }

  // 獲取店鋪所有庫存項目
  const inventoryItems = await Inventory.find(query)
    .populate('dish', 'name')
    .populate('brand', 'name');

  // 初始化結果
  const result = {
    total: inventoryItems.length,
    needsRestock: [],
    critical: [],
    overstock: [],
    healthy: []
  };

  // 逐一檢查每個庫存項目
  for (const item of inventoryItems) {
    // 獲取詳細統計
    const stats = await getItemInventoryStats({
      storeId,
      itemId: item.inventoryType === 'dish' ? item.dish._id : item._id,
      inventoryType: item.inventoryType
    });

    const healthStatus = {
      id: item._id,
      itemType: item.inventoryType,
      itemName: item.itemName,
      dishName: item.dish?.name,
      warehouseStock: item.warehouseStock,
      availableStock: item.availableStock,
      dailyConsumption: stats.consumptionRate,
      estimatedDaysLeft: stats.estimatedDaysLeft
    };

    // 分類庫存健康狀況
    if (item.needsRestock) {
      // 需要補貨（低於警告值）
      healthStatus.status = 'needs_restock';
      result.needsRestock.push(healthStatus);
    } else if (stats.estimatedDaysLeft <= criticalDaysThreshold) {
      // 庫存即將不足
      healthStatus.status = 'critical';
      result.critical.push(healthStatus);
    } else if (item.isOverstock) {
      // 庫存過多
      healthStatus.status = 'overstock';
      result.overstock.push(healthStatus);
    } else {
      // 健康庫存
      healthStatus.status = 'healthy';
      result.healthy.push(healthStatus);
    }
  }

  return result;
};

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
    groupBy = 'changeType' // 'changeType', 'itemName', 'stockType'
  } = options;

  // 構建查詢條件
  const matchConditions = {
    store: new mongoose.Types.ObjectId(storeId)
  };

  if (inventoryType) {
    matchConditions.inventoryType = inventoryType;
  }

  if (startDate || endDate) {
    matchConditions.createdAt = {};
    if (startDate) matchConditions.createdAt.$gte = new Date(startDate);
    if (endDate) matchConditions.createdAt.$lte = new Date(endDate);
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
            $cond: [{ $gt: ['$changeAmount', 0] }, '$changeAmount', 0]
          }
        },
        decreases: {
          $sum: {
            $cond: [{ $lt: ['$changeAmount', 0] }, '$changeAmount', 0]
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ];

  const summary = await StockLog.aggregate(pipeline);

  return summary.reduce((acc, item) => {
    acc[item._id] = {
      totalChanges: item.totalChanges,
      totalAmount: item.totalAmount,
      increases: item.increases,
      decreases: Math.abs(item.decreases)
    };
    return acc;
  }, {});
};
