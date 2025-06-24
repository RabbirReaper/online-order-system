/**
 * 訂單客戶控制器
 * server/controllers/Order/orderCustomer.js
 */

import * as orderService from '../../services/order/orderCustomer.js';
import { asyncHandler } from '../../middlewares/error.js';

// 創建訂單（支援混合購買）
export const createOrder = asyncHandler(async (req, res) => {
  const { brandId, storeId } = req.params;
  const orderData = req.body;

  // 設置訂單的基本資訊
  orderData.brand = brandId;
  orderData.store = storeId;

  // 如果是登入用戶，設置用戶ID
  if (req.auth && req.auth.userId) {
    orderData.user = req.auth.userId;
  }

  // 生成訂單編號
  const orderNumber = await orderService.generateOrderNumber();
  orderData.orderDateCode = orderNumber.orderDateCode;
  orderData.sequence = orderNumber.sequence;

  const result = await orderService.createOrder(orderData);

  res.status(201).json({
    success: true,
    message: '訂單創建成功',
    order: result,
    orderNumber: `${orderNumber.orderDateCode}${orderNumber.sequence.toString().padStart(3, '0')}`,
    // 混合購買相關資訊
    pointsAwarded: result.pointsAwarded || 0,
    generatedCoupons: result.generatedCoupons || []
  });
});

// 獲取用戶訂單列表
export const getUserOrders = asyncHandler(async (req, res) => {
  const userId = req.auth.userId;
  const { brandId } = req.params;

  const options = {
    brandId,
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 10,
    sortBy: req.query.sortBy || 'createdAt',
    sortOrder: req.query.sortOrder || 'desc'
  };

  const result = await orderService.getUserOrders(userId, options);

  res.json({
    success: true,
    orders: result.orders,
    pagination: result.pagination
  });
});

// 獲取訂單詳情（支援匿名訪問）
export const getUserOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await orderService.getUserOrderById(orderId);

  res.json({
    success: true,
    order
  });
});

// 處理訂單支付
export const processPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const paymentData = req.body;

  const result = await orderService.processPayment(orderId, paymentData);

  res.json({
    success: true,
    message: '支付處理成功',
    result
  });
});

// 支付回調處理
export const paymentCallback = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const callbackData = req.body;

  const result = await orderService.handlePaymentCallback(orderId, callbackData);

  res.json({
    success: true,
    message: '支付回調處理完成',
    result,
    // 混合購買相關資訊
    pointsAwarded: result.pointsAwarded || 0,
    generatedCoupons: result.generatedCoupons || []
  });
});
