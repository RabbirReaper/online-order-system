/**
 * 庫存管理服務
 * 處理庫存的增加、減少、更新等操作
 */

import Inventory from '../../models/Store/Inventory.js';
import StockLog from '../../models/Store/StockLog.js';
import Store from '../../models/Store/Store.js';
import DishTemplate from '../../models/Dish/DishTemplate.js';
import { AppError } from '../../middlewares/error.js';

/**
 * 獲取店鋪庫存列表
 * @param {String} storeId - 店鋪ID
 * @param {Object} options - 查詢選項
 * @returns {Promise<Array>} 庫存列表
 */
export const getStoreInventory = async (storeId, options = {}) => {
  const { inventoryType, onlyAvailable = false, search = '' } = options;

  // 構建查詢條件
  const query = { store: storeId };

  if (inventoryType) {
    query.inventoryType = inventoryType;
  }

  if (onlyAvailable) {
    query.availableStock = { $gt: 0 };
  }

  if (search) {
    query.itemName = { $regex: search, $options: 'i' };
  }

  // 查詢庫存
  const inventory = await Inventory.find(query)
    .populate('dish', 'name')
    .populate('brand', 'name')
    .sort({ itemName: 1 });

  return inventory;
};

/**
 * 獲取單個庫存項目
 * @param {String} storeId - 店鋪ID
 * @param {String} itemId - 項目ID
 * @param {String} inventoryType - 庫存類型
 * @returns {Promise<Object>} 庫存項目
 */
export const getInventoryItem = async (storeId, inventoryId) => {
  // 直接用 findById，並確保此庫存屬於該店鋪
  const inventoryItem = await Inventory.findOne({
    _id: inventoryId,
    store: storeId  // 確保安全性，只能查詢該店鋪的庫存
  })
    .populate('dish', 'name')
    .populate('brand', 'name');

  if (!inventoryItem) {
    throw new AppError('找不到此項目的庫存資訊', 404);
  }

  return inventoryItem;
};

/**
 * 創建庫存項目
 * @param {Object} inventoryData - 庫存數據
 * @param {String} adminId - 管理員ID
 * @returns {Promise<Object>} 創建的庫存項目
 */
export const createInventory = async (inventoryData, adminId) => {
  // 檢查店鋪是否存在
  const store = await Store.findById(inventoryData.storeId);
  if (!store) {
    throw new AppError('店鋪不存在', 404);
  }

  // 如果是餐點庫存，檢查餐點是否存在
  if (inventoryData.inventoryType === 'dish') {
    if (!inventoryData.dishId) {
      throw new AppError('餐點庫存必須提供餐點ID', 400);
    }

    const dish = await DishTemplate.findById(inventoryData.dishId);
    if (!dish) {
      throw new AppError('餐點不存在', 404);
    }

    // 檢查該餐點是否已有庫存記錄
    const existingInventory = await Inventory.findOne({
      store: inventoryData.storeId,
      inventoryType: 'dish',
      dish: inventoryData.dishId
    });

    if (existingInventory) {
      throw new AppError('該餐點已有庫存記錄', 400);
    }
  } else {
    // 檢查相同名稱的項目是否已存在
    const existingInventory = await Inventory.findOne({
      store: inventoryData.storeId,
      inventoryType: 'else',
      itemName: inventoryData.itemName
    });

    if (existingInventory) {
      throw new AppError('該項目名稱已存在', 400);
    }
  }

  // 創建庫存項目
  const newInventory = new Inventory({
    brand: inventoryData.brandId || store.brand,
    store: inventoryData.storeId,
    inventoryType: inventoryData.inventoryType,
    dish: inventoryData.dishId,
    itemName: inventoryData.itemName,
    warehouseStock: inventoryData.initialWarehouseStock || 0,
    availableStock: inventoryData.initialAvailableStock || 0,
    minStockAlert: inventoryData.minStockAlert || 0,
    maxStockAlert: inventoryData.maxStockAlert,
    isInventoryTracked: inventoryData.isInventoryTracked !== false,
    showAvailableStockToCustomer: inventoryData.showAvailableStockToCustomer || false
  });

  await newInventory.save();

  // 記錄初始庫存日誌
  if (inventoryData.initialWarehouseStock > 0) {
    await StockLog.create({
      brand: newInventory.brand,
      store: inventoryData.storeId,
      inventoryType: inventoryData.inventoryType,
      dish: inventoryData.dishId,
      itemName: inventoryData.itemName,
      stockType: 'warehouseStock',
      previousStock: 0,
      newStock: inventoryData.initialWarehouseStock,
      changeAmount: inventoryData.initialWarehouseStock,
      changeType: 'initial_stock',
      reason: '初始庫存設定',
      admin: adminId
    });
  }

  if (inventoryData.initialAvailableStock > 0) {
    await StockLog.create({
      brand: newInventory.brand,
      store: inventoryData.storeId,
      inventoryType: inventoryData.inventoryType,
      dish: inventoryData.dishId,
      itemName: inventoryData.itemName,
      stockType: 'availableStock',
      previousStock: 0,
      newStock: inventoryData.initialAvailableStock,
      changeAmount: inventoryData.initialAvailableStock,
      changeType: 'initial_stock',
      reason: '初始庫存設定',
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
    maxStockAlert,
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

  if (maxStockAlert !== undefined) {
    inventoryItem.maxStockAlert = maxStockAlert;
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

  // 保存庫存項目
  await inventoryItem.save();

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

  // 保存庫存項目
  await inventoryItem.save();

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

  // 保存庫存項目
  await inventoryItem.save();

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

    // 保存庫存項目
    await inventoryItem.save();

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

  // 保存庫存項目
  await inventoryItem.save();

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

      // 嘗試查找庫存項目
      let inventoryItem = null;
      try {
        inventoryItem = await getInventoryItem(
          storeId,
          item.itemId,
          item.inventoryType || 'dish'
        );
      } catch (error) {
        // 如果找不到項目，則創建新項目
        if (error.statusCode === 404) {
          inventoryItem = null;
        } else {
          throw error;
        }
      }

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
          maxStockAlert: item.maxStockAlert,
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
          maxStockAlert: item.maxStockAlert,
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
