import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'admin name cannot be blank']
  },
  password: {
    type: String,
    required: [true, 'password cannot be blank']
  },
  role: {
    type: String,
    enum: ['boss', 'brain_admin', 'store_admin'],
    required: true
  },
  manage: [
    {
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
    }
  ]
}, { timestamps: true });

export default mongoose.model('Admin', AdminSchema);

