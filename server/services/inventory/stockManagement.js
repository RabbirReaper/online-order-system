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
    query.$or = [
      { enableAvailableStock: true, availableStock: { $gt: 0 } },
      { enableAvailableStock: false, totalStock: { $gt: 0 } }
    ];
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
 * @param {String} inventoryId - inventory ID
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
  if (inventoryData.inventoryType === 'DishTemplate') {
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
      inventoryType: 'DishTemplate',
      dish: inventoryData.dishId
    });

    if (existingInventory) {
      throw new AppError('該餐點已有庫存記錄', 400);
    }

    // 設置餐點名稱
    inventoryData.itemName = dish.name;
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
    totalStock: inventoryData.initialTotalStock || 0,
    enableAvailableStock: inventoryData.enableAvailableStock || false,
    availableStock: inventoryData.initialAvailableStock || 0,
    minStockAlert: inventoryData.minStockAlert || 0,
    targetStockLevel: inventoryData.targetStockLevel,
    isInventoryTracked: inventoryData.isInventoryTracked !== false,
    isSoldOut: inventoryData.isSoldOut || false
  });

  await newInventory.save();

  // 記錄初始庫存日誌
  if (inventoryData.initialTotalStock > 0) {
    await StockLog.create({
      brand: newInventory.brand,
      store: inventoryData.storeId,
      inventoryType: inventoryData.inventoryType,
      dish: inventoryData.dishId,
      itemName: inventoryData.itemName,
      stockType: 'totalStock',
      previousStock: 0,
      newStock: inventoryData.initialTotalStock,
      changeAmount: inventoryData.initialTotalStock,
      changeType: 'initial_stock',
      reason: '初始庫存設定',
      admin: adminId,
      metadata: {
        inventorySettings: {
          enableAvailableStock: newInventory.enableAvailableStock,
          isInventoryTracked: newInventory.isInventoryTracked,
          isSoldOut: newInventory.isSoldOut
        }
      }
    });
  }

  if (inventoryData.initialAvailableStock > 0 && inventoryData.enableAvailableStock) {
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
      admin: adminId,
      metadata: {
        inventorySettings: {
          enableAvailableStock: newInventory.enableAvailableStock,
          isInventoryTracked: newInventory.isInventoryTracked,
          isSoldOut: newInventory.isSoldOut
        }
      }
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
    inventoryId,
    stockType = 'both', // 改為 'both', 'totalStock', 'availableStock'
    stock,
    reason,
    minStockAlert,
    targetStockLevel,
    isInventoryTracked,
    enableAvailableStock,
    isSoldOut
  } = updateData;

  // 查找庫存項目
  const inventoryItem = await getInventoryItem(storeId, inventoryId);

  // 處理庫存數量更新
  if (stock !== undefined) {
    // 根據 stockType 更新對應的庫存
    if (stockType === 'totalStock' || stockType === 'both') {
      const previousTotalStock = inventoryItem.totalStock;
      inventoryItem.totalStock = stock;
      const actualChangeAmount = stock - previousTotalStock;

      // 創建總庫存日誌
      await StockLog.create({
        brand: inventoryItem.brand,
        store: storeId,
        inventoryType: inventoryItem.inventoryType,
        dish: inventoryItem.dish,
        itemName: inventoryItem.itemName,
        stockType: 'totalStock',
        previousStock: previousTotalStock,
        newStock: stock,
        changeAmount: actualChangeAmount,
        changeType: actualChangeAmount > 0 ? 'manual_add' : 'manual_subtract',
        reason: reason || '手動調整庫存',
        admin: adminId,
        metadata: {
          inventorySettings: {
            enableAvailableStock: inventoryItem.enableAvailableStock,
            isInventoryTracked: inventoryItem.isInventoryTracked,
            isSoldOut: inventoryItem.isSoldOut
          }
        }
      });
    }

    if ((stockType === 'availableStock' || stockType === 'both') && inventoryItem.enableAvailableStock) {
      // 如果是單獨設定 availableStock，使用傳入的值
      // 如果是 both，則使用傳入的 stock 值
      const newAvailableStock = updateData.availableStock !== undefined ? updateData.availableStock : stock;

      // 確保可販售庫存不超過總庫存
      if (newAvailableStock > inventoryItem.totalStock) {
        throw new AppError('可販售庫存不能超過總庫存', 400);
      }

      const previousAvailableStock = inventoryItem.availableStock;
      inventoryItem.availableStock = newAvailableStock;
      const actualChangeAmount = newAvailableStock - previousAvailableStock;

      // 創建可販售庫存日誌
      await StockLog.create({
        brand: inventoryItem.brand,
        store: storeId,
        inventoryType: inventoryItem.inventoryType,
        dish: inventoryItem.dish,
        itemName: inventoryItem.itemName,
        stockType: 'availableStock',
        previousStock: previousAvailableStock,
        newStock: newAvailableStock,
        changeAmount: actualChangeAmount,
        changeType: actualChangeAmount > 0 ? 'manual_add' : 'manual_subtract',
        reason: reason || '手動調整可販售庫存',
        admin: adminId,
        metadata: {
          inventorySettings: {
            enableAvailableStock: inventoryItem.enableAvailableStock,
            isInventoryTracked: inventoryItem.isInventoryTracked,
            isSoldOut: inventoryItem.isSoldOut
          }
        }
      });
    }
  }

  // 更新其他設定
  if (minStockAlert !== undefined) {
    inventoryItem.minStockAlert = minStockAlert;
  }

  if (targetStockLevel !== undefined) {
    inventoryItem.targetStockLevel = targetStockLevel;
  }

  if (isInventoryTracked !== undefined) {
    inventoryItem.isInventoryTracked = isInventoryTracked;
  }

  if (enableAvailableStock !== undefined) {
    inventoryItem.enableAvailableStock = enableAvailableStock;
    // 如果關閉了可用庫存功能，將可用庫存設為0
    if (!enableAvailableStock) {
      inventoryItem.availableStock = 0;
    }
  }

  if (isSoldOut !== undefined) {
    inventoryItem.isSoldOut = isSoldOut;
  }

  // 保存庫存項目
  await inventoryItem.save();

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
    inventoryId,
    quantity,
    reason,
    orderId,
    adminId
  } = reduceData;

  // 查找庫存項目
  const inventoryItem = await getInventoryItem(storeId, inventoryId);

  // 如果不追蹤庫存，直接返回成功
  if (!inventoryItem.isInventoryTracked) {
    return true;
  }

  // 檢查總庫存是否足夠
  if (inventoryItem.totalStock < quantity) {
    throw new AppError('庫存不足', 400);
  }

  // 記錄先前的庫存
  const previousTotalStock = inventoryItem.totalStock;
  const previousAvailableStock = inventoryItem.availableStock;

  // 扣減總庫存
  inventoryItem.totalStock -= quantity;

  // 如果啟用可用庫存，同時扣減可用庫存
  if (inventoryItem.enableAvailableStock) {
    // 確保可用庫存不會為負數
    inventoryItem.availableStock = Math.max(0, inventoryItem.availableStock - quantity);
  }

  // 保存庫存項目
  await inventoryItem.save();

  // 創建總庫存日誌
  await StockLog.create({
    brand: inventoryItem.brand,
    store: storeId,
    inventoryType: inventoryItem.inventoryType,
    dish: inventoryItem.dish,
    itemName: inventoryItem.itemName,
    stockType: 'totalStock',
    previousStock: previousTotalStock,
    newStock: inventoryItem.totalStock,
    changeAmount: -quantity,
    changeType: orderId ? 'order' : 'manual_subtract',
    reason: reason || '訂單消耗',
    order: orderId,
    admin: adminId,
    metadata: {
      inventorySettings: {
        enableAvailableStock: inventoryItem.enableAvailableStock,
        isInventoryTracked: inventoryItem.isInventoryTracked,
        isSoldOut: inventoryItem.isSoldOut
      }
    }
  });

  // 如果啟用可用庫存，創建可用庫存日誌
  if (inventoryItem.enableAvailableStock) {
    await StockLog.create({
      brand: inventoryItem.brand,
      store: storeId,
      inventoryType: inventoryItem.inventoryType,
      dish: inventoryItem.dish,
      itemName: inventoryItem.itemName,
      stockType: 'availableStock',
      previousStock: previousAvailableStock,
      newStock: inventoryItem.availableStock,
      changeAmount: previousAvailableStock - inventoryItem.availableStock,
      changeType: orderId ? 'order' : 'manual_subtract',
      reason: reason || '訂單消耗（同步可用庫存）',
      order: orderId,
      admin: adminId,
      metadata: {
        inventorySettings: {
          enableAvailableStock: inventoryItem.enableAvailableStock,
          isInventoryTracked: inventoryItem.isInventoryTracked,
          isSoldOut: inventoryItem.isSoldOut
        }
      }
    });
  }

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
    inventoryId,
    stockType = 'totalStock',
    quantity,
    reason,
    adminId
  } = addData;

  // 查找庫存項目
  const inventoryItem = await getInventoryItem(storeId, inventoryId);

  // 記錄先前的庫存
  const previousStock = inventoryItem[stockType];

  // 更新庫存
  if (stockType === 'totalStock') {
    inventoryItem.totalStock += quantity;
  } else if (stockType === 'availableStock' && inventoryItem.enableAvailableStock) {
    // 確保可用庫存不超過總庫存
    if (inventoryItem.availableStock + quantity > inventoryItem.totalStock) {
      throw new AppError('可用庫存不能超過總庫存', 400);
    }
    inventoryItem.availableStock += quantity;
  } else {
    throw new AppError('無效的庫存類型或未啟用可用庫存', 400);
  }

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
    admin: adminId,
    metadata: {
      inventorySettings: {
        enableAvailableStock: inventoryItem.enableAvailableStock,
        isInventoryTracked: inventoryItem.isInventoryTracked,
        isSoldOut: inventoryItem.isSoldOut
      }
    }
  });

  return true;
};

