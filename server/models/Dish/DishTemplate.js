import mongoose from 'mongoose'

// DishTemplate 模型
const DishTemplateSchema = new mongoose.Schema({
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
  name: { type: String, trim: true, required: true },
  basePrice: { type: Number, required: true },
  optionCategories: [
    {
      categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'OptionCategory' },
      order: { type: Number, default: 0 },
    },
  ],
  image: {
    url: { type: String, required: false }, // 圖片的實際連結，例如 R2 上的公網地址（非必要）
    key: { type: String, required: false }, // 儲存在 R2 的 object key（等同於檔名，可用於刪除）（非必要）
    alt: { type: String }, // 可選：給前端 img alt 屬性
  },
  description: { type: String },
  tags: [{ type: String }],
})

DishTemplateSchema.index({ brand: 1 })

export default mongoose.model('DishTemplate', DishTemplateSchema)
