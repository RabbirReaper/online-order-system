import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const AdminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'admin name cannot be blank'],
    unique: true
  },
  password: {
    type: String,
    required: [true, 'password cannot be blank'],
    select: false
  },
  role: {
    type: String,
    enum: [
      'primary_system_admin',    // 系統主管理員
      'system_admin',            // 系統管理員
      'primary_brand_admin',     // 品牌主管理員
      'brand_admin',             // 品牌管理員
      'primary_store_admin',     // 店鋪主管理員
      'store_admin',             // 店鋪管理員
      'employee'                 // 員工
    ],
    required: true
  },
  // 所屬品牌 (系統級角色不需要)
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: function () {
      return !['primary_system_admin', 'system_admin'].includes(this.role);
    },
    validate: {
      validator: function (value) {
        // 系統級角色不應該有品牌
        if (['primary_system_admin', 'system_admin'].includes(this.role)) {
          return !value;
        }
        // 其他角色必須有品牌
        return !!value;
      },
      message: '角色與品牌設定不符'
    }
  },
  // 所屬店鋪 (只有店鋪級角色需要)
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: function () {
      return ['primary_store_admin', 'store_admin', 'employee'].includes(this.role);
    },
    validate: {
      validator: function (value) {
        // 店鋪級角色必須有店鋪
        if (['primary_store_admin', 'store_admin', 'employee'].includes(this.role)) {
          return !!value;
        }
        // 其他角色不應該有店鋪
        return !value;
      },
      message: '角色與店鋪設定不符'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }, // 記錄是誰創建的，用於權限追蹤
}, { timestamps: true });

// 索引設定
// 1. 登入查詢：根據用戶名查詢 (MongoDB會自動為unique字段建立索引)
// 2. 列出管理員：按品牌和店鋪篩選
AdminSchema.index({ brand: 1, store: 1 }); // 複合索引，可以同時支援 brand 和 store 的查詢

// 唯一性約束：確保primary角色的唯一性
AdminSchema.index(
  { role: 1 },
  {
    unique: true,
    partialFilterExpression: { role: 'primary_system_admin' }
  }
);

AdminSchema.index(
  { brand: 1, role: 1 },
  {
    unique: true,
    partialFilterExpression: { role: 'primary_brand_admin' }
  }
);

AdminSchema.index(
  { store: 1, role: 1 },
  {
    unique: true,
    partialFilterExpression: { role: 'primary_store_admin' }
  }
);

// 密碼加密
AdminSchema.pre('save', async function (next) {
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
AdminSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// 獲取角色權限級別的靜態方法
AdminSchema.statics.getRoleLevel = function (role) {
  const levels = {
    'primary_system_admin': 7,
    'system_admin': 6,
    'primary_brand_admin': 5,
    'brand_admin': 4,
    'primary_store_admin': 3,
    'store_admin': 2,
    'employee': 1
  };
  return levels[role] || 0;
};

// 檢查是否為primary角色的實例方法
AdminSchema.methods.isPrimaryRole = function () {
  return this.role.startsWith('primary_');
};

// 檢查角色層級的實例方法
AdminSchema.methods.getRoleScope = function () {
  if (['primary_system_admin', 'system_admin'].includes(this.role)) {
    return 'system';
  }
  if (['primary_brand_admin', 'brand_admin'].includes(this.role)) {
    return 'brand';
  }
  if (['primary_store_admin', 'store_admin', 'employee'].includes(this.role)) {
    return 'store';
  }
  return 'unknown';
};

// 檢查是否可以管理特定角色的實例方法
AdminSchema.methods.canManageRole = function (targetRole) {
  const currentLevel = this.constructor.getRoleLevel(this.role);
  const targetLevel = this.constructor.getRoleLevel(targetRole);

  // 必須是primary角色才能管理成員
  if (!this.isPrimaryRole()) {
    return false;
  }

  // 只能管理同級或下級角色
  return currentLevel > targetLevel;
};

export default mongoose.model('Admin', AdminSchema);
