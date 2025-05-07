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
 * @param {String} options.inventoryType - 庫存類型（dish、else）
 * @param {Boolean} options.onlyAvailable - 是否只顯示有庫存的項目
 * @param {String} options.search - 搜尋關鍵字
 * @returns {Promise<Array>} 庫存列表
 */
export const getStoreInventory = async (storeId, options = {}) => {
  const { inventoryType, onlyAvailable = false, search = '' } = options;

  // 構建查詢條件
  const query = { store: storeId };

  // 篩選庫存類型
  if (inventoryType) {
    query.inventoryType = inventoryType;
  }

  // 只顯示有庫存的項目
  if (onlyAvailable) {
    query.availableStock = { $gt: 0 };
  }

  // 搜尋關鍵字
  if (search) {
    query.itemName = { $regex: search, $options: 'i' };
  }

  // 查詢庫存
  const inventory = await Inventory.find(query)
    .populate('dish')
    .populate('brand')
    .sort({ itemName: 1 });

  return inventory;
};

/**
 * 獲取單個庫存項目
 * @param {String} storeId - 店鋪ID
 * @param {String} itemId - 項目ID（餐點ID或其他庫存ID）
 * @param {String} inventoryType - 庫存類型
 * @returns {Promise<Object>} 庫存項目
 */
export const getInventoryItem = async (storeId, itemId, inventoryType = 'dish') => {
  const query = {
    store: storeId,
    inventoryType
  };

  if (inventoryType === 'dish') {
    query.dish = itemId;
  } else {
    query._id = itemId;
  }

  const inventoryItem = await Inventory.findOne(query)
    .populate('dish')
    .populate('brand');

  if (!inventoryItem) {
    throw new AppError('找不到此項目的庫存資訊', 404);
  }

  return inventoryItem;
};

/**
 * 創建新的庫存項目
 * @param {Object} inventoryData - 庫存資料
 * @param {String} adminId - 管理員ID
 * @returns {Promise<Object>} 新創建的庫存項目
 */
export const createInventory = async (inventoryData, adminId) => {
  const {
    brandId,
    storeId,
    inventoryType,
    dishId,
    itemName,
    initialWarehouseStock = 0,
    initialAvailableStock = 0,
    minStockAlert = 0,
    maxStockLimit,
    isInventoryTracked = true,
    showAvailableStockToCustomer = false
  } = inventoryData;

  // 檢查是否已存在
  let existingQuery = {
    brand: brandId,
    store: storeId,
    inventoryType
  };

  if (inventoryType === 'dish') {
    existingQuery.dish = dishId;
  } else {
    existingQuery.itemName = itemName;
  }

  const existingInventory = await Inventory.findOne(existingQuery);

  if (existingInventory) {
    throw new AppError('此項目已在庫存中', 400);
  }

  // 創建新庫存項目
  const newInventory = new Inventory({
    brand: brandId,
    store: storeId,
    inventoryType,
    dish: inventoryType === 'dish' ? dishId : undefined,
    itemName,
    warehouseStock: initialWarehouseStock,
    availableStock: initialAvailableStock,
    minStockAlert,
    maxStockLimit,
    isInventoryTracked,
    showAvailableStockToCustomer
  });

  // 保存庫存項目
  await newInventory.save();

  // 如果有初始庫存，創建庫存日誌
  if (initialWarehouseStock > 0) {
    await StockLog.create({
      brand: brandId,
      store: storeId,
      inventoryType,
      dish: inventoryType === 'dish' ? dishId : undefined,
      itemName,
      stockType: 'warehouseStock',
      previousStock: 0,
      newStock: initialWarehouseStock,
      changeAmount: initialWarehouseStock,
      changeType: 'initial_stock',
      reason: '初始庫存設置',
      admin: adminId
    });
  }

  if (initialAvailableStock > 0) {
    await StockLog.create({
      brand: brandId,
      store: storeId,
      inventoryType,
      dish: inventoryType === 'dish' ? dishId : undefined,
      itemName,
      stockType: 'availableStock',
      previousStock: 0,
      newStock: initialAvailableStock,
      changeAmount: initialAvailableStock,
      changeType: 'initial_stock',
      reason: '初始可販售庫存設置',
      admin: adminId
    });
  }

  return newInventory;
};

/**
 * 更新庫存
 * @param {Object} updateData - 更新數據
 * @param {String} adminId - 管理員ID
 * @returns {Promise<Object>} 更新後的庫存項目
 */
