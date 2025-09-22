/**
 * Token Manager 測試腳本
 * 直接測試 Token Manager 功能，不需要 controller/router
 *
 * 使用方式：
 * node scripts/test-token-manager.js
 */

import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { withPlatformToken } from '../../../server/services/delivery/core/tokenManager.js'

// 載入環境變數
dotenv.config()

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
 * 測試 1: 基本 Token 獲取
 */
const testBasicTokenFetch = async () => {
  console.log('📝 測試 1: 基本 Token 獲取')
  console.log('='.repeat(50))

  try {
    const result = await withPlatformToken('ubereats', async (token) => {
      console.log('✅ Token 獲取成功！')
      console.log(`   Token 前綴: ${token.substring(0, 20)}...`)
      console.log(`   Token 長度: ${token.length}`)
      return { success: true, tokenLength: token.length }
    })

    console.log('   返回結果:', result)
  } catch (error) {
    console.error('❌ 測試失敗:', error.message)
  }

  console.log('\n')
}

/**
 * 測試 2: 模擬 API 調用
 */
const testAPICall = async () => {
  console.log('📝 測試 2: 模擬 API 調用')
  console.log('='.repeat(50))

  try {
    // 模擬獲取訂單
    const orders = await withPlatformToken(
      'ubereats',
      async (token, storeId) => {
        console.log('✅ 正在使用 Token 調用 API...')
        console.log(`   Store ID: ${storeId}`)
        console.log(`   Token: ${token.substring(0, 20)}...`)

        // 這裡可以替換成真實的 API 調用
        return {
          storeId,
          orders: ['order-1', 'order-2'],
          timestamp: new Date(),
        }
      },
      'd641fef3-0fb5-408c-b20a-d65b3c082530', // 測試 Store ID
    )

    console.log('   API 調用結果:', JSON.stringify(orders, null, 2))
  } catch (error) {
    console.error('❌ 測試失敗:', error.message)
  }

  console.log('\n')
}

/**
 * 測試 3: Token 重複使用（應該使用緩存）
 */
const testTokenReuse = async () => {
  console.log('📝 測試 3: Token 重複使用（測試緩存）')
  console.log('='.repeat(50))

  try {
    console.log('第一次調用:')
    await withPlatformToken('ubereats', async (token) => {
      console.log(`   Token: ${token.substring(0, 20)}...`)
    })

    console.log('\n第二次調用（應該使用緩存的 Token）:')
    await withPlatformToken('ubereats', async (token) => {
      console.log(`   Token: ${token.substring(0, 20)}...`)
    })

    console.log('\n✅ 如果沒有看到 "獲取新的 ubereats token"，說明緩存正常工作！')
  } catch (error) {
    console.error('❌ 測試失敗:', error.message)
  }

  console.log('\n')
}

/**
 * 測試 4: 檢查 MongoDB 中的 Token
 */
const testTokenInDB = async () => {
  console.log('📝 測試 4: 檢查 MongoDB 中的 Token')
  console.log('='.repeat(50))

  try {
    const PlatformToken = mongoose.model('PlatformToken')
    const tokens = await PlatformToken.find({})

    console.log(`找到 ${tokens.length} 個 Token:\n`)

    for (const token of tokens) {
      const now = new Date()
      const timeLeft = Math.floor((token.expiresAt - now) / 1000 / 60) // 分鐘
      const isExpired = token.expiresAt <= now

      console.log(`平台: ${token.platform}`)
      console.log(`  Access Token: ${token.accessToken.substring(0, 30)}...`)
      console.log(`  過期時間: ${token.expiresAt.toLocaleString('zh-TW')}`)
      console.log(`  狀態: ${isExpired ? '❌ 已過期' : '✅ 有效'}`)
      console.log(`  剩餘時間: ${timeLeft} 分鐘`)
      console.log(`  Token 類型: ${token.metadata?.tokenType || 'N/A'}`)
      console.log(`  權限範圍: ${token.metadata?.scope || 'N/A'}`)
      console.log()
    }
  } catch (error) {
    console.error('❌ 測試失敗:', error.message)
  }

  console.log('\n')
}

/**
 * 測試 5: 多平台測試（如果 Foodpanda 已實作）
 */
const testMultiplePlatforms = async () => {
  console.log('📝 測試 5: 多平台測試')
  console.log('='.repeat(50))

  const platforms = ['ubereats', 'foodpanda']

  for (const platform of platforms) {
    console.log(`\n測試 ${platform}:`)
    try {
      await withPlatformToken(platform, async (token) => {
        console.log(`  ✅ ${platform} Token 獲取成功`)
        console.log(`     Token: ${token.substring(0, 20)}...`)
      })
    } catch (error) {
      console.log(`  ⚠️ ${platform} Token 獲取失敗: ${error.message}`)
    }
  }

  console.log('\n')
}

/**
 * 測試 6: 錯誤處理
 */
const testErrorHandling = async () => {
  console.log('📝 測試 6: 錯誤處理')
  console.log('='.repeat(50))

  try {
    console.log('測試不支援的平台:')
    await withPlatformToken('invalid_platform', async (token) => {
      console.log('不應該執行到這裡')
    })
  } catch (error) {
    console.log(`  ✅ 正確捕獲錯誤: ${error.message}`)
  }

  console.log('\n')
}

// ========================================
// 🚀 主測試流程
// ========================================

const runAllTests = async () => {
  console.log('\n')
  console.log('🧪 Token Manager 測試開始')
  console.log('='.repeat(50))
  console.log('\n')

  await connectDB()

  // 執行所有測試
  await testBasicTokenFetch()
  await testAPICall()
  await testTokenReuse()
  await testTokenInDB()
  await testMultiplePlatforms()
  await testErrorHandling()

  console.log('='.repeat(50))
  console.log('✅ 所有測試完成！')
  console.log('='.repeat(50))
  console.log('\n')

  // 關閉資料庫連接
  await mongoose.connection.close()
  console.log('👋 資料庫連接已關閉')
  process.exit(0)
}

// 執行測試
runAllTests().catch((error) => {
  console.error('💥 測試過程中發生錯誤:', error)
  process.exit(1)
})
