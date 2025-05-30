import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Administrator from './server/models/User/Admin.js';

dotenv.config();

// 連接數據庫
mongoose.connect(process.env.MongoDB_url)
  .then(async () => {
    console.log("MongoDB connected");

    try {
      // 檢查是否已有 primary_system_admin 管理員
      const existingPrimaryAdmin = await Administrator.findOne({ role: 'primary_system_admin' });
      if (existingPrimaryAdmin) {
        console.log('系統主管理員已存在!');
        process.exit(0);
      }

      // 創建 primary_system_admin 管理員（密碼將自動由model的pre-save hook處理加密）
      const primaryAdmin = new Administrator({
        name: 'admin',
        password: '12345678',
        role: 'primary_system_admin'
      });

      await primaryAdmin.save();
      console.log(`系統主管理員創建成功！用戶名: admin, 密碼: 12345678`);
    } catch (error) {
      console.error('創建系統主管理員時出錯:', error);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch((err) => {
    console.log("MongoDB connection failed", err);
  });
