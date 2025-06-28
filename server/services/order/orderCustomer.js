/**
 * 訂單客戶服務
 * 處理客戶相關的訂單操作（支援 Bundle 購買）
 */

import Order from '../../models/Order/Order.js';
import DishInstance from '../../models/Dish/DishInstance.js';
import BundleInstance from '../../models/Promotion/BundleInstance.js';
import Bundle from '../../models/Promotion/Bundle.js';
import CouponInstance from '../../models/Promotion/CouponInstance.js';
import { AppError } from '../../middlewares/error.js';
import * as inventoryService from '../inventory/stockManagement.js';
import * as bundleService from '../bundle/bundleService.js';
import * as bundleInstanceService from '../bundle/bundleInstance.js';
import { getTaiwanDateTime, formatDateTime, generateDateCode } from '../../utils/date.js';

/**
 * 創建訂單 - 支援 Bundle 購買
 */
export const createOrder = async (orderData) => {
  try {
    // 設置預設手動調整金額
    orderData.manualAdjustment = orderData.manualAdjustment || 0;

    // 處理訂單項目
    const items = [];
    let dishSubtotal = 0;
    let couponSubtotal = 0;

    for (const item of orderData.items) {
      if (item.itemType === 'dish') {
        // 處理餐點項目
        const dishItem = await createDishItem(item, orderData.brand);
        items.push(dishItem);
        dishSubtotal += dishItem.subtotal;
      } else if (item.itemType === 'bundle') {
        // 處理 Bundle 項目 - 修改為使用 BundleInstance
        const bundleItem = await createBundleItem(item, orderData.user, orderData.store, orderData.brand);
        items.push(bundleItem);
        couponSubtotal += bundleItem.subtotal;
      }
    }

    // 更新訂單數據
    orderData.items = items;
    orderData.dishSubtotal = dishSubtotal;
    orderData.couponSubtotal = couponSubtotal;

    // 創建並保存訂單
    const order = new Order(orderData);

    // 確保訂單金額計算正確
    updateOrderAmounts(order);

    // 先保存訂單以獲得 _id
    await order.save();

    // 扣除餐點庫存（只有啟用庫存管理的項目才會被扣除）
    await inventoryService.reduceInventoryForOrder(order);

    // 如果是即時付款，處理後續流程
    let result = { ...order.toObject(), pointsAwarded: 0, generatedCoupons: [] };

    if (order.status === 'paid') {
      result = await processOrderPaymentComplete(order);
    }

    return result;

  } catch (error) {
    console.error('創建訂單錯誤:', error);
    throw error;
  }
};

/**
 * 創建餐點項目
 */
const createDishItem = async (item, brandId) => {
  // 建立餐點實例
  const dishInstance = new DishInstance({
    brand: brandId,
    templateId: item.templateId,
    name: item.name,
    basePrice: item.basePrice,
    options: item.options || [],
    finalPrice: item.finalPrice || item.subtotal || (item.basePrice * item.quantity)
  });

  await dishInstance.save();

  return {
    itemType: 'dish',
    itemName: item.name,
    dishInstance: dishInstance._id,
    quantity: item.quantity,
    subtotal: item.subtotal || (dishInstance.finalPrice * item.quantity),
    note: item.note || ''
  };
};

/**
 * 創建 Bundle 項目 - 修改為使用 BundleInstance
 */
const createBundleItem = async (item, userId, storeId, brandId) => {
  // 驗證 Bundle 購買資格
  await bundleService.validateBundlePurchase(
    item.bundleId || item.templateId,
    userId,
    item.quantity,
    storeId
  );

  // 創建 Bundle 實例
  const bundleInstanceData = {
    templateId: item.bundleId || item.templateId,
    brand: brandId,
    purchasedAt: new Date()
  };

  const bundleInstance = await bundleInstanceService.createInstance(bundleInstanceData);

  return {
    itemType: 'bundle',
    itemName: item.name || bundleInstance.name,
    bundleInstance: bundleInstance._id,
    quantity: item.quantity,
    subtotal: item.subtotal || (bundleInstance.finalPrice * item.quantity),
    note: item.note || '',
    generatedCoupons: [] // 將在付款完成後填入
  };
};

/**
 * 處理訂單付款完成後的流程
 */
export const processOrderPaymentComplete = async (order) => {
  let pointsReward = { pointsAwarded: 0 };
  let generatedCoupons = [];

  // 1. 生成 Bundle 的兌換券 - 修改為使用 BundleInstance
  for (const item of order.items) {
    if (item.itemType === 'bundle') {
      const bundleCoupons = await generateCouponsForBundle(item, order);
      generatedCoupons.push(...bundleCoupons);

      // 更新訂單項目的 generatedCoupons
      item.generatedCoupons = bundleCoupons.map(c => c._id);
    }
  }

  // 2. 更新 Bundle 銷售統計 - 修改為使用 BundleInstance
  await updateBundleSalesStats(order);

  // 3. 處理點數給予
  if (order.user) {
    pointsReward = await processOrderPointsReward(order);
  }

  // 4. 保存訂單更新
  await order.save();

  return {
    ...order.toObject(),
    pointsAwarded: pointsReward.pointsAwarded,
    generatedCoupons
  };
};

