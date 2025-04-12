import mongoose from 'mongoose';
import { DateTime } from 'luxon';

// 訂單模型
const orderSchema = new mongoose.Schema({
  orderDateCode: {
    type: String,
    required: true
  }, // 例如 '240410'
  sequence: {
    type: Number,
    required: true
  },  // 當天第幾筆訂單
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
    enum: ['pending', 'confirmed', 'preparing', 'completed', 'cancelled'], // 目前只會用到'pending','completed', 'cancelled'
    default: 'pending'
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
    } // 小計金額
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
    required: true
  }, // 付款方式
  onlinePaymentCode: { type: String }, // 線上付款代碼 (例如：LINE Pay)
  customerInfo: {
    name: { type: String }, // 顧客名稱
    phone: { type: String }, // 顧客電話
  }, // 顧客資訊
  deliveryInfo: {
    address: {
      type: String,
      required: true
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

// 自動生成訂單編號
orderSchema.pre('save', async function (next) {
  if (this.isNew) {
    // 使用台灣時間（UTC+8）
    const taiwanNow = DateTime.now().setZone('Asia/Taipei');
    const orderDateCode = taiwanNow.toFormat('yyLLdd'); // e.g. '240410'
    this.orderDateCode = orderDateCode;

    // 查找今天的最後一個訂單（根據相同的 orderDateCode）
    const lastOrder = await this.constructor.findOne({
      orderDateCode
    }).sort({ sequence: -1 });

    this.sequence = lastOrder ? lastOrder.sequence + 1 : 1;
  }
  next();
});

// 取消訂單的方法
orderSchema.methods.cancelOrder = async function (reason, cancelledBy, cancelledByModel) {
  if (this.status === 'completed') {
    throw new Error('已完成的訂單無法取消');
  }

  if (this.status === 'cancelled') {
    throw new Error('訂單已經被取消');
  }

  // 設置取消信息
  this.status = 'cancelled';
  this.cancelReason = reason;
  this.cancelledBy = cancelledBy;
  this.cancelledByModel = cancelledByModel;
  this.cancelledAt = new Date();

  await this.save();
  return this;
};

export default mongoose.model('Order', orderSchema);
