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

// 取得商店清單
const getStores = async (accessToken) => {
  try {
    const response = await axios.get('https://api.uber.com/v1/delivery/stores', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('商店清單:', response.data)
    return response.data
  } catch (error) {
    console.error('取得商店清單時發生錯誤:', error.response?.data || error.message)
    throw error
  }
}

const getStoreDetails = async (accessToken, storeId) => {
  try {
    const response = await axios.get(`${storeBaseUrl}/${storeId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('商店詳細資訊:', response.data)
    return response.data
  } catch (error) {
    console.error('取得商店詳細資訊時發生錯誤:', error.response?.data || error.message)
    throw error
  }
}

const setStoreDetails = async (accessToken, storeId, details) => {
  try {
    const response = await axios.post(`${storeBaseUrl}/${storeId}`, details, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('更新商店詳細資訊:', response.data)
    return response.data
  } catch (error) {
    console.error('更新商店詳細資訊時發生錯誤:', error.response?.data || error.message)
    throw error
  }
}

const getStoreStatus = async (accessToken, storeId) => {
  try {
    const response = await axios.get(`${storeBaseUrl}/${storeId}/status`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('商店狀態:', response.data)
    return response.data
  } catch (error) {
    console.error('取得商店狀態訊時發生錯誤:', error.response?.data || error.message)
    throw error
  }
}

const setStoreStatus = async (accessToken, storeId, status) => {
  try {
    const response = await axios.post(`${storeBaseUrl}/${storeId}/update-store-status`, status, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('商店狀態:', response.data)
    return response.data
  } catch (error) {
    console.error('更新商店狀態訊時發生錯誤:', error.response?.data || error.message)
    throw error
  }
}

const setPrepTime = async (accessToken, storeId, prepTime) => {
  // The default preparation time for the store, specified in seconds. The maximum allowed value is 10,800 seconds (3 hours).
  try {
    const response = await axios.post(
      `${storeBaseUrl}/${storeId}/update-store-prep-time`,
      { default_prep_time: prepTime },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    )
    console.log('更新準備時間:', response.data)
    return response.data
  } catch (error) {
    console.error('更新準備時間時發生錯誤:', error.response?.data || error.message)
    throw error
  }
}
// setPrepTime have two modes:
// 1. {
//   "default_prep_time": 500
// }
// 2. Busy mode
// {
//   "delay_config": {
//     "delay_until": "2016-09-01T10:11:12.123456-0500",
//     "delay_duration": 600
//   }
// }

const main = async () => {
  try {
    const token = await getAccessToken()

    if (!token) {
      throw new Error('無法獲取存取權杖')
    }

    await getStores(token)

    // await getStoreDetails(token, testStoreId)

    // const updateData = {
    //   contact: {
    //     email: 'uber+test+store1@gmail.com',
    //     name: 'Augt Chien',
    //     phone_number: '+12617436691',
    //   },
    //   location: {
    //     latitude: '22.6438832',
    //     longitude: '120.307551',
    //     street_address_line_one:
    //       'No. 140號, Shenyang Street Sanmin District, Kaohsiung City, Taiwan',
    //     country: 'TW',
    //   },
    //   pickup_instructions: 'Enter from the north side marked by Delivery Pickup Arrows',
    // }
    // await setStoreDetails(token, testStoreId, updateData)

    // await getStoreStatus(token, testStoreId)

    // const statusData = {
    //   // is_offline_until: '2025-09-21T17:08:30.000Z',
    //   status: 'ONLINE',
    //   // reason: 'Scheduled maintenance',
    // }
    // await setStoreStatus(token, testStoreId, statusData)

    // await setPrepTime(token, testStoreId, 300)
  } catch (error) {
    console.error('程式執行失敗:', error)
  }
}

main()
