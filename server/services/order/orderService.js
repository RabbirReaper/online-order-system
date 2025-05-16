/**
 * 訂單基本操作服務
 * 處理訂單創建、查詢等基本操作
 */

import Order from '../../models/Order/Order.js';
import DishInstance from '../../models/Dish/DishInstance.js';
import { AppError } from '../../middlewares/error.js';
import * as inventoryService from '../inventory/stockManagement.js';
import * as calculateService from './calculateOrder.js';

/**
 * 創建訂單
 * @param {Object} orderData - 訂單數據
 * @returns {Promise<Object>} 創建的訂單
 */
export const createOrder = async (orderData) => {
  try {
    // 如果沒有 manualAdjustment，設為 0
    if (orderData.manualAdjustment === undefined) {
      orderData.manualAdjustment = 0;
    }

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
    calculateService.updateOrderAmounts(order);

    // 如果是登入用戶，處理點數
    if (order.user) {
      // 這裡可以添加點數處理邏輯
    }

    // 扣除庫存
    await inventoryService.reduceInventoryForOrder(order);

    await order.save();
    return order;
  } catch (error) {
    console.error('創建訂單錯誤:', error);

    // 確保在失敗時回滾資源
    if (error.resourcesCreated && error.resourcesCreated.length > 0) {
      // 這裡可以添加資源回滾的邏輯
    }

    throw error;
  }
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
 * 獲取訂單詳情
 * @param {String} storeId - 店鋪ID
 * @param {String} orderId - 訂單ID
 * @returns {Promise<Object>} 訂單詳情
 */
export const getOrderById = async (storeId, orderId) => {
  const order = await Order.findOne({ _id: orderId, store: storeId })
    .populate('items.dishInstance', 'name price options')
    .populate('user', 'name email phone')
    .lean();

  if (!order) {
    throw new AppError('訂單不存在', 404);
  }

  return order;
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
 * 處理支付
 * @param {String} orderId - 訂單ID
 * @param {Object} paymentData - 支付數據
 * @returns {Promise<Object>} 支付結果
 */
export const processPayment = async (orderId, paymentData) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError('訂單不存在', 404);
  }

  // 根據支付方式處理
  switch (paymentData.method) {
    case 'cash':
      // 現金支付處理
      order.paymentMethod = 'cash';
      break;
    case 'credit_card':
      // 信用卡支付處理
      order.paymentMethod = 'credit_card';
      break;
    case 'line_pay':
      // LINE Pay 支付處理
      order.paymentMethod = 'line_pay';
      order.onlinePaymentCode = paymentData.paymentCode || '';
      break;
    default:
      order.paymentMethod = 'other';
  }

  await order.save();

  return {
    success: true,
    orderId: order._id,
    paymentMethod: order.paymentMethod
  };
};

/**
 * 處理支付回調
 * @param {String} orderId - 訂單ID
 * @param {Object} callbackData - 回調數據
 * @returns {Promise<Object>} 處理結果
 */
export const handlePaymentCallback = async (orderId, callbackData) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError('訂單不存在', 404);
  }

  // 處理支付結果
  if (callbackData.status === 'success') {
    // 支付成功
    order.status = 'confirmed';
  } else {
    // 支付失敗
    // 這裡可以添加處理邏輯
  }

  await order.save();

  return {
    success: true,
    orderId: order._id,
    status: order.status
  };
};
