import mongoose from "mongoose";

const BundleInstanceSchema = new mongoose.Schema({
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bundle',
    required: true
  },
  // 冗餘儲存一些模板資訊
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  originalPrice: {
    type: Number,
    required: true
  },
  sellingPrice: {
    type: Number,
    required: true
  },
  originalPoint: {
    type: Number,
    default: 0
  },
  sellingPoint: {
    type: Number,
    default: 0
  },

  // Bundle 內容 - 冗餘存儲
  bundleItems: [{
    couponTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CouponTemplate'
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    couponName: {
      type: String,
      required: true
    }
  }],

  // Bundle 不需要客製化選項，價格就是 sellingPrice
  finalPrice: {
    type: Number,
    required: true
  },

  // 購買相關資訊
  purchasedAt: {
    type: Date,
    default: Date.now
  },
  couponValidityDays: {
    type: Number,
    required: true,
    min: 1,
    default: 30
  }

}, { timestamps: true });

BundleInstanceSchema.index({ brand: 1 });
BundleInstanceSchema.index({ templateId: 1 });

export default mongoose.model("BundleInstance", BundleInstanceSchema);
