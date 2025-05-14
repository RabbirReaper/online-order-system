import express from 'express';
import * as couponTemplateController from '../controllers/Promotion/couponTemplate.js';
import * as couponInstanceController from '../controllers/Promotion/couponInstance.js';
import * as pointRuleController from '../controllers/Promotion/pointRule.js';
import * as pointInstanceController from '../controllers/Promotion/pointInstance.js';
import { authMiddleware } from '../middlewares/auth.js';
import { permissionMiddleware, roleMiddleware, brandMiddleware } from '../middlewares/permission.js';
import { userAuthMiddleware } from '../middlewares/userAuth.js';

const router = express.Router();

// 優惠券模板路由 (後台) - 由品牌管理員或老闆管理
router.get('/brands/:brandId/coupons/templates', authMiddleware, roleMiddleware(['boss', 'brand_admin']), brandMiddleware, couponTemplateController.getAllCouponTemplates);
router.get('/brands/:brandId/coupons/templates/:id', authMiddleware, roleMiddleware(['boss', 'brand_admin']), brandMiddleware, couponTemplateController.getCouponTemplateById);
router.post('/brands/:brandId/coupons/templates', authMiddleware, roleMiddleware(['boss', 'brand_admin']), brandMiddleware, couponTemplateController.createCouponTemplate);
router.put('/brands/:brandId/coupons/templates/:id', authMiddleware, roleMiddleware(['boss', 'brand_admin']), brandMiddleware, couponTemplateController.updateCouponTemplate);
router.delete('/brands/:brandId/coupons/templates/:id', authMiddleware, roleMiddleware(['boss', 'brand_admin']), brandMiddleware, couponTemplateController.deleteCouponTemplate);

// 優惠券實例路由 (後台)
router.get('/brands/:brandId/coupons/instances/admin', authMiddleware, permissionMiddleware(['view_reports']), couponInstanceController.getAllCouponInstances);
router.post('/brands/:brandId/coupons/instances/issue', authMiddleware, permissionMiddleware(['edit_backend']), couponInstanceController.issueCouponToUser);

// 優惠券路由 (用戶)
router.get('/brands/:brandId/coupons', userAuthMiddleware, couponInstanceController.getUserCoupons);
router.post('/brands/:brandId/coupons/redeem', userAuthMiddleware, couponInstanceController.redeemCoupon);
// router.get('/brands/:brandId/coupons/available', userAuthMiddleware, couponTemplateController.getAvailableCouponTemplates);

// 點數規則路由 (後台) - 由品牌管理員或老闆管理
router.get('/brands/:brandId/points/rules', authMiddleware, roleMiddleware(['boss', 'brand_admin', 'store_admin']), brandMiddleware, pointRuleController.getAllPointRules);
router.get('/brands/:brandId/points/rules/:id', authMiddleware, roleMiddleware(['boss', 'brand_admin', 'store_admin']), brandMiddleware, pointRuleController.getPointRuleById);
router.post('/brands/:brandId/points/rules', authMiddleware, roleMiddleware(['boss', 'brand_admin']), brandMiddleware, pointRuleController.createPointRule);
router.put('/brands/:brandId/points/rules/:id', authMiddleware, roleMiddleware(['boss', 'brand_admin']), brandMiddleware, pointRuleController.updatePointRule);
router.delete('/brands/:brandId/points/rules/:id', authMiddleware, roleMiddleware(['boss', 'brand_admin']), brandMiddleware, pointRuleController.deletePointRule);

// 點數路由 (用戶)
router.get('/brands/:brandId/points', userAuthMiddleware, pointInstanceController.getUserPoints);
router.get('/brands/:brandId/points/history', userAuthMiddleware, pointInstanceController.getUserPointHistory);

// 點數管理 (後台)
router.post('/brands/:brandId/points/add', authMiddleware, permissionMiddleware(['edit_backend']), pointInstanceController.addPointsToUser);

export default router;
