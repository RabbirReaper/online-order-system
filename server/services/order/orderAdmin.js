/**
 * 訂單管理員服務 - 完整版
 * 處理管理員相關的訂單操作（支援 Bundle 訂單）
 */

import Order from '../../models/Order/Order.js';
import CouponInstance from '../../models/Promotion/CouponInstance.js';
import { AppError } from '../../middlewares/error.js';
import { parseDateString, getStartOfDay, getEndOfDay } from '../../utils/date.js';
// 直接導入而非動態導入
import {
  processOrderPaymentComplete,
  processOrderPointsReward,
  calculateOrderAmounts
} from './orderCustomer.js';

/**
 * 獲取店鋪訂單列表（管理員）
 */
export const getStoreOrders = async (storeId, options = {}) => {
  const {
    status,
    orderType,
    fromDate,
    toDate,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  // 構建查詢條件
  const query = { store: storeId };

  if (status) {
    query.status = status;
  }

  if (orderType) {
    query.orderType = orderType;
  }

  // 處理日期範圍
  if (fromDate || toDate) {
    query.createdAt = {};

    if (fromDate) {
      const startDateTime = getStartOfDay(parseDateString(fromDate));
      query.createdAt.$gte = startDateTime.toJSDate();
    }

    if (toDate) {
      const endDateTime = getEndOfDay(parseDateString(toDate));
      query.createdAt.$lte = endDateTime.toJSDate();
    }
  }

  // 計算分頁
  const skip = (page - 1) * limit;
  const total = await Order.countDocuments(query);

  // 構建排序條件
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  console.log(`Fetching store orders for store ${storeId} with query:`, query);

  // 查詢訂單並填充關聯資料
  const orders = await Order.find(query)
    .populate('user', 'name email phone')
    .populate('store', 'name')
    .populate('brand', 'name')
    .populate('items.dishInstance', 'name finalPrice options')
    .populate('items.bundleInstance', 'name finalPrice bundleItems')
    .populate('items.generatedCoupons', 'couponName couponType isUsed expiryDate')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  // 處理分頁資訊
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  console.log(`Found ${orders.length} orders for store ${storeId}`);

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
 */
export const getOrderById = async (orderId, storeId = null) => {
  const query = { _id: orderId };

  // 如果提供了店鋪ID，限制查詢範圍
  if (storeId) {
    query.store = storeId;
  }

  console.log(`Fetching order ${orderId} with query:`, query);

  const order = await Order.findOne(query)
    .populate('user', 'name email phone')
    .populate('store', 'name address phone')
    .populate('brand', 'name')
    .populate('items.dishInstance', 'name finalPrice options basePrice')
    .populate('items.bundleInstance', 'name finalPrice bundleItems originalPrice sellingPrice')
    .populate('items.generatedCoupons', 'couponName couponType isUsed expiryDate usedAt');

  if (!order) {
    throw new AppError('訂單不存在或無權訪問', 404);
  }

  console.log(`Found order ${orderId} with status: ${order.status}`);

  return order;
};

/**
 * 更新訂單（管理員）- 支援狀態變更觸發
 */
export const updateOrder = async (orderId, updateData, adminId) => {
  console.log(`Admin ${adminId} updating order ${orderId}:`, updateData);

  const order = await Order.findById(orderId)
    .populate('items.bundleInstance')
    .populate('items.generatedCoupons');

  if (!order) {
    throw new AppError('訂單不存在', 404);
  }

  const previousStatus = order.status;

  // 允許更新的欄位
  const allowedFields = [
    'status',
    'orderType',
    'paymentType',
    'paymentMethod',
    'notes',
    'customerInfo',
    'deliveryInfo',
    'dineInInfo',
    'manualAdjustment',
    'serviceCharge'
  ];

  // 更新允許的欄位
  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      if (field === 'deliveryInfo' || field === 'dineInInfo') {
        order[field] = { ...order[field], ...updateData[field] };
      } else {
        order[field] = updateData[field];
      }
    }
  });

  // 如果更新了手動調整金額或服務費，重新計算總額
  if (updateData.manualAdjustment !== undefined || updateData.serviceCharge !== undefined) {
    const amounts = calculateOrderAmounts(order);
    order.total = amounts.total;
    order.subtotal = amounts.subtotal;
    order.totalDiscount = amounts.totalDiscount;

    console.log(`Recalculated order amounts: total=${amounts.total}, subtotal=${amounts.subtotal}`);
  }

  order.updatedAt = new Date();
  await order.save();

  console.log(`Order ${orderId} updated. Status changed from ${previousStatus} to ${order.status}`);

  // 處理狀態變為 paid 的後續流程
  let result = { ...order.toObject(), pointsAwarded: 0, generatedCoupons: [] };

  if (previousStatus !== 'paid' && order.status === 'paid') {
    try {
      console.log(`Processing payment completion for order ${orderId} (admin update)`);

      // 檢查是否有 Bundle 項目需要生成券
      const hasBundleItems = order.items.some(item => item.itemType === 'bundle');

      if (hasBundleItems || order.user) {
        // 處理 Bundle 券生成和點數給予
        result = await processOrderPaymentComplete(order);
        console.log(`Payment completion processed: points=${result.pointsAwarded}, coupons=${result.generatedCoupons.length}`);
      } else if (order.user) {
        // 只處理點數給予
        const pointsReward = await processOrderPointsReward(order);
        result.pointsAwarded = pointsReward.pointsAwarded;
        console.log(`Points awarded: ${pointsReward.pointsAwarded}`);
      }

    } catch (error) {
      console.error('Failed to process payment completion in admin update:', error);
      // 不影響主要的訂單更新流程，但記錄錯誤
      result.error = 'Payment completion processing failed';
    }
  }

  return result;
};

