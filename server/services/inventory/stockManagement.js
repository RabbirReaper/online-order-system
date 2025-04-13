/**
 * 庫存管理服務
 * 處理庫存的增加、減少、更新等操作
 */

import mongoose from 'mongoose';
import Inventory from '../../models/Store/Inventory.js';
import StockLog from '../../models/Store/StockLog.js';
import { AppError } from '../../middlewares/error.js';

/**
 * 獲取店鋪庫存列表
 * @param {String} storeId - 店鋪ID
 * @param {Object} options - 查詢選項
 * @param {Boolean} options.onlyAvailable - 是否只顯示有庫存的項目 (默認 false)
 * @param {String} options.search - 搜尋關鍵字 (默認 '')
 * @returns {Promise<Array>} 庫存列表
 */
export const getStoreInventory = async (storeId, options = {}) => {
  const { onlyAvailable = false, search = '' } = options;

  // 構建查詢條件
  const query = { store: storeId };

  // 只顯示有庫存的項目
  if (onlyAvailable) {
    query.stock = { $gt: 0 };
  }

  // 搜尋關鍵字
  if (search) {
    query.dishName = { $regex: search, $options: 'i' };
  }

  // 查詢庫存
  const inventory = await Inventory.find(query)
    .populate('dish')
    .sort({ dishName: 1 });

  return inventory;
};

/**
 * 獲取單個庫存項目
 * @param {String} storeId - 店鋪ID
 * @param {String} dishId - 餐點ID
 * @returns {Promise<Object>} 庫存項目
 */
export const getInventoryItem = async (storeId, dishId) => {
  const inventoryItem = await Inventory.findOne({
    store: storeId,
    dish: dishId
  }).populate('dish');

  if (!inventoryItem) {
    throw new AppError('找不到此餐點的庫存資訊', 404);
  }

  return inventoryItem;
};

/**
 * 創建新的庫存項目
 * @param {String} storeId - 店鋪ID
 * @param {String} dishId - 餐點ID
 * @param {String} dishName - 餐點名稱
 * @param {Number} initialStock - 初始庫存量
 * @param {Number} dailyLimit - 每日限制數量 (可選)
 * @param {Boolean} isInventoryTracked - 是否追蹤庫存 (默認 true)
 * @param {String} adminId - 管理員ID
 * @returns {Promise<Object>} 新創建的庫存項目
 */
export const createInventory = async (storeId, dishId, dishName, initialStock, dailyLimit = null, isInventoryTracked = true, adminId) => {
  // 檢查餐點是否已經在庫存中
  const existingInventory = await Inventory.findOne({
    store: storeId,
    dish: dishId
  });

  if (existingInventory) {
    throw new AppError('此餐點已在庫存中', 400);
  }

  // 創建新庫存項目
  const newInventory = new Inventory({
    store: storeId,
    dish: dishId,
    dishName,
    stock: initialStock,
    dailyLimit,
    isInventoryTracked
  });

  // 保存庫存項目
  await newInventory.save();

  // 如果有初始庫存，創建庫存日誌
  if (initialStock > 0) {
    await StockLog.create({
      store: storeId,
      dish: dishId,
      dishName,
      previousStock: 0,
      newStock: initialStock,
      changeAmount: initialStock,
      changeType: 'initial_stock',
      reason: '初始庫存設置',
      admin: adminId
    });
  }

  return newInventory;
};

/**
 * 更新庫存
 * @param {String} storeId - 店鋪ID
 * @param {String} dishId - 餐點ID
 * @param {Object} updateData - 更新數據
 * @param {Number} updateData.stock - 新庫存量 (可選)
 * @param {Number} updateData.changeAmount - 庫存變化量 (可選)
 * @param {Number} updateData.dailyLimit - 每日限制數量 (可選)
 * @param {Boolean} updateData.isInventoryTracked - 是否追蹤庫存 (可選)
 * @param {String} updateData.reason - 變更原因 (必填)
 * @param {String} adminId - 管理員ID
 * @returns {Promise<Object>} 更新後的庫存項目
 */
