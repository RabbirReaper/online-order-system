/**
 * 訂單核心服務
 * 處理訂單基本操作和計算
 */

import Order from '../../models/Order/Order.js';
import DishInstance from '../../models/Dish/DishInstance.js';
import { AppError } from '../../middlewares/error.js';
import * as inventoryService from '../inventory/stockManagement.js';

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
        subtotal: item.subtotal
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
 * 獲取訂單詳情
 * @param {String} orderId - 訂單ID
 * @param {Object} options - 查詢選項
 * @returns {Promise<Object>} 訂單詳情
 */
export const getOrderById = async (orderId, options = {}) => {
  const { storeId, populateItems = true, populateUser = false } = options;

  const query = { _id: orderId };
  if (storeId) query.store = storeId;

  const populateOptions = [];

  if (populateItems) {
    populateOptions.push({ path: 'items.dishInstance', select: 'name price options' });
  }

  if (populateUser) {
    populateOptions.push({ path: 'user', select: 'name email phone' });
  }

  const order = await Order.findOne(query)
    .populate(populateOptions)
    .lean();

  if (!order) {
    throw new AppError('訂單不存在', 404);
  }

  return order;
};

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
      query.createdAt.$gte = fromDate;
    }

    if (toDate) {
      query.createdAt.$lte = toDate;
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
 * 驗證訂單所有權
 * @param {String} orderId - 訂單ID
 * @param {String} userId - 用戶ID
 * @returns {Promise<Boolean>} 是否是訂單擁有者
 */
export const verifyOrderOwnership = async (orderId, userId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError('訂單不存在', 404);
  }

  return order.user && order.user.toString() === userId;
};

/**
 * 獲取用戶訂單詳情
 * @param {String} orderId - 訂單ID
 * @returns {Promise<Object>} 訂單詳情
 */
export const getUserOrderById = async (orderId) => {
  const order = await Order.findById(orderId)
    .populate('items.dishInstance', 'name price options')
    .populate('store', 'name')
    .lean();

  if (!order) {
    throw new AppError('訂單不存在', 404);
  }

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
