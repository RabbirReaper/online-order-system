/**
 * NewebPay 金流服務
 * server/services/payment/newebpayService.js
 */

import crypto from 'crypto'
import axios from 'axios'
import dotenv from 'dotenv'
import { AppError } from '../../middlewares/error.js'

dotenv.config()

// NewebPay 設定 - 從環境變數讀取
const config = {
  MERCHANT_ID: process.env.NEWEBPAY_MERCHANT_ID,
  HASH_KEY: process.env.NEWEBPAY_HASH_KEY,
  HASH_IV: process.env.NEWEBPAY_HASH_IV,
  API_BASE_URL: process.env.NEWEBPAY_API_BASE_URL || 'https://ccore.newebpay.com',
  VERSION: '2.0',
}

/**
 * 驗證 NewebPay 設定
 */
const validateConfig = () => {
  const requiredFields = ['MERCHANT_ID', 'HASH_KEY', 'HASH_IV']
  const missingFields = requiredFields.filter((field) => !config[field])

  if (missingFields.length > 0) {
    throw new Error(`Missing NewebPay configuration: ${missingFields.join(', ')}`)
  }

  console.log('NewebPay Configuration:')
  console.log(`- MERCHANT_ID: ${config.MERCHANT_ID}`)
  console.log(`- API_BASE_URL: ${config.API_BASE_URL}`)
  console.log(`- VERSION: ${config.VERSION}`)
}

// 初始化時驗證設定
validateConfig()

/**
 * AES 加密
 * @param {string} data - 要加密的資料
 * @param {string} key - 加密金鑰
 * @param {string} iv - 初始向量
 * @returns {string} 加密後的資料 (hex)
 */
const aesEncrypt = (data, key, iv) => {
  try {
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return encrypted
  } catch (error) {
    console.error('AES 加密錯誤:', error)
    throw new AppError('資料加密失敗', 500, 'ENCRYPTION_FAILED')
  }
}

/**
 * AES 解密
 * @param {string} encryptedData - 加密的資料 (hex)
 * @param {string} key - 解密金鑰
 * @param {string} iv - 初始向量
 * @returns {string} 解密後的資料
 */
const aesDecrypt = (encryptedData, key, iv) => {
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    console.error('AES 解密錯誤:', error)
    throw new AppError('資料解密失敗', 400, 'DECRYPTION_FAILED')
  }
}

/**
 * SHA256 簽名
 * @param {string} data - 要簽名的資料
 * @returns {string} SHA256 簽名 (hex uppercase)
 */
const sha256Hash = (data) => {
  try {
    return crypto.createHash('sha256').update(data).digest('hex').toUpperCase()
  } catch (error) {
    console.error('SHA256 簽名錯誤:', error)
    throw new AppError('簽名生成失敗', 500, 'HASH_FAILED')
  }
}

/**
 * 生成商店訂單編號
 * @param {string} orderId - MongoDB 訂單 ID
 * @returns {string} 商店訂單編號 (格式: ORDER + timestamp(10位) + 訂單ID後6碼)
 */
const generateMerchantOrderNo = (orderId) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000)
    const orderIdStr = orderId.toString()
    const orderIdSuffix = orderIdStr.slice(-6).padStart(6, '0')
    return `ORDER${timestamp}${orderIdSuffix}`
  } catch (error) {
    console.error('生成商店訂單編號錯誤:', error)
    throw new AppError('訂單編號生成失敗', 500, 'ORDER_NO_GENERATION_FAILED')
  }
}

/**
 * 創建 MPG 付款表單資料
 * @param {Object} orderData - 訂單資料
 * @param {string} orderData.orderId - 訂單 ID
 * @param {number} orderData.amount - 付款金額
 * @param {string} orderData.itemDesc - 商品描述
 * @param {string} orderData.email - 顧客 Email
 * @param {string} orderData.customerName - 顧客姓名
 * @param {string} orderData.customerPhone - 顧客電話
 * @param {string} orderData.notifyURL - 幕後通知 URL
 * @param {string} orderData.returnURL - 前景返回 URL
 * @param {string} orderData.clientBackURL - 客戶返回 URL
 * @returns {Promise<Object>} 表單資料
 */
