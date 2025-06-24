/**
 * 訂單客戶服務 - 完整版
 * 處理客戶相關的訂單操作（支援 Bundle 購買 + 混合購買）
 */

import Order from '../../models/Order/Order.js';
import DishInstance from '../../models/Dish/DishInstance.js';
import BundleInstance from '../../models/Dish/BundleInstance.js';
import Bundle from '../../models/Dish/Bundle.js';
import CouponInstance from '../../models/Promotion/CouponInstance.js';
import { AppError } from '../../middlewares/error.js';
import * as inventoryService from '../inventory/stockManagement.js';
import * as bundleService from '../bundle/bundleService.js';
import * as bundleInstanceService from '../bundle/bundleInstance.js';
import * as pointService from '../promotion/pointService.js';
import * as pointRuleService from '../promotion/pointRuleService.js';
import { getTaiwanDateTime, formatDateTime, generateDateCode } from '../../utils/date.js';

/**
 * 創建訂單 - 支援 Bundle 購買 + 預先庫存檢查
 */
export const createOrder = async (orderData) => {
  try {
    console.log('Creating order with mixed purchase support...');

    // 設置預設手動調整金額
    orderData.manualAdjustment = orderData.manualAdjustment || 0;
    orderData.serviceCharge = orderData.serviceCharge || 0;
    orderData.discounts = orderData.discounts || [];

    // 🔍 Step 1: 預先檢查所有餐點庫存 (不實際扣除)
    await validateInventoryBeforeOrder(orderData);

    // 🔍 Step 2: 預先檢查 Bundle 購買資格
    await validateBundlesBeforeOrder(orderData);

    // Step 3: 處理訂單項目
    const items = [];
    let dishSubtotal = 0;
    let couponSubtotal = 0;

    for (const item of orderData.items) {
      if (item.itemType === 'dish') {
        console.log(`Processing dish: ${item.name}`);
        const dishItem = await createDishItem(item, orderData.brand);
        items.push(dishItem);
        dishSubtotal += dishItem.subtotal;
      } else if (item.itemType === 'bundle') {
        console.log(`Processing bundle: ${item.name}`);
        const bundleItem = await createBundleItem(item, orderData.user, orderData.store, orderData.brand);
        items.push(bundleItem);
        couponSubtotal += bundleItem.subtotal;
      }
    }

    // Step 4: 更新訂單數據
    orderData.items = items;
    orderData.dishSubtotal = dishSubtotal;
    orderData.couponSubtotal = couponSubtotal;

    // Step 5: 創建並保存訂單
    const order = new Order(orderData);
    updateOrderAmounts(order);
    await order.save();

    console.log(`Order created: dishes $${dishSubtotal} + coupons $${couponSubtotal} = total $${order.total}`);

    // Step 6: 實際扣除庫存 (這時應該不會失敗，因為已經預檢查過)
    try {
      await inventoryService.reduceInventoryForOrder(order);
    } catch (inventoryError) {
      console.error('Inventory reduction failed after pre-validation:', inventoryError);
      await cleanupFailedOrder(order._id, items);
      throw new AppError('Inventory reduction failed, please retry order', 400);
    }

    // Step 7: 如果是即時付款，處理後續流程
    let result = { ...order.toObject(), pointsAwarded: 0, generatedCoupons: [] };

    if (order.status === 'paid') {
      console.log('Processing immediate payment completion...');
      result = await processOrderPaymentComplete(order);
    }

    return result;

  } catch (error) {
    console.error('Failed to create order:', error);
    throw error;
  }
};

/**
 * 🔍 預先檢查所有餐點庫存
 */
