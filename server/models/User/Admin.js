import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const SYSTEM_BRAND_ID = new mongoose.Types.ObjectId('000000000000000000000000');

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
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true,
    default: function () {
      if (['primary_system_admin', 'system_admin'].includes(this.role)) {
        return SYSTEM_BRAND_ID;
      }
      return undefined;
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

AdminSchema.index({ brand: 1, name: 1 }, { unique: true });

AdminSchema.index({ brand: 1, store: 1 });

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

AdminSchema.statics.SYSTEM_BRAND_ID = SYSTEM_BRAND_ID;

AdminSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }

  if (['primary_system_admin', 'system_admin'].includes(this.role)) {
    this.brand = SYSTEM_BRAND_ID;
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
  return this.brand.toString() === SYSTEM_BRAND_ID.toString();
};

AdminSchema.methods.getActualBrandId = function () {
  if (this.isSystemAdmin()) {
    return null;
  }
  return this.brand;
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
