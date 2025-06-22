/**
 * 訂單管理員服務
 * 處理管理員相關的訂單操作（支援 Bundle 訂單）
 */

import Order from '../../models/Order/Order.js';
import { AppError } from '../../middlewares/error.js';
import { parseDateString, getStartOfDay, getEndOfDay } from '../../utils/date.js';

/**
 * 獲取店鋪訂單列表
 */
export const getStoreOrders = async (storeId, options = {}) => {
  const { status, orderType, fromDate, toDate, page = 1, limit = 20 } = options;

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
      try {
        const startDateTime = getStartOfDay(parseDateString(fromDate));
        query.createdAt.$gte = startDateTime.toJSDate();
      } catch (error) {
        console.error('解析開始日期失敗:', error);
        throw new AppError('無效的開始日期格式', 400);
      }
    }

    if (toDate) {
      try {
        const endDateTime = getEndOfDay(parseDateString(toDate));
        query.createdAt.$lte = endDateTime.toJSDate();
      } catch (error) {
        console.error('解析結束日期失敗:', error);
        throw new AppError('無效的結束日期格式', 400);
      }
    }
  }

  const skip = (page - 1) * limit;
  const total = await Order.countDocuments(query);

  // 查詢訂單，包含 Bundle 資訊
  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('items.dishInstance', 'name finalPrice options')
    .populate('items.bundle', 'name description sellingPrice')
    .populate('items.generatedCoupons', 'couponName couponType isUsed expiryDate')
    .populate('user', 'name email phone')
    .lean();

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
 */
export const getOrderById = async (orderId, storeId) => {
  const query = { _id: orderId };
  if (storeId) query.store = storeId;

  const order = await Order.findOne(query)
    .populate('items.dishInstance', 'name finalPrice options')
    .populate('items.bundle', 'name description sellingPrice bundleItems')
    .populate({
      path: 'items.bundle',
      populate: {
        path: 'bundleItems.couponTemplate',
        select: 'name description couponType'
      }
    })
    .populate('items.generatedCoupons', 'couponName couponType isUsed expiryDate usedAt')
    .populate('user', 'name email phone')
    .lean();

  if (!order) {
    throw new AppError('訂單不存在', 404);
  }

  return order;
};

/**
 * 更新訂單（統一接口）- 支援 Bundle 和點數給予
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

  order.updatedAt = new Date();
  await order.save();

  // 處理狀態變為 paid 的後續流程
  let result = { ...order.toObject(), pointsAwarded: 0, generatedCoupons: [] };

  if (previousStatus !== 'paid' && order.status === 'paid') {
    try {
      // 導入付款完成處理函數
      const { processOrderPaymentComplete } = await import('./orderCustomer.js');

      // 檢查是否有 Bundle 項目需要生成券
      const hasBundleItems = order.items.some(item => item.itemType === 'bundle');

      if (hasBundleItems || order.user) {
        // 處理 Bundle 券生成和點數給予
        result = await processOrderPaymentComplete(order);
      } else if (order.user) {
        // 只處理點數給予
        const { processOrderPointsReward } = await import('./orderCustomer.js');
        const pointsReward = await processOrderPointsReward(order);
        result.pointsAwarded = pointsReward.pointsAwarded;
      }

    } catch (error) {
      console.error('管理員更新訂單時處理付款完成流程失敗:', error);
      // 不影響主要的訂單更新流程
    }
  }

  return result;
};

/**
 * 管理員取消訂單 - 支援 Bundle 訂單
 */
export const cancelOrder = async (orderId, reason, adminId) => {
  const order = await Order.findById(orderId)
    .populate('items.generatedCoupons');

  if (!order) {
    throw new AppError('訂單不存在', 404);
  }

  if (order.status === 'cancelled') {
    throw new AppError('訂單已被取消', 400);
  }

  // 如果訂單包含已生成的兌換券，需要處理券的狀態
  for (const item of order.items) {
    if (item.itemType === 'bundle' && item.generatedCoupons && item.generatedCoupons.length > 0) {
      // 將未使用的兌換券標記為無效
      const CouponInstance = (await import('../../models/Promotion/CouponInstance.js')).default;

      for (const couponId of item.generatedCoupons) {
        const coupon = await CouponInstance.findById(couponId);
        if (coupon && !coupon.isUsed) {
          // 標記券為已使用（實際上是取消）
          coupon.isUsed = true;
          coupon.usedAt = new Date();
          await coupon.save();
        }
      }
    }
  }

  // 還原庫存（如果有餐點項目）
  try {
    const { restoreInventoryForCancelledOrder } = await import('../inventory/stockManagement.js');
    await restoreInventoryForCancelledOrder(order);
  } catch (error) {
    console.error('還原庫存失敗:', error);
    // 繼續執行取消流程
  }

  // 退還點數（如果有使用點數）
  if (order.user && order.pointsEarned > 0) {
    try {
      const { refundPointsForOrder } = await import('../promotion/pointService.js');
      await refundPointsForOrder(orderId);
    } catch (error) {
      console.error('退還點數失敗:', error);
      // 繼續執行取消流程
    }
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
