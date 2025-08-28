#!/usr/bin/env node

/**
 * UberEats 測試店鋪獲取腳本 - dotenv + axios 版本
 *
 * 依賴套件：
 * - dotenv: 環境變數管理
 * - axios: HTTP 客戶端
 *
 * 安裝指令：
 * npm install dotenv axios
 *
 * 使用方式：
 * node get-test-stores.js
 */

import dotenv from 'dotenv'
import axios from 'axios'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// 獲取當前文件路徑 (ES modules 需要)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 載入環境變數
dotenv.config()

// 🔧 UberEats API 配置
const ENVIRONMENT = process.env.UBEREATS_ENVIRONMENT || 'sandbox'

const UBEREATS_CONFIG = {
  clientId:
    ENVIRONMENT === 'production'
      ? process.env.UBEREATS_PRODUCTION_CLIENT_ID
      : process.env.UBEREATS_SANDBOX_CLIENT_ID,

  clientSecret:
    ENVIRONMENT === 'production'
      ? process.env.UBEREATS_PRODUCTION_CLIENT_SECRET
      : process.env.UBEREATS_SANDBOX_CLIENT_SECRET,

  apiUrl:
    ENVIRONMENT === 'production' ? 'https://api.uber.com/v1' : 'https://sandbox-api.uber.com/v1',

  oauthUrl: 'https://auth.uber.com/oauth/v2/token',
  scope: 'eats.pos_provisioning eats.order eats.store eats.report eats.store.status.write eats.store.status.read eats.store.orders.read eats.store.orders.cancel',
  environment: ENVIRONMENT,
}

// 🔧 axios 基本配置
axios.defaults.timeout = 30000 // 30 秒超時
axios.defaults.headers.common['User-Agent'] = 'UberEats-Test-Script/1.0'

/**
 * 獲取 OAuth 存取令牌
 */
const getAccessToken = async () => {
  try {
    if (!UBEREATS_CONFIG.clientId || !UBEREATS_CONFIG.clientSecret) {
      if (UBEREATS_CONFIG.environment === 'sandbox') {
        console.log('🧪 Sandbox mode: using mock access token')
        return 'mock_access_token_for_sandbox'
      }
      throw new Error('UberEats client ID and secret are required')
    }

    const credentials = Buffer.from(
      `${UBEREATS_CONFIG.clientId}:${UBEREATS_CONFIG.clientSecret}`,
    ).toString('base64')

    console.log(`🔐 Requesting OAuth token from: ${UBEREATS_CONFIG.oauthUrl}`)

    const response = await axios({
      method: 'POST',
      url: UBEREATS_CONFIG.oauthUrl,
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: `grant_type=client_credentials&scope=${UBEREATS_CONFIG.scope}`,
    })

    console.log('✅ Successfully obtained OAuth token')
    return response.data.access_token
  } catch (error) {
    console.error('❌ Failed to get access token:')

    if (error.response) {
      // axios 錯誤回應
      console.error(`   Status: ${error.response.status} ${error.response.statusText}`)
      console.error(`   Response:`, error.response.data)
    } else {
      // 網路或其他錯誤
      console.error(`   Error: ${error.message}`)
    }

    if (UBEREATS_CONFIG.environment === 'sandbox') {
      console.log('🧪 Sandbox mode: returning mock token as fallback')
      return 'mock_access_token_for_sandbox'
    }

    throw error
  }
}

/**
 * 獲取測試店鋪列表
 */
