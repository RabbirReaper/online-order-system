import express from 'express';
import * as bundleController from '../controllers/Bundle/bundleController.js';
import * as bundleInstanceController from '../controllers/Bundle/bundleInstance.js';
import {
  authenticate,
  requireRole,
  requireBrandAccess
} from '../middlewares/auth/index.js';

const router = express.Router();

// =============================================================================
// Bundle 模板路由（後台）
// =============================================================================

// 獲取所有 Bundle
router.get('/brands/:brandId/bundles',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin'),
  requireBrandAccess,
  bundleController.getAllBundles
);

// 獲取單個 Bundle
router.get('/brands/:brandId/bundles/:id',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin'),
  requireBrandAccess,
  bundleController.getBundleById
);

// 創建 Bundle
router.post('/brands/:brandId/bundles',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  bundleController.createBundle
);

// 更新 Bundle
router.put('/brands/:brandId/bundles/:id',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  bundleController.updateBundle
);

// 刪除 Bundle
router.delete('/brands/:brandId/bundles/:id',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  bundleController.deleteBundle
);

// =============================================================================
// Bundle 模板路由（客戶端）
// =============================================================================

// 檢查購買限制
router.get('/brands/:brandId/bundles/:bundleId/purchase-limit',
  authenticate('user'),
  bundleController.checkPurchaseLimit
);

// 驗證 Bundle 購買資格
router.get('/brands/:brandId/stores/:storeId/bundles/:bundleId/validate',
  authenticate('user'),
  bundleController.validateBundlePurchase
);

// 自動更新 Bundle 狀態（系統任務）
router.post('/bundles/auto-update-status',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin'),
  bundleController.autoUpdateBundleStatus
);

// =============================================================================
// Bundle 實例路由（後台）
// =============================================================================

// 獲取單個 Bundle 實例
router.get('/brands/:brandId/bundles/instances/:id',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin'),
  requireBrandAccess,
  bundleInstanceController.getBundleInstanceById
);

// 創建 Bundle 實例（通常由訂單系統調用）
router.post('/brands/:brandId/bundles/instances',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  bundleInstanceController.createBundleInstance
);

export default router;
