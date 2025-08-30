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

// 動態導入服務
const userAuthService = await import('@server/services/user/userAuthService.js')

describe('UserAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

    it('should reject invalid name - too short', () => {
      const updateData = {
        name: 'J' // 只有1個字元，最少需要2個
      }

      const result = userAuthService.validateUserUpdate(updateData)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('姓名至少需要2個字元')
    })

    it('should reject invalid name - too long', () => {
      const updateData = {
        name: 'A'.repeat(51) // 51個字元，超過最大50個字元限制
      }

      const result = userAuthService.validateUserUpdate(updateData)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('姓名長度不能超過50個字元')
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
        'A'.repeat(50) // 最大長度50字元
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
        name: 'J', // 太短
        email: 'invalid-email', // 格式錯誤
        phone: '123456789' // 格式錯誤
      }

      const result = userAuthService.validateUserUpdate(updateData)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(3)
      expect(result.errors).toContain('姓名至少需要2個字元')
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