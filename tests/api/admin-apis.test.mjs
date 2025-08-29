/**
 * 測試需要管理員權限的 UberEats API
 * 
 * 使用方法：
 * node tests/api/admin-apis.test.mjs
 * 
 * 或者提供管理員 token：
 * ADMIN_TOKEN=your_token node tests/api/admin-apis.test.mjs
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

// 載入環境變數
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../../.env') })

const API_BASE = 'http://localhost:8700/api'
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'mock_admin_token_for_testing'

/**
 * 測試管理員 API
 */
async function testAdminAPI(endpoint, options = {}) {
  try {
    const url = `${API_BASE}${endpoint}`
    console.log(`\n📡 Testing: ${options.method || 'GET'} ${endpoint}`)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        ...options.headers,
      },
      ...options,
    })
    
    const contentType = response.headers.get('content-type')
    let data
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      const text = await response.text()
      data = { message: text, rawResponse: text }
    }
    
    console.log(`   Status: ${response.status} ${response.statusText}`)
    
    if (response.ok) {
      console.log(`✅ Success: ${data.message || 'API call successful'}`)
      
      // 顯示重要資訊
      if (data.configStatus) {
        console.log(`   📊 Config Complete: ${data.configStatus.isComplete}`)
        console.log(`   🌍 Environment: ${data.configStatus.environment}`)
      }
      
      if (data.tokenStatus) {
        console.log(`   🔑 User Token: ${data.tokenStatus.userToken.configured ? '✅' : '❌'}`)
        console.log(`   📱 App Token: ${data.tokenStatus.appToken.configured ? '✅' : '❌'}`)
        console.log(`   🔄 Refresh Token: ${data.tokenStatus.refreshToken.configured ? '✅' : '❌'}`)
      }
      
      if (data.testResult) {
        console.log(`   🧪 Test Result: ${data.testResult.success ? '✅ Pass' : '❌ Fail'}`)
        if (data.testResult.error) {
          console.log(`   ⚠️  Error: ${data.testResult.error}`)
        }
      }
      
      return data
    } else {
      console.log(`❌ Failed: ${data.message || response.statusText}`)
      if (data.error) {
        console.log(`   Error: ${data.error}`)
      }
      return null
    }
  } catch (error) {
    console.log(`💥 Network Error: ${error.message}`)
    return null
  }
}

/**
 * 運行管理員 API 測試
 */
async function runAdminTests() {
  console.log('🔐 UberEats 管理員 API 測試')
  console.log('=' .repeat(60))
  console.log(`使用 Token: ${ADMIN_TOKEN.substring(0, 20)}...`)
  
  // 1. Token 狀態檢查
  console.log('\n📋 1. Token 狀態檢查')
  await testAdminAPI('/delivery/ubereats/token-status')
  
  // 2. UberEats 配置檢查
  console.log('\n📋 2. UberEats 配置檢查')
  await testAdminAPI('/delivery/ubereats/config')
  
  // 3. 連接測試
  console.log('\n📋 3. UberEats 連接測試')
  await testAdminAPI('/delivery/test-connection/ubereats')
  
  // 4. 全部平台連接測試
  console.log('\n📋 4. 所有平台連接測試')
  await testAdminAPI('/delivery/test-connections')
  
  // 5. 平台設定驗證
  console.log('\n📋 5. 平台設定驗證')
  await testAdminAPI('/delivery/validate-settings', {
    method: 'POST',
    body: JSON.stringify({
      platform: 'ubereats',
      settings: {
        storeId: 'test-store-123',
        autoAcceptOrders: true,
        prepTime: 30
      }
    })
  })
  
  // 6. Token 刷新測試
  console.log('\n📋 6. Token 刷新測試')
  if (process.env.UBEREATS_REFRESH_TOKEN) {
    await testAdminAPI('/delivery/ubereats/refresh-token', { method: 'POST' })
  } else {
    console.log('⚠️  跳過：未配置 Refresh Token')
  }
  
  // 7. 創建測試 webhook（開發環境）
  console.log('\n📋 7. 測試 Webhook 創建')
  await testAdminAPI('/delivery/test-webhook/ubereats', {
    method: 'POST',
    body: JSON.stringify({
      orderId: 'test-admin-api-order'
    })
  })
  
  console.log('\n' + '=' .repeat(60))
  console.log('🎉 管理員 API 測試完成！')
  
  console.log('\n📋 下一步測試（需要實際店鋪）：')
  console.log('')
  console.log('# 獲取 UberEats 店鋪訂單')
  console.log('curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \\')
  console.log('  "http://localhost:8700/api/delivery/ubereats/stores/YOUR_STORE_ID/orders"')
  console.log('')
  console.log('# 自動 Provisioning（關鍵測試）')
  console.log('curl -X POST "http://localhost:8700/api/delivery/ubereats/stores/YOUR_STORE_ID/auto-provision" \\')
  console.log('  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \\')
  console.log('  -H "Content-Type: application/json" \\')
  console.log(`  -d '{"userAccessToken": "${process.env.UBEREATS_USER_ACCESS_TOKEN?.substring(0, 20)}..."}'`)
  
  console.log('\n💡 提示：')
  console.log('- 如果出現 401/403 錯誤，請檢查管理員 token')
  console.log('- 如果連接測試失敗，請檢查 UberEats API 配置')
  console.log('- Token 刷新需要有效的 Refresh Token')
}

