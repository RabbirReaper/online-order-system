/**
 * 點數服務
 * 處理點數相關的業務邏輯
 */

import mongoose from 'mongoose';
import PointInstance from '../../models/Promotion/PointInstance.js';
import { AppError } from '../../middlewares/error.js';

/**
 * 獲取用戶在指定品牌的可用點數總數
 * @param {String} userId - 用戶ID
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Number>} 可用點數總數
 */
export const getUserPointsBalance = async (userId, brandId) => {
  // 先處理過期點數
  const now = new Date();
  await PointInstance.updateMany(
    {
      user: userId,
      brand: brandId,
      status: 'active',
      expiryDate: { $lt: now }
    },
    {
      $set: { status: 'expired' }
    }
  );

  // 然後查詢總點數
  const result = await PointInstance.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        brand: new mongoose.Types.ObjectId(brandId),
        status: 'active'
      }
    },
    {
      $group: {
        _id: null,
        totalPoints: { $sum: '$amount' }
      }
    }
  ]);

  return result.length > 0 ? result[0].totalPoints : 0;
};

/**
 * 獲取用戶在指定品牌的點數列表 (按過期日期排序)
 * @param {String} userId - 用戶ID
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Array>} 點數列表
 */
export const getUserPoints = async (userId, brandId) => {
  // 先處理過期點數
  const now = new Date();
  await PointInstance.updateMany(
    {
      user: userId,
      brand: brandId,
      status: 'active',
      expiryDate: { $lt: now }
    },
    {
      $set: { status: 'expired' }
    }
  );

  // 然後查詢有效點數
  return await PointInstance.find({
    user: userId,
    brand: brandId,
    status: 'active'
  }).sort({ expiryDate: 1, createdAt: 1 });
};

/**
 * 使用點數
 * @param {String} userId - 用戶ID
 * @param {String} brandId - 品牌ID
 * @param {Number} pointsToUse - 要使用的點數數量
 * @param {Object} orderInfo - 訂單資訊 {model: 'Order', id: orderId}
 * @returns {Promise<Object>} 使用點數結果
 */
export const usePoints = async (userId, brandId, pointsToUse, orderInfo) => {
  // 1. 檢查用戶是否有足夠點數
  const totalPoints = await getUserPointsBalance(userId, brandId);
  if (totalPoints < pointsToUse) {
    throw new AppError('點數不足', 400);
  }

  // 2. 獲取可用點數列表 (按過期時間排序)
  const activePoints = await getUserPoints(userId, brandId);

  // 3. 從最早過期的點數開始使用
  let remainingToUse = pointsToUse;
  const usedPoints = [];
  const now = new Date();

  for (const point of activePoints) {
    if (remainingToUse <= 0) break;

    if (point.amount <= remainingToUse) {
      // 完全使用這筆點數
      point.status = 'used';
      point.usedAt = now;
      point.usedIn = orderInfo;

      remainingToUse -= point.amount;
      usedPoints.push(point);
    } else {
      // 需要拆分點數
      // 創建一個新點數實例來記錄使用的部分
      const usedPortion = new PointInstance({
        user: userId,
        brand: brandId,
        amount: remainingToUse,
        source: point.source,
        sourceModel: point.sourceModel,
        sourceId: point.sourceId,
        status: 'used',
        expiryDate: point.expiryDate,
        usedAt: now,
        usedIn: orderInfo,
        createdAt: point.createdAt
      });

      // 更新原始點數金額
      point.amount -= remainingToUse;

      usedPoints.push(usedPortion);
      remainingToUse = 0;
    }
  }

  // 4. 保存變更
  const savePromises = [
    ...usedPoints.map(p => p.save()),
    ...activePoints.filter(p => p.status === 'active' && p._id).map(p => p.save())
  ];

  await Promise.all(savePromises);

  return {
    success: true,
    pointsUsed: pointsToUse,
    usedPoints: usedPoints
  };
};

/**
 * 標記過期點數
 * @returns {Promise<Number>} 標記為過期的點數數量
 */
export const markExpiredPoints = async () => {
  const now = new Date();

  const result = await PointInstance.updateMany(
    {
      status: 'active',
      expiryDate: { $lt: now }
    },
    {
      $set: { status: 'expired' }
    }
  );

  return result.modifiedCount;
};

/**
 * 退還點數 (用於取消訂單等場景)
 * @param {String} orderId - 訂單ID
 * @returns {Promise<Object>} 退還結果
 */
export const refundPointsForOrder = async (orderId) => {
  const pointsToRefund = await PointInstance.find({
    'usedIn.model': 'Order',
    'usedIn.id': orderId,
    status: 'used'
  });

  if (pointsToRefund.length === 0) {
    return { success: true, message: '沒有找到需要退還的點數', refundedCount: 0 };
  }

  const now = new Date();
  const refundResults = [];

  for (const point of pointsToRefund) {
    // 檢查點數是否已過期
    if (point.expiryDate < now) {
      // 已過期的點數
      point.status = 'expired';
      refundResults.push({ point: point._id, status: 'expired', amount: point.amount });
    } else {
      // 重新啟用點數
      point.status = 'active';
      point.usedAt = null;
      point.usedIn = null;
      refundResults.push({ point: point._id, status: 'active', amount: point.amount });
    }
  }

  // 保存所有更改
  await Promise.all(pointsToRefund.map(p => p.save()));

  return {
    success: true,
    message: '點數退還成功',
    refundedCount: pointsToRefund.length,
    details: refundResults
  };
};

/**
 * 新增點數給用戶
 * @param {String} userId - 用戶ID
 * @param {String} brandId - 品牌ID
 * @param {Number} amount - 點數數量
 * @param {String} source - 點數來源
 * @param {Object} sourceInfo - 來源資訊 (可選) {model: '來源模型', id: '來源ID'}
 * @param {Number} validityDays - 有效期天數 (默認 365 天)
 * @returns {Promise<Object>} 新增的點數實例
 */
export const addPointsToUser = async (userId, brandId, amount, source, sourceInfo = null, validityDays = 365) => {
  if (!userId || !brandId || !amount || amount <= 0 || !source) {
    throw new AppError('缺少必要參數', 400);
  }

  // 計算過期日期
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + validityDays);

  // 建立點數實例
  const pointInstance = new PointInstance({
    user: userId,
    brand: brandId,
    amount,
    source,
    status: 'active',
    expiryDate
  });

  // 如果有來源資訊，添加到點數實例
  if (sourceInfo && sourceInfo.model && sourceInfo.id) {
    pointInstance.sourceModel = sourceInfo.model;
    pointInstance.sourceId = sourceInfo.id;
  }

  // 保存點數實例
  await pointInstance.save();

  return pointInstance;
};

/**
 * 獲取用戶點數歷史
 * @param {String} userId - 用戶ID
 * @param {String} brandId - 品牌ID (可選)
 * @param {Object} options - 查詢選項
 * @param {Number} options.page - 頁碼 (默認 1)
 * @param {Number} options.limit - 每頁數量 (默認 10)
 * @returns {Promise<Object>} 用戶點數歷史及分頁資訊
 */
export const getUserPointHistory = async (userId, brandId = null, options = {}) => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  // 構建查詢條件
  const query = { user: userId };
  if (brandId) {
    query.brand = brandId;
  }

  // 查詢總數
  const total = await PointInstance.countDocuments(query);

  // 查詢點數記錄
  const pointRecords = await PointInstance.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('brand', 'name')
    .lean();

  // 處理分頁資訊
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    records: pointRecords,
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
