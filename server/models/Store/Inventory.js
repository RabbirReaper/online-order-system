import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  dish: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DishTemplate',
    required: true
  },
  dishName: {
    type: String,
    required: true
  }, // 冗餘名稱，方便查詢
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  }, // 庫存量
  dailyLimit: {
    type: Number
  }, // 每日限制（可選）
  isInventoryTracked: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// 複合索引：每家店只能有一道菜的唯一記錄
inventorySchema.index({ store: 1, dish: 1 }, { unique: true });

inventorySchema.methods.reduceStock = async function (quantity, reason, orderId = null, adminId = null) {
  if (!this.isInventoryTracked) return true;

  if (this.stock < quantity) {
    throw new Error('庫存不足');
  }

  if (this.dailyLimit && this.dailyLimit < quantity) {
    throw new Error('超過每日可售數量限制');
  }

  const StockLog = mongoose.model('StockLog');
  const previousStock = this.stock;

  this.stock -= quantity;
  if (this.dailyLimit) this.dailyLimit -= quantity;

  await StockLog.create({
    store: this.store,
    dish: this.dish,
    dishName: this.dishName,
    previousStock,
    newStock: this.stock,
    changeAmount: -quantity,
    changeType: orderId ? 'order' : 'manual_subtract',
    reason: reason || '訂單消耗',
    order: orderId,
    admin: adminId
  });

  await this.save();
  return true;
};

inventorySchema.methods.addStock = async function (quantity, reason, adminId = null) {
  if (!this.isInventoryTracked) return true;

  const StockLog = mongoose.model('StockLog');
  const previousStock = this.stock;

  this.stock += quantity;

  await StockLog.create({
    store: this.store,
    dish: this.dish,
    dishName: this.dishName,
    previousStock,
    newStock: this.stock,
    changeAmount: quantity,
    changeType: 'manual_add',
    reason: reason || '手動增加庫存',
    admin: adminId
  });

  await this.save();
  return true;
};

inventorySchema.methods.setDailyLimit = async function (newLimit) {
  this.dailyLimit = newLimit;
  await this.save();
  return true;
};

inventorySchema.methods.getDailyLimit = function () {
  return this.dailyLimit ?? null;
};

export default mongoose.model('Inventory', inventorySchema);
