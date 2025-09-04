import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TestDataFactory } from '../../../../setup.js'

// Mock 外部依賴
const mockCouponTemplate = vi.fn().mockImplementation((data) => ({
  ...data,
  save: vi.fn().mockResolvedValue(),
  deleteOne: vi.fn().mockResolvedValue()
}))

// 設置靜態方法
mockCouponTemplate.find = vi.fn().mockReturnValue({
  sort: vi.fn().mockResolvedValue([])
})
mockCouponTemplate.findOne = vi.fn()
mockCouponTemplate.findById = vi.fn()

const mockCouponInstance = vi.fn().mockImplementation((data) => ({
  ...data,
  save: vi.fn().mockResolvedValue()
}))

// 設置靜態方法
mockCouponInstance.find = vi.fn().mockReturnValue({
  populate: vi.fn().mockReturnThis(),
  sort: vi.fn().mockReturnThis(),
  skip: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([])
})
mockCouponInstance.findOne = vi.fn()
mockCouponInstance.countDocuments = vi.fn()
mockCouponInstance.aggregate = vi.fn()

const mockMongoose = {
  Types: {
    ObjectId: vi.fn()
  }
}

vi.mock('@server/models/Promotion/CouponTemplate.js', () => ({ default: mockCouponTemplate }))
vi.mock('@server/models/Promotion/CouponInstance.js', () => ({ default: mockCouponInstance }))
vi.mock('mongoose', () => ({ default: mockMongoose, ...mockMongoose }))

// 動態導入服務
const couponService = await import('@server/services/promotion/couponService.js')
const { AppError } = await import('@server/middlewares/error.js')

// 擴展 TestDataFactory，增加優惠券相關的測試資料生成器
TestDataFactory.createCouponTemplate = (overrides = {}) => {
  return {
    _id: '507f1f77bcf86cd799439020',
    brand: '507f1f77bcf86cd799439013',
    name: '測試優惠券',
    description: '測試用優惠券',
    discountInfo: {
      discountType: 'percentage',
      discountValue: 10,
      maxDiscountAmount: 100,
      minPurchaseAmount: 200
    },
    validityPeriod: 30,
    isActive: true,
    totalIssued: 0,
    createdAt: new Date(),
    save: vi.fn().mockResolvedValue(),
    deleteOne: vi.fn().mockResolvedValue(),
    ...overrides
  }
}

