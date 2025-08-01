/**
 * UberEats Webhook 簽名密鑰生成工具
 * 生成符合安全標準的 HMAC 簽名密鑰
 *
 * 使用方法: node scripts/generate-signing-keys.js
 */

import crypto from 'crypto'

console.log('🔐 UberEats Webhook 簽名密鑰生成器')
console.log('='.repeat(50))
console.log()

/**
 * 生成安全的隨機密鑰
 * @param {number} length - 密鑰長度（bytes）
 * @returns {string} - Base64 編碼的密鑰
 */
function generateSecureKey(length = 32) {
  return crypto.randomBytes(length).toString('base64')
}

/**
 * 生成十六進制密鑰
 * @param {number} length - 密鑰長度（bytes）
 * @returns {string} - 十六進制密鑰
 */
function generateSecureKeyHex(length = 32) {
  return crypto.randomBytes(length).toString('hex')
}

// 生成主要簽名密鑰
const primaryKey = generateSecureKey(32) // 256-bit key
const secondaryKey = generateSecureKey(32) // 256-bit key

// 也生成十六進制版本，某些情況下可能更適用
const primaryKeyHex = generateSecureKeyHex(32)
const secondaryKeyHex = generateSecureKeyHex(32)

console.log('📋 為 UberEats Developer Dashboard 生成的密鑰:')
console.log()

console.log('🔑 Signing Key (Primary):')
console.log(`   Base64: ${primaryKey}`)
console.log(`   Hex:    ${primaryKeyHex}`)
console.log()

console.log('🔑 Secondary Signing Key:')
console.log(`   Base64: ${secondaryKey}`)
console.log(`   Hex:    ${secondaryKeyHex}`)
console.log()

console.log('='.repeat(50))
console.log('📝 設定說明:')
console.log()
console.log('1️⃣ 在 UberEats Developer Dashboard 中:')
console.log('   - Signing Key: 輸入上面的 Primary Base64 密鑰')
console.log('   - Secondary Signing Key: 輸入上面的 Secondary Base64 密鑰')
console.log()

console.log('2️⃣ 在你的 .env 檔案中:')
console.log('   # UberEats Webhook 簽名密鑰')
console.log(`   UBEREATS_SANDBOX_WEBHOOK_SECRET="${primaryKey}"`)
console.log(`   UBEREATS_SANDBOX_WEBHOOK_SECRET_SECONDARY="${secondaryKey}"`)
console.log()
console.log('   # 生產環境（將來使用）')
console.log(`   # UBEREATS_PRODUCTION_WEBHOOK_SECRET="${primaryKey}"`)
console.log(`   # UBEREATS_PRODUCTION_WEBHOOK_SECRET_SECONDARY="${secondaryKey}"`)
console.log()

console.log('3️⃣ 安全注意事項:')
console.log('   ✅ 這些密鑰非常重要，請妥善保管')
console.log('   ✅ 不要在版本控制系統中提交這些密鑰')
console.log('   ✅ 定期輪換密鑰以提高安全性')
console.log('   ✅ 生產環境和測試環境使用不同的密鑰')
console.log()

console.log('4️⃣ 密鑰輪換流程:')
console.log('   1. 先在 Dashboard 更新 Secondary Signing Key')
console.log('   2. 更新你的系統支援新密鑰')
console.log('   3. 測試確認新密鑰正常工作')
console.log('   4. 將 Secondary Key 提升為 Primary Key')
console.log('   5. 生成新的 Secondary Key')
console.log()

console.log('🧪 測試你的簽名驗證:')
console.log(`   node scripts/test-webhook-signature.js "${primaryKey}"`)
console.log()

// 生成測試用的簽名範例
const testPayload = JSON.stringify({
  event_type: 'orders.notification',
  event_id: 'test-123',
  meta: { resource_id: 'test-order-456' },
})

const testSignature = crypto.createHmac('sha256', primaryKey).update(testPayload).digest('hex')

console.log('🔍 簽名驗證測試範例:')
console.log('   測試 Payload:')
console.log(`   ${testPayload}`)
console.log()
console.log('   使用 Primary Key 生成的簽名:')
console.log(`   ${testSignature}`)
console.log()
console.log('   驗證指令:')
console.log(`   curl -X POST "http://localhost:8700/api/delivery/webhook/ubereats" \\`)
console.log(`     -H "Content-Type: application/json" \\`)
console.log(`     -H "X-Uber-Signature: ${testSignature}" \\`)
console.log(`     -d '${testPayload}'`)

console.log()
console.log('='.repeat(50))
console.log('✅ 密鑰生成完成！請按照上述說明進行設定。')
