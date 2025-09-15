/**
 * 支付交易模型 - 簡化版
 * server/models/Payment/Transaction.js
 */

import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema(
  {
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
    }, // 關聯品牌
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    }, // 關聯店鋪
    // 關聯訂單 (付款成功後才會有)
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: false,
      index: true,
    },

    // 臨時訂單資訊 (付款前儲存，成功後移至正式訂單)
    tempOrderData: {
      customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      customerInfo: {
        name: String,
        phone: String,
      },
      items: [
        {
          dishId: mongoose.Schema.Types.ObjectId,
          name: String,
          price: Number,
          quantity: Number,
        },
      ],
      totalAmount: Number,
      orderType: {
        type: String,
        enum: ['dine_in', 'takeout', 'delivery'],
      },
    },

    // 支付閘道交易 ID
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },

    // 支付金額
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // 支付方式
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'line_pay', 'apple_pay', 'google_pay', 'cash'],
      required: true,
    },

    // 交易狀態
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },

    // 支付閘道回應 (僅儲存關鍵資訊)
    processorResponse: {
      status: String,
      message: String,
      paymentId: String,
    },

    // 失敗原因
    failureReason: {
      type: String,
    },

    // 時間戳
    initiatedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

// 核心索引 (最多2個)
// transactionSchema.index({ transactionId: 1 })           // 主要查詢索引
// transactionSchema.index({ orderId: 1, status: 1 })      // 訂單交易查詢

export default mongoose.model('Transaction', transactionSchema)
