/**
 * Bundle 服務
 * 處理兌換券綑綁相關的業務邏輯（統一管理單個和組合兌換券）
 */

import Bundle from '../../models/Promotion/Bundle.js';
import CouponTemplate from '../../models/Promotion/CouponTemplate.js';
import Order from '../../models/Order/Order.js';
import { AppError } from '../../middlewares/error.js';
import * as imageHelper from '../imageHelper.js';

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
    .populate('bundleItems.couponTemplate', 'name description couponType validityPeriod')
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

  // 驗證至少有一種價格設定
  const hasCashPrice = bundleData.cashPrice && (bundleData.cashPrice.selling || bundleData.cashPrice.original);
  const hasPointPrice = bundleData.pointPrice && (bundleData.pointPrice.selling || bundleData.pointPrice.original);

  if (!hasCashPrice && !hasPointPrice) {
    throw new AppError('至少需要設定現金價格或點數價格其中一種', 400);
  }

  // 處理圖片上傳
  if (bundleData.imageData) {
    try {
      // 上傳圖片並獲取圖片資訊
      const imageInfo = await imageHelper.uploadAndProcessImage(
        bundleData.imageData,
        `bundles/${bundleData.brand}` // 使用品牌ID組織圖片路徑
      );

      // 設置圖片資訊到Bundle數據
      bundleData.image = imageInfo;

      // 刪除原始圖片數據以避免儲存過大的文件
      delete bundleData.imageData;
    } catch (error) {
      throw new AppError(`圖片處理失敗: ${error.message}`, 400);
    }
  } else if (!bundleData.image || !bundleData.image.url || !bundleData.image.key) {
    throw new AppError('圖片資訊不完整，請提供圖片', 400);
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

  // 處理圖片更新
  if (updateData.imageData) {
    try {
      // 如果存在舊圖片，則更新圖片
      if (bundle.image && bundle.image.key) {
        const imageInfo = await imageHelper.updateImage(
          updateData.imageData,
          bundle.image.key,
          `bundles/${brandId}`
        );
        updateData.image = imageInfo;
      } else {
        // 如果不存在舊圖片，則上傳新圖片
        const imageInfo = await imageHelper.uploadAndProcessImage(
          updateData.imageData,
          `bundles/${brandId}`
        );
        updateData.image = imageInfo;
      }

      // 刪除原始圖片數據
      delete updateData.imageData;
    } catch (error) {
      throw new AppError(`圖片處理失敗: ${error.message}`, 400);
    }
  }

  // 如果更新了時間範圍，驗證時間
  if (updateData.validFrom || updateData.validTo) {
    const startTime = new Date(updateData.validFrom || bundle.validFrom);
    const endTime = new Date(updateData.validTo || bundle.validTo);

    if (startTime >= endTime) {
      throw new AppError('結束時間必須晚於開始時間', 400);
    }
  }

  // 如果更新了價格，驗證至少有一種價格
  if (updateData.cashPrice !== undefined || updateData.pointPrice !== undefined) {
    const finalCashPrice = updateData.cashPrice || bundle.cashPrice;
    const finalPointPrice = updateData.pointPrice || bundle.pointPrice;

    const hasCashPrice = finalCashPrice && (finalCashPrice.selling || finalCashPrice.original);
    const hasPointPrice = finalPointPrice && (finalPointPrice.selling || finalPointPrice.original);

    if (!hasCashPrice && !hasPointPrice) {
      throw new AppError('至少需要設定現金價格或點數價格其中一種', 400);
    }
  }

  // 如果更新了 bundleItems，驗證券模板
  if (updateData.bundleItems) {
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

      // 設置冗餘的券名稱
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

  // 檢查是否有關聯的訂單
  const relatedOrders = await Order.countDocuments({
    'items.itemType': 'bundle',
    'items.bundleInstance': { $exists: true }
  });

  if (relatedOrders > 0) {
    throw new AppError('有相關的訂單存在，無法刪除 Bundle', 400);
  }

  // 刪除關聯圖片
  if (bundle.image && bundle.image.key) {
    try {
      await imageHelper.deleteImage(bundle.image.key);
    } catch (error) {
      console.error(`刪除Bundle圖片失敗: ${error.message}`);
      // 繼續刪除Bundle，不因圖片刪除失敗而中斷流程
    }
  }

  await bundle.deleteOne();

  return { success: true, message: 'Bundle 已刪除' };
};

/**
 * 驗證 Bundle 購買資格
 * @param {String} bundleId - Bundle ID
 * @param {String} userId - 用戶ID
 * @param {Number} quantity - 購買數量
 * @param {String} storeId - 店鋪ID
 * @param {String} paymentType - 付款方式 ('cash' | 'point')
 * @returns {Promise<Object>} 驗證結果和Bundle信息
 */
export const validateBundlePurchase = async (bundleId, userId, quantity, storeId, paymentType = 'cash') => {
  const bundle = await Bundle.findById(bundleId)
    .populate('bundleItems.couponTemplate');

  if (!bundle) {
    throw new AppError('Bundle 不存在', 404);
  }

  // 檢查 Bundle 是否啟用
  if (!bundle.isActive) {
    throw new AppError('此Bundle目前不可購買', 400);
  }

  // 檢查時間限制
  const now = new Date();
  if (bundle.autoStatusControl) {
    if (now < bundle.validFrom || now > bundle.validTo) {
      throw new AppError('此Bundle不在購買期間內', 400);
    }
  }

  // 檢查店鋪限制
  if (bundle.stores && bundle.stores.length > 0) {
    if (!bundle.stores.includes(storeId)) {
      throw new AppError('此Bundle不適用於當前店鋪', 400);
    }
  }

  // 檢查付款方式是否支援
  if (paymentType === 'cash') {
    if (!bundle.hasCashPrice) {
      throw new AppError('此Bundle不支援現金購買', 400);
    }
  } else if (paymentType === 'point') {
    if (!bundle.hasPointPrice) {
      throw new AppError('此Bundle不支援點數兌換', 400);
    }
  }

  // 檢查用戶購買限制
  if (bundle.purchaseLimitPerUser && userId) {
    const userPurchaseCount = await Order.aggregate([
      {
        $match: {
          user: userId,
          status: { $in: ['paid', 'completed'] },
          'items.itemType': 'bundle'
        }
      },
      {
        $unwind: '$items'
      },
      {
        $match: {
          'items.itemType': 'bundle'
        }
      },
      {
        $lookup: {
          from: 'bundleinstances',
          localField: 'items.bundleInstance',
          foreignField: '_id',
          as: 'bundleInstance'
        }
      },
      {
        $unwind: '$bundleInstance'
      },
      {
        $match: {
          'bundleInstance.templateId': bundleId
        }
      },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$items.quantity' }
        }
      }
    ]);

    const currentPurchaseCount = userPurchaseCount[0]?.totalQuantity || 0;

    if (currentPurchaseCount + quantity > bundle.purchaseLimitPerUser) {
      throw new AppError(`您最多只能購買 ${bundle.purchaseLimitPerUser} 個此Bundle`, 400);
    }
  }

  return bundle;
};

