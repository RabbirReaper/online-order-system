/**
 * Migration: 移除 Store collection 中的 liffId 欄位
 *
 * 理由：LIFF ID 應該從環境變數獲取，所有品牌店家共用固定值
 * 不應該存儲在資料庫中的每個店鋪記錄中
 *
 * 執行方式：node server/migrations/2024-12-05-remove-store-liff-id.js
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// 載入環境變數
dotenv.config()

const MONGODB_URL = process.env.MongoDB_url || 'mongodb://localhost:27017/online-order-system'

// 除錯：檢查執行條件
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🔍 除錯資訊:')
console.log('📁 檔案路徑:', __filename)
console.log('📁 執行參數:', process.argv[1])
console.log('🔗 import.meta.url:', import.meta.url)
console.log('🔗 file URL:', `file://${process.argv[1]}`)
console.log('✅ 條件匹配:', import.meta.url === `file://${process.argv[1]}`)
console.log('─'.repeat(60))

async function removeStoreLiffIdField() {
  try {
    console.log('🔗 連接到 MongoDB...')
    await mongoose.connect(MONGODB_URL)
    console.log('✅ 成功連接到 MongoDB')

    const db = mongoose.connection.db
    const storeCollection = db.collection('stores')

    console.log('📊 檢查現有的 Store 文件...')

    // 檢查有多少文件包含 liffId 欄位
    const documentsWithLiffId = await storeCollection.countDocuments({ liffId: { $exists: true } })
    console.log(`📝 發現 ${documentsWithLiffId} 個 Store 文件包含 liffId 欄位`)

    if (documentsWithLiffId === 0) {
      console.log('✅ 沒有找到包含 liffId 欄位的文件，無需執行 migration')
      return
    }

    // 顯示將要被移除的 liffId 值（用於除錯和確認）
    const samplesWithLiffId = await storeCollection
      .find({ liffId: { $exists: true } }, { projection: { name: 1, liffId: 1 } })
      .limit(5)
      .toArray()

    console.log('🔍 範例文件的 liffId 值:')
    samplesWithLiffId.forEach((store, index) => {
      console.log(`  ${index + 1}. Store: ${store.name}, liffId: ${store.liffId}`)
    })

    // 執行移除操作
    console.log('🗑️  開始移除 liffId 欄位...')
    const result = await storeCollection.updateMany(
      { liffId: { $exists: true } },
      { $unset: { liffId: '' } },
    )

    console.log(`✅ Migration 完成！`)
    console.log(`   - 匹配的文件數量: ${result.matchedCount}`)
    console.log(`   - 修改的文件數量: ${result.modifiedCount}`)

    // 驗證移除結果
    const remainingDocumentsWithLiffId = await storeCollection.countDocuments({
      liffId: { $exists: true },
    })
    if (remainingDocumentsWithLiffId === 0) {
      console.log('✅ 驗證成功：所有 liffId 欄位已被移除')
    } else {
      console.log(`⚠️  警告：仍有 ${remainingDocumentsWithLiffId} 個文件包含 liffId 欄位`)
    }
  } catch (error) {
    console.error('❌ Migration 執行失敗:', error)
    process.exit(1)
  } finally {
    console.log('🔌 關閉資料庫連接...')
    await mongoose.connection.close()
    console.log('✅ 資料庫連接已關閉')
  }
}

// 簡化的執行條件檢查
async function runMigration() {
  console.log('🚀 開始執行 Store liffId 欄位移除 migration...')
  console.log('📅 時間:', new Date().toISOString())
  console.log('💾 資料庫:', MONGODB_URL.replace(/\/\/.*@/, '//***:***@')) // 隱藏敏感資訊
  console.log('─'.repeat(60))

  try {
    await removeStoreLiffIdField()
    console.log('🎉 Migration 成功完成！')
    process.exit(0)
  } catch (error) {
    console.error('💥 Migration 失敗:', error)
    process.exit(1)
  }
}

// 檢查是否為直接執行
const isMainModule =
  process.argv[1] &&
  (import.meta.url === `file://${process.argv[1]}` ||
    __filename === process.argv[1] ||
    process.argv[1].endsWith('2024-12-05-remove-store-liff-id.js'))

if (isMainModule) {
  runMigration()
} else {
  console.log('📦 檔案被當作模組載入，不會自動執行 migration')
}

export default removeStoreLiffIdField