/**
 * 設定可用庫存
 * @param {Object} setData - 設定數據
 * @returns {Promise<Object>} 更新後的庫存項目
 */
export const setAvailableStock = async (setData) => {
  const {
    storeId,
    inventoryId,
    availableStock,
    reason,
    adminId
  } = setData;

  // 查找庫存項目
  const inventoryItem = await getInventoryItem(storeId, inventoryId);

  if (!inventoryItem.enableAvailableStock) {
    throw new AppError('此項目未啟用可用庫存功能', 400);
  }

  if (availableStock > inventoryItem.totalStock) {
    throw new AppError('可用庫存不能超過總庫存', 400);
  }

  const previousAvailableStock = inventoryItem.availableStock;
  inventoryItem.availableStock = availableStock;

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
    newStock: availableStock,
    changeAmount: availableStock - previousAvailableStock,
    changeType: 'system_adjustment',
    reason: reason || '設定可用庫存',
    admin: adminId,
    metadata: {
      inventorySettings: {
        enableAvailableStock: inventoryItem.enableAvailableStock,
        isInventoryTracked: inventoryItem.isInventoryTracked,
        isSoldOut: inventoryItem.isSoldOut
      }
    }
  });

  return inventoryItem;
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
      inventoryType: log.inventoryType,
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
    const previousStock = inventoryItem[log.stockType];

    // 還原庫存 (因為減少庫存時 changeAmount 是負數，所以還原時取負值)
    inventoryItem[log.stockType] -= log.changeAmount;

    // 保存庫存項目
    await inventoryItem.save();

    // 創建庫存日誌
    await StockLog.create({
      brand: log.brand,
      store: log.store,
      inventoryType: log.inventoryType,
      dish: log.dish,
      itemName: log.itemName,
      stockType: log.stockType,
      previousStock,
      newStock: inventoryItem[log.stockType],
      changeAmount: -log.changeAmount,
      changeType: 'system_adjustment',
      reason: `訂單取消還原庫存: #${order.orderDateCode}${order.sequence.toString().padStart(3, '0')}`,
      order: order._id,
      metadata: {
        inventorySettings: {
          enableAvailableStock: inventoryItem.enableAvailableStock,
          isInventoryTracked: inventoryItem.isInventoryTracked,
          isSoldOut: inventoryItem.isSoldOut
        }
      }
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
    inventoryId,
    stockType = 'totalStock',
    quantity,
    reason,
    adminId
  } = damageData;

  if (!reason) {
    throw new AppError('損耗處理必須提供原因', 400);
  }

  // 查找庫存項目
  const inventoryItem = await getInventoryItem(storeId, inventoryId);

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
    admin: adminId,
    metadata: {
      inventorySettings: {
        enableAvailableStock: inventoryItem.enableAvailableStock,
        isInventoryTracked: inventoryItem.isInventoryTracked,
        isSoldOut: inventoryItem.isSoldOut
      }
    }
  });

  return true;
};

