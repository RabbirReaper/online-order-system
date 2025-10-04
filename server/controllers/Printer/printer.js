/**
 * 列印機控制器
 * server/controllers/Printer/printer.js
 */

import * as printerService from '../../services/printer/printer.js'
import { asyncHandler } from '../../middlewares/error.js'

/**
 * 列印訂單
 */
export const printOrder = asyncHandler(async (req, res) => {
  try {
    const { brandId, storeId, orderId } = req.params

    const result = await printerService.printOrder(brandId, storeId, orderId)

    res.json({
      success: true,
      message: '訂單列印成功',
      ...result,
    })
  } catch (error) {
    console.error('Error printing order:', error)
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
})
