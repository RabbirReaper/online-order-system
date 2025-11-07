/**
 * Webhook 安全驗證工具單元測試
 */

import { describe, it, expect } from 'vitest'
import { verifyUberEatsWebhook, generateTestSignature } from '../../../../server/utils/webhookSecurity.js'

describe('Webhook 安全驗證工具', () => {
  const testSecret = 'test-secret-key-12345'

  const testPayload = {
    event_type: 'orders.notification',
    event_id: 'evt_123456',
    meta: {
      resource_id: 'order_789',
      user_id: 'store_456',
    },
  }

  const testPayloadString = JSON.stringify(testPayload)

  describe('verifyUberEatsWebhook', () => {
    it('應該驗證正確的簽名', () => {
      const signature = generateTestSignature(testPayload, testSecret)

      const result = verifyUberEatsWebhook({
        payload: testPayloadString,
        signature,
        primarySecret: testSecret,
      })

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('應該接受 Buffer 類型的 payload', () => {
      const payloadBuffer = Buffer.from(testPayloadString, 'utf8')
      const signature = generateTestSignature(testPayload, testSecret)

      const result = verifyUberEatsWebhook({
        payload: payloadBuffer,
        signature,
        primarySecret: testSecret,
      })

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('應該拒絕缺少簽名的請求', () => {
      const result = verifyUberEatsWebhook({
        payload: testPayloadString,
        signature: '',
        primarySecret: testSecret,
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('缺少 X-Uber-Signature 標頭')
    })

    it('應該拒絕缺少密鑰的請求', () => {
      const signature = generateTestSignature(testPayload, testSecret)

      const result = verifyUberEatsWebhook({
        payload: testPayloadString,
        signature,
        primarySecret: '',
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('缺少 webhook 簽名密鑰')
    })

    it('應該拒絕缺少 payload 的請求', () => {
      const signature = generateTestSignature(testPayload, testSecret)

      const result = verifyUberEatsWebhook({
        payload: '',
        signature,
        primarySecret: testSecret,
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('缺少請求 payload')
    })

    it('應該拒絕錯誤的簽名', () => {
      const result = verifyUberEatsWebhook({
        payload: testPayloadString,
        signature: 'invalid-signature-12345',
        primarySecret: testSecret,
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('簽名驗證失敗')
    })

    it('應該拒絕使用錯誤密鑰生成的簽名', () => {
      const wrongSecret = 'wrong-secret'
      const signature = generateTestSignature(testPayload, wrongSecret)

      const result = verifyUberEatsWebhook({
        payload: testPayloadString,
        signature,
        primarySecret: testSecret,
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('簽名驗證失敗')
    })

    it('應該處理大小寫不同的簽名', () => {
      const signature = generateTestSignature(testPayload, testSecret).toUpperCase()

      const result = verifyUberEatsWebhook({
        payload: testPayloadString,
        signature,
        primarySecret: testSecret,
      })

      expect(result.valid).toBe(true)
    })
  })

  describe('generateTestSignature', () => {
    it('應該為字串 payload 生成正確的簽名', () => {
      const signature = generateTestSignature(testPayloadString, testSecret)
      expect(signature).toBeTruthy()
      expect(typeof signature).toBe('string')
      expect(signature.length).toBe(64) // SHA256 hex 長度
    })

    it('應該為物件 payload 生成正確的簽名', () => {
      const signature = generateTestSignature(testPayload, testSecret)
      expect(signature).toBeTruthy()
      expect(typeof signature).toBe('string')
    })

    it('應該生成可驗證的簽名', () => {
      const signature = generateTestSignature(testPayload, testSecret)
      const payloadString = JSON.stringify(testPayload)

      const result = verifyUberEatsWebhook({
        payload: payloadString,
        signature,
        primarySecret: testSecret,
      })

      expect(result.valid).toBe(true)
    })

    it('應該為相同的 payload 和 secret 生成相同的簽名', () => {
      const signature1 = generateTestSignature(testPayload, testSecret)
      const signature2 = generateTestSignature(testPayload, testSecret)
      expect(signature1).toBe(signature2)
    })

    it('應該為不同的 secret 生成不同的簽名', () => {
      const secondarySecret = 'secondary-secret-key-67890'
      const signature1 = generateTestSignature(testPayload, testSecret)
      const signature2 = generateTestSignature(testPayload, secondarySecret)
      expect(signature1).not.toBe(signature2)
    })
  })
})
