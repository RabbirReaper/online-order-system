import express from 'express'
import * as deliveryController from '../controllers/Delivery/deliveryPlatform.js'
import { authenticate, requireRole } from '../middlewares/auth/index.js'

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
 * POST /api/delivery/ubereats/stores/:storeId/auto-provision
 * Body: { userAccessToken: string }
 */
router.post(
  '/ubereats/stores/:storeId/auto-provision',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  deliveryController.autoProvisionUberEatsStore,
)

/**
 * 獲取 UberEats 店鋪訂單列表
 * GET /api/delivery/ubereats/stores/:storeId/orders
 * Query params: limit, offset, status, etc.
 */
router.get(
  '/ubereats/stores/:storeId/orders',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  deliveryController.getUberEatsStoreOrders,
)

/**
 * 取消 UberEats 店鋪訂單
 * POST /api/delivery/ubereats/stores/:storeId/orders/:orderId/cancel
 * Body: { reason?: string }
 */
router.post(
  '/ubereats/stores/:storeId/orders/:orderId/cancel',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  deliveryController.cancelUberEatsOrder,
)

// =============================================================================
// 📋 Phase 2: TODO - 其他 UberEats API 功能（註解待實作）
// =============================================================================

/**
 * TODO: 更新 UberEats 店鋪營業狀態
 * PATCH /api/delivery/ubereats/stores/status
 * Body: { storeId: string, status: 'ONLINE' | 'OFFLINE' | 'PAUSE' }
 */
/*
router.patch(
  '/ubereats/stores/status',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  deliveryController.updateUberEatsStoreStatus,
)
*/

/**
 * TODO: 獲取 UberEats 店鋪營業狀態
 * GET /api/delivery/ubereats/stores/:storeId/status
 */
/*
router.get(
  '/ubereats/stores/:storeId/status',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  deliveryController.getUberEatsStoreStatus,
)
*/

/**
 * TODO: 獲取 UberEats 店鋪資訊
 * GET /api/delivery/ubereats/stores/:storeId
 */
/*
router.get(
  '/ubereats/stores/:storeId',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  deliveryController.getUberEatsStoreInfo,
)
*/

export default router
