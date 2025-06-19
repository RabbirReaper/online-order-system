/**
 * 訂單管理員服務
 * 處理管理員相關的訂單操作
 */

import Order from '../../models/Order/Order.js';
import { AppError } from '../../middlewares/error.js';
import { parseDateString, getStartOfDay, getEndOfDay } from '../../utils/date.js';

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

  // 使用新的 date utils 處理台灣時區的日期範圍
  if (fromDate || toDate) {
    query.createdAt = {};

    if (fromDate) {
      try {
        // 使用 parseDateString 解析前端傳來的 YYYY-MM-DD 格式
        const startDateTime = getStartOfDay(parseDateString(fromDate));
        query.createdAt.$gte = startDateTime.toJSDate();
      } catch (error) {
        console.error('解析開始日期失敗:', error);
        throw new AppError('無效的開始日期格式', 400);
      }
    }

    if (toDate) {
      try {
        // 使用 parseDateString 解析前端傳來的 YYYY-MM-DD 格式
        const endDateTime = getEndOfDay(parseDateString(toDate));
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

    // console.log(`店鋪 ${storeId} 查詢結果:`, {
    //   查詢條件: query,
    //   總訂單數: anyOrders,
    //   最近訂單: recentOrders
    // });
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
 * 更新訂單（統一接口）- 修改版本，支援點數給予
 */
export const updateOrder = async (orderId, updateData, adminId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError('訂單不存在', 404);
  }

  const previousStatus = order.status;

  // 可更新的欄位
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

  // 處理點數給予（狀態從非paid變為paid時）
  let pointsReward = { pointsAwarded: 0 };
  if (previousStatus !== 'paid' && order.status === 'paid' && order.user) {
    try {
      // 導入點數處理函數
      const { processOrderPointsReward } = await import('./orderCustomer.js');
      pointsReward = await processOrderPointsReward(order);

    } catch (error) {
      console.error('管理員更新訂單時處理點數獎勵失敗:', error);
      // 不影響主要的訂單更新流程
    }
  }

  return {
    ...order.toObject(),
    pointsAwarded: pointsReward.pointsAwarded
  };
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
