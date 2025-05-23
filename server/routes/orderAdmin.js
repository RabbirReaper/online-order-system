import express from 'express';
import * as orderController from '../controllers/Order/orderAdmin.js';
import {
  authenticate,
  requireRole,
  requireBrandAccess,
  requireStoreAccess,
  requirePermission
} from '../middlewares/auth/index.js';

const router = express.Router();

// 訂單管理路由（後台）
// 獲取店鋪訂單列表
router.get('/brands/:brandId/stores/:storeId/orders',
  authenticate('admin'),
  requireRole('boss', 'brand_admin', 'store_admin'),
  requireBrandAccess,
  requireStoreAccess,
  requirePermission('order_system', 'view_reports'),
  orderController.getStoreOrders
);

// 獲取單個訂單詳情
router.get('/brands/:brandId/stores/:storeId/orders/:orderId',
  authenticate('admin'),
  requireRole('boss', 'brand_admin', 'store_admin'),
  requireBrandAccess,
  requireStoreAccess,
  requirePermission('order_system', 'view_reports'),
  orderController.getOrderById
);

// 更新訂單（統一接口）
router.put('/brands/:brandId/stores/:storeId/orders/:orderId',
  authenticate('admin'),
  requireRole('boss', 'brand_admin', 'store_admin'),
  requireBrandAccess,
  requireStoreAccess,
  requirePermission('order_system'),
  orderController.updateOrder
);

// 取消訂單（後台）
router.post('/brands/:brandId/stores/:storeId/orders/:orderId/cancel',
  authenticate('admin'),
  requireRole('boss', 'brand_admin', 'store_admin'),
  requireBrandAccess,
  requireStoreAccess,
  requirePermission('order_system'),
  orderController.cancelOrder
);

// 訂單統計路由（後台）
// 獲取訂單統計（支援日期範圍和分組）
router.get('/brands/:brandId/stores/:storeId/stats',
  authenticate('admin'),
  requireRole('boss', 'brand_admin', 'store_admin'),
  requireBrandAccess,
  requireStoreAccess,
  requirePermission('view_reports'),
  orderController.getOrderStats
);

// 獲取熱門餐點
router.get('/brands/:brandId/stores/:storeId/popular-dishes',
  authenticate('admin'),
  requireRole('boss', 'brand_admin', 'store_admin'),
  requireBrandAccess,
  requireStoreAccess,
  requirePermission('view_reports'),
  orderController.getPopularDishes
);

export default router;
