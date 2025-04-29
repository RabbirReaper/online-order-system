import mongoose from "mongoose";

const DishInstanceSchema = new mongoose.Schema({
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DishTemplate',
    required: true
  },
  // 冗餘儲存一些模板資訊
  name: { type: String, required: true },
  basePrice: { type: Number, required: true },
  // 客製化選項
  options: [{
    _id: false,
    optionCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'OptionCategory' },
    optionCategoryName: { type: String, required: true },
    selections: [{
      optionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Option' },
      name: { type: String, required: true },
      price: { type: Number, default: 0 }
    }]
  }],
  specialInstructions: { type: String, maxlength: 200 }, // 特殊要求
  finalPrice: { type: Number, required: true }, // 計算後的最終價格
}, { timestamps: true });

export default mongoose.model("DishInstance", DishInstanceSchema)
