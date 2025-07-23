import express from 'express'
import * as storeController from '../controllers/Store/store.js'
import {
  authenticate,
  requireRole,
  requireBrandAccess,
  requireStoreAccess,
} from '../middlewares/auth/index.js'

const router = express.Router()

// 店鋪基本操作
// 獲取品牌下的所有店鋪
router.get(
  '/brands/:brandId',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  storeController.getAllStores,
)

// 獲取單個店鋪
router.get('/brands/:brandId/:id', storeController.getStoreById)

// 創建店鋪（系統級和品牌級管理員）
router.post(
  '/brands/:brandId',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  storeController.createStore,
)

// 更新店鋪（系統級和品牌級管理員）
router.put(
  '/brands/:brandId/:id',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  storeController.updateStore,
)

// 刪除店鋪（僅限系統級和primary_brand_admin）
router.delete(
  '/brands/:brandId/:id',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin'),
  storeController.deleteStore,
)

// 店鋪狀態與詳情路由
// 獲取店鋪營業時間
router.get('/brands/:brandId/:id/business-hours', storeController.getStoreBusinessHours)

// 更新店鋪營業時間
router.put(
  '/brands/:brandId/:id/business-hours',
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
  storeController.updateStoreBusinessHours,
)

// 更新店鋪公告
router.put(
  '/brands/:brandId/:storeId/announcements',
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
  storeController.updateStoreAnnouncements,
)

// 獲取店鋪當前狀態
router.get('/brands/:brandId/:id/status', storeController.getStoreCurrentStatus)

// 更新店鋪服務設定
router.put(
  '/brands/:brandId/:id/service-settings',
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
  storeController.updateServiceSettings,
)

export default router
