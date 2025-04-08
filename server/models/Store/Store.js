import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }, // 店家名稱
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  }, // 所屬品牌
  businessHours: [{
    day: { type: Number, min: 0, max: 6, required: true },
    periods: [{
      open: { type: String, required: true },  // "HH:MM"
      close: { type: String, required: true }, // "HH:MM"
    }],
    isClosed: { type: Boolean, default: false }
  }]
  , // 營業時間
  menuId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Menu'
  }, // 菜單
  announcements: [{
    title: { type: String, required: true }, // 公告名稱
    content: { type: String, required: true }, // 公告內容
  }], // 店家公告
  image: {
    url: { type: String, required: true },    // 圖片的實際連結，例如 R2 上的公網地址
    key: { type: String, required: true },    // 儲存在 R2 的 object key（等同於檔名，可用於刪除）
    alt: { type: String }                     // 可選：給前端 img alt 屬性
  }, // 店家圖片
  isActive: {
    type: Boolean,
    default: true
  }, // 店家是否啟用
}, { timestamps: true });

export default mongoose.model('Store', storeSchema);
