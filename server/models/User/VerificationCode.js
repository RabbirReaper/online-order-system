import mongoose from 'mongoose';

const verificationCodeSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    index: true
  }, // 電話號碼
  code: {
    type: String,
    required: true
  }, // 驗證碼
  purpose: {
    type: String,
    enum: ['register', 'login', 'reset_password'],
    required: true
  }, // 用途
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  }, // 所屬品牌
  used: {
    type: Boolean,
    default: false
  }, // 是否已使用
  expiresAt: {
    type: Date,
    required: true
  }, // 過期時間
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // 24小時後自動從資料庫刪除
  } // 創建時間
});

// 索引，方便查詢與避免重複
verificationCodeSchema.index({ phone: 1, purpose: 1, expiresAt: 1 });

export default mongoose.model('VerificationCode', verificationCodeSchema);
