import mongoose from 'mongoose'

// 訂單模型
const orderSchema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    }, // 關聯店鋪
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
    }, // 關聯品牌
    orderDateCode: {
      type: String,
      required: true,
    }, // 例如 '240410'
    sequence: {
      type: Number,
      required: true,
    }, // 當天第幾筆訂單
    deliveryPlatform: {
      type: String,
      enum: ['', 'foodpanda', 'ubereats', 'other'],
      default: '',
    },
    platformOrderId: {
      type: String,
      default: '',
    }, // 外送平台訂單ID

    // === 新增：外送平台詳細資訊 ===
    platformInfo: {
      // 平台名稱
      platform: {
        type: String,
        enum: ['direct', 'foodpanda', 'ubereats'],
        default: 'direct', // direct 表示直接下單（非外送平台）
      },
      // 平台訂單ID
      platformOrderId: { type: String },
      // 平台訂單狀態
      platformStatus: { type: String },
      // 平台顧客資訊
      platformCustomerInfo: {
        customerId: { type: String },
        customerName: { type: String },
        customerPhone: { type: String },
      },
      // 平台特定的訂單資料（原始JSON）
      rawOrderData: { type: mongoose.Schema.Types.Mixed },
      // 最後同步時間
      lastSyncAt: { type: Date },
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }, // 關聯用戶 (如果是登入用戶)
    orderType: {
      type: String,
      enum: ['dine_in', 'takeout', 'delivery'], // 新增混合購買類型
      required: true,
    }, // 訂單類型
    status: {
      type: String,
      enum: ['unpaid', 'paid', 'cancelled', 'pending_payment'],
      // 狀態說明：
      // - unpaid: 現場付款未付（isFinalized: true）
      // - pending_payment: 線上付款等待中（isFinalized: false）
      // - paid: 已付款完成（isFinalized: true）
      // - cancelled: 已取消
      default: 'unpaid',
    }, // 訂單狀態

    // 修改後的 items 結構 - 支援混合購買
    items: [
      {
        itemType: {
          type: String,
          enum: ['dish', 'bundle'],
          required: true,
          default: 'dish', // 向後兼容，預設為餐點
        }, // 項目類型

        // 餐點相關（當 itemType = 'dish' 時使用）
        dishInstance: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'DishInstance',
          required: function () {
            return this.itemType === 'dish'
          },
        }, // 關聯餐點實例

        // 兌換券綑綁相關（當 itemType = 'bundle' 時使用）
        bundleInstance: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'BundleInstance',
          required: function () {
            return this.itemType === 'bundle'
          },
        }, // 關聯 Bundle 實例

        // 共用欄位
        quantity: {
          type: Number,
          required: true,
          min: 1,
        }, // 數量
        subtotal: {
          type: Number,
          required: true,
        }, // 小計金額 (unitPrice * quantity)

        // 額外資訊
        itemName: {
          type: String,
          required: true,
        }, // 項目名稱（冗餘存儲，方便顯示）
        note: {
          type: String,
        }, // 備註

        // === 新增：外送平台項目對應 ===
        platformItemId: { type: String }, // 外送平台的商品ID
      },
    ], // 訂單項目

    // 金額相關
    dishSubtotal: {
      type: Number,
      default: 0,
    }, // 餐點小計
    bundleSubtotal: {
      type: Number,
      default: 0,
    }, // Bundle 小計
    subtotal: {
      type: Number,
      required: true,
    }, // 總小計 (dishSubtotal + bundleSubtotal)
    serviceCharge: {
      type: Number,
      default: 0,
    }, // 服務費
    discounts: [
      {
        discountModel: {
          type: String,
          enum: ['CouponInstance', 'VoucherInstance'],
          required: true,
        }, // 折扣類型
        refId: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: 'discounts.discountModel',
          required: true,
        }, // 動態引用 ID
        amount: {
          type: Number,
          required: true,
        }, // 折抵金額
      },
    ], // 折扣資訊
    manualAdjustment: {
      type: Number,
      default: 0,
    }, // 手動調整金額
    totalDiscount: {
      type: Number,
      default: 0,
    }, // 折扣總額
    total: {
      type: Number,
      required: true,
    }, // 訂單總額

    // 新增：點數獎勵資訊
    pointsEarned: {
      type: Number,
      default: 0,
    }, // 此訂單獲得的點數
    paymentType: {
      type: String,
      enum: ['On-site', 'Online'],
      required: true,
    }, // 付款類型
    paymentMethod: {
      // 注意需與 Store.js payments 一致
      type: String,
      enum: ['cash', 'credit_card', 'line_pay', 'other', ''],
    }, // 付款方式
    onlinePaymentCode: { type: String }, // 線上付款代碼 (例如：LINE Pay)

    // === 新增：線上付款相關資訊 ===
    onlinePayment: {
      platform: {
        type: String,
        enum: ['newebpay', 'tappay', ''],
        default: '',
      }, // 金流平台
      merchantOrderNo: { type: String }, // 商店訂單編號（給金流平台用）
      tradeNo: { type: String }, // 金流平台交易編號
      paymentType: { type: String }, // 付款方式（CREDIT, WEBATM, VACC...）
      respondCode: { type: String }, // 回應碼
      respondMessage: { type: String }, // 回應訊息
      payTime: { type: Date }, // 付款時間
    },

    customerInfo: {
      name: { type: String }, // 顧客名稱
      lineUniqueId: { type: String }, // 顧客 LINE Unique ID
      phone: { type: String }, // 顧客電話
    }, // 顧客資訊
    deliveryInfo: {
      address: {
        type: String,
      },
      estimatedTime: { type: Date }, // 預計送達時間
      actualTime: { type: Date }, // 實際送達時間
      deliveryFee: { type: Number, default: 0 }, // 配送費用

      // === 新增：外送平台配送資訊 ===
      platformDeliveryInfo: {
        courierName: { type: String }, // 外送員姓名
        courierPhone: { type: String }, // 外送員電話
        trackingUrl: { type: String }, // 追蹤連結
        estimatedArrival: { type: Date }, // 平台預估送達時間
      },
    }, // 配送信息 (僅適用於外送訂單)
    dineInInfo: {
      tableNumber: { type: String }, // 桌號
    }, // 內用信息 (僅適用於內用訂單)
    estimatedPickupTime: {
      type: Date,
    }, // 預計取餐時間 (僅適用於外帶訂單)
    notes: {
      type: String,
    }, // 訂單備註
    cancelReason: {
      type: String,
    }, // 取消原因
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'cancelledByModel',
    }, // 取消者ID
    cancelledByModel: {
      type: String,
      enum: ['User', 'Admin'],
    }, // 取消者類型
    cancelledAt: {
      type: Date,
    }, // 取消時間
    isFinalized: {
      type: Boolean,
      default: true,
      // 用在線上付款等待時改為 false，確認付款後再改回 true
    },
  },
  { timestamps: true },
)

// 索引
orderSchema.index({ brand: 1, store: 1 })
orderSchema.index({ brand: 1, user: 1 })

export default mongoose.model('Order', orderSchema)
