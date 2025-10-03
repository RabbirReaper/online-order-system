import dotenv from 'dotenv'
import axios from 'axios'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// 載入環境變數
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const baseUrl = 'https://integration-middleware.as.restaurant-partners.com'
const username = process.env.FOODPANDA_PRODUCTION_USERNAME
const password = process.env.FOODPANDA_PRODUCTION_PASSWORD
const secret = process.env.FOODPANDA_PRODUCTION_SECRET

const chainCode = 'RabbirOrder_UAT_TW'
const posVendorId = 'RabbirOrder001'

const getAccessToken = async () => {
  try {
    // 構造 form data
    const formData = new URLSearchParams({
      username: username,
      password: password,
      grant_type: 'client_credentials',
    })

    // 正確的 API 端點
    const response = await axios.post(`${baseUrl}/v2/login`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    return response.data.access_token
  } catch (error) {
    console.error('獲取 Access Token 失敗:', error.response?.data || error.message)
    throw error
  }
}
// https://integration-middleware.stg.restaurant-partners.com/v2/chains/{chainCode}/catalog
// https://biweekly-nonfamiliar-cheryle.ngrok-free.dev/api/delivery/webhooks/foodpanda/catalog-callback
const submitACatalog = async (accessToken) => {
  try {
    const data = {
      callbackUrl:
        'https://biweekly-nonfamiliar-cheryle.ngrok-free.dev/api/delivery/webhooks/foodpanda/catalog-callback',
      catalog: {
        items: {
          'prd00001|001': {
            id: 'prd00001|001',
            title: {
              default: 'Pure yogurt, small',
              de: 'Natur Jogurt, klein',
            },
            type: 'Product',
            price: '3.50',
            parent: {
              id: 'prd00001',
              type: 'Product',
            },
            active: true,
            isPrepackedItem: false,
            isExpressItem: false,
            excludeDishInformation: false,
            toppings: {
              tt0001: {
                id: 'tt0001',
                type: 'Topping',
              },
            },
          },
          'prd00001|002': {
            id: 'prd00001|002',
            title: {
              default: 'Pure yogurt, medium',
              de: 'Natur Jogurt, mittel',
            },
            type: 'Product',
            price: '4.30',
            parent: {
              id: 'prd00001',
              type: 'Product',
            },
            active: true,
            isPrepackedItem: false,
            isExpressItem: false,
            excludeDishInformation: false,
            toppings: {
              tt0001: {
                id: 'tt0001',
                type: 'Topping',
              },
              tt0002: {
                id: 'tt0002',
                type: 'Topping',
              },
            },
          },
          'prd00001|003': {
            id: 'prd00001|003',
            title: {
              default: 'Pure yogurt, large',
              de: 'Natur Jogurt, groß',
            },
            type: 'Product',
            price: '4.99',
            parent: {
              id: 'prd00001',
              type: 'Product',
            },
            active: true,
            isPrepackedItem: false,
            isExpressItem: false,
            excludeDishInformation: false,
            toppings: {
              tt0001: {
                id: 'tt0001',
                type: 'Topping',
              },
              tt0002: {
                id: 'tt0002',
                type: 'Topping',
              },
            },
          },
          prd00001: {
            id: 'prd00001',
            type: 'Product',
            title: {
              default: 'Pure yogurt',
              de: 'Natur Jogurt',
            },
            description: {
              default: 'Pure yogurt',
            },
            variants: {
              'prd00001|001': {
                id: 'prd00001|001',
                type: 'Product',
              },
              'prd00001|002': {
                id: 'prd00001|002',
                type: 'Product',
              },
              'prd00001|003': {
                id: 'prd00001|003',
                type: 'Product',
              },
            },
            active: true,
            isPrepackedItem: false,
            isExpressItem: false,
            excludeDishInformation: false,
          },
          'prd00002|001': {
            id: 'prd00002|001',
            title: {
              default: 'Sporty yogurt, small',
              de: 'Fitness Jogurt, klein',
            },
            type: 'Product',
            price: '3.95',
            parent: {
              id: 'prd00002',
              type: 'Product',
            },
            active: true,
            isPrepackedItem: false,
            isExpressItem: false,
            excludeDishInformation: false,
            toppings: {
              tt0001: {
                id: 'tt0001',
                type: 'Topping',
              },
            },
          },
          'prd00002|002': {
            id: 'prd00002|002',
            title: {
              default: 'Sporty yogurt, medium',
              de: 'Fitness Jogurt, mittel',
            },
            type: 'Product',
            price: '4.95',
            parent: {
              id: 'prd00002',
              type: 'Product',
            },
            active: true,
            isPrepackedItem: false,
            isExpressItem: false,
            excludeDishInformation: false,
            toppings: {
              tt0001: {
                id: 'tt0001',
                type: 'Topping',
              },
              tt0002: {
                id: 'tt0002',
                type: 'Topping',
              },
            },
          },
          'prd00002|003': {
            id: 'prd00002|003',
            title: {
              default: 'Sporty yogurt, large',
              de: 'Fitness Jogurt, groß',
            },
            type: 'Product',
            price: '6.00',
            parent: {
              id: 'prd00002',
              type: 'Product',
            },
            active: true,
            isPrepackedItem: false,
            isExpressItem: false,
            excludeDishInformation: false,
            toppings: {
              tt0001: {
                id: 'tt0001',
                type: 'Topping',
              },
            },
          },
          prd00002: {
            id: 'prd00002',
            type: 'Product',
            title: {
              default: 'Sporty yogurt',
              de: 'Fitness Jogurt',
            },
            description: {
              default: 'Sporty yogurt',
            },
            variants: {
              'prd00002|001': {
                id: 'prd00002|001',
                type: 'Product',
              },
              'prd00002|002': {
                id: 'prd00002|002',
                type: 'Product',
              },
              'prd00002|003': {
                id: 'prd00002|003',
                type: 'Product',
              },
            },
            active: true,
            isPrepackedItem: false,
            isExpressItem: false,
            excludeDishInformation: false,
          },
          'prd00003|001': {
            id: 'prd00003|001',
            title: {
              default: 'Strawberry yogurt, small',
              de: 'Erdbeer Jogurt, klein',
            },
            type: 'Product',
            price: '3.50',
            parent: {
              id: 'prd00003',
              type: 'Product',
            },
            active: true,
            isPrepackedItem: false,
            isExpressItem: false,
            excludeDishInformation: false,
            toppings: {
              tt0001: {
                id: 'tt0001',
                type: 'Topping',
              },
            },
          },
          'prd00003|002': {
            id: 'prd00003|002',
            title: {
              default: 'Strawberry yogurt, medium',
              de: 'Erdbeer Jogurt, mittel',
            },
            type: 'Product',
            price: '4.30',
            parent: {
              id: 'prd00003',
              type: 'Product',
            },
            active: true,
            isPrepackedItem: false,
            isExpressItem: false,
            excludeDishInformation: false,
            toppings: {
              tt0001: {
                id: 'tt0001',
                type: 'Topping',
              },
              tt0002: {
                id: 'tt0002',
                type: 'Topping',
              },
            },
          },
          'prd00003|003': {
            id: 'prd00003|003',
            title: {
              default: 'Strawberry yogurt, large',
              de: 'Erdbeer Jogurt, groß',
            },
            type: 'Product',
            price: '4.99',
            parent: {
              id: 'prd00003',
              type: 'Product',
            },
            active: true,
            isPrepackedItem: false,
            isExpressItem: false,
            excludeDishInformation: false,
            toppings: {
              tt0001: {
                id: 'tt0001',
                type: 'Topping',
              },
              tt0002: {
                id: 'tt0002',
                type: 'Topping',
              },
            },
          },
          prd00003: {
            id: 'prd00003',
            type: 'Product',
            title: {
              default: 'Strawberry yogurt',
              de: 'Erdbeer Jogurt',
            },
            description: {
              default: 'Strawberry yogurt',
            },
            variants: {
              'prd00003|001': {
                id: 'prd00003|001',
                type: 'Product',
              },
              'prd00003|002': {
                id: 'prd00003|002',
                type: 'Product',
              },
              'prd00003|003': {
                id: 'prd00003|003',
                type: 'Product',
              },
            },
            active: true,
            isPrepackedItem: false,
            isExpressItem: false,
            excludeDishInformation: false,
          },
          'Category#mcp00001': {
            id: 'Category#mcp00001',
            type: 'Category',
            title: {
              default: 'yogurts',
              de: 'yogurts',
            },
            description: {
              default: 'yammmy',
            },
            products: {
              prd00001: {
                id: 'prd00001',
                type: 'Product',
              },
              prd00002: {
                id: 'prd00002',
                type: 'Product',
              },
              prd00003: {
                id: 'prd00003',
                type: 'Product',
              },
            },
          },
          'mct00001|0001': {
            id: 'mct00001|0001',
            type: 'Product',
            title: {
              default: 'Wildberries',
              de: 'Waldbeeren',
            },
            description: {
              default: 'Wildberries',
            },
            price: '129.00',
            active: true,
            isPrepackedItem: false,
            isExpressItem: false,
            excludeDishInformation: false,
          },
          'mct00001|0002': {
            id: 'mct00001|0002',
            type: 'Product',
            title: {
              default: 'Strawberries',
              de: 'Erdbeeren',
            },
            description: {
              default: 'Strawberries',
            },
            price: '129.00',
            active: true,
            isPrepackedItem: false,
            isExpressItem: false,
            excludeDishInformation: false,
          },
          'mct00001|0003': {
            id: 'mct00001|0003',
            type: 'Product',
            title: {
              default: 'Raspberries',
              de: 'Himbeere',
            },
            description: {
              default: 'Raspberries',
            },
            price: '129.00',
            active: true,
            isPrepackedItem: false,
            isExpressItem: false,
            excludeDishInformation: false,
          },
          'Category#mct00001': {
            id: 'Category#mct00001',
            type: 'Category',
            title: {
              default: 'Toppings',
            },
            description: {
              default: 'yammmy',
            },
            products: {
              'mct00001|0001': {
                id: 'mct00001|0001',
                type: 'Product',
              },
              'mct00001|0002': {
                id: 'mct00001|0002',
                type: 'Product',
              },
              'mct00001|0003': {
                id: 'mct00001|0003',
                type: 'Product',
              },
            },
          },
          schedule00001: {
            id: 'schedule00001',
            type: 'ScheduleEntry',
            startTime: '10:00:00',
            endTime: '20:00:00',
          },
          m00001: {
            id: 'm00001',
            title: {
              default: 'Regular Menu',
              de: 'Standart Menü',
            },
            description: {
              default: 'Regular Menu',
              de: 'Standart Menü',
            },
            type: 'Menu',
            menuType: 'DELIVERY',
            schedule: {
              schedule00001: {
                id: 'schedule00001',
                type: 'ScheduleEntry',
              },
            },
            products: {
              prd00001: {
                id: 'prd00001',
                type: 'Product',
              },
              prd00002: {
                id: 'prd00002',
                type: 'Product',
              },
              prd00003: {
                id: 'prd00003',
                type: 'Product',
              },
            },
          },
          tt0001: {
            id: 'tt0001',
            type: 'Topping',
            order: 1,
            title: {
              default: 'Free Topping Selection',
              de: 'kostenlos',
            },
            quantity: {
              maximum: 2,
              minimum: 0,
            },
            products: {
              'mct00001|0001': {
                id: 'mct00001|0001',
                type: 'Product',
                price: '0.00',
              },
              'mct00001|0002': {
                id: 'mct00001|0002',
                type: 'Product',
                price: '0.00',
              },
              'mct00001|0003': {
                id: 'mct00001|0003',
                type: 'Product',
                price: '0.00',
              },
            },
          },
          tt0002: {
            id: 'tt0002',
            type: 'Topping',
            order: 2,
            title: {
              default: 'Additional Topping Selection',
              de: 'zusätzlich',
            },
            quantity: {
              maximum: 2,
              minimum: 0,
            },
            products: {
              'mct00001|0001': {
                id: 'mct00001|0001',
                type: 'Product',
                price: '0.50',
              },
              'mct00001|0002': {
                id: 'mct00001|0002',
                type: 'Product',
                price: '0.50',
              },
              'mct00001|0003': {
                id: 'mct00001|0003',
                type: 'Product',
                price: '0.50',
              },
            },
          },
        },
      },
      vendors: [posVendorId],
    }

    const response = await axios.put(`${baseUrl}/v2/chains/${chainCode}/catalog`, data, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })

    console.log('✅ Catalog 提交成功:', response.status, response.data)
    return response.data
  } catch (err) {
    console.error('❌ Catalog 提交失敗:')
    console.error('Status:', err.response?.status)
    console.error('Status Text:', err.response?.statusText)
    console.error('錯誤詳情:', JSON.stringify(err.response?.data, null, 2))

    // 如果有驗證錯誤，印出更詳細的資訊
    if (err.response?.data?.errors) {
      console.error('\n驗證錯誤:')
      err.response.data.errors.forEach((error, index) => {
        console.error(`  ${index + 1}. ${error.message || error}`)
      })
    }
  }
}

const main = async () => {
  try {
    const token = await getAccessToken()

    if (!token) {
      throw new Error('無法獲取存取權杖')
    }

    // console.log('Access Token:', token)

    submitACatalog(token)
  } catch (error) {
    console.error('發生錯誤:', error.message)
  }
}

main()
