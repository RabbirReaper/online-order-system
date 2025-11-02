import express from 'express'
import * as deliveryController from '../controllers/Delivery/delivery.js'
import { verifyUberEatsWebhookMiddleware } from '../middlewares/webhookVerification.js'

const router = express.Router()

/**
 * Uber Eats Webhook 接收端點
 * POST /api/delivery/webhooks/ubereats
 *
 * 注意: 此路由使用 express.raw() 保留原始 body 用於簽名驗證
 * 驗證成功後，middleware 會將 body 解析為 JSON 物件
 */
router.post(
  '/ubereats',
  express.raw({ type: 'application/json' }), // 保留原始 body
  verifyUberEatsWebhookMiddleware, // 簽名驗證
  deliveryController.handleUberEatsWebhook,
)

/**
 * Foodpanda Webhook 接收端點
 * POST /api/delivery/webhooks/foodpanda
 */
router.post('/foodpanda', deliveryController.handleFoodpandaWebhook)

/**
 * Foodpanda Catalog Callback
 * POST /api/delivery/webhooks/foodpanda/catalog-callback
 */
router.post('/foodpanda/catalog-callback', deliveryController.handleFoodpandaCatalogCallback)

export default router
