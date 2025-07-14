import mongoose from 'mongoose'

const inventorySchema = new mongoose.Schema(
  {
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },

    // 庫存類型：餐點或原料
    inventoryType: {
      type: String,
      enum: ['DishTemplate', 'else'],
      required: true,
    },

    // 關聯餐點（如果是餐點庫存）
    dish: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DishTemplate',
      required: function () {
        return this.inventoryType === 'DishTemplate'
      },
    },

    // 庫存項目名稱（餐點名稱或原料名稱）
    itemName: {
      type: String,
      trim: true,
      required: true,
    },

    // 實際總庫存
    totalStock: {
      type: Number,
      default: 0,
      min: 0,
    },

    // 是否啟用 availableStock 機制（如每日限量）
    enableAvailableStock: {
      type: Boolean,
      default: false,
    },

    // 可販售庫存（僅當 enableAvailableStock 為 true 時有效）
    availableStock: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: function (value) {
          if (!this.enableAvailableStock) return true
          return value <= this.totalStock
        },
        message: '可使用庫存不能超過總庫存',
      },
    },

    // 最低庫存警告值
    minStockAlert: {
      type: Number,
      default: 0,
      min: 0,
    },

    // 補貨時應補足的目標庫存量
    targetStockLevel: {
      type: Number,
      min: 0,
    },

    // 是否啟用庫存系統（會根據點餐扣庫存）
    isInventoryTracked: {
      type: Boolean,
      default: false,
    },

    // 是否強制設為售完（即使沒啟用庫存系統）
    isSoldOut: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
)

// 索引
inventorySchema.index({ store: 1 })

// 虛擬屬性
// 是否需要補貨
inventorySchema.virtual('needsRestock').get(function () {
  return this.isInventoryTracked && this.totalStock <= this.minStockAlert
})

export default mongoose.model('Inventory', inventorySchema)
