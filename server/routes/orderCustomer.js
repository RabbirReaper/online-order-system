import express from 'express';
import * as orderController from '../controllers/Order/orderCustomer.js';
import { authenticate } from '../middlewares/auth/index.js';

const router = express.Router();

// 創建訂單（公開，可匿名訪問）
router.post('/brands/:brandId/stores/:storeId/create', orderController.createOrder);

// 個人訂單列表（需要用戶認證）
router.get('/brands/:brandId/my-orders', authenticate('user'), orderController.getUserOrders);

// 獲取個人訂單詳情
router.get('/brands/:brandId/my-orders/:orderId', authenticate('user'), orderController.getUserOrderById);

// 訪客訂單查詢（無需登入，但需要驗證資訊）
router.post('/brands/:brandId/guest/:orderId', orderController.getGuestOrderById);

// 支付相關路由
// 處理支付
router.post('/brands/:brandId/orders/:orderId/payment', orderController.processPayment);

// 支付回調
router.post('/brands/:brandId/orders/:orderId/payment/callback', orderController.paymentCallback);

export default router;
