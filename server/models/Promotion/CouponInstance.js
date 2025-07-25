import mongoose from 'mongoose'

const couponInstanceSchema = new mongoose.Schema(
  {
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CouponTemplate',
      required: true,
    },
    couponName: {
      type: String,
      required: true,
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
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    acquiredAt: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    // 🆕 新增發放相關欄位
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    issueReason: {
      type: String,
      default: '活動獎勵',
    },
  },
  { timestamps: true },
)

couponInstanceSchema.index({ brand: 1, user: 1 })

export default mongoose.model('CouponInstance', couponInstanceSchema)
