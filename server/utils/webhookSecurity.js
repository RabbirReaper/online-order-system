/**
 * Webhook 安全驗證工具
 * 提供 UberEats webhook 簽名驗證功能
 */

import crypto from 'crypto'

/**
 * 驗證 UberEats webhook 請求
 * 根據官方文檔: https://developer.uber.com/docs/eats/guides/webhooks
 *
 * 官方要求：
 * - 驗證 X-Uber-Signature 標頭
 * - 使用 HMAC-SHA256 驗證 request body
 * - 使用 webhook secret 作為密鑰
 *
 * @param {Object} options - 驗證選項
 * @param {string|Buffer} options.payload - 請求 body (原始字串或 Buffer)
 * @param {string} options.signature - X-Uber-Signature 標頭值
 * @param {string} options.primarySecret - Webhook 簽名密鑰
 * @returns {Object} - { valid: boolean, errors: string[], warnings: string[] }
 */
export function verifyUberEatsWebhook(options) {
  const { payload, signature, primarySecret } = options

  const result = {
    valid: false,
    errors: [],
    warnings: [],
  }

  // 1. 檢查必要參數
  if (!signature) {
    result.errors.push('缺少 X-Uber-Signature 標頭')
    return result
  }

  if (!primarySecret) {
    result.errors.push('缺少 webhook 簽名密鑰')
    return result
  }

  if (!payload) {
    result.errors.push('缺少請求 payload')
    return result
  }

  // 2. 驗證簽名
  try {
    // 確保 payload 是字串
    const payloadString = Buffer.isBuffer(payload) ? payload.toString('utf8') : payload

    // 使用 SHA256 生成 HMAC 簽名
    const hmac = crypto.createHmac('sha256', primarySecret)
    hmac.update(payloadString)
    const computedSignature = hmac.digest('hex').toLowerCase()

    // UberEats 使用 lowercase hex
    const providedSignature = signature.toLowerCase()

    // 檢查簽名長度是否正確 (SHA256 hex 長度為 64)
    if (providedSignature.length !== 64) {
      result.errors.push('簽名驗證失敗')
      return result
    }

    // 使用時間安全的比較方法
    const isValid = crypto.timingSafeEqual(
      Buffer.from(computedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex'),
    )

    if (!isValid) {
      result.errors.push('簽名驗證失敗')
      return result
    }

    // 驗證成功
    result.valid = true
    return result
  } catch (error) {
    console.error('❌ 簽名驗證過程發生錯誤:', error.message)
    result.errors.push('簽名驗證失敗')
    return result
  }
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
