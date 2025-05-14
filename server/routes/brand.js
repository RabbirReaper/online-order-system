import express from 'express';
import * as brandController from '../controllers/Brand/brand.js';
import {
  authenticate,
  requireRole
} from '../middlewares/auth/index.js';

const router = express.Router();

// 獲取所有品牌（僅限 boss）
router.get('/', authenticate('admin'), requireRole('boss'), brandController.getAllBrands);

// 獲取單個品牌（僅限 boss）
router.get('/:id', authenticate('admin'), requireRole('boss'), brandController.getBrandById);

// 創建品牌（僅限 boss）
router.post('/', authenticate('admin'), requireRole('boss'), brandController.createBrand);

// 更新品牌（僅限 boss）
router.put('/:id', authenticate('admin'), requireRole('boss'), brandController.updateBrand);

// 刪除品牌（僅限 boss）
router.delete('/:id', authenticate('admin'), requireRole('boss'), brandController.deleteBrand);

// 獲取品牌下的店舖（僅限 boss）
router.get('/:id/stores', authenticate('admin'), requireRole('boss'), brandController.getBrandStores);

// 切換品牌啟用狀態（僅限 boss）
router.put('/:id/toggle', authenticate('admin'), requireRole('boss'), brandController.toggleBrandActive);

export default router;
