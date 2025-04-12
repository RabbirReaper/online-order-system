import express from 'express';
import * as orderController from '../controllers/Order/order.js';
import { authMiddleware } from '../middlewares/auth.js';
import { permissionMiddleware } from '../middlewares/permission.js';
import { userAuthMiddleware } from '../middlewares/userAuth.js';

const router = express.Router();

// 訂單管理路由 (後台)
router.get('/admin/:storeId', authMiddleware, permissionMiddleware(['order_system', 'view_reports']), orderController.getStoreOrders);
router.get('/admin/:storeId/:orderId', authMiddleware, permissionMiddleware(['order_system', 'view_reports']), orderController.getOrderById);
router.put('/admin/:storeId/:orderId/status', authMiddleware, permissionMiddleware(['order_system']), orderController.updateOrderStatus);
router.post('/admin/:storeId/:orderId/cancel', authMiddleware, permissionMiddleware(['order_system']), orderController.cancelOrder);

// 訂單統計路由 (後台)
router.get('/admin/:storeId/stats/daily', authMiddleware, permissionMiddleware(['view_reports']), orderController.getDailyOrderStats);
router.get('/admin/:storeId/stats/monthly', authMiddleware, permissionMiddleware(['view_reports']), orderController.getMonthlyOrderStats);

// 用戶訂單路由 (前台)
router.post('/', orderController.createOrder);
router.get('/user', userAuthMiddleware, orderController.getUserOrders);
router.get('/user/:orderId', userAuthMiddleware, orderController.getUserOrderById);
router.post('/user/:orderId/cancel', userAuthMiddleware, orderController.userCancelOrder);
router.post('/user/guest/:orderId', orderController.getGuestOrderById);

// 支付相關路由
router.post('/:orderId/payment', orderController.processPayment);
router.post('/:orderId/payment/callback', orderController.paymentCallback);

export default router;
