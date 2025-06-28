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

  // 統一的價格結構
  cashPrice: {
    original: {
      type: Number,
      min: 0
    }, // 現金原價
    selling: {
      type: Number,
      min: 0
    } // 現金售價
  },
  pointPrice: {
    original: {
      type: Number,
      min: 0
    }, // 點數原價
    selling: {
      type: Number,
      min: 0
    } // 點數售價
  },
  sellingPoint: {
    type: Number
  }, // 賣點數值

  // Bundle 內容 - 冗餘存儲
  bundleItems: [{
    voucherTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VoucherTemplate'
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    voucherName: {
      type: String,
      required: true
    }
  }],

  // Bundle 不需要客製化選項，價格根據付款方式決定
  finalPrice: {
    type: Number,
    required: true
  },

  // 購買相關資訊
  purchasedAt: {
    type: Date,
    default: Date.now
  },
  voucherValidityDays: {
    type: Number,
    required: true,
    min: 1,
    default: 30
  }

}, { timestamps: true });

BundleInstanceSchema.index({ brand: 1 });
BundleInstanceSchema.index({ templateId: 1 });

export default mongoose.model("BundleInstance", BundleInstanceSchema);
