import mongoose from 'mongoose';

const voucherInstanceSchema = new mongoose.Schema({
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  },
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VoucherTemplate',
    required: true
  },
  voucherName: {
    type: String,
    required: true
  },
  exchangeDishTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DishTemplate',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  acquiredAt: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
}, { timestamps: true });

voucherInstanceSchema.index({ brand: 1, user: 1 });

export default mongoose.model('VoucherInstance', voucherInstanceSchema);
