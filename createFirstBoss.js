import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Administrator from './server/models/Users/Admin.js';

dotenv.config();

// 連接數據庫
mongoose.connect(process.env.MongoDB_url)
  .then(async () => {
    console.log("MongoDB connected");

    try {
      // 檢查是否已有 boss 管理員
      const existingBoss = await Administrator.findOne({ role: 'boss' });
      if (existingBoss) {
        console.log('Boss 管理員已存在!');
        process.exit(0);
      }

      // 創建 boss 管理員（密碼將自動由model的pre-save hook處理加密）
      const boss = new Administrator({
        name: 'boss',
        password: '123456',
        role: 'boss'
      });

      await boss.save();
      console.log(`Boss 管理員創建成功！用戶名: boss, 密碼: 123456`);
    } catch (error) {
      console.error('創建 Boss 管理員時出錯:', error);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch((err) => {
    console.log("MongoDB connection failed", err);
  });
