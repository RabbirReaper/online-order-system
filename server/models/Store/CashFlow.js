import mongoose from 'mongoose'

const cashFlowSchema = new mongoose.Schema({
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true,
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CashFlowCategory',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true,
  },
  time: {
    type: Date,
    required: true,
    default: Date.now,
  },
  description: {
    type: String,
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
})

// 索引：優化查詢性能（符合 ESR 規則：Equality-Sort-Range）
// 查詢模式：{ store, type?, time } + sort({ time: -1 })
cashFlowSchema.index({ store: 1, type: 1, time: -1 })

export default mongoose.model('CashFlow', cashFlowSchema)
