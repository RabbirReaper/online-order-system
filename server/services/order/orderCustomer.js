/**
 * 訂單客戶服務
 * 處理客戶相關的訂單操作
 */

import Order from '../../models/Order/Order.js';
import DishInstance from '../../models/Dish/DishInstance.js';
import { AppError } from '../../middlewares/error.js';
import * as inventoryService from '../inventory/stockManagement.js';
import { getTaiwanDateTime, formatDateTime } from '../../utils/date.js';

/**
 * 創建訂單
 * @param {Object} orderData - 訂單數據
 * @returns {Promise<Object>} 創建的訂單
 */
export const createOrder = async (orderData) => {
  try {
    // 設置預設手動調整金額
    orderData.manualAdjustment = orderData.manualAdjustment || 0;

    // 創建訂單的餐點實例
    const items = [];
    for (const item of orderData.items) {
      // 建立餐點實例
      const dishInstance = new DishInstance({
        templateId: item.templateId,
        name: item.name,
        price: item.price,
        options: item.options || [],
        specialInstructions: item.specialInstructions || ''
      });

      // 保存餐點實例
      await dishInstance.save();

      // 將餐點實例ID添加到訂單項目
      items.push({
        dishInstance: dishInstance._id,
        quantity: item.quantity,
        subtotal: item.subtotal,
        note: item.note || ''
      });
    }

    // 更新訂單數據
    orderData.items = items;

    // 創建並保存訂單
    const order = new Order(orderData);

    // 確保訂單金額計算正確
    updateOrderAmounts(order);

    // 扣除庫存
    await inventoryService.reduceInventoryForOrder(order);

    await order.save();
    return order;
  } catch (error) {
    console.error('創建訂單錯誤:', error);
    throw error;
  }
};

/**
 * 獲取用戶訂單列表
 * @param {String} userId - 用戶ID
 * @param {Object} options - 查詢選項
 * @returns {Promise<Object>} 訂單列表和分頁信息
 */
export const getUserOrders = async (userId, options = {}) => {
  const { brandId, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;

  // 構建查詢條件
  const query = { user: userId };
  if (brandId) query.brand = brandId;

  // 計算分頁
  const skip = (page - 1) * limit;

  // 構建排序
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // 獲取總數
  const total = await Order.countDocuments(query);

  // 查詢訂單
  const orders = await Order.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('items.dishInstance', 'name price options')
    .populate('store', 'name')
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
 * 獲取用戶訂單詳情
 * @param {String} orderId - 訂單ID
 * @param {String} userId - 用戶ID
 * @returns {Promise<Object>} 訂單詳情
 */
export const getUserOrderById = async (orderId, userId) => {
  const order = await Order.findOne({ _id: orderId, user: userId })
    .populate('items.dishInstance', 'name price options')
    .populate('store', 'name')
    .lean();

  if (!order) {
    throw new AppError('訂單不存在', 404);
  }

  return order;
};

/**
 * 用戶取消訂單
 * @param {String} orderId - 訂單ID
 * @param {String} userId - 用戶ID
 * @param {String} reason - 取消原因
 * @returns {Promise<Object>} 更新後的訂單
 */
export const cancelUserOrder = async (orderId, userId, reason) => {
  const order = await Order.findOne({ _id: orderId, user: userId });

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
  order.cancelledBy = userId;
  order.cancelledByModel = 'User';
  order.cancelledAt = getTaiwanDateTime().toJSDate();

  await order.save();
  return order;
};

/**
 * 獲取訪客訂單詳情
 * @param {String} orderId - 訂單ID
 * @param {String} phone - 電話號碼
 * @param {String} orderNumber - 訂單編號
 * @returns {Promise<Object>} 訂單詳情
 */
export const getGuestOrderById = async (orderId, phone, orderNumber) => {
  const order = await Order.findById(orderId)
    .populate('items.dishInstance', 'name price options')
    .populate('store', 'name')
    .lean();

  if (!order) {
    throw new AppError('訂單不存在', 404);
  }

  // 驗證訪客信息
  if (!order.customerInfo ||
    order.customerInfo.phone !== phone ||
    `${order.orderDateCode}${order.sequence}` !== orderNumber) {
    throw new AppError('驗證資訊不正確', 403);
  }

  return order;
};

/**
 * 處理支付
 * @param {String} orderId - 訂單ID
 * @param {Object} paymentData - 支付資料
 * @returns {Promise<Object>} 支付結果
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
    order.status = 'pending'; // 現金付款，等待確認
  } else {
    order.status = 'pending'; // 線上支付也先設為pending，等待回調確認
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
 * 支付回調處理
 * @param {String} orderId - 訂單ID
 * @param {Object} callbackData - 回調資料
 * @returns {Promise<Object>} 處理結果
 */
export const handlePaymentCallback = async (orderId, callbackData) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError('訂單不存在', 404);
  }

  // 根據支付結果更新訂單狀態
  if (callbackData.success) {
    order.status = 'confirmed';
  } else {
    order.status = 'pending';
  }

  await order.save();

  return {
    orderId: order._id,
    status: order.status,
    processed: true
  };
};