const validateInventoryBeforeOrder = async (orderData) => {
  const dishItems = orderData.items.filter(item => item.itemType === 'dish');

  if (dishItems.length === 0) {
    return; // 沒有餐點項目，跳過檢查
  }

  console.log(`Validating inventory for ${dishItems.length} dish items...`);

  for (const item of dishItems) {
    try {
      // 根據餐點模板ID查找庫存
      const inventoryItem = await inventoryService.getInventoryItemByDishTemplate(
        orderData.store,
        item.templateId
      );

      // 如果沒有庫存記錄，跳過檢查
      if (!inventoryItem) {
        console.log(`Dish ${item.name} has no inventory record, skipping check`);
        continue;
      }

      // 如果沒有啟用庫存追蹤，跳過檢查
      if (!inventoryItem.isInventoryTracked) {
        console.log(`Dish ${item.name} inventory tracking disabled, skipping check`);
        continue;
      }

      // 檢查是否手動設為售完
      if (inventoryItem.isSoldOut) {
        throw new AppError(`很抱歉，${item.name} 目前已售完`, 400);
      }

      // 計算有效庫存
      const effectiveStock = inventoryItem.enableAvailableStock
        ? inventoryItem.availableStock
        : inventoryItem.totalStock;

      // 檢查庫存是否足夠
      if (effectiveStock < item.quantity) {
        throw new AppError(
          `很抱歉，${item.name} 庫存不足。需要：${item.quantity}，剩餘：${effectiveStock}`,
          400
        );
      }

      console.log(`✅ ${item.name} inventory check passed (need: ${item.quantity}, available: ${effectiveStock})`);

    } catch (error) {
      if (error instanceof AppError) {
        throw error; // 重新拋出業務邏輯錯誤
      } else {
        console.error(`Error checking inventory for ${item.name}:`, error);
        throw new AppError(`檢查 ${item.name} 庫存時發生錯誤`, 500);
      }
    }
  }

  console.log('✅ All dish inventory validation passed');
};

/**
 * 🔍 預先檢查 Bundle 購買資格
 */
const validateBundlesBeforeOrder = async (orderData) => {
  const bundleItems = orderData.items.filter(item => item.itemType === 'bundle');

  if (bundleItems.length === 0) {
    return; // 沒有Bundle項目，跳過檢查
  }

  console.log(`Validating bundle purchase eligibility for ${bundleItems.length} bundle items...`);

  for (const item of bundleItems) {
    try {
      await bundleService.validateBundlePurchase(
        item.bundleId || item.templateId,
        orderData.user,
        item.quantity,
        orderData.store
      );

      console.log(`✅ Bundle ${item.name} purchase eligibility check passed`);
    } catch (error) {
      console.error(`Bundle ${item.name} purchase eligibility check failed:`, error);
      throw error; // 直接拋出，因為 bundleService 已經包裝了適當的錯誤訊息
    }
  }

  console.log('✅ All bundle purchase eligibility validation passed');
};

/**
 * 🧹 清理失敗訂單 (當預檢查通過但後續步驟失敗時)
 */
