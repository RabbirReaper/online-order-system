import axios from 'axios'
import dotenv from 'dotenv'
import crypto from 'crypto'
import { AppError } from '../../middlewares/error.js'

dotenv.config()

/**
 * 簡訊王 (KotSMS) 服務
 * 提供發送簡訊、查詢點數等功能
 */
class SMSService {
  constructor() {
    this.username = process.env.KOTSMS_USERNAME
    this.password = process.env.KOTSMS_PASSWORD
    this.baseURL = 'https://api.kotsms.com.tw:8515'

    if (!this.username || !this.password) {
      console.warn('簡訊王帳號或密碼未設定，簡訊功能將被禁用')
    }
  }

  /**
   * 生成客戶簡訊ID (避免重複發送)
   * @param {string} phone - 手機號碼
   * @param {string} message - 簡訊內容
   * @returns {string} 客戶簡訊ID
   */
  generateClientId(phone, message) {
    // 使用時間戳和內容生成唯一ID
    const timestamp = Date.now()
    const hash = crypto.createHash('md5').update(`${phone}_${message}_${timestamp}`).digest('hex')
    return `sms_${timestamp}_${hash.substring(0, 8)}`
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
            cost: 1,
          }
        } else {
          throw new AppError('簡訊服務未正確配置', 500)
        }
      }

      // 生成唯一的客戶簡訊ID避免重複發送
      const clientId = options.clientId || this.generateClientId(phone, message)

      // 準備請求參數（依據新版API規格）
      const params = new URLSearchParams({
        username: this.username,
        password: this.password,
        dstaddr: this.formatPhoneNumber(phone),
        smbody: this.encodeMessage(message), // 對中文內容進行URL編碼
        clientid: clientId,
        CharsetURL: 'UTF8', // 編碼格式
        smsPointFlag: '1', // 回覆扣除點數資訊
      })

      // 如果有回調網址
      if (options.callbackUrl) {
        params.append('response', options.callbackUrl)
      }

      // 如果有預約時間
      if (options.sendTime) {
        params.append('dlvtime', this.formatDateTime(options.sendTime))
      }

      // 如果有批次名稱
      if (options.objectId) {
        params.append('objectID', options.objectId)
      }

      // 發送 SMS（使用新版API端點）
      const response = await axios.post(`${this.baseURL}/kotsms/SmSend`, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'text/plain',
        },
        timeout: 30000, // 30 秒超時
      })

      return this.parseResponse(response.data)
    } catch (error) {
      console.error('SMS 發送失敗:', error)

      // 處理網路連線錯誤
      const networkError = this.handleNetworkError(error)
      if (networkError) {
        throw networkError
      }

      // 處理 HTTP 狀態碼錯誤
      if (error.response) {
        const httpError = this.handleHttpError(error.response)
        if (httpError) {
          throw httpError
        }
      }

      // 其他未知錯誤
      throw new AppError(`簡訊發送異常: ${error.message}`, 500)
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
        password: this.password,
      })

      // 使用新版API查詢餘額（SmQuery不帶msgid參數）
      const response = await axios.post(`${this.baseURL}/kotsms/SmQuery`, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 15000,
      })

      // 使用同樣的解析方法
      return this.parseResponse(response.data)
    } catch (error) {
      console.error('查詢簡訊點數失敗:', error)

      // 處理網路連線錯誤
      const networkError = this.handleNetworkError(error)
      if (networkError) {
        throw networkError
      }

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
   * 對簡訊內容進行URL編碼（處理中文亂碼問題）
   * @param {string} message - 原始簡訊內容
   * @returns {string} URL編碼後的簡訊內容
   */
  encodeMessage(message) {
    // 檢查是否包含中文字符
    const hasChinese = /[\u4e00-\u9fff]/.test(message)

    if (hasChinese) {
      // 對中文字串進行UTF-8 URL編碼
      return encodeURIComponent(message)
    }

    // 純英文數字則不需要編碼
    return message
  }

  /**
   * 格式化手機號碼
   * @param {string} phone - 原始手機號碼
   * @returns {string} 格式化後的手機號碼
   */
  formatPhoneNumber(phone) {
    // 移除所有非數字字符
    const cleaned = phone.replace(/\D/g, '')

    // 台灣手機號碼處理 - 簡訊王API要求台灣格式 09xxxxxxxx
    if (cleaned.startsWith('09')) {
      return cleaned // 直接返回台灣格式
    }

    // 如果是國際格式轉回台灣格式
    if (cleaned.startsWith('886')) {
      return '0' + cleaned.substring(3)
    }

    // 預設加上09
    if (cleaned.length === 8) {
      return '09' + cleaned
    }

    return cleaned // 其他情況直接返回
  }

  /**
   * 格式化日期時間 (用於預約發送)
   * @param {Date} date - 日期物件
   * @returns {string} 格式化後的日期時間字串 (YYYYMMDDHHMMSS)
   */
  formatDateTime(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    return `${year}${month}${day}${hours}${minutes}${seconds}`
  }

  /**
   * 解析 API 回應 - 新版API格式
   * @param {string} response - API 原始回應
   * @returns {Object} 解析後的結果
   */
  parseResponse(response) {
    const data = response.trim()

    // 新版API回覆格式：
    // [1]
    // msgid=#000000013
    // statuscode=1
    // AccountPoint=126
    // Duplicate=Y (可選)
    // smsPoint=1 (可選)

    const lines = data.split('\n').filter(line => line.trim())
    const result = { success: false }

    // 解析每一行
    lines.forEach(line => {
      const trimmed = line.trim()

      // 跳過編號行 [1], [2] 等
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        return
      }

      // 解析 key=value 格式
      const [key, value] = trimmed.split('=')
      if (key && value !== undefined) {
        result[key] = value
      }
    })

    // 判斷是否成功發送
    if (result.msgid && result.statuscode) {
      const statusCode = result.statuscode
      const isDuplicate = result.Duplicate === 'Y'
      const statusInfo = this.getStatusInfo(statusCode)

      return {
        success: statusInfo.success,
        message: isDuplicate ? '簡訊重複發送（已跳過）' : statusInfo.message,
        messageId: result.msgid.replace('#', ''), // 移除 # 符號
        statusCode: statusCode,
        statusType: statusInfo.type,
        suggestion: statusInfo.suggestion,
        retryable: statusInfo.retryable,
        accountPoint: parseInt(result.AccountPoint || '0'),
        isDuplicate: isDuplicate,
        smsPoint: result.smsPoint ? parseInt(result.smsPoint) : null,
      }
    }

    // 如果只有 AccountPoint，表示是餐額查詢
    if (result.AccountPoint && !result.msgid) {
      return {
        success: true,
        points: parseInt(result.AccountPoint),
        message: `剩餘點數: ${result.AccountPoint}`,
      }
    }

    // 錯誤情況處理 - 可能是純錯誤代碼回覆
    if (data.trim().match(/^[a-z*]$/)) {
      const statusInfo = this.getStatusInfo(data.trim())
      return {
        success: false,
        message: statusInfo.message,
        statusCode: data.trim(),
        statusType: statusInfo.type,
        suggestion: statusInfo.suggestion,
        retryable: statusInfo.retryable,
        rawResponse: data,
      }
    }

    // 其他格式錯誤
    return {
      success: false,
      message: `API回覆解析失敗: ${data}`,
      rawResponse: data,
      statusType: 'parse_error',
      suggestion: '請檢查API版本或聯繫技術支援',
      retryable: false,
    }
  }

  /**
   * 獲取狀態碼詳細資訊
   * @param {string} statusCode - 狀態碼
   * @returns {Object} 狀態詳細資訊
   */
  getStatusInfo(statusCode) {
    const statusInfo = {
      // 成功狀態
      '1': {
        success: true,
        type: 'success',
        message: '簡訊發送成功',
        suggestion: '簡訊已成功送入簡訊中心系統',
        retryable: false
      },

      // 一般錯誤
      '0': {
        success: false,
        type: 'general_error',
        message: '發送失敗',
        suggestion: '請檢查簡訊內容和手機號碼是否正確',
        retryable: true
      },
      '*': {
        success: false,
        type: 'system_error',
        message: '系統發生錯誤，請聯絡三竹資訊窗口人員',
        suggestion: '系統異常，請聯繫技術支援',
        retryable: false
      },

      // 服務狀態錯誤
      'a': {
        success: false,
        type: 'service_unavailable',
        message: '簡訊發送功能暫時停止服務，請稍後再試',
        suggestion: '等待服務恢復後再試',
        retryable: true
      },
      'b': {
        success: false,
        type: 'service_unavailable',
        message: '簡訊發送功能暫時停止服務，請稍後再試',
        suggestion: '等待服務恢復後再試',
        retryable: true
      },
      'r': {
        success: false,
        type: 'service_unavailable',
        message: '系統暫停服務，請稍後再試',
        suggestion: '等待系統維護完成',
        retryable: true
      },

      // 認證錯誤
      'c': {
        success: false,
        type: 'auth_error',
        message: '請輸入帳號',
        suggestion: '請檢查環境變數 KOTSMS_USERNAME 是否正確設定',
        retryable: false
      },
      'd': {
        success: false,
        type: 'auth_error',
        message: '請輸入密碼',
        suggestion: '請檢查環境變數 KOTSMS_PASSWORD 是否正確設定',
        retryable: false
      },
      'e': {
        success: false,
        type: 'auth_error',
        message: '帳號、密碼錯誤',
        suggestion: '請檢查簡訊王帳號密碼是否正確',
        retryable: false
      },
      'f': {
        success: false,
        type: 'account_error',
        message: '帳號已過期',
        suggestion: '請聯繫簡訊王客服延長帳號有效期',
        retryable: false
      },
      'h': {
        success: false,
        type: 'account_error',
        message: '帳號已被停用',
        suggestion: '請聯繫簡訊王客服啓用帳號',
        retryable: false
      },

      // 連線錯誤
      'k': {
        success: false,
        type: 'connection_error',
        message: '無效的連線位址',
        suggestion: '請檢查伺服器IP是否已申設簡訊王API權限',
        retryable: false
      },
      'l': {
        success: false,
        type: 'connection_error',
        message: '帳號已達到同時連線數上限',
        suggestion: '請稍後再試或減少併發連線數',
        retryable: true
      },

      // 密碼相關錯誤
      'm': {
        success: false,
        type: 'password_error',
        message: '必須變更密碼，在變更密碼前，無法使用簡訊發送服務',
        suggestion: '請登入簡訊王網站更新密碼',
        retryable: false
      },
      'n': {
        success: false,
        type: 'password_error',
        message: '密碼已逾期，在變更密碼前，將無法使用簡訊發送服務',
        suggestion: '請登入簡訊王網站更新密碼',
        retryable: false
      },

      // 權限錯誤
      'p': {
        success: false,
        type: 'permission_error',
        message: '沒有權限使用外部Http程式',
        suggestion: '請聯繫簡訊王客服申訫API使用權限',
        retryable: false
      },

      // 帳務錯誤
      's': {
        success: false,
        type: 'billing_error',
        message: '帳務處理失敗，無法發送簡訊',
        suggestion: '請檢查帳號餘額或聯繫客服',
        retryable: false
      },

      // 內容錯誤
      't': {
        success: false,
        type: 'content_error',
        message: '簡訊已過期',
        suggestion: '請檢查預約時間是否正確',
        retryable: true
      },
      'u': {
        success: false,
        type: 'content_error',
        message: '簡訊內容不得為空白',
        suggestion: '請輸入簡訊內容',
        retryable: false
      },
      'v': {
        success: false,
        type: 'content_error',
        message: '無效的手機號碼',
        suggestion: '請檢查手機號碼格式是否正確 (09xxxxxxxx)',
        retryable: false
      },
      'x': {
        success: false,
        type: 'content_error',
        message: '發送檔案過大，無法發送簡訊',
        suggestion: '請縮短簡訊內容長度',
        retryable: false
      },
      'y': {
        success: false,
        type: 'parameter_error',
        message: '參數錯誤',
        suggestion: '請檢查請求參數是否正確',
        retryable: false
      },

      // 查詢錯誤
      'w': {
        success: false,
        type: 'query_error',
        message: '查詢筆數超過上限',
        suggestion: '請減少查詢筆數或分批查詢',
        retryable: true
      },
      'z': {
        success: false,
        type: 'query_error',
        message: '查無資料',
        suggestion: '請檢查查詢條件或時間範圍',
        retryable: false
      }
    }

    return statusInfo[statusCode] || {
      success: false,
      type: 'unknown_error',
      message: `未知狀態碼: ${statusCode}`,
      suggestion: '請聯繫技術支援或查看簡訊王API文檔',
      retryable: false
    }
  }

  /**
   * 根據狀態碼獲取狀態訊息 (向後相容)
   * @param {string} statusCode - 狀態碼
   * @returns {string} 狀態訊息
   */
  getStatusMessage(statusCode) {
    return this.getStatusInfo(statusCode).message
  }

  /**
   * 判斷是否可以重試
   * @param {string} statusCode - 狀態碼
   * @returns {boolean} 是否可重試
   */
  isRetryable(statusCode) {
    return this.getStatusInfo(statusCode).retryable
  }

  /**
   * 獲取錯誤類型
   * @param {string} statusCode - 狀態碼
   * @returns {string} 錯誤類型
   */
  getErrorType(statusCode) {
    return this.getStatusInfo(statusCode).type
  }

  /**
   * 獲取錯誤建議
   * @param {string} statusCode - 狀態碼
   * @returns {string} 錯誤建議
   */
  getErrorSuggestion(statusCode) {
    return this.getStatusInfo(statusCode).suggestion
  }

  /**
   * 創建友善的錯誤訊息
   * @param {Object} result - 簡訊發送結果
   * @returns {Object} 友善的錯誤訊息
   */
  createUserFriendlyError(result) {
    if (result.success) {
      return {
        success: true,
        userMessage: '簡訊已成功發送',
        technical: result
      }
    }

    const typeMessages = {
      auth_error: '帳號認證問題，請聯繫系統管理員',
      account_error: '帳號狀態問題，請聯繫系統管理員',
      content_error: '簡訊內容有誤，請檢查後再試',
      service_unavailable: '簡訊服務暫時無法使用，請稍後再試',
      connection_error: '網路連線問題，請稍後再試',
      billing_error: '帳務問題，請聯繫系統管理員',
      general_error: '簡訊發送失敗，請稍後再試'
    }

    return {
      success: false,
      userMessage: typeMessages[result.statusType] || '簡訊發送失敗',
      canRetry: result.retryable,
      technical: {
        statusCode: result.statusCode,
        message: result.message,
        suggestion: result.suggestion,
        type: result.statusType
      }
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
        message: '簡訊內容不能為空',
      }
    }

    const messageLength = [...message].length
    if (messageLength > 1000) {
      return {
        valid: false,
        message: '簡訊內容過長，最多 1000 字符',
      }
    }

    // 檢查是否包含禁止詞彙（可自定義）
    const forbiddenWords = ['詐騙', '病毒', '色情']
    const containsForbidden = forbiddenWords.some((word) => message.includes(word))

    if (containsForbidden) {
      return {
        valid: false,
        message: '簡訊內容包含禁止詞彙',
      }
    }

    return {
      valid: true,
      cost: this.calculateCost(message),
      message: '內容驗證通過',
    }
  }
}

// 創建單例實例
const smsService = new SMSService()

export default smsService
