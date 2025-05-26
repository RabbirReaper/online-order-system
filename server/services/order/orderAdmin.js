/**
 * 訂單管理員服務
 * 處理管理員相關的訂單操作
 */

import Order from '../../models/Order/Order.js';
import { AppError } from '../../middlewares/error.js';
import { getTaiwanDateTime, getStartOfDay, getEndOfDay } from '../../utils/date.js';
import { DateTime } from 'luxon';

/**
 * 獲取店鋪訂單列表
 * @param {String} storeId - 店鋪ID
 * @param {Object} options - 查詢選項
 * @returns {Promise<Object>} 訂單列表和分頁信息
 */
export const getStoreOrders = async (storeId, options = {}) => {
  const { status, orderType, fromDate, toDate, page = 1, limit = 20 } = options;

  // 構建查詢條件
  const query = { store: storeId };

  if (status) {
    query.status = status;
  }

  if (orderType) {
    query.orderType = orderType;
  }

  // 使用 Luxon 正確處理台灣時區的日期範圍
  if (fromDate || toDate) {
    query.createdAt = {};

    if (fromDate) {
      try {
        // 將前端的日期字串 (YYYY-MM-DD) 轉換為台灣時區的該日開始時間
        const inputDate = DateTime.fromISO(fromDate, { zone: 'Asia/Taipei' });
        const startDateTime = getStartOfDay(inputDate);
        query.createdAt.$gte = startDateTime.toJSDate();

      } catch (error) {
        console.error('解析開始日期失敗:', error);
        throw new AppError('無效的開始日期格式', 400);
      }
    }

    if (toDate) {
      try {
        // 將前端的日期字串 (YYYY-MM-DD) 轉換為台灣時區的該日結束時間
        const inputDate = DateTime.fromISO(toDate, { zone: 'Asia/Taipei' });
        const endDateTime = getEndOfDay(inputDate);
        query.createdAt.$lte = endDateTime.toJSDate();

      } catch (error) {
        console.error('解析結束日期失敗:', error);
        throw new AppError('無效的結束日期格式', 400);
      }
    }
  }


  // 計算分頁
  const skip = (page - 1) * limit;

  // 獲取總數
  const total = await Order.countDocuments(query);

  // 查詢訂單
  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('items.dishInstance', 'name price options')
    .populate('user', 'name email phone')
    .lean();


  // 如果沒有訂單，記錄調試信息
  if (orders.length === 0) {
    // 檢查該店鋪是否有任何訂單
    const anyOrders = await Order.countDocuments({ store: storeId });

    // 檢查最近的訂單
    const recentOrders = await Order.find({ store: storeId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('createdAt orderType status')
      .lean();
  }

  // 構建分頁信息
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    orders,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage,
      hasPrevPage
    }
  };
};

/**
 * 獲取訂單詳情（管理員）
 * @param {String} orderId - 訂單ID
 * @param {String} storeId - 店鋪ID
 * @returns {Promise<Object>} 訂單詳情
 */
export const getOrderById = async (orderId, storeId) => {
  const query = { _id: orderId };
  if (storeId) query.store = storeId;

  const order = await Order.findOne(query)
    .populate('items.dishInstance', 'name price options')
    .populate('user', 'name email phone')
    .lean();

  if (!order) {
    throw new AppError('訂單不存在', 404);
  }

  return order;
};

/**
 * 更新訂單（統一接口）
 * @param {String} orderId - 訂單ID
 * @param {Object} updateData - 更新資料
 * @param {String} adminId - 管理員ID
 * @returns {Promise<Object>} 更新後的訂單
 */
export const updateOrder = async (orderId, updateData, adminId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError('訂單不存在', 404);
  }

  // 可更新的欄位 - 新增 paymentMethod 和 paymentType
  const allowedFields = [
    'status',
    'manualAdjustment',
    'notes',
    'estimatedPickupTime',
    'deliveryInfo',
    'dineInInfo',
    'paymentMethod',
    'paymentType',
    'discounts'
  ];

  // 更新允許的欄位
  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      if (field === 'deliveryInfo' || field === 'dineInInfo') {
        // 對於嵌套物件，進行合併更新
        order[field] = { ...order[field], ...updateData[field] };
      } else {
        order[field] = updateData[field];
      }
    }
  });

  // 如果更新了手動調整金額，重新計算總額
  if (updateData.manualAdjustment !== undefined) {
    const { calculateOrderAmounts } = await import('./orderCustomer.js');
    const amounts = calculateOrderAmounts(order);
    order.total = amounts.total;
  }

  // 記錄更新時間和操作者
  order.updatedAt = new Date();

  await order.save();

  return order;
};

/**
 * 管理員取消訂單
 * @param {String} orderId - 訂單ID
 * @param {String} reason - 取消原因
 * @param {String} adminId - 管理員ID
 * @returns {Promise<Object>} 更新後的訂單
 */
export const cancelOrder = async (orderId, reason, adminId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError('訂單不存在', 404);
  }

  if (order.status === 'cancelled') {
    throw new AppError('訂單已被取消', 400);
  }

  // 更新訂單狀態
  order.status = 'cancelled';
  order.cancelReason = reason;
  order.cancelledBy = adminId;
  order.cancelledByModel = 'Admin';
  order.cancelledAt = new Date();

  await order.save();
  return order;
};
