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

  // 庫存類型：餐點或原料（與 inventory 保持一致）
  inventoryType: {
    type: String,
    enum: ['DishTemplate', 'else'],  // 改為與 inventory 一致
    required: true
  },

  // 關聯餐點（僅當 inventoryType 為 'DishTemplate' 時必填）
  dish: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DishTemplate',
    required: function () {
      return this.inventoryType === 'DishTemplate';  // 改為與 inventory 一致
    }
  },

  // 庫存項目名稱
  itemName: {
    type: String,
    required: true
  },

  // 庫存變更類型：總庫存或可用庫存
  stockType: {
    type: String,
    enum: ['totalStock', 'availableStock'],  // 改為與 inventory 一致
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
    enum: ['manual_add', 'manual_subtract', 'order', 'system_adjustment', 'initial_stock', 'restock', 'damage', 'daily_reset'],  // 添加 daily_reset 用於重置可用庫存
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

  // 記錄操作時的相關標記
  metadata: {
    // 是否為可用庫存的每日重置
    isDailyReset: {
      type: Boolean,
      default: false
    },
    // 操作時 inventory 的相關設定（用於歷史記錄參考）
    inventorySettings: {
      enableAvailableStock: Boolean,
      isInventoryTracked: Boolean,
      isSoldOut: Boolean
    }
  }

}, { timestamps: true });

// 索引
// 按時間查詢索引
stockLogSchema.index({ store: 1, createdAt: -1 });


export default mongoose.model('StockLog', stockLogSchema);
