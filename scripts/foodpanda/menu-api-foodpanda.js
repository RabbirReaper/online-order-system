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
          MENU_ONE: {
            id: 'MENU_ONE',
            type: 'Menu',
            menuType: 'DELIVERY',
            title: {
              default: 'A Menu Example',
            },
            images: {
              IMAGE_ONE: {
                id: 'IMAGE_ONE',
                order: 1,
                type: 'Image',
              },
            },
            products: {
              PRODUCT_ONE: {
                id: 'PRODUCT_ONE',
                order: 1,
                type: 'Product',
              },
            },
            schedule: {
              SCHEDULE_ONE: {
                id: 'SCHEDULE_ONE',
                type: 'ScheduleEntry',
              },
            },
          },
          PRODUCT_ONE: {
            id: 'PRODUCT_ONE',
            type: 'Product',
            title: {
              default: 'A product example',
            },
            images: {
              IMAGE_ONE: {
                id: 'IMAGE_ONE',
                type: 'Image',
              },
            },
            active: true,
            isPrepackedItem: true,
            isExpressItem: false,
            excludeDishInformation: true,
            containerPrice: '0.50',
            calories: 150,
            price: '22.50',
            toppings: {
              TOPPING_ONE: {
                id: 'TOPPING_ONE',
                type: 'Topping',
              },
            },
          },
          TOPPING_ONE: {
            id: 'TOPPING_ONE',
            type: 'Topping',
            title: {
              default: 'A topping example',
            },
            images: {
              IMAGE_ONE: {
                id: 'IMAGE_ONE',
                type: 'Image',
              },
            },
            quantity: {
              minimum: 1,
              maximum: 2,
            },
            products: {
              TOPPING_PRODUCT_ONE: {
                id: 'TOPPING_PRODUCT_ONE',
                type: 'Product',
              },
              TOPPING_PRODUCT_TWO: {
                id: 'TOPPING_PRODUCT_TWO',
                type: 'Product',
              },
            },
          },
          TOPPING_PRODUCT_ONE: {
            id: 'TOPPING_PRODUCT_ONE',
            type: 'Product',
            title: {
              default: 'A product used as an topping example',
            },
          },
          TOPPING_PRODUCT_TWO: {
            id: 'TOPPING_PRODUCT_TWO',
            type: 'Product',
            title: {
              default: 'An other product used as a topping',
            },
          },
          CATEGORY_ONE: {
            id: 'CATEGORY_ONE',
            type: 'Category',
            title: {
              default: 'An example Category',
            },
            images: {
              IMAGE_ONE: {
                id: 'IMAGE_ONE',
                type: 'Image',
              },
            },
            products: {
              PRODUCT_ONE: {
                id: 'PRODUCT_ONE',
                type: 'Product',
              },
              TOPPING_PRODUCT_ONE: {
                id: 'TOPPING_PRODUCT_ONE',
                type: 'Product',
              },
              TOPPING_PRODUCT_TWO: {
                id: 'TOPPING_PRODUCT_TWO',
                type: 'Product',
              },
            },
          },
          IMAGE_ONE: {
            id: 'IMAGE_ONE',
            type: 'Image',
            url: 'https://images.deliveryhero.io/image/menu-import-gateway-stg/regions/example/hero.png',
            alt: {
              default: 'Super Erni',
            },
          },
          SCHEDULE_ONE: {
            id: 'SCHEDULE_ONE',
            type: 'ScheduleEntry',
            startTime: '11:00:00',
            endTime: '14:00:00',
            weekDays: ['MONDAY', 'FRIDAY'],
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