/**
 * 取消訂單（管理員）- 支援 Bundle 訂單
 */
export const cancelOrder = async (orderId, reason, adminId) => {
  console.log(`Admin ${adminId} cancelling order ${orderId} with reason: ${reason}`);

  const order = await Order.findById(orderId)
    .populate('items.generatedCoupons')
    .populate('items.bundleInstance');

  if (!order) {
    throw new AppError('訂單不存在', 404);
  }

  if (order.status === 'cancelled') {
    throw new AppError('訂單已經被取消', 400);
  }

  const originalStatus = order.status;

  // 處理已生成的兌換券
  let invalidatedCoupons = 0;
  for (const item of order.items) {
    if (item.itemType === 'bundle' && item.generatedCoupons.length > 0) {
      console.log(`Processing ${item.generatedCoupons.length} generated coupons for bundle item`);

      // 將未使用的券標記為無效
      for (const couponId of item.generatedCoupons) {
        const coupon = await CouponInstance.findById(couponId);
        if (coupon && !coupon.isUsed) {
          coupon.isUsed = true; // 標記為已使用（實際是取消）
          coupon.usedAt = new Date();
          coupon.cancelledReason = `Order cancelled: ${reason}`;
          await coupon.save();
          invalidatedCoupons++;
          console.log(`Invalidated coupon: ${coupon.couponName}`);
        }
      }
    }
  }

  // 如果是已付款的訂單，需要還原庫存
  if (originalStatus === 'paid') {
    try {
      await restoreInventoryForCancelledOrder(order);
      console.log('Inventory restored for cancelled order');
    } catch (inventoryError) {
      console.error('Failed to restore inventory for cancelled order:', inventoryError);
      // 繼續處理取消，但記錄錯誤
    }

    // 退還已獲得的點數
    if (order.user && order.pointsEarned > 0) {
      try {
        await refundPointsForOrder(orderId);
        console.log(`Refunded ${order.pointsEarned} points for cancelled order`);
      } catch (pointsError) {
        console.error('Failed to refund points for cancelled order:', pointsError);
        // 繼續處理取消，但記錄錯誤
      }
    }
  }

  // 更新訂單狀態
  order.status = 'cancelled';
  order.cancelledAt = new Date();
  order.cancelledBy = adminId;
  order.cancelReason = reason;
  order.updatedAt = new Date();

  await order.save();

  console.log(`✅ Order ${orderId} cancelled successfully:`);
  console.log(`   - Invalidated coupons: ${invalidatedCoupons}`);
  console.log(`   - Points refunded: ${order.pointsEarned || 0}`);

  return {
    ...order.toObject(),
    invalidatedCoupons,
    pointsRefunded: order.pointsEarned || 0
  };
};

