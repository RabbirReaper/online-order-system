import mongoose from 'mongoose';

// 點數實例模型 - 每個點數實例代表一筆獲得的點數
const pointInstanceSchema = new mongoose.Schema({
  // 用戶關聯
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
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

pointInstanceSchema.index({ brand: 1, user: 1 });

export default mongoose.model('PointInstance', pointInstanceSchema);