/**
 * 獲取可購買的 Bundle 列表
 * @param {String} brandId - 品牌ID
 * @param {String} storeId - 店鋪ID
 * @param {String} paymentType - 付款方式篩選 ('cash' | 'point' | 'all')
 * @returns {Promise<Array>} 可購買的 Bundle 列表
 */
export const getAvailableBundles = async (brandId, storeId, paymentType = 'all') => {
  const now = new Date();

  const query = {
    brand: brandId,
    isActive: true,
    $or: [
      { stores: { $size: 0 } }, // 適用於所有店鋪
      { stores: { $in: [storeId] } } // 指定店鋪
    ]
  };

  let bundles = await Bundle.find(query)
    .populate('bundleItems.couponTemplate', 'name description couponType')
    .sort({ createdAt: -1 });

  // 過濾出在有效期內的 Bundle
  bundles = bundles.filter(bundle => {
    if (bundle.autoStatusControl) {
      const isInValidPeriod = now >= bundle.validFrom && now <= bundle.validTo;
      if (!isInValidPeriod) return false;
    }

    // 根據付款方式篩選
    if (paymentType === 'cash') {
      return bundle.hasCashPrice;
    } else if (paymentType === 'point') {
      return bundle.hasPointPrice;
    }

    return true;
  });

  return bundles;
};