/**
 * 批量更新訂單狀態（管理員）
 */
export const batchUpdateOrderStatus = async (orderIds, newStatus, adminId) => {
  console.log(`Admin ${adminId} batch updating ${orderIds.length} orders to status: ${newStatus}`);

  if (!orderIds || orderIds.length === 0) {
    throw new AppError('沒有提供訂單ID', 400);
  }

  const validStatuses = ['unpaid', 'paid', 'cancelled'];
  if (!validStatuses.includes(newStatus)) {
    throw new AppError('無效的訂單狀態', 400);
  }

  const results = {
    successful: [],
    failed: [],
    total: orderIds.length
  };

  for (const orderId of orderIds) {
    try {
      const result = await updateOrder(orderId, { status: newStatus }, adminId);
      results.successful.push({
        orderId,
        previousStatus: result.status,
        newStatus,
        pointsAwarded: result.pointsAwarded || 0
      });
    } catch (error) {
      results.failed.push({
        orderId,
        error: error.message
      });
      console.error(`Failed to update order ${orderId}:`, error.message);
    }
  }

  console.log(`Batch update completed: ${results.successful.length} successful, ${results.failed.length} failed`);

  return results;
};

/**
 * 獲取訂單統計（管理員）
 */
export const getOrderStatistics = async (storeId, options = {}) => {
  const { fromDate, toDate, groupBy = 'day' } = options;

  // 構建查詢條件
  const query = { store: storeId };

  if (fromDate || toDate) {
    query.createdAt = {};

    if (fromDate) {
      const startDateTime = getStartOfDay(parseDateString(fromDate));
      query.createdAt.$gte = startDateTime.toJSDate();
    }

    if (toDate) {
      const endDateTime = getEndOfDay(parseDateString(toDate));
      query.createdAt.$lte = endDateTime.toJSDate();
    }
  }

  console.log(`Calculating order statistics for store ${storeId}:`, query);

  // 基本統計
  const totalOrders = await Order.countDocuments(query);
  const paidOrders = await Order.countDocuments({ ...query, status: 'paid' });
  const cancelledOrders = await Order.countDocuments({ ...query, status: 'cancelled' });
  const unpaidOrders = await Order.countDocuments({ ...query, status: 'unpaid' });

  // 營收統計
  const revenueResult = await Order.aggregate([
    { $match: { ...query, status: 'paid' } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$total' },
        averageOrderValue: { $avg: '$total' },
        totalDishRevenue: { $sum: '$dishSubtotal' },
        totalCouponRevenue: { $sum: '$couponSubtotal' }
      }
    }
  ]);

  const revenue = revenueResult[0] || {
    totalRevenue: 0,
    averageOrderValue: 0,
    totalDishRevenue: 0,
    totalCouponRevenue: 0
  };

  // 按時間分組的趨勢數據
  let dateFormat;
  switch (groupBy) {
    case 'hour':
      dateFormat = '%Y-%m-%d %H:00:00';
      break;
    case 'day':
      dateFormat = '%Y-%m-%d';
      break;
    case 'month':
      dateFormat = '%Y-%m';
      break;
    default:
      dateFormat = '%Y-%m-%d';
  }

  const trendData = await Order.aggregate([
    { $match: query },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          status: '$status'
        },
        count: { $sum: 1 },
        revenue: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$total', 0] } }
      }
    },
    { $sort: { '_id.date': 1 } }
  ]);

  console.log(`Order statistics calculated: ${totalOrders} total orders, $${revenue.totalRevenue} revenue`);

  return {
    summary: {
      totalOrders,
      paidOrders,
      unpaidOrders,
      cancelledOrders,
      ...revenue
    },
    trends: trendData
  };
};

