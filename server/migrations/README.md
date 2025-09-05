# Database Migrations

這個資料夾包含資料庫 migration 腳本，用於管理資料庫結構的變更。

## Migration 檔案命名規範

格式：`YYYY-MM-DD-描述.js`

範例：`2024-12-05-remove-store-liff-id.js`

## 執行 Migration

### 單個 Migration

```bash
# 從專案根目錄執行
node server/migrations/2024-12-05-remove-store-liff-id.js
```

### 重要注意事項

1. **備份資料庫**：執行任何 migration 之前，請先備份你的資料庫
2. **環境變數**：確保 `.env` 檔案中的 `MongoDB_url` 設定正確
3. **權限**：確保你有修改資料庫的權限
4. **測試環境**：建議先在測試環境中執行 migration

## 現有 Migrations

### 2024-12-05-remove-store-liff-id.js

**目的**：移除 Store collection 中的 `liffId` 欄位

**原因**：
- LIFF ID 應該從環境變數 `VITE_LIFF_ID` 獲取
- 所有品牌和店家共用同一個 LIFF ID
- 不需要在每個店鋪記錄中單獨存儲

**影響**：
- 從所有 Store 文件中移除 `liffId` 欄位
- 不會影響其他資料

**驗證**：
- Migration 會自動驗證執行結果
- 可以手動查詢確認：`db.stores.find({ liffId: { $exists: true } })`

## 開發指南

### 創建新的 Migration

1. 在此資料夾中創建新檔案，使用正確的命名格式
2. 匯入必要的依賴 (mongoose, dotenv 等)
3. 實作 migration 邏輯
4. 添加適當的錯誤處理和日誌
5. 更新此 README 檔案

### Migration 模板

```javascript
/**
 * Migration: 描述你的變更
 * 
 * 理由：說明為什麼需要這個變更
 * 
 * 執行方式：node server/migrations/YYYY-MM-DD-描述.js
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

async function yourMigrationFunction() {
  try {
    await mongoose.connect(process.env.MongoDB_url)
    
    // 你的 migration 邏輯
    
  } catch (error) {
    console.error('Migration 失敗:', error)
    process.exit(1)
  } finally {
    await mongoose.connection.close()
  }
}

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  yourMigrationFunction()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

export default yourMigrationFunction
```

## 故障排除

### 常見錯誤

1. **連接錯誤**：檢查 `MongoDB_url` 環境變數
2. **權限錯誤**：確保資料庫用戶有寫入權限
3. **ES 模組錯誤**：確保 package.json 中有 `"type": "module"`

### 回滾

如果需要回滾 migration，你需要：

1. 創建一個逆向的 migration 腳本
2. 或從備份中還原資料庫
3. 手動修正資料（不建議）

建議：總是在執行 migration 前備份資料庫！