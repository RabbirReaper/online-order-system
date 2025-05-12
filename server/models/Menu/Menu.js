import mongoose from 'mongoose';

const menuSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: true
  }, // 菜單名稱
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  }, // 所屬店鋪
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  }, // 所屬品牌
  categories: [{
    name: { type: String, trim: true, required: true }, // 分類名稱
    description: { type: String }, // 分類描述
    order: { type: Number, default: 0 }, // 分類順序
    dishes: [{
      dishTemplate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DishTemplate',
        required: true
      }, // 關聯的餐點模板
      price: { type: Number }, // 特定店鋪的價格覆蓋 (如果為null則使用模板價格)
      isPublished: { type: Boolean, default: true }, // 該餐點在菜單上是否顯示
      order: { type: Number, default: 0 }, // 在分類中的顯示順序
    }]
  }],
  isActive: {
    type: Boolean,
    default: true
  }, // 菜單是否啟用
}, { timestamps: true });

menuSchema.index({ brand: 1, store: 1 });

export default mongoose.model('Menu', menuSchema);
