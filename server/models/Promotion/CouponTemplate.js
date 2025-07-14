import mongoose from 'mongoose'

const couponTemplateSchema = new mongoose.Schema(
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
    discountInfo: {
      discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true,
      },
      discountValue: {
        type: Number,
        required: true,
      },
      maxDiscountAmount: {
        type: Number,
      },
      minPurchaseAmount: {
        type: Number,
        default: 0,
      },
    },
    validityPeriod: {
      type: Number,
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

couponTemplateSchema.index({ brand: 1 })

export default mongoose.model('CouponTemplate', couponTemplateSchema)
