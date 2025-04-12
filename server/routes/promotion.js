import express from 'express';
import * as couponTemplateController from '../controllers/Promotion/couponTemplate.js';
import * as couponInstanceController from '../controllers/Promotion/couponInstance.js';
import * as pointRuleController from '../controllers/Promotion/pointRule.js';
import * as pointInstanceController from '../controllers/Promotion/pointInstance.js';
import { authMiddleware } from '../middlewares/auth.js';
import { permissionMiddleware, roleMiddleware } from '../middlewares/permission.js';
import { userAuthMiddleware } from '../middlewares/userAuth.js';

const router = express.Router();

// 優惠券模板路由 (後台) - 由品牌管理員或老闆管理
router.get('/coupons/templates', authMiddleware, permissionMiddleware(['edit_backend']), couponTemplateController.getAllCouponTemplates);
router.get('/coupons/templates/:id', authMiddleware, permissionMiddleware(['edit_backend']), couponTemplateController.getCouponTemplateById);
router.post('/coupons/templates', authMiddleware, roleMiddleware(['boss', 'brand_admin']), couponTemplateController.createCouponTemplate);
router.put('/coupons/templates/:id', authMiddleware, roleMiddleware(['boss', 'brand_admin']), couponTemplateController.updateCouponTemplate);
router.delete('/coupons/templates/:id', authMiddleware, roleMiddleware(['boss', 'brand_admin']), couponTemplateController.deleteCouponTemplate);

// 優惠券實例路由 (後台)
router.get('/coupons/instances/admin', authMiddleware, permissionMiddleware(['view_reports']), couponInstanceController.getAllCouponInstances);
router.post('/coupons/instances/issue', authMiddleware, permissionMiddleware(['edit_backend']), couponInstanceController.issueCouponToUser);

// 優惠券路由 (用戶)
router.get('/coupons', userAuthMiddleware, couponInstanceController.getUserCoupons);
router.post('/coupons/redeem', userAuthMiddleware, couponInstanceController.redeemCoupon);
router.get('/coupons/available', userAuthMiddleware, couponTemplateController.getAvailableCouponTemplates);

// 點數規則路由 (後台) - 由品牌管理員或老闆管理
router.get('/points/rules', authMiddleware, permissionMiddleware(['edit_backend']), pointRuleController.getAllPointRules);
router.get('/points/rules/:id', authMiddleware, permissionMiddleware(['edit_backend']), pointRuleController.getPointRuleById);
router.post('/points/rules', authMiddleware, roleMiddleware(['boss', 'brand_admin']), pointRuleController.createPointRule);
router.put('/points/rules/:id', authMiddleware, roleMiddleware(['boss', 'brand_admin']), pointRuleController.updatePointRule);
router.delete('/points/rules/:id', authMiddleware, roleMiddleware(['boss', 'brand_admin']), pointRuleController.deletePointRule);

// 點數路由 (用戶)
router.get('/points', userAuthMiddleware, pointInstanceController.getUserPoints);
router.get('/points/history', userAuthMiddleware, pointInstanceController.getUserPointHistory);

// 點數管理 (後台)
router.post('/points/add', authMiddleware, permissionMiddleware(['edit_backend']), pointInstanceController.addPointsToUser);

export default router;
