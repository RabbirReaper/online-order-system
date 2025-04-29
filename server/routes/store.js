import express from 'express';
import * as storeController from '../controllers/Store/store.js';
import * as inventoryController from '../controllers/Store/inventory.js';
import * as brandController from '../controllers/Brand/brand.js';
import * as menuController from '../controllers/Menu/menu.js';
import { authMiddleware } from '../middlewares/auth.js';
import { permissionMiddleware, roleMiddleware } from '../middlewares/permission.js';

const router = express.Router();

// 店鋪路由
router.get('/', storeController.getAllStores);
router.get('/:id', storeController.getStoreById);
router.post('/', authMiddleware, roleMiddleware(['boss', 'brand_admin']), storeController.createStore);
router.put('/:id', authMiddleware, roleMiddleware(['boss', 'brand_admin']), storeController.updateStore);
router.delete('/:id', authMiddleware, roleMiddleware(['boss']), storeController.deleteStore); // 只有老闆可以刪除店鋪

// 店鋪狀態與詳情路由
router.get('/:id/business-hours', storeController.getStoreBusinessHours);
router.put('/:id/business-hours', authMiddleware, permissionMiddleware(['edit_backend']), storeController.updateStoreBusinessHours);
router.put('/:id/announcements', authMiddleware, permissionMiddleware(['edit_backend']), storeController.updateStoreAnnouncements);
router.get('/:id/status', storeController.getStoreCurrentStatus);

// 庫存路由
router.get('/:storeId/inventory', authMiddleware, permissionMiddleware(['order_system', 'view_reports']), inventoryController.getStoreInventory);
router.get('/:storeId/inventory/:dishId', authMiddleware, permissionMiddleware(['order_system', 'view_reports']), inventoryController.getInventoryItem);
router.post('/:storeId/inventory', authMiddleware, permissionMiddleware(['order_system']), inventoryController.createInventory); // 創建新的庫存項目
router.put('/:storeId/inventory/:dishId', authMiddleware, permissionMiddleware(['order_system']), inventoryController.updateInventory); // 更新現有庫存
router.get('/:storeId/inventory/logs', authMiddleware, permissionMiddleware(['view_reports']), inventoryController.getInventoryLogs);

// 品牌路由
router.get('/brands', brandController.getAllBrands);
router.get('/brands/:id', brandController.getBrandById);
router.post('/brands', authMiddleware, roleMiddleware(['boss']), brandController.createBrand); // 只有老闆可以創建品牌
router.put('/brands/:id', authMiddleware, roleMiddleware(['boss']), brandController.updateBrand); // 只有老闆可以更新品牌
router.delete('/brands/:id', authMiddleware, roleMiddleware(['boss']), brandController.deleteBrand); // 只有老闆可以刪除品牌
router.get('/brands/:id/stores', brandController.getBrandStores);
router.get('/brands/:id/stats', brandController.getBrandStats);

// 菜單路由
router.get('/:storeId/menu', menuController.getStoreMenu);
router.post('/:storeId/menu', authMiddleware, roleMiddleware(['boss', 'brand_admin']), menuController.createMenu);
router.put('/:storeId/menu/:menuId', authMiddleware, roleMiddleware(['boss', 'brand_admin']), menuController.updateMenu);
router.delete('/:storeId/menu/:menuId', authMiddleware, roleMiddleware(['boss', 'brand_admin']), menuController.deleteMenu);
router.put('/:storeId/menu/:menuId/toggle', authMiddleware, permissionMiddleware(['edit_backend']), menuController.toggleMenuActive); // 店家管理員可以啟用/停用菜單

export default router;
