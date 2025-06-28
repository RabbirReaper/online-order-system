/**
 * 訂單客戶服務
 * 處理客戶相關的訂單操作（支援 Bundle 購買）
 */

import Order from '../../models/Order/Order.js';
import DishInstance from '../../models/Dish/DishInstance.js';
import BundleInstance from '../../models/Promotion/BundleInstance.js';
import Bundle from '../../models/Promotion/Bundle.js';
import VoucherInstance from '../../models/Promotion/VoucherInstance.js';
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
    let bundleSubtotal = 0;

    for (const item of orderData.items) {
      if (item.itemType === 'dish') {
        // 處理餐點項目
        const dishItem = await createDishItem(item, orderData.brand);
        items.push(dishItem);
        dishSubtotal += dishItem.subtotal;
      } else if (item.itemType === 'bundle') {
        // 處理 Bundle 項目 - 購買的是 Bundle，不是 Voucher
        const bundleItem = await createBundleItem(item, orderData.user, orderData.store, orderData.brand);
        items.push(bundleItem);
        bundleSubtotal += bundleItem.subtotal;
      }
    }

    // 更新訂單數據
    orderData.items = items;
    orderData.dishSubtotal = dishSubtotal;
    orderData.bundleSubtotal = bundleSubtotal;

    // 創建並保存訂單
    const order = new Order(orderData);

    // 確保訂單金額計算正確
    updateOrderAmounts(order);

    // 先保存訂單以獲得 _id
    await order.save();

    // 扣除餐點庫存（只有啟用庫存管理的項目才會被扣除）
    await inventoryService.reduceInventoryForOrder(order);

    // 如果是即時付款，處理後續流程
    let result = { ...order.toObject(), pointsAwarded: 0, generatedVouchers: [] };

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
 * 創建 Bundle 項目 - 購買的是 Bundle 包裝
 */
const createBundleItem = async (item, userId, storeId, brandId) => {
  // 驗證 Bundle 購買資格
  await bundleService.validateBundlePurchase(
    item.bundleId || item.templateId,
    userId,
    item.quantity,
    storeId
  );

  // 創建 Bundle 實例 - 記錄購買的 Bundle
  const bundleInstanceData = {
    templateId: item.bundleId || item.templateId,
    brand: brandId,
    purchasedAt: new Date()
  };

  const bundleInstance = await bundleInstanceService.createInstance(bundleInstanceData);

  return {
    itemType: 'bundle',
    itemName: item.name || bundleInstance.name,
    bundle: bundleInstance._id, // 記錄購買的 Bundle 實例
    quantity: item.quantity,
    subtotal: item.subtotal || (bundleInstance.finalPrice * item.quantity),
    note: item.note || '',
    generatedVouchers: [] // 付款完成後才生成 Voucher
  };
};

/**
 * 處理訂單付款完成後的流程
 */
export const processOrderPaymentComplete = async (order) => {
  let pointsReward = { pointsAwarded: 0 };
  let generatedVouchers = [];

  // 1. 拆解 Bundle 生成 VoucherInstance 給用戶
  for (const item of order.items) {
    if (item.itemType === 'bundle') {
      const bundleVouchers = await generateVouchersForBundle(item, order);
      generatedVouchers.push(...bundleVouchers);

      // 更新訂單項目的 generatedVouchers
      item.generatedVouchers = bundleVouchers.map(v => v._id);
    }
  }

  // 2. 更新 Bundle 銷售統計
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
    generatedVouchers
  };
};

/**
 * 拆解 Bundle 生成 VoucherInstance - 付款完成後執行
 */
