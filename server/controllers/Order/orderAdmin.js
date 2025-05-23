import * as orderService from '../../services/order/index.js';
import { asyncHandler } from '../../middlewares/error.js';

// 獲取店鋪訂單列表（後台）
export const getStoreOrders = asyncHandler(async (req, res) => {
  const { storeId } = req.params;

  const options = {
    status: req.query.status,
    orderType: req.query.orderType,
    fromDate: req.query.fromDate,
    toDate: req.query.toDate,
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 20
  };

  const result = await orderService.getStoreOrders(storeId, options);

  res.json({
    success: true,
    orders: result.orders,
    pagination: result.pagination
  });
});

// 獲取訂單詳情（後台）
export const getOrderById = asyncHandler(async (req, res) => {
  const { storeId, orderId } = req.params;

  const order = await orderService.getOrderById(orderId, storeId);

  res.json({
    success: true,
    order
  });
});

// 更新訂單（統一接口）
export const updateOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const updateData = req.body;
  const adminId = req.auth.id;

  const updatedOrder = await orderService.updateOrder(orderId, updateData, adminId);

  res.json({
    success: true,
    message: '訂單更新成功',
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

  const cancelledOrder = await orderService.cancelOrder(orderId, reason, adminId);

  res.json({
    success: true,
    message: '訂單取消成功',
    order: cancelledOrder
  });
});

// 獲取訂單統計
export const getOrderStats = asyncHandler(async (req, res) => {
  const { storeId } = req.params;

  const options = {
    fromDate: req.query.fromDate,
    toDate: req.query.toDate,
    groupBy: req.query.groupBy || 'day'
  };

  const stats = await orderService.getOrderStats(storeId, options);

  res.json({
    success: true,
    stats
  });
});

// 獲取熱門餐點
export const getPopularDishes = asyncHandler(async (req, res) => {
  const { storeId } = req.params;

  const options = {
    fromDate: req.query.fromDate,
    toDate: req.query.toDate,
    limit: parseInt(req.query.limit, 10) || 10
  };

  const popularDishes = await orderService.getPopularDishes(storeId, options);

  res.json({
    success: true,
    popularDishes
  });
});
