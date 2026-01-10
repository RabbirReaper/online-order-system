/**
 * 兌換券服務測試
 * 測試兌換券模板和實例的業務邏輯
 */

import { vi } from 'vitest'

// 動態導入測試目標
let voucherService
let AppError
let TestDataFactory

// Mock models - VoucherTemplate 需要作為 constructor function
const createMockTemplateInstance = (data) => ({
  ...data,
  _id: data._id || 'mocked-template-id',
  save: vi.fn().mockResolvedValue({ ...data, _id: data._id || 'mocked-template-id' }),
  deleteOne: vi.fn().mockResolvedValue({ acknowledged: true })
})

const mockVoucherTemplate = vi.fn().mockImplementation((data) => createMockTemplateInstance(data))

// 添加靜態方法
mockVoucherTemplate.find = vi.fn()
mockVoucherTemplate.findOne = vi.fn()
mockVoucherTemplate.countDocuments = vi.fn()
mockVoucherTemplate.create = vi.fn()

const mockVoucherInstance = {
  find: vi.fn(),
  findOne: vi.fn(),
  countDocuments: vi.fn(),
  aggregate: vi.fn(),
  create: vi.fn()
}

const mockBundle = {
  countDocuments: vi.fn()
}

const mockDishTemplate = {
  find: vi.fn()
}

const mockMongoose = {
  Types: {
    ObjectId: vi.fn().mockImplementation((id) => id || 'mocked-object-id')
  }
}

// Mock設置
vi.mock('../../../../../server/models/Promotion/VoucherTemplate.js', () => ({ default: mockVoucherTemplate }))
vi.mock('../../../../../server/models/Promotion/VoucherInstance.js', () => ({ default: mockVoucherInstance }))
vi.mock('../../../../../server/models/Promotion/Bundle.js', () => ({ default: mockBundle }))
vi.mock('../../../../../server/models/Dish/DishTemplate.js', () => ({ default: mockDishTemplate }))
vi.mock('mongoose', () => ({ default: mockMongoose }))

