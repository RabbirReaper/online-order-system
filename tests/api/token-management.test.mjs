/**
 * UberEats Token 管理系統測試腳本
 * 測試雙 Token 架構的所有功能
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

// 載入環境變數
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../../.env') })

// 測試用的 API 端點
const API_BASE = process.env.VITE_API_BASE_URL || 'http://localhost:8700/api'

/**
 * 測試伺服器是否運行
 */
async function testServerConnection() {
  try {
    const response = await fetch('http://localhost:8700')
    return response.ok
  } catch (error) {
    return false
  }
}

/**
 * 測試 API 端點
 */
async function testAPI(endpoint, options = {}) {
  try {
    const url = `${API_BASE}${endpoint}`
    console.log(`\n📡 Testing: ${options.method || 'GET'} ${url}`)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // 注意：在實際使用時需要真實的 admin token
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
      data = { message: text }
    }
    
    if (response.ok) {
      console.log(`✅ Success (${response.status}): ${data.message || 'API call successful'}`)
      console.log(`   Response:`, data)
      return data
    } else {
      console.log(`❌ Failed (${response.status}): ${data.message || response.statusText}`)
      console.log(`   Error:`, data)
      return null
    }
  } catch (error) {
    console.log(`💥 Error: ${error.message}`)
    return null
  }
}

/**
 * Token 資訊顯示（不洩露敏感資訊）
 */
function displayTokenInfo() {
  console.log('\n🔑 Token 資訊總覽：')
  
  const userToken = process.env.UBEREATS_USER_ACCESS_TOKEN
  const appToken = process.env.UBEREATS_APP_ACCESS_TOKEN
  const refreshToken = process.env.UBEREATS_REFRESH_TOKEN
  
  console.log('\n👤 User Access Token (Provisioning 用):')
  console.log(`   狀態: ${userToken ? '✅ 已配置' : '❌ 未配置'}`)
  console.log(`   長度: ${userToken ? userToken.length : 0} 字符`)
  if (userToken) {
    console.log(`   前綴: ${userToken.substring(0, 15)}...`)
  }
  console.log(`   用途: 一次性店鋪整合設定`)
  console.log(`   權限: eats.pos_provisioning, offline_access`)
  
  console.log('\n📱 App Access Token (日常 API 用):')
  console.log(`   狀態: ${appToken ? '✅ 已配置' : '❌ 未配置'}`)
  console.log(`   長度: ${appToken ? appToken.length : 0} 字符`)
  if (appToken) {
    console.log(`   前綴: ${appToken.substring(0, 15)}...`)
  }
  console.log(`   用途: 日常 API 操作 (訂單、店鋪管理)`)
  console.log(`   權限: eats.order, eats.store.orders.read, etc.`)
  
  console.log('\n🔄 Refresh Token (Token 更新用):')
  console.log(`   狀態: ${refreshToken ? '✅ 已配置' : '⚠️  未配置'}`)
  console.log(`   長度: ${refreshToken ? refreshToken.length : 0} 字符`)
  if (refreshToken) {
    console.log(`   前綴: ${refreshToken.substring(0, 15)}...`)
  }
  console.log(`   用途: 更新 User Access Token`)
  console.log(`   說明: ${refreshToken ? '支援自動 Token 更新' : '需手動重新授權'}`)
  
  // 其他配置
  console.log('\n⚙️  其他配置:')
  console.log(`   Server URL: ${process.env.SERVER_URL || '未設定，將使用預設值'}`)
  console.log(`   Company Name: ${process.env.COMPANY_NAME || '未設定，將使用預設值'}`)
  console.log(`   Environment: ${process.env.UBEREATS_ENVIRONMENT || 'sandbox'}`)
}

/**
 * 測試基本 Token 管理功能
 */
