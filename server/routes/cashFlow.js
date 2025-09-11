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
  cashFlowController.getCashFlowsByStore
)

// 根據ID獲取記帳記錄
router.get(
  '/detail/:cashFlowId',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
    'store_admin'
  ),
  cashFlowController.getCashFlowById
)

// 創建記帳記錄
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
  cashFlowController.createCashFlow
)

// 更新記帳記錄
router.put(
  '/:cashFlowId',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
    'store_admin'
  ),
  cashFlowController.updateCashFlow
)

// 刪除記帳記錄
router.delete(
  '/:cashFlowId',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin'
  ),
  cashFlowController.deleteCashFlow
)

// 獲取現金流統計資料
router.get(
  '/:storeId/statistics',
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
  cashFlowController.getCashFlowStatistics
)

// 導出現金流流水帳 (CSV)
router.get(
  '/:storeId/export/csv',
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
  cashFlowController.exportCashFlowCSV
)

export default router