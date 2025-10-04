import dotenv from 'dotenv'
import axios from 'axios'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import CryptoJS from 'crypto-js'

// 載入環境變數
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const username = process.env.PRINTER_USERNAME
const secret = process.env.PRINTER_SECRET

const baseUrl = 'https://open.sw-aiot.com/api'
// https://open.sw-aiot.com/api/getToken
// https://open.sw-aiot.com/api/device/bindPrint

const getAccessToken = async () => {
  try {
    const currentTime = Date.now()

    const params = {
      secret: secret,
      times: currentTime,
      username: username,
    }

    // 按 ASCII 碼排序並拼接
    const sortedKeys = Object.keys(params).sort()
    const signString = sortedKeys.map((key) => `${key}=${params[key]}`).join('&')

    // MD5 加密並轉大寫
    const md5Hash = CryptoJS.MD5(signString).toString().toUpperCase()

    const jsonData = {
      username: username,
      password: md5Hash,
      times: currentTime,
    }

    const response = await axios.post(`${baseUrl}/getToken`, jsonData, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    console.log(response.data)
    return response.data
  } catch (error) {
    console.error('獲取 Access Token 失敗:', error.response?.data || error.message)
    throw error
  }
}

const bindPrintr = async (token) => {
  try {
    const params = {
      devid: 'SW253301102',
      key: '0048',
      timeout: 86400,
      pwidth: 58,
      nickname: 'RabbirOrder',
    }

    const response = await axios.post(`${baseUrl}/device/bindPrint`, params, {
      headers: {
        'Content-Type': 'application/json',
        token: token,
      },
    })
    console.log(response.data)
    return response.data
  } catch (error) {
    console.error('獲取 Access Token 失敗:', error.response?.data || error.message)
    throw error
  }
}

const sendMsg = async (token) => {
  try {
    const params = {
      devid: 'SW253301102',
      reqid: 'e970e65af9bd4dfb9400d896607bc812',
      message:
        '{"print":[ {"cont":"標題","type":"title" }, {"cont":"店家名稱：犇野牛排"}, {"cont":"電話：18620363939","font":24,"bold":true}, { "thead":{"名稱": "50%", "單價": "15%", "數量": "15%", "金額": "20%"}, "tbody": [ ["番茄炒蛋", 24, 2, 48], ["西瓜炒雞蛋", 24, 7, 168], ["牛排炒雞蛋", 24, 1, 24], ["野山椒炒土豆", 24, 3, 72] ] }, {"cont":"http://www.sw-aiot.com","type":"qrcode","align":"right"}, {"cont":"123456789","type":"bc128","align":"left"}, {"cont":"1","type":"cut"}]}',
      type: 5,
      orderid: '30220191208161723852129466170919',
      vtype: 0,
      vmessage: '和尚端湯上塔堂塔滑湯灑湯燙塔',
    }

    const response = await axios.post(`${baseUrl}/message/printMsg`, params, {
      headers: {
        'Content-Type': 'application/json',
        token: token,
      },
    })
    console.log(response.data)
    return response.data
  } catch (error) {
    console.error('獲取 Access Token 失敗:', error.response?.data || error.message)
    throw error
  }
}

const main = async () => {
  try {
    const token = await getAccessToken().then((p) => p.data.token)

    if (!token) {
      throw new Error('無法獲取 Access Token')
    }

    // await bindPrintr(token)
    await sendMsg(token)
    /*
    {
      code: 200,
      success: true,
      message: 'success',
      data: {
        respCode: '0',
        taskid: 185659513,
        message: 'ok',
        code: '0',
        reqId: 'e970e65af9bd4dfb9400d896607bc812',
        success: true
      },
      time: '2025-10-04 06:19:39'
    }
    */
  } catch (err) {
    console.error(err)
  }
}

main()
