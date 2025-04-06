import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema({
  name: { type: String, required: true }, // 店家名稱
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu' }, // 菜單
  announcements: [{
    title: { type: String, required: true }, // 公告名稱
    content: { type: String, required: true } // 公告內容
  }],
  image: {
    url: { type: String, required: true },    // 圖片的實際連結，例如 R2 上的公網地址
    key: { type: String, required: true },    // 儲存在 R2 的 object key（等同於檔名，可用於刪除）
    alt: { type: String }                     // 可選：給前端 img alt 屬性
  },
});

export default mongoose.model('Store', storeSchema);
