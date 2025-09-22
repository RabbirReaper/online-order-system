/**
 * 菜單同步測試腳本
 * 測試 platformManager.syncMenu 功能
 *
 * 使用方式：
 * node scripts/ubereats/test/test-menu-sync.js
 */

import dotenv from 'dotenv'
import mongoose from 'mongoose'
import * as platformManager from '../../../server/services/delivery/core/platformManager.js'

// 導入所有需要的 models
import '../../../server/models/Menu/Menu.js'
import '../../../server/models/Store/Store.js'
import '../../../server/models/Brand/Brand.js'
import '../../../server/models/DeliverPlatform/platformStore.js'
import '../../../server/models/DeliverPlatform/platformToken.js'
import '../../../server/models/Dish/DishTemplate.js'
import '../../../server/models/Dish/OptionCategory.js'
import '../../../server/models/Dish/Option.js'
import '../../../server/models/Promotion/Bundle.js'

// 載入環境變數
dotenv.config()

// 測試資料
const TEST_BRAND_ID = '6818d68ab0d9e9f313335aa3'
const TEST_STORE_ID = '6818d78db0d9e9f313335aed'

// ========================================
// 🔧 連接資料庫
// ========================================

const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MongoDB_url}`)
    console.log('✅ MongoDB 連接成功\n')
  } catch (error) {
    console.error('❌ MongoDB 連接失敗:', error)
    process.exit(1)
  }
}

// ========================================
// 🧪 測試函數
// ========================================

/**
 * 測試菜單同步
 */
const testMenuSync = async () => {
  console.log('📝 測試菜單同步')
  console.log('='.repeat(50))
  console.log(`品牌 ID: ${TEST_BRAND_ID}`)
  console.log(`店鋪 ID: ${TEST_STORE_ID}`)
  console.log()

  try {
    console.log('🔄 開始同步菜單...\n')

    const result = await platformManager.syncMenu(TEST_BRAND_ID, TEST_STORE_ID)

    console.log('✅ 菜單同步完成！')
    console.log()
    console.log('📊 同步結果:')
    console.log('='.repeat(50))
    console.log(JSON.stringify(result, null, 2))
    console.log()

    // 顯示每個平台的結果
    if (result.syncResults && result.syncResults.length > 0) {
      console.log('📋 各平台結果摘要:')
      console.log('='.repeat(50))

      result.syncResults.forEach((platformResult) => {
        const status = platformResult.success ? '✅ 成功' : '❌ 失敗'
        console.log(`${platformResult.platform}: ${status}`)

        if (platformResult.success && platformResult.syncTime) {
          console.log(`   同步時間: ${new Date(platformResult.syncTime).toLocaleString('zh-TW')}`)
        }

        if (!platformResult.success && platformResult.error) {
          console.log(`   錯誤: ${platformResult.error}`)
        }

        console.log()
      })
    }
  } catch (error) {
    console.error('❌ 測試失敗:', error.message)
    console.error('錯誤詳情:', error)
  }

  console.log('\n')
}

// ========================================
// 🚀 主測試流程
// ========================================

const runTest = async () => {
  console.log('\n')
  console.log('🧪 菜單同步測試開始')
  console.log('='.repeat(50))
  console.log('\n')

  await connectDB()
  await testMenuSync()

  console.log('='.repeat(50))
  console.log('✅ 測試完成！')
  console.log('='.repeat(50))
  console.log('\n')

  // 關閉資料庫連接
  await mongoose.connection.close()
  console.log('👋 資料庫連接已關閉')
  process.exit(0)
}

// 執行測試
runTest().catch((error) => {
  console.error('💥 測試過程中發生錯誤:', error)
  process.exit(1)
})
