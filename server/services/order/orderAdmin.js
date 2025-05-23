/**
 * 訂單管理員服務
 * 處理管理員相關的訂單操作
 */

import Order from '../../models/Order/Order.js';
import { AppError } from '../../middlewares/error.js';

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

  if (fromDate || toDate) {
    query.createdAt = {};

    if (fromDate) {
      query.createdAt.$gte = new Date(fromDate);
    }

    if (toDate) {
      query.createdAt.$lte = new Date(toDate);
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

  if (order.status === 'completed') {
    throw new AppError('已完成的訂單無法取消', 400);
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

  // 設置時間範圍
  if (fromDate || toDate) {
    matchQuery.createdAt = {};
    if (fromDate) {
      matchQuery.createdAt.$gte = new Date(fromDate);
    }
    if (toDate) {
      matchQuery.createdAt.$lte = new Date(toDate);
    }
  } else {
    // 預設查詢最近30天
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    matchQuery.createdAt = { $gte: thirtyDaysAgo };
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
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
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
        completionRate: {
          $cond: [
            { $eq: ['$totalOrders', 0] },
            0,
            { $divide: ['$completedOrders', '$totalOrders'] }
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
    completedOrders: stats.reduce((sum, stat) => sum + stat.completedOrders, 0),
    cancelledOrders: stats.reduce((sum, stat) => sum + stat.cancelledOrders, 0)
  };

  summary.completionRate = summary.totalOrders > 0
    ? Math.round((summary.completedOrders / summary.totalOrders) * 100) / 100
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
      matchQuery.createdAt.$gte = new Date(fromDate);
    }
    if (toDate) {
      matchQuery.createdAt.$lte = new Date(toDate);
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