export const updateInventory = async (updateData, adminId) => {
  const {
    storeId,
    itemId,
    inventoryType = 'dish',
    stockType = 'warehouseStock',
    stock,
    changeAmount,
    reason,
    minStockAlert,
    maxStockLimit,
    isInventoryTracked,
    showAvailableStockToCustomer
  } = updateData;

  // 查找庫存項目
  const inventoryItem = await getInventoryItem(storeId, itemId, inventoryType);

  // 記錄先前的庫存
  const previousStock = inventoryItem[stockType];
  let newStock = previousStock;
  let actualChangeAmount = 0;
  let changeType = '';

  // 如果提供了新庫存量
  if (stock !== undefined) {
    newStock = stock;
    actualChangeAmount = newStock - previousStock;
    changeType = actualChangeAmount > 0 ? 'manual_add' : 'manual_subtract';
  }
  // 如果提供了變化量
  else if (changeAmount !== undefined) {
    actualChangeAmount = changeAmount;
    newStock = previousStock + changeAmount;
    changeType = changeAmount > 0 ? 'manual_add' : 'manual_subtract';
  }

  // 確保庫存不為負數
  if (newStock < 0) {
    throw new AppError('庫存不能為負數', 400);
  }

  // 確保可販售庫存不超過倉庫庫存
  if (stockType === 'availableStock' && newStock > inventoryItem.warehouseStock) {
    throw new AppError('可販售庫存不能超過倉庫庫存', 400);
  }

  // 更新庫存
  inventoryItem[stockType] = newStock;

  // 更新其他設定
  if (minStockAlert !== undefined) {
    inventoryItem.minStockAlert = minStockAlert;
  }

  if (maxStockLimit !== undefined) {
    inventoryItem.maxStockLimit = maxStockLimit;
  }

  if (isInventoryTracked !== undefined) {
    inventoryItem.isInventoryTracked = isInventoryTracked;
  }

  if (showAvailableStockToCustomer !== undefined) {
    inventoryItem.showAvailableStockToCustomer = showAvailableStockToCustomer;
  }

  // 保存庫存項目
  await inventoryItem.save();

  // 如果庫存有變化，創建庫存日誌
  if (actualChangeAmount !== 0) {
    await StockLog.create({
      brand: inventoryItem.brand,
      store: storeId,
      inventoryType: inventoryItem.inventoryType,
      dish: inventoryItem.dish,
      itemName: inventoryItem.itemName,
      stockType,
      previousStock,
      newStock,
      changeAmount: actualChangeAmount,
      changeType,
      reason: reason || '手動調整庫存',
      admin: adminId
    });
  }

  return inventoryItem;
};

/**
 * 減少庫存（用於訂單消耗）
 * @param {Object} reduceData - 減少數據
 * @returns {Promise<Boolean>} 操作是否成功
 */