const getTestStores = async () => {
  try {
    console.log(`🏪 Fetching stores from: ${UBEREATS_CONFIG.apiUrl}/eats/stores`)

    const accessToken = await getAccessToken()

    const response = await axios({
      method: 'GET',
      url: `${UBEREATS_CONFIG.apiUrl}/eats/stores`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    const data = response.data

    if (data.stores && data.stores.length > 0) {
      console.log('\n✅ 成功獲取到測試店鋪！')
      console.log(`📊 總共找到 ${data.stores.length} 個店鋪：\n`)

      // 格式化輸出每個店鋪的詳細資訊
      data.stores.forEach((store, index) => {
        console.log(`🏪 店鋪 #${index + 1}:`)
        console.log(`   Store ID: ${store.id}`)
        console.log(`   Name: ${store.name || 'N/A'}`)
        console.log(`   External Reference ID: ${store.external_reference_id || 'N/A'}`)
        console.log(`   Integrator Store ID: ${store.integrator_store_id || 'N/A'}`)
        console.log(`   Status: ${store.status || 'N/A'}`)

        if (store.location) {
          console.log(`   Address: ${store.location.address || 'N/A'}`)
          console.log(`   City: ${store.location.city || 'N/A'}`)
          console.log(`   Country: ${store.location.country || 'N/A'}`)
        }

        if (store.contact) {
          console.log(`   Phone: ${store.contact.phone || 'N/A'}`)
          console.log(`   Email: ${store.contact.email || 'N/A'}`)
        }

        console.log('') // 空行分隔
      })

      // 生成環境變數建議
      if (data.stores.length > 0) {
        console.log('💡 建議將以下 Store ID 添加到你的 .env 檔案：')
        console.log(`UBEREATS_${ENVIRONMENT.toUpperCase()}_STORE_ID=${data.stores[0].id}`)
        console.log('')

        // 如果有多個店鋪，列出所有選項
        if (data.stores.length > 1) {
          console.log('🔄 所有可用的 Store ID：')
          data.stores.forEach((store, index) => {
            console.log(`   選項 ${index + 1}: ${store.id} (${store.name || 'Unnamed'})`)
          })
          console.log('')
        }
      }

      // 生成用於程式碼的 JSON 格式
      console.log('📋 用於程式碼的店鋪資訊 (JSON 格式)：')
      console.log(
        JSON.stringify(
          data.stores.map((store) => ({
            id: store.id,
            name: store.name,
            status: store.status,
            external_reference_id: store.external_reference_id,
          })),
          null,
          2,
        ),
      )
      console.log('')
    } else {
      console.log('⚠️  沒有找到任何測試店鋪')
      console.log('')
      console.log('🔍 可能的原因：')
      console.log('1. 你的帳戶還沒有被分配測試店鋪')
      console.log('2. API 權限還沒有被 Uber 啟用')
      console.log('3. 使用了錯誤的 credentials')
      console.log('')
    }

    return data.stores || []
  } catch (error) {
    console.error('❌ Failed to get test stores:')

    if (error.response) {
      // axios 錯誤回應
      console.error(`   Status: ${error.response.status} ${error.response.statusText}`)
      console.error(`   Response:`, error.response.data)

      // 針對常見錯誤提供解決方案
      if (error.response.status === 401) {
        console.log('\n💡 401 Unauthorized 解決方案：')
        console.log('1. 檢查你的 Client ID 和 Client Secret 是否正確')
        console.log('2. 確認你的帳戶已經被 Uber 啟用 eats.order scope')
        console.log('3. 檢查是否使用了正確的環境 (sandbox/production)')
        console.log('4. 聯繫 Uber 技術支援確認權限狀態')
      } else if (error.response.status === 403) {
        console.log('\n💡 403 Forbidden 解決方案：')
        console.log('1. 你的帳戶可能沒有訪問店鋪資料的權限')
        console.log('2. 需要聯繫 Uber 申請相關權限')
      } else if (error.response.status >= 500) {
        console.log('\n💡 伺服器錯誤：')
        console.log('1. Uber API 服務可能暫時不可用')
        console.log('2. 稍後再試或檢查 Uber 服務狀態')
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   網路連接被拒絕，請檢查網路設定')
    } else if (error.code === 'ENOTFOUND') {
      console.error('   無法解析域名，請檢查網路連接')
    } else {
      console.error(`   Error: ${error.message}`)
    }

    return []
  }
}

/**
 * 檢查配置是否完整
 */
const checkConfiguration = () => {
  console.log('🔧 檢查 UberEats 配置...')
  console.log(`Environment: ${UBEREATS_CONFIG.environment}`)
  console.log(`API URL: ${UBEREATS_CONFIG.apiUrl}`)
  console.log(`OAuth URL: ${UBEREATS_CONFIG.oauthUrl}`)
  console.log(`Client ID configured: ${!!UBEREATS_CONFIG.clientId}`)
  console.log(`Client Secret configured: ${!!UBEREATS_CONFIG.clientSecret}`)

  if (UBEREATS_CONFIG.clientId) {
    console.log(`Client ID (部分): ${UBEREATS_CONFIG.clientId.substring(0, 8)}...`)
  }

  console.log('')

  const missing = []
  const recommendations = []

  if (!UBEREATS_CONFIG.clientId) {
    missing.push(`UBEREATS_${ENVIRONMENT.toUpperCase()}_CLIENT_ID`)
  }

  if (!UBEREATS_CONFIG.clientSecret) {
    missing.push(`UBEREATS_${ENVIRONMENT.toUpperCase()}_CLIENT_SECRET`)
  }

  if (missing.length > 0) {
    console.log('⚠️  缺少以下環境變數：')
    missing.forEach((env) => console.log(`   - ${env}`))
    console.log('')

    if (UBEREATS_CONFIG.environment !== 'sandbox') {
      console.log('❌ Production 環境需要完整配置，腳本無法繼續執行')
      return false
    } else {
      console.log('🧪 Sandbox 環境將使用模擬資料繼續執行')
      recommendations.push('建議獲得正確的 sandbox credentials 以進行真實測試')
    }
  }

  // 提供設定建議
  if (recommendations.length > 0) {
    console.log('💡 設定建議：')
    recommendations.forEach((rec) => console.log(`   - ${rec}`))
    console.log('')
  }

  return true
}

/**
 * 主執行函數
 */
const main = async () => {
  // 檢查依賴（在 ES modules 中無法使用 require.resolve，但提供說明）
  console.log('📦 使用的套件：dotenv, axios')
  console.log('')

  // 檢查配置
  if (!checkConfiguration()) {
    console.log('')
    showUsage()
    process.exit(1)
  }

  try {
    // 獲取測試店鋪
    const stores = await getTestStores()

    if (stores.length === 0) {
      console.log('📞 建議下一步行動：')
      console.log('')
      console.log('🎯 如果你還沒有 UberEats API 權限：')
      console.log('1. 聯繫 Uber 技術支援申請 API 權限和測試店鋪')
      console.log('2. 提供你的商業案例和技術需求')
      console.log('3. 等待審核通過（通常需要 2-4 週）')
      console.log('')
      console.log('🔗 Uber 技術支援聯繫方式：')
      console.log('   https://t.uber.com/integration-support')
      console.log('')
      console.log('📋 申請時請準備：')
      console.log('   - 開發者帳戶資訊')
      console.log('   - 專案描述和預期用途')
      console.log('   - 需要的 API scopes (eats.order)')
      console.log('   - 預計服務的餐廳數量')
      console.log('   - 技術整合計畫')
      console.log('')
      console.log('💡 在等待期間，你可以：')
      console.log('   - 完善你的技術實作')
      console.log('   - 準備測試計畫')
      console.log('   - 閱讀 UberEats API 文檔')
    } else {
      console.log('🎉 恭喜！你已經有可用的測試店鋪')
      console.log('📝 下一步：')
      console.log('1. 將 Store ID 添加到你的環境變數')
      console.log('2. 更新你的程式碼使用實際的 Store ID')
      console.log('3. 開始測試 webhook 和訂單處理')
    }
  } catch (error) {
    console.error('\n💥 腳本執行失敗：', error.message)
    console.log('\n🔍 故障排除：')
    console.log('1. 檢查網路連接是否正常')
    console.log('2. 確認環境變數設定正確')
    console.log('3. 驗證 credentials 是否有效')
    console.log('4. 檢查 Uber API 服務狀態')
    console.log('')
    console.log('如果問題持續，請聯繫 Uber 技術支援。')
    process.exit(1)
  }
}

// ✅ 修正：正確的 ES modules 執行檢查
if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error('💥 未處理的錯誤：', error)
    process.exit(1)
  })
}

// 導出函數供其他模組使用
export { getTestStores, getAccessToken, UBEREATS_CONFIG }
