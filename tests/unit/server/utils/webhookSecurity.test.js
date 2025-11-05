/**
 * Webhook 安全驗證工具單元測試
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import crypto from 'crypto'
import {
  verifyUberEatsSignature,
  verifyUberEatsSignatureWithFallback,
  verifyTimestamp,
  verifyUberEatsWebhook,
  generateTestSignature,
  uberEatsDeduplicator,
} from '../../../../server/utils/webhookSecurity.js'

describe('Webhook 安全驗證工具', () => {
  const testSecret = 'test-secret-key-12345'
  const secondarySecret = 'secondary-secret-key-67890'

  const testPayload = {
    event_type: 'orders.notification',
    event_id: 'evt_123456',
    meta: {
      resource_id: 'order_789',
      user_id: 'store_456',
    },
  }

  const testPayloadString = JSON.stringify(testPayload)

  // 清理事件去重器
  beforeEach(() => {
    uberEatsDeduplicator.clear()
  })

  afterEach(() => {
    uberEatsDeduplicator.clear()
  })

  describe('verifyUberEatsSignature', () => {
    it('應該驗證正確的簽名', () => {
      const signature = crypto
        .createHmac('sha256', testSecret)
        .update(testPayloadString)
        .digest('hex')

      const result = verifyUberEatsSignature(testPayloadString, signature, testSecret)
      expect(result).toBe(true)
    })

    it('應該拒絕錯誤的簽名', () => {
      const wrongSignature = 'invalid-signature-12345'
      const result = verifyUberEatsSignature(testPayloadString, wrongSignature, testSecret)
      expect(result).toBe(false)
    })

    it('應該處理 Buffer 類型的 payload', () => {
      const payloadBuffer = Buffer.from(testPayloadString, 'utf8')
      const signature = crypto
        .createHmac('sha256', testSecret)
        .update(testPayloadString)
        .digest('hex')

      const result = verifyUberEatsSignature(payloadBuffer, signature, testSecret)
      expect(result).toBe(true)
    })

    it('應該拒絕空的參數', () => {
      expect(verifyUberEatsSignature('', 'signature', testSecret)).toBe(false)
      expect(verifyUberEatsSignature(testPayloadString, '', testSecret)).toBe(false)
      expect(verifyUberEatsSignature(testPayloadString, 'signature', '')).toBe(false)
    })

    it('應該拒絕使用錯誤密鑰生成的簽名', () => {
      const wrongSecret = 'wrong-secret'
      const signature = crypto
        .createHmac('sha256', wrongSecret)
        .update(testPayloadString)
        .digest('hex')

      const result = verifyUberEatsSignature(testPayloadString, signature, testSecret)
      expect(result).toBe(false)
    })
  })

  describe('verifyUberEatsSignatureWithFallback', () => {
    it('應該使用主要密鑰驗證成功', () => {
      const signature = crypto
        .createHmac('sha256', testSecret)
        .update(testPayloadString)
        .digest('hex')

      const result = verifyUberEatsSignatureWithFallback(
        testPayloadString,
        signature,
        testSecret,
        secondarySecret,
      )

      expect(result.valid).toBe(true)
      expect(result.usedSecondary).toBe(false)
    })

    it('應該在主要密鑰失敗時使用備用密鑰', () => {
      const signature = crypto
        .createHmac('sha256', secondarySecret)
        .update(testPayloadString)
        .digest('hex')

      const result = verifyUberEatsSignatureWithFallback(
        testPayloadString,
        signature,
        testSecret,
        secondarySecret,
      )

      expect(result.valid).toBe(true)
      expect(result.usedSecondary).toBe(true)
    })

    it('應該在兩個密鑰都失敗時返回失敗', () => {
      const wrongSecret = 'wrong-secret'
      const signature = crypto
        .createHmac('sha256', wrongSecret)
        .update(testPayloadString)
        .digest('hex')

      const result = verifyUberEatsSignatureWithFallback(
        testPayloadString,
        signature,
        testSecret,
        secondarySecret,
      )

      expect(result.valid).toBe(false)
      expect(result.usedSecondary).toBe(false)
    })

    it('應該在沒有備用密鑰時只使用主要密鑰', () => {
      const signature = crypto
        .createHmac('sha256', testSecret)
        .update(testPayloadString)
        .digest('hex')

      const result = verifyUberEatsSignatureWithFallback(testPayloadString, signature, testSecret)

      expect(result.valid).toBe(true)
      expect(result.usedSecondary).toBe(false)
    })
  })

  describe('verifyTimestamp', () => {
    it('應該接受當前時間戳', () => {
      const currentTimestamp = Math.floor(Date.now() / 1000)
      expect(verifyTimestamp(currentTimestamp)).toBe(true)
    })

    it('應該接受在允許範圍內的時間戳', () => {
      const timestamp = Math.floor(Date.now() / 1000) - 60 // 1 分鐘前
      expect(verifyTimestamp(timestamp, 300)).toBe(true)
    })

    it('應該拒絕過期的時間戳', () => {
      const oldTimestamp = Math.floor(Date.now() / 1000) - 600 // 10 分鐘前
      expect(verifyTimestamp(oldTimestamp, 300)).toBe(false)
    })

    it('應該拒絕未來的時間戳 (超過允許範圍)', () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 600 // 10 分鐘後
      expect(verifyTimestamp(futureTimestamp, 300)).toBe(false)
    })

    it('應該處理毫秒級時間戳', () => {
      const currentTimestampMs = Date.now()
      expect(verifyTimestamp(currentTimestampMs)).toBe(true)
    })

    it('應該拒絕無效的時間戳', () => {
      expect(verifyTimestamp('invalid')).toBe(false)
      expect(verifyTimestamp(null)).toBe(false)
      expect(verifyTimestamp(undefined)).toBe(false)
    })

    it('應該接受字串格式的時間戳', () => {
      const currentTimestamp = String(Math.floor(Date.now() / 1000))
      expect(verifyTimestamp(currentTimestamp)).toBe(true)
    })
  })

  describe('EventDeduplicator', () => {
    it('應該正確標記和檢測重複事件', () => {
      const eventId = 'evt_unique_123'

      // 第一次應該不是重複的
      expect(uberEatsDeduplicator.isDuplicate(eventId)).toBe(false)

      // 標記為已處理
      uberEatsDeduplicator.markAsProcessed(eventId)

      // 第二次應該是重複的
      expect(uberEatsDeduplicator.isDuplicate(eventId)).toBe(true)
    })

    it('應該為不同的事件返回不重複', () => {
      uberEatsDeduplicator.markAsProcessed('evt_1')

      expect(uberEatsDeduplicator.isDuplicate('evt_2')).toBe(false)
    })

    it('應該處理空的事件 ID', () => {
      expect(uberEatsDeduplicator.isDuplicate('')).toBe(false)
      expect(uberEatsDeduplicator.isDuplicate(null)).toBe(false)
      expect(uberEatsDeduplicator.isDuplicate(undefined)).toBe(false)
    })

    it('應該返回正確的統計資訊', () => {
      uberEatsDeduplicator.markAsProcessed('evt_1')
      uberEatsDeduplicator.markAsProcessed('evt_2')

      const stats = uberEatsDeduplicator.getStats()
      expect(stats.size).toBe(2)
      expect(stats.maxSize).toBeGreaterThan(0)
      expect(stats.ttlMs).toBeGreaterThan(0)
    })

    it('應該清空所有記錄', () => {
      uberEatsDeduplicator.markAsProcessed('evt_1')
      uberEatsDeduplicator.markAsProcessed('evt_2')

      uberEatsDeduplicator.clear()

      const stats = uberEatsDeduplicator.getStats()
      expect(stats.size).toBe(0)
    })
  })

  describe('verifyUberEatsWebhook', () => {
    it('應該驗證完整的 webhook 請求', () => {
      const signature = generateTestSignature(testPayload, testSecret)
      const timestamp = Math.floor(Date.now() / 1000)

      const result = verifyUberEatsWebhook({
        payload: testPayloadString,
        signature,
        eventId: testPayload.event_id,
        timestamp,
        primarySecret: testSecret,
      })

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('應該拒絕缺少簽名的請求', () => {
      const result = verifyUberEatsWebhook({
        payload: testPayloadString,
        signature: '',
        eventId: testPayload.event_id,
        primarySecret: testSecret,
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('缺少 X-Uber-Signature 標頭')
    })

    it('應該拒絕錯誤的簽名', () => {
      const result = verifyUberEatsWebhook({
        payload: testPayloadString,
        signature: 'invalid-signature',
        eventId: testPayload.event_id,
        primarySecret: testSecret,
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('簽名驗證失敗')
    })

    it('應該拒絕過期的時間戳', () => {
      const signature = generateTestSignature(testPayload, testSecret)
      const oldTimestamp = Math.floor(Date.now() / 1000) - 600 // 10 分鐘前

      const result = verifyUberEatsWebhook({
        payload: testPayloadString,
        signature,
        eventId: testPayload.event_id,
        timestamp: oldTimestamp,
        primarySecret: testSecret,
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('請求時間戳無效或已過期')
    })

    it('應該拒絕重複的事件', () => {
      const signature = generateTestSignature(testPayload, testSecret)
      const timestamp = Math.floor(Date.now() / 1000)

      // 第一次處理
      const result1 = verifyUberEatsWebhook({
        payload: testPayloadString,
        signature,
        eventId: testPayload.event_id,
        timestamp,
        primarySecret: testSecret,
      })

      expect(result1.valid).toBe(true)

      // 第二次處理相同事件
      const result2 = verifyUberEatsWebhook({
        payload: testPayloadString,
        signature,
        eventId: testPayload.event_id,
        timestamp,
        primarySecret: testSecret,
      })

      expect(result2.valid).toBe(false)
      expect(result2.errors.some((err) => err.includes('已處理過'))).toBe(true)
    })

    it('應該支援跳過時間戳檢查', () => {
      const signature = generateTestSignature(testPayload, testSecret)
      const oldTimestamp = Math.floor(Date.now() / 1000) - 600 // 10 分鐘前

      const result = verifyUberEatsWebhook({
        payload: testPayloadString,
        signature,
        eventId: 'evt_unique_skip_timestamp',
        timestamp: oldTimestamp,
        primarySecret: testSecret,
        skipTimestampCheck: true,
      })

      expect(result.valid).toBe(true)
    })

    it('應該支援跳過去重檢查', () => {
      const signature = generateTestSignature(testPayload, testSecret)
      const eventId = 'evt_duplicate_allowed'

      // 第一次
      verifyUberEatsWebhook({
        payload: testPayloadString,
        signature,
        eventId,
        primarySecret: testSecret,
        skipDuplicateCheck: true,
      })

      // 第二次 (允許重複)
      const result = verifyUberEatsWebhook({
        payload: testPayloadString,
        signature,
        eventId,
        primarySecret: testSecret,
        skipDuplicateCheck: true,
      })

      expect(result.valid).toBe(true)
    })

    it('應該在使用備用密鑰時產生警告', () => {
      const signature = generateTestSignature(testPayload, secondarySecret)

      const result = verifyUberEatsWebhook({
        payload: testPayloadString,
        signature,
        eventId: 'evt_secondary_key',
        primarySecret: testSecret,
        secondarySecret,
      })

      expect(result.valid).toBe(true)
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings.some((warn) => warn.includes('備用密鑰'))).toBe(true)
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

      const isValid = verifyUberEatsSignature(payloadString, signature, testSecret)
      expect(isValid).toBe(true)
    })

    it('應該為相同的 payload 和 secret 生成相同的簽名', () => {
      const signature1 = generateTestSignature(testPayload, testSecret)
      const signature2 = generateTestSignature(testPayload, testSecret)
      expect(signature1).toBe(signature2)
    })

    it('應該為不同的 secret 生成不同的簽名', () => {
      const signature1 = generateTestSignature(testPayload, testSecret)
      const signature2 = generateTestSignature(testPayload, secondarySecret)
      expect(signature1).not.toBe(signature2)
    })
  })
})