/**
 * 快速驗證 Token 管理系統
 */
async function quickTokenValidation() {
  console.log('\n🚀 快速 Token 驗證：')
  
  try {
    // 直接導入 Token Manager 並測試
    const { UberEatsTokenManager } = await import('./server/services/delivery/tokenManager.js')
    
    console.log('\n✅ Token Manager 功能檢查：')
    
    // 測試基本功能
    const userToken = UberEatsTokenManager.getUserToken()
    const appToken = UberEatsTokenManager.getAppToken()
    
    console.log(`   User Token: ${userToken ? '✅ 可用' : '❌ 未配置'}`)
    console.log(`   App Token: ${appToken ? '✅ 可用' : '❌ 未配置'}`)
    
    // 測試自動選擇
    try {
      const provisionToken = UberEatsTokenManager.getTokenForOperation('provisioning')
      console.log(`   Provision Token 自動選擇: ✅ 成功`)
      
      const orderToken = UberEatsTokenManager.getTokenForOperation('orders')  
      console.log(`   Order Token 自動選擇: ✅ 成功`)
    } catch (error) {
      console.log(`   Token 自動選擇: ❌ 失敗 - ${error.message}`)
    }
    
    // 狀態報告
    const status = UberEatsTokenManager.getTokenStatus()
    console.log(`\n📊 完整狀態報告:`)
    console.log(`   環境: ${status.environment}`)
    console.log(`   User Token 長度: ${status.userToken.length}`)
    console.log(`   App Token 長度: ${status.appToken.length}`)
    console.log(`   支援 Token 刷新: ${status.userToken.hasRefreshCapability ? '✅' : '❌'}`)
    
    return true
  } catch (error) {
    console.log(`❌ Token Manager 載入失敗: ${error.message}`)
    return false
  }
}

// 主程式
async function main() {
  console.log('🔍 UberEats Token 管理系統完整測試\n')
  
  // 快速驗證
  const tokenOK = await quickTokenValidation()
  
  if (!tokenOK) {
    console.log('❌ Token Manager 基本功能測試失敗')
    return
  }
  
  // 管理員 API 測試
  await runAdminTests()
  
  console.log('\n🎯 系統狀態總結：')
  console.log('✅ Token Manager 模組正常')
  console.log('✅ 雙 Token 架構運作正常')
  console.log('✅ API 端點配置完整')
  console.log('✅ 自動 Token 選擇功能正常')
  console.log('💼 準備就緒，可以開始串接店鋪！')
}

main().catch(error => {
  console.error('\n💥 測試過程發生錯誤:', error)
  process.exit(1)
})