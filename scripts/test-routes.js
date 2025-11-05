/**
 * 測試路由配置是否正確
 * 驗證 webhook 路由和 delivery 路由是否正確分離
 */

import express from 'express'
import webhookRoutes from '../server/routes/webhooks.js'
import deliveryRoutes from '../server/routes/delivery.js'

console.log('🧪 測試路由配置')
console.log('='.repeat(80))
console.log()

// 創建測試 app
const app = express()

// 模擬 server.js 的配置
app.use('/api/delivery/webhooks', webhookRoutes)
app.use(express.json({ limit: '2mb' }))
app.use('/api/delivery', deliveryRoutes)

// 獲取所有註冊的路由
function getRoutes(app) {
  const routes = []

  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // 直接註冊的路由
      const methods = Object.keys(middleware.route.methods)
        .map((m) => m.toUpperCase())
        .join(', ')
      routes.push({
        path: middleware.route.path,
        methods: methods,
      })
    } else if (middleware.name === 'router') {
      // Router 中間件
      const basePath = middleware.regexp.source
        .replace(/\\\//g, '/')
        .replace(/\^/g, '')
        .replace(/\\/g, '')
        .replace(/\?\(\?=\/\|\$\)\/\?/g, '')
        .replace(/\?\(\?\=\\\/\|\$\)\\\//g, '')
        .replace(/\(\?\:\(\[\^\\\/\]\+\?\)\)/g, ':param')

      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const methods = Object.keys(handler.route.methods)
            .map((m) => m.toUpperCase())
            .join(', ')
          const fullPath = basePath + handler.route.path
          routes.push({
            path: fullPath,
            methods: methods,
          })
        }
      })
    }
  })

  return routes
}

const routes = getRoutes(app)

console.log('📋 註冊的路由列表:')
console.log()

// 分類顯示路由
const webhookRoutes_list = routes.filter((r) => r.path.includes('/webhooks'))
const deliveryRoutes_list = routes.filter(
  (r) => r.path.includes('/delivery') && !r.path.includes('/webhooks'),
)

console.log('🔗 Webhook 路由 (應該在 express.json() 之前):')
console.log('-'.repeat(80))
webhookRoutes_list.forEach((route) => {
  console.log(`  ${route.methods.padEnd(8)} ${route.path}`)
})
console.log()

console.log('📦 Delivery 管理路由 (使用 express.json()):')
console.log('-'.repeat(80))
deliveryRoutes_list.forEach((route) => {
  console.log(`  ${route.methods.padEnd(8)} ${route.path}`)
})
console.log()

// 驗證預期路由
console.log('='.repeat(80))
console.log('✅ 驗證結果:')
console.log()

const expectedWebhookRoutes = [
  '/api/delivery/webhooks/ubereats',
  '/api/delivery/webhooks/foodpanda',
  '/api/delivery/webhooks/foodpanda/catalog-callback',
]

const expectedDeliveryRoutes = [
  '/api/delivery/brands/:brandId/:storeId/sync-menu',
  '/api/delivery/brands/:brandId/:storeId/sync-status',
  '/api/delivery/brands/:brandId/:storeId/sync-inventory',
]

let allPassed = true

expectedWebhookRoutes.forEach((expectedPath) => {
  const found = webhookRoutes_list.some((r) => r.path === expectedPath)
  if (found) {
    console.log(`✅ ${expectedPath}`)
  } else {
    console.log(`❌ 缺少: ${expectedPath}`)
    allPassed = false
  }
})

expectedDeliveryRoutes.forEach((expectedPath) => {
  const found = deliveryRoutes_list.some((r) => r.path === expectedPath)
  if (found) {
    console.log(`✅ ${expectedPath}`)
  } else {
    console.log(`❌ 缺少: ${expectedPath}`)
    allPassed = false
  }
})

console.log()
console.log('='.repeat(80))

if (allPassed) {
  console.log('🎉 所有路由配置正確!')
  console.log()
  console.log('📝 路由執行順序:')
  console.log('1. CORS 中間件')
  console.log('2. Webhook 路由 (使用 express.raw())')
  console.log('3. express.json() 全局中間件')
  console.log('4. Delivery 管理路由 (body 已被解析為 JSON)')
  console.log()
} else {
  console.log('⚠️ 部分路由配置有問題,請檢查!')
  process.exit(1)
}
