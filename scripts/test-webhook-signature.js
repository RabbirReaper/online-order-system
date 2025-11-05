/**
 * UberEats Webhook 簽名驗證測試工具
 * 用於測試本地 webhook 端點的簽名驗證是否正常工作
 *
 * 使用方法:
 * node scripts/test-webhook-signature.js [webhook_secret]
 *
 * 如果不提供 webhook_secret 參數，將從環境變數讀取
 */

import crypto from 'crypto'
import dotenv from 'dotenv'

dotenv.config()

// 從命令行參數或環境變數獲取密鑰
const webhookSecret = process.argv[2] || process.env.UBEREATS_WEBHOOK_SECRET

if (!webhookSecret) {
  console.error('❌ 錯誤: 未提供 webhook 密鑰')
  console.error('使用方法:')
  console.error('  node scripts/test-webhook-signature.js [webhook_secret]')
  console.error('  或在 .env 文件中設定 UBEREATS_WEBHOOK_SECRET')
  process.exit(1)
}

console.log('🔐 UberEats Webhook 簽名驗證測試工具')
console.log('='.repeat(80))
console.log()

// 測試 payload
const testPayload = {
  event_id: `test_${Date.now()}`,
  event_type: 'orders.notification',
  event_time: Math.floor(Date.now() / 1000),
  meta: {
    resource_id: 'test_order_123',
    resource_href: 'https://api.uber.com/v1/eats/stores/test-store/orders/test-order-123',
    user_id: 'test_store_456',
  },
  resource_href: 'https://api.uber.com/v1/eats/stores/test-store/orders/test-order-123',
}

const payloadString = JSON.stringify(testPayload)

// 生成簽名（按照 UberEats 官方文檔）
const hmac = crypto.createHmac('sha256', webhookSecret)
hmac.update(payloadString)
const signature = hmac.digest('hex').toLowerCase()

console.log('📦 測試 Payload:')
console.log(JSON.stringify(testPayload, null, 2))
console.log()

console.log('🔑 使用的密鑰:')
console.log(`   ${webhookSecret.substring(0, 10)}...${webhookSecret.substring(webhookSecret.length - 10)}`)
console.log()

console.log('✍️ 生成的簽名:')
console.log(`   ${signature}`)
console.log()

console.log('='.repeat(80))
console.log('📡 測試 curl 指令:')
console.log()

// 獲取本地服務器 URL
const serverUrl = process.env.VITE_API_BASE_URL || 'http://localhost:8700/api'
const webhookUrl = `${serverUrl}/delivery/webhooks/ubereats`

console.log('💡 方式 1: 使用正確的簽名 (應該成功)')
console.log(`curl -X POST "${webhookUrl}" \\`)
console.log(`  -H "Content-Type: application/json" \\`)
console.log(`  -H "X-Uber-Signature: ${signature}" \\`)
console.log(`  -d '${payloadString}'`)
console.log()

console.log('💡 方式 2: 使用錯誤的簽名 (應該被拒絕)')
console.log(`curl -X POST "${webhookUrl}" \\`)
console.log(`  -H "Content-Type: application/json" \\`)
console.log(`  -H "X-Uber-Signature: invalid-signature-12345" \\`)
console.log(`  -d '${payloadString}'`)
console.log()

console.log('💡 方式 3: 不提供簽名 (應該被拒絕)')
console.log(`curl -X POST "${webhookUrl}" \\`)
console.log(`  -H "Content-Type: application/json" \\`)
console.log(`  -d '${payloadString}'`)
console.log()

console.log('='.repeat(80))
console.log('📝 驗證步驟:')
console.log()
console.log('1️⃣ 確保你的伺服器正在運行:')
console.log('   node server.js')
console.log()
console.log('2️⃣ 在 .env 文件中設定 UBEREATS_WEBHOOK_SECRET:')
console.log(`   UBEREATS_WEBHOOK_SECRET="${webhookSecret}"`)
console.log()
console.log('3️⃣ 執行上述 curl 指令測試不同情況')
console.log()
console.log('4️⃣ 預期結果:')
console.log('   ✅ 方式 1 (正確簽名): HTTP 200 + 訂單處理成功')
console.log('   ❌ 方式 2 (錯誤簽名): HTTP 401 + 簽名驗證失敗')
console.log('   ❌ 方式 3 (無簽名): HTTP 401 + 缺少簽名標頭')
console.log()

console.log('='.repeat(80))
console.log('🧪 驗證邏輯:')
console.log()
console.log('const hmac = crypto.createHmac("sha256", secret)')
console.log('hmac.update(requestBody)')
console.log('const computedSignature = hmac.digest("hex").toLowerCase()')
console.log('return computedSignature === providedSignature')
console.log()

console.log('='.repeat(80))
console.log('🔄 重放攻擊測試:')
console.log()
console.log('連續執行兩次相同的請求，第二次應該被拒絕:')
console.log()
console.log('# 第一次 (應該成功)')
console.log(`curl -X POST "${webhookUrl}" \\`)
console.log(`  -H "Content-Type: application/json" \\`)
console.log(`  -H "X-Uber-Signature: ${signature}" \\`)
console.log(`  -d '${payloadString}'`)
console.log()
console.log('# 第二次 (應該被拒絕: 事件已處理過)')
console.log(`curl -X POST "${webhookUrl}" \\`)
console.log(`  -H "Content-Type: application/json" \\`)
console.log(`  -H "X-Uber-Signature: ${signature}" \\`)
console.log(`  -d '${payloadString}'`)
console.log()

console.log('='.repeat(80))
console.log('✅ 測試工具準備完成！')
console.log()
