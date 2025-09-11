import express from 'express'
import * as cashFlowCategoryController from '../controllers/Store/cashFlowCategory.js'
import {
  authenticate,
  requireRole,
  requireBrandAccess,
  requireStoreAccess,
} from '../middlewares/auth/index.js'

const router = express.Router()

// 獲取店舖的所有記帳分類
router.get(
  '/:storeId',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
    'store_admin'
  ),
  requireStoreAccess,
  cashFlowCategoryController.getCategoriesByStore
)

// 根據ID獲取記帳分類
router.get(
  '/detail/:categoryId',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
    'store_admin'
  ),
  cashFlowCategoryController.getCategoryById
)

// 創建記帳分類
router.post(
  '/',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
    'store_admin'
  ),
  requireStoreAccess,
  cashFlowCategoryController.createCategory
)

// 更新記帳分類
router.put(
  '/:categoryId',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
    'store_admin'
  ),
  cashFlowCategoryController.updateCategory
)

// 刪除記帳分類
router.delete(
  '/:categoryId',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin'
  ),
  cashFlowCategoryController.deleteCategory
)


export default router