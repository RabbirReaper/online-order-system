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
      console.error('❌ 未設定 UBEREATS_WEBHOOK_SECRET 環境變數')
      throw new AppError('Webhook 簽名驗證配置錯誤', 500)
    }

    // 調試日誌
    console.log('🔍 驗證資訊:', {
      bodyType: Buffer.isBuffer(rawBody) ? 'Buffer' : typeof rawBody,
      bodyLength: Buffer.isBuffer(rawBody) ? rawBody.length : JSON.stringify(rawBody).length,
      signatureLength: signature?.length,
      hasSecondarySecret: !!secondarySecret,
      eventId,
      timestamp,
    })

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
      console.error('❌ Webhook 驗證失敗:', {
        errors: result.errors,
        eventId,
        signature: signature ? `${signature.substring(0, 10)}...` : 'missing',
      })
      throw new AppError(`Webhook 驗證失敗: ${result.errors.join(', ')}`, 401)
    }

    if (result.warnings.length > 0) {
      console.warn('⚠️ Webhook 驗證警告:', result.warnings)
    }

    req.body = parsedBody
    req.webhookVerified = true

    console.log('✅ Webhook 驗證成功:', { eventId, eventType: parsedBody.event_type })
    next()
  } catch (error) {
    if (error instanceof AppError) {
      next(error)
      return
    }
    console.error('❌ Webhook 驗證過程發生錯誤:', error)
    next(new AppError('Webhook 驗證失敗', 500))
  }
}