/**
 * 生成訂單編號
 * @returns {Promise<Object>} 訂單編號信息
 */
export const generateOrderNumber = async () => {
  const today = getTaiwanDateTime();
  const year = today.year.toString().slice(-2);
  const month = String(today.month).padStart(2, '0');
  const day = String(today.day).padStart(2, '0');
  const orderDateCode = `${year}${month}${day}`;

  // 獲取當天的最後一個序號
  const lastOrder = await Order.findOne({
    orderDateCode
  }).sort({ sequence: -1 });

  const sequence = lastOrder ? lastOrder.sequence + 1 : 1;

  return {
    orderDateCode,
    sequence
  };
};

/**
 * 計算訂單所有金額
 * @param {Object} order - 訂單對象或訂單數據
 * @returns {Object} 包含所有計算結果的對象
 */
export const calculateOrderAmounts = (order) => {
  // 防止空訂單
  if (!order || !Array.isArray(order.items)) {
    return {
      subtotal: 0,
      serviceCharge: 0,
      deliveryFee: 0,
      totalDiscount: 0,
      manualAdjustment: 0,
      total: 0
    };
  }

  // 計算訂單小計
  const subtotal = order.items.reduce((total, item) => {
    if (!item || typeof item.subtotal !== 'number' || typeof item.quantity !== 'number') {
      return total;
    }
    return total + item.subtotal;
  }, 0);

  // 計算服務費 (預設10%)
  const serviceCharge = Math.round(subtotal * 0.1);

  // 計算外送費
  const deliveryFee = order.orderType === 'delivery' && order.deliveryInfo ?
    (order.deliveryInfo.deliveryFee || 0) : 0;

  // 計算折扣總額
  const totalDiscount = Array.isArray(order.discounts) ?
    order.discounts.reduce((total, discount) => {
      if (!discount || typeof discount.amount !== 'number') {
        return total;
      }
      return total + discount.amount;
    }, 0) : 0;

  // 獲取手動調整金額
  const manualAdjustment = order.manualAdjustment || 0;

  // 計算最終總額
  const total = Math.max(0, subtotal + serviceCharge + deliveryFee - totalDiscount + manualAdjustment);

  return {
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
 * @param {Object} order - Order 模型實例
 * @returns {Boolean} 更新是否成功
 */
export const updateOrderAmounts = (order) => {
  // 確保是有效的訂單對象
  if (!order || !Array.isArray(order.items)) {
    return false;
  }

  // 計算所有金額
  const { subtotal, serviceCharge, deliveryFee, totalDiscount, manualAdjustment, total } = calculateOrderAmounts(order);

  // 更新訂單對象
  order.subtotal = subtotal;
  order.serviceCharge = serviceCharge;

  // 如果是外送訂單，更新運費
  if (order.orderType === 'delivery' && order.deliveryInfo) {
    order.deliveryInfo.deliveryFee = deliveryFee;
  }

  order.totalDiscount = totalDiscount;
  order.manualAdjustment = manualAdjustment || 0;
  order.total = total;

  return true;
};
