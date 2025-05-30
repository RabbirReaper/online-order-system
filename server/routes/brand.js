import express from 'express';
import * as brandController from '../controllers/Brand/brand.js';
import {
  authenticate,
  requireRole,
  requireSystemLevel,
  requirePermission
} from '../middlewares/auth/index.js';

const router = express.Router();

// 獲取所有品牌（僅限系統級管理員）
router.get('/',
  authenticate('admin'),
  requireSystemLevel,
  requirePermission('manage_brands'),
  brandController.getAllBrands
);

// 獲取單個品牌（僅限系統級管理員）
router.get('/:id',
  authenticate('admin'),
  requireSystemLevel,
  requirePermission('manage_brands'),
  brandController.getBrandById
);

// 創建品牌（僅限系統級管理員）
router.post('/',
  authenticate('admin'),
  requireSystemLevel,
  requirePermission('manage_brands'),
  brandController.createBrand
);

// 更新品牌（僅限系統級管理員）
router.put('/:id',
  authenticate('admin'),
  requireSystemLevel,
  requirePermission('manage_brands'),
  brandController.updateBrand
);

// 刪除品牌（僅限primary_system_admin）
router.delete('/:id',
  authenticate('admin'),
  requireRole('primary_system_admin'),
  requirePermission('manage_brands'),
  brandController.deleteBrand
);

// 獲取品牌下的店鋪（僅限系統級管理員）
router.get('/:id/stores',
  authenticate('admin'),
  requireSystemLevel,
  requirePermission('manage_brands'),
  brandController.getBrandStores
);

// 切換品牌啟用狀態（僅限primary_system_admin）
router.put('/:id/toggle',
  authenticate('admin'),
  requireRole('primary_system_admin'),
  requirePermission('manage_brands'),
  brandController.toggleBrandActive
);

export default router;
