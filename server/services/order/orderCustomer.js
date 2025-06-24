/**
 * 訂單客戶服務 - 修改後支援 BundleInstance
 * 處理客戶相關的訂單操作（支援 Bundle 購買）
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
import { getTaiwanDateTime, formatDateTime, generateDateCode } from '../../utils/date.js';

/**
 * 創建訂單 - 支援 Bundle 購買 + 預先庫存檢查
 */
export const createOrder = async (orderData) => {
  try {
    // 設置預設手動調整金額
    orderData.manualAdjustment = orderData.manualAdjustment || 0;

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
        // 處理餐點項目
        const dishItem = await createDishItem(item, orderData.brand);
        items.push(dishItem);
        dishSubtotal += dishItem.subtotal;
      } else if (item.itemType === 'bundle') {
        // 處理 Bundle 項目
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

    // Step 6: 實際扣除庫存 (這時應該不會失敗，因為已經預檢查過)
    try {
      await inventoryService.reduceInventoryForOrder(order);
    } catch (inventoryError) {
      console.error('預檢查通過但實際扣庫存失敗，可能是併發問題:', inventoryError);
      // 這種情況很少見，但如果發生了，我們需要清理
      await cleanupFailedOrder(order._id, items);
      throw new AppError('庫存扣除失敗，請重新下單', 400);
    }

    // Step 7: 如果是即時付款，處理後續流程
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
 * 🔍 預先檢查所有餐點庫存
 */
const validateInventoryBeforeOrder = async (orderData) => {
  const dishItems = orderData.items.filter(item => item.itemType === 'dish');

  if (dishItems.length === 0) {
    return; // 沒有餐點項目，跳過檢查
  }

  // console.log(`開始預檢查 ${dishItems.length} 個餐點項目的庫存...`);

  for (const item of dishItems) {
    try {
      // 根據餐點模板ID查找庫存
      const inventoryItem = await inventoryService.getInventoryItemByDishTemplate(
        orderData.store,
        item.templateId
      );

      // 如果沒有庫存記錄，跳過檢查
      if (!inventoryItem) {
        // console.log(`餐點 ${item.name} 沒有庫存記錄，跳過檢查`);
        continue;
      }

      // 如果沒有啟用庫存追蹤，跳過檢查
      if (!inventoryItem.isInventoryTracked) {
        // console.log(`餐點 ${item.name} 未啟用庫存追蹤，跳過檢查`);
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

      // console.log(`✅ ${item.name} 庫存檢查通過 (需要: ${item.quantity}, 剩餘: ${effectiveStock})`);

    } catch (error) {
      if (error instanceof AppError) {
        throw error; // 重新拋出業務邏輯錯誤
      } else {
        console.error(`檢查餐點 ${item.name} 庫存時發生錯誤:`, error);
        throw new AppError(`檢查 ${item.name} 庫存時發生錯誤`, 500);
      }
    }
  }

  // console.log('✅ 所有餐點庫存預檢查通過');
};

/**
 * 🔍 預先檢查 Bundle 購買資格
 */
const validateBundlesBeforeOrder = async (orderData) => {
  const bundleItems = orderData.items.filter(item => item.itemType === 'bundle');

  if (bundleItems.length === 0) {
    return; // 沒有Bundle項目，跳過檢查
  }

  // console.log(`開始預檢查 ${bundleItems.length} 個Bundle項目的購買資格...`);

  for (const item of bundleItems) {
    try {
      await bundleService.validateBundlePurchase(
        item.bundleId || item.templateId,
        orderData.user,
        item.quantity,
        orderData.store
      );

      // console.log(`Bundle ${item.name} 購買資格檢查通過`);
    } catch (error) {
      console.error(`Bundle ${item.name} 購買資格檢查失敗:`, error);
      throw error; // 直接拋出，因為 bundleService 已經包裝了適當的錯誤訊息
    }
  }

  // console.log('✅ 所有Bundle購買資格預檢查通過');
};

/**
 * 🧹 清理失敗訂單 (當預檢查通過但後續步驟失敗時)
 */
const cleanupFailedOrder = async (orderId, items) => {
  try {
    // console.log('開始清理失敗訂單的相關資料...');

    // 刪除已創建的實例
    const dishInstanceIds = items
      .filter(item => item.itemType === 'dish')
      .map(item => item.dishInstance);

    const bundleInstanceIds = items
      .filter(item => item.itemType === 'bundle')
      .map(item => item.bundleInstance);

    if (dishInstanceIds.length > 0) {
      await DishInstance.deleteMany({ _id: { $in: dishInstanceIds } });
      // console.log(`清理了 ${dishInstanceIds.length} 個餐點實例`);
    }

    if (bundleInstanceIds.length > 0) {
      await BundleInstance.deleteMany({ _id: { $in: bundleInstanceIds } });
      // console.log(`清理了 ${bundleInstanceIds.length} 個Bundle實例`);
    }

    // 刪除訂單
    if (orderId) {
      await Order.findByIdAndDelete(orderId);
      // console.log('清理了失敗的訂單');
    }

    // console.log('失敗訂單清理完成');
  } catch (cleanupError) {
    console.error('清理失敗訂單資料時發生錯誤:', cleanupError);
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
  // 註解掉重複驗證，因為已經在預檢查階段完成
  // await bundleService.validateBundlePurchase(...)

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
 * 處理訂單付款完成後的流程
 */
export const processOrderPaymentComplete = async (order) => {
  let pointsReward = { pointsAwarded: 0 };
  let generatedCoupons = [];

  // 1. 生成 Bundle 的兌換券
  for (const item of order.items) {
    if (item.itemType === 'bundle') {
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

// ... 其他函數保持不變

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
    .populate('items.bundleInstance', 'name description sellingPrice finalPrice bundleItems')
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
    .populate('items.bundleInstance', 'name description sellingPrice finalPrice bundleItems')
    .populate('items.generatedCoupons', 'couponName couponType expiryDate isUsed')
    .populate('store', 'name')
    .lean();

  if (!order) {
    throw new AppError('訂單不存在', 404);
  }

  return order;
};

// ... 其他函數保持不變，導出部分也保持不變
