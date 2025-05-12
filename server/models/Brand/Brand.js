import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  }, // 品牌名稱
  description: {
    type: String
  }, // 品牌描述
  image: {
    url: { type: String },    // 圖片的實際連結，例如 R2 上的公網地址
    key: { type: String },    // 儲存在 R2 的 object key（等同於檔名，可用於刪除）
    alt: { type: String }     // 可選：給前端 img alt 屬性
  },
  isActive: {
    type: Boolean,
    default: true
  }, // 品牌是否啟用
}, { timestamps: true });

export default mongoose.model('Brand', brandSchema);
