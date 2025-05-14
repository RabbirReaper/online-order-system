import express from 'express';
import * as storeController from '../controllers/Store/store.js';
import * as inventoryController from '../controllers/Store/inventory.js';
import * as menuController from '../controllers/Store/menu.js';
import { authMiddleware } from '../middlewares/auth.js';
import { permissionMiddleware, roleMiddleware, brandMiddleware } from '../middlewares/permission.js';

const router = express.Router();

// 店鋪基本操作
router.get('/brands/:brandId', storeController.getAllStores);
router.get('/brands/:brandId/:id', storeController.getStoreById);
router.post('/brands/:brandId', authMiddleware, roleMiddleware(['boss', 'brand_admin']), brandMiddleware, storeController.createStore);
router.put('/brands/:brandId/:id', authMiddleware, roleMiddleware(['boss', 'brand_admin']), brandMiddleware, storeController.updateStore);
router.delete('/brands/:brandId/:id', authMiddleware, roleMiddleware(['boss']), storeController.deleteStore);

// 店鋪狀態與詳情路由
router.get('/brands/:brandId/:id/business-hours', storeController.getStoreBusinessHours);
router.put('/brands/:brandId/:id/business-hours', authMiddleware, permissionMiddleware(['edit_backend']), storeController.updateStoreBusinessHours);
router.put('/brands/:brandId/:id/announcements', authMiddleware, permissionMiddleware(['edit_backend']), storeController.updateStoreAnnouncements);
router.get('/brands/:brandId/:id/status', storeController.getStoreCurrentStatus);

// 庫存路由
router.get('/brands/:brandId/:storeId/inventory', authMiddleware, permissionMiddleware(['order_system', 'view_reports']), inventoryController.getStoreInventory);
router.post('/brands/:brandId/:storeId/inventory', authMiddleware, permissionMiddleware(['order_system']), inventoryController.createInventory);

router.get('/brands/:brandId/:storeId/inventory/summary', authMiddleware, permissionMiddleware(['view_reports']), inventoryController.getStockChangeSummary);
router.get('/brands/:brandId/:storeId/inventory/health', authMiddleware, permissionMiddleware(['view_reports']), inventoryController.getInventoryHealthReport);
router.get('/brands/:brandId/:storeId/inventory/logs', authMiddleware, permissionMiddleware(['view_reports']), inventoryController.getInventoryLogs);
router.post('/brands/:brandId/:storeId/inventory/bulk', authMiddleware, permissionMiddleware(['order_system']), inventoryController.bulkUpdateInventory);

// 初始化餐點庫存
router.post('/brands/:brandId/:storeId/inventory/initialize-dishes', authMiddleware, permissionMiddleware(['order_system']), inventoryController.initializeDishInventory);

router.put('/brands/:brandId/:storeId/inventory/:inventoryId', authMiddleware, permissionMiddleware(['order_system']), inventoryController.updateInventory);
router.get('/brands/:brandId/:storeId/inventory/:inventoryId', authMiddleware, permissionMiddleware(['order_system', 'view_reports']), inventoryController.getInventoryItem);

// 新增設定可用庫存
router.put('/brands/:brandId/:storeId/inventory/:inventoryId/available-stock', authMiddleware, permissionMiddleware(['order_system']), inventoryController.setAvailableStock);

router.post('/brands/:brandId/:storeId/inventory/:inventoryId/reduce', authMiddleware, permissionMiddleware(['order_system']), inventoryController.reduceStock);
router.post('/brands/:brandId/:storeId/inventory/:inventoryId/add', authMiddleware, permissionMiddleware(['order_system']), inventoryController.addStock);
router.post('/brands/:brandId/:storeId/inventory/:inventoryId/damage', authMiddleware, permissionMiddleware(['order_system']), inventoryController.processDamage);
router.put('/brands/:brandId/:storeId/inventory/:inventoryId/sold-out', authMiddleware, permissionMiddleware(['order_system']), inventoryController.toggleSoldOut);
router.get('/brands/:brandId/:storeId/inventory/:inventoryId/trends', authMiddleware, permissionMiddleware(['view_reports']), inventoryController.getStockTrends);
router.get('/brands/:brandId/:storeId/inventory/:inventoryId/stats', authMiddleware, permissionMiddleware(['view_reports']), inventoryController.getItemInventoryStats);

//菜單路由
router.get('/brands/:brandId/:storeId/menu', menuController.getStoreMenu);
router.post('/brands/:brandId/:storeId/menu', authMiddleware, roleMiddleware(['boss', 'brand_admin']), brandMiddleware, menuController.createMenu);
router.put('/brands/:brandId/:storeId/menu/:menuId', authMiddleware, roleMiddleware(['boss', 'brand_admin']), brandMiddleware, menuController.updateMenu);
router.delete('/brands/:brandId/:storeId/menu/:menuId', authMiddleware, roleMiddleware(['boss', 'brand_admin']), brandMiddleware, menuController.deleteMenu);
router.put('/brands/:brandId/:storeId/menu/:menuId/toggle', authMiddleware, permissionMiddleware(['edit_backend']), menuController.toggleMenuActive);

router.put('/brands/:brandId/:storeId/menu/:menuId/toggle-item', authMiddleware, permissionMiddleware(['edit_backend']), menuController.toggleMenuItem);
router.put('/brands/:brandId/:storeId/menu/:menuId/category-order', authMiddleware, permissionMiddleware(['edit_backend']), menuController.updateCategoryOrder);
router.put('/brands/:brandId/:storeId/menu/:menuId/dish-order', authMiddleware, permissionMiddleware(['edit_backend']), menuController.updateDishOrder);
router.post('/brands/:brandId/:storeId/menu/:menuId/dish', authMiddleware, permissionMiddleware(['edit_backend']), menuController.addDishToMenu);
router.delete('/brands/:brandId/:storeId/menu/:menuId/dish', authMiddleware, permissionMiddleware(['edit_backend']), menuController.removeDishFromMenu);

export default router;
