/**
 * Migration: 移除 CashFlow 和 CashFlowCategory collections
 *
 * 理由：移除現金流管理功能，包含所有相關的資料表
 * - 移除 cashflows collection (CashFlow model)
 * - 移除 cashflowcategories collection (CashFlowCategory model)
 *
 * 執行方式：node server/migrations/2025-01-19-remove-cashflow-collections.js
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

async function removeCashFlowCollections() {
  try {
    console.log('🔗 連接到 MongoDB...')
    await mongoose.connect(MONGODB_URL)
    console.log('✅ 成功連接到 MongoDB')

    const db = mongoose.connection.db
    
    // 檢查 collections 是否存在
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map(c => c.name)
    
    console.log('📋 檢查現有 collections...')
    
    // 檢查並移除 cashflows collection
    if (collectionNames.includes('cashflows')) {
      console.log('📊 檢查 cashflows collection...')
      
      // 統計現有文件數量
      const cashflowsCollection = db.collection('cashflows')
      const cashflowCount = await cashflowsCollection.countDocuments()
      console.log(`📝 發現 ${cashflowCount} 個 CashFlow 文件`)
      
      if (cashflowCount > 0) {
        // 顯示一些範例文件供確認
        const sampleCashflows = await cashflowsCollection
          .find({}, { projection: { name: 1, amount: 1, type: 1, time: 1 } })
          .limit(5)
          .toArray()
        
        console.log('🔍 CashFlow 文件範例:')
        sampleCashflows.forEach((cashflow, index) => {
          console.log(`  ${index + 1}. ${cashflow.name}: ${cashflow.type} ${cashflow.amount} (${new Date(cashflow.time).toLocaleString()})`)
        })
      }
      
      // 移除 cashflows collection
      console.log('🗑️  開始移除 cashflows collection...')
      await cashflowsCollection.drop()
      console.log('✅ 成功移除 cashflows collection')
      
    } else {
      console.log('ℹ️  cashflows collection 不存在，跳過')
    }
    
    // 檢查並移除 cashflowcategories collection
    if (collectionNames.includes('cashflowcategories')) {
      console.log('📊 檢查 cashflowcategories collection...')
      
      // 統計現有文件數量
      const cashflowCategoriesCollection = db.collection('cashflowcategories')
      const categoryCount = await cashflowCategoriesCollection.countDocuments()
      console.log(`📝 發現 ${categoryCount} 個 CashFlowCategory 文件`)
      
      if (categoryCount > 0) {
        // 顯示一些範例文件供確認
        const sampleCategories = await cashflowCategoriesCollection
          .find({}, { projection: { name: 1, type: 1 } })
          .limit(5)
          .toArray()
        
        console.log('🔍 CashFlowCategory 文件範例:')
        sampleCategories.forEach((category, index) => {
          console.log(`  ${index + 1}. ${category.name}: ${category.type}`)
        })
      }
      
      // 移除 cashflowcategories collection
      console.log('🗑️  開始移除 cashflowcategories collection...')
      await cashflowCategoriesCollection.drop()
      console.log('✅ 成功移除 cashflowcategories collection')
      
    } else {
      console.log('ℹ️  cashflowcategories collection 不存在，跳過')
    }
    
    // 驗證移除結果
    console.log('🔍 驗證移除結果...')
    const updatedCollections = await db.listCollections().toArray()
    const updatedCollectionNames = updatedCollections.map(c => c.name)
    
    const cashflowsExists = updatedCollectionNames.includes('cashflows')
    const cashflowCategoriesExists = updatedCollectionNames.includes('cashflowcategories')
    
    if (!cashflowsExists && !cashflowCategoriesExists) {
      console.log('✅ 驗證成功：所有 CashFlow 相關的 collections 已被移除')
    } else {
      console.log('⚠️  警告：')
      if (cashflowsExists) console.log('  - cashflows collection 仍然存在')
      if (cashflowCategoriesExists) console.log('  - cashflowcategories collection 仍然存在')
    }
    
    console.log(`✅ Migration 完成！`)
    
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
  console.log('🚀 開始執行 CashFlow collections 移除 migration...')
  console.log('📅 時間:', new Date().toISOString())
  console.log('💾 資料庫:', MONGODB_URL.replace(/\/\/.*@/, '//***:***@')) // 隱藏敏感資訊
  console.log('─'.repeat(60))
  
  console.log('⚠️  警告：此操作將永久刪除所有現金流管理相關資料')
  console.log('⚠️  請確保已備份重要資料！')
  console.log('─'.repeat(60))

  try {
    await removeCashFlowCollections()
    console.log('🎉 Migration 成功完成！')
    console.log('📝 已移除的 collections:')
    console.log('  - cashflows (CashFlow model)')
    console.log('  - cashflowcategories (CashFlowCategory model)')
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
    process.argv[1].endsWith('2025-01-19-remove-cashflow-collections.js'))

if (isMainModule) {
  runMigration()
} else {
  console.log('📦 檔案被當作模組載入，不會自動執行 migration')
}

export default removeCashFlowCollections