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
})

cashFlowCategorySchema.index({ brand: 1 })
cashFlowCategorySchema.index({ store: 1, name: 1 }, { unique: true })

export default mongoose.model('CashFlowCategory', cashFlowCategorySchema)