TestDataFactory.createCouponInstance = (overrides = {}) => {
  return {
    _id: '507f1f77bcf86cd799439021',
    brand: '507f1f77bcf86cd799439013',
    template: '507f1f77bcf86cd799439020',
    couponName: '測試優惠券',
    discountInfo: {
      discountType: 'percentage',
      discountValue: 10,
      maxDiscountAmount: 100,
      minPurchaseAmount: 200
    },
    user: '507f1f77bcf86cd799439011',
    isUsed: false,
    usedAt: null,
    order: null,
    acquiredAt: new Date(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    issuedBy: '507f1f77bcf86cd799439012',
    issueReason: '活動獎勵',
    save: vi.fn().mockResolvedValue(),
    ...overrides
  }
}

describe('CouponService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 重置 mongoose ObjectId mock
    mockMongoose.Types.ObjectId.mockImplementation((id) => id || '507f1f77bcf86cd799439011')
    
    // 重置構造函數mock
    mockCouponTemplate.mockImplementation((data) => ({
      ...data,
      save: vi.fn().mockResolvedValue(),
      deleteOne: vi.fn().mockResolvedValue()
    }))
    
    mockCouponInstance.mockImplementation((data) => ({
      ...data,
      save: vi.fn().mockResolvedValue()
    }))
  })

  describe('getAllCouponTemplates', () => {
    it('should get all coupon templates for a brand successfully', async () => {
      const brandId = '507f1f77bcf86cd799439013'
      const mockTemplates = [
        TestDataFactory.createCouponTemplate({ brand: brandId }),
        TestDataFactory.createCouponTemplate({ brand: brandId, name: '另一個優惠券' })
      ]

      const mockQuery = {
        sort: vi.fn().mockResolvedValue(mockTemplates)
      }
      mockCouponTemplate.find.mockReturnValue(mockQuery)

      const result = await couponService.getAllCouponTemplates(brandId)

      expect(mockCouponTemplate.find).toHaveBeenCalledWith({ brand: brandId })
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 })
      expect(result).toEqual(mockTemplates)
    })

    it('should return empty array when no templates found', async () => {
      const brandId = '507f1f77bcf86cd799439013'
      
      const mockQuery = {
        sort: vi.fn().mockResolvedValue([])
      }
      mockCouponTemplate.find.mockReturnValue(mockQuery)

      const result = await couponService.getAllCouponTemplates(brandId)

      expect(result).toEqual([])
    })
  })

  describe('getCouponTemplateById', () => {
    it('should get coupon template by ID successfully', async () => {
      const templateId = '507f1f77bcf86cd799439020'
      const brandId = '507f1f77bcf86cd799439013'
      const mockTemplate = TestDataFactory.createCouponTemplate({ _id: templateId, brand: brandId })

      mockCouponTemplate.findOne.mockResolvedValue(mockTemplate)

      const result = await couponService.getCouponTemplateById(templateId, brandId)

      expect(mockCouponTemplate.findOne).toHaveBeenCalledWith({
        _id: templateId,
        brand: brandId
      })
      expect(result).toEqual(mockTemplate)
    })

    it('should throw error when template not found', async () => {
      const templateId = 'invalid_id'
      const brandId = '507f1f77bcf86cd799439013'

      mockCouponTemplate.findOne.mockResolvedValue(null)

      await expect(couponService.getCouponTemplateById(templateId, brandId))
        .rejects
        .toThrow('優惠券模板不存在或無權訪問')
    })
  })

  describe('getCouponInstanceStatsByTemplate', () => {
    it('should get coupon instance stats successfully', async () => {
      const templateId = '507f1f77bcf86cd799439020'
      const brandId = '507f1f77bcf86cd799439013'
      const mockTemplate = TestDataFactory.createCouponTemplate({ _id: templateId, brand: brandId })
      const mockStats = [{
        _id: null,
        totalIssued: 100,
        totalUsed: 30,
        totalExpired: 10,
        totalActive: 60
      }]

      mockCouponTemplate.findOne.mockResolvedValue(mockTemplate)
      mockCouponInstance.aggregate.mockResolvedValue(mockStats)

      const result = await couponService.getCouponInstanceStatsByTemplate(templateId, brandId)

      expect(mockCouponTemplate.findOne).toHaveBeenCalledWith({
        _id: templateId,
        brand: brandId
      })
      expect(result.template.id).toBe(templateId)
      expect(result.stats.totalIssued).toBe(100)
      expect(result.stats.usageRate).toBe(30) // 30/100 * 100
    })

    it('should throw error when template not found', async () => {
      const templateId = 'invalid_id'
      const brandId = '507f1f77bcf86cd799439013'

      mockCouponTemplate.findOne.mockResolvedValue(null)

      await expect(couponService.getCouponInstanceStatsByTemplate(templateId, brandId))
        .rejects
        .toThrow('優惠券模板不存在或無權訪問')
    })

    it('should handle empty stats correctly', async () => {
      const templateId = '507f1f77bcf86cd799439020'
      const brandId = '507f1f77bcf86cd799439013'
      const mockTemplate = TestDataFactory.createCouponTemplate({ _id: templateId, brand: brandId })

      mockCouponTemplate.findOne.mockResolvedValue(mockTemplate)
      mockCouponInstance.aggregate.mockResolvedValue([]) // 沒有統計資料

      const result = await couponService.getCouponInstanceStatsByTemplate(templateId, brandId)

      expect(result.stats).toEqual({
        totalIssued: 0,
        totalUsed: 0,
        totalExpired: 0,
        totalActive: 0,
        usageRate: 0
      })
    })
  })

  describe('createCouponTemplate', () => {
    it('should create coupon template successfully', async () => {
      const templateData = {
        brand: '507f1f77bcf86cd799439013',
        name: '新優惠券',
        description: '新優惠券描述',
        discountInfo: {
          discountType: 'fixed',
          discountValue: 50,
          minPurchaseAmount: 300
        },
        validityPeriod: 30
      }
      
      const mockCreatedTemplate = TestDataFactory.createCouponTemplate(templateData)
      
      // Mock 模型建構函數的返回值
      mockCouponTemplate.mockReturnValueOnce(mockCreatedTemplate)

      const result = await couponService.createCouponTemplate(templateData)

      expect(result).toEqual(mockCreatedTemplate)
    })

    it('should throw error when name is missing', async () => {
      const templateData = {
        validityPeriod: 30,
        discountInfo: {
          discountType: 'percentage',
          discountValue: 10
        }
      }

      await expect(couponService.createCouponTemplate(templateData))
        .rejects
        .toThrow('名稱和有效期為必填欄位')
    })

    it('should throw error when validityPeriod is missing', async () => {
      const templateData = {
        name: '測試優惠券',
        discountInfo: {
          discountType: 'percentage',
          discountValue: 10
        }
      }

      await expect(couponService.createCouponTemplate(templateData))
        .rejects
        .toThrow('名稱和有效期為必填欄位')
    })

    it('should throw error when discountInfo is missing', async () => {
      const templateData = {
        name: '測試優惠券',
        validityPeriod: 30
      }

      await expect(couponService.createCouponTemplate(templateData))
        .rejects
        .toThrow('折扣券必須提供折扣類型和折扣值')
    })
  })

  describe('updateCouponTemplate', () => {
    it('should update coupon template successfully', async () => {
      const templateId = '507f1f77bcf86cd799439020'
      const brandId = '507f1f77bcf86cd799439013'
      const updateData = { name: '更新後的優惠券', description: '更新後的描述' }
      
      const mockTemplate = TestDataFactory.createCouponTemplate({ _id: templateId, brand: brandId })
      
      mockCouponTemplate.findOne.mockResolvedValue(mockTemplate)

      const result = await couponService.updateCouponTemplate(templateId, updateData, brandId)

      expect(mockCouponTemplate.findOne).toHaveBeenCalledWith({
        _id: templateId,
        brand: brandId
      })
      expect(mockTemplate.name).toBe(updateData.name)
      expect(mockTemplate.save).toHaveBeenCalled()
      expect(result).toEqual(mockTemplate)
    })

    it('should throw error when template not found', async () => {
      const templateId = 'invalid_id'
      const brandId = '507f1f77bcf86cd799439013'
      const updateData = { name: '更新後的優惠券' }

      mockCouponTemplate.findOne.mockResolvedValue(null)

      await expect(couponService.updateCouponTemplate(templateId, updateData, brandId))
        .rejects
        .toThrow('優惠券模板不存在或無權訪問')
    })

    it('should prevent changing brand', async () => {
      const templateId = '507f1f77bcf86cd799439020'
      const brandId = '507f1f77bcf86cd799439013'
      const originalBrandId = brandId
      const updateData = { 
        name: '更新後的優惠券', 
        brand: 'different_brand_id' // 嘗試更改品牌
      }
      
      const mockTemplate = TestDataFactory.createCouponTemplate({ 
        _id: templateId, 
        brand: originalBrandId 
      })
      
      mockCouponTemplate.findOne.mockResolvedValue(mockTemplate)

      const result = await couponService.updateCouponTemplate(templateId, updateData, brandId)

      // 確認品牌沒有被更改
      expect(result.brand).toBe(originalBrandId)
      expect(result.name).toBe('更新後的優惠券')
    })
  })

  describe('deleteCouponTemplate', () => {
    it('should delete coupon template successfully', async () => {
      const templateId = '507f1f77bcf86cd799439020'
      const brandId = '507f1f77bcf86cd799439013'
      
      const mockTemplate = TestDataFactory.createCouponTemplate({ _id: templateId, brand: brandId })
      
      mockCouponTemplate.findOne.mockResolvedValue(mockTemplate)
      mockCouponInstance.countDocuments.mockResolvedValue(0) // 沒有活躍的實例

      const result = await couponService.deleteCouponTemplate(templateId, brandId)

      expect(mockCouponTemplate.findOne).toHaveBeenCalledWith({
        _id: templateId,
        brand: brandId
      })
      expect(mockCouponInstance.countDocuments).toHaveBeenCalledWith({
        template: templateId,
        isUsed: false
      })
      expect(mockTemplate.deleteOne).toHaveBeenCalled()
      expect(result).toEqual({ success: true, message: '優惠券模板已刪除' })
    })

    it('should throw error when template not found', async () => {
      const templateId = 'invalid_id'
      const brandId = '507f1f77bcf86cd799439013'

      mockCouponTemplate.findOne.mockResolvedValue(null)

      await expect(couponService.deleteCouponTemplate(templateId, brandId))
        .rejects
        .toThrow('優惠券模板不存在或無權訪問')
    })

    it('should throw error when active instances exist', async () => {
      const templateId = '507f1f77bcf86cd799439020'
      const brandId = '507f1f77bcf86cd799439013'
      
      const mockTemplate = TestDataFactory.createCouponTemplate({ _id: templateId, brand: brandId })
      
      mockCouponTemplate.findOne.mockResolvedValue(mockTemplate)
      mockCouponInstance.countDocuments.mockResolvedValue(5) // 有5個活躍的實例

      await expect(couponService.deleteCouponTemplate(templateId, brandId))
        .rejects
        .toThrow('還有未使用的優惠券實例，無法刪除模板')
    })
  })

  describe('getUserCoupons', () => {
    it('should get user coupons successfully', async () => {
      const userId = '507f1f77bcf86cd799439011'
      const brandId = '507f1f77bcf86cd799439013'
      const mockCoupons = [
        TestDataFactory.createCouponInstance({ user: userId, brand: brandId }),
        TestDataFactory.createCouponInstance({ user: userId, brand: brandId })
      ]

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue(mockCoupons)
      }

      mockCouponInstance.find.mockReturnValue(mockQuery)

      const result = await couponService.getUserCoupons(userId, brandId)

      expect(mockCouponInstance.find).toHaveBeenCalledWith({
        user: userId,
        brand: brandId,
        isUsed: false,
        expiryDate: { $gt: expect.any(Date) }
      })
      expect(result).toEqual(mockCoupons)
    })

    it('should include used coupons when includeUsed is true', async () => {
      const userId = '507f1f77bcf86cd799439011'
      const brandId = '507f1f77bcf86cd799439013'
      const options = { includeUsed: true, includeExpired: false }
      
      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue([])
      }

      mockCouponInstance.find.mockReturnValue(mockQuery)

      await couponService.getUserCoupons(userId, brandId, options)

      expect(mockCouponInstance.find).toHaveBeenCalledWith({
        user: userId,
        brand: brandId,
        expiryDate: { $gt: expect.any(Date) }
      })
    })

    it('should include expired coupons when includeExpired is true', async () => {
      const userId = '507f1f77bcf86cd799439011'
      const brandId = '507f1f77bcf86cd799439013'
      const options = { includeUsed: false, includeExpired: true }
      
      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue([])
      }

      mockCouponInstance.find.mockReturnValue(mockQuery)

      await couponService.getUserCoupons(userId, brandId, options)

      expect(mockCouponInstance.find).toHaveBeenCalledWith({
        user: userId,
        brand: brandId,
        isUsed: false
      })
    })
  })

  describe('issueCouponToUser', () => {
    it('should issue coupon to user successfully', async () => {
      const userId = '507f1f77bcf86cd799439011'
      const templateId = '507f1f77bcf86cd799439020'
      const adminId = '507f1f77bcf86cd799439012'
      const reason = '活動獎勵'
      
      const mockTemplate = TestDataFactory.createCouponTemplate({ 
        _id: templateId,
        isActive: true,
        totalIssued: 0
      })
      
      const mockCouponInstance = TestDataFactory.createCouponInstance({
        template: templateId,
        user: userId,
        issuedBy: adminId,
        issueReason: reason
      })

      mockCouponTemplate.findById.mockResolvedValue(mockTemplate)

      const result = await couponService.issueCouponToUser(userId, templateId, adminId, reason)

      expect(mockCouponTemplate.findById).toHaveBeenCalledWith(templateId)
      expect(mockTemplate.totalIssued).toBe(1)
      expect(mockTemplate.save).toHaveBeenCalled()
      expect(result.success).toBe(true)
      expect(result.message).toBe('優惠券發放成功')
    })

    it('should throw error when template not found', async () => {
      const userId = '507f1f77bcf86cd799439011'
      const templateId = 'invalid_id'
      const adminId = '507f1f77bcf86cd799439012'

      mockCouponTemplate.findById.mockResolvedValue(null)

      await expect(couponService.issueCouponToUser(userId, templateId, adminId))
        .rejects
        .toThrow('優惠券模板不存在')
    })

    it('should throw error when template is inactive', async () => {
      const userId = '507f1f77bcf86cd799439011'
      const templateId = '507f1f77bcf86cd799439020'
      const adminId = '507f1f77bcf86cd799439012'
      
      const mockTemplate = TestDataFactory.createCouponTemplate({ 
        _id: templateId,
        isActive: false // 模板已停用
      })

      mockCouponTemplate.findById.mockResolvedValue(mockTemplate)

      await expect(couponService.issueCouponToUser(userId, templateId, adminId))
        .rejects
        .toThrow('優惠券模板已停用')
    })
  })

  describe('useCoupon', () => {
    it('should use coupon successfully', async () => {
      const couponId = '507f1f77bcf86cd799439021'
      const userId = '507f1f77bcf86cd799439011'
      const brandId = '507f1f77bcf86cd799439013'
      const orderId = '507f1f77bcf86cd799439017'
      
      const mockCoupon = TestDataFactory.createCouponInstance({
        _id: couponId,
        user: userId,
        brand: brandId,
        isUsed: false,
        expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10天後過期
      })

      mockCouponInstance.findOne.mockResolvedValue(mockCoupon)

      const result = await couponService.useCoupon(couponId, userId, brandId, orderId)

      expect(mockCouponInstance.findOne).toHaveBeenCalledWith({
        _id: couponId,
        user: userId,
        brand: brandId
      })
      expect(mockCoupon.isUsed).toBe(true)
      expect(mockCoupon.usedAt).toBeInstanceOf(Date)
      expect(mockCoupon.order).toBe(orderId)
      expect(mockCoupon.save).toHaveBeenCalled()
      expect(result.success).toBe(true)
      expect(result.message).toBe('優惠券使用成功')
    })

    it('should throw error when coupon not found', async () => {
      const couponId = 'invalid_id'
      const userId = '507f1f77bcf86cd799439011'
      const brandId = '507f1f77bcf86cd799439013'

      mockCouponInstance.findOne.mockResolvedValue(null)

      await expect(couponService.useCoupon(couponId, userId, brandId))
        .rejects
        .toThrow('優惠券不存在或無權使用')
    })

    it('should throw error when coupon is already used', async () => {
      const couponId = '507f1f77bcf86cd799439021'
      const userId = '507f1f77bcf86cd799439011'
      const brandId = '507f1f77bcf86cd799439013'
      
      const mockCoupon = TestDataFactory.createCouponInstance({
        _id: couponId,
        user: userId,
        brand: brandId,
        isUsed: true // 已經使用過
      })

      mockCouponInstance.findOne.mockResolvedValue(mockCoupon)

      await expect(couponService.useCoupon(couponId, userId, brandId))
        .rejects
        .toThrow('優惠券已使用')
    })

    it('should throw error when coupon is expired', async () => {
      const couponId = '507f1f77bcf86cd799439021'
      const userId = '507f1f77bcf86cd799439011'
      const brandId = '507f1f77bcf86cd799439013'
      
      const mockCoupon = TestDataFactory.createCouponInstance({
        _id: couponId,
        user: userId,
        brand: brandId,
        isUsed: false,
        expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // 昨天就過期了
      })

      mockCouponInstance.findOne.mockResolvedValue(mockCoupon)

      await expect(couponService.useCoupon(couponId, userId, brandId))
        .rejects
        .toThrow('優惠券已過期')
    })
  })

  describe('getUserCouponsAdmin', () => {
    it('should get user coupons for admin successfully with pagination', async () => {
      const userId = '507f1f77bcf86cd799439011'
      const brandId = '507f1f77bcf86cd799439013'
      const options = { page: 1, limit: 20 }
      const mockCoupons = [
        TestDataFactory.createCouponInstance({ user: userId, brand: brandId }),
        TestDataFactory.createCouponInstance({ user: userId, brand: brandId })
      ]

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockCoupons)
      }

      mockCouponInstance.find.mockReturnValue(mockQuery)
      mockCouponInstance.countDocuments.mockResolvedValue(50) // 總共50筆記錄

      const result = await couponService.getUserCouponsAdmin(userId, brandId, options)

      expect(mockCouponInstance.find).toHaveBeenCalledWith({
        user: userId,
        brand: brandId
      })
      expect(result.coupons).toEqual(mockCoupons)
      expect(result.pagination).toEqual({
        total: 50,
        page: 1,
        limit: 20,
        totalPages: 3
      })
    })

    it('should filter used coupons when includeUsed is false', async () => {
      const userId = '507f1f77bcf86cd799439011'
      const brandId = '507f1f77bcf86cd799439013'
      const options = { includeUsed: false, includeExpired: true }

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([])
      }

      mockCouponInstance.find.mockReturnValue(mockQuery)
      mockCouponInstance.countDocuments.mockResolvedValue(0)

      await couponService.getUserCouponsAdmin(userId, brandId, options)

      expect(mockCouponInstance.find).toHaveBeenCalledWith({
        user: userId,
        brand: brandId,
        isUsed: false
      })
    })
  })
})