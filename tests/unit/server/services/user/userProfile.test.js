import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TestDataFactory } from '../../../../setup.js'

// Mock AppError 類別
vi.mock('@server/middlewares/error.js', () => ({
  AppError: class AppError extends Error {
    constructor(message, statusCode = 500) {
      super(message)
      this.statusCode = statusCode
      this.name = 'AppError'
    }
  }
}))

// Mock User 模型
const mockUser = {
  findById: vi.fn(),
  findOne: vi.fn(),
  find: vi.fn(),
  countDocuments: vi.fn(),
  save: vi.fn(),
  toObject: vi.fn(),
  addresses: {
    length: 0,
    id: vi.fn(),
    push: vi.fn(),
    pull: vi.fn(),
    forEach: vi.fn()
  }
}

vi.mock('@server/models/User/User.js', () => ({
  default: mockUser
}))

// Mock mongoose
vi.mock('mongoose', () => ({
  default: {
    Types: {
      ObjectId: class MockObjectId {
        constructor() {
          return 'mock-object-id'
        }
        
        static generate() {
          return 'mock-object-id'
        }
        
        toString() {
          return 'mock-object-id'
        }
      }
    }
  }
}))

// Mock 日期工具
vi.mock('@server/utils/date.js', () => ({
  getStartOfDay: vi.fn((dateInput) => ({
    toJSDate: () => new Date('2024-01-01T00:00:00Z'),
    toFormat: (format) => '2024-01-01',
    toISO: () => '2024-01-01T00:00:00.000Z'
  })),
  getEndOfDay: vi.fn((dateInput) => ({
    toJSDate: () => new Date('2024-01-01T23:59:59Z'),
    toFormat: (format) => '2024-01-01',  
    toISO: () => '2024-01-01T23:59:59.999Z'
  }))
}))

// 動態導入服務
const userProfileService = await import('@server/services/user/userProfile.js')