export const updateInventory = async (storeId, dishId, updateData, adminId) => {
  // 檢查必填項
  if (!updateData.reason) {
    throw new AppError('庫存變更必須提供原因', 400);
  }

  // 查找庫存項目
  const inventoryItem = await Inventory.findOne({
    store: storeId,
    dish: dishId
  });

  if (!inventoryItem) {
    throw new AppError('找不到此餐點的庫存資訊', 404);
  }

  // 記錄先前的庫存
  const previousStock = inventoryItem.stock;
  let newStock = previousStock;
  let changeAmount = 0;
  let changeType = '';

  // 如果提供了新庫存量
  if (updateData.stock !== undefined) {
    newStock = updateData.stock;
    changeAmount = newStock - previousStock;
    changeType = changeAmount > 0 ? 'manual_add' : 'manual_subtract';
  }
  // 如果提供了變化量
  else if (updateData.changeAmount !== undefined) {
    changeAmount = updateData.changeAmount;
    newStock = previousStock + changeAmount;
    changeType = changeAmount > 0 ? 'manual_add' : 'manual_subtract';
  }

  // 確保庫存不為負數
  if (newStock < 0) {
    throw new AppError('庫存不能為負數', 400);
  }

  // 更新庫存
  inventoryItem.stock = newStock;

  // 更新每日限制 (如果提供)
  if (updateData.dailyLimit !== undefined) {
    inventoryItem.dailyLimit = updateData.dailyLimit;
  }

  // 更新庫存追蹤狀態 (如果提供)
  if (updateData.isInventoryTracked !== undefined) {
    inventoryItem.isInventoryTracked = updateData.isInventoryTracked;
  }

  // 保存庫存項目
  await inventoryItem.save();

  // 如果庫存有變化，創建庫存日誌
  if (changeAmount !== 0) {
    await StockLog.create({
      store: storeId,
      dish: dishId,
      dishName: inventoryItem.dishName,
      previousStock,
      newStock,
      changeAmount,
      changeType,
      reason: updateData.reason,
      admin: adminId
    });
  }

  return inventoryItem;
};

/**
 * 減少庫存
 * @param {String} storeId - 店鋪ID
 * @param {String} dishId - 餐點ID
 * @param {Number} quantity - 減少的數量
 * @param {String} reason - 減少原因
 * @param {String} orderId - 訂單ID (可選)
 * @param {String} adminId - 管理員ID (可選)
 * @returns {Promise<Boolean>} 操作是否成功
 */
export const reduceStock = async (storeId, dishId, quantity, reason, orderId = null, adminId = null) => {
  // 查找庫存項目
  const inventoryItem = await Inventory.findOne({
    store: storeId,
    dish: dishId
  });

  if (!inventoryItem) {
    throw new AppError('找不到此餐點的庫存資訊', 404);
  }

  // 如果不追蹤庫存，直接返回成功
  if (!inventoryItem.isInventoryTracked) {
    return true;
  }

  // 檢查庫存是否足夠
  if (inventoryItem.stock < quantity) {
    throw new AppError('庫存不足', 400);
  }

  // 檢查每日限制
  if (inventoryItem.dailyLimit !== null && inventoryItem.dailyLimit < quantity) {
    throw new AppError('超過每日可售數量限制', 400);
  }

  // 記錄先前的庫存
  const previousStock = inventoryItem.stock;

  // 更新庫存
  inventoryItem.stock -= quantity;

  // 更新每日限制 (如果有)
  if (inventoryItem.dailyLimit !== null) {
    inventoryItem.dailyLimit -= quantity;
  }

  // 創建庫存日誌
  await StockLog.create({
    store: storeId,
    dish: dishId,
    dishName: inventoryItem.dishName,
    previousStock,
    newStock: inventoryItem.stock,
    changeAmount: -quantity,
    changeType: orderId ? 'order' : 'manual_subtract',
    reason: reason || '訂單消耗',
    order: orderId,
    admin: adminId
  });

  // 保存庫存項目
  await inventoryItem.save();

  return true;
};

/**
 * 增加庫存
 * @param {String} storeId - 店鋪ID
 * @param {String} dishId - 餐點ID
 * @param {Number} quantity - 增加的數量
 * @param {String} reason - 增加原因
 * @param {String} adminId - 管理員ID
 * @returns {Promise<Boolean>} 操作是否成功
 */
export const addStock = async (storeId, dishId, quantity, reason, adminId) => {
  // 查找庫存項目
  const inventoryItem = await Inventory.findOne({
    store: storeId,
    dish: dishId
  });

  if (!inventoryItem) {
    throw new AppError('找不到此餐點的庫存資訊', 404);
  }

  // 如果不追蹤庫存，直接返回成功
  if (!inventoryItem.isInventoryTracked) {
    return true;
  }

  // 記錄先前的庫存
  const previousStock = inventoryItem.stock;

  // 更新庫存
  inventoryItem.stock += quantity;

  // 創建庫存日誌
  await StockLog.create({
    store: storeId,
    dish: dishId,
    dishName: inventoryItem.dishName,
    previousStock,
    newStock: inventoryItem.stock,
    changeAmount: quantity,
    changeType: 'manual_add',
    reason: reason || '手動增加庫存',
    admin: adminId
  });

  // 保存庫存項目
  await inventoryItem.save();

  return true;
};

/**
 * 設置每日限制
 * @param {String} storeId - 店鋪ID
 * @param {String} dishId - 餐點ID
 * @param {Number} newLimit - 新的每日限制數量 (null 表示無限制)
 * @returns {Promise<Boolean>} 操作是否成功
 */
export const setDailyLimit = async (storeId, dishId, newLimit) => {
  // 查找庫存項目
  const inventoryItem = await Inventory.findOne({
    store: storeId,
    dish: dishId
  });

  if (!inventoryItem) {
    throw new AppError('找不到此餐點的庫存資訊', 404);
  }

  // 更新每日限制
  inventoryItem.dailyLimit = newLimit;

  // 保存庫存項目
  await inventoryItem.save();

  return true;
};

