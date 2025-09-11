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

cashFlowSchema.index({ brand: 1, store: 1, time: -1 })

export default mongoose.model('CashFlow', cashFlowSchema)
