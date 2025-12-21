import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TestDataFactory } from '../../../../setup.js'

// 設定 mocks
vi.mock('@server/models/User/User.js', () => ({ 
  default: {
    findOne: vi.fn(),
    findById: vi.fn()
  }
}))

vi.mock('@server/models/User/VerificationCode.js', () => ({ 
  default: {
    create: vi.fn(),
    findOne: vi.fn()
  }
}))

vi.mock('@server/middlewares/error.js', () => ({
  AppError: vi.fn().mockImplementation((message, code) => {
    const error = new Error(message)
    error.statusCode = code
    error.name = 'AppError'
    return error
  })
}))

vi.mock('bcrypt', () => ({
  genSalt: vi.fn().mockResolvedValue('salt'),
  hash: vi.fn().mockResolvedValue('hashed_password'),
  compare: vi.fn().mockResolvedValue(true)
}))

// Mock SMS service
vi.mock('@server/services/sms/kotsmsService.js', () => ({
  sendSMS: vi.fn().mockResolvedValue({ success: true })
}))

// 動態導入
const User = (await import('@server/models/User/User.js')).default
const VerificationCode = (await import('@server/models/User/VerificationCode.js')).default
const bcrypt = await import('bcrypt')

// 動態導入服務
const userAuthService = await import('@server/services/user/userAuthService.js')

