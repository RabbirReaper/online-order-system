import express from 'express'
import * as printerController from '../controllers/Printer/printer.js'
import {
  authenticate,
  requireRole,
  requireBrandAccess,
  requireStoreAccess,
} from '../middlewares/auth/index.js'

const router = express.Router()

// 列印訂單
router.post(
  '/brands/:brandId/stores/:storeId/orders/:orderId/print',
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
  printerController.printOrder,
)

export default router
