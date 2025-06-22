import express from 'express';
import * as bundleController from '../controllers/Bundle/bundleController.js';

const router = express.Router();

// 管理員路由
router.get('/admin/brands/:brandId/bundles', bundleController.getAllBundles);
router.get('/admin/brands/:brandId/bundles/:id', bundleController.getBundleById);
router.post('/admin/brands/:brandId/bundles', bundleController.createBundle);
router.put('/admin/brands/:brandId/bundles/:id', bundleController.updateBundle);
router.delete('/admin/brands/:brandId/bundles/:id', bundleController.deleteBundle);

// 客戶端路由
router.get('/customer/brands/:brandId/bundles', bundleController.getAvailableBundles);
router.get('/customer/brands/:brandId/stores/:storeId/bundles', bundleController.getAvailableBundles);
router.get('/customer/bundles/:bundleId/purchase-limit', bundleController.checkPurchaseLimit);
router.get('/customer/stores/:storeId/bundles/:bundleId/validate', bundleController.validateBundlePurchase);

// 系統任務路由
router.post('/system/bundles/auto-update-status', bundleController.autoUpdateBundleStatus);

export default router;
