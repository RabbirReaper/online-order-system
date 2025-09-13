import axios from 'axios'
import AppError from '../../utils/AppError.js'

/**
 * 簡訊王 (KotSMS) 服務
 * 提供發送簡訊、查詢點數等功能
 */
class SMSService {
  constructor() {
    this.username = process.env.KOTSMS_USERNAME
    this.password = process.env.KOTSMS_PASSWORD
    this.baseURL = 'http://api.kotsms.com.tw'

    if (!this.username || !this.password) {
      console.warn('簡訊王帳號或密碼未設定，簡訊功能將被禁用')
    }
  }

  /**
   * 發送簡訊
   * @param {string} phone - 手機號碼
   * @param {string} message - 簡訊內容
   * @param {Object} options - 額外選項
   * @returns {Promise<Object>} 發送結果
   */
  async sendSMS(phone, message, options = {}) {
    try {
      // 如果沒有設定帳號密碼，在開發環境下模擬成功
      if (!this.username || !this.password) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[SMS 模擬模式] 發送簡訊到 ${phone}: ${message}`)
          return {
            success: true,
            message: '簡訊已發送（開發模式）',
            messageId: 'mock_' + Date.now(),
            cost: 1
          }
        } else {
          throw new AppError('簡訊服務未正確配置', 500)
        }
      }

      // 準備請求參數
      const params = new URLSearchParams({
        username: this.username,
        password: this.password,
        dstaddr: this.formatPhoneNumber(phone),
        smbody: encodeURIComponent(message),
        response: 'http://your-webhook-url.com/sms-callback', // 可選的回調 URL
        CharsetURL: 'UTF-8'
      })

      // 如果有預約時間
      if (options.sendTime) {
        params.append('dlvtime', this.formatDateTime(options.sendTime))
      }

      // 發送 SMS
      const response = await axios.post(
        `${this.baseURL}/kotsmsapi-1.php`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'text/plain'
          },
          timeout: 30000 // 30 秒超時
        }
      )

      return this.parseResponse(response.data)

    } catch (error) {
      console.error('SMS 發送失敗:', error)

      if (error instanceof AppError) {
        throw error
      }

      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new AppError('無法連接到簡訊服務', 503)
      }

      if (error.code === 'ETIMEDOUT') {
        throw new AppError('簡訊發送超時，請稍後再試', 408)
      }

      throw new AppError('簡訊發送失敗: ' + error.message, 500)
    }
  }

  /**
   * 查詢剩餘點數
   * @returns {Promise<Object>} 點數資訊
   */
  async queryPoints() {
    try {
      if (!this.username || !this.password) {
        throw new AppError('簡訊服務未正確配置', 500)
      }

      const params = new URLSearchParams({
        username: this.username,
        password: this.password
      })

      const response = await axios.post(
        `${this.baseURL}/memberpoint.php`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 15000
        }
      )

      const points = parseInt(response.data.trim())

      if (isNaN(points)) {
        throw new AppError('無法查詢簡訊點數', 500)
      }

      return {
        success: true,
        points: points,
        message: `剩餘點數: ${points}`
      }

    } catch (error) {
      console.error('查詢簡訊點數失敗:', error)
      throw error instanceof AppError ? error : new AppError('查詢點數失敗', 500)
    }
  }

  /**
   * 計算簡訊點數消耗
   * @param {string} message - 簡訊內容
   * @returns {number} 所需點數
   */
  calculateCost(message) {
    // 中文字符計算方式 (一般每 70 字為一則簡訊)
    const messageLength = [...message].length // 正確計算 Unicode 字符長度
    return Math.ceil(messageLength / 70)
  }

  /**
   * 格式化手機號碼
   * @param {string} phone - 原始手機號碼
   * @returns {string} 格式化後的手機號碼
   */
  formatPhoneNumber(phone) {
    // 移除所有非數字字符
    const cleaned = phone.replace(/\D/g, '')

    // 台灣手機號碼處理
    if (cleaned.startsWith('09')) {
      return '+886' + cleaned.substring(1)
    }

    // 如果已經是國際格式
    if (cleaned.startsWith('886')) {
      return '+' + cleaned
    }

    // 預設加上台灣國碼
    return '+886' + cleaned
  }

  /**
   * 格式化日期時間 (用於預約發送)
   * @param {Date} date - 日期物件
   * @returns {string} 格式化後的日期時間字串
   */
  formatDateTime(date) {
    return date.toISOString().slice(0, 19).replace('T', ' ')
  }

  /**
   * 解析 API 回應
   * @param {string} response - API 原始回應
   * @returns {Object} 解析後的結果
   */
  parseResponse(response) {
    const data = response.trim()

    // 成功回應格式通常是: kmsgid=訊息ID&cost=消耗點數&unsend=未發送數量&click=點擊數&invalid=無效號碼數
    if (data.includes('kmsgid=')) {
      const params = new URLSearchParams(data)
      return {
        success: true,
        message: '簡訊發送成功',
        messageId: params.get('kmsgid'),
        cost: parseInt(params.get('cost') || '1'),
        unsend: parseInt(params.get('unsend') || '0'),
        click: parseInt(params.get('click') || '0'),
        invalid: parseInt(params.get('invalid') || '0')
      }
    }

    // 錯誤回應處理
    const errorMap = {
      '-1': '帳號、密碼錯誤',
      '-2': '帳號暫停使用',
      '-3': '帳號額度不足',
      '-4': '帳號尚未啟用',
      '-5': '此 IP 不允許連線',
      '-10': '簡訊內容不得為空值',
      '-11': '收簡訊手機號碼不得為空值',
      '-12': '收簡訊手機號碼格式錯誤',
      '-20': '簡訊長度超出限制',
      '-21': '簡訊內容含有禁止字詞'
    }

    const errorCode = data.trim()
    const errorMessage = errorMap[errorCode] || `未知錯誤 (${errorCode})`

    return {
      success: false,
      message: errorMessage,
      errorCode: errorCode
    }
  }

  /**
   * 驗證簡訊內容
   * @param {string} message - 簡訊內容
   * @returns {Object} 驗證結果
   */
  validateMessage(message) {
    if (!message || message.trim().length === 0) {
      return {
        valid: false,
        message: '簡訊內容不能為空'
      }
    }

    const messageLength = [...message].length
    if (messageLength > 1000) {
      return {
        valid: false,
        message: '簡訊內容過長，最多 1000 字符'
      }
    }

    // 檢查是否包含禁止詞彙（可自定義）
    const forbiddenWords = ['詐騙', '病毒', '色情']
    const containsForbidden = forbiddenWords.some(word => message.includes(word))

    if (containsForbidden) {
      return {
        valid: false,
        message: '簡訊內容包含禁止詞彙'
      }
    }

    return {
      valid: true,
      cost: this.calculateCost(message),
      message: '內容驗證通過'
    }
  }
}

// 創建單例實例
const smsService = new SMSService()

export default smsService