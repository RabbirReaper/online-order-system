import mongoose from 'mongoose';

const stockLogSchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  dish: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DishTemplate',
    required: true
  },
  dishName: {
    type: String,
    required: true
  },
  previousStock: {
    type: Number,
    required: true
  },
  newStock: {
    type: Number,
    required: true
  },
  changeAmount: {
    type: Number,
    required: true
  },
  changeType: {
    type: String,
    enum: ['manual_add', 'manual_subtract', 'order', 'system_adjustment', 'initial_stock'],
    required: true
  },
  reason: {
    type: String,
    validate: {
      validator: function (val) {
        if (['manual_add', 'manual_subtract'].includes(this.changeType)) {
          return !!val;
        }
        return true;
      },
      message: '手動調整時必須提供原因'
    }
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, { timestamps: true });

export default mongoose.model('StockLog', stockLogSchema);
