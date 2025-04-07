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
    enum: ['boss', 'brand_admin', 'store_admin'],
    required: true
  },
  // 所屬品牌 (只有 brand_admin 和 store_admin 需要)
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: function () {
      return this.role === 'brand_admin' || this.role === 'store_admin';
    }
  },
  // 管理權限配置
  manage: [{
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true
    },
    permission: [{
      type: String,
      enum: ['order_system', 'view_reports', 'edit_backend', 'manage_staff']
    }]
    /*
      order_system: 登入前台點餐系統,庫存管理
      view_reports: 查看後台資料,記帳
      edit_backend: 編輯後臺資料
      manage_staff: 員工權限管理
    */
  }],
  active: {
    type: Boolean,
    default: true
  }, // 帳號是否啟用
  lastLogin: {
    type: Date
  }, // 最後登入時間
}, { timestamps: true });

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

export default mongoose.model('Admin', AdminSchema);
