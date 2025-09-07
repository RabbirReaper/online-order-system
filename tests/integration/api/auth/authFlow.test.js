/**
 * 認證 API 整合測試
 * tests/integration/api/auth/authFlow.test.js
 * 測試完整的認證流程：註冊、登入、會話管理、權限檢查
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import cors from 'cors'
import session from 'express-session'
import { TestDataFactory } from '../../../setup.js'

// 模擬 express-session
vi.mock('express-session', () => ({
  default: vi.fn().mockReturnValue((req, res, next) => next())
}))

// 模擬 bcrypt
vi.mock('bcrypt', () => ({
  genSalt: vi.fn().mockResolvedValue('mock-salt'),
  hash: vi.fn().mockResolvedValue('mock-hashed-password'),
  compare: vi.fn().mockResolvedValue(true)
}))

// 模擬用戶模型
vi.mock('@server/models/User/User.js', () => {
  const mockUser = vi.fn().mockImplementation((data) => ({
    ...data,
    _id: data._id || 'mock-user-id',
    save: vi.fn().mockResolvedValue(),
    toObject: vi.fn().mockReturnValue(data),
    toJSON: vi.fn().mockReturnValue(data)
  }))

  mockUser.findOne = vi.fn()
  mockUser.findById = vi.fn()
  mockUser.create = vi.fn()
  
  return { default: mockUser }
})

// 模擬管理員模型
vi.mock('@server/models/User/Admin.js', () => {
  const mockAdmin = vi.fn().mockImplementation((data) => ({
    ...data,
    _id: data._id || 'mock-admin-id',
    save: vi.fn().mockResolvedValue(),
    toObject: vi.fn().mockReturnValue(data),
    toJSON: vi.fn().mockReturnValue(data)
  }))

  mockAdmin.findOne = vi.fn()
  mockAdmin.findById = vi.fn().mockReturnValue({
    select: vi.fn().mockResolvedValue(null)
  })
  
  return { default: mockAdmin }
})

// 模擬品牌模型
vi.mock('@server/models/Brand/Brand.js', () => ({
  default: {
    findById: vi.fn().mockResolvedValue(TestDataFactory.createBrand())
  }
}))

// 模擬驗證碼相關
vi.mock('@server/models/User/VerificationCode.js', () => {
  const mockVerificationCode = vi.fn().mockImplementation((data) => ({
    ...data,
    _id: data._id || 'mock-verification-id',
    save: vi.fn().mockResolvedValue(),
    toObject: vi.fn().mockReturnValue(data)
  }))

  mockVerificationCode.findOne = vi.fn()
  mockVerificationCode.deleteOne = vi.fn().mockResolvedValue({ deletedCount: 1 })
  
  return { default: mockVerificationCode }
})

// 模擬錯誤處理
vi.mock('@server/middlewares/error.js', () => ({
  AppError: class AppError extends Error {
    constructor(message, statusCode = 500) {
      super(message)
      this.statusCode = statusCode
      this.name = 'AppError'
    }
  },
  asyncHandler: (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}))

// 模擬服務
vi.mock('@server/services/user/userAuthService.js', () => ({
  register: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  sendPhoneVerification: vi.fn().mockResolvedValue({
    success: true,
    message: '驗證碼已發送到您的手機',
    code: '123456',
    expiresIn: 300
  }),
  verifyPhoneCode: vi.fn().mockResolvedValue({
    success: true,
    verified: true,
    phone: '0912345678'
  }),
  forgotPassword: vi.fn().mockResolvedValue({
    success: true,
    message: '重設密碼連結已發送至您的信箱',
    expiresIn: 300
  }),
  resetPassword: vi.fn().mockResolvedValue({
    success: true,
    message: '密碼已成功重設，請使用新密碼登入'
  }),
  changePassword: vi.fn().mockResolvedValue({
    success: true,
    message: '密碼修改成功'
  }),
  checkUserStatus: vi.fn().mockResolvedValue({
    loggedIn: true,
    role: 'user',
    brandId: 'test-brand-id'
  }),
  validateUserUpdate: vi.fn(),
  validateUserRegistration: vi.fn().mockResolvedValue(true),
  checkEmailExists: vi.fn().mockResolvedValue(false),
  checkPhoneExists: vi.fn().mockResolvedValue(false)
}))

vi.mock('@server/services/user/adminAuthService.js', () => ({
  adminLogin: vi.fn().mockResolvedValue({
    role: 'brand_admin',
    brand: { _id: 'brand-id', name: 'Test Brand' },
    store: null
  }),
  adminLogout: vi.fn().mockResolvedValue({
    success: true,
    message: '登出成功'
  }),
  changeAdminPassword: vi.fn().mockResolvedValue({
    success: true,
    message: '密碼修改成功'
  }),
  checkAdminStatus: vi.fn().mockResolvedValue({
    loggedIn: true,
    role: 'brand_admin',
    brand: { _id: 'brand-id', name: 'Test Brand' },
    store: null
  }),
  getCurrentAdminProfile: vi.fn(),
  updateCurrentAdminProfile: vi.fn(),
  validateAdminCredentials: vi.fn().mockResolvedValue(true),
  getAdminPermissions: vi.fn().mockResolvedValue(['read', 'write'])
}))

// 模擬驗證碼發送服務
vi.mock('@server/services/sms/smsService.js', () => ({
  sendVerificationCode: vi.fn().mockResolvedValue({ success: true, messageId: 'sms-123' })
}))

// 模擬 utils
vi.mock('@server/utils/date.js', () => ({
  getTaiwanDateTime: vi.fn().mockReturnValue(new Date()),
  formatDateTime: vi.fn().mockReturnValue('2024-09-01 12:00:00')
}))

vi.mock('@server/utils/validation.js', () => ({
  validateEmail: vi.fn().mockReturnValue(true),
  validatePhone: vi.fn().mockReturnValue(true),
  validatePassword: vi.fn().mockReturnValue(true)
}))

// 模擬認證中介軟體
vi.mock('@server/middlewares/auth/index.js', () => ({
  authenticate: vi.fn().mockImplementation((userType) => (req, res, next) => {
    // 模擬認證邏輯
    if (userType === 'user') {
      // 檢查是否有 Authorization header 或 session 中的 userId
      if (req.headers.authorization || req.session?.userId) {
        req.auth = { 
          userId: req.session?.userId || 'test-user-id', 
          type: 'user',
          brand: req.session?.brandId || 'test-brand-id' 
        }
        next()
      } else {
        res.status(401).json({ success: false, message: '請先登入' })
      }
    } else if (userType === 'admin') {
      // 檢查是否有 Authorization header 或 session 中的 adminId
      if (req.headers.authorization || req.session?.adminId) {
        req.auth = { 
          id: req.session?.adminId || 'test-admin-id', 
          type: 'admin',
          role: req.session?.adminRole || 'brand_admin',
          brand: req.session?.adminBrand || 'test-brand-id' 
        }
        next()
      } else {
        res.status(401).json({ success: false, message: '請先登入' })
      }
    } else {
      next()
    }
  }),
  adminAuth: vi.fn().mockImplementation((req, res, next) => {
    if (req.headers.authorization || req.session?.adminId) {
      req.auth = { 
        id: req.session?.adminId || 'test-admin-id', 
        type: 'admin',
        role: req.session?.adminRole || 'brand_admin',
        brand: req.session?.adminBrand || 'test-brand-id' 
      }
      next()
    } else {
      res.status(401).json({ success: false, message: '請先登入' })
    }
  }),
  userAuth: vi.fn().mockImplementation((req, res, next) => {
    if (req.headers.authorization || req.session?.userId) {
      req.auth = { 
        userId: req.session?.userId || 'test-user-id', 
        type: 'user',
        brand: req.session?.brandId || 'test-brand-id' 
      }
      next()
    } else {
      res.status(401).json({ success: false, message: '請先登入' })
    }
  })
}))

// 動態導入模組
let app
let userAuthRoutes
let adminAuthRoutes
let User
let Admin
let VerificationCode

describe('認證 API 整合測試', () => {
  beforeAll(async () => {
    // 動態導入路由和模型
    try {
      const { default: userAuthRoutesModule } = await import('@server/routes/userAuth.js')
      const { default: adminAuthRoutesModule } = await import('@server/routes/adminAuth.js')
      
      userAuthRoutes = userAuthRoutesModule
      adminAuthRoutes = adminAuthRoutesModule
      
      User = (await import('@server/models/User/User.js')).default
      Admin = (await import('@server/models/User/Admin.js')).default
      VerificationCode = (await import('@server/models/User/VerificationCode.js')).default
    } catch (error) {
      console.error('Failed to import modules:', error)
      throw error
    }

    // 設置 Express 應用
    app = express()
    app.use(cors())
    app.use(express.json({ limit: '50mb' }))
    app.use(express.urlencoded({ extended: true, limit: '50mb' }))
    
    // 設置 session
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }
    }))

    // 模擬 session 中介軟體
    app.use((req, res, next) => {
      if (!req.session) {
        req.session = {}
      }
      
      // 模擬已登入狀態（當有 Authorization header 時）
      if (req.headers.authorization) {
        req.session.userId = 'test-user-id'
        req.session.role = 'user'
        req.session.brandId = 'test-brand-id'
      }
      
      next()
    })

    // 使用認證路由
    app.use('/api/userAuth', userAuthRoutes)
    app.use('/api/adminAuth', adminAuthRoutes)

    // 全域錯誤處理
    app.use((error, req, res, next) => {
      console.error('Test error:', error)
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || '伺服器錯誤',
        stack: process.env.NODE_ENV === 'test' ? error.stack : undefined
      })
    })
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('用戶註冊流程', () => {
    const brandId = 'test-brand-id'
    const sendVerificationEndpoint = `/api/userAuth/brands/${brandId}/send-verification`
    const verifyCodeEndpoint = `/api/userAuth/brands/${brandId}/verify-code`
    const registerEndpoint = `/api/userAuth/brands/${brandId}/register`

    it('應該完成完整的註冊流程：發送驗證碼 → 驗證碼驗證 → 註冊', async () => {
      // Step 1: 發送驗證碼
      const phoneNumber = '0912345678'
      
      const sendCodeResponse = await request(app)
        .post(sendVerificationEndpoint)
        .send({ phone: phoneNumber })
        .expect(200)

      expect(sendCodeResponse.body.success).toBe(true)
      expect(sendCodeResponse.body.message).toBe('驗證碼已發送到您的手機')

      // Step 2: 驗證碼驗證
      VerificationCode.findOne.mockResolvedValue({
        _id: 'verification-id',
        phone: phoneNumber,
        code: '123456',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5分鐘後過期
        isUsed: false,
        createdAt: new Date()
      })

      const verifyResponse = await request(app)
        .post(verifyCodeEndpoint)
        .send({
          phone: phoneNumber,
          code: '123456'
        })
        .expect(200)

      expect(verifyResponse.body.success).toBe(true)
      expect(verifyResponse.body.message).toBe('驗證成功')

      // Step 3: 用戶註冊
      const mockUser = TestDataFactory.createUser({
        _id: 'new-user-id',
        name: '測試用戶',
        email: 'test@example.com',
        phone: phoneNumber,
        brand: brandId,
        isActive: true
      })

      // 設置 register service mock
      const userAuthService = await import('@server/services/user/userAuthService.js')
      userAuthService.register.mockResolvedValue(mockUser)

      const registerResponse = await request(app)
        .post(registerEndpoint)
        .send({
          name: '測試用戶',
          email: 'test@example.com',
          phone: phoneNumber,
          password: 'TestPassword123',
          code: '123456'
        })
        .expect(201)

      expect(registerResponse.body.success).toBe(true)
      expect(registerResponse.body.message).toBe('註冊成功')
      expect(registerResponse.body.user).toBeDefined()
      expect(registerResponse.body.user.phone).toBe(phoneNumber)

      // 驗證相關方法被調用
      expect(userAuthService.verifyPhoneCode).toHaveBeenCalledWith(phoneNumber, '123456', 'register')
      expect(userAuthService.register).toHaveBeenCalled()
    })

    it('應該處理重複手機號碼註冊', async () => {
      const phoneNumber = '0912345678'
      
      // 模擬驗證碼驗證成功
      const userAuthService = await import('@server/services/user/userAuthService.js')
      userAuthService.verifyPhoneCode.mockResolvedValue({ success: true, verified: true, phone: phoneNumber })
      
      // 模擬註冊時拋出重複手機號碼錯誤
      const { AppError } = await import('@server/middlewares/error.js')
      userAuthService.register.mockRejectedValue(new AppError('該手機號碼已被註冊，請使用其他號碼或前往登入', 400))

      const response = await request(app)
        .post(registerEndpoint)
        .send({
          name: '測試用戶',
          email: 'test@example.com',
          phone: phoneNumber,
          password: 'TestPassword123',
          code: '123456'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('該手機號碼已被註冊，請使用其他號碼或前往登入')
    })

    it('應該處理無效的驗證碼', async () => {
      // 模擬驗證碼驗證失敗
      const userAuthService = await import('@server/services/user/userAuthService.js')
      const { AppError } = await import('@server/middlewares/error.js')
      userAuthService.verifyPhoneCode.mockRejectedValue(new AppError('驗證碼錯誤或已過期，請重新獲取驗證碼', 400))

      const response = await request(app)
        .post(verifyCodeEndpoint)
        .send({
          phone: '0912345678',
          code: '999999'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('驗證碼錯誤或已過期，請重新獲取驗證碼')
    })
  })

  describe('用戶登入流程', () => {
    const brandId = 'test-brand-id'
    const loginEndpoint = `/api/userAuth/brands/${brandId}/login`
    const logoutEndpoint = `/api/userAuth/brands/${brandId}/logout`
    const checkStatusEndpoint = `/api/userAuth/brands/${brandId}/check-status`

    it('應該成功登入用戶', async () => {
      const mockUser = TestDataFactory.createUser({
        _id: 'user-login-id',
        email: 'test@example.com',
        phone: '0912345678',
        brand: brandId,
        isActive: true
      })

      const userAuthService = await import('@server/services/user/userAuthService.js')
      userAuthService.login.mockResolvedValue(mockUser)

      const response = await request(app)
        .post(loginEndpoint)
        .send({
          phone: '0912345678',
          password: 'TestPassword123'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('登入成功')
      expect(response.body.user).toBeDefined()
      expect(response.body.user.phone).toBe('0912345678')
    })

    it('應該處理錯誤的登入憑證', async () => {
      const userAuthService = await import('@server/services/user/userAuthService.js')
      const { AppError } = await import('@server/middlewares/error.js')
      userAuthService.login.mockRejectedValue(new AppError('手機號碼或密碼錯誤', 401))

      const response = await request(app)
        .post(loginEndpoint)
        .send({
          phone: '0912345678',
          password: 'WrongPassword'
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('手機號碼或密碼錯誤')
    })

    it('應該處理停用的用戶帳號', async () => {
      const userAuthService = await import('@server/services/user/userAuthService.js')
      const { AppError } = await import('@server/middlewares/error.js')
      userAuthService.login.mockRejectedValue(new AppError('此帳號已被停用，請聯繫客服', 403))

      const response = await request(app)
        .post(loginEndpoint)
        .send({
          phone: '0912345678',
          password: 'TestPassword123'
        })
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('此帳號已被停用，請聯繫客服')
    })

    it('應該檢查用戶登入狀態', async () => {
      // 模擬已登入用戶
      const mockUser = TestDataFactory.createUser({ _id: 'status-check-user' })
      User.findById.mockResolvedValue(mockUser)

      // 需要在測試中模擬 session
      const agent = request.agent(app)
      
      // 先模擬登入狀態
      const response = await agent
        .get(checkStatusEndpoint)
        .expect(200)

      expect(response.body.success).toBe(true)
    })
  })

  describe('管理員認證流程', () => {
    const loginEndpoint = '/api/adminAuth/login'
    const logoutEndpoint = '/api/adminAuth/logout'
    const checkStatusEndpoint = '/api/adminAuth/check-status'
    const changePasswordEndpoint = '/api/adminAuth/change-password'

    it('應該成功登入管理員', async () => {
      const mockAdmin = {
        role: 'brand_admin',
        brand: { _id: 'brand-id', name: 'Test Brand' },
        store: null
      }

      const adminAuthService = await import('@server/services/user/adminAuthService.js')
      adminAuthService.adminLogin.mockResolvedValue(mockAdmin)

      const response = await request(app)
        .post(loginEndpoint)
        .send({
          name: 'testadmin',
          password: 'AdminPassword123'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('登入成功')
      expect(response.body.role).toBe('brand_admin')
      expect(response.body.brand).toBeDefined()
      expect(response.body.brand.name).toBe('Test Brand')
    })

    it('應該處理錯誤的管理員憑證', async () => {
      const adminAuthService = await import('@server/services/user/adminAuthService.js')
      const { AppError } = await import('@server/middlewares/error.js')
      adminAuthService.adminLogin.mockRejectedValue(new AppError('用戶名或密碼錯誤', 401))

      const response = await request(app)
        .post(loginEndpoint)
        .send({
          name: 'wrongadmin',
          password: 'WrongPassword'
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('用戶名或密碼錯誤')
    })

    it('應該處理停用的管理員帳號', async () => {
      const adminAuthService = await import('@server/services/user/adminAuthService.js')
      const { AppError } = await import('@server/middlewares/error.js')
      adminAuthService.adminLogin.mockRejectedValue(new AppError('此帳號已被停用', 403))

      const response = await request(app)
        .post(loginEndpoint)
        .send({
          name: 'inactiveadmin',
          password: 'AdminPassword123'
        })
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('此帳號已被停用')
    })

    it('應該檢查管理員登入狀態', async () => {
      const response = await request(app)
        .get(checkStatusEndpoint)
        .expect(200)

      expect(response.body.success).toBe(true)
    })
  })

  describe('密碼管理', () => {
    const brandId = 'test-brand-id'
    const forgotPasswordEndpoint = `/api/userAuth/brands/${brandId}/forgot-password`
    const resetPasswordEndpoint = `/api/userAuth/brands/${brandId}/reset-password`
    const changePasswordEndpoint = `/api/userAuth/brands/${brandId}/change-password`

    it('應該處理忘記密碼請求', async () => {
      const userAuthService = await import('@server/services/user/userAuthService.js')
      userAuthService.forgotPassword.mockResolvedValue({
        success: true,
        message: '重設密碼驗證碼已發送至您的手機',
        expiresIn: 300
      })

      const response = await request(app)
        .post(forgotPasswordEndpoint)
        .send({
          phone: '0912345678'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('重設密碼驗證碼已發送至您的手機')
    })

    it('應該處理重設密碼', async () => {
      const userAuthService = await import('@server/services/user/userAuthService.js')
      userAuthService.resetPassword.mockResolvedValue({
        success: true,
        message: '密碼已成功重設，請使用新密碼登入'
      })

      const response = await request(app)
        .post(resetPasswordEndpoint)
        .send({
          phone: '0912345678',
          code: '123456',
          newPassword: 'NewPassword123'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('密碼重設成功，請使用新密碼登入')
    })

    it('應該處理過期的重設密碼驗證碼', async () => {
      const userAuthService = await import('@server/services/user/userAuthService.js')
      const { AppError } = await import('@server/middlewares/error.js')
      userAuthService.resetPassword.mockRejectedValue(new AppError('驗證碼錯誤或已過期，請重新獲取驗證碼', 400))

      const response = await request(app)
        .post(resetPasswordEndpoint)
        .send({
          phone: '0912345678',
          code: 'expired-code',
          newPassword: 'NewPassword123'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('驗證碼錯誤或已過期，請重新獲取驗證碼')
    })
  })

  describe('權限檢查和認證中介軟體', () => {
    it('應該拒絕未認證的請求', async () => {
      const protectedEndpoint = `/api/userAuth/brands/test-brand/change-password`
      
      const response = await request(app)
        .post(protectedEndpoint)
        .send({
          currentPassword: 'OldPassword123',
          newPassword: 'NewPassword123'
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('請先登入')
    })

    it('應該拒絕無效會話的請求', async () => {
      const protectedEndpoint = `/api/adminAuth/logout`
      
      const response = await request(app)
        .post(protectedEndpoint)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('請先登入')
    })
  })

  describe('會話管理', () => {
    it('應該正確管理用戶登入和登出', async () => {
      const brandId = 'session-test-brand'
      const mockUser = TestDataFactory.createUser({
        _id: 'session-user-id',
        phone: '0912345678',
        brand: brandId,
        isActive: true
      })

      const userAuthService = await import('@server/services/user/userAuthService.js')

      // 1. 測試登入
      userAuthService.login.mockResolvedValue(mockUser)
      const loginResponse = await request(app)
        .post(`/api/userAuth/brands/${brandId}/login`)
        .send({
          phone: '0912345678',
          password: 'TestPassword123'
        })
        .expect(200)

      expect(loginResponse.body.success).toBe(true)

      // 2. 測試登入狀態檢查
      userAuthService.checkUserStatus.mockResolvedValue({
        loggedIn: true,
        role: 'user',
        brandId: brandId
      })
      
      const statusResponse = await request(app)
        .get(`/api/userAuth/brands/${brandId}/check-status`)
        .expect(200)

      expect(statusResponse.body.success).toBe(true)
      expect(statusResponse.body.loggedIn).toBe(true)

      // 3. 測試登出（模擬已認證狀態）
      userAuthService.logout.mockResolvedValue({ success: true, message: '登出成功' })
      
      const logoutResponse = await request(app)
        .post(`/api/userAuth/brands/${brandId}/logout`)
        .set('Authorization', 'Bearer test-token') // 觸發認證中介軟體
        .expect(200)

      expect(logoutResponse.body.success).toBe(true)
      expect(logoutResponse.body.message).toBe('登出成功')
      
      // 驗證服務方法被正確調用
      expect(userAuthService.login).toHaveBeenCalled()
      expect(userAuthService.checkUserStatus).toHaveBeenCalled()
      expect(userAuthService.logout).toHaveBeenCalled()
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  afterAll(() => {
    vi.restoreAllMocks()
  })
})