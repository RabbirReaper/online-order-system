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
      enum: ['unpaid', 'paid', 'cancelled'],
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

        // 兌換券生成記錄（當 itemType = 'bundle' 時使用）
        generatedVouchers: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'VoucherInstance',
          },
        ], // 購買後生成的兌換券實例
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
        couponId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'CouponInstance',
        }, // 優惠券 ID
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
      type: String,
      enum: ['cash', 'credit_card', 'line_pay', 'other', ''],
    }, // 付款方式
    onlinePaymentCode: { type: String }, // 線上付款代碼 (例如：LINE Pay)
    customerInfo: {
      name: { type: String }, // 顧客名稱
      phone: { type: String }, // 顧客電話
    }, // 顧客資訊
    deliveryInfo: {
      address: {
        type: String,
      },
      estimatedTime: { type: Date }, // 預計送達時間
      actualTime: { type: Date }, // 實際送達時間
      deliveryFee: { type: Number, default: 0 }, // 配送費用
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
  },
  { timestamps: true },
)

// 索引
orderSchema.index({ brand: 1, store: 1 })
orderSchema.index({ brand: 1, user: 1 })

export default mongoose.model('Order', orderSchema)