/**
 * 為 Bundle 生成兌換券 - 修改為使用 BundleInstance
 */
const generateCouponsForBundle = async (bundleItem, order) => {
  const bundleInstance = await BundleInstance.findById(bundleItem.bundleInstance)
    .populate('bundleItems.couponTemplate');

  if (!bundleInstance) {
    throw new AppError('Bundle 實例不存在', 404);
  }

  const generatedCoupons = [];

  // 為每個購買數量生成券
  for (let i = 0; i < bundleItem.quantity; i++) {
    // 為 Bundle 中的每個券模板生成對應數量的券
    for (const bundleCouponItem of bundleInstance.bundleItems) {
      for (let j = 0; j < bundleCouponItem.quantity; j++) {
        const couponInstance = new CouponInstance({
          brand: order.brand,
          template: bundleCouponItem.couponTemplate._id,
          couponName: bundleCouponItem.couponTemplate.name,
          couponType: bundleCouponItem.couponTemplate.couponType,
          user: order.user,
          acquiredAt: new Date(),
          pointsUsed: 0, // Bundle 購買不消耗點數
          order: order._id
        });

        // 根據券類型設置相關資訊
        if (bundleCouponItem.couponTemplate.couponType === 'discount') {
          couponInstance.discount = bundleCouponItem.couponTemplate.discountInfo.discountValue;
        } else if (bundleCouponItem.couponTemplate.couponType === 'exchange') {
          couponInstance.exchangeItems = bundleCouponItem.couponTemplate.exchangeInfo.items;
        }

        // 設置過期日期（購買時間 + Bundle 實例設定的有效期天數）
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + bundleInstance.couponValidityDays);
        couponInstance.expiryDate = expiryDate;

        await couponInstance.save();
        generatedCoupons.push(couponInstance);
      }
    }
  }

  return generatedCoupons;
};

/**
 * 更新 Bundle 銷售統計 - 修改為使用 BundleInstance
 */
const updateBundleSalesStats = async (order) => {
  for (const item of order.items) {
    if (item.itemType === 'bundle') {
      // 透過 BundleInstance 找到原始的 Bundle 模板
      const bundleInstance = await BundleInstance.findById(item.bundleInstance);
      if (bundleInstance && bundleInstance.templateId) {
        await Bundle.findByIdAndUpdate(
          bundleInstance.templateId,
          { $inc: { totalSold: item.quantity } }
        );
      }
    }
  }
};

/**
 * 處理訂單點數獎勵
 */
export const processOrderPointsReward = async (order) => {
  try {
    if (!order.user) {
      return { success: true, message: '無登入用戶，跳過點數給予', pointsAwarded: 0 };
    }

    // 檢查是否已經給予過點數
    const { point: pointService } = await import('../promotion/index.js');
    const existingPoints = await pointService.getUserPoints(order.user, order.brand);
    const alreadyRewarded = existingPoints.some(point =>
      point.sourceModel === 'Order' &&
      point.sourceId && point.sourceId.toString() === order._id.toString()
    );

    if (alreadyRewarded) {
      return { success: true, message: '已經給予過點數，跳過重複給予', pointsAwarded: 0 };
    }

    // 計算點數（基於總金額）
    const { pointRule: pointRuleService } = await import('../promotion/index.js');
    const pointResult = await pointRuleService.calculateOrderPoints(order.brand, order.total);

    if (pointResult.points <= 0) {
      return { success: true, message: '根據點數規則計算得出 0 點數', pointsAwarded: 0 };
    }

    // 給予點數
    const pointInstances = await pointService.addPointsToUser(
      order.user,
      order.brand,
      pointResult.points,
      '滿額贈送',
      { model: 'Order', id: order._id },
      pointResult.rule.validityDays
    );

    return {
      success: true,
      message: `成功給予 ${pointResult.points} 點數`,
      pointsAwarded: pointResult.points,
      pointInstances: pointInstances,
      validityDays: pointResult.rule.validityDays
    };

  } catch (error) {
    console.error('處理點數獎勵時發生錯誤:', {
      orderId: order._id,
      userId: order.user,
      error: error.message
    });

    return {
      success: false,
      message: `點數給予失敗: ${error.message}`,
      pointsAwarded: 0,
      error: error.message
    };
  }
};

/**
 * 支付回調處理 - 支援 Bundle
 */
export const handlePaymentCallback = async (orderId, callbackData) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError('訂單不存在', 404);
  }

  const previousStatus = order.status;

  // 根據支付結果更新訂單狀態
  if (callbackData.success) {
    order.status = 'paid';
  } else {
    order.status = 'unpaid';
  }

  await order.save();

  // 處理付款完成流程（包括生成券和點數）
  let result = { orderId: order._id, status: order.status, processed: true };

  if (callbackData.success && previousStatus !== 'paid') {
    const paymentResult = await processOrderPaymentComplete(order);
    result.pointsAwarded = paymentResult.pointsAwarded;
    result.generatedCoupons = paymentResult.generatedCoupons;
  }

  return result;
};