/**
 * 計算 Bundle 的最終價格
 * @param {Object} bundle - Bundle 對象
 * @param {String} paymentType - 付款方式 ('cash' | 'point')
 * @returns {Number} 最終價格
 */
export const calculateBundlePrice = (bundle, paymentType = 'cash') => {
  if (paymentType === 'cash') {
    if (!bundle.cashPrice) return 0;
    return bundle.cashPrice.selling || bundle.cashPrice.original || 0;
  } else if (paymentType === 'point') {
    if (!bundle.pointPrice) return 0;
    return bundle.pointPrice.selling || bundle.pointPrice.original || 0;
  }

  return 0;
};

/**
 * 檢查用戶購買限制
 * @param {String} userId - 用戶ID
 * @param {String} bundleId - Bundle ID
 * @param {Number} quantity - 要購買的數量
 * @returns {Promise<Object>} 購買限制檢查結果
 */
export const checkPurchaseLimit = async (userId, bundleId, quantity = 1) => {
  const bundle = await Bundle.findById(bundleId);

  if (!bundle) {
    throw new AppError('Bundle 不存在', 404);
  }

  // 如果沒有設定購買限制，則可以購買
  if (!bundle.purchaseLimitPerUser) {
    return {
      canPurchase: true,
      remainingLimit: null,
      message: '無購買數量限制'
    };
  }

  // 計算用戶已購買的數量
  const userPurchaseCount = await Order.aggregate([
    {
      $match: {
        user: userId,
        status: { $in: ['paid', 'completed'] },
        'items.itemType': 'bundle'
      }
    },
    {
      $unwind: '$items'
    },
    {
      $match: {
        'items.itemType': 'bundle'
      }
    },
    {
      $lookup: {
        from: 'bundleinstances',
        localField: 'items.bundleInstance',
        foreignField: '_id',
        as: 'bundleInstance'
      }
    },
    {
      $unwind: '$bundleInstance'
    },
    {
      $match: {
        'bundleInstance.templateId': bundleId
      }
    },
    {
      $group: {
        _id: null,
        totalQuantity: { $sum: '$items.quantity' }
      }
    }
  ]);

  const currentPurchaseCount = userPurchaseCount[0]?.totalQuantity || 0;
  const remainingLimit = bundle.purchaseLimitPerUser - currentPurchaseCount;

  const canPurchase = currentPurchaseCount + quantity <= bundle.purchaseLimitPerUser;

  return {
    canPurchase,
    remainingLimit: Math.max(0, remainingLimit),
    currentPurchaseCount,
    purchaseLimit: bundle.purchaseLimitPerUser,
    requestedQuantity: quantity,
    message: canPurchase ? '可以購買' : `超過購買限制，您已購買 ${currentPurchaseCount} 個，限制為 ${bundle.purchaseLimitPerUser} 個`
  };
};

/**
 * 自動更新 Bundle 狀態（系統任務）
 * @returns {Promise<Object>} 更新結果
 */
export const autoUpdateBundleStatus = async () => {
  const now = new Date();

  // 找到所有啟用自動狀態控制的 Bundle
  const bundlesToUpdate = await Bundle.find({
    autoStatusControl: true,
    isActive: true
  });

  let activatedCount = 0;
  let deactivatedCount = 0;

  for (const bundle of bundlesToUpdate) {
    const isInValidPeriod = now >= bundle.validFrom && now <= bundle.validTo;

    // 如果 Bundle 應該啟用但目前未啟用
    if (isInValidPeriod && !bundle.isActive) {
      bundle.isActive = true;
      await bundle.save();
      activatedCount++;
    }
    // 如果 Bundle 應該停用但目前啟用
    else if (!isInValidPeriod && bundle.isActive) {
      bundle.isActive = false;
      await bundle.save();
      deactivatedCount++;
    }
  }

  return {
    totalChecked: bundlesToUpdate.length,
    activatedCount,
    deactivatedCount,
    timestamp: now
  };
};
