/**
 * 驗證 Webhook 簽名修復的測試腳本
 * 這個腳本會模擬實際的 webhook 請求流程
 */

import crypto from 'crypto'
import dotenv from 'dotenv'
import { verifyUberEatsSignature } from '../server/utils/webhookSecurity.js'

dotenv.config()

const webhookSecret = process.env.UBEREATS_WEBHOOK_SECRET

if (!webhookSecret) {
  console.error('❌ 錯誤: 未設定 UBEREATS_WEBHOOK_SECRET')
  process.exit(1)
}

console.log('🧪 測試 Webhook 簽名驗證修復')
console.log('='.repeat(80))
console.log()

// 測試 payload
const testPayload = {
  event_id: `test_${Date.now()}`,
  event_type: 'orders.notification',
  event_time: Math.floor(Date.now() / 1000),
  meta: {
    resource_id: 'test_order_123',
  },
}

const payloadString = JSON.stringify(testPayload)
const payloadBuffer = Buffer.from(payloadString, 'utf8')

// 生成正確的簽名
const hmac = crypto.createHmac('sha256', webhookSecret)
hmac.update(payloadString)
const correctSignature = hmac.digest('hex').toLowerCase()

console.log('📦 測試 Payload:')
console.log(JSON.stringify(testPayload, null, 2))
console.log()

// 測試案例
const testCases = [
  {
    name: '✅ 測試 1: Buffer payload (正確方式)',
    payload: payloadBuffer,
    signature: correctSignature,
    expectedResult: true,
  },
  {
    name: '✅ 測試 2: 字串 payload (備用方式)',
    payload: payloadString,
    signature: correctSignature,
    expectedResult: true,
  },
  {
    name: '⚠️  測試 3: 物件 payload (應該也能處理,但會有警告)',
    payload: testPayload,
    signature: correctSignature,
    expectedResult: true,
  },
  {
    name: '❌ 測試 4: 錯誤的簽名',
    payload: payloadBuffer,
    signature: 'invalid-signature-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    expectedResult: false,
  },
  {
    name: '❌ 測試 5: 缺少簽名',
    payload: payloadBuffer,
    signature: null,
    expectedResult: false,
  },
]

let passedTests = 0
let failedTests = 0

console.log('🔬 執行測試案例:')
console.log()

for (const testCase of testCases) {
  console.log(testCase.name)
  console.log('-'.repeat(80))

  const result = verifyUberEatsSignature(testCase.payload, testCase.signature, webhookSecret)

  console.log(`預期結果: ${testCase.expectedResult}`)
  console.log(`實際結果: ${result}`)

  if (result === testCase.expectedResult) {
    console.log('✅ 測試通過')
    passedTests++
  } else {
    console.log('❌ 測試失敗')
    failedTests++
  }

  console.log()
}

console.log('='.repeat(80))
console.log('📊 測試結果統計:')
console.log()
console.log(`✅ 通過: ${passedTests}/${testCases.length}`)
console.log(`❌ 失敗: ${failedTests}/${testCases.length}`)
console.log()

if (failedTests === 0) {
  console.log('🎉 所有測試通過! Webhook 簽名驗證修復成功!')
  process.exit(0)
} else {
  console.log('⚠️ 部分測試失敗,請檢查實作')
  process.exit(1)
}
