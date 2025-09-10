import mongoose from 'mongoose'

const cashFlowCategorySchema = new mongoose.Schema({
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
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true,
  },
  icon: {
    type: String,
    default: 'fa-money-bill',
  },
  color: {
    type: String,
    default: '#007bff',
  },
})

cashFlowCategorySchema.index({ brand: 1 })

export default mongoose.model('CashFlowCategory', cashFlowCategorySchema)
