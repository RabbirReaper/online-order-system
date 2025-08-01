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

export default router
