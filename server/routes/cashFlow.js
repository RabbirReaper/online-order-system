import express from 'express'
import * as cashFlowController from '../controllers/Store/cashFlow.js'
import {
  authenticate,
  requireRole,
  requireBrandAccess,
  requireStoreAccess,
} from '../middlewares/auth/index.js'

const router = express.Router()

// 獲取店舖的現金流記錄
router.get(
  '/:brandId/:storeId',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
    'store_admin'
  ),
  requireBrandAccess,
  requireStoreAccess,
  cashFlowController.getCashFlowsByStore
)

// 根據ID獲取記帳記錄
router.get(
  '/:brandId/:storeId/detail/:cashFlowId',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
    'store_admin'
  ),
  requireBrandAccess,
  requireStoreAccess,
  cashFlowController.getCashFlowById
)

// 創建記帳記錄
router.post(
  '/:brandId/:storeId',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
    'store_admin'
  ),
  requireBrandAccess,
  requireStoreAccess,
  cashFlowController.createCashFlow
)

// 更新記帳記錄
router.put(
  '/:brandId/:storeId/:cashFlowId',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
    'store_admin'
  ),
  requireBrandAccess,
  requireStoreAccess,
  cashFlowController.updateCashFlow
)

// 刪除記帳記錄
router.delete(
  '/:brandId/:storeId/:cashFlowId',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin'
  ),
  requireBrandAccess,
  requireStoreAccess,
  cashFlowController.deleteCashFlow
)

// 獲取現金流統計資料
router.get(
  '/:brandId/:storeId/statistics',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
    'store_admin'
  ),
  requireBrandAccess,
  requireStoreAccess,
  cashFlowController.getCashFlowStatistics
)

// 導出現金流流水帳 (CSV)
router.get(
  '/:brandId/:storeId/export/csv',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
    'store_admin'
  ),
  requireBrandAccess,
  requireStoreAccess,
  cashFlowController.exportCashFlowCSV
)

export default router