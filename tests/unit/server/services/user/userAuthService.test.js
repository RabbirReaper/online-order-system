import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TestDataFactory, TestHelpers } from '../../../../setup.js'
import * as userAuthService from '@server/services/user/userAuthService.js'
import User from '@server/models/User/User.js'
import VerificationCode from '@server/models/User/VerificationCode.js'
import bcrypt from 'bcrypt'

// Mock 外部依賴
vi.mock('@server/models/User/User.js')
vi.mock('@server/models/User/VerificationCode.js')
vi.mock('bcrypt')

describe('UserAuthService', () => {
  let mockUser
  let mockVerificationCode

  beforeEach(() => {
    // 重置所有 mock
    vi.clearAllMocks()

    // 設置基本的 User model mock
    mockUser = {
      findOne: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      populate: vi.fn(),
    }
    User.mockReturnValue(mockUser)
    Object.assign(User, mockUser)

    // 設置基本的 VerificationCode model mock
    mockVerificationCode = {
      findOne: vi.fn(),
      create: vi.fn(),
      findOneAndDelete: vi.fn(),
    }
    VerificationCode.mockReturnValue(mockVerificationCode)
    Object.assign(VerificationCode, mockVerificationCode)

    // 設置 bcrypt mock
    bcrypt.genSalt.mockResolvedValue('salt')
    bcrypt.hash.mockResolvedValue('hashed_password')
    bcrypt.compare.mockResolvedValue(true)
  })

  describe('validateField', () => {
    it('should validate phone number correctly', async () => {
      const validPhone = '0912345678'
      const invalidPhone = '123456'

      const validResult = await userAuthService.validateField('phone', validPhone, true)
      expect(validResult.isValid).toBe(true)
      expect(validResult.error).toBeNull()

      const invalidResult = await userAuthService.validateField('phone', invalidPhone, true)
      expect(invalidResult.isValid).toBe(false)
      expect(invalidResult.error).toContain('手機號碼格式不正確')
    })

    it('should validate email correctly', async () => {
      const validEmail = 'test@example.com'
      const invalidEmail = 'invalid-email'

      const validResult = await userAuthService.validateField('email', validEmail, true)
      expect(validResult.isValid).toBe(true)
      expect(validResult.error).toBeNull()

      const invalidResult = await userAuthService.validateField('email', invalidEmail, true)
      expect(invalidResult.isValid).toBe(false)
      expect(invalidResult.error).toContain('信箱格式不正確')
    })

    it('should validate password length', async () => {
      const validPassword = 'password123'
      const shortPassword = '123'

      const validResult = await userAuthService.validateField('password', validPassword, true)
      expect(validResult.isValid).toBe(true)

      const invalidResult = await userAuthService.validateField('password', shortPassword, true)
      expect(invalidResult.isValid).toBe(false)
      expect(invalidResult.error).toContain('至少8個字符')
    })

    it('should handle required fields', async () => {
      const emptyResult = await userAuthService.validateField('name', '', true)
      expect(emptyResult.isValid).toBe(false)
      expect(emptyResult.error).toContain('必填')

      const optionalResult = await userAuthService.validateField('name', '', false)
      expect(optionalResult.isValid).toBe(true)
    })
  })

  describe('registerUser', () => {
    const validUserData = {
      name: '測試用戶',
      phone: '0912345678',
      email: 'test@example.com',
      password: 'password123',
      verificationCode: '1234',
    }

    it('should register user successfully with valid data', async () => {
      // Mock 驗證碼檢查成功
      VerificationCode.findOne.mockResolvedValue({
        code: '1234',
        expiresAt: new Date(Date.now() + 10000),
      })
      VerificationCode.findOneAndDelete.mockResolvedValue(true)

      // Mock 用戶不存在
      User.findOne.mockResolvedValue(null)

      // Mock 用戶創建成功
      const createdUser = TestDataFactory.createUser({
        ...validUserData,
        password: 'hashed_password',
      })
      User.create.mockResolvedValue(createdUser)

      const result = await userAuthService.registerUser(validUserData)

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user.name).toBe(validUserData.name)
      expect(bcrypt.hash).toHaveBeenCalledWith(validUserData.password, 'salt')
    })

    it('should fail when user already exists', async () => {
      // Mock 驗證碼檢查成功
      VerificationCode.findOne.mockResolvedValue({
        code: '1234',
        expiresAt: new Date(Date.now() + 10000),
      })

      // Mock 用戶已存在
      const existingUser = TestDataFactory.createUser()
      User.findOne.mockResolvedValue(existingUser)

      await expect(userAuthService.registerUser(validUserData)).rejects.toThrow('用戶已存在')
    })

    it('should fail with invalid verification code', async () => {
      // Mock 驗證碼不存在
      VerificationCode.findOne.mockResolvedValue(null)

      await expect(userAuthService.registerUser(validUserData)).rejects.toThrow(
        '驗證碼無效或已過期',
      )
    })

    it('should fail with expired verification code', async () => {
      // Mock 過期的驗證碼
      VerificationCode.findOne.mockResolvedValue({
        code: '1234',
        expiresAt: new Date(Date.now() - 10000), // 已過期
      })

      await expect(userAuthService.registerUser(validUserData)).rejects.toThrow(
        '驗證碼無效或已過期',
      )
    })

    it('should fail with invalid input data', async () => {
      const invalidUserData = {
        name: '', // 空名稱
        phone: '123', // 無效手機
        email: 'invalid', // 無效信箱
        password: '123', // 密碼太短
        verificationCode: '1234',
      }

      await expect(userAuthService.registerUser(invalidUserData)).rejects.toThrow(
        '輸入資料驗證失敗',
      )
    })
  })

  describe('loginUser', () => {
    const loginData = {
      identifier: '0912345678', // 可以是手機或信箱
      password: 'password123',
    }

    it('should login successfully with correct credentials', async () => {
      const mockUser = TestDataFactory.createUser({
        phone: '0912345678',
        password: 'hashed_password',
      })

      User.findOne.mockResolvedValue(mockUser)
      bcrypt.compare.mockResolvedValue(true)

      const result = await userAuthService.loginUser(loginData)

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user._id).toBe(mockUser._id)
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUser.password)
    })

    it('should fail with incorrect password', async () => {
      const mockUser = TestDataFactory.createUser()
      User.findOne.mockResolvedValue(mockUser)
      bcrypt.compare.mockResolvedValue(false)

      await expect(userAuthService.loginUser(loginData)).rejects.toThrow('用戶名或密碼錯誤')
    })

    it('should fail when user not found', async () => {
      User.findOne.mockResolvedValue(null)

      await expect(userAuthService.loginUser(loginData)).rejects.toThrow('用戶名或密碼錯誤')
    })

    it('should fail with inactive user', async () => {
      const mockUser = TestDataFactory.createUser({
        status: 'inactive',
      })
      User.findOne.mockResolvedValue(mockUser)
      bcrypt.compare.mockResolvedValue(true)

      await expect(userAuthService.loginUser(loginData)).rejects.toThrow('用戶帳號已被停用')
    })
  })

  describe('changePassword', () => {
    const changePasswordData = {
      userId: '507f1f77bcf86cd799439011',
      currentPassword: 'oldpassword',
      newPassword: 'newpassword123',
    }

    it('should change password successfully', async () => {
      const mockUser = TestDataFactory.createUser({
        password: 'old_hashed_password',
      })

      User.findById.mockResolvedValue(mockUser)
      bcrypt.compare.mockResolvedValue(true)
      bcrypt.hash.mockResolvedValue('new_hashed_password')
      mockUser.save = vi.fn().mockResolvedValue(mockUser)

      const result = await userAuthService.changePassword(changePasswordData)

      expect(result.success).toBe(true)
      expect(bcrypt.compare).toHaveBeenCalledWith(
        changePasswordData.currentPassword,
        mockUser.password,
      )
      expect(bcrypt.hash).toHaveBeenCalledWith(changePasswordData.newPassword, 'salt')
      expect(mockUser.save).toHaveBeenCalled()
    })

    it('should fail with incorrect current password', async () => {
      const mockUser = TestDataFactory.createUser()
      User.findById.mockResolvedValue(mockUser)
      bcrypt.compare.mockResolvedValue(false)

      await expect(userAuthService.changePassword(changePasswordData)).rejects.toThrow(
        '當前密碼錯誤',
      )
    })

    it('should fail when user not found', async () => {
      User.findById.mockResolvedValue(null)

      await expect(userAuthService.changePassword(changePasswordData)).rejects.toThrow('用戶不存在')
    })
  })

  describe('sendVerificationCode', () => {
    const phoneNumber = '0912345678'

    it('should send verification code successfully', async () => {
      // Mock 驗證碼創建
      const mockVerificationCode = {
        phone: phoneNumber,
        code: '1234',
        expiresAt: new Date(Date.now() + 300000), // 5分鐘後過期
      }
      VerificationCode.create.mockResolvedValue(mockVerificationCode)

      const result = await userAuthService.sendVerificationCode(phoneNumber)

      expect(result.success).toBe(true)
      expect(result.message).toContain('驗證碼已發送')
      expect(VerificationCode.create).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: phoneNumber,
          code: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      )
    })

    it('should fail with invalid phone number', async () => {
      const invalidPhone = '123456'

      await expect(userAuthService.sendVerificationCode(invalidPhone)).rejects.toThrow(
        '手機號碼格式不正確',
      )
    })
  })

  describe('getUserProfile', () => {
    const userId = '507f1f77bcf86cd799439011'

    it('should get user profile successfully', async () => {
      const mockUser = TestDataFactory.createUser()
      User.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser),
      })

      const result = await userAuthService.getUserProfile(userId)

      expect(result).toBeDefined()
      expect(result._id).toBe(mockUser._id)
      expect(User.findById).toHaveBeenCalledWith(userId)
    })

    it('should fail when user not found', async () => {
      User.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue(null),
      })

      await expect(userAuthService.getUserProfile(userId)).rejects.toThrow('用戶不存在')
    })
  })
})
