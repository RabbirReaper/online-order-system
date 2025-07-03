/**
 * 資料庫遷移腳本 - 移除 VoucherTemplate 的 validityPeriod 欄位
 * 檔案位置: migrations/removeVoucherTemplateValidityPeriod.mjs
 *
 * 執行方式: node migrations/removeVoucherTemplateValidityPeriod.mjs
 * 回滾方式: node migrations/removeVoucherTemplateValidityPeriod.mjs --rollback
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// 連接資料庫
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MongoDB_url);
    console.log("MongoDB 連接成功");
  } catch (error) {
    console.error("MongoDB 連接失敗:", error);
    process.exit(1);
  }
};

// 主要遷移邏輯
const migrateVoucherTemplates = async () => {
  try {
    console.log("開始遷移 VoucherTemplate 資料...");

    // 1. 檢查受影響的文檔數量
    const db = mongoose.connection.db;
    const collection = db.collection('vouchertemplates');

    // 統計有 validityPeriod 欄位的文檔
    const documentsWithValidityPeriod = await collection.countDocuments({
      validityPeriod: { $exists: true }
    });

    console.log(`找到 ${documentsWithValidityPeriod} 個包含 validityPeriod 欄位的 VoucherTemplate 文檔`);

    if (documentsWithValidityPeriod === 0) {
      console.log("沒有需要遷移的資料");
      return;
    }

    // 2. 可選：備份即將移除的資料（用於回滾）
    console.log("正在備份 validityPeriod 資料...");
    const backupData = await collection.find(
      { validityPeriod: { $exists: true } },
      { projection: { _id: 1, validityPeriod: 1 } }
    ).toArray();

    // 將備份資料寫入臨時集合（可選）
    if (backupData.length > 0) {
      await db.collection('vouchertemplate_validityperiod_backup').insertMany(
        backupData.map(doc => ({
          ...doc,
          backupDate: new Date(),
          migrationNote: 'Backup before removing validityPeriod field'
        }))
      );
      console.log(`已備份 ${backupData.length} 筆 validityPeriod 資料到 vouchertemplate_validityperiod_backup 集合`);
    }

    // 3. 移除 validityPeriod 欄位
    console.log("正在移除 validityPeriod 欄位...");
    const result = await collection.updateMany(
      { validityPeriod: { $exists: true } },
      { $unset: { validityPeriod: "" } }
    );

    console.log(`成功更新 ${result.modifiedCount} 個文檔，移除了 validityPeriod 欄位`);

    // 4. 驗證遷移結果
    const remainingDocuments = await collection.countDocuments({
      validityPeriod: { $exists: true }
    });

    if (remainingDocuments === 0) {
      console.log("✅ 遷移成功！所有 validityPeriod 欄位已被移除");
    } else {
      console.warn(`⚠️ 警告：仍有 ${remainingDocuments} 個文檔包含 validityPeriod 欄位`);
    }

    // 5. 顯示遷移後的資料範例
    const sampleDocs = await collection.find({}).limit(3).toArray();
    console.log("遷移後的資料範例：");
    sampleDocs.forEach((doc, index) => {
      console.log(`範例 ${index + 1}:`, {
        _id: doc._id,
        name: doc.name,
        hasValidityPeriod: 'validityPeriod' in doc
      });
    });

  } catch (error) {
    console.error("遷移過程中發生錯誤:", error);
    throw error;
  }
};

// 回滾函數（如果需要的話）
const rollbackMigration = async () => {
  try {
    console.log("開始回滾遷移...");

    const db = mongoose.connection.db;
    const collection = db.collection('vouchertemplates');
    const backupCollection = db.collection('vouchertemplate_validityperiod_backup');

    // 檢查是否有備份資料
    const backupCount = await backupCollection.countDocuments();
    if (backupCount === 0) {
      console.log("沒有找到備份資料，無法回滾");
      return;
    }

    console.log(`找到 ${backupCount} 筆備份資料`);

    // 從備份恢復 validityPeriod 欄位
    const backupData = await backupCollection.find({}).toArray();

    for (const backup of backupData) {
      await collection.updateOne(
        { _id: backup._id },
        { $set: { validityPeriod: backup.validityPeriod } }
      );
    }

    console.log(`✅ 回滾成功！已恢復 ${backupData.length} 個文檔的 validityPeriod 欄位`);

  } catch (error) {
    console.error("回滾過程中發生錯誤:", error);
    throw error;
  }
};

// 主執行邏輯
const main = async () => {
  const args = process.argv.slice(2);
  const isRollback = args.includes('--rollback');

  await connectDB();

  try {
    if (isRollback) {
      await rollbackMigration();
    } else {
      await migrateVoucherTemplates();
    }
  } catch (error) {
    console.error("執行失敗:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("資料庫連接已關閉");
  }
};

// 直接執行
main().catch(error => {
  console.error("遷移腳本執行失敗:", error);
  process.exit(1);
});

export { migrateVoucherTemplates, rollbackMigration };
