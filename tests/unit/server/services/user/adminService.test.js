import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TestDataFactory } from '../../../../setup.js'

// 擴展 TestDataFactory
TestDataFactory.createAdmin = (overrides = {}) => ({
  _id: 'admin-507f1f77bcf86cd799439011',
  name: 'Test Admin',
  password: 'hashedpassword123',
  role: 'brand_admin',
  brand: 'brand-507f1f77bcf86cd799439012',
  store: null,
  isActive: true,
  createdBy: 'creator-507f1f77bcf86cd799439013',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

TestDataFactory.createBrand = (overrides = {}) => ({
  _id: 'brand-507f1f77bcf86cd799439012',
  name: 'Test Brand',
  ...overrides
})

TestDataFactory.createStore = (overrides = {}) => ({
  _id: 'store-507f1f77bcf86cd799439014',
  name: 'Test Store',
  brand: {
    _id: 'brand-507f1f77bcf86cd799439012',
    name: 'Test Brand'
  },
  ...overrides
})

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

// Mock permissions
const mockPermissions = {
  ROLE_LEVELS: {
    primary_system_admin: 7,
    system_admin: 6,
    primary_brand_admin: 5,
    brand_admin: 4,
    primary_store_admin: 3,
    store_admin: 2,
    employee: 1,
  },
  ROLE_SCOPES: {
    primary_system_admin: 'system',
    system_admin: 'system',
    primary_brand_admin: 'brand',
    brand_admin: 'brand',
    primary_store_admin: 'store',
    store_admin: 'store',
    employee: 'store',
  },
  ROLE_MANAGEMENT_MATRIX: {
    primary_system_admin: [
      'primary_system_admin',
      'system_admin',
      'primary_brand_admin',
      'brand_admin',
      'primary_store_admin',
      'store_admin',
      'employee',
    ],
    system_admin: [
      'primary_brand_admin',
      'brand_admin',
      'primary_store_admin',
      'store_admin',
      'employee',
    ],
    primary_brand_admin: ['brand_admin', 'primary_store_admin', 'store_admin', 'employee'],
    brand_admin: ['primary_store_admin', 'store_admin', 'employee'],
    primary_store_admin: ['store_admin', 'employee'],
    store_admin: [],
    employee: [],
  },
  canManageRole: (managerRole, targetRole) => {
    const allowedRoles = mockPermissions.ROLE_MANAGEMENT_MATRIX[managerRole] || []
    return allowedRoles.includes(targetRole)
  }
}

vi.mock('@server/config/permissions.js', () => mockPermissions)

// Mock Admin 模型
const mockAdmin = {
  findById: vi.fn(),
  findOne: vi.fn(),
  find: vi.fn(),
  countDocuments: vi.fn().mockResolvedValue(0),
  sort: vi.fn().mockReturnThis(),
  populate: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  skip: vi.fn().mockReturnThis()
}

// Mock Admin constructor 
const AdminConstructor = vi.fn().mockImplementation((data) => {
  const instance = {
    ...data,
    _id: 'mock-admin-id',
    save: vi.fn().mockResolvedValue(),
    deleteOne: vi.fn().mockResolvedValue(),
    toObject: vi.fn().mockReturnValue({ ...data, _id: 'mock-admin-id' })
  }
  return instance
})

// 將靜態方法添加到構造函數上
Object.assign(AdminConstructor, mockAdmin)

vi.mock('@server/models/User/Admin.js', () => ({
  default: AdminConstructor
}))

// Mock Brand 模型
vi.mock('@server/models/Brand/Brand.js', () => ({
  default: {
    findById: vi.fn().mockResolvedValue(TestDataFactory.createBrand())
  }
}))

// Mock Store 模型
vi.mock('@server/models/Store/Store.js', () => ({
  default: {
    findById: vi.fn().mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: 'mock-store-id',
        name: 'Test Store',
        brand: { _id: 'mock-brand-id', name: 'Test Brand' }
      })
    })
  }
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

// 動態導入被測試的服務
const adminService = await import('@server/services/user/adminService.js')
const Admin = (await import('@server/models/User/Admin.js')).default
const Brand = (await import('@server/models/Brand/Brand.js')).default
const Store = (await import('@server/models/Store/Store.js')).default

describe('AdminService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAllAdmins', () => {
    it('應該獲取系統管理員可見的所有管理員', async () => {
      const currentAdmin = TestDataFactory.createAdmin({ role: 'system_admin' })
      const mockAdmins = [
        TestDataFactory.createAdmin({ name: 'Admin 1', role: 'brand_admin' }),
        TestDataFactory.createAdmin({ name: 'Admin 2', role: 'store_admin' })
      ]

      // 設置鏈式調用 mock
      Admin.countDocuments.mockResolvedValue(2)
      Admin.find.mockReturnValue({
        select: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              populate: vi.fn().mockReturnValue({
                sort: vi.fn().mockReturnValue({
                  skip: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue(mockAdmins)
                  })
                })
              })
            })
          })
        })
      })

      const result = await adminService.getAllAdmins(currentAdmin)

      expect(result.admins).toEqual(mockAdmins)
      expect(result.pagination.total).toBe(2)
      // 系統管理員在沒有指定 brandId 時不會有額外的篩選條件
      expect(Admin.find).toHaveBeenCalledWith({})
    })

    it('應該根據品牌管理員權限篩選管理員', async () => {
      const currentAdmin = TestDataFactory.createAdmin({ 
        role: 'primary_brand_admin',
        brand: 'brand-123'
      })
      
      Admin.countDocuments.mockResolvedValue(1)
      Admin.find.mockReturnValue({
        select: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              populate: vi.fn().mockReturnValue({
                sort: vi.fn().mockReturnValue({
                  skip: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([])
                  })
                })
              })
            })
          })
        })
      })

      await adminService.getAllAdmins(currentAdmin)

      expect(Admin.find).toHaveBeenCalledWith({
        brand: 'brand-123',
        role: { $nin: ['primary_system_admin', 'system_admin'] }
      })
    })

    it('應該正確處理分頁參數', async () => {
      const currentAdmin = TestDataFactory.createAdmin({ role: 'system_admin' })
      const options = { page: 2, limit: 5 }

      Admin.countDocuments.mockResolvedValue(10)
      Admin.find.mockReturnValue({
        select: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              populate: vi.fn().mockReturnValue({
                sort: vi.fn().mockReturnValue({
                  skip: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([])
                  })
                })
              })
            })
          })
        })
      })

      const result = await adminService.getAllAdmins(currentAdmin, options)

      expect(result.pagination.currentPage).toBe(2)
      expect(result.pagination.limit).toBe(5)
      expect(result.pagination.totalPages).toBe(2)
      expect(result.pagination.hasNextPage).toBe(false)
      expect(result.pagination.hasPrevPage).toBe(true)
    })

    it('應該處理角色篩選', async () => {
      const currentAdmin = TestDataFactory.createAdmin({ role: 'system_admin' })
      const options = { role: 'brand_admin' }

      Admin.countDocuments.mockResolvedValue(1)
      Admin.find.mockReturnValue({
        select: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              populate: vi.fn().mockReturnValue({
                sort: vi.fn().mockReturnValue({
                  skip: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([])
                  })
                })
              })
            })
          })
        })
      })

      await adminService.getAllAdmins(currentAdmin, options)

      expect(Admin.find).toHaveBeenCalledWith({ role: 'brand_admin' })
    })

    it('應該過濾掉系統管理員角色的篩選請求', async () => {
      const currentAdmin = TestDataFactory.createAdmin({ role: 'system_admin' })
      const options = { role: 'primary_system_admin', brandId: 'brand-123' } // 需要 brandId 才會觸發早期返回

      const result = await adminService.getAllAdmins(currentAdmin, options)

      expect(result.admins).toEqual([])
      expect(result.pagination.total).toBe(0)
    })
  })

  describe('getAdminById', () => {
    it('應該成功獲取管理員資訊', async () => {
      const currentAdmin = TestDataFactory.createAdmin({ role: 'system_admin' })
      const targetAdmin = TestDataFactory.createAdmin()

      Admin.findById.mockReturnValue({
        select: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              populate: vi.fn().mockResolvedValue(targetAdmin)
            })
          })
        })
      })

      const result = await adminService.getAdminById('admin-id', currentAdmin)

      expect(result).toEqual(targetAdmin)
      expect(Admin.findById).toHaveBeenCalledWith('admin-id')
    })

    it('應該在管理員不存在時拋出錯誤', async () => {
      const currentAdmin = TestDataFactory.createAdmin({ role: 'system_admin' })

      Admin.findById.mockReturnValue({
        select: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              populate: vi.fn().mockResolvedValue(null)
            })
          })
        })
      })

      await expect(adminService.getAdminById('non-existent-id', currentAdmin))
        .rejects.toThrow('管理員不存在')
    })

    it('應該檢查品牌權限', async () => {
      const currentAdmin = TestDataFactory.createAdmin({ 
        role: 'brand_admin',
        brand: 'brand-123'
      })
      const targetAdmin = TestDataFactory.createAdmin({ 
        brand: { toString: () => 'brand-456' }
      })

      Admin.findById.mockReturnValue({
        select: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              populate: vi.fn().mockResolvedValue(targetAdmin)
            })
          })
        })
      })

      await expect(adminService.getAdminById('admin-id', currentAdmin))
        .rejects.toThrow('無權查看此管理員')
    })

    it('應該檢查店鋪權限', async () => {
      const currentAdmin = TestDataFactory.createAdmin({ 
        role: 'store_admin',
        store: 'store-123'
      })
      const targetAdmin = TestDataFactory.createAdmin({ 
        store: { toString: () => 'store-456' }
      })

      Admin.findById.mockReturnValue({
        select: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              populate: vi.fn().mockResolvedValue(targetAdmin)
            })
          })
        })
      })

      await expect(adminService.getAdminById('admin-id', currentAdmin))
        .rejects.toThrow('無權查看此管理員')
    })
  })

  describe('createAdmin', () => {
    it('應該成功創建管理員', async () => {
      const currentAdmin = TestDataFactory.createAdmin({ role: 'system_admin' })
      const adminData = {
        name: 'New Admin',
        password: 'password123',
        role: 'brand_admin',
        brand: 'brand-123'
      }

      // Mock 唯一性檢查 - 第一次查詢返回 null (名稱不存在)
      Admin.findOne.mockResolvedValueOnce(null)
      // Mock 主管理員衝突檢查 - 第二次查詢返回 null (沒有衝突)
      Admin.findOne.mockResolvedValueOnce(null)
      Brand.findById.mockResolvedValue(TestDataFactory.createBrand())
      
      // 確保構造函數正確創建實例
      AdminConstructor.mockImplementationOnce((data) => ({
        ...data,
        _id: 'mock-admin-id',
        save: vi.fn().mockResolvedValue(),
        deleteOne: vi.fn().mockResolvedValue(),
        toObject: vi.fn().mockReturnValue({ ...data, _id: 'mock-admin-id' })
      }))

      const result = await adminService.createAdmin(currentAdmin, adminData)

      expect(Admin).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Admin',
        role: 'brand_admin',
        brand: 'brand-123',
        createdBy: currentAdmin._id
      }))
      expect(result).toEqual(expect.objectContaining({
        name: 'New Admin',
        role: 'brand_admin'
      }))
      expect(result.password).toBeUndefined()
    })

    it('應該在缺少必填欄位時拋出錯誤', async () => {
      const currentAdmin = TestDataFactory.createAdmin({ role: 'system_admin' })

      await expect(adminService.createAdmin(currentAdmin, { name: 'Test' }))
        .rejects.toThrow('用戶名、密碼和角色為必填欄位')
    })

    it('應該在角色無效時拋出錯誤', async () => {
      const currentAdmin = TestDataFactory.createAdmin({ role: 'system_admin' })
      const adminData = {
        name: 'New Admin',
        password: 'password123',
        role: 'invalid_role'
      }

      await expect(adminService.createAdmin(currentAdmin, adminData))
        .rejects.toThrow('角色無效')
    })

    it('應該檢查權限是否可以創建該角色', async () => {
      const currentAdmin = TestDataFactory.createAdmin({ role: 'brand_admin' })
      const adminData = {
        name: 'New Admin',
        password: 'password123',
        role: 'system_admin'
      }

      await expect(adminService.createAdmin(currentAdmin, adminData))
        .rejects.toThrow('您無權創建 system_admin 角色的管理員')
    })

    it('應該檢查密碼長度', async () => {
      const currentAdmin = TestDataFactory.createAdmin({ role: 'system_admin' })
      const adminData = {
        name: 'New Admin',
        password: '123',
        role: 'brand_admin'
      }

      await expect(adminService.createAdmin(currentAdmin, adminData))
        .rejects.toThrow('密碼長度至少需要8個字元')
    })

    it('應該檢查用戶名唯一性', async () => {
      const currentAdmin = TestDataFactory.createAdmin({ role: 'system_admin' })
      const adminData = {
        name: 'Existing Admin',
        password: 'password123',
        role: 'brand_admin',
        brand: 'brand-123'
      }

      Admin.findOne.mockResolvedValue(TestDataFactory.createAdmin())
      Brand.findById.mockResolvedValue(TestDataFactory.createBrand())

      await expect(adminService.createAdmin(currentAdmin, adminData))
        .rejects.toThrow('此用戶名在此品牌內已被使用')
    })

    it('應該檢查主管理員衝突', async () => {
      const currentAdmin = TestDataFactory.createAdmin({ role: 'system_admin' })
      const adminData = {
        name: 'New Primary Admin',
        password: 'password123',
        role: 'primary_brand_admin',
        brand: 'brand-123'
      }

      Admin.findOne
        .mockResolvedValueOnce(null) // name uniqueness check
        .mockResolvedValueOnce(TestDataFactory.createAdmin()) // primary role conflict check
      Brand.findById.mockResolvedValue(TestDataFactory.createBrand())

      await expect(adminService.createAdmin(currentAdmin, adminData))
        .rejects.toThrow('此層級已存在主管理員')
    })
  })

  describe('updateAdmin', () => {
    it('應該成功更新管理員', async () => {
      const currentAdmin = TestDataFactory.createAdmin({ role: 'system_admin' })
      const existingAdmin = {
        ...TestDataFactory.createAdmin({ role: 'brand_admin' }), // 確保是非系統級角色
        save: vi.fn().mockResolvedValue(),
        toObject: vi.fn().mockReturnValue(TestDataFactory.createAdmin({ name: 'Updated Admin', role: 'brand_admin' }))
      }
      const updateData = { name: 'Updated Admin' }

      Admin.findById.mockResolvedValue(existingAdmin)
      Admin.findOne.mockResolvedValue(null) // name uniqueness check
      Brand.findById.mockResolvedValue(TestDataFactory.createBrand()) // 品牌存在

      const result = await adminService.updateAdmin('admin-id', currentAdmin, updateData)

      expect(existingAdmin.save).toHaveBeenCalled()
      expect(result).toEqual(expect.objectContaining({ name: 'Updated Admin' }))
      expect(result.password).toBeUndefined()
    })

    it('應該在管理員不存在時拋出錯誤', async () => {
      const currentAdmin = TestDataFactory.createAdmin({ role: 'system_admin' })

      Admin.findById.mockResolvedValue(null)

      await expect(adminService.updateAdmin('non-existent-id', currentAdmin, { name: 'Test' }))
        .rejects.toThrow('管理員不存在')
    })

    it('應該檢查更新權限', async () => {
      const currentAdmin = TestDataFactory.createAdmin({ role: 'brand_admin' })
      const existingAdmin = TestDataFactory.createAdmin({ role: 'system_admin' })

      Admin.findById.mockResolvedValue(existingAdmin)

      await expect(adminService.updateAdmin('admin-id', currentAdmin, { name: 'Test' }))
        .rejects.toThrow('無權編輯此管理員')
    })

    it('應該過濾掉不可更新的欄位', async () => {
      const currentAdmin = TestDataFactory.createAdmin({ role: 'system_admin' })
      const existingAdmin = {
        ...TestDataFactory.createAdmin({ role: 'brand_admin' }), // 確保是非系統級角色
        save: vi.fn().mockResolvedValue(),
        toObject: vi.fn().mockReturnValue(TestDataFactory.createAdmin({ role: 'brand_admin' }))
      }
      const updateData = {
        name: 'Updated Admin',
        password: 'new-password',
        createdBy: 'hacker-id'
      }

      Admin.findById.mockResolvedValue(existingAdmin)
      Admin.findOne.mockResolvedValue(null)
      Brand.findById.mockResolvedValue(TestDataFactory.createBrand()) // 品牌存在

      await adminService.updateAdmin('admin-id', currentAdmin, updateData)

      expect(existingAdmin.name).toBe('Updated Admin')
      expect(existingAdmin.password).not.toBe('new-password')
      expect(existingAdmin.createdBy).not.toBe('hacker-id')
    })
  })

  describe('deleteAdmin', () => {
    it('應該成功刪除管理員', async () => {
      const currentAdmin = TestDataFactory.createAdmin({ role: 'system_admin' })
      const targetAdmin = {
        ...TestDataFactory.createAdmin({ role: 'brand_admin' }),
        deleteOne: vi.fn().mockResolvedValue()
      }

      Admin.findById.mockResolvedValue(targetAdmin)

      const result = await adminService.deleteAdmin('admin-id', currentAdmin)

      expect(targetAdmin.deleteOne).toHaveBeenCalled()
      expect(result).toEqual({ success: true, message: '管理員已刪除' })
    })

    it('應該在管理員不存在時拋出錯誤', async () => {
      const currentAdmin = TestDataFactory.createAdmin({ role: 'system_admin' })

      Admin.findById.mockResolvedValue(null)

      await expect(adminService.deleteAdmin('non-existent-id', currentAdmin))
        .rejects.toThrow('管理員不存在')
    })

    it('應該檢查刪除權限', async () => {
      const currentAdmin = TestDataFactory.createAdmin({ role: 'brand_admin' })
      const targetAdmin = TestDataFactory.createAdmin({ role: 'system_admin' })

      Admin.findById.mockResolvedValue(targetAdmin)

      await expect(adminService.deleteAdmin('admin-id', currentAdmin))
        .rejects.toThrow('無權刪除此管理員')
    })

    it('應該防止刪除最後一個系統主管理員', async () => {
      const currentAdmin = TestDataFactory.createAdmin({ role: 'primary_system_admin' })
      const targetAdmin = TestDataFactory.createAdmin({ role: 'primary_system_admin' })

      Admin.findById.mockResolvedValue(targetAdmin)
      Admin.countDocuments.mockResolvedValue(1)

      await expect(adminService.deleteAdmin('admin-id', currentAdmin))
        .rejects.toThrow('無法刪除最後一個系統主管理員')
    })
  })

  describe('toggleAdminStatus', () => {
    it('應該成功切換管理員狀態', async () => {
      const currentAdmin = TestDataFactory.createAdmin({ role: 'system_admin' })
      const targetAdmin = {
        ...TestDataFactory.createAdmin({ role: 'brand_admin' }),
        save: vi.fn().mockResolvedValue(),
        toObject: vi.fn().mockReturnValue(TestDataFactory.createAdmin({ isActive: false }))
      }

      Admin.findById.mockResolvedValue(targetAdmin)

      const result = await adminService.toggleAdminStatus('admin-id', currentAdmin, false)

      expect(targetAdmin.isActive).toBe(false)
      expect(targetAdmin.save).toHaveBeenCalled()
      expect(result.password).toBeUndefined()
    })

    it('應該在管理員不存在時拋出錯誤', async () => {
      const currentAdmin = TestDataFactory.createAdmin({ role: 'system_admin' })

      Admin.findById.mockResolvedValue(null)

      await expect(adminService.toggleAdminStatus('non-existent-id', currentAdmin, false))
        .rejects.toThrow('管理員不存在')
    })

    it('應該檢查操作權限', async () => {
      const currentAdmin = TestDataFactory.createAdmin({ role: 'brand_admin' })
      const targetAdmin = TestDataFactory.createAdmin({ role: 'system_admin' })

      Admin.findById.mockResolvedValue(targetAdmin)

      await expect(adminService.toggleAdminStatus('admin-id', currentAdmin, false))
        .rejects.toThrow('無權操作此管理員')
    })

    it('應該防止停用最後一個系統主管理員', async () => {
      const currentAdmin = TestDataFactory.createAdmin({ role: 'primary_system_admin' })
      const targetAdmin = TestDataFactory.createAdmin({ role: 'primary_system_admin' })

      Admin.findById.mockResolvedValue(targetAdmin)
      Admin.countDocuments.mockResolvedValue(1)

      await expect(adminService.toggleAdminStatus('admin-id', currentAdmin, false))
        .rejects.toThrow('無法停用最後一個系統主管理員')
    })
  })
})