/**
 * 切換售完狀態
 * @param {String} storeId - 店鋪ID
 * @param {String} inventoryId - 庫存ID
 * @param {Boolean} isSoldOut - 是否售完
 * @param {String} adminId - 管理員ID
 * @returns {Promise<Object>} 更新後的庫存項目
 */
export const toggleSoldOut = async (storeId, inventoryId, isSoldOut, adminId) => {
  const inventoryItem = await getInventoryItem(storeId, inventoryId);

  inventoryItem.isSoldOut = isSoldOut;
  await inventoryItem.save();

  // 創建庫存日誌記錄此變更
  await StockLog.create({
    brand: inventoryItem.brand,
    store: storeId,
    inventoryType: inventoryItem.inventoryType,
    dish: inventoryItem.dish,
    itemName: inventoryItem.itemName,
    stockType: inventoryItem.enableAvailableStock ? 'availableStock' : 'totalStock',
    previousStock: inventoryItem[inventoryItem.enableAvailableStock ? 'availableStock' : 'totalStock'],
    newStock: inventoryItem[inventoryItem.enableAvailableStock ? 'availableStock' : 'totalStock'],
    changeAmount: 0,
    changeType: 'system_adjustment',
    reason: isSoldOut ? '設為售完' : '取消售完',
    admin: adminId,
    metadata: {
      inventorySettings: {
        enableAvailableStock: inventoryItem.enableAvailableStock,
        isInventoryTracked: inventoryItem.isInventoryTracked,
        isSoldOut: inventoryItem.isSoldOut
      }
    }
  });

  return inventoryItem;
};

