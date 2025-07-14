import mongoose from 'mongoose'

const voucherTemplateSchema = new mongoose.Schema(
  {
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
    },
    name: {
      type: String,
      trim: true,
      required: true,
    },
    description: {
      type: String,
    },
    exchangeDishTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DishTemplate',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    totalIssued: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
)

voucherTemplateSchema.index({ brand: 1 })

export default mongoose.model('VoucherTemplate', voucherTemplateSchema)
