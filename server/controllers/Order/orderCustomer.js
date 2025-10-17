/**
 * 訂單客戶控制器
 * server/controllers/Order/orderCustomer.js
 */

import * as orderService from '../../services/order/orderCustomer.js'
import * as paymentOrderService from '../../services/payment/paymentOrderService.js'
import { asyncHandler, AppError } from '../../middlewares/error.js'

/**
 * 統一創建訂單接口 - 根據 paymentType 自動路由
 */
export const createOrder = asyncHandler(async (req, res) => {
  const { brandId, storeId } = req.params
  const { orderData, paymentType, paymentMethod, primeToken } = req.body

  // 基本驗證
  if (!orderData || !paymentType) {
    throw new AppError('缺少必要的訂單資料', 400)
  }

  // 🔀 根據付款類型路由到不同處理流程
  if (paymentType === 'On-site') {
    // 現場付款流程 - 直接創建 unpaid 訂單

    // 設置訂單的基本資訊
    const completeOrderData = {
      ...orderData,
      paymentType,
      paymentMethod: 'cash',
      brand: brandId,
      store: storeId,
      user: req.auth?.userId,
    }

    // 生成訂單編號
    const orderNumber = await orderService.generateOrderNumber(storeId)
    completeOrderData.orderDateCode = orderNumber.orderDateCode
    completeOrderData.sequence = orderNumber.sequence

    const result = await orderService.createOrder(completeOrderData)

    res.json({
      success: true,
      order: result,
      status: 'cash_submitted',
      message: '訂單已送出，請至櫃台付款',
    })
  } else if (paymentType === 'Online' && primeToken) {
    // 線上付款流程 - 先付款後創建訂單
    const result = await paymentOrderService.processPaymentAndCreateOrder(
      {
        ...orderData,
        brand: brandId,
        store: storeId,
        customerId: req.auth?.userId,
        customerName: orderData.customerInfo?.name,
        customerPhone: orderData.customerInfo?.phone,
        customerEmail: orderData.customerInfo?.email,
        totalAmount: orderData.total || orderData.totalAmount,
      },
      primeToken,
      paymentMethod || 'credit_card',
    )

    if (result.success) {
      res.json({
        success: true,
        order: result.order,
        status: 'online_success',
        transaction: result.transaction,
        message: '付款成功，訂單已確認',
      })
    } else {
      throw new AppError('線上付款處理失敗', 400)
    }
  } else {
    throw new AppError('無效的付款參數', 400)
  }
})

// 獲取用戶訂單列表
export const getUserOrders = asyncHandler(async (req, res) => {
  const userId = req.auth.userId
  const { brandId } = req.params

  const options = {
    brandId,
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 10,
    sortBy: req.query.sortBy || 'createdAt',
    sortOrder: req.query.sortOrder || 'desc',
  }

  const result = await orderService.getUserOrders(userId, options)

  res.json({
    success: true,
    orders: result.orders,
    pagination: result.pagination,
  })
})

// 獲取訂單詳情（支援匿名訪問）
export const getUserOrderById = asyncHandler(async (req, res) => {
  const { orderId, brandId } = req.params

  const order = await orderService.getUserOrderById(orderId, brandId)

  if (!order) {
    return res.status(404).json({
      success: false,
      message: '找不到指定的訂單',
    })
  }

  res.json({
    success: true,
    order,
  })
})

// 處理訂單支付
export const processPayment = asyncHandler(async (req, res) => {
  const { orderId, brandId } = req.params
  const paymentData = req.body

  const result = await orderService.processPayment(orderId, brandId, paymentData)

  res.json({
    success: true,
    message: '支付處理成功',
    paymentId: result.paymentId,
    redirectUrl: result.redirectUrl,
    ...result,
  })
})

// 支付回調處理
export const paymentCallback = asyncHandler(async (req, res) => {
  const { orderId, brandId } = req.params
  const callbackData = req.body

  const result = await orderService.paymentCallback(orderId, brandId, callbackData)

  res.json({
    success: true,
    message: '支付回調處理完成',
    order: result.order,
    // 混合購買相關資訊
    pointsAwarded: result.pointsAwarded || 0,
    generatedCoupons: result.generatedCoupons || [],
  })
})
