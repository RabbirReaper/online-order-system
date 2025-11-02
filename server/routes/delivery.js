import express from 'express'
import * as deliveryController from '../controllers/Delivery/delivery.js'
import {
  authenticate,
  requireRole,
  requireBrandAccess,
  requireStoreAccess,
} from '../middlewares/auth/index.js'
import { verifyUberEatsWebhookMiddleware } from '../middlewares/webhookVerification.js'

const router = express.Router()

// 外送平台管理路由
// 所有路由都遵循 /brands/:brandId/:storeId 的格式

/**
 * 同步菜單到所有啟用的外送平台
 * POST /delivery/brands/:brandId/:storeId/sync-menu
 */
router.post(
  '/brands/:brandId/:storeId/sync-menu',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
  ),
  requireBrandAccess,
  requireStoreAccess,
  deliveryController.syncMenuToAllPlatforms,
)

/**
 * 獲取菜單同步狀態
 * GET /delivery/brands/:brandId/:storeId/sync-status
 */
router.get(
  '/brands/:brandId/:storeId/sync-status',
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
  deliveryController.getMenuSyncStatus,
)

/**
 * 同步庫存狀態到 UberEats
 * POST /delivery/brands/:brandId/:storeId/sync-inventory
 */
router.post(
  '/brands/:brandId/:storeId/sync-inventory',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
  ),
  requireBrandAccess,
  requireStoreAccess,
  deliveryController.syncInventoryStatusToUberEats,
)

/**
 * Uber Eats Webhook 接收端點
 * POST /delivery/webhooks/ubereats
 *
 * 注意: 此路由使用 express.raw() 保留原始 body 用於簽名驗證
 * 驗證成功後，middleware 會將 body 解析為 JSON 物件
 */
router.post(
  '/webhooks/ubereats',
  express.raw({ type: 'application/json' }), // 保留原始 body
  verifyUberEatsWebhookMiddleware, // 簽名驗證
  deliveryController.handleUberEatsWebhook,
)

/**
 * Foodpanda Webhook 接收端點
 * POST /delivery/webhooks/foodpanda
 */
router.post('/webhooks/foodpanda', deliveryController.handleFoodpandaWebhook)

router.post(
  '/webhooks/foodpanda/catalog-callback',
  deliveryController.handleFoodpandaCatalogCallback,
)

export default router