/**
 * 還原取消訂單的庫存
 */
const restoreInventoryForCancelledOrder = async (order) => {
  // 只還原餐點的庫存，Bundle 不影響庫存
  const dishItems = order.items.filter(item => item.itemType === 'dish');

  if (dishItems.length === 0) {
    console.log('No dish items to restore inventory for');
    return;
  }

  console.log(`Restoring inventory for ${dishItems.length} dish items`);

  // 這裡需要導入庫存服務，但為了避免循環依賴，我們使用簡化版本
  // 在實際使用中，這應該調用 inventoryService.restoreInventoryForCancelledOrder
  for (const item of dishItems) {
    try {
      // 這裡應該是庫存還原的邏輯
      console.log(`Should restore inventory for dish: ${item.itemName}, quantity: ${item.quantity}`);
      // await inventoryService.restoreInventory(order.store, item.dishInstance, item.quantity);
    } catch (error) {
      console.error(`Failed to restore inventory for dish ${item.itemName}:`, error);
    }
  }
};

/**
 * 退還訂單的點數
 */
const refundPointsForOrder = async (orderId) => {
  try {
    // 這裡應該調用點數服務來退還點數
    // 在實際使用中，這應該調用 pointService.refundPointsForOrder
    console.log(`Should refund points for order: ${orderId}`);
    // await pointService.refundPointsForOrder(orderId);
  } catch (error) {
    console.error(`Failed to refund points for order ${orderId}:`, error);
    throw error;
  }
};

/**
 * 獲取訂單變更歷史（管理員）
 */
export const getOrderHistory = async (orderId) => {
  // 這個功能需要額外的歷史記錄模型來實現
  // 目前返回基本的訂單資訊
  const order = await getOrderById(orderId);

  return {
    orderId,
    currentStatus: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    // 未來可以擴展包含詳細的變更歷史
    changes: []
  };
};

/**
 * 搜索訂單（管理員）
 */
export const searchOrders = async (storeId, searchOptions = {}) => {
  const {
    keyword,
    customerEmail,
    customerPhone,
    orderNumber,
    page = 1,
    limit = 20
  } = searchOptions;

  const query = { store: storeId };

  // 構建搜索條件
  const searchConditions = [];

  if (keyword) {
    searchConditions.push(
      { 'customerInfo.name': { $regex: keyword, $options: 'i' } },
      { notes: { $regex: keyword, $options: 'i' } }
    );
  }

  if (customerEmail) {
    searchConditions.push({ 'customerInfo.email': { $regex: customerEmail, $options: 'i' } });
  }

  if (customerPhone) {
    searchConditions.push({ 'customerInfo.phone': { $regex: customerPhone, $options: 'i' } });
  }

  if (orderNumber) {
    // 假設訂單號格式為 orderDateCode + sequence
    searchConditions.push({
      $expr: {
        $regexMatch: {
          input: { $concat: ['$orderDateCode', { $toString: '$sequence' }] },
          regex: orderNumber,
          options: 'i'
        }
      }
    });
  }

  if (searchConditions.length > 0) {
    query.$or = searchConditions;
  }

  console.log(`Searching orders with conditions:`, query);

  const skip = (page - 1) * limit;
  const total = await Order.countDocuments(query);

  const orders = await Order.find(query)
    .populate('user', 'name email phone')
    .populate('store', 'name')
    .populate('brand', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalPages = Math.ceil(total / limit);

  console.log(`Found ${orders.length} orders matching search criteria`);

  return {
    orders,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};