export const createMPGPayment = async (orderData) => {
  try {
    console.log('NewebPay 創建付款表單:', {
      orderId: orderData.orderId,
      amount: orderData.amount,
    })

    const {
      orderId,
      amount,
      itemDesc,
      email = '',
      customerName,
      customerPhone,
      notifyURL,
      returnURL,
      clientBackURL,
    } = orderData

    // 驗證必填欄位
    if (!orderId || !amount || !itemDesc || !notifyURL || !returnURL) {
      throw new AppError('缺少必要的訂單資訊', 400, 'MISSING_ORDER_DATA')
    }

    // 驗證金額
    if (typeof amount !== 'number' || amount <= 0) {
      throw new AppError('無效的付款金額', 400, 'INVALID_AMOUNT')
    }

    // 生成商店訂單編號
    const merchantOrderNo = generateMerchantOrderNo(orderId)

    // 準備交易資料
    const tradeInfo = {
      MerchantID: config.MERCHANT_ID,
      RespondType: 'JSON',
      TimeStamp: Math.floor(Date.now() / 1000).toString(),
      Version: config.VERSION,
      MerchantOrderNo: merchantOrderNo,
      Amt: amount.toString(),
      ItemDesc: itemDesc.substring(0, 50), // 限制長度
      Email: email,
      LoginType: '0',
      // 付款方式 - 啟用信用卡、ATM、超商代碼
      CREDIT: '1',
      WEBATM: '1',
      VACC: '1',
      // 回調 URL
      NotifyURL: notifyURL,
      ReturnURL: returnURL,
      ClientBackURL: clientBackURL || returnURL,
      // 顧客資訊
      EmailModify: email ? '0' : '1',
    }

    // 轉換為 URL encoded 字串
    const tradeInfoStr = new URLSearchParams(tradeInfo).toString()

    console.log('NewebPay TradeInfo (加密前):', tradeInfoStr)

    // AES 加密
    const tradeInfoEncrypted = aesEncrypt(tradeInfoStr, config.HASH_KEY, config.HASH_IV)

    // SHA256 簽名
    const tradeSha = sha256Hash(
      `HashKey=${config.HASH_KEY}&${tradeInfoEncrypted}&HashIV=${config.HASH_IV}`,
    )

    console.log('NewebPay 付款表單生成成功:', {
      merchantOrderNo,
      amount,
      tradeInfoLength: tradeInfoEncrypted.length,
    })

    return {
      success: true,
      merchantOrderNo,
      formData: {
        MerchantID: config.MERCHANT_ID,
        TradeInfo: tradeInfoEncrypted,
        TradeSha: tradeSha,
        Version: config.VERSION,
      },
      apiUrl: `${config.API_BASE_URL}/MPG/mpg_gateway`,
    }
  } catch (error) {
    console.error('NewebPay createMPGPayment 錯誤:', error)

    if (error instanceof AppError) {
      throw error
    }

    throw new AppError('建立付款表單失敗', 500, 'CREATE_PAYMENT_FAILED')
  }
}

/**
 * 解析並驗證回調資料
 * @param {Object} callbackData - NewebPay 回調資料
 * @param {string} callbackData.TradeInfo - 加密的交易資料
 * @param {string} callbackData.TradeSha - 交易簽名
 * @returns {Object} 解析後的資料
 */
