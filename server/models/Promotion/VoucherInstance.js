import mongoose from 'mongoose'

const voucherInstanceSchema = new mongoose.Schema(
  {
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VoucherTemplate',
      required: true,
    },
    voucherName: {
      type: String,
      required: true,
    },
    exchangeDishTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DishTemplate',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BundleInstance',
    }, // 新增：記錄由哪個 BundleInstance 創建
    isUsed: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
    },
    acquiredAt: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
)

voucherInstanceSchema.index({ brand: 1, user: 1 })

export default mongoose.model('VoucherInstance', voucherInstanceSchema)
