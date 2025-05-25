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

  // 可更新的欄位
  const allowedFields = [
    'status',
    'manualAdjustment',
    'notes',
    'estimatedPickupTime',
    'deliveryInfo',
    'dineInInfo'
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

/**
 * 獲取訂單統計
 * @param {String} storeId - 店鋪ID
 * @param {Object} options - 查詢選項
 * @returns {Promise<Object>} 統計結果
 */
export const getOrderStats = async (storeId, options = {}) => {
  const { fromDate, toDate, groupBy = 'day' } = options;

  // 構建基本查詢條件
  const matchQuery = { store: storeId };

  // 使用 Luxon 設置時間範圍
  if (fromDate || toDate) {
    matchQuery.createdAt = {};

    if (fromDate) {
      try {
        const inputDate = DateTime.fromISO(fromDate, { zone: 'Asia/Taipei' });
        const startDateTime = getStartOfDay(inputDate);
        matchQuery.createdAt.$gte = startDateTime.toJSDate();
      } catch (error) {
        console.error('統計查詢 - 解析開始日期失敗:', error);
        throw new AppError('無效的開始日期格式', 400);
      }
    }

    if (toDate) {
      try {
        const inputDate = DateTime.fromISO(toDate, { zone: 'Asia/Taipei' });
        const endDateTime = getEndOfDay(inputDate);
        matchQuery.createdAt.$lte = endDateTime.toJSDate();
      } catch (error) {
        console.error('統計查詢 - 解析結束日期失敗:', error);
        throw new AppError('無效的結束日期格式', 400);
      }
    }
  } else {
    // 預設查詢最近30天
    const thirtyDaysAgo = getTaiwanDateTime().minus({ days: 30 });
    matchQuery.createdAt = { $gte: thirtyDaysAgo.toJSDate() };
  }

  // 根據 groupBy 設置分組格式
  let dateFormat;
  switch (groupBy) {
    case 'hour':
      dateFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' },
        hour: { $hour: '$createdAt' }
      };
      break;
    case 'day':
      dateFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      };
      break;
    case 'month':
      dateFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      };
      break;
    default:
      dateFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      };
  }

  // 聚合查詢
  const pipeline = [
    { $match: matchQuery },
    {
      $group: {
        _id: dateFormat,
        totalOrders: { $sum: 1 },
        totalAmount: { $sum: '$total' },
        paidOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
        },
        unpaidOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'unpaid'] }, 1, 0] }
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        },
        averageAmount: { $avg: '$total' },
        orderTypes: {
          $push: '$orderType'
        }
      }
    },
    {
      $addFields: {
        paymentRate: {
          $cond: [
            { $eq: ['$totalOrders', 0] },
            0,
            { $divide: ['$paidOrders', '$totalOrders'] }
          ]
        }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
  ];

  const stats = await Order.aggregate(pipeline);

  // 處理訂單類型統計
  const processedStats = stats.map(stat => {
    const orderTypeCounts = {};
    stat.orderTypes.forEach(type => {
      orderTypeCounts[type] = (orderTypeCounts[type] || 0) + 1;
    });

    return {
      ...stat,
      orderTypes: orderTypeCounts,
      averageAmount: Math.round(stat.averageAmount || 0),
      completionRate: Math.round((stat.completionRate || 0) * 100) / 100
    };
  });

  // 計算總覽統計
  const summary = {
    totalOrders: stats.reduce((sum, stat) => sum + stat.totalOrders, 0),
    totalAmount: stats.reduce((sum, stat) => sum + stat.totalAmount, 0),
    paidOrders: stats.reduce((sum, stat) => sum + stat.paidOrders, 0),
    unpaidOrders: stats.reduce((sum, stat) => sum + stat.unpaidOrders, 0),
    cancelledOrders: stats.reduce((sum, stat) => sum + stat.cancelledOrders, 0)
  };

  summary.paymentRate = summary.totalOrders > 0
    ? Math.round((summary.paidOrders / summary.totalOrders) * 100) / 100
    : 0;
  summary.averageAmount = summary.totalOrders > 0
    ? Math.round(summary.totalAmount / summary.totalOrders)
    : 0;

  return {
    summary,
    details: processedStats,
    period: {
      fromDate: matchQuery.createdAt?.$gte || null,
      toDate: matchQuery.createdAt?.$lte || null,
      groupBy
    }
  };
};

/**
 * 獲取熱門餐點統計
 * @param {String} storeId - 店鋪ID
 * @param {Object} options - 查詢選項
 * @returns {Promise<Array>} 熱門餐點列表
 */
export const getPopularDishes = async (storeId, options = {}) => {
  const { fromDate, toDate, limit = 10 } = options;

  // 構建查詢條件
  const matchQuery = {
    store: storeId,
    status: { $ne: 'cancelled' } // 排除已取消的訂單
  };

  if (fromDate || toDate) {
    matchQuery.createdAt = {};

    if (fromDate) {
      try {
        const inputDate = DateTime.fromISO(fromDate, { zone: 'Asia/Taipei' });
        const startDateTime = getStartOfDay(inputDate);
        matchQuery.createdAt.$gte = startDateTime.toJSDate();
      } catch (error) {
        console.error('熱門餐點查詢 - 解析開始日期失敗:', error);
        throw new AppError('無效的開始日期格式', 400);
      }
    }

    if (toDate) {
      try {
        const inputDate = DateTime.fromISO(toDate, { zone: 'Asia/Taipei' });
        const endDateTime = getEndOfDay(inputDate);
        matchQuery.createdAt.$lte = endDateTime.toJSDate();
      } catch (error) {
        console.error('熱門餐點查詢 - 解析結束日期失敗:', error);
        throw new AppError('無效的結束日期格式', 400);
      }
    }
  }

  const pipeline = [
    { $match: matchQuery },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'dishinstances',
        localField: 'items.dishInstance',
        foreignField: '_id',
        as: 'dishDetails'
      }
    },
    { $unwind: '$dishDetails' },
    {
      $group: {
        _id: '$dishDetails.templateId',
        dishName: { $first: '$dishDetails.name' },
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.subtotal' },
        orderCount: { $sum: 1 },
        averagePrice: { $avg: '$dishDetails.price' }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: limit }
  ];

  const popularDishes = await Order.aggregate(pipeline);

  return popularDishes.map(dish => ({
    ...dish,
    averagePrice: Math.round(dish.averagePrice || 0)
  }));
};
