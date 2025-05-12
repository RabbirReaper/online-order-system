import mongoose from 'mongoose';

/*
refDishTemplate 可選
用在庫存管理時可以連動
*/

const OptionSchema = new mongoose.Schema({
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
  name: { type: String, trim: true, required: true },
  refDishTemplate: { type: mongoose.Schema.Types.ObjectId, ref: 'DishTemplate' },
  price: { type: Number, default: 0 },
});

OptionSchema.index({ brand: 1 });

export default mongoose.model('Option', OptionSchema);
