import mongoose from 'mongoose';

// 用戶點數交易記錄
const pointTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }, // 關聯用戶
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  }, // 所屬品牌
  type: {
    type: String,
    enum: ['earn', 'redeem', 'expire', 'bonus'],
    required: true
  }, // 交易類型
  points: {
    type: Number,
    required: true
  }, // 點數數量 (正數為獲得，負數為消費)
  balance: {
    type: Number,
    required: true
  }, // 交易後餘額
  source: {
    type: String,
    enum: ['order', 'coupon', 'system', 'promotion'],
    required: true
  }, // 點數來源
  sourceModel: {
    type: String,
    enum: ['Order', 'CouponInstance', 'PointRule']
  }, // 來源模型
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'sourceModel'
  }, // 來源ID
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }, // 關聯訂單 (如果有)
  couponInstance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CouponInstance'
  }, // 關聯優惠券 (如果有)
}, { timestamps: true });

export default mongoose.model('PointTransaction', pointTransactionSchema);
