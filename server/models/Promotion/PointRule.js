import mongoose from 'mongoose';

// 點數累積規則模型
const pointRuleSchema = new mongoose.Schema({
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  }, // 所屬品牌
  name: {
    type: String,
    required: true
  }, // 規則名稱
  description: {
    type: String
  }, // 規則描述
  type: {
    type: String,
    enum: ['purchase_amount', 'first_purchase', 'recurring_visit'],
    required: true
  }, // 點數累積類型
  conversionRate: {
    type: Number,
    required: true
  }, // 轉換率 (例如: 消費 100 元 = 1 點)
  minimumAmount: {
    type: Number,
    default: 0
  }, // 最低消費金額
  isActive: {
    type: Boolean,
    default: false
  }, // 規則是否啟用
}, { timestamps: true });


pointRuleSchema.index({ brand: 1 });

export default mongoose.model('PointRule', pointRuleSchema);
