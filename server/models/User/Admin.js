import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const AdminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'admin name cannot be blank'],
  },
  phone: {
    type: String
  },
  password: {
    type: String,
    required: [true, 'password cannot be blank'],
    select: false
  },
  role: {
    type: String,
    enum: [
      'primary_system_admin',
      'system_admin',
      'primary_brand_admin',
      'brand_admin',
      'primary_store_admin',
      'store_admin',
      'employee'
    ],
    required: true
  },
  // 系統級管理員: null，品牌級管理員: ObjectId
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: function () {
      return !['primary_system_admin', 'system_admin'].includes(this.role);
    },
    validate: {
      validator: function (value) {
        // 系統級角色必須是 null
        if (['primary_system_admin', 'system_admin'].includes(this.role)) {
          return value === null || value === undefined;
        }
        // 其他角色必須有品牌
        return !!value;
      },
      message: '角色與品牌設定不符'
    }
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: function () {
      return ['primary_store_admin', 'store_admin', 'employee'].includes(this.role);
    },
    validate: {
      validator: function (value) {
        if (['primary_store_admin', 'store_admin', 'employee'].includes(this.role)) {
          return !!value;
        }
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
  },
}, { timestamps: true });

// 索引設定
AdminSchema.index({ brand: 1, store: 1 });

// 核心索引：品牌內名稱唯一性
AdminSchema.index(
  { brand: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: { brand: { $ne: null } }
  }
);

// 核心索引：系統級名稱唯一性
AdminSchema.index(
  { name: 1 },
  {
    unique: true,
    partialFilterExpression: { brand: null }
  }
);

// Primary 角色唯一性索引
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

AdminSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }

  // 系統級管理員設置為 null
  if (['primary_system_admin', 'system_admin'].includes(this.role)) {
    this.brand = null;
    this.store = undefined;
  }

  next();
});

AdminSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

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

AdminSchema.methods.isPrimaryRole = function () {
  return this.role.startsWith('primary_');
};

AdminSchema.methods.isSystemAdmin = function () {
  return this.brand === null;
};

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

AdminSchema.methods.canManageRole = function (targetRole) {
  const currentLevel = this.constructor.getRoleLevel(this.role);
  const targetLevel = this.constructor.getRoleLevel(targetRole);

  if (!this.isPrimaryRole()) {
    return false;
  }

  return currentLevel > targetLevel;
};

export default mongoose.model('Admin', AdminSchema);
