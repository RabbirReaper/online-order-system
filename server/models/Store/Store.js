import mongoose from 'mongoose'

const storeSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true }, // 店家名稱
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true }, // 所屬品牌
    businessHours: [
      {
        day: { type: Number, min: 0, max: 6, required: true },
        periods: [
          {
            open: { type: String, required: true }, // "HH:MM"
            close: { type: String, required: true }, // "HH:MM"
          },
        ],
        isClosed: { type: Boolean, default: false },
      },
    ], // 營業時間
    menuId: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu' }, // 菜單
    announcements: [
      {
        title: { type: String, required: true }, // 公告名稱
        content: { type: String, required: true }, // 公告內容
      },
    ], // 店家公告
    image: {
      url: { type: String, required: true }, // 圖片的實際連結，例如 R2 上的公網地址
      key: { type: String, required: true }, // 儲存在 R2 的 object key（等同於檔名，可用於刪除）
      alt: { type: String }, // 可選：給前端 img alt 屬性
    }, // 店家圖片
    address: { type: String, required: true }, // 店家地址
    phone: { type: String, required: true }, // 電話
    isActive: { type: Boolean, default: true }, // 店家是否啟用

    // === 新增的功能設定欄位 ===
    enableLineOrdering: { type: Boolean, default: false }, // 啟用LINE點餐
    liffId: { type: String, trim: true }, // LINE LIFF應用程式ID
    showTaxId: { type: Boolean, default: false }, // 顯示統一編號欄位
    provideReceipt: { type: Boolean, default: true }, // 提供收據

    // === 服務類型設定 ===
    enableDineIn: { type: Boolean, default: true }, // 啟用內用
    enableTakeOut: { type: Boolean, default: true }, // 啟用外帶
    enableDelivery: { type: Boolean, default: false }, // 啟用外送

    // === 準備時間設定 ===
    dineInPrepTime: { type: Number, min: 0, default: 15 }, // 內用準備時間（分鐘）
    takeOutPrepTime: { type: Number, min: 0, default: 10 }, // 外帶準備時間（分鐘）
    deliveryPrepTime: { type: Number, min: 0, default: 30 }, // 外送準備時間（分鐘）

    // === 外送相關設定 ===
    minDeliveryAmount: { type: Number, min: 0, default: 0 }, // 最低外送金額（元）
    minDeliveryQuantity: { type: Number, min: 1, default: 1 }, // 最少外送數量（項）
    maxDeliveryDistance: { type: Number, min: 0, default: 5 }, // 最長外送距離（公里）

    // === 預訂設定 ===
    advanceOrderDays: { type: Number, min: 0, default: 0 }, // 可預訂天數（天）
    // 0: 只有立即選項
    // 1: 只開放當天點餐
    // 2: 可預訂隔天
    // 以此類推...

    // === 新增：外送平台整合 ===
    deliveryPlatforms: [
      {
        platform: {
          type: String,
          enum: ['foodpanda', 'ubereats'],
          required: true,
        },
        storeId: {
          type: String, // 該平台分配給店家的ID
          required: true,
          trim: true,
        },
        isEnabled: {
          type: Boolean,
          default: false, // 預設未啟用，需要經過 provisioning 後才啟用
        },
        settings: {
          autoAcceptOrders: { type: Boolean, default: true },
          prepTime: { type: Number, default: 30 }, // 準備時間（分鐘）
        },
        lastSyncAt: { type: Date },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
)

storeSchema.index({ brand: 1 })

export default mongoose.model('Store', storeSchema)
