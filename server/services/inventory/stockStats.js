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
 * @param {String} storeId - 店鋪ID
 * @param {Object} options - 查詢選項
 * @param {String} options.dishId - 餐點ID (可選)
 * @param {Date} options.startDate - 開始日期 (可選)
 * @param {Date} options.endDate - 結束日期 (可選)
 * @param {String} options.changeType - 變更類型 (可選: 'manual_add', 'manual_subtract', 'order', 'system_adjustment', 'initial_stock')
 * @param {Number} options.page - 頁碼 (默認 1)
 * @param {Number} options.limit - 每頁數量 (默認 20)
 * @returns {Promise<Object>} 庫存日誌及分頁資訊
 */
export const getInventoryLogs = async (storeId, options = {}) => {
  const {
    dishId,
    startDate,
    endDate,
    changeType,
    page = 1,
    limit = 20
  } = options;

  // 構建查詢條件
  const query = { store: storeId };

  // 過濾特定餐點
  if (dishId) {
    query.dish = dishId;
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
    .populate('dish', 'name');

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
 * 獲取庫存趨勢數據 (一段時間內的變化)
 * @param {String} storeId - 店鋪ID
 * @param {String} dishId - 餐點ID
 * @param {Number} days - 天數 (默認 30)
 * @returns {Promise<Array>} 庫存趨勢數據
 */
export const getStockTrends = async (storeId, dishId, days = 30) => {
  // 計算開始日期
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  // 查詢此期間的所有庫存日誌
  const logs = await StockLog.find({
    store: storeId,
    dish: dishId,
    createdAt: { $gte: startDate }
  }).sort({ createdAt: 1 });

  // 初始化結果數組
  const trends = [];

  // 生成日期範圍內的每一天
  const currentDate = new Date(startDate);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // 查詢初始庫存
  let initialStock = 0;
  const initialLogBefore = await StockLog.findOne({
    store: storeId,
    dish: dishId,
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

    dayLogs.forEach(log => {
      dayChange += log.changeAmount;

      if (log.changeAmount > 0) {
        additions += log.changeAmount;
      } else if (log.changeAmount < 0) {
        if (log.changeType === 'order') {
          orderConsumption += Math.abs(log.changeAmount);
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
      adjustments: subtractions - orderConsumption
    });

    // 移至下一天
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return trends;
};

/**
 * 獲取餐點庫存統計
 * @param {String} storeId - 店鋪ID
 * @param {String} dishId - 餐點ID
 * @returns {Promise<Object>} 庫存統計
 */
export const getDishInventoryStats = async (storeId, dishId) => {
  // 查詢當前庫存
  const inventory = await Inventory.findOne({
    store: storeId,
    dish: dishId
  });

  if (!inventory) {
    return {
      currentStock: 0,
      dailyLimit: null,
      isTracked: false,
      consumptionRate: 0,
      estimatedDaysLeft: 0,
      lastUpdate: null,
      stats: {
        last7Days: {
          consumed: 0,
          added: 0,
          netChange: 0
        },
        last30Days: {
          consumed: 0,
          added: 0,
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
  const logs = await StockLog.find({
    store: storeId,
    dish: dishId,
    createdAt: { $gte: last30Days }
  });

  // 處理統計數據
  const last7DaysLogs = logs.filter(log => log.createdAt >= last7Days);
  const stats = {
    last7Days: {
      consumed: 0,
      added: 0,
      netChange: 0
    },
    last30Days: {
      consumed: 0,
      added: 0,
      netChange: 0
    }
  };

  // 計算 7 天內的統計
  last7DaysLogs.forEach(log => {
    stats.last7Days.netChange += log.changeAmount;

    if (log.changeAmount > 0) {
      stats.last7Days.added += log.changeAmount;
    } else {
      stats.last7Days.consumed += Math.abs(log.changeAmount);
    }
  });

  // 計算 30 天內的統計
  logs.forEach(log => {
    stats.last30Days.netChange += log.changeAmount;

    if (log.changeAmount > 0) {
      stats.last30Days.added += log.changeAmount;
    } else {
      stats.last30Days.consumed += Math.abs(log.changeAmount);
    }
  });

  // 計算消耗率 (每天平均消耗量)
  const dailyConsumptionRate = stats.last30Days.consumed / 30;

  // 計算預估剩餘天數
  let estimatedDaysLeft = 0;
  if (dailyConsumptionRate > 0) {
    estimatedDaysLeft = Math.floor(inventory.stock / dailyConsumptionRate);
  }

  // 查詢最後更新時間
  const lastLog = await StockLog.findOne({
    store: storeId,
    dish: dishId
  }).sort({ createdAt: -1 });

  return {
    currentStock: inventory.stock,
    dailyLimit: inventory.dailyLimit,
    isTracked: inventory.isInventoryTracked,
    consumptionRate: dailyConsumptionRate,
    estimatedDaysLeft: estimatedDaysLeft,
    lastUpdate: lastLog ? lastLog.createdAt : null,
    stats
  };
};

/**
 * 獲取庫存健康狀況報告
 * 用於識別需要補貨或存貨過多的餐點
 * @param {String} storeId - 店鋪ID
 * @param {Object} options - 選項
 * @param {Number} options.lowStockThreshold - 低庫存閾值 (默認 5)
 * @param {Number} options.criticalDaysThreshold - 庫存不足天數閾值 (默認 3)
 * @param {Number} options.overStockDaysThreshold - 庫存過多天數閾值 (默認 30)
 * @returns {Promise<Object>} 庫存健康報告
 */
export const getInventoryHealthReport = async (storeId, options = {}) => {
  const {
    lowStockThreshold = 5,
    criticalDaysThreshold = 3,
    overStockDaysThreshold = 30
  } = options;

  // 獲取店鋪所有庫存項目
  const inventoryItems = await Inventory.find({
    store: storeId,
    isInventoryTracked: true
  }).populate('dish', 'name');

  // 初始化結果
  const result = {
    total: inventoryItems.length,
    lowStock: [],
    critical: [],
    overstock: [],
    healthy: []
  };

  // 逐一檢查每個庫存項目
  for (const item of inventoryItems) {
    // 獲取詳細統計
    const stats = await getDishInventoryStats(storeId, item.dish._id);
    const healthStatus = {
      id: item.dish._id,
      name: item.dishName,
      stock: item.stock,
      dailyConsumption: stats.consumptionRate,
      estimatedDaysLeft: stats.estimatedDaysLeft
    };

    // 分類庫存健康狀況
    if (item.stock <= lowStockThreshold) {
      // 低庫存
      healthStatus.status = 'low_stock';
      result.lowStock.push(healthStatus);
    } else if (stats.estimatedDaysLeft <= criticalDaysThreshold) {
      // 庫存即將不足
      healthStatus.status = 'critical';
      result.critical.push(healthStatus);
    } else if (stats.consumptionRate > 0 && stats.estimatedDaysLeft > overStockDaysThreshold) {
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
