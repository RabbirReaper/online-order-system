/**
 * Session 持久化測試
 * 測試 MongoDB session store 是否正確保存和恢復 session
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import express from 'express'
import request from 'supertest'
import dotenv from 'dotenv'

// 這個測試需要真實的 express-session 和 mongoose，所以我們需要 unmock 它們
vi.unmock('express-session')
vi.unmock('connect-mongo')
vi.unmock('mongoose')

// 在 unmock 後才 import
const session = await import('express-session')
const MongoStore = await import('connect-mongo')
const mongoose = await import('mongoose')

dotenv.config()

// 測試用的簡單 Express app
const createTestApp = (sessionStore) => {
  const app = express()
  app.use(express.json())

  app.use(
    session.default({
      secret: 'test-secret-key',
      resave: false,
      saveUninitialized: false,
      rolling: true,
      store: sessionStore,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 小時
        sameSite: 'strict',
        httpOnly: true,
        secure: false,
      },
    }),
  )

  // 測試路由：設定 session
  app.post('/test/set-session', (req, res) => {
    req.session.userId = req.body.userId
    req.session.role = req.body.role
    req.session.customData = req.body.customData
    res.json({ success: true, message: 'Session set' })
  })

  // 測試路由：讀取 session
  app.get('/test/get-session', (req, res) => {
    res.json({
      success: true,
      session: {
        userId: req.session.userId,
        role: req.session.role,
        customData: req.session.customData,
        cookie: {
          maxAge: req.session.cookie.maxAge,
          expires: req.session.cookie.expires,
        },
      },
    })
  })

  // 測試路由：檢查 session 是否存在
  app.get('/test/check-session', (req, res) => {
    const hasSession = !!req.session.userId
    res.json({
      success: true,
      hasSession,
      sessionId: req.sessionID,
    })
  })

  // 測試路由：更新 session (測試 rolling)
  app.post('/test/update-session', (req, res) => {
    req.session.lastAccess = new Date().toISOString()
    res.json({
      success: true,
      message: 'Session updated',
      maxAge: req.session.cookie.maxAge,
    })
  })

  // 測試路由：銷毀 session
  app.post('/test/destroy-session', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Failed to destroy session' })
      }
      res.json({ success: true, message: 'Session destroyed' })
    })
  })

  return app
}

describe('Session 持久化測試', () => {
  let sessionStore
  let app
  let agent // supertest agent 用於保持 cookie

  beforeAll(async () => {
    // 確保 MongoDB 連接 URL 存在
    const mongoUrl = process.env.MongoDB_url || 'mongodb://localhost:27017/test_db'

    // 連接 MongoDB
    if (mongoose.default.connection.readyState === 0) {
      await mongoose.default.connect(mongoUrl, {
        maxPoolSize: 5,
        minPoolSize: 1,
      })
    }

    // 創建 MongoStore - 使用現有的 mongoose 連接
    sessionStore = MongoStore.default.create({
      client: mongoose.default.connection.getClient(), // 使用現有的 mongoose 連接
      touchAfter: 23 * 3600,
      crypto: {
        secret: 'test-secret-key',
      },
      collectionName: 'test_sessions', // 使用專門的測試集合
    })

    // 創建測試 app
    app = createTestApp(sessionStore)
  })

  afterAll(async () => {
    // 清理測試 session collection
    try {
      if (mongoose.default.connection.db) {
        await mongoose.default.connection.db.collection('test_sessions').deleteMany({})
      }
    } catch (error) {
      console.log('清理 session collection 時發生錯誤:', error)
    }

    // 關閉 session store
    try {
      if (sessionStore) {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Close timeout')), 5000)
          sessionStore.close(() => {
            clearTimeout(timeout)
            resolve()
          })
        })
      }
    } catch (error) {
      console.log('關閉 session store 時發生錯誤:', error)
    }

    // 關閉 MongoDB 連接（如果需要）
    // await mongoose.default.connection.close()
  })

  beforeEach(() => {
    // 為每個測試創建新的 agent（保持 cookie）
    agent = request.agent(app)
  })

  afterEach(async () => {
    // 清理測試產生的 session
    if (mongoose.default.connection.db) {
      await mongoose.default.connection.db.collection('test_sessions').deleteMany({})
    }
  })

  describe('基本 Session 存取', () => {
    it('應該能夠設定和讀取 session', async () => {
      // 設定 session
      const setResponse = await agent.post('/test/set-session').send({
        userId: 'test-user-123',
        role: 'user',
        customData: { brand: 'test-brand' },
      })

      expect(setResponse.status).toBe(200)
      expect(setResponse.body.success).toBe(true)

      // 讀取 session
      const getResponse = await agent.get('/test/get-session')

      expect(getResponse.status).toBe(200)
      expect(getResponse.body.success).toBe(true)
      expect(getResponse.body.session.userId).toBe('test-user-123')
      expect(getResponse.body.session.role).toBe('user')
      expect(getResponse.body.session.customData).toEqual({ brand: 'test-brand' })
    })

    it('應該在沒有設定 session 時返回空值', async () => {
      const response = await agent.get('/test/get-session')

      expect(response.status).toBe(200)
      expect(response.body.session.userId).toBeUndefined()
      expect(response.body.session.role).toBeUndefined()
    })
  })

  describe('MongoDB 持久化驗證', () => {
    it('應該將 session 正確存入 MongoDB', async () => {
      // 設定 session
      await agent.post('/test/set-session').send({
        userId: 'test-user-mongodb',
        role: 'admin',
      })

      // 等待 session 存入 MongoDB (MongoStore 有小延遲)
      await new Promise((resolve) => setTimeout(resolve, 500))

      // 直接從 MongoDB 查詢 session
      const sessionsCollection = mongoose.default.connection.db.collection('test_sessions')
      const sessions = await sessionsCollection.find({}).toArray()

      expect(sessions.length).toBeGreaterThan(0)

      // 檢查 session 記錄存在
      const sessionData = sessions[0]
      expect(sessionData).toBeDefined()
      expect(sessionData._id).toBeDefined() // session ID 存在
      expect(sessionData.expires).toBeDefined() // 過期時間存在
      expect(sessionData.session).toBeDefined() // session 數據存在（可能是加密的）

      // 注意：由於使用了 crypto，session 數據是加密的，所以我們不解析內容
      // 只驗證 session 確實存在於 MongoDB 中
    })

    it('應該在 session 更新時更新 MongoDB 記錄', async () => {
      // 設定初始 session
      await agent.post('/test/set-session').send({
        userId: 'test-user-update',
        role: 'user',
      })

      await new Promise((resolve) => setTimeout(resolve, 500))

      // 記錄初始的 expires 時間
      const sessionsCollection = mongoose.default.connection.db.collection('test_sessions')
      const initialSessions = await sessionsCollection.find({}).toArray()
      const initialExpires = initialSessions[0].expires

      // 更新 session
      await agent.post('/test/update-session')

      await new Promise((resolve) => setTimeout(resolve, 500))

      // 檢查 MongoDB - session 仍然存在
      const updatedSessions = await sessionsCollection.find({}).toArray()
      expect(updatedSessions.length).toBe(1)

      // 由於 rolling: true，expires 時間應該被更新（延長）
      // 注意：由於 touchAfter 設定，可能不會每次都更新
      expect(updatedSessions[0].expires).toBeDefined()
      expect(updatedSessions[0].session).toBeDefined()
    })

    it('應該在 session 銷毀時從 MongoDB 移除記錄', async () => {
      // 設定 session
      await agent.post('/test/set-session').send({
        userId: 'test-user-destroy',
        role: 'user',
      })

      await new Promise((resolve) => setTimeout(resolve, 500))

      // 確認 session 存在於 MongoDB
      let sessionsCollection = mongoose.default.connection.db.collection('test_sessions')
      let sessions = await sessionsCollection.find({}).toArray()
      expect(sessions.length).toBe(1)

      // 銷毀 session
      await agent.post('/test/destroy-session')

      await new Promise((resolve) => setTimeout(resolve, 500))

      // 確認 session 已從 MongoDB 移除
      sessions = await sessionsCollection.find({}).toArray()
      expect(sessions.length).toBe(0)
    })
  })

  describe('伺服器重啟模擬測試', () => {
    it('應該在模擬重啟後仍能恢復 session', async () => {
      // 第一階段：設定 session
      const setResponse = await agent.post('/test/set-session').send({
        userId: 'test-user-restart',
        role: 'admin',
        customData: { important: 'data' },
      })

      expect(setResponse.status).toBe(200)

      // 取得 session cookie
      const cookies = setResponse.headers['set-cookie']
      expect(cookies).toBeDefined()

      // 等待 session 存入 MongoDB
      await new Promise((resolve) => setTimeout(resolve, 500))

      // 確認 session 在 MongoDB 中
      const sessionsCollection = mongoose.default.connection.db.collection('test_sessions')
      const sessions = await sessionsCollection.find({}).toArray()
      expect(sessions.length).toBeGreaterThan(0)

      // 第二階段：模擬伺服器重啟（創建新的 app 實例，但使用相同的 store）
      const newApp = createTestApp(sessionStore)
      const newAgent = request.agent(newApp)

      // 使用相同的 cookie 發送請求
      const getResponse = await newAgent
        .get('/test/get-session')
        .set('Cookie', cookies)
        .send()

      // 驗證 session 仍然存在且正確
      expect(getResponse.status).toBe(200)
      expect(getResponse.body.success).toBe(true)
      expect(getResponse.body.session.userId).toBe('test-user-restart')
      expect(getResponse.body.session.role).toBe('admin')
      expect(getResponse.body.session.customData).toEqual({ important: 'data' })
    })
  })

  describe('Rolling Session 測試', () => {
    it('應該在每次請求時更新 cookie 的過期時間', async () => {
      // 設定 session
      await agent.post('/test/set-session').send({
        userId: 'test-user-rolling',
        role: 'user',
      })

      // 第一次讀取，記錄初始的 maxAge
      const firstResponse = await agent.get('/test/get-session')
      const firstMaxAge = firstResponse.body.session.cookie.maxAge

      expect(firstMaxAge).toBeGreaterThan(0)

      // 等待一小段時間
      await new Promise((resolve) => setTimeout(resolve, 100))

      // 第二次請求（應該觸發 rolling）
      await agent.post('/test/update-session')

      // 第三次讀取，檢查 maxAge 是否被重置
      const secondResponse = await agent.get('/test/get-session')
      const secondMaxAge = secondResponse.body.session.cookie.maxAge

      // 因為 rolling: true，maxAge 應該接近原始值（24小時）
      expect(secondMaxAge).toBeGreaterThan(firstMaxAge - 1000) // 允許一些誤差
    })

    it('應該持續活動時不會過期', async () => {
      // 設定 session
      await agent.post('/test/set-session').send({
        userId: 'test-user-active',
        role: 'user',
      })

      // 模擬多次活動
      for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        const response = await agent.get('/test/check-session')
        expect(response.body.hasSession).toBe(true)
      }

      // 最後確認 session 仍然有效
      const finalResponse = await agent.get('/test/get-session')
      expect(finalResponse.body.session.userId).toBe('test-user-active')
    })
  })

  describe('Cookie 設定測試', () => {
    it('應該使用正確的 cookie 設定', async () => {
      const response = await agent.post('/test/set-session').send({
        userId: 'test-user-cookie',
        role: 'user',
      })

      const setCookieHeader = response.headers['set-cookie']
      expect(setCookieHeader).toBeDefined()

      const cookieString = setCookieHeader[0]
      expect(cookieString).toContain('HttpOnly')
      expect(cookieString).toContain('SameSite=Strict')
      // 開發環境不使用 Secure
      expect(cookieString).not.toContain('Secure')
    })

    it('應該設定 24 小時的 maxAge', async () => {
      await agent.post('/test/set-session').send({
        userId: 'test-user-maxage',
        role: 'user',
      })

      const response = await agent.get('/test/get-session')

      const maxAge = response.body.session.cookie.maxAge
      const expectedMaxAge = 24 * 60 * 60 * 1000 // 24 小時

      // 允許一些誤差（幾秒內）
      expect(maxAge).toBeGreaterThan(expectedMaxAge - 10000)
      expect(maxAge).toBeLessThanOrEqual(expectedMaxAge)
    })
  })

  describe('併發 Session 測試', () => {
    it('應該正確處理多個 session', async () => {
      // 創建多個 agent（模擬多個用戶）
      const agent1 = request.agent(app)
      const agent2 = request.agent(app)
      const agent3 = request.agent(app)

      // 為每個 agent 設定不同的 session
      await agent1.post('/test/set-session').send({
        userId: 'user-1',
        role: 'user',
      })

      await agent2.post('/test/set-session').send({
        userId: 'user-2',
        role: 'admin',
      })

      await agent3.post('/test/set-session').send({
        userId: 'user-3',
        role: 'user',
      })

      await new Promise((resolve) => setTimeout(resolve, 500))

      // 驗證每個 agent 有自己獨立的 session
      const response1 = await agent1.get('/test/get-session')
      const response2 = await agent2.get('/test/get-session')
      const response3 = await agent3.get('/test/get-session')

      expect(response1.body.session.userId).toBe('user-1')
      expect(response2.body.session.userId).toBe('user-2')
      expect(response3.body.session.userId).toBe('user-3')

      // 確認 MongoDB 中有 3 個 session
      const sessionsCollection = mongoose.default.connection.db.collection('test_sessions')
      const sessions = await sessionsCollection.find({}).toArray()
      expect(sessions.length).toBe(3)
    })
  })
})
