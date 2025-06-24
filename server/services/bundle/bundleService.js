/**
 * Bundle 服務
 * 處理兌換券綑綁相關的業務邏輯
 */

import Bundle from '../../models/Dish/Bundle.js';
import CouponTemplate from '../../models/Promotion/CouponTemplate.js';
import Order from '../../models/Order/Order.js';
import { AppError } from '../../middlewares/error.js';

/**
 * 獲取所有 Bundle
 * @param {String} brandId - 品牌ID
 * @param {Object} options - 查詢選項
 * @returns {Promise<Array>} Bundle 列表
 */
export const getAllBundles = async (brandId, options = {}) => {
  const { includeInactive = false, page = 1, limit = 20 } = options;

  // 構建查詢條件
  const query = { brand: brandId };

  if (!includeInactive) {
    query.isActive = true;
  }

  // 計算分頁
  const skip = (page - 1) * limit;

  // 查詢總數
  const total = await Bundle.countDocuments(query);

  // 查詢 Bundle
  const bundles = await Bundle.find(query)
    .populate('bundleItems.couponTemplate', 'name description couponType')
    .populate('stores', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // 處理分頁信息
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    bundles,
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
 * 根據ID獲取 Bundle
 * @param {String} bundleId - Bundle ID
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} Bundle
 */
export const getBundleById = async (bundleId, brandId) => {
  const bundle = await Bundle.findOne({
    _id: bundleId,
    brand: brandId
  })
    .populate('bundleItems.couponTemplate', 'name description couponType pointCost')
    .populate('stores', 'name');

  if (!bundle) {
    throw new AppError('Bundle 不存在或無權訪問', 404);
  }

  return bundle;
};

/**
 * 創建 Bundle
 * @param {Object} bundleData - Bundle 數據
 * @returns {Promise<Object>} 創建的 Bundle
 */
export const createBundle = async (bundleData) => {
  // 基本驗證
  if (!bundleData.name || !bundleData.description) {
    throw new AppError('名稱和描述為必填欄位', 400);
  }

  if (!bundleData.bundleItems || bundleData.bundleItems.length === 0) {
    throw new AppError('至少需要一個兌換券項目', 400);
  }

  // 驗證時間範圍
  if (new Date(bundleData.validFrom) >= new Date(bundleData.validTo)) {
    throw new AppError('結束時間必須晚於開始時間', 400);
  }

  // 檢查所有兌換券模板是否存在且屬於同一品牌
  for (const item of bundleData.bundleItems) {
    if (!item.couponTemplate) {
      throw new AppError('兌換券模板ID為必填欄位', 400);
    }

    const couponTemplate = await CouponTemplate.findOne({
      _id: item.couponTemplate,
      brand: bundleData.brand
    });

    if (!couponTemplate) {
      throw new AppError(`兌換券模板 ${item.couponTemplate} 不存在或不屬於此品牌`, 404);
    }

    // 設置冗餘的券名稱
    item.couponName = couponTemplate.name;
  }

  // 創建 Bundle
  const newBundle = new Bundle(bundleData);
  await newBundle.save();

  return newBundle;
};

/**
 * 更新 Bundle
 * @param {String} bundleId - Bundle ID
 * @param {Object} updateData - 更新數據
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 更新後的 Bundle
 */
export const updateBundle = async (bundleId, updateData, brandId) => {
  // 檢查 Bundle 是否存在且屬於該品牌
  const bundle = await Bundle.findOne({
    _id: bundleId,
    brand: brandId
  });

  if (!bundle) {
    throw new AppError('Bundle 不存在或無權訪問', 404);
  }

  // 如果更新了時間範圍，驗證時間
  if (updateData.validFrom || updateData.validTo) {
    const startTime = new Date(updateData.validFrom || bundle.validFrom);
    const endTime = new Date(updateData.validTo || bundle.validTo);

    if (startTime >= endTime) {
      throw new AppError('結束時間必須晚於開始時間', 400);
    }
  }

  // 如果更新了 bundleItems，驗證券模板
  if (updateData.bundleItems && updateData.bundleItems.length > 0) {
    for (const item of updateData.bundleItems) {
      if (!item.couponTemplate) {
        throw new AppError('兌換券模板ID為必填欄位', 400);
      }

      const couponTemplate = await CouponTemplate.findOne({
        _id: item.couponTemplate,
        brand: brandId
      });

      if (!couponTemplate) {
        throw new AppError(`兌換券模板 ${item.couponTemplate} 不存在或不屬於此品牌`, 404);
      }

      // 更新冗餘的券名稱
      item.couponName = couponTemplate.name;
    }
  }

  // 防止更改品牌
  delete updateData.brand;

  // 更新 Bundle
  Object.keys(updateData).forEach(key => {
    bundle[key] = updateData[key];
  });

  await bundle.save();

  return bundle;
};

/**
 * 刪除 Bundle
 * @param {String} bundleId - Bundle ID
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 刪除結果
 */
export const deleteBundle = async (bundleId, brandId) => {
  // 檢查 Bundle 是否存在且屬於該品牌
  const bundle = await Bundle.findOne({
    _id: bundleId,
    brand: brandId
  });

  if (!bundle) {
    throw new AppError('Bundle 不存在或無權訪問', 404);
  }

  // 檢查是否有相關訂單
  const relatedOrders = await Order.countDocuments({
    'items.bundle': bundleId
  });

  if (relatedOrders > 0) {
    throw new AppError('此 Bundle 已被訂單使用，無法刪除', 400);
  }

  await bundle.deleteOne();

  return { success: true, message: 'Bundle 已刪除' };
};

/**
 * 獲取可購買的 Bundle (時限內+啟用)
 * @param {String} brandId - 品牌ID
 * @param {String} storeId - 店鋪ID (可選)
 * @returns {Promise<Array>} 可購買的 Bundle 列表
 */
export const getAvailableBundles = async (brandId, storeId = null) => {
  const now = new Date();

  // 基本查詢條件
  const query = {
    brand: brandId,
    isActive: true
  };

  // 如果有指定店鋪，添加店鋪條件
  if (storeId) {
    query.$or = [
      { stores: { $in: [storeId] } },
      { stores: { $size: 0 } } // 空陣列表示適用於所有店鋪
    ];
  }

  // 查詢所有啟用的 Bundle
  const bundles = await Bundle.find(query)
    .populate('bundleItems.couponTemplate', 'name description couponType')
    .populate('stores', 'name')
    .sort({ createdAt: -1 });

  // 過濾出在有效期內的 Bundle
  return bundles.filter(bundle => {
    // 如果不自動控制狀態，則無需檢查時間
    if (!bundle.autoStatusControl) return true;

    // 檢查是否在有效期內
    return now >= bundle.validFrom && now <= bundle.validTo;
  });
};

/**
 * 檢查用戶購買限制
 * @param {String} userId - 用戶ID
 * @param {String} bundleId - Bundle ID
 * @param {Number} quantity - 要購買的數量
 * @returns {Promise<Object>} 檢查結果
 */
export const checkPurchaseLimit = async (userId, bundleId, quantity = 1) => {
  const bundle = await Bundle.findById(bundleId);

  if (!bundle) {
    throw new AppError('Bundle 不存在', 404);
  }

  // 如果沒有設置購買限制，則不限制
  if (!bundle.purchaseLimitPerUser) {
    return { canPurchase: true, remainingLimit: null };
  }

  // 計算用戶已購買的數量
  const userOrders = await Order.find({
    user: userId,
    'items.bundle': bundleId,
    status: { $ne: 'cancelled' } // 不計算已取消的訂單
  });

  let purchasedQuantity = 0;
  userOrders.forEach(order => {
    order.items.forEach(item => {
      if (item.bundle && item.bundle.toString() === bundleId) {
        purchasedQuantity += item.quantity;
      }
    });
  });

  const remainingLimit = bundle.purchaseLimitPerUser - purchasedQuantity;
  const canPurchase = quantity <= remainingLimit;

  return {
    canPurchase,
    remainingLimit,
    purchasedQuantity,
    purchaseLimit: bundle.purchaseLimitPerUser
  };
};

/**
 * 自動更新過期 Bundle 狀態
 * @returns {Promise<Object>} 更新結果
 */
export const autoUpdateBundleStatus = async () => {
  const now = new Date();

  // 停用過期的 Bundle
  const expiredResult = await Bundle.updateMany(
    {
      autoStatusControl: true,
      isActive: true,
      validTo: { $lt: now }
    },
    {
      $set: { isActive: false }
    }
  );

  // 啟用到期的 Bundle
  const activeResult = await Bundle.updateMany(
    {
      autoStatusControl: true,
      isActive: false,
      validFrom: { $lte: now },
      validTo: { $gte: now }
    },
    {
      $set: { isActive: true }
    }
  );

  return {
    expiredCount: expiredResult.modifiedCount,
    activatedCount: activeResult.modifiedCount,
    timestamp: now
  };
};

/**
 * 驗證 Bundle 購買資格
 * @param {String} bundleId - Bundle ID
 * @param {String} userId - 用戶ID (可選)
 * @param {Number} quantity - 購買數量
 * @param {String} storeId - 店鋪ID (可選)
 * @returns {Promise<Object>} 驗證結果
 */
export const validateBundlePurchase = async (bundleId, userId = null, quantity = 1, storeId = null) => {
  const bundle = await Bundle.findById(bundleId);

  if (!bundle) {
    throw new AppError('Bundle 不存在', 404);
  }

  // 檢查是否啟用
  if (!bundle.isActive) {
    throw new AppError('此 Bundle 已停用', 400);
  }

  // 檢查時間限制（如果啟用自動狀態控制）
  if (bundle.autoStatusControl) {
    const now = new Date();

    if (now < bundle.validFrom) {
      throw new AppError('此 Bundle 尚未開始販售', 400);
    }

    if (now > bundle.validTo) {
      throw new AppError('此 Bundle 已過販售期限', 400);
    }
  }

  // 檢查店鋪限制
  if (storeId && bundle.stores.length > 0 && !bundle.stores.includes(storeId)) {
    throw new AppError('此 Bundle 不適用於當前店鋪', 400);
  }

  // 檢查用戶購買限制（如果有登入用戶）
  if (userId && bundle.purchaseLimitPerUser) {
    const limitCheck = await checkPurchaseLimit(userId, bundleId, quantity);

    if (!limitCheck.canPurchase) {
      throw new AppError(
        `超過購買限制，每人最多可購買 ${bundle.purchaseLimitPerUser} 份，您還可購買 ${limitCheck.remainingLimit} 份`,
        400
      );
    }
  }

  return {
    valid: true,
    bundle,
    message: 'success'
  };
};