export const parseAndVerifyCallback = (callbackData) => {
  try {
    console.log('NewebPay 解析回調資料')

    const { TradeInfo, TradeSha } = callbackData

    if (!TradeInfo || !TradeSha) {
      throw new AppError('回調資料不完整', 400, 'INCOMPLETE_CALLBACK_DATA')
    }

    // 驗證簽名
    const calculatedSha = sha256Hash(
      `HashKey=${config.HASH_KEY}&${TradeInfo}&HashIV=${config.HASH_IV}`,
    )

    if (calculatedSha !== TradeSha) {
      console.error('簽名驗證失敗:', {
        received: TradeSha,
        calculated: calculatedSha,
      })
      throw new AppError('簽名驗證失敗', 400, 'SIGNATURE_VERIFICATION_FAILED')
    }

    // 解密資料
    const decryptedData = aesDecrypt(TradeInfo, config.HASH_KEY, config.HASH_IV)
    const result = JSON.parse(decryptedData)

    console.log('NewebPay 回調解析成功:', {
      status: result.Status,
      merchantOrderNo: result.Result?.MerchantOrderNo,
      amount: result.Result?.Amt,
    })

    return {
      success: result.Status === 'SUCCESS',
      merchantOrderNo: result.Result?.MerchantOrderNo,
      tradeNo: result.Result?.TradeNo,
      amount: parseInt(result.Result?.Amt, 10),
      paymentType: result.Result?.PaymentType,
      respondCode: result.Status,
      message: result.Message,
      payTime: result.Result?.PayTime,
      rawData: result,
    }
  } catch (error) {
    console.error('NewebPay parseAndVerifyCallback 錯誤:', error)

    if (error instanceof AppError) {
      throw error
    }

    if (error instanceof SyntaxError) {
      throw new AppError('回調資料格式錯誤', 400, 'INVALID_CALLBACK_FORMAT')
    }

    throw new AppError('回調資料解析失敗', 400, 'PARSE_CALLBACK_FAILED')
  }
}

/**
 * 查詢交易狀態
 * @param {string} merchantOrderNo - 商店訂單編號
 * @param {number} amount - 訂單金額
 * @returns {Promise<Object>} 交易狀態
 */
export const queryTransaction = async (merchantOrderNo, amount) => {
  try {
    console.log('NewebPay 查詢交易:', { merchantOrderNo, amount })

    // 準備查詢資料
    const queryData = {
      MerchantID: config.MERCHANT_ID,
      Version: config.VERSION,
      RespondType: 'JSON',
      TimeStamp: Math.floor(Date.now() / 1000).toString(),
      MerchantOrderNo: merchantOrderNo,
      Amt: amount.toString(),
    }

    const queryStr = new URLSearchParams(queryData).toString()

    // 計算 CheckValue
    const checkValue = sha256Hash(
      `HashIV=${config.HASH_IV}&${queryStr}&HashKey=${config.HASH_KEY}`,
    )

    queryData.CheckValue = checkValue

    const response = await axios.post(
      `${config.API_BASE_URL}/API/QueryTradeInfo`,
      queryData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 15000,
      },
    )

    console.log('NewebPay 查詢回應:', response.data)

    if (response.data.Status === 'SUCCESS') {
      return {
        success: true,
        data: response.data,
      }
    } else {
      throw new AppError(
        response.data.Message || '查詢交易失敗',
        400,
        'QUERY_TRANSACTION_FAILED',
      )
    }
  } catch (error) {
    console.error('NewebPay queryTransaction 錯誤:', error)

    if (error instanceof AppError) {
      throw error
    }

    if (error.code === 'ECONNABORTED') {
      throw new AppError('查詢請求超時', 408, 'QUERY_TIMEOUT')
    }

    if (error.response) {
      throw new AppError(
        error.response.data?.Message || 'NewebPay 查詢服務錯誤',
        error.response.status,
        'NEWEBPAY_QUERY_ERROR',
        error.response.data,
      )
    }

    throw new AppError('查詢服務暫時無法使用', 503, 'QUERY_SERVICE_ERROR')
  }
}

/**
 * 驗證支付金額
 * @param {number} amount - 金額
 * @returns {boolean} 是否有效
 */
export const validateAmount = (amount) => {
  return typeof amount === 'number' && amount > 0 && amount <= 999999
}

/**
 * 驗證訂單資訊
 * @param {Object} orderData - 訂單資料
 * @returns {boolean} 是否有效
 */
export const validateOrderData = (orderData) => {
  return (
    orderData &&
    orderData.orderId &&
    orderData.amount &&
    orderData.itemDesc &&
    orderData.notifyURL &&
    orderData.returnURL
  )
}

/**
 * 取得設定 (用於測試或除錯)
 * @returns {Object} NewebPay 設定 (不包含敏感資訊)
 */
export const getConfig = () => {
  return {
    MERCHANT_ID: config.MERCHANT_ID,
    API_BASE_URL: config.API_BASE_URL,
    VERSION: config.VERSION,
  }
}

export default {
  createMPGPayment,
  parseAndVerifyCallback,
  queryTransaction,
  validateAmount,
  validateOrderData,
  getConfig,
}
