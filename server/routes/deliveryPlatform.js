import express from 'express'
import * as deliveryController from '../controllers/Delivery/deliveryPlatform.js'
import {
  authenticate,
  requireRole,
  requireBrandAccess,
  requireStoreAccess,
} from '../middlewares/auth/index.js'

const router = express.Router()

// =============================================================================
// 外送平台 Webhook 路由（公開，供外部平台呼叫）
// =============================================================================

/**
 * 接收來自外送平台的 webhook
 * POST /api/delivery/webhook/:platform
 * 支援的平台: ubereats, foodpanda
 */
router.post('/webhook/:platform', deliveryController.handleWebhook)

// =============================================================================
// 平台資訊查詢路由
// =============================================================================

/**
 * 獲取支援的外送平台列表
 * GET /api/delivery/platforms
 */
router.get('/platforms', deliveryController.getSupportedPlatforms)

/**
 * 檢查 UberEats 配置狀態
 * GET /api/delivery/ubereats/config
 */
router.get(
  '/ubereats/config',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  deliveryController.checkUberEatsConfig,
)

/**
 * 檢查 Token 狀態
 * GET /api/delivery/ubereats/token-status
 */
router.get(
  '/ubereats/token-status',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin'),
  deliveryController.checkTokenStatus,
)

/**
 * 刷新 User Access Token
 * POST /api/delivery/ubereats/refresh-token
 */
router.post(
  '/ubereats/refresh-token',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin'),
  deliveryController.refreshUserToken,
)

// =============================================================================
// 平台管理功能路由（需要管理員權限）
// =============================================================================

/**
 * 驗證平台設定
 * POST /api/delivery/validate-settings
 * Body: { platform: string, settings: object }
 */
router.post(
  '/validate-settings',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  deliveryController.validatePlatformSettings,
)

/**
 * 測試單一平台連接
 * GET /api/delivery/test-connection/:platform
 */
router.get(
  '/test-connection/:platform',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  deliveryController.testPlatformConnection,
)

/**
 * 測試所有平台連接狀態
 * GET /api/delivery/test-connections
 */
router.get(
  '/test-connections',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  deliveryController.testAllConnections,
)

// =============================================================================
// 開發和測試工具路由（僅限開發環境）
// =============================================================================

/**
 * 創建測試 webhook 資料
 * POST /api/delivery/test-webhook/:platform
 * Body: { orderId?: string }
 *
 * 注意：此功能僅限開發環境使用
 */
router.post(
  '/test-webhook/:platform',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin'),
  deliveryController.createTestWebhook,
)

// =============================================================================
// 🚀 Phase 1: UberEats 訂單同步功能 (優先實作)
// =============================================================================

/**
 * 自動 Provisioning UberEats 店鋪整合
 * POST /api/delivery/brands/:brandId/stores/:storeId/ubereats/auto-provision
 * Body: { userAccessToken: string }
 */
router.post(
  '/brands/:brandId/stores/:storeId/ubereats/auto-provision',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  requireStoreAccess,
  deliveryController.autoProvisionUberEatsStore,
)

/**
 * 獲取 UberEats 店鋪訂單列表
 * GET /api/delivery/brands/:brandId/stores/:storeId/ubereats/orders
 * Query params: limit, offset, status, etc.
 */
router.get(
  '/brands/:brandId/stores/:storeId/ubereats/orders',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  requireStoreAccess,
  deliveryController.getUberEatsStoreOrders,
)

/**
 * 取消 UberEats 店鋪訂單
 * POST /api/delivery/brands/:brandId/stores/:storeId/ubereats/orders/:orderId/cancel
 * Body: { reason?: string }
 */
router.post(
  '/brands/:brandId/stores/:storeId/ubereats/orders/:orderId/cancel',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  requireStoreAccess,
  deliveryController.cancelUberEatsOrder,
)

// =============================================================================
// 📋 Phase 2: UberEats 店鋪管理功能
// =============================================================================

/**
 * 獲取 UberEats 店鋪詳細資訊
 * GET /api/delivery/brands/:brandId/stores/:storeId/ubereats/details
 */
router.get(
  '/brands/:brandId/stores/:storeId/ubereats/details',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  requireStoreAccess,
  deliveryController.getUberEatsStoreDetails,
)

/**
 * 設定 UberEats 店鋪詳細資訊
 * PUT /api/delivery/brands/:brandId/stores/:storeId/ubereats/details
 * Body: { name?, description?, phone?, address?, etc. }
 */
router.put(
  '/brands/:brandId/stores/:storeId/ubereats/details',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  requireStoreAccess,
  deliveryController.setUberEatsStoreDetails,
)

/**
 * 獲取 UberEats 店鋪營業狀態
 * GET /api/delivery/brands/:brandId/stores/:storeId/ubereats/status
 */
router.get(
  '/brands/:brandId/stores/:storeId/ubereats/status',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  requireStoreAccess,
  deliveryController.getUberEatsStoreStatus,
)

/**
 * 設定 UberEats 店鋪營業狀態
 * PUT /api/delivery/brands/:brandId/stores/:storeId/ubereats/status
 * Body: { status: 'ONLINE' | 'OFFLINE', reason?: string, is_offline_until?: string }
 */
router.put(
  '/brands/:brandId/stores/:storeId/ubereats/status',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  requireStoreAccess,
  deliveryController.setUberEatsStoreStatus,
)

/**
 * 設定 UberEats 店鋪準備時間
 * PUT /api/delivery/brands/:brandId/stores/:storeId/ubereats/prep-time
 * Body: { prepTime: number } (0-10800 seconds)
 */
router.put(
  '/brands/:brandId/stores/:storeId/ubereats/prep-time',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  requireStoreAccess,
  deliveryController.setUberEatsPrepTime,
)

/**
 * 上傳菜單到 UberEats
 * POST /api/delivery/brands/:brandId/stores/:storeId/ubereats/menu
 * Body: { menuId: string }
 */
router.post(
  '/brands/:brandId/stores/:storeId/ubereats/menu',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  requireStoreAccess,
  deliveryController.uploadUberEatsMenu,
)

export default router
