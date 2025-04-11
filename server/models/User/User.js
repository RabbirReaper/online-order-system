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
  // 點數系統整合
  brandPoints: [{
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true
    }, // 所屬品牌
    points: {
      type: Number,
      default: 0
    }, // 累積點數
    lifetimePoints: {
      type: Number,
      default: 0
    }, // 終身累積點數 (用於計算會員等級)
    lastEarnedAt: {
      type: Date
    }, // 最後獲得點數時間
    expiringPoints: [{
      points: { type: Number, required: true }, // 即將到期的點數
      expiryDate: { type: Date, required: true } // 到期日期
    }], // 即將到期的點數
  }],
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

// 新增：獲取特定品牌的點數
userSchema.methods.getPointsForBrand = function (brandId) {
  const brandPoints = this.brandPoints.find(
    bp => bp.brand.toString() === brandId.toString()
  );

  return brandPoints ? brandPoints.points : 0;
};

// 新增：增加點數方法
userSchema.methods.addPoints = async function (brandId, points, expiryDays = null) {
  // 查找或創建品牌點數記錄
  let brandPoints = this.brandPoints.find(
    bp => bp.brand.toString() === brandId.toString()
  );

  if (!brandPoints) {
    brandPoints = {
      brand: brandId,
      points: 0,
      lifetimePoints: 0,
      expiringPoints: []
    };
    this.brandPoints.push(brandPoints);
  }

  // 增加點數
  brandPoints.points += points;
  brandPoints.lifetimePoints += points;
  brandPoints.lastEarnedAt = new Date();

  // 如果有設定過期日，添加到即將過期的點數
  if (expiryDays) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);

    brandPoints.expiringPoints.push({
      points: points,
      expiryDate: expiryDate
    });
  }

  // 更新會員等級 (根據終身累積點數)
  this.updateMembershipLevel(brandPoints.lifetimePoints);

  await this.save();
  return brandPoints.points;
};

// 新增：減少點數方法
userSchema.methods.deductPoints = async function (brandId, points) {
  // 查找品牌點數記錄
  const brandPoints = this.brandPoints.find(
    bp => bp.brand.toString() === brandId.toString()
  );

  if (!brandPoints || brandPoints.points < points) {
    throw new Error('點數不足');
  }

  // 減少點數
  brandPoints.points -= points;

  // 優先扣除即將過期的點數
  let remainingToDeduct = points;
  brandPoints.expiringPoints.sort((a, b) => a.expiryDate - b.expiryDate);

  for (let i = 0; i < brandPoints.expiringPoints.length; i++) {
    if (remainingToDeduct <= 0) break;

    const expiring = brandPoints.expiringPoints[i];

    if (expiring.points <= remainingToDeduct) {
      // 如果這組即將過期的點數小於或等於需要扣除的點數，全部扣除
      remainingToDeduct -= expiring.points;
      expiring.points = 0;
    } else {
      // 否則只扣除部分
      expiring.points -= remainingToDeduct;
      remainingToDeduct = 0;
    }
  }

  // 清理已用完的過期點數
  brandPoints.expiringPoints = brandPoints.expiringPoints.filter(
    exp => exp.points > 0
  );

  await this.save();
  return brandPoints.points;
};

// 新增：檢查過期點數
userSchema.methods.checkExpiredPoints = async function () {
  const now = new Date();
  let totalExpired = 0;

  for (const brandPoint of this.brandPoints) {
    let expiredAmount = 0;

    // 找出已過期的點數
    const expiredPoints = brandPoint.expiringPoints.filter(
      exp => exp.expiryDate <= now
    );

    // 計算過期點數總額
    expiredAmount = expiredPoints.reduce((sum, exp) => sum + exp.points, 0);

    // 從總點數中減去過期點數
    if (expiredAmount > 0) {
      brandPoint.points = Math.max(0, brandPoint.points - expiredAmount);
      totalExpired += expiredAmount;
    }

    // 移除已過期的點數記錄
    brandPoint.expiringPoints = brandPoint.expiringPoints.filter(
      exp => exp.expiryDate > now
    );
  }

  if (totalExpired > 0) {
    await this.save();
  }

  return totalExpired;
};


export default mongoose.model('User', userSchema);