const cleanupFailedOrder = async (orderId, items) => {
  try {
    console.log('Cleaning up failed order data...');

    // 刪除已創建的實例
    const dishInstanceIds = items
      .filter(item => item.itemType === 'dish')
      .map(item => item.dishInstance);

    const bundleInstanceIds = items
      .filter(item => item.itemType === 'bundle')
      .map(item => item.bundleInstance);

    if (dishInstanceIds.length > 0) {
      await DishInstance.deleteMany({ _id: { $in: dishInstanceIds } });
      console.log(`Cleaned up ${dishInstanceIds.length} dish instances`);
    }

    if (bundleInstanceIds.length > 0) {
      await BundleInstance.deleteMany({ _id: { $in: bundleInstanceIds } });
      console.log(`Cleaned up ${bundleInstanceIds.length} bundle instances`);
    }

    // 刪除訂單
    if (orderId) {
      await Order.findByIdAndDelete(orderId);
      console.log('Cleaned up failed order');
    }

    console.log('✅ Failed order cleanup completed');
  } catch (cleanupError) {
    console.error('❌ Error cleaning up failed order data:', cleanupError);
    // 不拋出錯誤，避免影響主要的錯誤處理
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
 * 創建 Bundle 項目 (移除重複驗證，因為已經預檢查過)
 */
const createBundleItem = async (item, userId, storeId, brandId) => {
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
    generatedCoupons: []
  };
};

/**
 * 🧮 更新訂單金額 (支援混合購買)
 */
export const updateOrderAmounts = (order) => {
  console.log('Updating order amounts...');

  // Step 1: 計算小計 (dishes + coupons)
  order.subtotal = order.dishSubtotal + order.couponSubtotal;

  // Step 2: 確保服務費存在
  if (!order.serviceCharge) {
    order.serviceCharge = 0;
  }

  // Step 3: 計算總折扣
  order.totalDiscount = order.discounts.reduce((sum, discount) => sum + discount.amount, 0);

  // Step 4: 計算最終總額
  order.total = order.subtotal + order.serviceCharge - order.totalDiscount + order.manualAdjustment;

  console.log(`Order amounts updated:`);
  console.log(`   - Dish subtotal: $${order.dishSubtotal}`);
  console.log(`   - Coupon subtotal: $${order.couponSubtotal}`);
  console.log(`   - Subtotal: $${order.subtotal}`);
  console.log(`   - Service charge: $${order.serviceCharge}`);
  console.log(`   - Total discount: $${order.totalDiscount}`);
  console.log(`   - Manual adjustment: $${order.manualAdjustment}`);
  console.log(`   - Final total: $${order.total}`);

  return order;
};

/**
 * 🧮 計算訂單金額 (工具函數)
 */
export const calculateOrderAmounts = (order) => {
  const subtotal = order.dishSubtotal + order.couponSubtotal;
  const totalDiscount = order.discounts.reduce((sum, discount) => sum + discount.amount, 0);
  const total = subtotal + order.serviceCharge - totalDiscount + order.manualAdjustment;

  return {
    subtotal,
    totalDiscount,
    total
  };
};

/**
 * 處理訂單付款完成後的流程
 */
export const processOrderPaymentComplete = async (order) => {
  let pointsReward = { pointsAwarded: 0 };
  let generatedCoupons = [];

  console.log(`Processing payment completion for order ${order._id}...`);

  try {
    // 1. 生成 Bundle 的兌換券
    for (const item of order.items) {
      if (item.itemType === 'bundle') {
        console.log(`Generating coupons for bundle: ${item.itemName}`);
        const bundleCoupons = await generateCouponsForBundle(item, order);
        generatedCoupons.push(...bundleCoupons);

        // 更新訂單項目的 generatedCoupons
        item.generatedCoupons = bundleCoupons.map(c => c._id);
      }
    }

    // 2. 更新 Bundle 銷售統計
    await updateBundleSalesStats(order);

    // 3. 處理點數給予
    if (order.user) {
      console.log('Processing points reward...');
      pointsReward = await processOrderPointsReward(order);
    }

    // 4. 保存訂單更新
    await order.save();

    console.log(`✅ Payment completion processed:`);
    console.log(`   - Generated coupons: ${generatedCoupons.length}`);
    console.log(`   - Points awarded: ${pointsReward.pointsAwarded}`);

    return {
      ...order.toObject(),
      pointsAwarded: pointsReward.pointsAwarded,
      generatedCoupons
    };

  } catch (error) {
    console.error('Failed to process payment completion:', error);
    throw error;
  }
};

/**
 * 🎊 處理訂單點數獎勵 (支援混合購買)
 */
export const processOrderPointsReward = async (order) => {
  try {
    console.log(`Processing points reward for order ${order._id}`);

    // 🎯 關鍵：使用 total 作為點數計算基礎 (包含餐點和預購券)
    const pointsCalculation = await pointRuleService.calculateOrderPoints(
      order.brand,
      order.total // 使用訂單總額，包含 dishSubtotal + couponSubtotal
    );

    if (!pointsCalculation || pointsCalculation.points === 0) {
      console.log('No points awarded - rule not met or no active rules');
      return { pointsAwarded: 0 };
    }

    // 更新訂單中的點數相關資訊
    order.pointsEarned = pointsCalculation.points;
    order.pointsCalculationBase = order.total; // 🔥 記錄用於計算的金額
    order.pointsRule = {
      ruleId: pointsCalculation.rule._id,
      ruleName: pointsCalculation.rule.name,
      conversionRate: pointsCalculation.rule.conversionRate,
      minimumAmount: pointsCalculation.rule.minimumAmount
    };

    // 給用戶發放點數
    const sourceInfo = {
      model: 'Order',
      id: order._id
    };

    await pointService.addPointsToUser(
      order.user,
      order.brand,
      pointsCalculation.points,
      'order_purchase', // 來源：訂單購買
      sourceInfo,
      pointsCalculation.rule.validityDays || 365
    );

    console.log(`✅ Awarded ${pointsCalculation.points} points to user ${order.user}`);
    console.log(`💰 Calculation base: $${order.total} (dishes: $${order.dishSubtotal}, coupons: $${order.couponSubtotal})`);

    return {
      pointsAwarded: pointsCalculation.points,
      calculationBase: order.total,
      rule: pointsCalculation.rule
    };

  } catch (error) {
    console.error('Failed to process order points reward:', error);
    // 不拋出錯誤，避免影響訂單主流程
    return { pointsAwarded: 0 };
  }
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

  console.log(`Generating coupons for bundle: ${bundleInstance.name} (qty: ${bundleItem.quantity})`);

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

        console.log(`Generated coupon: ${bundleCouponItem.couponTemplate.name}`);
      }
    }
  }

  console.log(`✅ Generated ${generatedCoupons.length} coupons total`);
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
        console.log(`Updated sales stats for bundle: ${bundleInstance.name} (+${item.quantity})`);
      }
    }
  }
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
    .populate('store', 'name address')
    .populate('brand', 'name')
    .populate('items.dishInstance', 'name finalPrice options')
    .populate('items.bundleInstance', 'name finalPrice')
    .populate('items.generatedCoupons', 'couponName couponType isUsed expiryDate')
    .sort(sort)
    .skip(skip)
    .limit(limit);

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
 * 獲取用戶單個訂單詳情
 */
