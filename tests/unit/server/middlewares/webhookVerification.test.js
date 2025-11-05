/**
 * Webhook 驗證中間件單元測試
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { verifyUberEatsWebhookMiddleware } from '../../../../server/middlewares/webhookVerification.js'
import { generateTestSignature, uberEatsDeduplicator } from '../../../../server/utils/webhookSecurity.js'

describe('Webhook 驗證中間件', () => {
  const testSecret = 'test-webhook-secret-key'

  beforeEach(() => {
    // 清理去重器
    uberEatsDeduplicator.clear()

    // 設定環境變數
    process.env.UBEREATS_WEBHOOK_SECRET = testSecret
  })

  describe('verifyUberEatsWebhookMiddleware', () => {
    it('應該驗證有效的 webhook 請求', () => {
      const testPayload = {
        event_type: 'orders.notification',
        event_id: 'evt_12345',
        meta: { resource_id: 'order_789' },
      }

      const payloadString = JSON.stringify(testPayload)
      const signature = generateTestSignature(payloadString, testSecret)

      const req = {
        headers: {
          'x-uber-signature': signature,
        },
        body: Buffer.from(payloadString, 'utf8'),
      }

      const res = {}
      const next = vi.fn()

      verifyUberEatsWebhookMiddleware(req, res, next)

      expect(next).toHaveBeenCalledOnce()
      expect(next).toHaveBeenCalledWith() // 沒有錯誤參數
      expect(req.webhookVerified).toBe(true)
      expect(req.body).toEqual(testPayload)
    })

    it('應該拒絕缺少簽名的請求', () => {
      const testPayload = {
        event_type: 'orders.notification',
        event_id: 'evt_12345',
      }

      const payloadString = JSON.stringify(testPayload)

      const req = {
        headers: {}, // 沒有簽名標頭
        body: Buffer.from(payloadString, 'utf8'),
      }

      const res = {}
      const next = vi.fn()

      verifyUberEatsWebhookMiddleware(req, res, next)

      expect(next).toHaveBeenCalledOnce()
      const error = next.mock.calls[0][0]
      expect(error).toBeDefined()
      expect(error.statusCode).toBe(401)
    })

    it('應該拒絕錯誤的簽名', () => {
      const testPayload = {
        event_type: 'orders.notification',
        event_id: 'evt_12345',
      }

      const payloadString = JSON.stringify(testPayload)

      const req = {
        headers: {
          'x-uber-signature': 'invalid-signature-12345',
        },
        body: Buffer.from(payloadString, 'utf8'),
      }

      const res = {}
      const next = vi.fn()

      verifyUberEatsWebhookMiddleware(req, res, next)

      expect(next).toHaveBeenCalledOnce()
      const error = next.mock.calls[0][0]
      expect(error).toBeDefined()
      expect(error.statusCode).toBe(401)
      expect(error.message).toContain('簽名驗證失敗')
    })

    it('應該拒絕重複的事件', () => {
      const testPayload = {
        event_type: 'orders.notification',
        event_id: 'evt_duplicate',
        meta: { resource_id: 'order_789' },
      }

      const payloadString = JSON.stringify(testPayload)
      const signature = generateTestSignature(payloadString, testSecret)

      const req1 = {
        headers: { 'x-uber-signature': signature },
        body: Buffer.from(payloadString, 'utf8'),
      }

      const res1 = {}
      const next1 = vi.fn()

      // 第一次請求應該成功
      verifyUberEatsWebhookMiddleware(req1, res1, next1)
      expect(next1).toHaveBeenCalledWith()

      // 第二次相同的請求應該失敗
      const req2 = {
        headers: { 'x-uber-signature': signature },
        body: Buffer.from(payloadString, 'utf8'),
      }

      const res2 = {}
      const next2 = vi.fn()

      verifyUberEatsWebhookMiddleware(req2, res2, next2)

      const error = next2.mock.calls[0][0]
      expect(error).toBeDefined()
      expect(error.statusCode).toBe(401)
      expect(error.message).toContain('已處理過')
    })

    it('應該處理非 Buffer 類型的 body', () => {
      const testPayload = {
        event_type: 'orders.notification',
        event_id: 'evt_string_body',
      }

      const payloadString = JSON.stringify(testPayload)
      const signature = generateTestSignature(payloadString, testSecret)

      const req = {
        headers: { 'x-uber-signature': signature },
        body: payloadString, // 字串而非 Buffer
      }

      const res = {}
      const next = vi.fn()

      verifyUberEatsWebhookMiddleware(req, res, next)

      expect(next).toHaveBeenCalledWith()
      expect(req.webhookVerified).toBe(true)
    })

    it('應該拒絕無效的 JSON body', () => {
      const invalidJson = 'not a json string'
      const signature = generateTestSignature(invalidJson, testSecret)

      const req = {
        headers: { 'x-uber-signature': signature },
        body: Buffer.from(invalidJson, 'utf8'),
      }

      const res = {}
      const next = vi.fn()

      verifyUberEatsWebhookMiddleware(req, res, next)

      const error = next.mock.calls[0][0]
      expect(error).toBeDefined()
      expect(error.statusCode).toBe(400)
      expect(error.message).toContain('格式無效')
    })

    it('應該在缺少環境變數時返回錯誤', () => {
      // 暫時移除環境變數
      const originalSecret = process.env.UBEREATS_WEBHOOK_SECRET
      delete process.env.UBEREATS_WEBHOOK_SECRET

      const testPayload = {
        event_type: 'orders.notification',
        event_id: 'evt_no_env',
      }

      const payloadString = JSON.stringify(testPayload)

      const req = {
        headers: { 'x-uber-signature': 'some-signature' },
        body: Buffer.from(payloadString, 'utf8'),
      }

      const res = {}
      const next = vi.fn()

      verifyUberEatsWebhookMiddleware(req, res, next)

      const error = next.mock.calls[0][0]
      expect(error).toBeDefined()
      expect(error.statusCode).toBe(500)
      expect(error.message).toContain('配置錯誤')

      // 恢復環境變數
      process.env.UBEREATS_WEBHOOK_SECRET = originalSecret
    })

    it('應該處理使用備用密鑰的請求', () => {
      const secondarySecret = 'secondary-webhook-secret'
      process.env.UBEREATS_WEBHOOK_SECRET_SECONDARY = secondarySecret

      const testPayload = {
        event_type: 'orders.notification',
        event_id: 'evt_secondary',
      }

      const payloadString = JSON.stringify(testPayload)
      // 使用備用密鑰生成簽名
      const signature = generateTestSignature(payloadString, secondarySecret)

      const req = {
        headers: { 'x-uber-signature': signature },
        body: Buffer.from(payloadString, 'utf8'),
      }

      const res = {}
      const next = vi.fn()

      verifyUberEatsWebhookMiddleware(req, res, next)

      // 應該成功通過驗證
      expect(next).toHaveBeenCalledWith()
      expect(req.webhookVerified).toBe(true)

      // 清理
      delete process.env.UBEREATS_WEBHOOK_SECRET_SECONDARY
    })

    it('應該處理缺少 body 的請求', () => {
      const req = {
        headers: { 'x-uber-signature': 'some-signature' },
        body: null,
      }

      const res = {}
      const next = vi.fn()

      verifyUberEatsWebhookMiddleware(req, res, next)

      const error = next.mock.calls[0][0]
      expect(error).toBeDefined()
      expect(error.statusCode).toBe(400)
      expect(error.message).toContain('無法獲取請求 body')
    })

    it('應該在 event_id 位於 meta 中時正確處理', () => {
      const testPayload = {
        event_type: 'orders.notification',
        meta: {
          event_id: 'evt_in_meta',
          resource_id: 'order_123',
        },
      }

      const payloadString = JSON.stringify(testPayload)
      const signature = generateTestSignature(payloadString, testSecret)

      const req = {
        headers: { 'x-uber-signature': signature },
        body: Buffer.from(payloadString, 'utf8'),
      }

      const res = {}
      const next = vi.fn()

      verifyUberEatsWebhookMiddleware(req, res, next)

      expect(next).toHaveBeenCalledWith()
      expect(req.webhookVerified).toBe(true)

      // 同一個 event_id 再次請求應該失敗
      const req2 = {
        headers: { 'x-uber-signature': signature },
        body: Buffer.from(payloadString, 'utf8'),
      }

      const next2 = vi.fn()

      verifyUberEatsWebhookMiddleware(req2, {}, next2)

      const error = next2.mock.calls[0][0]
      expect(error).toBeDefined()
      expect(error.message).toContain('已處理過')
    })
  })
})