/**
 * 初始化店鋪所有餐點的庫存
 * @param {String} storeId - 店鋪ID
 * @param {String} adminId - 管理員ID
 * @returns {Promise<Object>} 初始化結果
 */
export const initializeDishInventory = async (storeId, adminId) => {
  // 檢查店鋪是否存在
  const store = await Store.findById(storeId);
  if (!store) {
    throw new AppError('店鋪不存在', 404);
  }

  // 獲取品牌所有餐點
  const dishes = await DishTemplate.find({ brand: store.brand });

  // 統計結果
  const result = {
    total: dishes.length,
    created: 0,
    skipped: 0,
    errors: []
  };

  // 逐一檢查並創建庫存
  for (const dish of dishes) {
    try {
      // 檢查是否已有庫存記錄
      const existingInventory = await Inventory.findOne({
        store: storeId,
        inventoryType: 'DishTemplate',
        dish: dish._id
      });

      if (existingInventory) {
        result.skipped++;
        continue;
      }

      // 創建庫存記錄
      const newInventory = new Inventory({
        brand: store.brand,
        store: storeId,
        inventoryType: 'DishTemplate',
        dish: dish._id,
        itemName: dish.name,
        totalStock: 0,
        enableAvailableStock: false,
        availableStock: 0,
        minStockAlert: 0,
        isInventoryTracked: false, // 預設關閉庫存追蹤
        isSoldOut: false
      });

      await newInventory.save();
      result.created++;

      // 創建初始化日誌
      await StockLog.create({
        brand: store.brand,
        store: storeId,
        inventoryType: 'DishTemplate',
        dish: dish._id,
        itemName: dish.name,
        stockType: 'totalStock',
        previousStock: 0,
        newStock: 0,
        changeAmount: 0,
        changeType: 'initial_stock',
        reason: '自動初始化餐點庫存',
        admin: adminId,
        metadata: {
          isDailyReset: false,
          inventorySettings: {
            enableAvailableStock: false,
            isInventoryTracked: false,
            isSoldOut: false
          }
        }
      });

    } catch (error) {
      result.errors.push({
        dishId: dish._id,
        dishName: dish.name,
        error: error.message
      });
    }
  }

  return result;
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
      // 適配舊的 itemId 和新的 inventoryId
      const inventoryId = item.inventoryId || item.itemId;

      if (!inventoryId && !item.itemName) {
        results.errors.push({
          item: item,
          error: '缺少必要的項目識別資訊'
        });
        continue;
      }

      // 嘗試查找庫存項目
      let inventoryItem = null;
      try {
        inventoryItem = await getInventoryItem(storeId, inventoryId);
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
          inventoryId,
          stockType: item.stockType || 'totalStock',
          stock: item.stock,
          reason: item.reason || '批量更新庫存',
          minStockAlert: item.minStockAlert,
          targetStockLevel: item.targetStockLevel,
          isInventoryTracked: item.isInventoryTracked,
          enableAvailableStock: item.enableAvailableStock,
          isSoldOut: item.isSoldOut
        }, adminId);
        results.updated++;
      } else {
        // 創建新項目
        await createInventory({
          brandId: item.brandId,
          storeId,
          inventoryType: item.inventoryType || 'DishTemplate',
          dishId: item.inventoryType === 'DishTemplate' ? inventoryId : undefined,
          itemName: item.itemName,
          initialTotalStock: item.totalStock || 0,
          initialAvailableStock: item.availableStock || 0,
          minStockAlert: item.minStockAlert || 0,
          targetStockLevel: item.targetStockLevel,
          isInventoryTracked: item.isInventoryTracked !== undefined ? item.isInventoryTracked : true,
          enableAvailableStock: item.enableAvailableStock || false,
          isSoldOut: item.isSoldOut || false
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
