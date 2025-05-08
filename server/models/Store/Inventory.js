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

  // 庫存類型：餐點或原料
  inventoryType: {
    type: String,
    enum: ['dish', 'else'],
    required: true
  },

  // 關聯餐點（如果是餐點庫存）
  dish: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DishTemplate',
    required: function () {
      return this.inventoryType === 'dish';
    }
  },

  // 庫存項目名稱（餐點名稱或原料名稱）
  itemName: {
    type: String,
    required: true
  },

  // 倉庫庫存（實際總庫存）
  warehouseStock: {
    type: Number,
    default: 0,
    min: 0
  },

  // (可選)可販售庫存，顯示給客人看得
  availableStock: {
    type: Number,
    default: 0,
    min: 0,
    validate: {
      validator: function (value) {
        return value <= this.warehouseStock;
      },
      message: '可使用庫存不能超過倉庫庫存'
    }
  },

  // 最低庫存警告值
  minStockAlert: {
    type: Number,
    default: 0,
    min: 0
  },

  // 最高庫存限制（避免過量庫存）
  maxStockAlert: {
    type: Number,
    min: 0
  },

  // 是否追蹤庫存
  isInventoryTracked: {
    type: Boolean,
    default: true
  },

  // 是否顯示庫存數量給客人（只有餐點類型才有可能需要）
  showAvailableStockToCustomer: {
    type: Boolean,
    default: false
  },

}, { timestamps: true });


// 索引
inventorySchema.index({ store: 1 })

// 虛擬屬性
// 是否需要補貨
inventorySchema.virtual('needsRestock').get(function () {
  return this.isInventoryTracked && this.warehouseStock <= this.minStockAlert;
});

// 是否庫存過多
inventorySchema.virtual('isOverstock').get(function () {
  return this.maxStockLimit && this.warehouseStock > this.maxStockLimit;
});

// 顯示給客人的庫存（根據設定決定）
inventorySchema.virtual('customerVisibleStock').get(function () {
  if (!this.showAvailableStockToCustomer) return null;
  return this.availableStock;
});

// 是否售罄（用於餐點）
inventorySchema.virtual('isSoldOut').get(function () {
  if (!this.isInventoryTracked) return false;
  return this.availableStock === 0;
});

export default mongoose.model('Inventory', inventorySchema);
