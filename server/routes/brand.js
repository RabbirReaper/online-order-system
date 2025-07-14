import express from 'express'
import * as brandController from '../controllers/Brand/brand.js'
import {
  authenticate,
  requireRole,
  requireSystemLevel,
  requireBrandAccess,
} from '../middlewares/auth/index.js'

const router = express.Router()

// 獲取所有品牌（僅限系統級管理員）
router.get('/', authenticate('admin'), requireSystemLevel, brandController.getAllBrands)

// 獲取單個品牌（系統級可看所有，品牌級只能看自己的）
router.get(
  '/:brandId',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  brandController.getBrandById,
)

// 創建品牌（僅限系統級管理員）
router.post('/', authenticate('admin'), requireSystemLevel, brandController.createBrand)

// 更新品牌（僅限系統級管理員）
router.put('/:id', authenticate('admin'), requireSystemLevel, brandController.updateBrand)

// 刪除品牌（僅限primary_system_admin）
router.delete(
  '/:id',
  authenticate('admin'),
  requireRole('primary_system_admin'),
  brandController.deleteBrand,
)

// 獲取品牌下的店鋪（僅限系統級管理員）
router.get('/:id/stores', authenticate('admin'), requireSystemLevel, brandController.getBrandStores)

// 切換品牌啟用狀態（僅限primary_system_admin）
router.put(
  '/:id/toggle',
  authenticate('admin'),
  requireRole('primary_system_admin'),
  brandController.toggleBrandActive,
)

export default router
