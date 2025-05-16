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
  const orderNumber = await orderService.orderManagement.generateOrderNumber();
  orderData.orderDateCode = orderNumber.orderDateCode;
  orderData.sequence = orderNumber.sequence;

  // 創建訂單
  const order = await orderService.orderCore.createOrder(orderData);

  res.status(201).json({
    success: true,
    message: '訂單創建成功',
    order
  });
});

// 獲取店鋪訂單列表（後台）
export const getStoreOrders = asyncHandler(async (req, res) => {
  const { storeId } = req.params;

  const options = {
    status: req.query.status,
    orderType: req.query.orderType,
    fromDate: req.query.fromDate ? new Date(req.query.fromDate) : undefined,
    toDate: req.query.toDate ? new Date(req.query.toDate) : undefined,
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 20
  };

  const result = await orderService.orderCore.getStoreOrders(storeId, options);

  res.json({
    success: true,
    orders: result.orders,
    pagination: result.pagination
  });
});

// 獲取訂單詳情（後台）
export const getOrderById = asyncHandler(async (req, res) => {
  const { storeId, orderId } = req.params;

  const order = await orderService.orderCore.getOrderById(orderId, { storeId });

  res.json({
    success: true,
    order
  });
});

// 更新訂單狀態（後台）
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  const adminId = req.auth.id;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: '缺少狀態參數'
    });
  }

  const updatedOrder = await orderService.orderManagement.updateOrderStatus(orderId, status, adminId);

  res.json({
    success: true,
    message: '訂單狀態更新成功',
    order: updatedOrder
  });
});

// 更新訂單手動調整金額（後台）
export const updateOrderManualAdjustment = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { manualAdjustment } = req.body;
  const adminId = req.auth.id;

  if (manualAdjustment === undefined) {
    return res.status(400).json({
      success: false,
      message: '缺少手動調整金額參數'
    });
  }

  const updatedOrder = await orderService.orderManagement.updateOrderManualAdjustment(orderId, manualAdjustment, adminId);

  res.json({
    success: true,
    message: '手動調整金額更新成功',
    order: updatedOrder
  });
});

// 取消訂單（後台）
export const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;
  const adminId = req.auth.id;

  if (!reason) {
    return res.status(400).json({
      success: false,
      message: '缺少取消原因'
    });
  }

  const cancelledOrder = await orderService.orderManagement.cancelOrder(orderId, reason, adminId, 'Admin');

  res.json({
    success: true,
    message: '訂單取消成功',
    order: cancelledOrder
  });
});

// 用戶取消訂單
export const userCancelOrder = asyncHandler(async (req, res) => {
  const { brandId, orderId } = req.params;
  const { reason } = req.body;
  const userId = req.auth.id;

  // 確認訂單屬於該用戶
  const isOwner = await orderService.orderCore.verifyOrderOwnership(orderId, userId);

  if (!isOwner) {
    return res.status(403).json({
      success: false,
      message: '無權操作此訂單'
    });
  }

  const cancelledOrder = await orderService.orderManagement.cancelOrder(orderId, reason, userId, 'User');

  res.json({
    success: true,
    message: '訂單取消成功',
    order: cancelledOrder
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

  const result = await orderService.orderStats.getUserOrderHistory(userId, options);

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

  // 確認訂單屬於該用戶
  const isOwner = await orderService.orderCore.verifyOrderOwnership(orderId, userId);

  if (!isOwner) {
    return res.status(403).json({
      success: false,
      message: '無權查看此訂單'
    });
  }

  const order = await orderService.orderCore.getUserOrderById(orderId);

  res.json({
    success: true,
    order
  });
});

// 獲取訪客訂單詳情（不需登入）
export const getGuestOrderById = asyncHandler(async (req, res) => {
  const { brandId, orderId } = req.params;
  const { phone, orderNumber } = req.body;

  if (!phone || !orderNumber) {
    return res.status(400).json({
      success: false,
      message: '缺少驗證資訊'
    });
  }

  const order = await orderService.orderCore.getGuestOrderById(orderId, phone, orderNumber);

  res.json({
    success: true,
    order
  });
});

// 處理支付
export const processPayment = asyncHandler(async (req, res) => {
  const { brandId, orderId } = req.params;
  const paymentData = req.body;

  const result = await orderService.orderPayment.processPayment(orderId, paymentData);

  res.json({
    success: true,
    message: '支付處理成功',
    paymentResult: result
  });
});

// 支付回調
export const paymentCallback = asyncHandler(async (req, res) => {
  const { brandId, orderId } = req.params;
  const callbackData = req.body;

  const result = await orderService.orderPayment.handlePaymentCallback(orderId, callbackData);

  res.json({
    success: true,
    message: '支付回調處理成功',
    result
  });
});

// 獲取每日訂單統計
export const getDailyOrderStats = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const dateStr = req.query.date; // 格式 YYYY-MM-DD

  let date;
  if (dateStr) {
    date = new Date(dateStr);
  } else {
    date = new Date(); // 默認今天
  }

  const stats = await orderService.orderStats.getDailyOrderStats(storeId, date);

  res.json({
    success: true,
    stats
  });
});

// 獲取月度訂單統計
export const getMonthlyOrderStats = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const year = parseInt(req.query.year, 10) || new Date().getFullYear();
  const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;

  const stats = await orderService.orderStats.getMonthlyOrderStats(storeId, year, month);

  res.json({
    success: true,
    stats
  });
});