/**
 * 獲取用戶訂單列表 - 修改 populate
 */
export const getUserOrders = async (userId, options = {}) => {
  const { brandId, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;

  const query = { user: userId };
  if (brandId) query.brand = brandId;

  const skip = (page - 1) * limit;
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const total = await Order.countDocuments(query);

  const orders = await Order.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('items.dishInstance', 'name basePrice options finalPrice')
    .populate('items.bundleInstance', 'name finalPrice')
    .populate('items.generatedCoupons', 'couponName couponType isUsed expiryDate')
    .populate('store', 'name')
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
 * 獲取用戶訂單詳情 - 修改 populate
 */
export const getUserOrderById = async (orderId) => {
  const order = await Order.findOne({ _id: orderId })
    .populate('items.dishInstance', 'name basePrice options finalPrice')
    .populate('items.bundleInstance', 'name finalPrice bundleItems')
    .populate('items.generatedCoupons', 'couponName couponType expiryDate isUsed')
    .populate('store', 'name')
    .lean();

  if (!order) {
    throw new AppError('訂單不存在', 404);
  }

  return order;
};

/**
 * 處理支付
 */
export const processPayment = async (orderId, paymentData) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError('訂單不存在', 404);
  }

  if (order.status === 'cancelled') {
    throw new AppError('已取消的訂單無法支付', 400);
  }

  // 更新支付信息
  if (paymentData.paymentMethod) {
    order.paymentMethod = paymentData.paymentMethod;
  }

  if (paymentData.onlinePaymentCode) {
    order.onlinePaymentCode = paymentData.onlinePaymentCode;
  }

  // 根據支付方式更新訂單狀態
  if (paymentData.paymentMethod === 'cash') {
    order.status = 'unpaid';
  } else {
    order.status = 'unpaid';
  }

  await order.save();

  return {
    orderId: order._id,
    status: order.status,
    paymentMethod: order.paymentMethod,
    total: order.total
  };
};

/**
 * 生成訂單編號
 */
export const generateOrderNumber = async () => {
  try {
    const orderDateCode = generateDateCode();

    const lastOrder = await Order.findOne({
      orderDateCode
    }).sort({ sequence: -1 });

    const sequence = lastOrder ? lastOrder.sequence + 1 : 1;

    return {
      orderDateCode,
      sequence
    };
  } catch (error) {
    console.error('生成訂單編號失敗:', error);
    throw new AppError('生成訂單編號失敗', 500);
  }
};

/**
 * 計算訂單所有金額
 */
export const calculateOrderAmounts = (order) => {
  if (!order || !Array.isArray(order.items)) {
    return {
      dishSubtotal: 0,
      couponSubtotal: 0,
      subtotal: 0,
      serviceCharge: 0,
      deliveryFee: 0,
      totalDiscount: 0,
      manualAdjustment: 0,
      total: 0
    };
  }

  // 分別計算餐點和券的小計
  let dishSubtotal = 0;
  let couponSubtotal = 0;

  order.items.forEach(item => {
    if (item.itemType === 'dish') {
      dishSubtotal += item.subtotal || 0;
    } else if (item.itemType === 'bundle') {
      couponSubtotal += item.subtotal || 0;
    }
  });

  const subtotal = dishSubtotal + couponSubtotal;
  const serviceCharge = Math.round(subtotal * 0);
  const deliveryFee = order.orderType === 'delivery' && order.deliveryInfo ?
    (order.deliveryInfo.deliveryFee || 0) : 0;

  const totalDiscount = Array.isArray(order.discounts) ?
    order.discounts.reduce((total, discount) => total + (discount.amount || 0), 0) : 0;

  const manualAdjustment = order.manualAdjustment || 0;
  const total = Math.max(0, subtotal + serviceCharge + deliveryFee - totalDiscount + manualAdjustment);

  return {
    dishSubtotal,
    couponSubtotal,
    subtotal,
    serviceCharge,
    deliveryFee,
    totalDiscount,
    manualAdjustment,
    total
  };
};

/**
 * 更新訂單金額
 */
export const updateOrderAmounts = (order) => {
  if (!order || !Array.isArray(order.items)) {
    return false;
  }

  const amounts = calculateOrderAmounts(order);

  order.dishSubtotal = amounts.dishSubtotal;
  order.couponSubtotal = amounts.couponSubtotal;
  order.subtotal = amounts.subtotal;
  order.serviceCharge = amounts.serviceCharge;

  if (order.orderType === 'delivery' && order.deliveryInfo) {
    order.deliveryInfo.deliveryFee = amounts.deliveryFee;
  }

  order.totalDiscount = amounts.totalDiscount;
  order.manualAdjustment = amounts.manualAdjustment || 0;
  order.total = amounts.total;

  return true;
};
