import mongoose from 'mongoose';

/*
refDishTemplate 可選
用在庫存管理時可以連動
*/

const OptionSchema = new mongoose.Schema({
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
  name: { type: String, required: true },
  refDishTemplate: { type: mongoose.Schema.Types.ObjectId, ref: 'DishTemplate' },
  price: { type: Number, default: 0 },
});

export default mongoose.model('Option', OptionSchema);
