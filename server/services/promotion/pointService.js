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

  // 計算可用點數數量（每個實例代表1點）
  const count = await PointInstance.countDocuments({
    user: new mongoose.Types.ObjectId(userId),
    brand: new mongoose.Types.ObjectId(brandId),
    status: 'active'
  });

  return count;
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

    // 每個實例只有1點，直接標記為已使用
    point.status = 'used';
    point.usedAt = now;
    point.usedIn = orderInfo;

    remainingToUse -= 1;
    usedPoints.push(point);
  }

  // 4. 保存變更
  const savePromises = usedPoints.map(p => p.save());
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
      refundResults.push({ point: point._id, status: 'expired', amount: 1 });
    } else {
      // 重新啟用點數
      point.status = 'active';
      point.usedAt = null;
      point.usedIn = null;
      refundResults.push({ point: point._id, status: 'active', amount: 1 });
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
 * @param {Object|Number} ruleOrValidityDays - 點數規則物件或有效期天數 (向後兼容)
 * @returns {Promise<Array>} 新增的點數實例陣列
 */
export const addPointsToUser = async (userId, brandId, amount, source, sourceInfo = null, ruleOrValidityDays) => {
  if (!userId || !brandId || !amount || amount <= 0 || !source || !ruleOrValidityDays) {
    throw new AppError('缺少必要參數', 400);
  }

  // 計算過期日期
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + ruleOrValidityDays);

  // 建立多個點數實例（每個實例代表1點）
  const pointInstances = [];

  for (let i = 0; i < amount; i++) {
    const pointInstance = new PointInstance({
      user: userId,
      brand: brandId,
      amount: 1, // 固定為1
      source,
      status: 'active',
      expiryDate
    });

    // 如果有來源資訊，添加到點數實例
    if (sourceInfo && sourceInfo.model && sourceInfo.id) {
      pointInstance.sourceModel = sourceInfo.model;
      pointInstance.sourceId = sourceInfo.id;
    }

    pointInstances.push(pointInstance);
  }

  // 批量保存點數實例
  const savedInstances = await PointInstance.insertMany(pointInstances);

  return savedInstances;
};

/**
 * 獲取用戶點數歷史（群組化顯示）
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
  const matchQuery = { user: new mongoose.Types.ObjectId(userId) };
  if (brandId) {
    matchQuery.brand = new mongoose.Types.ObjectId(brandId);
  }

  // 使用聚合來群組化相同來源的點數
  const pipeline = [
    { $match: matchQuery },
    {
      $group: {
        _id: {
          source: "$source",
          sourceModel: "$sourceModel",
          sourceId: "$sourceId",
          status: "$status",
          usedIn: "$usedIn",
          // 按日期分組（到天）
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          }
        },
        amount: { $sum: 1 }, // 計算點數數量
        firstCreatedAt: { $min: "$createdAt" },
        brand: { $first: "$brand" },
        expiryDate: { $first: "$expiryDate" },
        usedAt: { $first: "$usedAt" }
      }
    },
    {
      $project: {
        _id: 0,
        source: "$_id.source",
        sourceModel: "$_id.sourceModel",
        sourceId: "$_id.sourceId",
        status: "$_id.status",
        usedIn: "$_id.usedIn",
        amount: 1,
        createdAt: "$firstCreatedAt",
        brand: 1,
        expiryDate: 1,
        usedAt: 1
      }
    },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit }
  ];

  // 執行聚合查詢
  const records = await PointInstance.aggregate(pipeline);

  // 填充 brand 資訊
  await PointInstance.populate(records, { path: 'brand', select: 'name' });

  // 計算總數（用於分頁）
  const totalPipeline = [
    { $match: matchQuery },
    {
      $group: {
        _id: {
          source: "$source",
          sourceModel: "$sourceModel",
          sourceId: "$sourceId",
          status: "$status",
          usedIn: "$usedIn",
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          }
        }
      }
    },
    { $count: "total" }
  ];

  const totalResult = await PointInstance.aggregate(totalPipeline);
  const total = totalResult.length > 0 ? totalResult[0].total : 0;

  // 處理分頁資訊
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    records,
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