export const getUserOrderById = async (userId, orderId) => {
  const order = await Order.findOne({ _id: orderId, user: userId })
    .populate('store', 'name address')
    .populate('brand', 'name')
    .populate('items.dishInstance', 'name finalPrice options')
    .populate('items.bundleInstance', 'name finalPrice bundleItems')
    .populate('items.generatedCoupons', 'couponName couponType isUsed expiryDate');

  if (!order) {
    throw new AppError('訂單不存在或無權訪問', 404);
  }

  return order;
};

/**
 * 生成訂單編號
 */
export const generateOrderNumber = (orderDateCode, sequence) => {
  return `${orderDateCode}${sequence.toString().padStart(3, '0')}`;
};

/**
 * 處理支付
 */
export const processPayment = async (orderId, paymentData) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError('訂單不存在', 404);
  }

  if (order.status === 'paid') {
    throw new AppError('訂單已付款', 400);
  }

  // 更新支付資訊
  order.status = 'paid';
  order.paymentType = paymentData.paymentType;
  order.paymentMethod = paymentData.paymentMethod;

  await order.save();

  // 處理付款完成後的流程
  const result = await processOrderPaymentComplete(order);

  return result;
};

/**
 * 處理支付回調
 */
export const handlePaymentCallback = async (paymentData) => {
  // 根據支付平台的回調數據處理邏輯
  const { orderId, status, transactionId } = paymentData;

  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError('訂單不存在', 404);
  }

  if (status === 'success') {
    order.status = 'paid';
    order.transactionId = transactionId;
    await order.save();

    // 處理付款完成後的流程
    return await processOrderPaymentComplete(order);
  } else {
    order.status = 'cancelled';
    await order.save();
    return order;
  }
};
