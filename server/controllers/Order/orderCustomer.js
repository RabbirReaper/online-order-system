import * as orderService from '../../services/order/index.js';
import { asyncHandler } from '../../middlewares/error.js';

// 創建訂單
export const createOrder = asyncHandler(async (req, res) => {
  const { brandId, storeId } = req.params;

  const orderData = {
    ...req.body,
    brand: brandId,
    store: storeId
  };

  // 獲取訂單編號
  const orderNumber = await orderService.generateOrderNumber();
  orderData.orderDateCode = orderNumber.orderDateCode;
  orderData.sequence = orderNumber.sequence;

  // 創建訂單
  const order = await orderService.createOrder(orderData);

  res.status(201).json({
    success: true,
    message: '訂單創建成功',
    order
  });
});

// 獲取用戶訂單列表
export const getUserOrders = asyncHandler(async (req, res) => {
  const { brandId } = req.params;
  const userId = req.auth.id;

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

// 獲取用戶訂單詳情
export const getUserOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.auth.id;

  const order = await orderService.getUserOrderById(orderId, userId);

  res.json({
    success: true,
    order
  });
});

// 獲取訪客訂單詳情（不需登入）
export const getGuestOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { phone, orderNumber } = req.body;

  if (!phone || !orderNumber) {
    return res.status(400).json({
      success: false,
      message: '缺少驗證資訊'
    });
  }

  const order = await orderService.getGuestOrderById(orderId, phone, orderNumber);

  res.json({
    success: true,
    order
  });
});

// 處理支付
export const processPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const paymentData = req.body;

  const result = await orderService.processPayment(orderId, paymentData);

  res.json({
    success: true,
    message: '支付處理成功',
    paymentResult: result
  });
});

// 支付回調
export const paymentCallback = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const callbackData = req.body;

  const result = await orderService.handlePaymentCallback(orderId, callbackData);

  res.json({
    success: true,
    message: '支付回調處理成功',
    result
  });
});
