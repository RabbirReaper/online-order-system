import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TestDataFactory, TestHelpers } from '../../../../setup.js'

// Mock userAuthService
vi.mock('@server/services/user/index.js', () => ({
  verifyPhoneCode: vi.fn(),
  register: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  sendPhoneVerification: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  changePassword: vi.fn(),
  checkUserStatus: vi.fn()
}))

// Mock asyncHandler
vi.mock('@server/middlewares/error.js', () => ({
  asyncHandler: vi.fn((fn) => fn)
}))

// 動態導入控制器
const userAuthController = await import('@server/controllers/User/userAuth.js')
const userAuthService = await import('@server/services/user/index.js')

describe('UserAuth Controller', () => {
  let req, res, next

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock Express request object
    req = {
      params: {
        brandId: 'brand123'
      },
      query: {},
      body: {},
      auth: {
        userId: 'user123'
      },
      session: {
        userId: 'user123',
        brandId: 'brand123'
      }
    }

    // Mock Express response object
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      clearCookie: vi.fn().mockReturnThis()
    }

    next = vi.fn()
  })

  describe('register', () => {
    it('應該成功註冊用戶並返回正確格式', async () => {
      // Arrange
      const userData = TestDataFactory.createUser()
      const verificationData = {
        phone: '0912345678',
        code: '123456'
      }
      req.body = { ...userData, ...verificationData }

      const mockUser = {
        _id: 'user123',
        ...userData,
        brand: 'brand123'
      }

      userAuthService.register.mockResolvedValue(mockUser)

      // Act
      await userAuthController.register(req, res)

      // Assert
      // Controller 將驗證碼傳遞給 service，驗證在 service 層進行
      const expectedUserData = {
        ...userData,
        phone: '0912345678',
        brand: 'brand123'
      }
      expect(userAuthService.register).toHaveBeenCalledWith(expectedUserData, '123456')

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '註冊成功',
        user: mockUser
      })
    })

    it('應該正確處理驗證碼驗證失敗', async () => {
      // Arrange
      const userData = TestDataFactory.createUser()
      req.body = { ...userData, phone: '0912345678', code: '000000' }

      const error = new Error('驗證碼錯誤')
      // 驗證在 service 層進行，所以 register service 會拋出錯誤
      userAuthService.register.mockRejectedValue(error)

      // Act & Assert
      await expect(userAuthController.register(req, res)).rejects.toThrow('驗證碼錯誤')
      expect(userAuthService.register).toHaveBeenCalled()
    })
  })

  describe('login', () => {
    it('應該成功登入用戶並返回正確格式', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      }
      req.body = loginData

      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        brand: 'brand123'
      }

      userAuthService.login.mockResolvedValue(mockUser)

      // Act
      await userAuthController.login(req, res)

      // Assert
      const expectedCredentials = {
        ...loginData,
        brand: 'brand123'
      }
      expect(userAuthService.login).toHaveBeenCalledWith(expectedCredentials, req.session)

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '登入成功',
        user: mockUser
      })
    })

    it('應該處理登入失敗情況', async () => {
      // Arrange
      req.body = {
        email: 'wrong@example.com',
        password: 'wrongpassword'
      }

      const error = new Error('登入失敗')
      userAuthService.login.mockRejectedValue(error)

      // Act & Assert
      await expect(userAuthController.login(req, res)).rejects.toThrow('登入失敗')
    })
  })

  describe('logout', () => {
    it('應該成功登出並清除 cookie', async () => {
      // Arrange
      userAuthService.logout.mockResolvedValue(true)

      // Act
      await userAuthController.logout(req, res)

      // Assert
      expect(userAuthService.logout).toHaveBeenCalledWith(req.session)
      expect(res.clearCookie).toHaveBeenCalledWith('connect.sid')
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '登出成功'
      })
    })
  })

  describe('sendVerificationCode', () => {
    it('應該成功發送驗證碼', async () => {
      // Arrange
      req.body = {
        phone: '0912345678',
        purpose: 'register'
      }

      const mockResult = {
        success: true,
        message: '驗證碼已發送',
        expiresIn: 300
      }

      userAuthService.sendPhoneVerification.mockResolvedValue(mockResult)

      // Act
      await userAuthController.sendVerificationCode(req, res)

      // Assert
      expect(userAuthService.sendPhoneVerification).toHaveBeenCalledWith('0912345678', 'brand123', 'register')
      expect(res.json).toHaveBeenCalledWith(mockResult)
    })

    it('應該使用預設 purpose 為 register', async () => {
      // Arrange
      req.body = {
        phone: '0912345678'
        // 沒有提供 purpose
      }

      const mockResult = { success: true }
      userAuthService.sendPhoneVerification.mockResolvedValue(mockResult)

      // Act
      await userAuthController.sendVerificationCode(req, res)

      // Assert
      expect(userAuthService.sendPhoneVerification).toHaveBeenCalledWith('0912345678', 'brand123', 'register')
    })
  })

  describe('verifyCode', () => {
    it('應該成功驗證驗證碼', async () => {
      // Arrange
      req.body = {
        phone: '0912345678',
        code: '123456',
        purpose: 'register'
      }

      const mockResult = { verified: true }
      userAuthService.verifyPhoneCode.mockResolvedValue(mockResult)

      // Act
      await userAuthController.verifyCode(req, res)

      // Assert
      expect(userAuthService.verifyPhoneCode).toHaveBeenCalledWith('0912345678', '123456', 'register')
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '驗證成功',
        verified: true
      })
    })

    it('應該使用預設 purpose 為 register', async () => {
      // Arrange
      req.body = {
        phone: '0912345678',
        code: '123456'
        // 沒有提供 purpose
      }

      const mockResult = { verified: true }
      userAuthService.verifyPhoneCode.mockResolvedValue(mockResult)

      // Act
      await userAuthController.verifyCode(req, res)

      // Assert
      expect(userAuthService.verifyPhoneCode).toHaveBeenCalledWith('0912345678', '123456', 'register')
    })
  })

  describe('forgotPassword', () => {
    it('應該成功發送重設密碼驗證碼', async () => {
      // Arrange
      req.body = {
        phone: '0912345678'
      }

      const mockResult = {
        success: true,
        expiresIn: 600
      }

      userAuthService.forgotPassword.mockResolvedValue(mockResult)

      // Act
      await userAuthController.forgotPassword(req, res)

      // Assert
      expect(userAuthService.forgotPassword).toHaveBeenCalledWith('0912345678', 'brand123')
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '重設密碼驗證碼已發送至您的手機',
        expiresIn: 600
      })
    })
  })

  describe('resetPassword', () => {
    it('應該成功重設密碼', async () => {
      // Arrange
      req.body = {
        phone: '0912345678',
        code: '123456',
        newPassword: 'newpassword123'
      }

      const mockResult = { success: true }
      userAuthService.resetPassword.mockResolvedValue(mockResult)

      // Act
      await userAuthController.resetPassword(req, res)

      // Assert
      expect(userAuthService.resetPassword).toHaveBeenCalledWith(
        '0912345678',
        '123456',
        'newpassword123',
        'brand123'
      )
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '密碼重設成功，請使用新密碼登入'
      })
    })
  })

  describe('changePassword', () => {
    it('應該成功修改密碼', async () => {
      // Arrange
      req.body = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123'
      }

      const mockResult = { success: true }
      userAuthService.changePassword.mockResolvedValue(mockResult)

      // Act
      await userAuthController.changePassword(req, res)

      // Assert
      expect(userAuthService.changePassword).toHaveBeenCalledWith(
        'user123',
        'oldpassword',
        'newpassword123'
      )
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '密碼修改成功'
      })
    })

    it('應該處理未認證用戶的情況', async () => {
      // Arrange
      req.auth = null
      req.body = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123'
      }

      // Act & Assert - 應該拋出錯誤因為沒有 userId
      await expect(userAuthController.changePassword(req, res)).rejects.toThrow()
    })
  })

  describe('checkUserStatus', () => {
    it('應該成功檢查用戶登入狀態', async () => {
      // Arrange
      const mockStatus = {
        isLoggedIn: true,
        user: {
          _id: 'user123',
          name: 'Test User',
          email: 'test@example.com'
        },
        brandId: 'brand123'
      }

      userAuthService.checkUserStatus.mockResolvedValue(mockStatus)

      // Act
      await userAuthController.checkUserStatus(req, res)

      // Assert
      expect(userAuthService.checkUserStatus).toHaveBeenCalledWith(req.session)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        ...mockStatus
      })
    })

    it('應該處理未登入狀態', async () => {
      // Arrange
      const mockStatus = {
        isLoggedIn: false,
        user: null,
        brandId: null
      }

      userAuthService.checkUserStatus.mockResolvedValue(mockStatus)

      // Act
      await userAuthController.checkUserStatus(req, res)

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        isLoggedIn: false,
        user: null,
        brandId: null
      })
    })
  })

  describe('參數驗證', () => {
    it('register - 應該正確提取 brandId 從路由參數', async () => {
      // Arrange
      req.params.brandId = 'custom-brand'
      req.body = {
        ...TestDataFactory.createUser(),
        phone: '0912345678',
        code: '123456'
      }

      userAuthService.register.mockResolvedValue({})

      // Act
      await userAuthController.register(req, res)

      // Assert
      // register 接收兩個參數：userWithBrand 和 code
      expect(userAuthService.register).toHaveBeenCalledWith(
        expect.objectContaining({
          brand: 'custom-brand'
        }),
        '123456'
      )
    })

    it('login - 應該正確提取 brandId 從路由參數', async () => {
      // Arrange
      req.params.brandId = 'custom-brand'
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      }

      userAuthService.login.mockResolvedValue({})

      // Act
      await userAuthController.login(req, res)

      // Assert
      expect(userAuthService.login).toHaveBeenCalledWith(
        expect.objectContaining({
          brand: 'custom-brand'
        }),
        req.session
      )
    })
  })

  describe('錯誤處理', () => {
    it('register - 應該正確傳播服務層錯誤', async () => {
      // Arrange
      req.body = {
        ...TestDataFactory.createUser(),
        phone: '0912345678',
        code: '123456'
      }

      userAuthService.verifyPhoneCode.mockResolvedValue({ verified: true })
      
      const serviceError = new Error('註冊失敗')
      userAuthService.register.mockRejectedValue(serviceError)

      // Act & Assert
      await expect(userAuthController.register(req, res)).rejects.toThrow('註冊失敗')
    })

    it('sendVerificationCode - 應該正確傳播服務層錯誤', async () => {
      // Arrange
      req.body = { phone: '0912345678' }
      
      const serviceError = new Error('發送驗證碼失敗')
      userAuthService.sendPhoneVerification.mockRejectedValue(serviceError)

      // Act & Assert
      await expect(userAuthController.sendVerificationCode(req, res)).rejects.toThrow('發送驗證碼失敗')
    })
  })
})