import express from 'express';
import * as storeController from '../controllers/Store/store.js';
import * as inventoryController from '../controllers/Store/inventory.js';
import * as brandController from '../controllers/Brand/brand.js';
import * as menuController from '../controllers/Store/menu.js';
import { authMiddleware } from '../middlewares/auth.js';
import { permissionMiddleware, roleMiddleware } from '../middlewares/permission.js';

const router = express.Router();

// 保留品牌路由 - 這是我們目前需要的功能
router.get('/brands', brandController.getAllBrands);
router.get('/brands/:id', brandController.getBrandById);
router.post('/brands', authMiddleware, roleMiddleware(['boss']), brandController.createBrand);
router.put('/brands/:id', authMiddleware, roleMiddleware(['boss']), brandController.updateBrand);
router.delete('/brands/:id', authMiddleware, roleMiddleware(['boss']), brandController.deleteBrand);
router.get('/brands/:id/stores', brandController.getBrandStores);
router.put('/brands/:id/toggle', authMiddleware, roleMiddleware(['boss']), brandController.toggleBrandActive);
// router.get('/brands/:id/stats', brandController.getBrandStats);

// 店鋪基本操作
router.get('/', storeController.getAllStores);
router.get('/:id', storeController.getStoreById);
router.post('/', authMiddleware, roleMiddleware(['boss', 'brand_admin']), storeController.createStore);
router.put('/:id', authMiddleware, roleMiddleware(['boss', 'brand_admin']), storeController.updateStore);
router.delete('/:id', authMiddleware, roleMiddleware(['boss']), storeController.deleteStore);

// 店鋪狀態與詳情路由
router.get('/:id/business-hours', storeController.getStoreBusinessHours);
router.put('/:id/business-hours', authMiddleware, permissionMiddleware(['edit_backend']), storeController.updateStoreBusinessHours);
router.put('/:id/announcements', authMiddleware, permissionMiddleware(['edit_backend']), storeController.updateStoreAnnouncements);
router.get('/:id/status', storeController.getStoreCurrentStatus);

// 庫存路由
router.get('/:storeId/inventory', authMiddleware, permissionMiddleware(['order_system', 'view_reports']), inventoryController.getStoreInventory);
router.post('/:storeId/inventory', authMiddleware, permissionMiddleware(['order_system']), inventoryController.createInventory);

router.get('/:storeId/inventory/summary', authMiddleware, permissionMiddleware(['view_reports']), inventoryController.getStockChangeSummary);
router.get('/:storeId/inventory/health', authMiddleware, permissionMiddleware(['view_reports']), inventoryController.getInventoryHealthReport);
router.get('/:storeId/inventory/logs', authMiddleware, permissionMiddleware(['view_reports']), inventoryController.getInventoryLogs);
router.post('/:storeId/inventory/bulk', authMiddleware, permissionMiddleware(['order_system']), inventoryController.bulkUpdateInventory);

// 初始化餐點庫存
router.post('/:storeId/inventory/initialize-dishes', authMiddleware, permissionMiddleware(['order_system']), inventoryController.initializeDishInventory);

router.put('/:storeId/inventory/:inventoryId', authMiddleware, permissionMiddleware(['order_system']), inventoryController.updateInventory);
router.get('/:storeId/inventory/:inventoryId', authMiddleware, permissionMiddleware(['order_system', 'view_reports']), inventoryController.getInventoryItem);

router.post('/:storeId/inventory/:inventoryId/reduce', authMiddleware, permissionMiddleware(['order_system']), inventoryController.reduceStock);
router.post('/:storeId/inventory/:inventoryId/add', authMiddleware, permissionMiddleware(['order_system']), inventoryController.addStock);
router.post('/:storeId/inventory/:inventoryId/transfer', authMiddleware, permissionMiddleware(['order_system']), inventoryController.transferStock);
router.post('/:storeId/inventory/:inventoryId/damage', authMiddleware, permissionMiddleware(['order_system']), inventoryController.processDamage);
router.put('/:storeId/inventory/:inventoryId/sold-out', authMiddleware, permissionMiddleware(['order_system']), inventoryController.toggleSoldOut);
router.get('/:storeId/inventory/:inventoryId/trends', authMiddleware, permissionMiddleware(['view_reports']), inventoryController.getStockTrends);
router.get('/:storeId/inventory/:inventoryId/stats', authMiddleware, permissionMiddleware(['view_reports']), inventoryController.getItemInventoryStats);

//菜單路由
router.get('/:storeId/menu', menuController.getStoreMenu);
router.post('/:storeId/menu', authMiddleware, roleMiddleware(['boss', 'brand_admin']), menuController.createMenu);
router.put('/:storeId/menu/:menuId', authMiddleware, roleMiddleware(['boss', 'brand_admin']), menuController.updateMenu);
router.delete('/:storeId/menu/:menuId', authMiddleware, roleMiddleware(['boss', 'brand_admin']), menuController.deleteMenu);
router.put('/:storeId/menu/:menuId/toggle', authMiddleware, permissionMiddleware(['edit_backend']), menuController.toggleMenuActive);

router.put('/:storeId/menu/:menuId/toggle-item', authMiddleware, permissionMiddleware(['edit_backend']), menuController.toggleMenuItem);
router.put('/:storeId/menu/:menuId/category-order', authMiddleware, permissionMiddleware(['edit_backend']), menuController.updateCategoryOrder);
router.put('/:storeId/menu/:menuId/dish-order', authMiddleware, permissionMiddleware(['edit_backend']), menuController.updateDishOrder);
router.post('/:storeId/menu/:menuId/dish', authMiddleware, permissionMiddleware(['edit_backend']), menuController.addDishToMenu);
router.delete('/:storeId/menu/:menuId/dish', authMiddleware, permissionMiddleware(['edit_backend']), menuController.removeDishFromMenu);

export default router;
