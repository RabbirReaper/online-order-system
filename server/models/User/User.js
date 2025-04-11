import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }, // 用戶名稱
  email: {
    type: String,
    unique: [true, 'Email already exists'],
    trim: true
  }, // 電子郵件
  password: {
    type: String,
    required: true,
  }, // 密碼
  phone: {
    type: String,
    required: true,
    unique: [true, 'Phone number already exists']
  }, // 電話號碼
  addresses: [{
    name: { type: String, required: true }, // 地址名稱 (例如：家、公司)
    address: { type: String, required: true }, // 街道地址
    isDefault: { type: Boolean, default: false } // 是否為預設地址
  }], // 地址列表
  dateOfBirth: {
    type: Date
  }, // 生日
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say']
  }, // 性別
  isActive: {
    type: Boolean,
    default: true
  }, // 帳號是否啟用
  resetPasswordToken: {
    type: String
  }, // 重設密碼令牌
  resetPasswordExpire: {
    type: Date
  }, // 重設密碼令牌過期時間
}, { timestamps: true });

// 密碼加密
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 驗證密碼方法
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// 添加默認地址方法
userSchema.methods.addAddress = function (address) {
  // 如果設置為默認地址，先將其他地址的默認標記移除
  if (address.isDefault) {
    this.addresses.forEach(addr => {
      addr.isDefault = false;
    });
  }

  // 如果這是第一個地址，自動設為默認
  if (this.addresses.length === 0) {
    address.isDefault = true;
  }

  this.addresses.push(address);
  return this.save();
};

// 獲取默認地址方法
userSchema.methods.getDefaultAddress = function () {
  return this.addresses.find(addr => addr.isDefault) || this.addresses[0];
};

export default mongoose.model('User', userSchema);
