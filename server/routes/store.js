import express from 'express';
import * as storeController from '../controllers/Store/store.js';
import * as inventoryController from '../controllers/Store/inventory.js';
import * as menuController from '../controllers/Store/menu.js';
import {
  authenticate,
  requireRole,
  requireBrandAccess,
  requireStoreAccess
} from '../middlewares/auth/index.js';

const router = express.Router();

// 店鋪基本操作
// 獲取品牌下的所有店鋪
router.get('/brands/:brandId',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  storeController.getAllStores
);

// 獲取單個店鋪
router.get('/brands/:brandId/:id',
  storeController.getStoreById
);

// 創建店鋪（系統級和品牌級管理員）
router.post('/brands/:brandId',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  storeController.createStore
);

// 更新店鋪（系統級和品牌級管理員）
router.put('/brands/:brandId/:id',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  storeController.updateStore
);

// 刪除店鋪（僅限系統級和primary_brand_admin）
router.delete('/brands/:brandId/:id',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin'),
  storeController.deleteStore
);

// 店鋪狀態與詳情路由
// 獲取店鋪營業時間
router.get('/brands/:brandId/:id/business-hours',
  storeController.getStoreBusinessHours
);

// 更新店鋪營業時間
router.put('/brands/:brandId/:id/business-hours',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin'),
  requireBrandAccess,
  requireStoreAccess,
  storeController.updateStoreBusinessHours
);

// 更新店鋪公告
router.put('/brands/:brandId/:id/announcements',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin'),
  requireBrandAccess,
  requireStoreAccess,
  storeController.updateStoreAnnouncements
);

// 獲取店鋪當前狀態
router.get('/brands/:brandId/:id/status',
  storeController.getStoreCurrentStatus
);

// 更新店鋪服務設定
router.put('/brands/:brandId/:id/service-settings',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin'),
  requireBrandAccess,
  requireStoreAccess,
  storeController.updateServiceSettings
);

// 庫存路由
// 獲取店鋪庫存
router.get('/brands/:brandId/:storeId/inventory',
  inventoryController.getStoreInventory
);

// 創建庫存項目
router.post('/brands/:brandId/:storeId/inventory',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin', 'employee'),
  requireBrandAccess,
  requireStoreAccess,
  inventoryController.createInventory
);

// 獲取庫存摘要
router.get('/brands/:brandId/:storeId/inventory/summary',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin'),
  requireBrandAccess,
  requireStoreAccess,
  inventoryController.getStockChangeSummary
);

// 獲取庫存健康報告
router.get('/brands/:brandId/:storeId/inventory/health',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin'),
  requireBrandAccess,
  requireStoreAccess,
  inventoryController.getInventoryHealthReport
);

// 獲取庫存日誌
router.get('/brands/:brandId/:storeId/inventory/logs',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin'),
  requireBrandAccess,
  requireStoreAccess,
  inventoryController.getInventoryLogs
);

// 批量更新庫存
router.post('/brands/:brandId/:storeId/inventory/bulk',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin', 'employee'),
  requireBrandAccess,
  requireStoreAccess,
  inventoryController.bulkUpdateInventory
);

// 初始化餐點庫存
router.post('/brands/:brandId/:storeId/inventory/initialize-dishes',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin'),
  requireBrandAccess,
  requireStoreAccess,
  inventoryController.initializeDishInventory
);

// 獲取單個庫存項目
router.get('/brands/:brandId/:storeId/inventory/:inventoryId',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin', 'employee'),
  requireBrandAccess,
  requireStoreAccess,
  inventoryController.getInventoryItem
);

// 更新庫存項目
router.put('/brands/:brandId/:storeId/inventory/:inventoryId',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin', 'employee'),
  requireBrandAccess,
  requireStoreAccess,
  inventoryController.updateInventory
);

// 設定可用庫存
router.put('/brands/:brandId/:storeId/inventory/:inventoryId/available-stock',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin', 'employee'),
  requireBrandAccess,
  requireStoreAccess,
  inventoryController.setAvailableStock
);

// 減少庫存
router.post('/brands/:brandId/:storeId/inventory/:inventoryId/reduce',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin', 'employee'),
  requireBrandAccess,
  requireStoreAccess,
  inventoryController.reduceStock
);

// 增加庫存
router.post('/brands/:brandId/:storeId/inventory/:inventoryId/add',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin', 'employee'),
  requireBrandAccess,
  requireStoreAccess,
  inventoryController.addStock
);

// 處理損耗
router.post('/brands/:brandId/:storeId/inventory/:inventoryId/damage',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin', 'employee'),
  requireBrandAccess,
  requireStoreAccess,
  inventoryController.processDamage
);

// 切換售完狀態
router.put('/brands/:brandId/:storeId/inventory/:inventoryId/sold-out',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin', 'employee'),
  requireBrandAccess,
  requireStoreAccess,
  inventoryController.toggleSoldOut
);

// 獲取庫存趨勢
router.get('/brands/:brandId/:storeId/inventory/:inventoryId/trends',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin'),
  requireBrandAccess,
  requireStoreAccess,
  inventoryController.getStockTrends
);

// 獲取庫存統計
router.get('/brands/:brandId/:storeId/inventory/:inventoryId/stats',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin'),
  requireBrandAccess,
  requireStoreAccess,
  inventoryController.getItemInventoryStats
);

// 菜單路由
// 獲取店鋪菜單
router.get('/brands/:brandId/:storeId/menu',
  menuController.getStoreMenu
);

// 創建菜單（系統級和品牌級）
router.post('/brands/:brandId/:storeId/menu',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  requireStoreAccess,
  menuController.createMenu
);

// 更新菜單（系統級和品牌級）
router.put('/brands/:brandId/:storeId/menu/:menuId',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  requireStoreAccess,
  menuController.updateMenu
);

// 刪除菜單（系統級和品牌級）
router.delete('/brands/:brandId/:storeId/menu/:menuId',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  requireStoreAccess,
  menuController.deleteMenu
);

// 切換菜單啟用狀態
router.put('/brands/:brandId/:storeId/menu/:menuId/toggle',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin'),
  requireBrandAccess,
  requireStoreAccess,
  menuController.toggleMenuActive
);

// 切換菜單項目
router.put('/brands/:brandId/:storeId/menu/:menuId/toggle-item',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin'),
  requireBrandAccess,
  requireStoreAccess,
  menuController.toggleMenuItem
);

// 更新分類順序
router.put('/brands/:brandId/:storeId/menu/:menuId/category-order',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin'),
  requireBrandAccess,
  requireStoreAccess,
  menuController.updateCategoryOrder
);

// 更新餐點順序
router.put('/brands/:brandId/:storeId/menu/:menuId/dish-order',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin'),
  requireBrandAccess,
  requireStoreAccess,
  menuController.updateDishOrder
);

// 添加餐點到菜單
router.post('/brands/:brandId/:storeId/menu/:menuId/dish',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin'),
  requireBrandAccess,
  requireStoreAccess,
  menuController.addDishToMenu
);

// 從菜單移除餐點
router.delete('/brands/:brandId/:storeId/menu/:menuId/dish',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin'),
  requireBrandAccess,
  requireStoreAccess,
  menuController.removeDishFromMenu
);

export default router;
