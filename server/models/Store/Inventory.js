import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  },
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
inventorySchema.index({ brand: 1, store: 1, dish: 1 }, { unique: true });

export default mongoose.model('Inventory', inventorySchema);