describe('UserProfile Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getUserProfile', () => {
    it('should return user profile successfully', async () => {
      const mockUserData = TestDataFactory.createUser({
        _id: 'user-id-123',
        name: 'Test User',
        email: 'test@example.com'
      })

      mockUser.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUserData)
      })

      const result = await userProfileService.getUserProfile('user-id-123')

      expect(mockUser.findById).toHaveBeenCalledWith('user-id-123')
      expect(result).toEqual(mockUserData)
    })

    it('should throw error when user not found', async () => {
      mockUser.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue(null)
      })

      await expect(userProfileService.getUserProfile('nonexistent-id'))
        .rejects.toThrow('用戶不存在')
    })
  })

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const mockUserData = TestDataFactory.createUser({
        _id: 'user-id-123',
        email: 'old@example.com',
        phone: '0912345678',
        brand: 'brand-123',
        save: vi.fn().mockResolvedValue(),
        toObject: vi.fn().mockReturnValue({
          _id: 'user-id-123',
          name: 'Updated Name',
          email: 'new@example.com'
        })
      })

      mockUser.findById.mockResolvedValue(mockUserData)
      mockUser.findOne.mockResolvedValue(null) // 沒有重複的email

      const updateData = {
        name: 'Updated Name',
        email: 'new@example.com'
      }

      const result = await userProfileService.updateUserProfile('user-id-123', updateData)

      expect(mockUser.findById).toHaveBeenCalledWith('user-id-123')
      expect(mockUserData.save).toHaveBeenCalled()
      expect(result.name).toBe('Updated Name')
    })

    it('should throw error when user not found', async () => {
      mockUser.findById.mockResolvedValue(null)

      await expect(userProfileService.updateUserProfile('nonexistent-id', {}))
        .rejects.toThrow('用戶不存在')
    })

    it('should throw error when email already exists in same brand', async () => {
      const mockUserData = TestDataFactory.createUser({
        _id: 'user-id-123',
        email: 'old@example.com',
        brand: 'brand-123'
      })

      const existingUser = TestDataFactory.createUser({
        _id: 'other-user-id',
        email: 'new@example.com',
        brand: 'brand-123'
      })

      mockUser.findById.mockResolvedValue(mockUserData)
      mockUser.findOne.mockResolvedValue(existingUser)

      const updateData = { email: 'new@example.com' }

      await expect(userProfileService.updateUserProfile('user-id-123', updateData))
        .rejects.toThrow('此電子郵件已被使用')

      // 驗證查詢包含 brand
      expect(mockUser.findOne).toHaveBeenCalledWith({
        email: 'new@example.com',
        brand: 'brand-123'
      })
    })

    it('should allow same email in different brands', async () => {
      const mockUserData = TestDataFactory.createUser({
        _id: 'user-id-123',
        email: 'old@example.com',
        brand: 'brand-123',
        save: vi.fn().mockResolvedValue(),
        toObject: vi.fn().mockReturnValue({
          _id: 'user-id-123',
          email: 'same@example.com'
        })
      })

      mockUser.findById.mockResolvedValue(mockUserData)
      // 同品牌內沒有重複，但其他品牌有相同 email
      mockUser.findOne.mockResolvedValue(null)

      const updateData = { email: 'same@example.com' }

      const result = await userProfileService.updateUserProfile('user-id-123', updateData)

      expect(mockUser.findOne).toHaveBeenCalledWith({
        email: 'same@example.com',
        brand: 'brand-123'
      })
      expect(result.email).toBe('same@example.com')
    })

    it('should throw error when phone already exists in same brand', async () => {
      const mockUserData = TestDataFactory.createUser({
        _id: 'user-id-123',
        phone: '0912345678',
        brand: 'brand-123',
        save: vi.fn().mockResolvedValue(),
        toObject: vi.fn().mockReturnValue({ _id: 'user-id-123', phone: '0912345678' })
      })

      const existingUser = TestDataFactory.createUser({
        _id: 'other-user-id',
        phone: '0987654321',
        brand: 'brand-123'
      })

      mockUser.findById.mockResolvedValue(mockUserData)
      mockUser.findOne.mockResolvedValue(existingUser) // phone檢查失敗

      const updateData = { phone: '0987654321' }

      await expect(userProfileService.updateUserProfile('user-id-123', updateData))
        .rejects.toThrow('此電話號碼已被使用')

      // 驗證查詢包含 brand
      expect(mockUser.findOne).toHaveBeenCalledWith({
        phone: '0987654321',
        brand: 'brand-123'
      })
    })

    it('should allow same phone in different brands', async () => {
      const mockUserData = TestDataFactory.createUser({
        _id: 'user-id-123',
        phone: '0912345678',
        brand: 'brand-123',
        save: vi.fn().mockResolvedValue(),
        toObject: vi.fn().mockReturnValue({
          _id: 'user-id-123',
          phone: '0987654321'
        })
      })

      mockUser.findById.mockResolvedValue(mockUserData)
      // 同品牌內沒有重複，但其他品牌有相同 phone
      mockUser.findOne.mockResolvedValue(null)

      const updateData = { phone: '0987654321' }

      const result = await userProfileService.updateUserProfile('user-id-123', updateData)

      expect(mockUser.findOne).toHaveBeenCalledWith({
        phone: '0987654321',
        brand: 'brand-123'
      })
      expect(result.phone).toBe('0987654321')
    })

    it('should not allow updating restricted fields', async () => {
      const mockUserData = TestDataFactory.createUser({
        _id: 'user-id-123',
        save: vi.fn().mockResolvedValue(),
        toObject: vi.fn().mockReturnValue({ _id: 'user-id-123', name: 'Test User' })
      })

      mockUser.findById.mockResolvedValue(mockUserData)

      const updateData = {
        password: 'new-password',
        addresses: ['some-address'],
        resetPasswordToken: 'token',
        resetPasswordExpire: new Date(),
        isActive: false
      }

      await userProfileService.updateUserProfile('user-id-123', updateData)

      // 檢查這些欄位沒有被更新
      expect(mockUserData.password).toBeUndefined()
      expect(mockUserData.addresses).toBeUndefined()
      expect(mockUserData.resetPasswordToken).toBeUndefined()
      expect(mockUserData.resetPasswordExpire).toBeUndefined()
      expect(mockUserData.isActive).toBeUndefined()
    })
  })

  describe('addUserAddress', () => {
    it('should add user address successfully', async () => {
      const addresses = []
      const mockUserData = {
        _id: 'user-id-123',
        addresses: {
          ...addresses,
          length: 0,
          push: vi.fn(),
          forEach: vi.fn()
        },
        save: vi.fn().mockResolvedValue(),
        toObject: vi.fn().mockReturnValue({ _id: 'user-id-123', addresses: [] })
      }

      mockUser.findById.mockResolvedValue(mockUserData)

      const addressData = {
        name: '家',
        address: '台北市信義區信義路一段1號'
      }

      const result = await userProfileService.addUserAddress('user-id-123', addressData)

      expect(mockUser.findById).toHaveBeenCalledWith('user-id-123')
      expect(mockUserData.addresses.push).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '家',
          address: '台北市信義區信義路一段1號',
          isDefault: true // 第一個地址自動設為預設
        })
      )
      expect(mockUserData.save).toHaveBeenCalled()
    })

    it('should throw error when required fields are missing', async () => {
      const addressData = { name: '家' } // 缺少 address

      await expect(userProfileService.addUserAddress('user-id-123', addressData))
        .rejects.toThrow('地址名稱和詳細地址為必填欄位')
    })

    it('should throw error when user not found', async () => {
      mockUser.findById.mockResolvedValue(null)

      const addressData = {
        name: '家',
        address: '台北市信義區信義路一段1號'
      }

      await expect(userProfileService.addUserAddress('nonexistent-id', addressData))
        .rejects.toThrow('用戶不存在')
    })

    it('should handle setting default address when user has existing addresses', async () => {
      const existingAddresses = [
        { _id: 'addr-1', name: '公司', isDefault: true }
      ]
      
      const mockUserData = {
        _id: 'user-id-123',
        addresses: {
          ...existingAddresses,
          length: 1,
          push: vi.fn(),
          forEach: vi.fn((callback) => {
            existingAddresses.forEach(callback)
          })
        },
        save: vi.fn().mockResolvedValue(),
        toObject: vi.fn().mockReturnValue({ _id: 'user-id-123' })
      }

      mockUser.findById.mockResolvedValue(mockUserData)

      const addressData = {
        name: '家',
        address: '台北市信義區信義路一段1號',
        isDefault: true
      }

      await userProfileService.addUserAddress('user-id-123', addressData)

      expect(mockUserData.addresses.forEach).toHaveBeenCalled()
      expect(mockUserData.addresses.push).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '家',
          address: '台北市信義區信義路一段1號',
          isDefault: true
        })
      )
    })
  })

  describe('updateUserAddress', () => {
    it('should update user address successfully', async () => {
      const mockAddress = {
        _id: 'addr-id-123',
        name: '舊名稱',
        address: '舊地址',
        isDefault: false
      }

      const mockUserData = {
        _id: 'user-id-123',
        addresses: {
          id: vi.fn().mockReturnValue(mockAddress),
          forEach: vi.fn()
        },
        save: vi.fn().mockResolvedValue(),
        toObject: vi.fn().mockReturnValue({ _id: 'user-id-123' })
      }

      mockUser.findById.mockResolvedValue(mockUserData)

      const updateData = {
        name: '新名稱',
        address: '新地址'
      }

      const result = await userProfileService.updateUserAddress('user-id-123', 'addr-id-123', updateData)

      expect(mockUserData.addresses.id).toHaveBeenCalledWith('addr-id-123')
      expect(mockAddress.name).toBe('新名稱')
      expect(mockAddress.address).toBe('新地址')
      expect(mockUserData.save).toHaveBeenCalled()
    })

    it('should throw error when user not found', async () => {
      mockUser.findById.mockResolvedValue(null)

      await expect(userProfileService.updateUserAddress('nonexistent-id', 'addr-id', {}))
        .rejects.toThrow('用戶不存在')
    })

    it('should throw error when address not found', async () => {
      const mockUserData = {
        _id: 'user-id-123',
        addresses: {
          id: vi.fn().mockReturnValue(null)
        }
      }

      mockUser.findById.mockResolvedValue(mockUserData)

      await expect(userProfileService.updateUserAddress('user-id-123', 'nonexistent-addr', {}))
        .rejects.toThrow('地址不存在')
    })

    it('should handle setting address as default', async () => {
      const mockAddress = {
        _id: 'addr-id-123',
        isDefault: false
      }

      const addresses = [
        { _id: 'addr-1', isDefault: true },
        mockAddress
      ]

      const mockUserData = {
        _id: 'user-id-123',
        addresses: {
          id: vi.fn().mockReturnValue(mockAddress),
          forEach: vi.fn((callback) => {
            addresses.forEach(callback)
          })
        },
        save: vi.fn().mockResolvedValue(),
        toObject: vi.fn().mockReturnValue({ _id: 'user-id-123' })
      }

      mockUser.findById.mockResolvedValue(mockUserData)

      const updateData = { isDefault: true }

      await userProfileService.updateUserAddress('user-id-123', 'addr-id-123', updateData)

      expect(mockUserData.addresses.forEach).toHaveBeenCalled()
      expect(mockUserData.save).toHaveBeenCalled()
    })
  })

  describe('deleteUserAddress', () => {
    it('should delete user address successfully', async () => {
      const mockAddress = {
        _id: 'addr-id-123',
        isDefault: false
      }

      const mockUserData = {
        _id: 'user-id-123',
        addresses: {
          id: vi.fn().mockReturnValue(mockAddress),
          pull: vi.fn(),
          length: 1
        },
        save: vi.fn().mockResolvedValue(),
        toObject: vi.fn().mockReturnValue({ _id: 'user-id-123' })
      }

      mockUser.findById.mockResolvedValue(mockUserData)

      const result = await userProfileService.deleteUserAddress('user-id-123', 'addr-id-123')

      expect(mockUserData.addresses.id).toHaveBeenCalledWith('addr-id-123')
      expect(mockUserData.addresses.pull).toHaveBeenCalledWith('addr-id-123')
      expect(mockUserData.save).toHaveBeenCalled()
    })

    it('should throw error when user not found', async () => {
      mockUser.findById.mockResolvedValue(null)

      await expect(userProfileService.deleteUserAddress('nonexistent-id', 'addr-id'))
        .rejects.toThrow('用戶不存在')
    })

    it('should throw error when address not found', async () => {
      const mockUserData = {
        _id: 'user-id-123',
        addresses: {
          id: vi.fn().mockReturnValue(null)
        }
      }

      mockUser.findById.mockResolvedValue(mockUserData)

      await expect(userProfileService.deleteUserAddress('user-id-123', 'nonexistent-addr'))
        .rejects.toThrow('地址不存在')
    })

    it('should set new default address when deleting default address', async () => {
      const mockAddress = {
        _id: 'addr-id-123',
        isDefault: true
      }

      const remainingAddress = { _id: 'addr-2', isDefault: false }

      const mockUserData = {
        _id: 'user-id-123',
        addresses: {
          id: vi.fn().mockReturnValue(mockAddress),
          pull: vi.fn(),
          length: 1,
          0: remainingAddress
        },
        save: vi.fn().mockResolvedValue(),
        toObject: vi.fn().mockReturnValue({ _id: 'user-id-123' })
      }

      mockUser.findById.mockResolvedValue(mockUserData)

      await userProfileService.deleteUserAddress('user-id-123', 'addr-id-123')

      expect(remainingAddress.isDefault).toBe(true)
      expect(mockUserData.save).toHaveBeenCalled()
    })
  })

  describe('setDefaultAddress', () => {
    it('should set default address successfully', async () => {
      const mockAddress = {
        _id: 'addr-id-123'
      }

      const addresses = [
        { _id: 'addr-1', isDefault: true },
        mockAddress
      ]

      const mockUserData = {
        _id: 'user-id-123',
        addresses: {
          id: vi.fn().mockReturnValue(mockAddress),
          forEach: vi.fn((callback) => {
            addresses.forEach(callback)
          })
        },
        save: vi.fn().mockResolvedValue(),
        toObject: vi.fn().mockReturnValue({ _id: 'user-id-123' })
      }

      mockUser.findById.mockResolvedValue(mockUserData)

      const result = await userProfileService.setDefaultAddress('user-id-123', 'addr-id-123')

      expect(mockUserData.addresses.id).toHaveBeenCalledWith('addr-id-123')
      expect(mockUserData.addresses.forEach).toHaveBeenCalled()
      expect(mockUserData.save).toHaveBeenCalled()
    })

    it('should throw error when user not found', async () => {
      mockUser.findById.mockResolvedValue(null)

      await expect(userProfileService.setDefaultAddress('nonexistent-id', 'addr-id'))
        .rejects.toThrow('用戶不存在')
    })

    it('should throw error when address not found', async () => {
      const mockUserData = {
        _id: 'user-id-123',
        addresses: {
          id: vi.fn().mockReturnValue(null)
        }
      }

      mockUser.findById.mockResolvedValue(mockUserData)

      await expect(userProfileService.setDefaultAddress('user-id-123', 'nonexistent-addr'))
        .rejects.toThrow('地址不存在')
    })
  })

  describe('getAllUsers', () => {
    it('should get all users with brandId', async () => {
      const mockUsers = [
        TestDataFactory.createUser({ _id: 'user-1', name: 'User 1' }),
        TestDataFactory.createUser({ _id: 'user-2', name: 'User 2' })
      ]

      mockUser.countDocuments.mockResolvedValue(2)
      mockUser.find.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockUsers)
      })

      const result = await userProfileService.getAllUsers({ brandId: 'brand-123' })

      expect(mockUser.countDocuments).toHaveBeenCalledWith({ brand: 'brand-123' })
      expect(result.users).toEqual(mockUsers)
      expect(result.pagination.total).toBe(2)
      expect(result.pagination.currentPage).toBe(1)
      expect(result.pagination.limit).toBe(20)
    })

    it('should filter users by search keyword within brand', async () => {
      const mockUsers = [
        TestDataFactory.createUser({ name: 'John Doe' })
      ]

      mockUser.countDocuments.mockResolvedValue(1)
      mockUser.find.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockUsers)
      })

      const options = { brandId: 'brand-123', search: 'john' }
      const result = await userProfileService.getAllUsers(options)

      expect(mockUser.countDocuments).toHaveBeenCalledWith({
        brand: 'brand-123',
        $or: [
          { name: { $regex: 'john', $options: 'i' } },
          { email: { $regex: 'john', $options: 'i' } },
          { phone: { $regex: 'john', $options: 'i' } }
        ]
      })
    })

    it('should filter active users only within brand', async () => {
      const mockUsers = [
        TestDataFactory.createUser({ isActive: true })
      ]

      mockUser.countDocuments.mockResolvedValue(1)
      mockUser.find.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockUsers)
      })

      const options = { brandId: 'brand-123', activeOnly: true }
      const result = await userProfileService.getAllUsers(options)

      expect(mockUser.countDocuments).toHaveBeenCalledWith({
        brand: 'brand-123',
        isActive: true
      })
    })

    it('should handle pagination correctly within brand', async () => {
      const mockUsers = []

      mockUser.countDocuments.mockResolvedValue(50)
      mockUser.find.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockUsers)
      })

      const options = { brandId: 'brand-123', page: 3, limit: 10 }
      const result = await userProfileService.getAllUsers(options)

      expect(result.pagination.currentPage).toBe(3)
      expect(result.pagination.limit).toBe(10)
      expect(result.pagination.totalPages).toBe(5)
      expect(result.pagination.hasNextPage).toBe(true)
      expect(result.pagination.hasPrevPage).toBe(true)
    })
  })

  describe('getUserById', () => {
    it('should get user by ID successfully', async () => {
      const mockUserData = TestDataFactory.createUser({
        _id: 'user-id-123',
        name: 'Test User'
      })

      mockUser.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUserData)
      })

      const result = await userProfileService.getUserById('user-id-123')

      expect(mockUser.findById).toHaveBeenCalledWith('user-id-123')
      expect(result).toEqual(mockUserData)
    })

    it('should throw error when user not found', async () => {
      mockUser.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue(null)
      })

      await expect(userProfileService.getUserById('nonexistent-id'))
        .rejects.toThrow('用戶不存在')
    })
  })

  describe('toggleUserStatus', () => {
    it('should toggle user status successfully', async () => {
      const mockUserData = {
        _id: 'user-id-123',
        isActive: false,
        save: vi.fn().mockResolvedValue(),
        toObject: vi.fn().mockReturnValue({
          _id: 'user-id-123',
          isActive: true
        })
      }

      mockUser.findById.mockResolvedValue(mockUserData)

      const result = await userProfileService.toggleUserStatus('user-id-123', true)

      expect(mockUser.findById).toHaveBeenCalledWith('user-id-123')
      expect(mockUserData.isActive).toBe(true)
      expect(mockUserData.save).toHaveBeenCalled()
      expect(result.isActive).toBe(true)
    })

    it('should throw error when user not found', async () => {
      mockUser.findById.mockResolvedValue(null)

      await expect(userProfileService.toggleUserStatus('nonexistent-id', true))
        .rejects.toThrow('用戶不存在')
    })
  })

  describe('getNewUsersInRange', () => {
    it('should get new users in date range successfully', async () => {
      const mockUsers = [
        TestDataFactory.createUser({ name: 'New User 1' }),
        TestDataFactory.createUser({ name: 'New User 2' })
      ]

      mockUser.countDocuments.mockResolvedValue(2)
      mockUser.find.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockUsers)
      })

      const options = {
        brandId: 'brand-123',
        startDate: '2024-01-01',
        endDate: '2024-01-01'
      }

      const result = await userProfileService.getNewUsersInRange(options)

      expect(mockUser.countDocuments).toHaveBeenCalledWith({
        brand: 'brand-123',
        createdAt: {
          $gte: expect.any(Date),
          $lte: expect.any(Date)
        }
      })
      expect(result.users).toEqual(mockUsers)
      expect(result.dateRange).toHaveProperty('startDate')
      expect(result.dateRange).toHaveProperty('endDate')
    })

    it('should handle pagination for new users query', async () => {
      const mockUsers = []

      mockUser.countDocuments.mockResolvedValue(25)
      mockUser.find.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockUsers)
      })

      const options = {
        brandId: 'brand-123',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        page: 2,
        limit: 10
      }

      const result = await userProfileService.getNewUsersInRange(options)

      expect(result.pagination.currentPage).toBe(2)
      expect(result.pagination.limit).toBe(10)
      expect(result.pagination.totalPages).toBe(3)
      expect(result.pagination.hasNextPage).toBe(true)
      expect(result.pagination.hasPrevPage).toBe(true)
    })
  })
})