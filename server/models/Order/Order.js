import mongoose from 'mongoose';

// 訂單模型
const orderSchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  }, // 關聯店鋪
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  }, // 關聯品牌
  orderDateCode: {
    type: String,
    required: true
  }, // 例如 '240410'
  sequence: {
    type: Number,
    required: true
  },  // 當天第幾筆訂單
  deliveryPlatform: {
    type: String,
    enum: ['', 'foodpanda', 'ubereats', 'other'],
    default: ''
  },
  platformOrderId: {
    type: String,
    default: ''
  },// 外送平台訂單ID
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }, // 關聯用戶 (如果是登入用戶)
  orderType: {
    type: String,
    enum: ['dine_in', 'takeout', 'delivery'],
    required: true
  }, // 訂單類型
  status: {
    type: String,
    enum: ['unpaid', 'paid', 'cancelled'],
    default: 'unpaid'
  }, // 訂單狀態
  items: [{
    dishInstance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DishInstance',
      required: true
    }, // 關聯餐點實例
    quantity: {
      type: Number,
      required: true,
      min: 1
    }, // 數量
    subtotal: {
      type: Number,
      required: true
    }, // 小計金額
    note: {
      type: String
    }
  }], // 訂單餐點
  subtotal: {
    type: Number,
    required: true
  }, // 餐點小計
  serviceCharge: {
    type: Number,
    default: 0
  }, // 服務費
  discounts: [{
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CouponInstance'
    }, // 優惠券 ID
    amount: {
      type: Number,
      required: true
    }, // 折抵金額
  }], // 折扣資訊
  manualAdjustment: {
    type: Number,
    default: 0
  }, // 手動調整金額
  totalDiscount: {
    type: Number,
    default: 0
  }, // 折扣總額
  total: {
    type: Number,
    required: true
  }, // 訂單總額
  paymentType: {
    type: String,
    enum: ['On-site', 'Online'],
    required: true
  }, // 付款類型
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'line_pay', 'other'],
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
    deliveryFee: { type: Number, default: 0 } // 配送費用
  }, // 配送信息 (僅適用於外送訂單)
  dineInInfo: {
    tableNumber: { type: String }, // 桌號
    numberOfGuests: { type: Number, default: 1 }, // 用餐人數
  }, // 內用信息 (僅適用於內用訂單)
  estimatedPickupTime: {
    type: Date
  }, // 預計取餐時間 (僅適用於外帶訂單)
  notes: {
    type: String
  }, // 訂單備註
  cancelReason: {
    type: String
  }, // 取消原因
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'cancelledByModel'
  }, // 取消者ID
  cancelledByModel: {
    type: String,
    enum: ['User', 'Admin']
  }, // 取消者類型
  cancelledAt: {
    type: Date
  }, // 取消時間
}, { timestamps: true });

orderSchema.index({ brand: 1, store: 1 });
orderSchema.index({ brand: 1, user: 1 });


export default mongoose.model('Order', orderSchema);
