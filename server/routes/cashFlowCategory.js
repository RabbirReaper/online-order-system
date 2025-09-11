import express from 'express'
import * as cashFlowCategoryController from '../controllers/Store/cashFlowCategory.js'
import {
  authenticate,
  requireRole,
  requireBrandAccess,
  requireStoreAccess,
} from '../middlewares/auth/index.js'

const router = express.Router()

// 創建記帳分類
router.post(
  '/:brandId/:storeId',
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
  requireStoreAccess,
  cashFlowCategoryController.createCategory,
)

// 獲取店舖的所有記帳分類
router.get(
  '/:brandId/:storeId',
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
  requireStoreAccess,
  cashFlowCategoryController.getCategoriesByStore,
)

// 根據ID獲取記帳分類
router.get(
  '/:brandId/:storeId/detail/:categoryId',
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
  requireStoreAccess,
  cashFlowCategoryController.getCategoryById,
)

// 更新記帳分類
router.put(
  '/:brandId/:storeId/:categoryId',
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
  requireStoreAccess,
  cashFlowCategoryController.updateCategory,
)

// 刪除記帳分類
router.delete(
  '/:brandId/:storeId/:categoryId',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
  ),
  requireBrandAccess,
  requireStoreAccess,
  cashFlowCategoryController.deleteCategory,
)

export default router
