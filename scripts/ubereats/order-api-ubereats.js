import dotenv from 'dotenv'
import axios from 'axios'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// 載入環境變數
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const baseUrl = 'https://auth.uber.com/oauth/v2/token'
const storeBaseUrl = 'https://api.uber.com/v1/delivery/store'
const clientId = process.env.UBEREATS_PRODUCTION_CLIENT_ID
const secret = process.env.UBEREATS_PRODUCTION_CLIENT_SECRET
const testStoreId = 'd641fef3-0fb5-408c-b20a-d65b3c082530'

/*
contact: {
  email: 'uber+test+store1@gmail.com',
  name: 'Augt Chien',
  phone_number: '+12617436691'
},
location: {
  latitude: '22.6438832',
  longitude: '120.307551',
  street_address_line_one: 'No. 140號, Shenyang Street Sanmin District, Kaohsiung City, Taiwan',
  country: 'TW'
},
"pickup_instructions": "Enter from the north side marked by Delivery Pickup Arrows"
*/

const getAccessToken = async () => {
  try {
    // 使用 URLSearchParams (推薦)
    const formData = new URLSearchParams({
      client_id: clientId,
      client_secret: secret,
      grant_type: 'client_credentials',
      scope: 'eats.store eats.order eats.store.status.write',
    })

    const response = await axios.post(baseUrl, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    // console.log('Access Token:', response.data)
    return response.data.access_token
  } catch (error) {
    console.error('Error fetching access token:', error.response?.data || error.message)
  }
}

const main = async () => {
  try {
    const token = await getAccessToken()

    if (!token) {
      throw new Error('無法獲取存取權杖')
    }
  } catch (error) {
    console.error('程式執行失敗:', error)
  }
}

main()