describe('VoucherService', () => {
  beforeAll(async () => {
    // 動態導入
    const services = await import('../../../../../server/services/promotion/voucherService.js')
    voucherService = services
    
    const errorModule = await import('../../../../../server/middlewares/error.js')
    AppError = errorModule.AppError
    
    const testUtils = await import('../../../../setup.js')
    TestDataFactory = testUtils.TestDataFactory
  })

  beforeEach(() => {
    vi.clearAllMocks()
    // 重置 VoucherTemplate mock 實現
    mockVoucherTemplate.mockImplementation((data) => createMockTemplateInstance(data))
  })

  describe('getAllVoucherTemplates', () => {
    it('should get all voucher templates for brand', async () => {
      // Arrange
      const brandId = 'test-brand-id'
      const mockTemplates = [
        { _id: 'template1', name: '測試兌換券1', brand: brandId },
        { _id: 'template2', name: '測試兌換券2', brand: brandId }
      ]
      mockVoucherTemplate.find.mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockTemplates)
      })

      // Act
      const result = await voucherService.getAllVoucherTemplates(brandId)

      // Assert
      expect(mockVoucherTemplate.find).toHaveBeenCalledWith({ brand: brandId })
      expect(result).toEqual(mockTemplates)
    })
  })

  describe('getVoucherTemplateById', () => {
    it('should get voucher template by id successfully', async () => {
      // Arrange
      const templateId = 'template-id'
      const brandId = 'brand-id'
      const mockTemplate = { 
        _id: templateId, 
        name: '測試兌換券', 
        brand: brandId 
      }
      mockVoucherTemplate.findOne.mockResolvedValue(mockTemplate)

      // Act
      const result = await voucherService.getVoucherTemplateById(templateId, brandId)

      // Assert
      expect(mockVoucherTemplate.findOne).toHaveBeenCalledWith({
        _id: templateId,
        brand: brandId
      })
      expect(result).toEqual(mockTemplate)
    })

    it('should throw error when template not found', async () => {
      // Arrange
      mockVoucherTemplate.findOne.mockResolvedValue(null)

      // Act & Assert
      await expect(
        voucherService.getVoucherTemplateById('invalid-id', 'brand-id')
      ).rejects.toThrow('兌換券模板不存在或無權訪問')
    })
  })

  describe('getVoucherInstanceStatsByTemplate', () => {
    it('should get voucher instance stats successfully', async () => {
      // Arrange
      const templateId = 'template-id'
      const brandId = 'brand-id'
      const mockTemplate = { 
        _id: templateId, 
        name: '測試兌換券', 
        description: '測試描述',
        isActive: true,
        brand: brandId 
      }
      const mockStats = {
        totalIssued: 100,
        totalUsed: 60,
        totalExpired: 10,
        totalActive: 30,
        usageRate: 60
      }

      mockVoucherTemplate.findOne.mockResolvedValue(mockTemplate)
      mockVoucherInstance.aggregate.mockResolvedValue([mockStats])

      // Act
      const result = await voucherService.getVoucherInstanceStatsByTemplate(templateId, brandId)

      // Assert
      expect(mockVoucherTemplate.findOne).toHaveBeenCalledWith({
        _id: templateId,
        brand: brandId
      })
      expect(result.template.name).toBe('測試兌換券')
      expect(result.stats.usageRate).toBe(60)
    })

    it('should throw error when template not found for stats', async () => {
      // Arrange
      mockVoucherTemplate.findOne.mockResolvedValue(null)

      // Act & Assert
      await expect(
        voucherService.getVoucherInstanceStatsByTemplate('invalid-id', 'brand-id')
      ).rejects.toThrow('兌換券模板不存在或無權訪問')
    })

    it('should handle empty stats correctly', async () => {
      // Arrange
      const templateId = 'template-id'
      const brandId = 'brand-id'
      const mockTemplate = { 
        _id: templateId, 
        name: '測試兌換券', 
        description: '測試描述',
        isActive: true,
        brand: brandId 
      }

      mockVoucherTemplate.findOne.mockResolvedValue(mockTemplate)
      mockVoucherInstance.aggregate.mockResolvedValue([]) // 空結果

      // Act
      const result = await voucherService.getVoucherInstanceStatsByTemplate(templateId, brandId)

      // Assert
      expect(result.stats).toEqual({
        totalIssued: 0,
        totalUsed: 0,
        totalExpired: 0,
        totalActive: 0,
        usageRate: 0
      })
    })
  })

  describe('createVoucherTemplate', () => {
    it('should create voucher template successfully', async () => {
      // Arrange
      const templateData = {
        brand: 'brand-id',
        name: '新兌換券',
        description: '測試描述',
        exchangeDishTemplate: 'dish-id',
        isActive: true
      }
      const mockTemplate = { ...templateData, _id: 'new-template-id' }

      // Act
      const result = await voucherService.createVoucherTemplate(templateData)

      // Assert
      expect(mockVoucherTemplate).toHaveBeenCalledWith(templateData)
      expect(result._id).toBe('mocked-template-id')
    })

    it('should throw error when name is missing', async () => {
      // Arrange
      const templateData = {
        description: '測試描述',
        exchangeDishTemplate: 'dish-id'
      }

      // Act & Assert
      await expect(
        voucherService.createVoucherTemplate(templateData)
      ).rejects.toThrow('名稱為必填欄位')
    })

    it('should throw error when exchangeDishTemplate is missing', async () => {
      // Arrange
      const templateData = {
        name: '新兌換券',
        description: '測試描述'
      }

      // Act & Assert
      await expect(
        voucherService.createVoucherTemplate(templateData)
      ).rejects.toThrow('兌換券必須指定可兌換的餐點')
    })
  })

  describe('updateVoucherTemplate', () => {
    it('should update voucher template successfully', async () => {
      // Arrange
      const templateId = 'template-id'
      const brandId = 'brand-id'
      const updateData = { name: '更新後的兌換券', description: '更新描述' }
      const mockTemplate = {
        _id: templateId,
        name: '原兌換券',
        brand: brandId,
        save: vi.fn().mockResolvedValue(true)
      }
      mockVoucherTemplate.findOne.mockResolvedValue(mockTemplate)

      // Act
      const result = await voucherService.updateVoucherTemplate(templateId, updateData, brandId)

      // Assert
      expect(mockVoucherTemplate.findOne).toHaveBeenCalledWith({
        _id: templateId,
        brand: brandId
      })
      expect(mockTemplate.name).toBe('更新後的兌換券')
      expect(mockTemplate.description).toBe('更新描述')
      expect(mockTemplate.save).toHaveBeenCalled()
    })

    it('should throw error when template not found for update', async () => {
      // Arrange
      mockVoucherTemplate.findOne.mockResolvedValue(null)

      // Act & Assert
      await expect(
        voucherService.updateVoucherTemplate('invalid-id', {}, 'brand-id')
      ).rejects.toThrow('兌換券模板不存在或無權訪問')
    })

    it('should prevent brand field from being updated', async () => {
      // Arrange
      const templateId = 'template-id'
      const brandId = 'brand-id'
      const updateData = {
        name: '更新後的兌換券',
        brand: 'malicious-brand-id' // 嘗試更改品牌
      }
      const mockTemplate = {
        _id: templateId,
        name: '原兌換券',
        brand: brandId,
        save: vi.fn().mockResolvedValue(true)
      }
      mockVoucherTemplate.findOne.mockResolvedValue(mockTemplate)

      // Act
      await voucherService.updateVoucherTemplate(templateId, updateData, brandId)

      // Assert
      expect(mockTemplate.brand).toBe(brandId) // 品牌應該保持不變
      expect(mockTemplate.name).toBe('更新後的兌換券') // 其他欄位正常更新
    })

    // === 停用時的依賴檢查測試 ===
    describe('when deactivating voucher template', () => {
      let activeTemplateMock

      beforeEach(() => {
        // 每次測試前創建新的 mock 對象
        activeTemplateMock = {
          _id: 'template123',
          name: 'Active Voucher',
          brand: 'brand123',
          isActive: true,
          save: vi.fn().mockResolvedValue(true)
        }

        mockVoucherTemplate.findOne.mockResolvedValue(activeTemplateMock)
        // 預設無依賴
        mockVoucherInstance.countDocuments.mockResolvedValue(0)
        mockBundle.countDocuments.mockResolvedValue(0)
      })

      it('should throw error when template has active voucher instances', async () => {
        // Arrange
        mockVoucherInstance.countDocuments.mockResolvedValue(3)

        // Act & Assert
        await expect(
          voucherService.updateVoucherTemplate('template123', { isActive: false }, 'brand123')
        ).rejects.toThrow('還有未使用的兌換券實例，無法停用')

        expect(activeTemplateMock.save).not.toHaveBeenCalled()
      })

      it('should throw error when template is used by bundles', async () => {
        // Arrange
        mockBundle.countDocuments.mockResolvedValue(2)

        // Act & Assert
        await expect(
          voucherService.updateVoucherTemplate('template123', { isActive: false }, 'brand123')
        ).rejects.toThrow('此兌換券模板已被 Bundle 使用，無法停用')

        expect(activeTemplateMock.save).not.toHaveBeenCalled()
      })

      it('should perform voucher instance dependency check before deactivation', async () => {
        // Act
        await voucherService.updateVoucherTemplate('template123', { isActive: false }, 'brand123')

        // Assert
        expect(mockVoucherInstance.countDocuments).toHaveBeenCalledWith({
          template: 'template123',
          isUsed: false
        })
      })

      it('should perform bundle dependency check before deactivation', async () => {
        // Act
        await voucherService.updateVoucherTemplate('template123', { isActive: false }, 'brand123')

        // Assert
        expect(mockBundle.countDocuments).toHaveBeenCalledWith({
          'bundleItems.voucherTemplate': 'template123'
        })
      })

      it('should check voucher instances before bundles', async () => {
        // Act
        await voucherService.updateVoucherTemplate('template123', { isActive: false }, 'brand123')

        // Assert
        const voucherInstanceCall = mockVoucherInstance.countDocuments.mock.invocationCallOrder[0]
        const bundleCall = mockBundle.countDocuments.mock.invocationCallOrder[0]

        expect(voucherInstanceCall).toBeLessThan(bundleCall)
      })

      it('should successfully deactivate when no dependencies exist', async () => {
        // Act
        const result = await voucherService.updateVoucherTemplate('template123', { isActive: false }, 'brand123')

        // Assert
        expect(mockVoucherInstance.countDocuments).toHaveBeenCalledWith({
          template: 'template123',
          isUsed: false
        })
        expect(mockBundle.countDocuments).toHaveBeenCalledWith({
          'bundleItems.voucherTemplate': 'template123'
        })
        expect(activeTemplateMock.save).toHaveBeenCalled()
        expect(activeTemplateMock.isActive).toBe(false)
      })

      it('should allow activating without dependency checks', async () => {
        // Arrange - 創建一個停用的模板
        const inactiveTemplateMock = {
          _id: 'template123',
          name: 'Inactive Voucher',
          brand: 'brand123',
          isActive: false,
          save: vi.fn().mockResolvedValue(true)
        }

        mockVoucherTemplate.findOne.mockResolvedValue(inactiveTemplateMock)

        // Act
        await voucherService.updateVoucherTemplate('template123', { isActive: true }, 'brand123')

        // Assert - 不應該檢查依賴
        expect(mockVoucherInstance.countDocuments).not.toHaveBeenCalled()
        expect(mockBundle.countDocuments).not.toHaveBeenCalled()
        expect(inactiveTemplateMock.save).toHaveBeenCalled()
      })

      it('should allow updating other fields without dependency checks', async () => {
        // Arrange
        const updateData = {
          name: 'Updated Name',
          description: 'Updated Description'
        }

        // Act
        await voucherService.updateVoucherTemplate('template123', updateData, 'brand123')

        // Assert - 不應該檢查依賴
        expect(mockVoucherInstance.countDocuments).not.toHaveBeenCalled()
        expect(mockBundle.countDocuments).not.toHaveBeenCalled()
        expect(activeTemplateMock.save).toHaveBeenCalled()
      })

      it('should reject for voucher instance dependency before checking bundles', async () => {
        // Arrange
        mockVoucherInstance.countDocuments.mockResolvedValue(5)
        mockBundle.countDocuments.mockResolvedValue(2)

        // Act & Assert
        await expect(
          voucherService.updateVoucherTemplate('template123', { isActive: false }, 'brand123')
        ).rejects.toThrow('還有未使用的兌換券實例，無法停用')

        // Bundle 檢查不應該執行
        expect(mockBundle.countDocuments).not.toHaveBeenCalled()
      })
    })
  })

  describe('deleteVoucherTemplate', () => {
    it('should delete voucher template successfully', async () => {
      // Arrange
      const templateId = 'template-id'
      const brandId = 'brand-id'
      const mockTemplate = {
        _id: templateId,
        brand: brandId,
        deleteOne: vi.fn().mockResolvedValue({ acknowledged: true })
      }
      mockVoucherTemplate.findOne.mockResolvedValue(mockTemplate)
      mockVoucherInstance.countDocuments.mockResolvedValue(0) // 沒有未使用的實例
      mockBundle.countDocuments.mockResolvedValue(0) // 沒有關聯的 Bundle

      // Act
      const result = await voucherService.deleteVoucherTemplate(templateId, brandId)

      // Assert
      expect(result.success).toBe(true)
      expect(result.message).toBe('兌換券模板已刪除')
      expect(mockTemplate.deleteOne).toHaveBeenCalled()
    })

    it('should throw error when template not found for deletion', async () => {
      // Arrange
      mockVoucherTemplate.findOne.mockResolvedValue(null)

      // Act & Assert
      await expect(
        voucherService.deleteVoucherTemplate('invalid-id', 'brand-id')
      ).rejects.toThrow('兌換券模板不存在或無權訪問')
    })

    it('should throw error when active voucher instances exist', async () => {
      // Arrange
      const templateId = 'template-id'
      const brandId = 'brand-id'
      const mockTemplate = { _id: templateId, brand: brandId }
      mockVoucherTemplate.findOne.mockResolvedValue(mockTemplate)
      mockVoucherInstance.countDocuments.mockResolvedValue(5) // 有5個未使用的實例

      // Act & Assert
      await expect(
        voucherService.deleteVoucherTemplate(templateId, brandId)
      ).rejects.toThrow('還有未使用的兌換券實例，無法刪除模板')
    })

    it('should throw error when template is used in bundles', async () => {
      // Arrange
      const templateId = 'template-id'
      const brandId = 'brand-id'
      const mockTemplate = { _id: templateId, brand: brandId }
      mockVoucherTemplate.findOne.mockResolvedValue(mockTemplate)
      mockVoucherInstance.countDocuments.mockResolvedValue(0)
      mockBundle.countDocuments.mockResolvedValue(3) // 有3個相關的 Bundle

      // Act & Assert
      await expect(
        voucherService.deleteVoucherTemplate(templateId, brandId)
      ).rejects.toThrow('此兌換券模板已被 Bundle 使用，無法刪除')
    })
  })

  describe('getAvailableVoucherTemplates', () => {
    it('should get available voucher templates for bundle creation', async () => {
      // Arrange
      const brandId = 'brand-id'
      const mockTemplates = [
        {
          _id: 'template1',
          name: '可用兌換券1',
          description: '描述1',
          exchangeDishTemplate: 'dish1'
        },
        {
          _id: 'template2',
          name: '可用兌換券2',
          description: '描述2',
          exchangeDishTemplate: 'dish2'
        }
      ]
      mockVoucherTemplate.find.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue(mockTemplates)
      })

      // Act
      const result = await voucherService.getAvailableVoucherTemplates(brandId)

      // Assert
      expect(mockVoucherTemplate.find).toHaveBeenCalledWith({
        brand: brandId,
        isActive: true
      })
      expect(result).toEqual(mockTemplates)
    })
  })

  describe('getUserVouchers', () => {
    it('should get user vouchers with default options', async () => {
      // Arrange
      const userId = 'user-id'
      const mockVouchers = [
        { _id: 'voucher1', user: userId, isUsed: false },
        { _id: 'voucher2', user: userId, isUsed: false }
      ]
      mockVoucherInstance.find.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue(mockVouchers)
      })

      // Act
      const result = await voucherService.getUserVouchers(userId)

      // Assert
      expect(mockVoucherInstance.find).toHaveBeenCalledWith({
        user: userId,
        isUsed: false,
        expiryDate: { $gt: expect.any(Date) }
      })
      expect(result).toEqual(mockVouchers)
    })

    it('should include used vouchers when option is set', async () => {
      // Arrange
      const userId = 'user-id'
      const options = { includeUsed: true }
      mockVoucherInstance.find.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue([])
      })

      // Act
      await voucherService.getUserVouchers(userId, options)

      // Assert
      expect(mockVoucherInstance.find).toHaveBeenCalledWith({
        user: userId,
        expiryDate: { $gt: expect.any(Date) }
      })
    })

    it('should include expired vouchers when option is set', async () => {
      // Arrange
      const userId = 'user-id'
      const options = { includeExpired: true }
      mockVoucherInstance.find.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue([])
      })

      // Act
      await voucherService.getUserVouchers(userId, options)

      // Assert
      expect(mockVoucherInstance.find).toHaveBeenCalledWith({
        user: userId,
        isUsed: false
      })
    })
  })

  describe('getUserVouchersAdmin', () => {
    it('should get user vouchers with pagination for admin', async () => {
      // Arrange
      const userId = 'user-id'
      const brandId = 'brand-id'
      const mockVouchers = [
        { _id: 'voucher1', user: userId, brand: brandId }
      ]
      mockVoucherInstance.find.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockVouchers)
      })
      mockVoucherInstance.countDocuments.mockResolvedValue(25)

      // Act
      const result = await voucherService.getUserVouchersAdmin(userId, brandId)

      // Assert
      expect(result.vouchers).toEqual(mockVouchers)
      expect(result.pagination.total).toBe(25)
      expect(result.pagination.totalPages).toBe(2) // ceil(25/20)
    })

    it('should apply custom pagination parameters', async () => {
      // Arrange
      const userId = 'user-id'
      const brandId = 'brand-id'
      const options = { page: 2, limit: 10 }
      mockVoucherInstance.find.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([])
      })
      mockVoucherInstance.countDocuments.mockResolvedValue(0)

      // Act
      await voucherService.getUserVouchersAdmin(userId, brandId, options)

      // Assert
      const findCall = mockVoucherInstance.find()
      expect(findCall.skip).toHaveBeenCalledWith(10) // (page-1) * limit = (2-1) * 10
      expect(findCall.limit).toHaveBeenCalledWith(10)
    })
  })

  describe('useVoucher', () => {
    it('should use voucher successfully', async () => {
      // Arrange
      const voucherId = 'voucher-id'
      const userId = 'user-id'
      const orderId = 'order-id'
      const mockVoucher = {
        _id: voucherId,
        user: userId,
        isUsed: false,
        expiryDate: new Date(Date.now() + 86400000), // 明天過期
        save: vi.fn().mockResolvedValue(true)
      }
      mockVoucherInstance.findOne.mockResolvedValue(mockVoucher)

      // Act
      const result = await voucherService.useVoucher(voucherId, userId, orderId)

      // Assert
      expect(result.success).toBe(true)
      expect(result.message).toBe('兌換券使用成功')
      expect(mockVoucher.isUsed).toBe(true)
      expect(mockVoucher.usedAt).toBeInstanceOf(Date)
      expect(mockVoucher.save).toHaveBeenCalled()
    })

    it('should throw error when voucher not found', async () => {
      // Arrange
      mockVoucherInstance.findOne.mockResolvedValue(null)

      // Act & Assert
      await expect(
        voucherService.useVoucher('invalid-id', 'user-id')
      ).rejects.toThrow('兌換券不存在或無權使用')
    })

    it('should throw error when voucher already used', async () => {
      // Arrange
      const mockVoucher = {
        _id: 'voucher-id',
        user: 'user-id',
        isUsed: true,
        expiryDate: new Date(Date.now() + 86400000)
      }
      mockVoucherInstance.findOne.mockResolvedValue(mockVoucher)

      // Act & Assert
      await expect(
        voucherService.useVoucher('voucher-id', 'user-id')
      ).rejects.toThrow('兌換券已使用')
    })

    it('should throw error when voucher expired', async () => {
      // Arrange
      const mockVoucher = {
        _id: 'voucher-id',
        user: 'user-id',
        isUsed: false,
        expiryDate: new Date(Date.now() - 86400000) // 昨天過期
      }
      mockVoucherInstance.findOne.mockResolvedValue(mockVoucher)

      // Act & Assert
      await expect(
        voucherService.useVoucher('voucher-id', 'user-id')
      ).rejects.toThrow('兌換券已過期')
    })
  })

  describe('autoCreateVoucherTemplatesForDishes', () => {
    it('should auto create voucher templates for dishes without templates', async () => {
      // Arrange
      const brandId = 'brand-id'
      const mockDishes = [
        { _id: 'dish1', name: '餐點1', basePrice: 100 },
        { _id: 'dish2', name: '餐點2', basePrice: 200 },
        { _id: 'dish3', name: '餐點3', basePrice: 150 }
      ]
      const mockExistingTemplates = [
        { exchangeDishTemplate: 'dish1' } // dish1已有模板
      ]
      
      mockDishTemplate.find.mockResolvedValue(mockDishes)
      mockVoucherTemplate.find.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockExistingTemplates)
      })
      
      // Mock新模板創建
      let createdCount = 0
      mockVoucherTemplate.mockImplementation((data) => 
        createMockTemplateInstance({ 
          ...data, 
          _id: `new-template-${++createdCount}` 
        })
      )

      // Act
      const result = await voucherService.autoCreateVoucherTemplatesForDishes(brandId)

      // Assert
      expect(result.success).toBe(true)
      expect(result.statistics.totalDishes).toBe(3)
      expect(result.statistics.existingCount).toBe(1)
      expect(result.statistics.createdCount).toBe(2) // dish2和dish3
      expect(result.statistics.finalTotal).toBe(3)
      expect(result.createdTemplates).toHaveLength(2)
    })

    it('should handle case when all dishes already have voucher templates', async () => {
      // Arrange
      const brandId = 'brand-id'
      const mockDishes = [
        { _id: 'dish1', name: '餐點1' },
        { _id: 'dish2', name: '餐點2' }
      ]
      const mockExistingTemplates = [
        { exchangeDishTemplate: 'dish1' },
        { exchangeDishTemplate: 'dish2' }
      ]
      
      mockDishTemplate.find.mockResolvedValue(mockDishes)
      mockVoucherTemplate.find.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockExistingTemplates)
      })

      // Act
      const result = await voucherService.autoCreateVoucherTemplatesForDishes(brandId)

      // Assert
      expect(result.success).toBe(true)
      expect(result.statistics.createdCount).toBe(0)
      expect(result.createdTemplates).toHaveLength(0)
    })

    it('should handle errors gracefully', async () => {
      // Arrange
      const brandId = 'brand-id'
      mockDishTemplate.find.mockRejectedValue(new Error('Database error'))

      // Act & Assert
      await expect(
        voucherService.autoCreateVoucherTemplatesForDishes(brandId)
      ).rejects.toThrow('自動創建兌換券模板失敗')
    })
  })
})