describe('UserAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('login - Brand Isolation', () => {
    it('should login successfully with correct phone, password and brand', async () => {
      const mockUserData = {
        _id: 'user-123',
        phone: '0912345678',
        brand: 'brand-123',
        password: 'hashed_password',
        name: 'Test User',
        isActive: true
      }

      const mockUser = {
        ...mockUserData,
        comparePassword: vi.fn().mockResolvedValue(true),
        toObject: vi.fn().mockReturnValue(mockUserData)
      }

      User.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser)
      })

      const credentials = {
        phone: '0912345678',
        password: 'password123',
        brand: 'brand-123'
      }

      const mockSession = { cookie: { maxAge: null } }
      const result = await userAuthService.login(credentials, mockSession)

      expect(User.findOne).toHaveBeenCalledWith({
        phone: '0912345678',
        brand: 'brand-123'
      })
      expect(result).toHaveProperty('_id', 'user-123')
      expect(mockSession.userId).toBe('user-123')
      expect(mockSession.brandId).toBe('brand-123')
    })

    it.skip('should fail login when phone exists but brand is different', async () => {
      // 模擬該手機在 brand-123 存在，但在 brand-456 不存在
      User.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(null) // brand 不匹配，找不到用戶
      })

      const credentials = {
        phone: '0912345678',
        password: 'password123',
        brand: 'brand-456' // 不同的品牌
      }

      const mockSession = { cookie: { maxAge: null } }

      await expect(userAuthService.login(credentials, mockSession))
        .rejects.toThrow('手機號碼或密碼錯誤')

      expect(User.findOne).toHaveBeenCalledWith({
        phone: '0912345678',
        brand: 'brand-456'
      })
    })

    it('should allow same phone number to exist in different brands', async () => {
      const mockUserData1 = {
        _id: 'user-brand1',
        phone: '0912345678',
        brand: 'brand-111',
        name: 'User 1',
        isActive: true
      }

      const mockUserData2 = {
        _id: 'user-brand2',
        phone: '0912345678',
        brand: 'brand-222',
        name: 'User 2',
        isActive: true
      }

      const mockUserBrand1 = {
        ...mockUserData1,
        comparePassword: vi.fn().mockResolvedValue(true),
        toObject: vi.fn().mockReturnValue(mockUserData1)
      }

      const mockUserBrand2 = {
        ...mockUserData2,
        comparePassword: vi.fn().mockResolvedValue(true),
        toObject: vi.fn().mockReturnValue(mockUserData2)
      }

      // 第一次登入 brand-111
      User.findOne.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue(mockUserBrand1)
      })

      const credentials1 = {
        phone: '0912345678',
        password: 'password123',
        brand: 'brand-111'
      }

      const session1 = { cookie: { maxAge: null } }
      const result1 = await userAuthService.login(credentials1, session1)

      expect(result1._id).toBe('user-brand1')
      expect(session1.brandId).toBe('brand-111')

      // 第二次登入 brand-222
      User.findOne.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue(mockUserBrand2)
      })

      const credentials2 = {
        phone: '0912345678',
        password: 'password123',
        brand: 'brand-222'
      }

      const session2 = { cookie: { maxAge: null } }
      const result2 = await userAuthService.login(credentials2, session2)

      expect(result2._id).toBe('user-brand2')
      expect(session2.brandId).toBe('brand-222')

      // 驗證兩次調用使用不同的 brand
      expect(User.findOne).toHaveBeenNthCalledWith(1, {
        phone: '0912345678',
        brand: 'brand-111'
      })
      expect(User.findOne).toHaveBeenNthCalledWith(2, {
        phone: '0912345678',
        brand: 'brand-222'
      })
    })

    it.skip('should throw error when brand is missing', async () => {
      const credentials = {
        phone: '0912345678',
        password: 'password123'
        // 缺少 brand
      }

      const mockSession = { cookie: { maxAge: null } }

      await expect(userAuthService.login(credentials, mockSession))
        .rejects.toThrow('請提供完整的登入資訊')
    })
  })

  describe('register - Brand Isolation', () => {
    it.skip('should register successfully when phone is unique within brand', async () => {
      const userData = {
        phone: '0912345678',
        password: 'password123',
        name: 'Test User',
        email: 'test@example.com',
        brand: 'brand-123',
        verificationCode: '123456'
      }

      // Mock 驗證碼檢查通過
      VerificationCode.findOne.mockResolvedValue({
        phone: '0912345678',
        code: '123456',
        expiresAt: new Date(Date.now() + 10000),
        isUsed: false
      })

      // Mock 同品牌內手機號碼不存在
      User.findOne.mockResolvedValueOnce(null) // phone check
      User.findOne.mockResolvedValueOnce(null) // email check

      // Mock User constructor
      const mockSave = vi.fn().mockResolvedValue()
      const mockToObject = vi.fn().mockReturnValue({ _id: 'new-user-id' })
      const UserConstructor = vi.fn().mockImplementation(() => ({
        save: mockSave,
        toObject: mockToObject
      }))
      User.mockImplementation(UserConstructor)

      const result = await userAuthService.register(userData)

      // 驗證手機檢查包含 brand
      expect(User.findOne).toHaveBeenCalledWith({
        phone: '0912345678',
        brand: 'brand-123'
      })

      // 驗證 email 檢查包含 brand
      expect(User.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
        brand: 'brand-123'
      })
    })

    it.skip('should allow same phone to register in different brands', async () => {
      const userDataBrand1 = {
        phone: '0912345678',
        password: 'password123',
        name: 'User Brand 1',
        brand: 'brand-111',
        verificationCode: '123456'
      }

      const userDataBrand2 = {
        phone: '0912345678',
        password: 'password456',
        name: 'User Brand 2',
        brand: 'brand-222',
        verificationCode: '654321'
      }

      // 第一次註冊 brand-111
      VerificationCode.findOne.mockResolvedValueOnce({
        phone: '0912345678',
        code: '123456',
        expiresAt: new Date(Date.now() + 10000),
        isUsed: false
      })

      User.findOne.mockResolvedValueOnce(null) // phone check for brand-111

      const result1 = await userAuthService.register(userDataBrand1)

      expect(User.findOne).toHaveBeenCalledWith({
        phone: '0912345678',
        brand: 'brand-111'
      })

      // 第二次註冊 brand-222
      VerificationCode.findOne.mockResolvedValueOnce({
        phone: '0912345678',
        code: '654321',
        expiresAt: new Date(Date.now() + 10000),
        isUsed: false
      })

      User.findOne.mockResolvedValueOnce(null) // phone check for brand-222

      const result2 = await userAuthService.register(userDataBrand2)

      expect(User.findOne).toHaveBeenCalledWith({
        phone: '0912345678',
        brand: 'brand-222'
      })
    })

    it.skip('should reject registration when phone exists in same brand', async () => {
      const userData = {
        phone: '0912345678',
        password: 'password123',
        name: 'Test User',
        brand: 'brand-123',
        verificationCode: '123456'
      }

      // Mock 驗證碼檢查通過
      VerificationCode.findOne.mockResolvedValue({
        phone: '0912345678',
        code: '123456',
        expiresAt: new Date(Date.now() + 10000),
        isUsed: false
      })

      // Mock 同品牌內手機號碼已存在
      User.findOne.mockResolvedValue(
        TestDataFactory.createUser({
          phone: '0912345678',
          brand: 'brand-123'
        })
      )

      await expect(userAuthService.register(userData))
        .rejects.toThrow('此手機號碼已被註冊')

      expect(User.findOne).toHaveBeenCalledWith({
        phone: '0912345678',
        brand: 'brand-123'
      })
    })

    it.skip('should allow same email to register in different brands', async () => {
      const userDataBrand1 = {
        phone: '0911111111',
        email: 'same@example.com',
        password: 'password123',
        name: 'User Brand 1',
        brand: 'brand-111',
        verificationCode: '123456'
      }

      const userDataBrand2 = {
        phone: '0922222222',
        email: 'same@example.com',
        password: 'password456',
        name: 'User Brand 2',
        brand: 'brand-222',
        verificationCode: '654321'
      }

      // 第一次註冊 brand-111
      VerificationCode.findOne.mockResolvedValueOnce({
        phone: '0911111111',
        code: '123456',
        expiresAt: new Date(Date.now() + 10000),
        isUsed: false
      })

      User.findOne.mockResolvedValueOnce(null) // phone check
      User.findOne.mockResolvedValueOnce(null) // email check for brand-111

      await userAuthService.register(userDataBrand1)

      expect(User.findOne).toHaveBeenCalledWith({
        email: 'same@example.com',
        brand: 'brand-111'
      })

      // 第二次註冊 brand-222
      VerificationCode.findOne.mockResolvedValueOnce({
        phone: '0922222222',
        code: '654321',
        expiresAt: new Date(Date.now() + 10000),
        isUsed: false
      })

      User.findOne.mockResolvedValueOnce(null) // phone check
      User.findOne.mockResolvedValueOnce(null) // email check for brand-222

      await userAuthService.register(userDataBrand2)

      expect(User.findOne).toHaveBeenCalledWith({
        email: 'same@example.com',
        brand: 'brand-222'
      })
    })

    it.skip('should reject registration when email exists in same brand', async () => {
      const userData = {
        phone: '0912345678',
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        brand: 'brand-123',
        verificationCode: '123456'
      }

      // Mock 驗證碼檢查通過
      VerificationCode.findOne.mockResolvedValue({
        phone: '0912345678',
        code: '123456',
        expiresAt: new Date(Date.now() + 10000),
        isUsed: false
      })

      // Mock 手機號碼檢查通過
      User.findOne.mockResolvedValueOnce(null)

      // Mock 同品牌內 email 已存在
      User.findOne.mockResolvedValueOnce(
        TestDataFactory.createUser({
          email: 'test@example.com',
          brand: 'brand-123'
        })
      )

      await expect(userAuthService.register(userData))
        .rejects.toThrow('此電子郵件已被註冊')

      expect(User.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
        brand: 'brand-123'
      })
    })
  })

  describe('validateUserUpdate', () => {
    it('should validate user data successfully', () => {
      const updateData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '0912345678'
      }

      const result = userAuthService.validateUserUpdate(updateData)

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should accept single character name', () => {
      const updateData = {
        name: 'J' // 1個字元，符合最少1個字元的要求
      }

      const result = userAuthService.validateUserUpdate(updateData)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid name - too long', () => {
      const updateData = {
        name: 'A'.repeat(26) // 26個字元，超過最大25個字元限制
      }

      const result = userAuthService.validateUserUpdate(updateData)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('姓名長度不能超過25個字元')
    })

    it('should reject empty name', () => {
      const updateData = {
        name: '' // 空字串
      }

      const result = userAuthService.validateUserUpdate(updateData)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('姓名為必填欄位')
    })

    it('should reject whitespace-only name', () => {
      const updateData = {
        name: '   ' // 只有空白字元
      }

      const result = userAuthService.validateUserUpdate(updateData)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('姓名為必填欄位')
    })

    it('should accept valid name range', () => {
      const validNames = [
        '王小明', // 中文姓名
        'John', // 英文姓名
        '李大華123', // 中英數字混合
        'A'.repeat(25) // 最大長度25字元
      ]

      validNames.forEach(name => {
        const updateData = { name }
        const result = userAuthService.validateUserUpdate(updateData)

        expect(result.valid).toBe(true)
        expect(result.errors).not.toContain(expect.stringMatching(/姓名/))
      })
    })

    it('should reject invalid email format', () => {
      const invalidEmails = [
        'invalid-email', // 沒有 @
        'test@', // 沒有 domain
        '@example.com', // 沒有 local part
        'test@.com', // domain 開頭是點
        'test@com', // 沒有點
        'test space@example.com' // 包含空格
      ]

      invalidEmails.forEach(email => {
        const updateData = { email }
        const result = userAuthService.validateUserUpdate(updateData)
        
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('請輸入有效的電子郵件格式')
      })
    })

    it('should accept valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.co.uk',
        'user+tag@example.org',
        'test123@domain123.com'
      ]

      validEmails.forEach(email => {
        const updateData = { email }
        const result = userAuthService.validateUserUpdate(updateData)
        
        expect(result.valid).toBe(true)
        expect(result.errors).not.toContain(expect.stringMatching(/電子郵件/))
      })
    })

    it('should allow empty email (optional field)', () => {
      const updateData = {
        name: 'John Doe',
        email: '' // 空字串應該被允許，因為 email 是可選的
      }

      const result = userAuthService.validateUserUpdate(updateData)

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should reject invalid phone format', () => {
      const invalidPhones = [
        '123456789', // 不是09開頭
        '0987654321a', // 包含字母
        '098765432', // 少一位數
        '09876543210', // 多一位數
        '0887654321', // 不是09開頭
        '+886912345678', // 包含國碼
        '09-1234-5678' // 包含連字號
      ]

      invalidPhones.forEach(phone => {
        const updateData = { phone }
        const result = userAuthService.validateUserUpdate(updateData)
        
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('請輸入有效的手機號碼格式 (09xxxxxxxx)')
      })
    })

    it('should accept valid phone formats', () => {
      const validPhones = [
        '0912345678',
        '0987654321',
        '0956789012',
        '0923456789'
      ]

      validPhones.forEach(phone => {
        const updateData = { phone }
        const result = userAuthService.validateUserUpdate(updateData)
        
        expect(result.valid).toBe(true)
        expect(result.errors).not.toContain(expect.stringMatching(/手機號碼/))
      })
    })

    it('should reject empty phone', () => {
      const updateData = {
        phone: '' // 空字串
      }

      const result = userAuthService.validateUserUpdate(updateData)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('手機號碼為必填欄位')
    })

    it('should accumulate multiple validation errors', () => {
      const updateData = {
        name: '', // 空字串，不符合必填要求
        email: 'invalid-email', // 格式錯誤
        phone: '123456789' // 格式錯誤
      }

      const result = userAuthService.validateUserUpdate(updateData)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(3)
      expect(result.errors).toContain('姓名為必填欄位')
      expect(result.errors).toContain('請輸入有效的電子郵件格式')
      expect(result.errors).toContain('請輸入有效的手機號碼格式 (09xxxxxxxx)')
    })

    it('should handle partial update data', () => {
      const updateData = {
        name: 'John Doe'
        // 只提供 name，沒有 email 和 phone
      }

      const result = userAuthService.validateUserUpdate(updateData)

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should handle empty update data', () => {
      const updateData = {} // 沒有任何欄位

      const result = userAuthService.validateUserUpdate(updateData)

      expect(result.valid).toBe(true) // 沒有欄位要驗證，應該通過
      expect(result.errors).toEqual([])
    })

    it('should handle null and undefined values correctly', () => {
      const updateData = {
        name: null, // null 值
        email: undefined, // undefined 值
        phone: null // null 值
      }

      const result = userAuthService.validateUserUpdate(updateData)

      expect(result.valid).toBe(false)
      // null 和 undefined 應該被視為無效值
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should validate mixed valid and invalid data', () => {
      const updateData = {
        name: 'Valid Name', // 有效的姓名
        email: 'invalid-email', // 無效的 email
        phone: '0912345678' // 有效的手機
      }

      const result = userAuthService.validateUserUpdate(updateData)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors).toContain('請輸入有效的電子郵件格式')
      // 不應該包含姓名或手機的錯誤
      expect(result.errors).not.toContain(expect.stringMatching(/姓名/))
      expect(result.errors).not.toContain(expect.stringMatching(/手機號碼/))
    })
  })
})