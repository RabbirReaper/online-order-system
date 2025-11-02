/**
 * Webhook 安全驗證工具
 * 提供簽名驗證、時間戳驗證、事件去重等安全功能
 */

import crypto from 'crypto'

/**
 * 驗證 UberEats webhook 簽名
 * 根據官方文檔: https://developer.uber.com/docs/eats/guides/webhooks
 *
 * @param {string|Buffer} payload - 請求 body (原始字串或 Buffer)
 * @param {string} signature - X-Uber-Signature 標頭值
 * @param {string} secret - Webhook 簽名密鑰
 * @returns {boolean} - 簽名是否有效
 */
export function verifyUberEatsSignature(payload, signature, secret) {
  if (!payload || !signature || !secret) {
    return false
  }

  try {
    // 確保 payload 是字串
    const payloadString = typeof payload === 'string' ? payload : payload.toString('utf8')

    // 使用 SHA256 生成 HMAC 簽名
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(payloadString)
    const computedSignature = hmac.digest('hex').toLowerCase()

    // UberEats 使用 lowercase hex，不需要移除前綴
    const providedSignature = signature.toLowerCase()

    console.log('🔍 簽名比對:', {
      payloadLength: payloadString.length,
      payloadPreview: payloadString.substring(0, 100),
      computed: computedSignature.substring(0, 20) + '...',
      provided: providedSignature.substring(0, 20) + '...',
    })

    // 使用時間安全的比較方法
    return crypto.timingSafeEqual(
      Buffer.from(computedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex'),
    )
  } catch (error) {
    console.error('❌ 簽名驗證過程發生錯誤:', error.message)
    return false
  }
}

/**
 * 嘗試使用主要和備用密鑰驗證簽名
 * 支援密鑰輪換場景
 *
 * @param {string|Buffer} payload - 請求 body
 * @param {string} signature - X-Uber-Signature 標頭值
 * @param {string} primarySecret - 主要簽名密鑰
 * @param {string} [secondarySecret] - 備用簽名密鑰 (可選)
 * @returns {Object} - { valid: boolean, usedSecondary: boolean }
 */
export function verifyUberEatsSignatureWithFallback(
  payload,
  signature,
  primarySecret,
  secondarySecret,
) {
  // 先嘗試主要密鑰
  if (verifyUberEatsSignature(payload, signature, primarySecret)) {
    return { valid: true, usedSecondary: false }
  }

  // 如果主要密鑰失敗且提供了備用密鑰，嘗試備用密鑰
  if (secondarySecret && verifyUberEatsSignature(payload, signature, secondarySecret)) {
    console.warn('⚠️ 使用備用密鑰驗證成功，建議更新主要密鑰')
    return { valid: true, usedSecondary: true }
  }

  return { valid: false, usedSecondary: false }
}

/**
 * 驗證請求時間戳，防止重放攻擊
 *
 * @param {number|string} timestamp - 請求時間戳 (秒或毫秒)
 * @param {number} [maxAgeSeconds=300] - 最大允許時間差 (秒)，預設 5 分鐘
 * @returns {boolean} - 時間戳是否有效
 */
export function verifyTimestamp(timestamp, maxAgeSeconds = 300) {
  if (!timestamp) {
    return false
  }

  try {
    // 轉換為數字
    const requestTime = Number(timestamp)
    if (isNaN(requestTime)) {
      return false
    }

    // 如果時間戳是毫秒級別，轉換為秒
    const requestTimeSeconds = requestTime > 10000000000 ? requestTime / 1000 : requestTime

    const currentTimeSeconds = Date.now() / 1000
    const timeDifference = Math.abs(currentTimeSeconds - requestTimeSeconds)

    return timeDifference <= maxAgeSeconds
  } catch (error) {
    console.error('❌ 時間戳驗證過程發生錯誤:', error.message)
    return false
  }
}

/**
 * 事件去重管理器
 * 使用記憶體快取記錄已處理的事件 ID
 */
class EventDeduplicator {
  constructor(maxSize = 10000, ttlMs = 3600000) {
    // 預設保留 10000 個事件，1 小時過期
    this.processedEvents = new Map()
    this.maxSize = maxSize
    this.ttlMs = ttlMs
  }

  /**
   * 檢查事件是否已處理過
   * @param {string} eventId - 事件 ID
   * @returns {boolean} - 是否為重複事件
   */
  isDuplicate(eventId) {
    if (!eventId) {
      return false
    }

    const now = Date.now()

    // 清理過期的事件記錄
    this._cleanupExpired(now)

    // 檢查是否已存在
    if (this.processedEvents.has(eventId)) {
      const eventData = this.processedEvents.get(eventId)
      // 檢查是否過期
      if (now - eventData.timestamp < this.ttlMs) {
        return true
      }
    }

    return false
  }

  /**
   * 標記事件為已處理
   * @param {string} eventId - 事件 ID
   */
  markAsProcessed(eventId) {
    if (!eventId) {
      return
    }

    const now = Date.now()

    // 如果容量已滿，移除最舊的事件
    if (this.processedEvents.size >= this.maxSize) {
      this._removeOldest()
    }

    this.processedEvents.set(eventId, {
      timestamp: now,
    })
  }

  /**
   * 清理過期的事件記錄
   * @private
   */
  _cleanupExpired(now) {
    for (const [eventId, eventData] of this.processedEvents.entries()) {
      if (now - eventData.timestamp >= this.ttlMs) {
        this.processedEvents.delete(eventId)
      }
    }
  }

  /**
   * 移除最舊的事件記錄
   * @private
   */
  _removeOldest() {
    let oldestEventId = null
    let oldestTimestamp = Infinity

    for (const [eventId, eventData] of this.processedEvents.entries()) {
      if (eventData.timestamp < oldestTimestamp) {
        oldestTimestamp = eventData.timestamp
        oldestEventId = eventId
      }
    }

    if (oldestEventId) {
      this.processedEvents.delete(oldestEventId)
    }
  }

  /**
   * 獲取當前快取統計資訊
   * @returns {Object} - { size, maxSize, ttlMs }
   */
  getStats() {
    return {
      size: this.processedEvents.size,
      maxSize: this.maxSize,
      ttlMs: this.ttlMs,
    }
  }

  /**
   * 清空所有記錄
   */
  clear() {
    this.processedEvents.clear()
  }
}

// 為不同平台創建獨立的去重管理器
export const uberEatsDeduplicator = new EventDeduplicator()
export const foodpandaDeduplicator = new EventDeduplicator()

/**
 * 驗證 webhook 請求的完整性 (UberEats)
 * 整合簽名、時間戳、去重檢查
 *
 * @param {Object} options - 驗證選項
 * @param {string|Buffer} options.payload - 請求 body
 * @param {string} options.signature - X-Uber-Signature 標頭
 * @param {string} options.eventId - 事件 ID
 * @param {number} [options.timestamp] - 請求時間戳 (可選)
 * @param {string} options.primarySecret - 主要簽名密鑰
 * @param {string} [options.secondarySecret] - 備用簽名密鑰
 * @param {boolean} [options.skipTimestampCheck=false] - 是否跳過時間戳檢查
 * @param {boolean} [options.skipDuplicateCheck=false] - 是否跳過去重檢查
 * @returns {Object} - 驗證結果
 */
export function verifyUberEatsWebhook(options) {
  const {
    payload,
    signature,
    eventId,
    timestamp,
    primarySecret,
    secondarySecret,
    skipTimestampCheck = false,
    skipDuplicateCheck = false,
  } = options

  const result = {
    valid: false,
    errors: [],
    warnings: [],
  }

  // 1. 簽名驗證
  if (!signature) {
    result.errors.push('缺少 X-Uber-Signature 標頭')
    return result
  }

  const signatureResult = verifyUberEatsSignatureWithFallback(
    payload,
    signature,
    primarySecret,
    secondarySecret,
  )

  if (!signatureResult.valid) {
    result.errors.push('簽名驗證失敗')
    return result
  }

  if (signatureResult.usedSecondary) {
    result.warnings.push('使用備用密鑰驗證成功，建議更新主要密鑰')
  }

  // 2. 時間戳驗證 (可選)
  if (!skipTimestampCheck && timestamp) {
    if (!verifyTimestamp(timestamp)) {
      result.errors.push('請求時間戳無效或已過期')
      return result
    }
  }

  // 3. 事件去重檢查
  if (!skipDuplicateCheck && eventId) {
    if (uberEatsDeduplicator.isDuplicate(eventId)) {
      result.errors.push(`事件 ${eventId} 已處理過`)
      return result
    }
  }

  // 所有檢查通過
  result.valid = true

  // 標記事件為已處理
  if (!skipDuplicateCheck && eventId) {
    uberEatsDeduplicator.markAsProcessed(eventId)
  }

  return result
}

/**
 * 生成測試用的簽名 (用於開發和測試)
 *
 * @param {string|Object} payload - 請求 body (字串或物件)
 * @param {string} secret - 簽名密鑰
 * @returns {string} - 生成的簽名
 */
export function generateTestSignature(payload, secret) {
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload)
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payloadString)
  return hmac.digest('hex').toLowerCase()
}
