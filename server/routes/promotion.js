import express from 'express';
import * as couponTemplateController from '../controllers/Promotion/couponTemplate.js';
import * as couponInstanceController from '../controllers/Promotion/couponInstance.js';
import * as pointRuleController from '../controllers/Promotion/pointRule.js';
import * as pointInstanceController from '../controllers/Promotion/pointInstance.js';
import {
  authenticate,
  requireRole,
  requireBrandAccess,
  requirePermission
} from '../middlewares/auth/index.js';

const router = express.Router();

// 優惠券模板路由（後台）
// 獲取所有優惠券模板
router.get('/brands/:brandId/coupons/templates', authenticate('admin'), requireRole('boss', 'brand_admin'), requireBrandAccess, couponTemplateController.getAllCouponTemplates);

// 獲取單個優惠券模板
router.get('/brands/:brandId/coupons/templates/:id', authenticate('admin'), requireRole('boss', 'brand_admin'), requireBrandAccess, couponTemplateController.getCouponTemplateById);

// 創建優惠券模板
router.post('/brands/:brandId/coupons/templates', authenticate('admin'), requireRole('boss', 'brand_admin'), requireBrandAccess, couponTemplateController.createCouponTemplate);

// 更新優惠券模板
router.put('/brands/:brandId/coupons/templates/:id', authenticate('admin'), requireRole('boss', 'brand_admin'), requireBrandAccess, couponTemplateController.updateCouponTemplate);

// 刪除優惠券模板
router.delete('/brands/:brandId/coupons/templates/:id', authenticate('admin'), requireRole('boss', 'brand_admin'), requireBrandAccess, couponTemplateController.deleteCouponTemplate);

// 優惠券實例路由（後台）
// 獲取所有優惠券實例
router.get('/brands/:brandId/coupons/instances/admin', authenticate('admin'), requireRole('boss', 'brand_admin', 'store_admin'), requireBrandAccess, requirePermission('view_reports'), couponInstanceController.getAllCouponInstances);

// 發放優惠券給用戶
router.post('/brands/:brandId/coupons/instances/issue', authenticate('admin'), requireRole('boss', 'brand_admin', 'store_admin'), requireBrandAccess, requirePermission('edit_backend'), couponInstanceController.issueCouponToUser);

// 優惠券路由（用戶）
// 獲取用戶優惠券
router.get('/brands/:brandId/coupons', authenticate('user'), couponInstanceController.getUserCoupons);

// 兌換優惠券
router.post('/brands/:brandId/coupons/redeem', authenticate('user'), couponInstanceController.redeemCoupon);

// 點數規則路由（後台）
// 獲取所有點數規則
router.get('/brands/:brandId/points/rules', authenticate('admin'), requireRole('boss', 'brand_admin', 'store_admin'), requireBrandAccess, pointRuleController.getAllPointRules);

// 獲取單個點數規則
router.get('/brands/:brandId/points/rules/:id', authenticate('admin'), requireRole('boss', 'brand_admin', 'store_admin'), requireBrandAccess, pointRuleController.getPointRuleById);

// 創建點數規則
router.post('/brands/:brandId/points/rules', authenticate('admin'), requireRole('boss', 'brand_admin'), requireBrandAccess, pointRuleController.createPointRule);

// 更新點數規則
router.put('/brands/:brandId/points/rules/:id', authenticate('admin'), requireRole('boss', 'brand_admin'), requireBrandAccess, pointRuleController.updatePointRule);

// 刪除點數規則
router.delete('/brands/:brandId/points/rules/:id', authenticate('admin'), requireRole('boss', 'brand_admin'), requireBrandAccess, pointRuleController.deletePointRule);

// 點數路由（用戶）
// 獲取用戶點數
router.get('/brands/:brandId/points', authenticate('user'), pointInstanceController.getUserPoints);

// 獲取用戶點數歷史
router.get('/brands/:brandId/points/history', authenticate('user'), pointInstanceController.getUserPointHistory);

// 點數管理（後台）
// 給用戶添加點數
router.post('/brands/:brandId/points/add', authenticate('admin'), requireRole('boss', 'brand_admin', 'store_admin'), requireBrandAccess, requirePermission('edit_backend'), pointInstanceController.addPointsToUser);

export default router;
