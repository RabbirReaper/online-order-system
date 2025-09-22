import mongoose from 'mongoose'

const platformStoreSchema = new mongoose.Schema(
  {
    // ========================================
    // 📌 基本關聯
    // ========================================
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
      // 功能：關聯到品牌，用於權限控制和數據隔離
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      // 功能：關聯到實體店鋪，用於訂單配對和菜單同步
    },

    // ========================================
    // 🏪 平台識別
    // ========================================
    platform: {
      type: String,
      enum: ['foodpanda', 'ubereats'],
      required: true,
      // 功能：識別是哪個外送平台，決定使用哪套 API
    },
    platformStoreId: {
      type: String,
      required: true,
      trim: true,
      // 功能：平台分配的店鋪 ID，用於 API 調用和 webhook 識別
      // 範例：Uber Eats 的 store_id, Foodpanda 的 vendor_code
    },

    // ========================================
    // ⚡ 營運狀態
    // ========================================
    status: {
      type: String,
      enum: ['ONLINE', 'BUSY', 'OFFLINE'],
      default: 'OFFLINE',
      // 功能：即時營運狀態
      // ONLINE  = 接受訂單
      // BUSY  = 忙碌
      // OFFLINE = 不接受訂單（營業時間外或手動關閉）
    },

    // ========================================
    // 🔗 整合設定
    // ========================================

    menuLastSync: {
      type: Date,
    },

    prepTime: { type: Number, default: 30 }, // 準備時間（分鐘）
    busyPrepTime: { type: Number, default: 45 }, // 忙碌時準備時間（分鐘）

    // ========================================
    // 🛵 訂單設定
    // ========================================
    autoAccept: {
      type: Boolean,
      default: true,
      // 功能：是否自動接單
      // true  = 自動接受所有訂單
      // false = 需要店員手動確認
    },

    // ========================================
    // 🎛️ 平台特定設定
    // ========================================
    platformSpecific: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      // 功能：存放各平台獨有的設定
      // Uber Eats: { robocallEnabled, multiCourierEnabled }
      // Foodpanda: { vendorCode, commissionRate }
    },

    isActive: {
      type: Boolean,
      default: false,
      // 功能：軟刪除標記
      // true  = 啟用
      // false = 停用（不刪除資料）
    },
  },
  {
    timestamps: true,
    // 功能：自動記錄 createdAt 和 updatedAt
  },
)

// ========================================
// 📑 索引設定
// ========================================
// 確保一個店鋪在同一平台只有一個配置
platformStoreSchema.index({ brand: 1, store: 1, platform: 1 }, { unique: true })

export default mongoose.model('PlatformStore', platformStoreSchema)
