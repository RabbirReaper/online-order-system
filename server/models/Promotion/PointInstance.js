import mongoose from 'mongoose';

// 點數實例模型 - 每個點數實例代表一筆獲得的點數
const pointInstanceSchema = new mongoose.Schema({
  // 用戶關聯
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // 品牌關聯
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  },
  // 點數數量，預設一個實例1點
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  // 點數來源
  source: {
    type: String,
    enum: ['滿額贈送'],
    required: true
  },
  // 來源參考 (可選)
  sourceModel: {
    type: String,
    enum: ['Order'],
  },
  // 來源ID (可選)
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'sourceModel'
  },
  // 點數狀態
  status: {
    type: String,
    enum: ['active', 'used', 'expired'],
    default: 'active'
  },
  // 過期時間
  expiryDate: {
    type: Date,
    required: true
  },
  usedAt: { type: Date },
  usedIn: {
    model: { type: String, enum: ['Order'] },
    id: { type: mongoose.Schema.Types.ObjectId, refPath: 'usedIn.model' }
  },
}, { timestamps: true });

// 索引設置 - 根據常見查詢模式優化
pointInstanceSchema.index({ user: 1, status: 1, expiryDate: 1 });

// 靜態方法: 獲取用戶在指定品牌的可用點數總數
pointInstanceSchema.statics.getUserBrandActivePoints = async function (userId, brandId) {
  // 先處理過期點數
  const now = new Date();
  await this.updateMany(
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
  const result = await this.aggregate([
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

// 靜態方法: 獲取用戶在指定品牌的點數列表 (按過期日期排序)
pointInstanceSchema.statics.getUserActivePoints = async function (userId, brandId) {
  // 先處理過期點數
  const now = new Date();
  await this.updateMany(
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
  return this.find({
    user: userId,
    brand: brandId,
    status: 'active'
  }).sort({ expiryDate: 1, createdAt: 1 });
};

// 靜態方法: 使用點數 (優先使用快過期的點數)
pointInstanceSchema.statics.usePoints = async function (userId, brandId, pointsToUse, orderInfo) {
  // 1. 檢查用戶是否有足夠點數
  const totalPoints = await this.getUserBrandActivePoints(userId, brandId);
  if (totalPoints < pointsToUse) {
    throw new Error('點數不足');
  }

  // 2. 獲取可用點數列表 (按過期時間排序)
  const activePoints = await this.getUserActivePoints(userId, brandId);

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
      const usedPortion = new this({
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

// 靜態方法: 標記過期點數
pointInstanceSchema.statics.markExpiredPoints = async function () {
  const now = new Date();

  const result = await this.updateMany(
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

// 靜態方法: 退還點數 (用於取消訂單等場景)
pointInstanceSchema.statics.refundPoints = async function (orderId) {
  const pointsToRefund = await this.find({
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

export default mongoose.model('PointInstance', pointInstanceSchema);