export const reduceStock = async (reduceData) => {
  const {
    storeId,
    itemId,
    inventoryType = 'dish',
    quantity,
    reason,
    orderId,
    adminId
  } = reduceData;

  // 查找庫存項目
  const inventoryItem = await getInventoryItem(storeId, itemId, inventoryType);

  // 如果不追蹤庫存，直接返回成功
  if (!inventoryItem.isInventoryTracked) {
    return true;
  }

  // 檢查可販售庫存是否足夠
  if (inventoryItem.availableStock < quantity) {
    throw new AppError('庫存不足', 400);
  }

  // 記錄先前的庫存
  const previousAvailableStock = inventoryItem.availableStock;

  // 更新可販售庫存
  inventoryItem.availableStock -= quantity;

  // 創建庫存日誌
  await StockLog.create({
    brand: inventoryItem.brand,
    store: storeId,
    inventoryType: inventoryItem.inventoryType,
    dish: inventoryItem.dish,
    itemName: inventoryItem.itemName,
    stockType: 'availableStock',
    previousStock: previousAvailableStock,
    newStock: inventoryItem.availableStock,
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
 * @param {Object} addData - 增加數據
 * @returns {Promise<Boolean>} 操作是否成功
 */
export const addStock = async (addData) => {
  const {
    storeId,
    itemId,
    inventoryType = 'dish',
    stockType = 'warehouseStock',
    quantity,
    reason,
    adminId
  } = addData;

  // 查找庫存項目
  const inventoryItem = await getInventoryItem(storeId, itemId, inventoryType);

  // 記錄先前的庫存
  const previousStock = inventoryItem[stockType];

  // 更新庫存
  inventoryItem[stockType] += quantity;

  // 創建庫存日誌
  await StockLog.create({
    brand: inventoryItem.brand,
    store: storeId,
    inventoryType: inventoryItem.inventoryType,
    dish: inventoryItem.dish,
    itemName: inventoryItem.itemName,
    stockType,
    previousStock,
    newStock: inventoryItem[stockType],
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
 * 庫存調撥（從倉庫到可販售）
 * @param {Object} transferData - 調撥數據
 * @returns {Promise<Boolean>} 操作是否成功
 */
export const transferStock = async (transferData) => {
  const {
    storeId,
    itemId,
    inventoryType = 'dish',
    quantity,
    reason,
    adminId
  } = transferData;

  // 查找庫存項目
  const inventoryItem = await getInventoryItem(storeId, itemId, inventoryType);

  // 檢查倉庫庫存是否足夠
  if (inventoryItem.warehouseStock < quantity) {
    throw new AppError('倉庫庫存不足', 400);
  }

  // 記錄先前的庫存
  const previousWarehouseStock = inventoryItem.warehouseStock;
  const previousAvailableStock = inventoryItem.availableStock;

  // 更新庫存
  inventoryItem.warehouseStock -= quantity;
  inventoryItem.availableStock += quantity;

  // 創建庫存日誌 - 倉庫減少
  await StockLog.create({
    brand: inventoryItem.brand,
    store: storeId,
    inventoryType: inventoryItem.inventoryType,
    dish: inventoryItem.dish,
    itemName: inventoryItem.itemName,
    stockType: 'warehouseStock',
    previousStock: previousWarehouseStock,
    newStock: inventoryItem.warehouseStock,
    changeAmount: -quantity,
    changeType: 'system_adjustment',
    reason: reason || '調撥至可販售庫存',
    admin: adminId
  });

  // 創建庫存日誌 - 可販售增加
  await StockLog.create({
    brand: inventoryItem.brand,
    store: storeId,
    inventoryType: inventoryItem.inventoryType,
    dish: inventoryItem.dish,
    itemName: inventoryItem.itemName,
    stockType: 'availableStock',
    previousStock: previousAvailableStock,
    newStock: inventoryItem.availableStock,
    changeAmount: quantity,
    changeType: 'system_adjustment',
    reason: reason || '從倉庫調撥',
    admin: adminId
  });

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
    changeType: 'order',
    stockType: 'availableStock'
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
      dish: log.dish,
      inventoryType: log.inventoryType
    });

    if (!inventoryItem) {
      continue; // 如果庫存項目不存在，跳過處理
    }

    // 如果不追蹤庫存，跳過處理
    if (!inventoryItem.isInventoryTracked) {
      continue;
    }

    // 記錄先前的庫存
    const previousStock = inventoryItem.availableStock;

    // 還原庫存 (因為減少庫存時 changeAmount 是負數，所以還原時取負值)
    inventoryItem.availableStock -= log.changeAmount;

    // 創建庫存日誌
    await StockLog.create({
      brand: log.brand,
      store: log.store,
      inventoryType: log.inventoryType,
      dish: log.dish,
      itemName: log.itemName,
      stockType: 'availableStock',
      previousStock,
      newStock: inventoryItem.availableStock,
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
 * 損耗或過期處理
 * @param {Object} damageData - 損耗數據
 * @returns {Promise<Boolean>} 操作是否成功
 */
export const processDamage = async (damageData) => {
  const {
    storeId,
    itemId,
    inventoryType = 'dish',
    stockType = 'warehouseStock',
    quantity,
    reason,
    adminId
  } = damageData;

  if (!reason) {
    throw new AppError('損耗處理必須提供原因', 400);
  }

  // 查找庫存項目
  const inventoryItem = await getInventoryItem(storeId, itemId, inventoryType);

  // 檢查庫存是否足夠
  if (inventoryItem[stockType] < quantity) {
    throw new AppError('庫存不足', 400);
  }

  // 記錄先前的庫存
  const previousStock = inventoryItem[stockType];

  // 更新庫存
  inventoryItem[stockType] -= quantity;

  // 創建庫存日誌
  await StockLog.create({
    brand: inventoryItem.brand,
    store: storeId,
    inventoryType: inventoryItem.inventoryType,
    dish: inventoryItem.dish,
    itemName: inventoryItem.itemName,
    stockType,
    previousStock,
    newStock: inventoryItem[stockType],
    changeAmount: -quantity,
    changeType: 'damage',
    reason,
    admin: adminId
  });

  // 保存庫存項目
  await inventoryItem.save();

  return true;
};

/**
 * 批量更新庫存
 * @param {String} storeId - 店鋪ID
 * @param {Array} items - 庫存數據陣列
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

  for (const item of items) {
    try {
      if (!item.itemId && !item.itemName) {
        results.errors.push({
          item: item,
          error: '缺少必要的項目識別資訊'
        });
        continue;
      }

      // 嘗試查找或創建庫存
      const inventoryItem = await getInventoryItem(
        storeId,
        item.itemId,
        item.inventoryType || 'dish'
      ).catch(() => null);

      if (inventoryItem) {
        // 更新現有項目
        await updateInventory({
          storeId,
          itemId: item.itemId,
          inventoryType: item.inventoryType,
          stockType: item.stockType || 'warehouseStock',
          stock: item.stock,
          reason: item.reason || '批量更新庫存',
          minStockAlert: item.minStockAlert,
          maxStockLimit: item.maxStockLimit,
          isInventoryTracked: item.isInventoryTracked,
          showAvailableStockToCustomer: item.showAvailableStockToCustomer
        }, adminId);
        results.updated++;
      } else {
        // 創建新項目
        await createInventory({
          brandId: item.brandId,
          storeId,
          inventoryType: item.inventoryType || 'dish',
          dishId: item.inventoryType === 'dish' ? item.itemId : undefined,
          itemName: item.itemName,
          initialWarehouseStock: item.warehouseStock || 0,
          initialAvailableStock: item.availableStock || 0,
          minStockAlert: item.minStockAlert || 0,
          maxStockLimit: item.maxStockLimit,
          isInventoryTracked: item.isInventoryTracked !== undefined ? item.isInventoryTracked : true,
          showAvailableStockToCustomer: item.showAvailableStockToCustomer || false
        }, adminId);
        results.created++;
      }
    } catch (error) {
      results.errors.push({
        item: item,
        error: error.message
      });
    }
  }

  return results;
};
