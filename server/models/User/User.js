import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const userSchema = new mongoose.Schema(
  {
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
    }, // 所屬品牌
    name: {
      type: String,
      required: true,
      minlength: [1, '姓名至少需要1個字元'],
      maxlength: [25, '姓名長度不能超過25個字元'],
      trim: true,
    }, // 用戶名稱
    email: {
      type: String,
      trim: true,
    }, // 電子郵件
    password: {
      type: String,
      required: true,
      minlength: [6, '密碼長度至少需要6個字元'],
      maxlength: [100, '密碼長度不能超過100個字元'], // 因為會被 hash，所以存儲長度需要更長
    }, // 密碼
    phone: {
      type: String,
      required: true,
    }, // 電話號碼
    addresses: [
      {
        name: { type: String, required: true }, // 地址名稱 (例如：家、公司)
        address: { type: String, required: true }, // 街道地址
        isDefault: { type: Boolean, default: false }, // 是否為預設地址
      },
    ], // 地址列表
    dateOfBirth: {
      type: Date,
    }, // 生日
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    }, // 性別
    isActive: {
      type: Boolean,
      default: true,
    }, // 帳號是否啟用
    resetPasswordToken: {
      type: String,
    }, // 重設密碼令牌
    resetPasswordExpire: {
      type: Date,
    }, // 重設密碼令牌過期時間
  },
  { timestamps: true },
)

// 密碼加密
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// 驗證密碼方法
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    throw error
  }
}

// 索引：優化認證查詢性能
userSchema.index({ brand: 1, phone: 1 })

export default mongoose.model('User', userSchema)
