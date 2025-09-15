import express from 'express'
import * as orderController from '../controllers/Order/orderCustomer.js'
import { authenticate, optionalAuth } from '../middlewares/auth/index.js'

const router = express.Router()

// 創建訂單（支援匿名和登入用戶）
router.post('/brands/:brandId/stores/:storeId/create', optionalAuth('user'), orderController.createOrder)

// 個人訂單列表（需要用戶認證）
router.get('/brands/:brandId/my-orders', authenticate('user'), orderController.getUserOrders)

// 獲取個人訂單詳情
router.get('/brands/:brandId/order/:orderId', orderController.getUserOrderById)

// 支付相關路由
// 處理支付
router.post('/brands/:brandId/orders/:orderId/payment', orderController.processPayment)

// 支付回調
router.post('/brands/:brandId/orders/:orderId/payment/callback', orderController.paymentCallback)

export default router
