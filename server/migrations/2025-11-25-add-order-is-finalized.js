/**
 * Migration: 為所有沒有 isFinalized 欄位的訂單添加 isFinalized: true
 *
 * 背景：
 * - isFinalized 欄位用於區分已確定的訂單（true）和線上付款等待中的訂單（false）
 * - 舊訂單在建立時可能沒有這個欄位，導致查詢時被過濾掉
 * - 此 migration 將為所有缺少此欄位的訂單設置 isFinalized: true
 *
 * 執行方式：
 * node server/migrations/2025-11-25-add-order-is-finalized.js
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

async function addOrderIsFinalizedField() {
  try {
    console.log('🔗 連接到 MongoDB...')
    await mongoose.connect(MONGODB_URL)
    console.log('✅ 成功連接到 MongoDB')

    const db = mongoose.connection.db
    const orderCollection = db.collection('orders')

    console.log('📊 檢查現有的 Order 文件...')

    // 檢查有多少文件缺少 isFinalized 欄位
    const documentsWithoutIsFinalized = await orderCollection.countDocuments({
      isFinalized: { $exists: false },
    })
    console.log(`📝 發現 ${documentsWithoutIsFinalized} 個訂單缺少 isFinalized 欄位`)

    if (documentsWithoutIsFinalized === 0) {
      console.log('✅ 所有訂單都已有 isFinalized 欄位，無需執行 migration')
      return
    }

    // 顯示即將被更新的訂單範例（用於除錯和確認）
    const samplesWithoutIsFinalized = await orderCollection
      .find(
        { isFinalized: { $exists: false } },
        {
          projection: {
            orderDateCode: 1,
            sequence: 1,
            status: 1,
            createdAt: 1,
            total: 1,
          },
        },
      )
      .limit(5)
      .toArray()

    console.log('🔍 範例訂單（將被更新）:')
    samplesWithoutIsFinalized.forEach((order, index) => {
      const orderNumber = order.orderDateCode
        ? `${order.orderDateCode}-${String(order.sequence).padStart(3, '0')}`
        : order._id.toString().substring(0, 8)
      const createdDate = order.createdAt
        ? new Date(order.createdAt).toLocaleDateString('zh-TW')
        : '未知'
      console.log(
        `  ${index + 1}. 訂單: ${orderNumber}, 狀態: ${order.status}, 金額: $${order.total}, 日期: ${createdDate}`,
      )
    })

    console.log('\n📋 訂單狀態分布:')
    const statusCounts = await orderCollection
      .aggregate([
        { $match: { isFinalized: { $exists: false } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray()

    statusCounts.forEach((item) => {
      console.log(`  - ${item._id}: ${item.count} 筆`)
    })

    // 執行更新操作
    console.log('\n🔧 開始為缺少 isFinalized 欄位的訂單添加 isFinalized: true...')
    const result = await orderCollection.updateMany(
      { isFinalized: { $exists: false } },
      { $set: { isFinalized: true } },
    )

    console.log(`✅ Migration 完成！`)
    console.log(`   - 匹配的文件數量: ${result.matchedCount}`)
    console.log(`   - 修改的文件數量: ${result.modifiedCount}`)

    // 驗證更新結果
    const remainingDocumentsWithoutIsFinalized = await orderCollection.countDocuments({
      isFinalized: { $exists: false },
    })
    if (remainingDocumentsWithoutIsFinalized === 0) {
      console.log('✅ 驗證成功：所有訂單現在都有 isFinalized 欄位')
    } else {
      console.log(
        `⚠️  警告：仍有 ${remainingDocumentsWithoutIsFinalized} 個訂單缺少 isFinalized 欄位`,
      )
    }

    // 額外統計：顯示所有訂單的 isFinalized 分布
    console.log('\n📊 更新後的 isFinalized 分布:')
    const finalizedCounts = await orderCollection
      .aggregate([
        { $group: { _id: '$isFinalized', count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
      ])
      .toArray()

    finalizedCounts.forEach((item) => {
      const label = item._id === true ? 'true (已確定)' : item._id === false ? 'false (等待付款)' : '未定義'
      console.log(`  - isFinalized: ${label} - ${item.count} 筆`)
    })
  } catch (error) {
    console.error('❌ Migration 執行失敗:', error)
    process.exit(1)
  } finally {
    console.log('\n🔌 關閉資料庫連接...')
    await mongoose.connection.close()
    console.log('✅ 資料庫連接已關閉')
  }
}

// 簡化的執行條件檢查
async function runMigration() {
  console.log('🚀 開始執行 Order isFinalized 欄位添加 migration...')
  console.log('📅 時間:', new Date().toISOString())
  console.log('💾 資料庫:', MONGODB_URL.replace(/\/\/.*@/, '//***:***@')) // 隱藏敏感資訊
  console.log('─'.repeat(60))

  try {
    await addOrderIsFinalizedField()
    console.log('\n🎉 Migration 成功完成！')
    process.exit(0)
  } catch (error) {
    console.error('\n💥 Migration 失敗:', error)
    process.exit(1)
  }
}

// 檢查是否為直接執行
const isMainModule =
  process.argv[1] &&
  (import.meta.url === `file://${process.argv[1]}` ||
    __filename === process.argv[1] ||
    process.argv[1].endsWith('2025-11-25-add-order-is-finalized.js'))

if (isMainModule) {
  runMigration()
} else {
  console.log('📦 檔案被當作模組載入，不會自動執行 migration')
}

export default addOrderIsFinalizedField