async function testTokenManagement() {
  console.log('\n📋 測試 Token 管理功能：')
  
  // 直接測試 Token Manager 模組
  try {
    const { UberEatsTokenManager } = await import('../../server/services/delivery/tokenManager.js')
    
    console.log('\n🔍 Token Manager 狀態檢查：')
    const status = UberEatsTokenManager.getTokenStatus()
    console.log('✅ Token Manager 已載入')
    console.log('   配置狀態:', status)
    
    console.log('\n🧪 Token 功能測試：')
    const userToken = UberEatsTokenManager.getUserToken()
    const appToken = UberEatsTokenManager.getAppToken()
    
    console.log(`   User Token 獲取: ${userToken ? '✅ 成功' : '❌ 失敗'}`)
    console.log(`   App Token 獲取: ${appToken ? '✅ 成功' : '❌ 失敗'}`)
    
    // 測試自動選擇
    try {
      const provisionToken = UberEatsTokenManager.getTokenForOperation('provisioning')
      const orderToken = UberEatsTokenManager.getTokenForOperation('orders')
      
      console.log(`   Provisioning Token 自動選擇: ${provisionToken ? '✅ 成功' : '❌ 失敗'}`)
      console.log(`   Order Token 自動選擇: ${orderToken ? '✅ 成功' : '❌ 失敗'}`)
    } catch (error) {
      console.log(`   Token 自動選擇測試: ❌ 失敗 - ${error.message}`)
    }
    
    return true
  } catch (error) {
    console.log(`❌ Token Manager 載入失敗: ${error.message}`)
    return false
  }
}

/**
 * 完整測試流程
 */
async function runTests() {
  console.log('🚀 開始 UberEats Token 管理系統測試\n')
  console.log('=' .repeat(80))
  
  // 0. 檢查伺服器連接
  console.log('\n📋 步驟 0: 檢查伺服器狀態')
  const serverRunning = await testServerConnection()
  
  if (!serverRunning) {
    console.log('❌ 伺服器未運行！請先啟動伺服器：node server.js')
    console.log('\n⚠️  繼續測試 Token Manager 模組功能...')
  } else {
    console.log('✅ 伺服器正在運行')
  }
  
  // 1. 測試 Token Manager 模組
  console.log('\n📋 步驟 1: 測試 Token Manager 模組')
  const tokenManagerOK = await testTokenManagement()
  
  if (!tokenManagerOK) {
    console.log('❌ Token Manager 測試失敗，終止測試')
    return
  }
  
  // 只有在伺服器運行時才測試 API 端點
  if (serverRunning) {
    // 2. 測試支援的平台列表（無需認證）
    console.log('\n📋 步驟 2: 獲取支援平台列表')
    await testAPI('/delivery/platforms')
    
    // 3. 測試 Webhook 接收（無需認證）
    console.log('\n📋 步驟 3: 測試 Webhook 接收')
    await testAPI('/delivery/webhook/ubereats', {
      method: 'POST',
      body: JSON.stringify({
        event_type: 'orders.notification',
        meta: {
          resource_id: 'test-order-token-management'
        }
      })
    })
    
    console.log('\n📋 需要管理員權限的 API 端點測試：')
    console.log('   以下端點需要有效的管理員 token，在實際環境中測試：')
    console.log('   - GET /api/delivery/ubereats/token-status')
    console.log('   - GET /api/delivery/ubereats/config')
    console.log('   - GET /api/delivery/test-connection/ubereats')
    console.log('   - POST /api/delivery/ubereats/refresh-token')
    console.log('   - POST /api/delivery/ubereats/stores/{storeId}/auto-provision')
  }
  
  console.log('\n' + '=' .repeat(80))
  console.log('🎉 Token 管理系統測試完成！')
  
  // 顯示使用指南
  console.log('\n📖 使用指南：')
  console.log('\n🔧 手動測試 API 端點：')
  console.log('1. 獲取管理員 token（登入後端管理介面）')
  console.log('2. 使用 curl 測試：')
  console.log('')
  console.log('# 檢查 token 狀態')
  console.log('curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \\')
  console.log('  http://localhost:8700/api/delivery/ubereats/token-status')
  console.log('')
  console.log('# 測試自動 provisioning')
  console.log('curl -X POST "http://localhost:8700/api/delivery/ubereats/stores/YOUR_STORE_ID/auto-provision" \\')
  console.log('  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \\')
  console.log('  -H "Content-Type: application/json" \\')
  console.log('  -d \'{"userAccessToken": "YOUR_USER_TOKEN"}\'')
  
  console.log('\n🚀 完整串接流程：')
  console.log('1. 在前端新增 UberEats 平台設定')
  console.log('2. 使用 auto-provision API 啟動整合')
  console.log('3. 在 UberEats Dashboard 設定 webhook URL')
  console.log('4. 測試端到端訂單流程')
}

// 執行測試
console.log('🔍 UberEats Token Management System Test')
console.log('測試環境設定檢查...\n')

displayTokenInfo()

runTests().catch(error => {
  console.error('\n💥 測試過程中發生錯誤:', error)
  process.exit(1)
})