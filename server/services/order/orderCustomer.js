/**
 * 訂單客戶服務
 * 處理客戶相關的訂單操作
 */

import Order from '../../models/Order/Order.js';
import DishInstance from '../../models/Dish/DishInstance.js';
import { AppError } from '../../middlewares/error.js';
import * as inventoryService from '../inventory/stockManagement.js';
import { getTaiwanDateTime, formatDateTime, generateDateCode } from '../../utils/date.js';

/**
 * 創建訂單 - 修改版本
 */
export const createOrder = async (orderData) => {
  try {
    // 設置預設手動調整金額
    orderData.manualAdjustment = orderData.manualAdjustment || 0;

    // 創建訂單的餐點實例
    const items = [];
    for (const item of orderData.items) {
      // 建立餐點實例 - 修正參數名稱以符合模型定義
      const dishInstance = new DishInstance({
        brand: orderData.brand,
        templateId: item.templateId, // 對應模型中的 templateId
        name: item.name,
        basePrice: item.basePrice, // 對應模型中的 basePrice
        options: item.options || [],
        finalPrice: item.finalPrice || item.subtotal || (item.basePrice * item.quantity) // 計算最終價格
      });

      // 保存餐點實例
      await dishInstance.save();

      // 將餐點實例ID添加到訂單項目
      items.push({
        dishInstance: dishInstance._id,
        quantity: item.quantity,
        subtotal: item.subtotal || (dishInstance.finalPrice * item.quantity),
        note: item.note || ''
      });
    }

    // 更新訂單數據
    orderData.items = items;

    // 創建並保存訂單
    const order = new Order(orderData);

    // 確保訂單金額計算正確
    updateOrderAmounts(order);

    // 先保存訂單以獲得 _id
    await order.save();

    // 扣除庫存（只有啟用庫存管理的項目才會被扣除）
    await inventoryService.reduceInventoryForOrder(order);

    // 處理點數給予（如果是即時付款）
    let pointsReward = { pointsAwarded: 0 };
    if (order.status === 'paid' && order.user) {
      pointsReward = await processOrderPointsReward(order);
    }

    // 返回訂單和點數獎勵資訊
    return {
      ...order.toObject(),
      pointsAwarded: pointsReward.pointsAwarded
    };

  } catch (error) {
    console.error('創建訂單錯誤:', error);
    throw error;
  }
};

/**
 * 處理訂單點數獎勵
 * @param {Object} order - 訂單對象
 * @returns {Promise<Object>} 點數獎勵結果
 */
const processOrderPointsReward = async (order) => {
  try {
    // 1. 檢查用戶是否登入
    if (!order.user) {
      return {
        success: true,
        message: '無登入用戶，跳過點數給予',
        pointsAwarded: 0
      };
    }

    // 2. 檢查是否已經給予過點數（防重複）
    const { point: pointService } = await import('../promotion/index.js');
    const existingPoints = await pointService.getUserPoints(order.user, order.brand);
    const alreadyRewarded = existingPoints.some(point =>
      point.sourceModel === 'Order' &&
      point.sourceId && point.sourceId.toString() === order._id.toString()
    );

    if (alreadyRewarded) {
      return {
        success: true,
        message: '已經給予過點數，跳過重複給予',
        pointsAwarded: 0
      };
    }

    // 3. 計算要給予的點數和獲取規則資訊
    const { pointRule: pointRuleService } = await import('../promotion/index.js');
    const pointResult = await pointRuleService.calculateOrderPoints(order.brand, order.total);

    if (pointResult.points <= 0) {
      return {
        success: true,
        message: '根據點數規則計算得出 0 點數',
        pointsAwarded: 0
      };
    }

    // 4. 給予點數給用戶，使用規則中的有效期
    const pointInstances = await pointService.addPointsToUser(
      order.user,
      order.brand,
      pointResult.points,
      '滿額贈送',
      { model: 'Order', id: order._id },
      pointResult.rule.validityDays // 傳遞規則物件，函數內部會使用 rule.validityDays
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
      error: error.message,
      stack: error.stack
    });

    // 不拋出異常，避免影響主流程
    return {
      success: false,
      message: `點數給予失敗: ${error.message}`,
      pointsAwarded: 0,
      error: error.message
    };
  }
};

export { processOrderPointsReward }; //為了在`orderAdmin.js`中使用

/**
 * 支付回調處理 - 修改版本
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

  // 處理點數給予（狀態從非paid變為paid時）
  let pointsReward = { pointsAwarded: 0 };
  if (callbackData.success && previousStatus !== 'paid' && order.user) {
    pointsReward = await processOrderPointsReward(order);
  }

  return {
    orderId: order._id,
    status: order.status,
    processed: true,
    pointsAwarded: pointsReward.pointsAwarded
  };
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
    .populate('items.dishInstance', 'name basePrice options finalPrice')
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
export const getUserOrderById = async (orderId) => {
  const order = await Order.findOne({ _id: orderId })
    .populate('items.dishInstance', 'name basePrice options finalPrice')
    .populate('store', 'name')
    .lean();

  if (!order) {
    throw new AppError('訂單不存在', 404);
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
    order.status = 'unpaid'; // 現金付款，等待確認
  } else {
    order.status = 'unpaid'; // 線上支付也先設為pending，等待回調確認
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
 * 生成訂單編號 - 使用增強的日期工具
 * @returns {Promise<Object>} 訂單編號信息
 */
export const generateOrderNumber = async () => {
  try {
    // 使用統一的日期代碼生成函數
    const orderDateCode = generateDateCode();

    // 獲取當天的最後一個序號
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

  // 計算服務費 (預設0%)
  const serviceCharge = Math.round(subtotal * 0);

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