const generateVouchersForBundle = async (bundleItem, order) => {
  const bundleInstance = await BundleInstance.findById(bundleItem.bundle)
    .populate('bundleItems.voucherTemplate');

  if (!bundleInstance) {
    throw new AppError('Bundle 實例不存在', 404);
  }

  const generatedVouchers = [];

  // 根據購買的 Bundle 數量生成 Voucher
  for (let i = 0; i < bundleItem.quantity; i++) {
    // 拆解 Bundle 中的每個 VoucherTemplate
    for (const bundleVoucherItem of bundleInstance.bundleItems) {
      // 只處理 exchange 類型的兌換券
      if (bundleVoucherItem.voucherTemplate.voucherType === 'exchange') {
        for (let j = 0; j < bundleVoucherItem.quantity; j++) {
          const voucherInstance = new VoucherInstance({
            brand: order.brand,
            template: bundleVoucherItem.voucherTemplate._id,
            voucherName: bundleVoucherItem.voucherTemplate.name,
            voucherType: bundleVoucherItem.voucherTemplate.voucherType,
            user: order.user,
            acquiredAt: new Date(),
            pointsUsed: 0, // Bundle 購買不直接消耗點數
            order: order._id,
            sourceBundle: bundleItem.bundle // 記錄來源 Bundle
          });

          // 設置兌換項目資訊
          if (bundleVoucherItem.voucherTemplate.voucherType === 'exchange') {
            voucherInstance.exchangeItems = bundleVoucherItem.voucherTemplate.exchangeInfo.items;
          }

          // 設置過期日期（購買時間 + Bundle 設定的有效期天數）
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + bundleInstance.voucherValidityDays);
          voucherInstance.expiryDate = expiryDate;

          await voucherInstance.save();
          generatedVouchers.push(voucherInstance);
        }
      }
    }
  }

  return generatedVouchers;
};

/**
 * 更新 Bundle 銷售統計
 */
const updateBundleSalesStats = async (order) => {
  for (const item of order.items) {
    if (item.itemType === 'bundle') {
      const bundleInstance = await BundleInstance.findById(item.bundle);
      if (bundleInstance) {
        await Bundle.findByIdAndUpdate(bundleInstance.templateId, {
          $inc: { totalSold: item.quantity }
        });
      }
    }
  }
};

/**
 * 處理訂單點數獎勵
 */
export const processOrderPointsReward = async (order) => {
  // 這裡應該根據點數規則計算和給予點數
  // 暫時返回基本結構
  return {
    pointsAwarded: 0
  };
};

/**
 * 更新訂單金額
 */
export const updateOrderAmounts = (order) => {
  // 計算總金額
  order.totalAmount = order.dishSubtotal + order.bundleSubtotal + order.manualAdjustment;

  // 確保金額不為負數
  if (order.totalAmount < 0) {
    order.totalAmount = 0;
  }
};

/**
 * 獲取用戶訂單
 */
export const getUserOrders = async (userId, options = {}) => {
  const { page = 1, limit = 20 } = options;

  const skip = (page - 1) * limit;

  const query = { user: userId };
  if (options.status) {
    query.status = options.status;
  }

  const total = await Order.countDocuments(query);

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('store', 'name')
    .populate('items.dishInstance')
    .populate('items.bundle'); // populate Bundle 實例

  const totalPages = Math.ceil(total / limit);

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

/**
 * 根據ID獲取用戶訂單
 */
export const getUserOrderById = async (orderId, userId) => {
  const order = await Order.findOne({
    _id: orderId,
    user: userId
  })
    .populate('store', 'name')
    .populate('items.dishInstance')
    .populate('items.bundle'); // populate Bundle 實例

  if (!order) {
    throw new AppError('訂單不存在或無權訪問', 404);
  }

  return order;
};

/**
 * 生成訂單編號
 */
export const generateOrderNumber = () => {
  const dateCode = generateDateCode();
  const randomPart = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${dateCode}${randomPart}`;
};

/**
 * 計算訂單金額
 */
export const calculateOrderAmounts = (items) => {
  let dishSubtotal = 0;
  let bundleSubtotal = 0;

  items.forEach(item => {
    if (item.itemType === 'dish') {
      dishSubtotal += item.subtotal || 0;
    } else if (item.itemType === 'bundle') {
      bundleSubtotal += item.subtotal || 0;
    }
  });

  return {
    dishSubtotal,
    bundleSubtotal,
    totalAmount: dishSubtotal + bundleSubtotal
  };
};
