import express from 'express'
import * as platformStoreController from '../controllers/Store/platformStore.js'
import {
  authenticate,
  requireRole,
  requireBrandAccess,
  requireStoreAccess,
} from '../middlewares/auth/index.js'

const router = express.Router()

// 平台店鋪配置管理路由
// 所有路由都遵循 /brands/:brandId/:storeId 的格式

// 獲取特定店鋪的所有平台配置
router.get(
  '/brands/:brandId/:storeId',
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
  platformStoreController.getAllPlatformStores,
)

// 根據平台獲取特定店鋪的平台配置
router.get(
  '/brands/:brandId/:storeId/platform',
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
  platformStoreController.getPlatformStoreByStoreAndPlatform,
)

// 為特定店鋪創建平台配置
router.post(
  '/brands/:brandId/:storeId',
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
  platformStoreController.createPlatformStore,
)

// 更新平台店鋪配置
router.put(
  '/brands/:brandId/:storeId/platform-stores/:platformStoreId',
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
  platformStoreController.updatePlatformStore,
)

// 刪除平台店鋪配置
router.delete(
  '/brands/:brandId/:storeId/platform-stores/:platformStoreId',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin'),
  requireBrandAccess,
  requireStoreAccess,
  platformStoreController.deletePlatformStore,
)

// 切換平台店鋪營運狀態
router.patch(
  '/brands/:brandId/:storeId/platform-stores/:platformStoreId/status',
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
  platformStoreController.togglePlatformStoreStatus,
)

// 更新菜單同步時間
router.patch(
  '/brands/:brandId/:storeId/platform-stores/:platformStoreId/menu-sync',
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
  platformStoreController.updateMenuSyncTime,
)

export default router