/**
 * 還原已取消訂單的庫存
 * @param {Object} order - 訂單對象
 * @returns {Promise<Boolean>} 操作是否成功
 */
export const restoreInventoryForCancelledOrder = async (order) => {
  // 確保訂單已取消
  if (order.status !== 'cancelled') {
    throw new AppError('只有已取消的訂單可以還原庫存', 400);
  }

  // 查找相關的庫存日誌
  const stockLogs = await StockLog.find({
    order: order._id,
    changeType: 'order'
  });

  // 如果沒有相關日誌，返回成功
  if (stockLogs.length === 0) {
    return true;
  }

  // 逐一還原庫存
  for (const log of stockLogs) {
    // 查找庫存項目
    const inventoryItem = await Inventory.findOne({
      store: log.store,
      dish: log.dish
    });

    if (!inventoryItem) {
      continue; // 如果庫存項目不存在，跳過處理
    }

    // 如果不追蹤庫存，跳過處理
    if (!inventoryItem.isInventoryTracked) {
      continue;
    }

    // 記錄先前的庫存
    const previousStock = inventoryItem.stock;

    // 還原庫存 (因為減少庫存時 changeAmount 是負數，所以還原時取負值)
    inventoryItem.stock -= log.changeAmount;

    // 創建庫存日誌
    await StockLog.create({
      store: log.store,
      dish: log.dish,
      dishName: log.dishName,
      previousStock,
      newStock: inventoryItem.stock,
      changeAmount: -log.changeAmount,
      changeType: 'system_adjustment',
      reason: `訂單取消還原庫存: #${order.orderDateCode}${order.sequence.toString().padStart(3, '0')}`,
      order: order._id
    });

    // 保存庫存項目
    await inventoryItem.save();
  }

  return true;
};

/**
 * 重置每日限制
 * 這個函數通常在每日結束時通過排程任務調用
 * @param {String} storeId - 店鋪ID (可選，如果不提供則重置所有店鋪)
 * @returns {Promise<Number>} 重置的項目數量
 */
export const resetDailyLimits = async (storeId = null) => {
  // 構建查詢條件
  const query = {
    isInventoryTracked: true,
    dailyLimit: { $ne: null }
  };

  // 如果指定了店鋪，只重置該店鋪的限制
  if (storeId) {
    query.store = storeId;
  }

  // 獲取所有需要重置的庫存項目
  const inventoryItems = await Inventory.find(query);

  // 逐一重置每日限制
  let resetCount = 0;
  for (const item of inventoryItems) {
    // 根據餐點模板查找原始設定
    // 注意：這個邏輯可能需要根據實際業務調整
    // 這裡假設每日限制重置為與庫存相同的值
    item.dailyLimit = item.stock;
    await item.save();
    resetCount++;
  }

  return resetCount;
};

/**
 * 批量更新庫存
 * 適用於從主數據庫同步多個餐點的庫存
 * @param {String} storeId - 店鋪ID
 * @param {Array} items - 餐點庫存數據陣列 [{dishId, dishName, stock, dailyLimit, isInventoryTracked}]
 * @param {String} adminId - 管理員ID
 * @returns {Promise<Object>} 更新結果
 */
export const bulkUpdateInventory = async (storeId, items, adminId) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('無效的庫存數據', 400);
  }

  const results = {
    updated: 0,
    created: 0,
    errors: []
  };

  // 逐一處理每個項目
  for (const item of items) {
    try {
      // 檢查必要字段
      if (!item.dishId || !item.dishName) {
        results.errors.push({
          dishId: item.dishId || 'unknown',
          error: '缺少必要欄位'
        });
        continue;
      }

      // 查找現有庫存項目
      const existingItem = await Inventory.findOne({
        store: storeId,
        dish: item.dishId
      });

      if (existingItem) {
        // 更新現有項目
        const updateData = {
          reason: '批量更新庫存'
        };

        if (item.stock !== undefined) {
          updateData.stock = item.stock;
        }

        if (item.dailyLimit !== undefined) {
          updateData.dailyLimit = item.dailyLimit;
        }

        if (item.isInventoryTracked !== undefined) {
          updateData.isInventoryTracked = item.isInventoryTracked;
        }

        await updateInventory(storeId, item.dishId, updateData, adminId);
        results.updated++;
      } else {
        // 創建新項目
        await createInventory(
          storeId,
          item.dishId,
          item.dishName,
          item.stock || 0,
          item.dailyLimit || null,
          item.isInventoryTracked !== undefined ? item.isInventoryTracked : true,
          adminId
        );
        results.created++;
      }
    } catch (error) {
      results.errors.push({
        dishId: item.dishId || 'unknown',
        error: error.message
      });
    }
  }

  return results;
};
