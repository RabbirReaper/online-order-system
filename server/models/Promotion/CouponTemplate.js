import mongoose from 'mongoose';

// 優惠券模板 (CouponTemplate)
const couponTemplateSchema = new mongoose.Schema({
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  }, // 所屬品牌
  name: {
    type: String,
    trim: true,
    required: true
  }, // 優惠券名稱
  description: {
    type: String
  }, // 優惠券描述
  couponType: {
    type: String,
    enum: ['discount', 'exchange'],
    required: true
  }, // 優惠券類型: 折扣或兌換
  pointCost: {
    type: Number,
    required: true,
    min: 1
  }, // 兌換所需點數
  // 折扣券特有屬性
  discountInfo: {
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
    }, // 折扣類型：百分比或固定金額
    discountValue: {
      type: Number
    }, // 折扣值（百分比或金額）
    maxDiscountAmount: {
      type: Number
    }, // 最大折扣金額 (僅對百分比折扣有效)
    minPurchaseAmount: {
      type: Number,
      default: 0
    } // 最低消費金額
  },
  // 兌換券特有屬性
  exchangeInfo: {
    items: [{
      dishTemplate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DishTemplate'
      }, // 可兌換的餐點
      quantity: {
        type: Number,
        default: 1,
        min: 1
      } // 可兌換的數量
    }]
  },
  validityPeriod: {
    type: Number,
    required: true
  }, // 有效期限 (天數)
  isActive: {
    type: Boolean,
    default: true
  }, // 模板是否啟用
  stores: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  }], // 適用店鋪 (空陣列表示所有店鋪適用)
  totalIssued: {
    type: Number,
    default: 0
  }, // 已發行總數
}, { timestamps: true });

couponTemplateSchema.index({ brand: 1 });


export default mongoose.model('CouponTemplate', couponTemplateSchema);
