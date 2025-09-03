import express from 'express'
import * as inventoryController from '../controllers/Store/inventory.js'
import {
  authenticate,
  requireRole,
  requireBrandAccess,
  requireStoreAccess,
} from '../middlewares/auth/index.js'

const router = express.Router()

// 庫存路由
// 獲取店鋪庫存
router.get('/brands/:brandId/:storeId/inventory', inventoryController.getStoreInventory)

// 創建庫存項目
router.post(
  '/brands/:brandId/:storeId/inventory',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
    'store_admin',
    'employee',
  ),
  requireBrandAccess,
  requireStoreAccess,
  inventoryController.createInventory,
)

// 獲取庫存摘要
router.get(
  '/brands/:brandId/:storeId/inventory/summary',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
    'store_admin',
  ),
  requireBrandAccess,
  requireStoreAccess,
  inventoryController.getStockChangeSummary,
)

// 獲取庫存健康報告
router.get(
  '/brands/:brandId/:storeId/inventory/health',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
    'store_admin',
  ),
  requireBrandAccess,
  requireStoreAccess,
  inventoryController.getInventoryHealthReport,
)

// 獲取庫存日誌
router.get(
  '/brands/:brandId/:storeId/inventory/logs',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
    'store_admin',
  ),
  requireBrandAccess,
  requireStoreAccess,
  inventoryController.getInventoryLogs,
)

// 批量更新庫存
router.post(
  '/brands/:brandId/:storeId/inventory/bulk',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
    'store_admin',
    'employee',
  ),
  requireBrandAccess,
  requireStoreAccess,
  inventoryController.bulkUpdateInventory,
)

// 初始化餐點庫存
router.post(
  '/brands/:brandId/:storeId/inventory/initialize-dishes',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
    'store_admin',
  ),
  requireBrandAccess,
  requireStoreAccess,
  inventoryController.initializeDishInventory,
)

// 獲取單個庫存項目
router.get(
  '/brands/:brandId/:storeId/inventory/:inventoryId',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
    'store_admin',
    'employee',
  ),
  requireBrandAccess,
  requireStoreAccess,
  inventoryController.getInventoryItem,
)

// 更新庫存項目
router.put(
  '/brands/:brandId/:storeId/inventory/:inventoryId',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
    'store_admin',
    'employee',
  ),
  requireBrandAccess,
  requireStoreAccess,
  inventoryController.updateInventory,
)

// 設定可用庫存
router.put(
  '/brands/:brandId/:storeId/inventory/:inventoryId/available-stock',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
    'store_admin',
    'employee',
  ),
  requireBrandAccess,
  requireStoreAccess,
  inventoryController.setAvailableStock,
)

// 減少庫存
router.post(
  '/brands/:brandId/:storeId/inventory/:inventoryId/reduce',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
    'store_admin',
    'employee',
  ),
  requireBrandAccess,
  requireStoreAccess,
  inventoryController.reduceStock,
)

// 增加庫存
router.post(
  '/brands/:brandId/:storeId/inventory/:inventoryId/add',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
    'store_admin',
    'employee',
  ),
  requireBrandAccess,
  requireStoreAccess,
  inventoryController.addStock,
)

// 處理損耗
router.post(
  '/brands/:brandId/:storeId/inventory/:inventoryId/damage',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
    'store_admin',
    'employee',
  ),
  requireBrandAccess,
  requireStoreAccess,
  inventoryController.processDamage,
)

// 切換售完狀態
router.put(
  '/brands/:brandId/:storeId/inventory/:inventoryId/sold-out',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
    'store_admin',
    'employee',
  ),
  requireBrandAccess,
  requireStoreAccess,
  inventoryController.toggleSoldOut,
)

// 獲取庫存統計
router.get(
  '/brands/:brandId/:storeId/inventory/:inventoryId/stats',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
    'store_admin',
  ),
  requireBrandAccess,
  requireStoreAccess,
  inventoryController.getItemInventoryStats,
)

export default router
