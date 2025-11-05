/**
 * 驗證 webhook 路由和 delivery 路由已正確分離
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🧪 驗證路由分離')
console.log('='.repeat(80))
console.log()

// 讀取檔案內容
const webhookRoutesPath = join(__dirname, '../server/routes/webhooks.js')
const deliveryRoutesPath = join(__dirname, '../server/routes/delivery.js')
const serverJsPath = join(__dirname, '../server.js')

const webhookRoutesContent = readFileSync(webhookRoutesPath, 'utf8')
const deliveryRoutesContent = readFileSync(deliveryRoutesPath, 'utf8')
const serverJsContent = readFileSync(serverJsPath, 'utf8')

let allPassed = true

// 檢查 1: webhooks.js 應該包含 webhook 路由
console.log('✅ 檢查 1: server/routes/webhooks.js')
console.log('-'.repeat(80))

const webhookChecks = [
  { pattern: /\/ubereats/, description: 'UberEats webhook 路由' },
  { pattern: /\/foodpanda/, description: 'Foodpanda webhook 路由' },
  { pattern: /express\.raw/, description: 'express.raw() 中間件' },
  { pattern: /verifyUberEatsWebhookMiddleware/, description: 'UberEats 簽名驗證中間件' },
]

webhookChecks.forEach((check) => {
  if (check.pattern.test(webhookRoutesContent)) {
    console.log(`  ✅ ${check.description}`)
  } else {
    console.log(`  ❌ 缺少: ${check.description}`)
    allPassed = false
  }
})
console.log()

// 檢查 2: delivery.js 不應該包含 webhook 路由
console.log('✅ 檢查 2: server/routes/delivery.js (不應該有 webhook)')
console.log('-'.repeat(80))

const deliveryChecks = [
  { pattern: /\/webhooks\/ubereats/, description: 'UberEats webhook 路由', shouldNotExist: true },
  {
    pattern: /\/webhooks\/foodpanda/,
    description: 'Foodpanda webhook 路由',
    shouldNotExist: true,
  },
  {
    pattern: /verifyUberEatsWebhookMiddleware/,
    description: 'UberEats 簽名驗證中間件',
    shouldNotExist: true,
  },
  { pattern: /\/brands\/:brandId\/:storeId\/sync-menu/, description: '菜單同步路由' },
  { pattern: /\/brands\/:brandId\/:storeId\/sync-status/, description: '同步狀態路由' },
  { pattern: /\/brands\/:brandId\/:storeId\/sync-inventory/, description: '庫存同步路由' },
]

deliveryChecks.forEach((check) => {
  const exists = check.pattern.test(deliveryRoutesContent)
  if (check.shouldNotExist) {
    if (!exists) {
      console.log(`  ✅ 已移除: ${check.description}`)
    } else {
      console.log(`  ❌ 仍存在: ${check.description}`)
      allPassed = false
    }
  } else {
    if (exists) {
      console.log(`  ✅ ${check.description}`)
    } else {
      console.log(`  ❌ 缺少: ${check.description}`)
      allPassed = false
    }
  }
})
console.log()

// 檢查 3: server.js 應該使用獨立的 webhook 路由
console.log('✅ 檢查 3: server.js (應該導入 webhookRoutes)')
console.log('-'.repeat(80))

const serverChecks = [
  { pattern: /import webhookRoutes from/, description: '導入 webhookRoutes' },
  {
    pattern: /app\.use\('\/api\/delivery\/webhooks', webhookRoutes\)/,
    description: '註冊 webhook 路由',
  },
  {
    pattern:
      /app\.use\('\/api\/delivery\/webhooks', webhookRoutes\)[\s\S]*?app\.use\(express\.json/,
    description: 'webhook 路由在 express.json() 之前',
  },
]

serverChecks.forEach((check) => {
  if (check.pattern.test(serverJsContent)) {
    console.log(`  ✅ ${check.description}`)
  } else {
    console.log(`  ❌ 缺少: ${check.description}`)
    allPassed = false
  }
})
console.log()

// 最終結果
console.log('='.repeat(80))
if (allPassed) {
  console.log('🎉 所有檢查通過! 路由分離成功!')
  console.log()
  console.log('📝 路由結構:')
  console.log()
  console.log('  server/routes/webhooks.js (獨立檔案)')
  console.log('  ├─ POST /ubereats               → express.raw() + 簽名驗證')
  console.log('  ├─ POST /foodpanda              → 直接處理')
  console.log('  └─ POST /foodpanda/catalog-callback')
  console.log()
  console.log('  server/routes/delivery.js')
  console.log('  ├─ POST /brands/:brandId/:storeId/sync-menu')
  console.log('  ├─ GET  /brands/:brandId/:storeId/sync-status')
  console.log('  └─ POST /brands/:brandId/:storeId/sync-inventory')
  console.log()
  console.log('  server.js 中間件順序:')
  console.log('  1. CORS')
  console.log('  2. app.use(\'/api/delivery/webhooks\', webhookRoutes)  ← 在 JSON 解析前')
  console.log('  3. express.json()  ← 全局 JSON 解析')
  console.log('  4. app.use(\'/api\', apiRoutes)  ← 包含 delivery 路由')
  console.log()
} else {
  console.log('❌ 部分檢查失敗,請修正問題!')
  process.exit(1)
}
