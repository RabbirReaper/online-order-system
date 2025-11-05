/**
 * Webhook 驗證中間件
 * 在處理 webhook 請求前進行安全驗證
 */

import { verifyUberEatsWebhook } from '../utils/webhookSecurity.js'
import { AppError } from './error.js'

/**
 * UberEats Webhook 簽名驗證中間件
 */
export function verifyUberEatsWebhookMiddleware(req, res, next) {
  try {
    const signature = req.headers['x-uber-signature']
    const rawBody = req.body

    if (!rawBody) {
      throw new AppError('無法獲取請求 body', 400)
    }

    // 解析 JSON
    let parsedBody
    try {
      parsedBody = Buffer.isBuffer(rawBody) ? JSON.parse(rawBody.toString('utf8')) : rawBody
    } catch (error) {
      throw new AppError('請求 body 格式無效', 400)
    }

    const eventId = parsedBody.event_id || parsedBody.meta?.event_id
    const timestamp = parsedBody.timestamp || parsedBody.meta?.timestamp
    const primarySecret = process.env.UBEREATS_WEBHOOK_SECRET
    const secondarySecret = process.env.UBEREATS_WEBHOOK_SECRET_SECONDARY

    if (!primarySecret) {
      throw new AppError('Webhook 簽名驗證配置錯誤', 500)
    }

    // 驗證 webhook
    const result = verifyUberEatsWebhook({
      payload: rawBody,
      signature,
      eventId,
      timestamp,
      primarySecret,
      secondarySecret,
    })

    if (!result.valid) {
      throw new AppError(`Webhook 驗證失敗: ${result.errors.join(', ')}`, 401)
    }

    if (result.warnings.length > 0) {
      console.warn('⚠️ Webhook 驗證警告:', result.warnings)
    }

    req.body = parsedBody
    req.webhookVerified = true
    next()
  } catch (error) {
    if (error instanceof AppError) {
      next(error)
      return
    }
    next(new AppError('Webhook 驗證失敗', 500))
  }
}
