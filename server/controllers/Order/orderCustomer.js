/**
 * 訂單客戶控制器
 * server/controllers/Order/orderCustomer.js
 */

import * as orderService from '../../services/order/orderCustomer.js'
import * as paymentOrderService from '../../services/payment/paymentOrderService.js'
import * as newebpayService from '../../services/payment/newebpayService.js'
import * as orderCreationService from '../../services/order/orderCreation.js'
import Transaction from '../../models/Payment/Transaction.js'
import { asyncHandler, AppError } from '../../middlewares/error.js'

/**
 * 統一創建訂單接口 - 根據 paymentType 自動路由
 * 支援現場付款 + NewebPay 線上付款
 */
export const createOrder = asyncHandler(async (req, res) => {
  const { brandId, storeId } = req.params
  const { orderData, paymentType, paymentMethod, primeToken } = req.body

  console.log('📝 收到創建訂單請求:', {
    brandId,
    storeId,
    paymentType,
    paymentMethod,
    hasUser: !!req.auth?.userId,
  })

  // 基本驗證
  if (!orderData || !paymentType) {
    throw new AppError('缺少必要的訂單資料', 400)
  }

  // 🔀 根據付款類型路由到不同處理流程
  if (paymentType === 'On-site') {
    // === 現場付款流程 ===
    console.log('💵 現場付款流程')

    // 設置訂單的基本資訊
    const completeOrderData = {
      ...orderData,
      paymentType,
      paymentMethod: paymentMethod || 'cash',
      brand: brandId,
      store: storeId,
      user: req.auth?.userId,
    }

    // 生成訂單編號
    const orderNumber = await orderService.generateOrderNumber(storeId)
    completeOrderData.orderDateCode = orderNumber.orderDateCode
    completeOrderData.sequence = orderNumber.sequence

    const result = await orderService.createOrder(completeOrderData)

    console.log('✅ 現場付款訂單創建成功:', result._id)

    res.json({
      success: true,
      order: result,
      status: 'cash_submitted',
      message: '訂單已送出，請至櫃台付款',
    })
  } else if (paymentType === 'Online') {
    // === 線上付款流程 (NewebPay) ===
    console.log('💳 線上付款流程 (NewebPay)')

    // 設置訂單基本資訊
    const completeOrderData = {
      ...orderData,
      paymentType: 'Online',
      paymentMethod: paymentMethod || 'credit_card',
      brand: brandId,
      store: storeId,
      user: req.auth?.userId,
    }

    // Step 1: 創建臨時訂單 (status: pending_payment, isFinalized: false)
    console.log('🔄 創建臨時訂單...')
    const order = await orderCreationService.createOrder(completeOrderData)

    if (!order.isOnlinePayment) {
      throw new AppError('訂單類型錯誤', 500)
    }

    console.log('✅ 臨時訂單創建成功:', order._id)

    // Step 2: 創建 Transaction 記錄
    const transaction = new Transaction({
      brand: brandId,
      store: storeId,
      orderId: order._id,
      transactionId: `TXN_${Date.now()}_${order._id}`,
      amount: order.total,
      paymentMethod: paymentMethod || 'credit_card',
      platform: 'newebpay',
      status: 'pending',
    })
    await transaction.save()

    console.log('✅ Transaction 記錄創建成功:', transaction._id)

    // Step 3: 生成 NewebPay 付款表單
    const backendURL = process.env.BACKEND_URL || 'http://localhost:8700'
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173'

    const itemDesc = `訂單付款 - ${order.items.length} 項商品`

    const paymentForm = await newebpayService.createMPGPayment({
      orderId: order._id,
      amount: order.total,
      itemDesc,
      customerName: order.customerInfo?.name || '',
      customerPhone: order.customerInfo?.phone || '',
      email: order.customerInfo?.email || '',
      notifyURL: `${backendURL}/api/payment/newebpay/notify`,
      returnURL: `${backendURL}/api/payment/newebpay/return`,
      clientBackURL: `${backendURL}/api/payment/newebpay/client-back`,
    })

    console.log('✅ NewebPay 付款表單生成成功:', paymentForm.merchantOrderNo)

    // Step 4: 更新訂單和 Transaction 的 merchantOrderNo
    order.onlinePayment = {
      platform: 'newebpay',
      merchantOrderNo: paymentForm.merchantOrderNo,
    }
    await order.save()

    transaction.platformOrderNo = paymentForm.merchantOrderNo
    await transaction.save()

    console.log('✅ 訂單和 Transaction 已更新 merchantOrderNo')

    // Step 5: 返回付款表單資料給前端
    res.json({
      success: true,
      order: {
        _id: order._id,
        status: order.status,
        total: order.total,
        isOnlinePayment: true,
      },
      payment: {
        formData: paymentForm.formData,
        apiUrl: paymentForm.apiUrl,
        merchantOrderNo: paymentForm.merchantOrderNo,
      },
      message: '訂單已創建，請完成付款',
    })

    console.log('✅ 付款表單已返回給前端')
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
