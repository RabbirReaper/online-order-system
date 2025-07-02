/**
 * Bundle 服務
 * 處理兌換券綑綁相關的業務邏輯（只處理 Voucher，不涉及 Coupon）
 */

import Bundle from '../../models/Promotion/Bundle.js';
import VoucherTemplate from '../../models/Promotion/VoucherTemplate.js';
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

  // 查詢 Bundle - 只包含 Voucher
  const bundles = await Bundle.find(query)
    .populate('bundleItems.voucherTemplate', 'name description voucherType')
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
    .populate('bundleItems.voucherTemplate', 'name description voucherType validityPeriod')
    .populate('stores', 'name');

  if (!bundle) {
    throw new AppError('Bundle 不存在或無權訪問', 404);
  }

  return bundle;
};

/**
 * Bundle 服務 - 修正版本
 * 處理兌換券綑綁相關的業務邏輯
 */

export const createBundle = async (bundleData) => {
  // === 第一階段：基本驗證 ===
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

  // 驗證時間範圍（如果有設定的話）
  if (bundleData.validFrom && bundleData.validTo) {
    if (new Date(bundleData.validFrom) >= new Date(bundleData.validTo)) {
      throw new AppError('結束時間必須晚於開始時間', 400);
    }
  }

  // 🔧 修正：圖片驗證邏輯 - 允許可選圖片
  const hasImageData = bundleData.imageData;
  const hasExistingImage = bundleData.image && bundleData.image.url && bundleData.image.key;

  // 如果兩者都沒有，可以選擇：
  // 選項1：強制要求圖片（保持原邏輯）
  if (!hasImageData && !hasExistingImage) {
    throw new AppError('請提供圖片', 400);
  }

  // 選項2：允許沒有圖片（建議的修正）
  // if (!hasImageData && !hasExistingImage) {
  //   console.warn('Bundle 創建時未提供圖片');
  // }

  // === 第二階段：資料庫驗證 ===
  // 🔧 修正：檢查兌換券模板（確保欄位名正確）
  for (const item of bundleData.bundleItems) {
    if (!item.voucherTemplate) {
      throw new AppError('兌換券模板ID為必填欄位', 400);
    }

    const voucherTemplate = await VoucherTemplate.findOne({
      _id: item.voucherTemplate,
      brand: bundleData.brand
    }).populate('exchangeDishTemplate', 'name basePrice'); // 🔧 新增：populate 餐點資訊

    if (!voucherTemplate) {
      throw new AppError(`兌換券模板 ${item.voucherTemplate} 不存在或不屬於此品牌`, 404);
    }

    if (!voucherTemplate.isActive) {
      throw new AppError(`兌換券模板 ${voucherTemplate.name} 已停用，無法使用`, 400);
    }

    // 設置冗餘的券名稱
    item.voucherName = voucherTemplate.name;

    // 🔧 新增：驗證數量
    if (!item.quantity || item.quantity < 1) {
      throw new AppError(`兌換券 ${voucherTemplate.name} 的數量必須大於 0`, 400);
    }
  }

  // === 第三階段：圖片上傳 ===
  if (bundleData.imageData) {
    try {
      const imageInfo = await imageHelper.uploadAndProcessImage(
        bundleData.imageData,
        `bundles/${bundleData.brand}`
      );

      bundleData.image = imageInfo;
      delete bundleData.imageData;
    } catch (error) {
      throw new AppError(`圖片處理失敗: ${error.message}`, 400);
    }
  }

  // === 第四階段：創建 Bundle ===
  try {
    const newBundle = new Bundle(bundleData);
    await newBundle.save();

    // 🔧 新增：populate 完整資訊後返回
    const populatedBundle = await Bundle.findById(newBundle._id)
      .populate('bundleItems.voucherTemplate', 'name description validityPeriod exchangeDishTemplate')
      .populate('stores', 'name');

    return populatedBundle;
  } catch (error) {
    // 清理失敗時產生的圖片
    if (bundleData.image && bundleData.image.key && bundleData.imageData !== undefined) {
      try {
        await imageHelper.deleteImage(bundleData.image.key);
      } catch (cleanupError) {
        console.error(`清理孤兒圖片失敗: ${cleanupError.message}`);
      }
    }
    throw error;
  }
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

  // 如果更新了 bundleItems，驗證券模板（只檢查 VoucherTemplate）
  if (updateData.bundleItems) {
    for (const item of updateData.bundleItems) {
      if (!item.voucherTemplate) {
        throw new AppError('兌換券模板ID為必填欄位', 400);
      }

      const voucherTemplate = await VoucherTemplate.findOne({
        _id: item.voucherTemplate,
        brand: brandId
      });

      if (!voucherTemplate) {
        throw new AppError(`兌換券模板 ${item.voucherTemplate} 不存在或不屬於此品牌`, 404);
      }

      // 設置冗餘的券名稱
      item.voucherName = voucherTemplate.name;
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
  const bundle = await Bundle.findOne({
    _id: bundleId,
    brand: brandId
  });

  if (!bundle) {
    throw new AppError('Bundle 不存在或無權訪問', 404);
  }

  // 檢查是否有關聯的訂單
  const relatedOrders = await Order.countDocuments({
    'items.bundle': bundleId
  });

  if (relatedOrders > 0) {
    throw new AppError('此Bundle已有相關訂單，無法刪除', 400);
  }

  // 刪除圖片
  if (bundle.image && bundle.image.key) {
    try {
      await imageHelper.deleteImage(bundle.image.key);
    } catch (error) {
      console.warn('刪除Bundle圖片失敗:', error);
    }
  }

  await bundle.deleteOne();

  return { success: true, message: 'Bundle已刪除' };
};
