import express from 'express'
import * as couponTemplateController from '../controllers/Promotion/couponTemplate.js'
import * as couponInstanceController from '../controllers/Promotion/couponInstance.js'
import * as voucherTemplateController from '../controllers/Promotion/voucherTemplate.js'
import * as voucherInstanceController from '../controllers/Promotion/voucherInstance.js'
import * as pointRuleController from '../controllers/Promotion/pointRule.js'
import * as pointInstanceController from '../controllers/Promotion/pointInstance.js'
import { authenticate, requireRole, requireBrandAccess } from '../middlewares/auth/index.js'

const router = express.Router()

// =============================================================================
// 優惠券模板路由（後台管理）- Coupon 系統
// =============================================================================

/**
 * 獲取所有優惠券模板
 */
router.get(
  '/brands/:brandId/coupons/templates',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  couponTemplateController.getAllCouponTemplates,
)

/**
 * 創建優惠券模板
 */
router.post(
  '/brands/:brandId/coupons/templates',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  couponTemplateController.createCouponTemplate,
)

/**
 * 獲取單個優惠券模板
 */
router.get(
  '/brands/:brandId/coupons/templates/:id',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  couponTemplateController.getCouponTemplateById,
)

/**
 * 更新優惠券模板
 */
router.put(
  '/brands/:brandId/coupons/templates/:id',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  couponTemplateController.updateCouponTemplate,
)

/**
 * 刪除優惠券模板
 */
router.delete(
  '/brands/:brandId/coupons/templates/:id',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  couponTemplateController.deleteCouponTemplate,
)

/**
 * 根據模板ID獲取優惠券統計（管理員功能）
 */
router.get(
  '/brands/:brandId/coupons/templates/:templateId/instances',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  couponInstanceController.getCouponInstanceStatsByTemplate,
)

// =============================================================================
// 優惠券實例路由（後台管理）- Coupon 系統
// =============================================================================

/**
 * 發放優惠券給用戶（管理員）
 */
router.post(
  '/brands/:brandId/coupons/instances/issue',
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
  couponInstanceController.issueCouponToUser,
)

/**
 * 獲取指定用戶的優惠券實例（管理員功能）
 */
router.get(
  '/brands/:brandId/coupons/instances/users/:userId',
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
  couponInstanceController.getUserCouponInstancesAdmin,
)

// =============================================================================
// 優惠券路由（用戶端）- Coupon 系統
// =============================================================================

/**
 * 獲取用戶優惠券
 */
router.get(
  '/brands/:brandId/coupons',
  authenticate('user'),
  couponInstanceController.getUserCoupons,
)

/**
 * 使用優惠券
 */
router.post(
  '/brands/:brandId/coupons/use',
  authenticate('user'),
  couponInstanceController.useCoupon,
)

/**
 * 驗證優惠券
 */
router.get(
  '/brands/:brandId/coupons/:couponId/validate',
  authenticate('user'),
  couponInstanceController.validateCoupon,
)

// =============================================================================
// 兌換券模板路由（後台）- Voucher 系統
// =============================================================================

// 🆕 自動為餐點創建兌換券模板
router.post(
  '/brands/:brandId/vouchers/templates/auto-create',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  voucherTemplateController.autoCreateVoucherTemplatesForDishes,
)

// 獲取可用的兌換券模板（供 Bundle 創建時使用）
router.get(
  '/brands/:brandId/vouchers/templates/available',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  voucherTemplateController.getAvailableVoucherTemplates,
)

// 獲取單個兌換券模板
router.get(
  '/brands/:brandId/vouchers/templates/:id',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  voucherTemplateController.getVoucherTemplateById,
)

// 更新兌換券模板
router.put(
  '/brands/:brandId/vouchers/templates/:id',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  voucherTemplateController.updateVoucherTemplate,
)

// 刪除兌換券模板
router.delete(
  '/brands/:brandId/vouchers/templates/:id',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  voucherTemplateController.deleteVoucherTemplate,
)

// 獲取所有兌換券模板
router.get(
  '/brands/:brandId/vouchers/templates',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  voucherTemplateController.getAllVoucherTemplates,
)

// 創建兌換券模板
router.post(
  '/brands/:brandId/vouchers/templates',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  voucherTemplateController.createVoucherTemplate,
)

/**
 * 根據模板ID獲取兌換券統計（管理員功能）
 */
router.get(
  '/brands/:brandId/vouchers/templates/:templateId/instances',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  voucherTemplateController.getVoucherInstanceStatsByTemplate,
)

// =============================================================================
// 兌換券實例路由（後台管理）- Voucher 系統
// =============================================================================

/**
 * 獲取指定用戶的兌換券實例（管理員功能）
 */
router.get(
  '/brands/:brandId/vouchers/instances/users/:userId',
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
  voucherInstanceController.getUserVoucherInstancesAdmin,
)

// =============================================================================
// 兌換券路由（用戶）- Voucher 系統
// =============================================================================

// 使用兌換券
router.post(
  '/brands/:brandId/vouchers/use',
  authenticate('user'),
  voucherInstanceController.useVoucher,
)

// 驗證兌換券
router.get(
  '/brands/:brandId/vouchers/:voucherId/validate',
  authenticate('user'),
  voucherInstanceController.validateVoucher,
)

// 獲取用戶兌換券
router.get(
  '/brands/:brandId/vouchers',
  authenticate('user'),
  voucherInstanceController.getUserVouchers,
)

// =============================================================================
// 點數規則路由（後台）
// =============================================================================

// 獲取單個點數規則
router.get(
  '/brands/:brandId/points/rules/:id',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  pointRuleController.getPointRuleById,
)

// 更新點數規則
router.put(
  '/brands/:brandId/points/rules/:id',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  pointRuleController.updatePointRule,
)

// 刪除點數規則
router.delete(
  '/brands/:brandId/points/rules/:id',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  pointRuleController.deletePointRule,
)

// 獲取所有點數規則
router.get(
  '/brands/:brandId/points/rules',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  pointRuleController.getAllPointRules,
)

// 創建點數規則
router.post(
  '/brands/:brandId/points/rules',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  pointRuleController.createPointRule,
)

// =============================================================================
// 點數路由（用戶）
// =============================================================================

// 獲取用戶點數歷史
router.get(
  '/brands/:brandId/points/history',
  authenticate('user'),
  pointInstanceController.getUserPointHistory,
)

// 獲取用戶點數餘額
router.get(
  '/brands/:brandId/points/balance',
  authenticate('user'),
  pointInstanceController.getUserPoints,
)

// 🆕 獲取啟用的點數規則（客戶端）
router.get('/brands/:brandId/points/active-rules', pointRuleController.getActivePointRules)

export default router
