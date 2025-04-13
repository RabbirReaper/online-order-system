/**
 * 訂單統計服務
 * 處理訂單數據統計和分析
 */

import Order from '../../models/Order/Order.js';
import { getStartOfDay, getEndOfDay, getStartOfMonth, getEndOfMonth } from '../../utils/date.js';

/**
 * 獲取每日訂單統計數據
 * @param {String} storeId - 店鋪ID
 * @param {Date} date - 日期 (默認今天)
 * @returns {Promise<Object>} 統計數據
 */
export const getDailyOrderStats = async (storeId, date = new Date()) => {
  // 計算日期範圍
  const startDate = getStartOfDay(date).toJSDate();
  const endDate = getEndOfDay(date).toJSDate();

  // 查詢條件
  const matchStage = {
    $match: {
      store: storeId,
      createdAt: { $gte: startDate, $lte: endDate }
    }
  };

  // 分組和統計
  const groupStage = {
    $group: {
      _id: null,
      totalOrders: { $sum: 1 },
      completedOrders: {
        $sum: {
          $cond: [{ $eq: ["$status", "completed"] }, 1, 0]
        }
      },
      cancelledOrders: {
        $sum: {
          $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0]
        }
      },
      totalRevenue: {
        $sum: {
          $cond: [
            { $ne: ["$status", "cancelled"] },
            "$total",
            0
          ]
        }
      },
      avgOrderValue: {
        $avg: {
          $cond: [
            { $ne: ["$status", "cancelled"] },
            "$total",
            null
          ]
        }
      },
      // 訂單類型分布
      dineInOrders: {
        $sum: {
          $cond: [{ $eq: ["$orderType", "dine_in"] }, 1, 0]
        }
      },
      takeoutOrders: {
        $sum: {
          $cond: [{ $eq: ["$orderType", "takeout"] }, 1, 0]
        }
      },
      deliveryOrders: {
        $sum: {
          $cond: [{ $eq: ["$orderType", "delivery"] }, 1, 0]
        }
      }
    }
  };

  // 執行聚合查詢
  const result = await Order.aggregate([
    matchStage,
    groupStage
  ]);

  // 如果沒有訂單，返回默認數據
  if (result.length === 0) {
    return {
      date: startDate,
      totalOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
      dineInOrders: 0,
      takeoutOrders: 0,
      deliveryOrders: 0,
      hourlyDistribution: [],
      paymentMethodDistribution: {}
    };
  }

  // 獲取每小時訂單分布
  const hourlyDistribution = await Order.aggregate([
    matchStage,
    {
      $group: {
        _id: { $hour: "$createdAt" },
        count: { $sum: 1 },
        revenue: {
          $sum: {
            $cond: [
              { $ne: ["$status", "cancelled"] },
              "$total",
              0
            ]
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // 獲取支付方式分布
  const paymentMethodDistribution = await Order.aggregate([
    matchStage,
    {
      $group: {
        _id: "$paymentMethod",
        count: { $sum: 1 },
        revenue: {
          $sum: {
            $cond: [
              { $ne: ["$status", "cancelled"] },
              "$total",
              0
            ]
          }
        }
      }
    }
  ]);

  // 整理支付方式數據
  const paymentMethods = {};
  paymentMethodDistribution.forEach(item => {
    paymentMethods[item._id] = {
      count: item.count,
      revenue: item.revenue
    };
  });

  // 返回統計結果
  return {
    date: startDate,
    ...result[0],
    hourlyDistribution: hourlyDistribution.map(item => ({
      hour: item._id,
      count: item.count,
      revenue: item.revenue
    })),
    paymentMethodDistribution: paymentMethods
  };
};

/**
 * 獲取月度訂單統計數據
 * @param {String} storeId - 店鋪ID
 * @param {Number} year - 年份
 * @param {Number} month - 月份 (1-12)
 * @returns {Promise<Object>} 統計數據
 */
export const getMonthlyOrderStats = async (storeId, year, month) => {
  // 創建日期對象
  const date = new Date(year, month - 1, 1);

  // 計算月份的開始和結束時間
  const startDate = getStartOfMonth(date).toJSDate();
  const endDate = getEndOfMonth(date).toJSDate();

  // 查詢條件
  const matchStage = {
    $match: {
      store: storeId,
      createdAt: { $gte: startDate, $lte: endDate }
    }
  };

  // 分組和統計
  const groupStage = {
    $group: {
      _id: null,
      totalOrders: { $sum: 1 },
      completedOrders: {
        $sum: {
          $cond: [{ $eq: ["$status", "completed"] }, 1, 0]
        }
      },
      cancelledOrders: {
        $sum: {
          $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0]
        }
      },
      totalRevenue: {
        $sum: {
          $cond: [
            { $ne: ["$status", "cancelled"] },
            "$total",
            0
          ]
        }
      },
      avgOrderValue: {
        $avg: {
          $cond: [
            { $ne: ["$status", "cancelled"] },
            "$total",
            null
          ]
        }
      }
    }
  };

  // 執行聚合查詢
  const result = await Order.aggregate([
    matchStage,
    groupStage
  ]);

  // 如果沒有訂單，返回默認數據
  if (result.length === 0) {
    return {
      year,
      month,
      totalOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
      dailyDistribution: [],
      orderTypeDistribution: {
        dine_in: 0,
        takeout: 0,
        delivery: 0
      }
    };
  }

  // 獲取每日訂單分布
  const dailyDistribution = await Order.aggregate([
    matchStage,
    {
      $group: {
        _id: { $dayOfMonth: "$createdAt" },
        count: { $sum: 1 },
        revenue: {
          $sum: {
            $cond: [
              { $ne: ["$status", "cancelled"] },
              "$total",
              0
            ]
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // 獲取訂單類型分布
  const orderTypeDistribution = await Order.aggregate([
    matchStage,
    {
      $group: {
        _id: "$orderType",
        count: { $sum: 1 },
        revenue: {
          $sum: {
            $cond: [
              { $ne: ["$status", "cancelled"] },
              "$total",
              0
            ]
          }
        }
      }
    }
  ]);

  // 整理訂單類型數據
  const orderTypes = {
    dine_in: 0,
    takeout: 0,
    delivery: 0
  };

  orderTypeDistribution.forEach(item => {
    if (orderTypes.hasOwnProperty(item._id)) {
      orderTypes[item._id] = item.count;
    }
  });

  // 返回統計結果
  return {
    year,
    month,
    ...result[0],
    dailyDistribution: dailyDistribution.map(item => ({
      day: item._id,
      count: item.count,
      revenue: item.revenue
    })),
    orderTypeDistribution: orderTypes
  };
};

/**
 * 獲取用戶訂單歷史
 * @param {String} userId - 用戶ID
 * @param {Object} options - 查詢選項
 * @param {Number} options.page - 頁碼 (默認 1)
 * @param {Number} options.limit - 每頁數量 (默認 10)
 * @param {String} options.sortBy - 排序欄位 (默認 'createdAt')
 * @param {String} options.sortOrder - 排序方向 (默認 'desc')
 * @returns {Promise<Object>} 用戶訂單歷史
 */
export const getUserOrderHistory = async (userId, options = {}) => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;
  const sortBy = options.sortBy || 'createdAt';
  const sortOrder = options.sortOrder || 'desc';

  // 構建排序對象
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // 查詢條件
  const query = { user: userId };

  // 查詢總數
  const total = await Order.countDocuments(query);

  // 查詢訂單
  const orders = await Order.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('items.dishInstance', 'name')
    .select('-__v');

  // 處理分頁信息
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
 * 獲取熱門餐點統計
 * @param {String} storeId - 店鋪ID
 * @param {Object} options - 查詢選項
 * @param {Date} options.startDate - 開始日期
 * @param {Date} options.endDate - 結束日期
 * @param {Number} options.limit - 最大餐點數量 (默認 10)
 * @returns {Promise<Array>} 熱門餐點統計
 */
export const getPopularDishes = async (storeId, options = {}) => {
  const limit = options.limit || 10;
  let startDate = options.startDate;
  let endDate = options.endDate;

  // 如果沒有提供日期範圍，默認查詢過去 30 天
  if (!startDate) {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
  }

  if (!endDate) {
    endDate = new Date();
  }

  // 查詢條件
  const matchStage = {
    $match: {
      store: storeId,
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $ne: 'cancelled' }
    }
  };

  // 解構訂單項目
  const unwindStage = {
    $unwind: '$items'
  };

  // 查詢和關聯餐點
  const lookupStage = {
    $lookup: {
      from: 'dishinstances',
      localField: 'items.dishInstance',
      foreignField: '_id',
      as: 'dishDetail'
    }
  };

  // 解構餐點詳情
  const unwindDishStage = {
    $unwind: '$dishDetail'
  };

  // 關聯餐點模板
  const lookupTemplateStage = {
    $lookup: {
      from: 'dishtemplates',
      localField: 'dishDetail.templateId',
      foreignField: '_id',
      as: 'template'
    }
  };

  // 解構模板
  const unwindTemplateStage = {
    $unwind: '$template'
  };

  // 分組和統計
  const groupStage = {
    $group: {
      _id: '$template._id',
      dishName: { $first: '$template.name' },
      totalOrdered: { $sum: '$items.quantity' },
      totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.subtotal'] } },
      avgPrice: { $avg: '$items.subtotal' }
    }
  };

  // 排序
  const sortStage = {
    $sort: { totalOrdered: -1 }
  };

  // 限制數量
  const limitStage = {
    $limit: limit
  };

  // 執行聚合查詢
  const popularDishes = await Order.aggregate([
    matchStage,
    unwindStage,
    lookupStage,
    unwindDishStage,
    lookupTemplateStage,
    unwindTemplateStage,
    groupStage,
    sortStage,
    limitStage
  ]);

  return popularDishes;
};
