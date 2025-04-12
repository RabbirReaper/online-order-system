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

// 啟用特定規則，自動停用同品牌的其他規則
pointRuleSchema.statics.activateRule = async function (ruleId) {
  const rule = await this.findById(ruleId);

  if (!rule) {
    throw new Error('找不到指定的點數規則');
  }

  // 開始一個事務來確保操作的原子性
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 先將該品牌的所有規則設為非啟用
    await this.updateMany(
      { brand: rule.brand, _id: { $ne: rule._id } },
      { isActive: false },
      { session }
    );

    // 啟用選定的規則
    rule.isActive = true;
    await rule.save({ session });

    // 提交事務
    await session.commitTransaction();
    session.endSession();

    return rule;
  } catch (error) {
    // 如果出錯，回滾事務
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// 停用特定規則
pointRuleSchema.statics.deactivateRule = async function (ruleId) {
  const rule = await this.findById(ruleId);

  if (!rule) {
    throw new Error('找不到指定的點數規則');
  }

  rule.isActive = false;
  await rule.save();

  return rule;
};

export default mongoose.model('PointRule', pointRuleSchema);
