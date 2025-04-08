import mongoose from 'mongoose';

// 優惠券實例 (CouponInstance)
const couponInstanceSchema = new mongoose.Schema({
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CouponTemplate',
    required: true
  }, // 關聯的優惠券模板
  // 冗餘存儲關鍵信息，以防模板被更改
  couponName: { type: String, required: true },
  couponType: { type: String, enum: ['discount', 'exchange'], required: true },
  discount: { type: Number }, // 折扣金額（如果是折扣類型）
  exchangeItems: [{
    dishTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DishTemplate'
    }, // 可兌換的餐點
    quantity: {
      type: Number,
      default: 1,
      min: 1
    } // 可兌換的數量
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }, // 持有用戶
  isUsed: {
    type: Boolean,
    default: false
  }, // 是否已使用
  usedAt: {
    type: Date
  }, // 使用日期
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }, // 使用的訂單
  acquiredAt: {
    type: Date,
    default: Date.now
  }, // 獲得日期
  expiryDate: {
    type: Date,
  }, // 過期日期
  pointsUsed: {
    type: Number,
    required: true
  }, // 兌換使用的點數
});

export default mongoose.model('CouponInstance', couponInstanceSchema);
