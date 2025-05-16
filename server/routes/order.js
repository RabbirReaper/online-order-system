import express from 'express';
import * as orderController from '../controllers/Order/order.js';
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
router.get('/brands/:brandId/stores/:storeId/orders', authenticate('admin'), requireRole('boss', 'brand_admin', 'store_admin'), requireBrandAccess, requireStoreAccess, requirePermission('order_system', 'view_reports'), orderController.getStoreOrders);

// 獲取單個訂單詳情
router.get('/brands/:brandId/stores/:storeId/orders/:orderId', authenticate('admin'), requireRole('boss', 'brand_admin', 'store_admin'), requireBrandAccess, requireStoreAccess, requirePermission('order_system', 'view_reports'), orderController.getOrderById);

// 更新訂單狀態
router.patch('/brands/:brandId/stores/:storeId/orders/:orderId/status', authenticate('admin'), requireRole('boss', 'brand_admin', 'store_admin'), requireBrandAccess, requireStoreAccess, requirePermission('order_system'), orderController.updateOrderStatus);

// 更新訂單手動調整金額
router.patch('/brands/:brandId/stores/:storeId/orders/:orderId/adjustment', authenticate('admin'), requireRole('boss', 'brand_admin', 'store_admin'), requireBrandAccess, requireStoreAccess, requirePermission('order_system'), orderController.updateOrderManualAdjustment);

// 取消訂單（後台）
router.post('/brands/:brandId/stores/:storeId/orders/:orderId/cancel', authenticate('admin'), requireRole('boss', 'brand_admin', 'store_admin'), requireBrandAccess, requireStoreAccess, requirePermission('order_system'), orderController.cancelOrder);

// 訂單統計路由（後台）
// 每日統計
router.get('/brands/:brandId/stores/:storeId/stats/daily', authenticate('admin'), requireRole('boss', 'brand_admin', 'store_admin'), requireBrandAccess, requireStoreAccess, requirePermission('view_reports'), orderController.getDailyOrderStats);

// 月度統計
router.get('/brands/:brandId/stores/:storeId/stats/monthly', authenticate('admin'), requireRole('boss', 'brand_admin', 'store_admin'), requireBrandAccess, requireStoreAccess, requirePermission('view_reports'), orderController.getMonthlyOrderStats);

// 用戶訂單路由（前台）
// 創建訂單（公開，可匿名訪問）
router.post('/brands/:brandId/stores/:storeId/create', orderController.createOrder);

// 個人訂單列表（需要用戶認證）
router.get('/brands/:brandId/my-orders', authenticate('user'), orderController.getUserOrders);

// 獲取個人訂單詳情
router.get('/brands/:brandId/my-orders/:orderId', authenticate('user'), orderController.getUserOrderById);

// 用戶取消自己的訂單
router.post('/brands/:brandId/my-orders/:orderId/cancel', authenticate('user'), orderController.userCancelOrder);

// 訪客訂單查詢（無需登入，但需要驗證資訊）
router.post('/brands/:brandId/guest/:orderId', orderController.getGuestOrderById);

// 支付相關路由
// 處理支付
router.post('/brands/:brandId/orders/:orderId/payment', orderController.processPayment);

// 支付回調
router.post('/brands/:brandId/orders/:orderId/payment/callback', orderController.paymentCallback);

export default router;
