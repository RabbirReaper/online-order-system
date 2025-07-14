import express from 'express'
import * as orderController from '../controllers/Order/orderAdmin.js'
import {
  authenticate,
  requireRole,
  requireBrandAccess,
  requireStoreAccess,
} from '../middlewares/auth/index.js'

const router = express.Router()

// 訂單管理路由（後台）
// 獲取店鋪訂單列表
router.get(
  '/brands/:brandId/stores/:storeId/orders',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
    'store_admin',
    'employee',
  ),
  requireBrandAccess,
  requireStoreAccess,
  orderController.getStoreOrders,
)

// 獲取單個訂單詳情
router.get(
  '/brands/:brandId/stores/:storeId/orders/:orderId',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
    'store_admin',
    'employee',
  ),
  requireBrandAccess,
  requireStoreAccess,
  orderController.getOrderById,
)

// 更新訂單（統一接口）
router.put(
  '/brands/:brandId/stores/:storeId/orders/:orderId',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
    'store_admin',
    'employee',
  ),
  requireBrandAccess,
  requireStoreAccess,
  orderController.updateOrder,
)

// 取消訂單（後台）
router.post(
  '/brands/:brandId/stores/:storeId/orders/:orderId/cancel',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
    'store_admin',
    'employee',
  ),
  requireBrandAccess,
  requireStoreAccess,
  orderController.cancelOrder,
)

export default router
