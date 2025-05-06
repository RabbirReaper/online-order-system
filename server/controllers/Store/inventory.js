import * as inventoryService from '../../services/inventory/index.js';
import { asyncHandler } from '../../middlewares/error.js';

// 獲取店鋪庫存列表
export const getStoreInventory = asyncHandler(async (req, res) => {
  try {
    const { storeId } = req.params;
    const options = {
      onlyAvailable: req.query.onlyAvailable === 'true',
      search: req.query.search || ''
    };

    const inventory = await inventoryService.getStoreInventory(storeId, options);

    res.json({
      success: true,
      inventory
    });
  } catch (error) {
    console.error('Error getting store inventory:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 獲取單個庫存項目
export const getInventoryItem = asyncHandler(async (req, res) => {
  try {
    const { storeId, dishId } = req.params;

    const inventoryItem = await inventoryService.getInventoryItem(storeId, dishId);

    res.json({
      success: true,
      inventoryItem
    });
  } catch (error) {
    console.error('Error getting inventory item:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 創建庫存項目
export const createInventory = asyncHandler(async (req, res) => {
  try {
    const { storeId } = req.params;
    const { dishId, dishName, initialStock, dailyLimit, isInventoryTracked } = req.body;
    const adminId = req.adminId; // 從session中獲取管理員ID

    if (!dishId || !dishName) {
      return res.status(400).json({
        success: false,
        message: '餐點ID和名稱為必填欄位'
      });
    }

    const newInventoryItem = await inventoryService.createInventory(
      storeId,
      dishId,
      dishName,
      initialStock || 0,
      dailyLimit,
      isInventoryTracked !== undefined ? isInventoryTracked : true,
      adminId
    );

    res.status(201).json({
      success: true,
      message: '庫存創建成功',
      inventoryItem: newInventoryItem
    });
  } catch (error) {
    console.error('Error creating inventory:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 更新庫存項目
export const updateInventory = asyncHandler(async (req, res) => {
  try {
    const { storeId, dishId } = req.params;
    const { stock, changeAmount, dailyLimit, isInventoryTracked, reason } = req.body;
    const adminId = req.adminId; // 從session中獲取管理員ID

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: '變更原因為必填欄位'
      });
    }

    const updateData = {
      reason
    };

    // 根據提供的數據設置更新內容
    if (stock !== undefined) {
      updateData.stock = stock;
    }

    if (changeAmount !== undefined) {
      updateData.changeAmount = changeAmount;
    }

    if (dailyLimit !== undefined) {
      updateData.dailyLimit = dailyLimit;
    }

    if (isInventoryTracked !== undefined) {
      updateData.isInventoryTracked = isInventoryTracked;
    }

    const updatedInventoryItem = await inventoryService.updateInventory(
      storeId,
      dishId,
      updateData,
      adminId
    );

    res.json({
      success: true,
      message: '庫存更新成功',
      inventoryItem: updatedInventoryItem
    });
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 獲取庫存變更日誌
export const getInventoryLogs = asyncHandler(async (req, res) => {
  try {
    const { storeId } = req.params;
    const options = {
      dishId: req.query.dishId,
      startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
      changeType: req.query.changeType,
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 20
    };

    const logs = await inventoryService.getInventoryLogs(storeId, options);

    res.json({
      success: true,
      logs: logs.logs,
      pagination: logs.pagination
    });
  } catch (error) {
    console.error('Error getting inventory logs:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 獲取庫存趨勢
export const getStockTrends = asyncHandler(async (req, res) => {
  try {
    const { storeId, dishId } = req.params;
    const days = parseInt(req.query.days, 10) || 30;

    const trends = await inventoryService.getStockTrends(storeId, dishId, days);

    res.json({
      success: true,
      trends
    });
  } catch (error) {
    console.error('Error getting stock trends:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 獲取餐點庫存統計
export const getDishInventoryStats = asyncHandler(async (req, res) => {
  try {
    const { storeId, dishId } = req.params;

    const stats = await inventoryService.getDishInventoryStats(storeId, dishId);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting dish inventory stats:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 獲取庫存健康狀況報告
export const getInventoryHealthReport = asyncHandler(async (req, res) => {
  try {
    const { storeId } = req.params;
    const options = {
      lowStockThreshold: parseInt(req.query.lowStockThreshold, 10) || 5,
      criticalDaysThreshold: parseInt(req.query.criticalDaysThreshold, 10) || 3,
      overStockDaysThreshold: parseInt(req.query.overStockDaysThreshold, 10) || 30
    };

    const report = await inventoryService.getInventoryHealthReport(storeId, options);

    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error getting inventory health report:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 增加庫存
export const addStock = asyncHandler(async (req, res) => {
  try {
    const { storeId, dishId } = req.params;
    const { quantity, reason } = req.body;
    const adminId = req.adminId; // 從session中獲取管理員ID

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: '數量必須大於0'
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: '變更原因為必填欄位'
      });
    }

    const result = await inventoryService.addStock(storeId, dishId, quantity, reason, adminId);

    res.json({
      success: true,
      message: '庫存增加成功'
    });
  } catch (error) {
    console.error('Error adding stock:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 減少庫存
export const reduceStock = asyncHandler(async (req, res) => {
  try {
    const { storeId, dishId } = req.params;
    const { quantity, reason } = req.body;
    const adminId = req.adminId; // 從session中獲取管理員ID

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: '數量必須大於0'
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: '變更原因為必填欄位'
      });
    }

    const result = await inventoryService.reduceStock(storeId, dishId, quantity, reason, null, adminId);

    res.json({
      success: true,
      message: '庫存減少成功'
    });
  } catch (error) {
    console.error('Error reducing stock:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 設置每日限制
export const setDailyLimit = asyncHandler(async (req, res) => {
  try {
    const { storeId, dishId } = req.params;
    const { limit } = req.body;

    const result = await inventoryService.setDailyLimit(storeId, dishId, limit);

    res.json({
      success: true,
      message: '每日限制設置成功'
    });
  } catch (error) {
    console.error('Error setting daily limit:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 批量更新庫存
export const bulkUpdateInventory = asyncHandler(async (req, res) => {
  try {
    const { storeId } = req.params;
    const { items } = req.body;
    const adminId = req.adminId; // 從session中獲取管理員ID

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: '缺少有效的庫存數據'
      });
    }

    const results = await inventoryService.bulkUpdateInventory(storeId, items, adminId);

    res.json({
      success: true,
      message: '批量庫存更新成功',
      results
    });
  } catch (error) {
    console.error('Error bulk updating inventory:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 重置每日限制
export const resetDailyLimits = asyncHandler(async (req, res) => {
  try {
    const { storeId } = req.params;

    const resetCount = await inventoryService.resetDailyLimits(storeId);

    res.json({
      success: true,
      message: `已重置 ${resetCount} 個項目的每日限制`,
      count: resetCount
    });
  } catch (error) {
    console.error('Error resetting daily limits:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});
