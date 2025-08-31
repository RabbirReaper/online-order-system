import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TestDataFactory } from '../../../../setup.js'

// 設定 mocks
vi.mock('@server/models/User/Admin.js', () => ({
  default: {
    findOne: vi.fn(),
    findById: vi.fn(),
    create: vi.fn()
  }
}))

// 不需要 mock AppError，直接使用實際的 AppError 類
vi.mock('bcrypt', () => ({
  genSalt: vi.fn().mockResolvedValue('salt'),
  hash: vi.fn().mockResolvedValue('hashed_password'),
  compare: vi.fn().mockResolvedValue(true)
}))

// 動態導入服務和模型
const adminAuthService = await import('@server/services/user/adminAuthService.js')
const Admin = (await import('@server/models/User/Admin.js')).default
const { AppError } = await import('@server/middlewares/error.js')

describe('AdminAuthService', () => {
  let mockSession

  beforeEach(() => {
    vi.clearAllMocks()
    mockSession = {
      adminId: null,
      adminRole: null,
      adminBrand: null,
      adminStore: null,
      destroy: vi.fn()
    }
  })

  describe('adminLogin', () => {
    it('should throw error when name is missing', async () => {
      const credentials = { password: 'password123' }

      await expect(adminAuthService.adminLogin(credentials, mockSession))
        .rejects.toThrow('用戶名和密碼為必填欄位')
    })

    it('should throw error when password is missing', async () => {
      const credentials = { name: 'admin' }

      await expect(adminAuthService.adminLogin(credentials, mockSession))
        .rejects.toThrow('用戶名和密碼為必填欄位')
    })

    it('should throw error when admin not found', async () => {
      const credentials = { name: 'nonexistent', password: 'password123' }
      Admin.findOne.mockReturnValue({
        select: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockResolvedValue(null)
          })
        })
      })

      await expect(adminAuthService.adminLogin(credentials, mockSession))
        .rejects.toThrow('用戶名或密碼錯誤')
    })

    it('should throw error when admin is inactive', async () => {
      const mockAdmin = {
        _id: 'admin1',
        name: 'admin',
        isActive: false,
        comparePassword: vi.fn().mockResolvedValue(true)
      }

      Admin.findOne.mockReturnValue({
        select: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockResolvedValue(mockAdmin)
          })
        })
      })

      const credentials = { name: 'admin', password: 'password123' }

      await expect(adminAuthService.adminLogin(credentials, mockSession))
        .rejects.toThrow('此帳號已被停用')
    })

    it('should throw error when password is invalid', async () => {
      const mockAdmin = {
        _id: 'admin1',
        name: 'admin',
        isActive: true,
        comparePassword: vi.fn().mockResolvedValue(false)
      }

      Admin.findOne.mockReturnValue({
        select: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockResolvedValue(mockAdmin)
          })
        })
      })

      const credentials = { name: 'admin', password: 'wrongpassword' }

      await expect(adminAuthService.adminLogin(credentials, mockSession))
        .rejects.toThrow('用戶名或密碼錯誤')
    })

    it('should throw error when brand admin brand is inactive', async () => {
      const mockAdmin = {
        _id: 'admin1',
        name: 'admin',
        isActive: true,
        role: 'brand_admin',
        brand: { _id: 'brand1', isActive: false },
        comparePassword: vi.fn().mockResolvedValue(true),
        lastLogin: new Date(),
        save: vi.fn()
      }

      Admin.findOne.mockReturnValue({
        select: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockResolvedValue(mockAdmin)
          })
        })
      })

      const credentials = { name: 'admin', password: 'password123', brandId: 'brand1' }

      await expect(adminAuthService.adminLogin(credentials, mockSession))
        .rejects.toThrow('此品牌已停用，無法登入')
    })

    it('should throw error when brand admin brand mismatch', async () => {
      const mockAdmin = {
        _id: 'admin1',
        name: 'admin',
        isActive: true,
        role: 'brand_admin',
        brand: { _id: 'brand2', isActive: true },
        comparePassword: vi.fn().mockResolvedValue(true),
        lastLogin: new Date(),
        save: vi.fn()
      }

      Admin.findOne.mockReturnValue({
        select: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockResolvedValue(mockAdmin)
          })
        })
      })

      const credentials = { name: 'admin', password: 'password123', brandId: 'brand1' }

      await expect(adminAuthService.adminLogin(credentials, mockSession))
        .rejects.toThrow('用戶名或密碼錯誤')
    })

    it('should throw error when non-system admin tries system login', async () => {
      const mockAdmin = {
        _id: 'admin1',
        name: 'admin',
        isActive: true,
        role: 'brand_admin',
        brand: null,
        comparePassword: vi.fn().mockResolvedValue(true),
        lastLogin: new Date(),
        save: vi.fn()
      }

      Admin.findOne.mockReturnValue({
        select: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockResolvedValue(mockAdmin)
          })
        })
      })

      const credentials = { name: 'admin', password: 'password123' }

      await expect(adminAuthService.adminLogin(credentials, mockSession))
        .rejects.toThrow('用戶名或密碼錯誤')
    })

    it('should throw error when store is inactive', async () => {
      const mockAdmin = {
        _id: 'admin1',
        name: 'admin',
        isActive: true,
        role: 'store_admin',
        brand: { _id: 'brand1', isActive: true },
        store: { _id: 'store1', isActive: false },
        comparePassword: vi.fn().mockResolvedValue(true),
        lastLogin: new Date(),
        save: vi.fn()
      }

      Admin.findOne.mockReturnValue({
        select: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockResolvedValue(mockAdmin)
          })
        })
      })

      const credentials = { name: 'admin', password: 'password123', brandId: 'brand1' }

      await expect(adminAuthService.adminLogin(credentials, mockSession))
        .rejects.toThrow('您管理的店鋪已停用，請聯繫品牌管理員')
    })

    it('should login system admin successfully', async () => {
      const mockAdmin = {
        _id: 'admin1',
        name: 'systemadmin',
        isActive: true,
        role: 'system_admin',
        brand: null,
        store: null,
        comparePassword: vi.fn().mockResolvedValue(true),
        lastLogin: new Date(),
        save: vi.fn()
      }

      Admin.findOne.mockReturnValue({
        select: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockResolvedValue(mockAdmin)
          })
        })
      })

      const credentials = { name: 'systemadmin', password: 'password123' }

      const result = await adminAuthService.adminLogin(credentials, mockSession)

      expect(result).toEqual({
        role: 'system_admin',
        brand: null,
        store: null
      })
      expect(mockSession.adminId).toBe('admin1')
      expect(mockSession.adminRole).toBe('system_admin')
      expect(mockAdmin.save).toHaveBeenCalled()
    })

    it('should login brand admin successfully', async () => {
      const mockAdmin = {
        _id: 'admin1',
        name: 'brandadmin',
        isActive: true,
        role: 'brand_admin',
        brand: { _id: 'brand1', isActive: true, name: 'Test Brand' },
        store: null,
        comparePassword: vi.fn().mockResolvedValue(true),
        lastLogin: new Date(),
        save: vi.fn()
      }

      Admin.findOne.mockReturnValue({
        select: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockResolvedValue(mockAdmin)
          })
        })
      })

      const credentials = { name: 'brandadmin', password: 'password123', brandId: 'brand1' }

      const result = await adminAuthService.adminLogin(credentials, mockSession)

      expect(result).toEqual({
        role: 'brand_admin',
        brand: { _id: 'brand1', isActive: true, name: 'Test Brand' },
        store: null
      })
      expect(mockSession.adminId).toBe('admin1')
      expect(mockSession.adminBrand).toBe('brand1')
    })
  })

  describe('adminLogout', () => {
    it('should logout successfully', async () => {
      mockSession.destroy.mockImplementation((callback) => {
        callback(null)
      })

      const result = await adminAuthService.adminLogout(mockSession)

      expect(result).toEqual({ success: true, message: '登出成功' })
      expect(mockSession.destroy).toHaveBeenCalled()
    })

    it('should throw error when logout fails', async () => {
      mockSession.destroy.mockImplementation((callback) => {
        callback(new Error('Session destroy failed'))
      })

      await expect(adminAuthService.adminLogout(mockSession))
        .rejects.toThrow('登出失敗')
    })
  })

  describe('changeAdminPassword', () => {
    it('should throw error when current password is missing', async () => {
      await expect(adminAuthService.changeAdminPassword('admin1', '', 'newpassword'))
        .rejects.toThrow('當前密碼和新密碼為必填欄位')
    })

    it('should throw error when new password is missing', async () => {
      await expect(adminAuthService.changeAdminPassword('admin1', 'currentpassword', ''))
        .rejects.toThrow('當前密碼和新密碼為必填欄位')
    })

    it('should throw error when new password is too short', async () => {
      await expect(adminAuthService.changeAdminPassword('admin1', 'currentpassword', '1234567'))
        .rejects.toThrow('密碼長度至少需要8個字元')
    })

    it('should throw error when new password is too long', async () => {
      const longPassword = 'a'.repeat(65)
      await expect(adminAuthService.changeAdminPassword('admin1', 'currentpassword', longPassword))
        .rejects.toThrow('密碼長度不能超過64個字元')
    })

    it('should throw error when new password has invalid characters', async () => {
      await expect(adminAuthService.changeAdminPassword('admin1', 'currentpassword', 'password中文'))
        .rejects.toThrow('密碼只能包含英文、數字和符號(!@#$%^&*)')
    })

    it('should throw error when admin not found', async () => {
      Admin.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue(null)
      })

      await expect(adminAuthService.changeAdminPassword('nonexistent', 'currentpassword', 'newpassword123'))
        .rejects.toThrow('找不到管理員')
    })

    it('should throw error when current password is incorrect', async () => {
      const mockAdmin = {
        _id: 'admin1',
        comparePassword: vi.fn().mockResolvedValue(false)
      }

      Admin.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockAdmin)
      })

      await expect(adminAuthService.changeAdminPassword('admin1', 'wrongpassword', 'newpassword123'))
        .rejects.toThrow('當前密碼不正確')
    })

    it('should throw error when new password is same as current', async () => {
      const mockAdmin = {
        _id: 'admin1',
        comparePassword: vi.fn()
          .mockResolvedValueOnce(true)  // current password correct
          .mockResolvedValueOnce(true)  // new password same as current
      }

      Admin.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockAdmin)
      })

      await expect(adminAuthService.changeAdminPassword('admin1', 'password123', 'password123'))
        .rejects.toThrow('新密碼不能與當前密碼相同')
    })

    it('should change password successfully', async () => {
      const mockAdmin = {
        _id: 'admin1',
        comparePassword: vi.fn()
          .mockResolvedValueOnce(true)   // current password correct
          .mockResolvedValueOnce(false), // new password different
        save: vi.fn()
      }

      Admin.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockAdmin)
      })

      const result = await adminAuthService.changeAdminPassword('admin1', 'currentpassword', 'newpassword123')

      expect(result).toEqual({ success: true, message: '密碼修改成功' })
      expect(mockAdmin.password).toBe('newpassword123')
      expect(mockAdmin.save).toHaveBeenCalled()
    })
  })

  describe('checkAdminStatus', () => {
    it('should return not logged in when no session', async () => {
      const result = await adminAuthService.checkAdminStatus(mockSession)

      expect(result).toEqual({
        loggedIn: false,
        role: null,
        brand: null,
        store: null
      })
    })

    it('should return not logged in when admin not found', async () => {
      mockSession.adminId = 'admin1'
      Admin.findById.mockReturnValue({
        select: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockResolvedValue(null)
          })
        })
      })

      const result = await adminAuthService.checkAdminStatus(mockSession)

      expect(result).toEqual({
        loggedIn: false,
        role: null,
        brand: null,
        store: null
      })
    })

    it('should return admin status when logged in', async () => {
      mockSession.adminId = 'admin1'
      const mockAdmin = {
        role: 'brand_admin',
        brand: { name: 'Test Brand' },
        store: { name: 'Test Store' }
      }

      Admin.findById.mockReturnValue({
        select: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockResolvedValue(mockAdmin)
          })
        })
      })

      const result = await adminAuthService.checkAdminStatus(mockSession)

      expect(result).toEqual({
        loggedIn: true,
        role: 'brand_admin',
        brand: { name: 'Test Brand' },
        store: { name: 'Test Store' }
      })
    })
  })

  describe('getCurrentAdminProfile', () => {
    it('should throw error when not logged in', async () => {
      await expect(adminAuthService.getCurrentAdminProfile(mockSession))
        .rejects.toThrow('未登入')
    })

    it('should throw error when admin not found', async () => {
      mockSession.adminId = 'admin1'
      Admin.findById.mockReturnValue({
        select: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              populate: vi.fn().mockResolvedValue(null)
            })
          })
        })
      })

      await expect(adminAuthService.getCurrentAdminProfile(mockSession))
        .rejects.toThrow('管理員不存在')
    })

    it('should throw error when admin is inactive', async () => {
      mockSession.adminId = 'admin1'
      const mockAdmin = {
        _id: 'admin1',
        isActive: false
      }

      Admin.findById.mockReturnValue({
        select: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              populate: vi.fn().mockResolvedValue(mockAdmin)
            })
          })
        })
      })

      await expect(adminAuthService.getCurrentAdminProfile(mockSession))
        .rejects.toThrow('此帳號已被停用')
    })

    it('should return admin profile successfully', async () => {
      mockSession.adminId = 'admin1'
      const mockAdmin = {
        _id: 'admin1',
        name: 'Test Admin',
        isActive: true,
        role: 'brand_admin'
      }

      Admin.findById.mockReturnValue({
        select: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              populate: vi.fn().mockResolvedValue(mockAdmin)
            })
          })
        })
      })

      const result = await adminAuthService.getCurrentAdminProfile(mockSession)

      expect(result).toBe(mockAdmin)
    })
  })

  describe('updateCurrentAdminProfile', () => {
    it('should throw error when not logged in', async () => {
      await expect(adminAuthService.updateCurrentAdminProfile(mockSession, { name: 'Test' }))
        .rejects.toThrow('未登入')
    })

    it('should throw error when name is empty', async () => {
      mockSession.adminId = 'admin1'

      await expect(adminAuthService.updateCurrentAdminProfile(mockSession, { name: '' }))
        .rejects.toThrow('用戶名為必填項')
    })

    it('should throw error when name is too short', async () => {
      mockSession.adminId = 'admin1'

      await expect(adminAuthService.updateCurrentAdminProfile(mockSession, { name: 'A' }))
        .rejects.toThrow('用戶名至少需要2個字元')
    })

    it('should throw error when phone format is invalid', async () => {
      mockSession.adminId = 'admin1'

      await expect(adminAuthService.updateCurrentAdminProfile(mockSession, { 
        name: 'Test Admin', 
        phone: 'invalid-phone' 
      }))
        .rejects.toThrow('請輸入有效的電話號碼')
    })

    it('should throw error when admin not found', async () => {
      mockSession.adminId = 'admin1'
      Admin.findById.mockResolvedValue(null)

      await expect(adminAuthService.updateCurrentAdminProfile(mockSession, { name: 'Test Admin' }))
        .rejects.toThrow('管理員不存在')
    })

    it('should throw error when admin is inactive', async () => {
      mockSession.adminId = 'admin1'
      const mockAdmin = { isActive: false }
      Admin.findById.mockResolvedValue(mockAdmin)

      await expect(adminAuthService.updateCurrentAdminProfile(mockSession, { name: 'Test Admin' }))
        .rejects.toThrow('此帳號已被停用')
    })

    it('should throw error when name already exists in same scope', async () => {
      mockSession.adminId = 'admin1'
      const mockAdmin = { 
        _id: 'admin1',
        name: 'Current Admin',
        isActive: true,
        role: 'brand_admin',
        brand: 'brand1'
      }
      
      Admin.findById.mockResolvedValue(mockAdmin)
      Admin.findOne.mockResolvedValue({ _id: 'admin2' }) // Another admin with same name exists

      await expect(adminAuthService.updateCurrentAdminProfile(mockSession, { name: 'Existing Admin' }))
        .rejects.toThrow('此用戶名在此品牌內已被使用')
    })

    it('should update admin profile successfully', async () => {
      mockSession.adminId = 'admin1'
      const mockAdmin = { 
        _id: 'admin1',
        name: 'Current Admin',
        isActive: true,
        role: 'brand_admin',
        brand: 'brand1',
        save: vi.fn()
      }
      
      const updatedAdmin = {
        _id: 'admin1',
        name: 'Updated Admin',
        phone: '0912345678',
        role: 'brand_admin'
      }

      Admin.findById
        .mockResolvedValueOnce(mockAdmin) // First call for validation
        .mockReturnValueOnce({           // Second call for returning updated data
          select: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              populate: vi.fn().mockReturnValue({
                populate: vi.fn().mockResolvedValue(updatedAdmin)
              })
            })
          })
        })
      
      Admin.findOne.mockResolvedValue(null) // No conflicting admin

      const result = await adminAuthService.updateCurrentAdminProfile(mockSession, { 
        name: 'Updated Admin',
        phone: '0912345678'
      })

      expect(mockAdmin.name).toBe('Updated Admin')
      expect(mockAdmin.phone).toBe('0912345678')
      expect(mockAdmin.save).toHaveBeenCalled()
      expect(result).toBe(updatedAdmin)
    })
  })
})