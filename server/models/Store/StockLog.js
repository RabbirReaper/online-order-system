import mongoose from 'mongoose';

const stockLogSchema = new mongoose.Schema({
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

  // 庫存類型：餐點或原料
  inventoryType: {
    type: String,
    enum: ['dish', 'else'],
    required: true
  },

  // 關聯餐點（僅當 inventoryType 為 'dish' 時必填）
  dish: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DishTemplate',
    required: function () {
      return this.inventoryType === 'dish';
    }
  },

  // 庫存項目名稱（原本的 dishName 改為通用的 itemName）
  itemName: {
    type: String,
    required: true
  },

  // 庫存變更類型：倉庫庫存或可用庫存
  stockType: {
    type: String,
    enum: ['warehouseStock', 'availableStock'],
    required: true
  },

  // 變更前的庫存
  previousStock: {
    type: Number,
    required: true
  },

  // 變更後的庫存
  newStock: {
    type: Number,
    required: true
  },

  // 變更數量
  changeAmount: {
    type: Number,
    required: true
  },

  // 變更類型
  changeType: {
    type: String,
    enum: ['manual_add', 'manual_subtract', 'order', 'system_adjustment', 'initial_stock', 'restock', 'damage'],
    required: true
  },

  // 變更原因
  reason: {
    type: String,
  },

  // 關聯訂單（如果是訂單引起的變更）
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },

  // 執行操作的管理員
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },

}, { timestamps: true });

// 索引
// 按時間查詢索引
stockLogSchema.index({ brand: 1, store: 1, createdAt: -1 });


export default mongoose.model('StockLog', stockLogSchema);
