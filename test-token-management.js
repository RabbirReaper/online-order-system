/**
 * UberEats Token 管理系統測試腳本
 * 測試雙 Token 架構的所有功能
 */

import dotenv from 'dotenv'
dotenv.config()

// 測試用的 API 端點
const API_BASE = process.env.VITE_API_BASE_URL || 'http://localhost:8700/api'

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
        'Authorization': `Bearer mock_admin_token`, // 測試環境使用
        ...options.headers,
      },
      ...options,
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log(`✅ Success: ${data.message || 'API call successful'}`)
      return data
    } else {
      console.log(`❌ Failed: ${data.message || 'API call failed'}`)
      return null
    }
  } catch (error) {
    console.log(`💥 Error: ${error.message}`)
    return null
  }
}

/**
 * 完整測試流程
 */
async function runTests() {
  console.log('🚀 開始 UberEats Token 管理系統測試\n')
  console.log('=' .repeat(60))
  
  // 1. 檢查 Token 狀態
  console.log('\n📋 步驟 1: 檢查 Token 配置狀態')
  await testAPI('/delivery/ubereats/token-status')
  
  // 2. 檢查 UberEats 整體配置
  console.log('\n📋 步驟 2: 檢查 UberEats 配置')
  await testAPI('/delivery/ubereats/config')
  
  // 3. 測試平台連接
  console.log('\n📋 步驟 3: 測試 UberEats API 連接')
  await testAPI('/delivery/test-connection/ubereats')
  
  // 4. 測試支援的平台列表
  console.log('\n📋 步驟 4: 獲取支援平台列表')
  await testAPI('/delivery/platforms')
  
  // 5. 測試 Webhook 接收
  console.log('\n📋 步驟 5: 測試 Webhook 接收')
  await testAPI('/delivery/webhook/ubereats', {
    method: 'POST',
    body: JSON.stringify({
      event_type: 'orders.notification',
      meta: {
        resource_id: 'test-order-token-management'
      }
    })
  })
  
  // 6. 測試自動 Provisioning（需要真實 Store ID）
  console.log('\n📋 步驟 6: 測試自動 Provisioning')
  console.log('⚠️  需要先在前端設定 UberEats Store ID，然後手動測試：')
  console.log('curl -X POST "http://localhost:8700/api/delivery/ubereats/stores/YOUR_STORE_ID/auto-provision" \\')
  console.log('  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \\')
  console.log('  -d \'{"userAccessToken": "YOUR_USER_TOKEN"}\'')
  
  // 7. 測試 Token 刷新（如果有 refresh token）
  console.log('\n📋 步驟 7: 測試 Token 刷新')
  if (process.env.UBEREATS_REFRESH_TOKEN) {
    await testAPI('/delivery/ubereats/refresh-token', { method: 'POST' })
  } else {
    console.log('⚠️  Refresh Token 未配置，跳過測試')
  }
  
  console.log('\n' + '=' .repeat(60))
  console.log('🎉 Token 管理系統測試完成！')
  
  // 顯示配置檢查清單
  console.log('\n📝 配置檢查清單：')
  console.log(`✅ User Access Token: ${process.env.UBEREATS_USER_ACCESS_TOKEN ? '已配置' : '❌ 未配置'}`)
  console.log(`✅ App Access Token: ${process.env.UBEREATS_APP_ACCESS_TOKEN ? '已配置' : '❌ 未配置'}`)
  console.log(`✅ Refresh Token: ${process.env.UBEREATS_REFRESH_TOKEN ? '已配置' : '⚠️  未配置（可選）'}`)
  console.log(`✅ Server URL: ${process.env.SERVER_URL || '使用預設值'}`)
  console.log(`✅ Company Name: ${process.env.COMPANY_NAME || '使用預設值'}`)
  
  console.log('\n🎯 下一步操作指南：')
  console.log('1. 確保所有 Token 都已正確配置')
  console.log('2. 在前端設定 UberEats Store ID')
  console.log('3. 使用 Auto Provisioning API 啟動店鋪整合')
  console.log('4. 在 UberEats Developer Dashboard 設定 Webhook URL')
  console.log('5. 進行端到端測試（實際下訂單）')
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
  console.log(`   用途: 一次性店鋪整合設定`)
  console.log(`   權限: eats.pos_provisioning, offline_access`)
  
  console.log('\n📱 App Access Token (日常 API 用):')
  console.log(`   狀態: ${appToken ? '✅ 已配置' : '❌ 未配置'}`)
  console.log(`   長度: ${appToken ? appToken.length : 0} 字符`)
  console.log(`   用途: 日常 API 操作 (訂單、店鋪管理)`)
  console.log(`   權限: eats.order, eats.store.orders.read, etc.`)
  
  console.log('\n🔄 Refresh Token (Token 更新用):')
  console.log(`   狀態: ${refreshToken ? '✅ 已配置' : '⚠️  未配置'}`)
  console.log(`   長度: ${refreshToken ? refreshToken.length : 0} 字符`)
  console.log(`   用途: 更新 User Access Token`)
  console.log(`   說明: ${refreshToken ? '支援自動 Token 更新' : '需手動重新授權'}`)
}

// 執行測試
if (import.meta.url === `file://${process.argv[1]}`) {
  displayTokenInfo()
  runTests().catch(console.error)
}

export { runTests, testAPI, displayTokenInfo }