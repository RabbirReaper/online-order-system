import mongoose from 'mongoose';

// 綑綁模型 - 統一管理所有兌換券包裝（用於販賣）
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
  }, // 綑綁名稱，例如：豬排兌換券、豬排兌換券x10綑綁
  description: {
    type: String,
    required: true
  }, // 綑綁描述，例如：單個兌換券、買10送2超值優惠綑綁
  image: {
    url: {
      type: String,
      required: true
    }, // 圖片URL
    key: {
      type: String,
      required: true
    } // S3/雲端儲存的key，用於刪除圖片
  }, // Bundle 的主要顯示圖片

  // 綑綁內容 - 包含兌換券模板
  bundleItems: [{
    voucherTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VoucherTemplate',
      required: true
    }, // 關聯的兌換券模板

    quantity: {
      type: Number,
      required: true,
      min: 1
    }, // 該券的數量

    // 冗餘存儲，方便顯示
    voucherName: {
      type: String,
      required: true
    } // 兌換券名稱
  }],

  // 雙重定價策略
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

  // 時限控制
  validFrom: {
    type: Date,
  }, // 購買開始時間
  validTo: {
    type: Date,
  }, // 購買結束時間
  voucherValidityDays: {
    type: Number,
    required: true,
    min: 1,
    default: 30
  }, // 生成兌換券的有效期天數(從購買當天開始計算)

  // 購買限制
  purchaseLimitPerUser: {
    type: Number,
    min: 1,
    default: null
  }, // 每人限購數量，null = 不限制

  // 狀態控制
  isActive: {
    type: Boolean,
    default: true
  }, // 手動啟用/停用
  autoStatusControl: {
    type: Boolean,
    default: true
  }, // 是否自動根據時間啟用/停用

  // 統計
  totalSold: {
    type: Number,
    default: 0,
    min: 0
  }, // 總銷售數量

}, { timestamps: true });

// 索引
bundleSchema.index({ brand: 1 });

// 虛擬屬性 - 檢查是否在有效期內
bundleSchema.virtual('isInValidPeriod').get(function () {
  const now = new Date();
  return now >= this.validFrom && now <= this.validTo;
});

// 虛擬屬性 - 檢查是否可購買
bundleSchema.virtual('isPurchasable').get(function () {
  if (!this.isActive) return false;
  if (this.autoStatusControl && !this.isInValidPeriod) return false;
  return true;
});

export default mongoose.model('Bundle', bundleSchema);
