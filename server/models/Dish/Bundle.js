import mongoose from 'mongoose';

// 套餐模型 - 處理批量和混合購買（餐點+兌換券）
const bundleSchema = new mongoose.Schema({
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  },
  name: {
    type: String,
    trim: true,
    required: true
  }, // 套餐名稱，例如：豬排兌換券x10 + 牛排餐x2，早晨套餐
  description: {
    type: String,
    required: true
  }, // 套餐描述，例如：買10送1，混合優惠套餐

  // 套餐內容 - 包含的商品類型和數量
  bundleItems: [{
    // 商品類型
    itemType: {
      type: String,
      enum: ['dish', 'coupon'],
      required: true
    },

    // === 餐點相關（當 itemType = 'dish' 時使用） ===
    dishTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DishTemplate',
      required: function () {
        return this.itemType === 'dish';
      }
    }, // 關聯的餐點模板

    // === 兌換券相關（當 itemType = 'coupon' 時使用） ===
    couponTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CouponTemplate',
      required: function () {
        return this.itemType === 'coupon';
      }
    }, // 關聯的兌換券模板

    quantity: {
      type: Number,
      required: true,
      min: 1
    }, // 該類型商品的數量

    // 冗餘存儲，方便顯示
    itemName: {
      type: String,
      required: true
    } // 商品名稱（可以是餐點名或兌換券名）
  }],

  // 定價策略
  originalPrice: {
    type: Number,
  },
  // 優惠價格（實際售價）
  sellingPrice: {
    type: Number,
  },
  originalPoint: {
    type: Number,
  },
  // 優惠價格（實際售價）
  sellingPoint: {
    type: Number,
  },

  // 狀態和統計
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// 索引
bundleSchema.index({ brand: 1 });

export default mongoose.model('Bundle', bundleSchema);
