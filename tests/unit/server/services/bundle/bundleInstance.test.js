/**
 * Bundle 實例服務測試
 * 測試 Bundle 實例相關業務邏輯功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock 所有外部依賴
vi.mock('@server/models/Promotion/BundleInstance.js', () => ({ default: vi.fn() }))
vi.mock('@server/models/Promotion/Bundle.js', () => ({ default: vi.fn() }))
vi.mock('@server/models/Promotion/VoucherTemplate.js', () => ({ default: vi.fn() }))
vi.mock('@server/models/Promotion/VoucherInstance.js', () => ({ default: vi.fn() }))

vi.mock('@server/middlewares/error.js', () => ({
  AppError: class AppError extends Error {
    constructor(message, statusCode = 500) {
      super(message)
      this.statusCode = statusCode
      this.name = 'AppError'
    }
  }
}))

vi.mock('@server/services/promotion/pointService.js', () => ({
  getUserPointsBalance: vi.fn(),
  usePoints: vi.fn()
}))

// 動態導入服務和依賴
const bundleInstanceService = await import('@server/services/bundle/bundleInstance.js')
const BundleInstance = (await import('@server/models/Promotion/BundleInstance.js')).default
const Bundle = (await import('@server/models/Promotion/Bundle.js')).default
const VoucherTemplate = (await import('@server/models/Promotion/VoucherTemplate.js')).default
const VoucherInstance = (await import('@server/models/Promotion/VoucherInstance.js')).default
const { AppError } = await import('@server/middlewares/error.js')
const pointService = await import('@server/services/promotion/pointService.js')

// 測試資料工廠
const TestDataFactory = {
  createBundleInstanceData: (overrides = {}) => ({
    templateId: 'bundle-template-123',
    brand: 'brand-id-123',
    user: 'user-id-123',
    paymentMethod: 'cash',
    finalPrice: 299,
    purchasedAt: new Date(),
    ...overrides
  }),

  createBundleTemplate: (overrides = {}) => ({
    _id: 'bundle-template-123',
    name: 'Test Bundle',
    description: 'Test Bundle Description',
    brand: 'brand-id-123',
    isActive: true,
    cashPrice: {
      original: 399,
      selling: 299
    },
    pointPrice: {
      original: 400,
      selling: 300
    },
    voucherValidityDays: 30,
    bundleItems: [
      {
        quantity: 2,
        voucherName: 'Test Voucher',
        voucherTemplate: {
          _id: 'voucher-template-123',
          name: 'Test Voucher Template',
          exchangeDishTemplate: 'dish-template-123'
        }
      }
    ],
    purchaseLimitPerUser: 5,
    totalSold: 10,
    ...overrides
  }),

  createBundleInstance: (overrides = {}) => ({
    _id: 'bundle-instance-123',
    templateId: 'bundle-template-123',
    brand: 'brand-id-123',
    user: 'user-id-123',
    name: 'Test Bundle',
    description: 'Test Bundle Description',
    paymentMethod: 'cash',
    finalPrice: 299,
    cashPrice: { original: 399, selling: 299 },
    pointPrice: { original: 400, selling: 300 },
    voucherValidityDays: 30,
    bundleItems: [
      {
        quantity: 2,
        voucherName: 'Test Voucher'
      }
    ],
    purchasedAt: new Date(),
    save: vi.fn().mockResolvedValue(),
    deleteOne: vi.fn().mockResolvedValue(),
    ...overrides
  }),

  createVoucherInstance: (overrides = {}) => ({
    _id: 'voucher-instance-123',
    brand: 'brand-id-123',
    template: 'voucher-template-123',
    voucherName: 'Test Voucher',
    exchangeDishTemplate: 'dish-template-123',
    user: 'user-id-123',
    acquiredAt: new Date(),
    createdBy: 'bundle-instance-123',
    expiryDate: new Date(),
    save: vi.fn().mockResolvedValue(),
    ...overrides
  })
}

describe('Bundle實例服務測試', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // 設定 BundleInstance mock
    BundleInstance.mockImplementation(function(data) {
      return {
        ...data,
        _id: data._id || 'bundle-instance-123',
        save: vi.fn().mockResolvedValue(),
        deleteOne: vi.fn().mockResolvedValue()
      }
    })
    
    BundleInstance.findOne = vi.fn()
    BundleInstance.findById = vi.fn()
    BundleInstance.countDocuments = vi.fn()
    BundleInstance.findByIdAndDelete = vi.fn()
    
    // 設定 Bundle mock
    Bundle.findOne = vi.fn()
    Bundle.findById = vi.fn()
    Bundle.findByIdAndUpdate = vi.fn()
    
    // 設定 VoucherTemplate mock
    VoucherTemplate.findByIdAndUpdate = vi.fn()
    
    // 設定 VoucherInstance mock
    VoucherInstance.mockImplementation(function(data) {
      return {
        ...data,
        _id: data._id || 'voucher-instance-123',
        save: vi.fn().mockResolvedValue()
      }
    })
    VoucherInstance.countDocuments = vi.fn()
    
    // 設定 pointService mock
    pointService.getUserPointsBalance.mockResolvedValue(500)
    pointService.usePoints.mockResolvedValue({ pointsUsed: 300, success: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getInstanceById - 根據ID獲取Bundle實例', () => {
    it('應該成功獲取Bundle實例', async () => {
      // Arrange
      const instanceId = 'bundle-instance-123'
      const mockInstance = TestDataFactory.createBundleInstance()
      
      BundleInstance.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockInstance)
      })

      // Act
      const result = await bundleInstanceService.getInstanceById(instanceId)

      // Assert
      expect(BundleInstance.findOne).toHaveBeenCalledWith({ _id: instanceId })
      expect(result).toEqual(mockInstance)
    })

    it('應該支援品牌驗證', async () => {
      // Arrange
      const instanceId = 'bundle-instance-123'
      const brandId = 'brand-id-123'
      const mockInstance = TestDataFactory.createBundleInstance()
      
      BundleInstance.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockInstance)
      })

      // Act
      await bundleInstanceService.getInstanceById(instanceId, brandId)

      // Assert
      expect(BundleInstance.findOne).toHaveBeenCalledWith({
        _id: instanceId,
        brand: brandId
      })
    })

    it('應該在實例不存在時拋出錯誤', async () => {
      // Arrange
      const instanceId = 'non-existent-instance'
      
      BundleInstance.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue(null)
      })

      // Act & Assert
      await expect(
        bundleInstanceService.getInstanceById(instanceId)
      ).rejects.toThrow('Bundle 實例不存在或無權訪問')
    })
  })

  describe('createInstance - 創建Bundle實例', () => {
    it('應該成功創建Bundle實例', async () => {
      // Arrange
      const instanceData = TestDataFactory.createBundleInstanceData()
      const mockTemplate = TestDataFactory.createBundleTemplate()
      const mockInstance = TestDataFactory.createBundleInstance()
      
      Bundle.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockTemplate)
      })
      
      BundleInstance.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockInstance)
      })

      // Act
      const result = await bundleInstanceService.createInstance(instanceData)

      // Assert
      expect(Bundle.findOne).toHaveBeenCalledWith({
        _id: instanceData.templateId,
        brand: instanceData.brand
      })
      expect(BundleInstance).toHaveBeenCalledWith(expect.objectContaining({
        templateId: instanceData.templateId,
        brand: instanceData.brand,
        user: instanceData.user,
        name: mockTemplate.name,
        description: mockTemplate.description,
        cashPrice: mockTemplate.cashPrice,
        pointPrice: mockTemplate.pointPrice,
        voucherValidityDays: mockTemplate.voucherValidityDays
      }))
      expect(result).toEqual(mockInstance)
    })

    it('應該在缺少模板ID時拋出錯誤', async () => {
      // Arrange
      const instanceData = { brand: 'brand-id-123' }

      // Act & Assert
      await expect(
        bundleInstanceService.createInstance(instanceData)
      ).rejects.toThrow('Bundle 模板ID為必填欄位')
    })

    it('應該在缺少品牌ID時拋出錯誤', async () => {
      // Arrange
      const instanceData = { templateId: 'bundle-template-123' }

      // Act & Assert
      await expect(
        bundleInstanceService.createInstance(instanceData)
      ).rejects.toThrow('品牌ID為必填欄位')
    })

    it('應該在模板不存在時拋出錯誤', async () => {
      // Arrange
      const instanceData = TestDataFactory.createBundleInstanceData()
      
      Bundle.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue(null)
      })

      // Act & Assert
      await expect(
        bundleInstanceService.createInstance(instanceData)
      ).rejects.toThrow('Bundle 模板不存在或無權訪問')
    })

    it('應該在模板已停用時拋出錯誤', async () => {
      // Arrange
      const instanceData = TestDataFactory.createBundleInstanceData()
      const mockTemplate = TestDataFactory.createBundleTemplate({ isActive: false })
      
      Bundle.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockTemplate)
      })

      // Act & Assert
      await expect(
        bundleInstanceService.createInstance(instanceData)
      ).rejects.toThrow('Bundle 模板已停用，無法創建實例')
    })

    it('應該根據付款方式設定最終價格（點數付款）', async () => {
      // Arrange
      const instanceData = TestDataFactory.createBundleInstanceData({
        paymentMethod: 'points'
      })
      const mockTemplate = TestDataFactory.createBundleTemplate()
      const mockInstance = TestDataFactory.createBundleInstance()
      
      Bundle.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockTemplate)
      })
      
      BundleInstance.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockInstance)
      })

      // Act
      await bundleInstanceService.createInstance(instanceData)

      // Assert
      expect(BundleInstance).toHaveBeenCalledWith(expect.objectContaining({
        finalPrice: mockTemplate.pointPrice.selling
      }))
    })

    it('應該根據付款方式設定最終價格（現金付款）', async () => {
      // Arrange
      const instanceData = TestDataFactory.createBundleInstanceData({
        paymentMethod: 'cash'
      })
      const mockTemplate = TestDataFactory.createBundleTemplate()
      const mockInstance = TestDataFactory.createBundleInstance()
      
      Bundle.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockTemplate)
      })
      
      BundleInstance.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockInstance)
      })

      // Act
      await bundleInstanceService.createInstance(instanceData)

      // Assert
      expect(BundleInstance).toHaveBeenCalledWith(expect.objectContaining({
        finalPrice: mockTemplate.cashPrice.selling
      }))
    })

    it('應該在沒有有效價格時拋出錯誤', async () => {
      // Arrange
      const instanceData = TestDataFactory.createBundleInstanceData()
      const mockTemplate = TestDataFactory.createBundleTemplate({
        cashPrice: null,
        pointPrice: null
      })
      
      Bundle.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockTemplate)
      })

      // Act & Assert
      await expect(
        bundleInstanceService.createInstance(instanceData)
      ).rejects.toThrow('Bundle 模板沒有設定有效的價格')
    })
  })

  describe('redeemBundleWithPoints - 使用點數兌換Bundle', () => {
    it('應該成功使用點數兌換Bundle', async () => {
      // Arrange
      const bundleId = 'bundle-template-123'
      const userId = 'user-id-123'
      const brandId = 'brand-id-123'
      const mockTemplate = TestDataFactory.createBundleTemplate()
      const mockInstance = TestDataFactory.createBundleInstance()
      
      Bundle.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockTemplate)
      })
      
      Bundle.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockTemplate)
      })
      
      BundleInstance.countDocuments.mockResolvedValue(2) // 已購買2個，限制5個
      BundleInstance.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockInstance)
      })
      
      Bundle.findByIdAndUpdate.mockResolvedValue()
      pointService.getUserPointsBalance.mockResolvedValue(500)
      pointService.usePoints.mockResolvedValue({ pointsUsed: 300, success: true })
      
      // Mock VoucherInstance 創建
      const mockVoucherInstance = TestDataFactory.createVoucherInstance()
      VoucherInstance.mockImplementation(() => mockVoucherInstance)
      VoucherTemplate.findByIdAndUpdate.mockResolvedValue()

      // Act
      const result = await bundleInstanceService.redeemBundleWithPoints(bundleId, userId, brandId)

      // Assert
      expect(Bundle.findOne).toHaveBeenCalledWith({
        _id: bundleId,
        brand: brandId,
        isActive: true
      })
      expect(pointService.getUserPointsBalance).toHaveBeenCalledWith(userId, brandId)
      expect(pointService.usePoints).toHaveBeenCalledWith(
        userId,
        brandId,
        mockTemplate.pointPrice.selling,
        expect.objectContaining({
          model: 'BundleRedemption'
        })
      )
      expect(result.success).toBe(true)
      expect(result.pointsUsed).toBe(mockTemplate.pointPrice.selling)
      expect(result.remainingPoints).toBe(200) // 500 - 300
    })

    it('應該在Bundle不存在時拋出錯誤', async () => {
      // Arrange
      const bundleId = 'non-existent-bundle'
      const userId = 'user-id-123'
      const brandId = 'brand-id-123'
      
      Bundle.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue(null)
      })

      // Act & Assert
      await expect(
        bundleInstanceService.redeemBundleWithPoints(bundleId, userId, brandId)
      ).rejects.toThrow('Bundle 不存在、已停用或無權訪問')
    })

    it('應該在不支援點數兌換時拋出錯誤', async () => {
      // Arrange
      const bundleId = 'bundle-template-123'
      const userId = 'user-id-123'
      const brandId = 'brand-id-123'
      const mockTemplate = TestDataFactory.createBundleTemplate({
        pointPrice: null
      })
      
      Bundle.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockTemplate)
      })

      // Act & Assert
      await expect(
        bundleInstanceService.redeemBundleWithPoints(bundleId, userId, brandId)
      ).rejects.toThrow('此 Bundle 不支援點數兌換')
    })

    it('應該在點數不足時拋出錯誤', async () => {
      // Arrange
      const bundleId = 'bundle-template-123'
      const userId = 'user-id-123'
      const brandId = 'brand-id-123'
      const mockTemplate = TestDataFactory.createBundleTemplate()
      
      Bundle.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockTemplate)
      })
      
      pointService.getUserPointsBalance.mockResolvedValue(100) // 不足300點

      // Act & Assert
      await expect(
        bundleInstanceService.redeemBundleWithPoints(bundleId, userId, brandId)
      ).rejects.toThrow('點數不足，需要 300 點，您目前有 100 點')
    })

    it('應該在達到購買限制時拋出錯誤', async () => {
      // Arrange
      const bundleId = 'bundle-template-123'
      const userId = 'user-id-123'
      const brandId = 'brand-id-123'
      const mockTemplate = TestDataFactory.createBundleTemplate({
        purchaseLimitPerUser: 5
      })
      
      Bundle.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockTemplate)
      })
      
      BundleInstance.countDocuments.mockResolvedValue(5) // 已達上限
      pointService.getUserPointsBalance.mockResolvedValue(500)

      // Act & Assert
      await expect(
        bundleInstanceService.redeemBundleWithPoints(bundleId, userId, brandId)
      ).rejects.toThrow('已達到購買限制，每人限購 5 個')
    })

    it('應該在點數扣除失敗時清理Bundle實例', async () => {
      // Arrange
      const bundleId = 'bundle-template-123'
      const userId = 'user-id-123'
      const brandId = 'brand-id-123'
      const mockTemplate = TestDataFactory.createBundleTemplate()
      const mockInstance = TestDataFactory.createBundleInstance()
      
      Bundle.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockTemplate)
      })
      
      Bundle.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockTemplate)
      })
      
      BundleInstance.countDocuments.mockResolvedValue(2)
      BundleInstance.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockInstance)
      })
      
      pointService.getUserPointsBalance.mockResolvedValue(500)
      pointService.usePoints.mockRejectedValue(new Error('點數扣除失敗'))
      BundleInstance.findByIdAndDelete.mockResolvedValue()

      // Act & Assert
      await expect(
        bundleInstanceService.redeemBundleWithPoints(bundleId, userId, brandId)
      ).rejects.toThrow('點數扣除失敗')
      
      expect(BundleInstance.findByIdAndDelete).toHaveBeenCalledWith(mockInstance._id)
    })
  })

  describe('generateVouchersForBundle - 生成兌換券', () => {
    it('應該成功為Bundle生成兌換券', async () => {
      // Arrange
      const bundleInstanceId = 'bundle-instance-123'
      const brandId = 'brand-id-123'
      const userId = 'user-id-123'
      
      const mockBundleInstance = TestDataFactory.createBundleInstance()
      const mockBundleTemplate = TestDataFactory.createBundleTemplate()
      const mockVoucherInstance = TestDataFactory.createVoucherInstance()
      
      BundleInstance.findById.mockResolvedValue(mockBundleInstance)
      Bundle.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockBundleTemplate)
      })
      
      VoucherInstance.mockImplementation(() => mockVoucherInstance)
      VoucherTemplate.findByIdAndUpdate.mockResolvedValue()

      // Act
      await bundleInstanceService.generateVouchersForBundle(bundleInstanceId, brandId, userId)

      // Assert
      expect(BundleInstance.findById).toHaveBeenCalledWith(bundleInstanceId)
      expect(Bundle.findById).toHaveBeenCalledWith(mockBundleInstance.templateId)
      
      // 應該根據bundleItems數量創建VoucherInstance
      expect(VoucherInstance).toHaveBeenCalledTimes(2) // quantity = 2
      expect(mockVoucherInstance.save).toHaveBeenCalledTimes(2)
      
      // 應該更新VoucherTemplate的totalIssued
      expect(VoucherTemplate.findByIdAndUpdate).toHaveBeenCalledWith(
        'voucher-template-123',
        { $inc: { totalIssued: 2 } },
        { new: true }
      )
    })

    it('應該在Bundle實例不存在時拋出錯誤', async () => {
      // Arrange
      const bundleInstanceId = 'non-existent-instance'
      const brandId = 'brand-id-123'
      const userId = 'user-id-123'
      
      BundleInstance.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(
        bundleInstanceService.generateVouchersForBundle(bundleInstanceId, brandId, userId)
      ).rejects.toThrow('Bundle 實例不存在')
    })

    it('應該在Bundle模板不存在時拋出錯誤', async () => {
      // Arrange
      const bundleInstanceId = 'bundle-instance-123'
      const brandId = 'brand-id-123'
      const userId = 'user-id-123'
      
      const mockBundleInstance = TestDataFactory.createBundleInstance()
      
      BundleInstance.findById.mockResolvedValue(mockBundleInstance)
      Bundle.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(null)
      })

      // Act & Assert
      await expect(
        bundleInstanceService.generateVouchersForBundle(bundleInstanceId, brandId, userId)
      ).rejects.toThrow('Bundle 模板不存在')
    })

    it('應該正確設置兌換券過期日期', async () => {
      // Arrange
      const bundleInstanceId = 'bundle-instance-123'
      const brandId = 'brand-id-123'
      const userId = 'user-id-123'
      
      const mockBundleInstance = TestDataFactory.createBundleInstance({
        voucherValidityDays: 30
      })
      const mockBundleTemplate = TestDataFactory.createBundleTemplate()
      const mockVoucherInstance = TestDataFactory.createVoucherInstance()
      
      BundleInstance.findById.mockResolvedValue(mockBundleInstance)
      Bundle.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockBundleTemplate)
      })
      
      VoucherInstance.mockImplementation(() => mockVoucherInstance)
      VoucherTemplate.findByIdAndUpdate.mockResolvedValue()

      // Act
      await bundleInstanceService.generateVouchersForBundle(bundleInstanceId, brandId, userId)

      // Assert
      expect(mockVoucherInstance.expiryDate).toBeDefined()
      // 驗證日期是否正確（30天後）
      const expectedDate = new Date()
      expectedDate.setDate(expectedDate.getDate() + 30)
      expect(mockVoucherInstance.expiryDate.toDateString()).toBe(expectedDate.toDateString())
    })
  })

  describe('updateInstance - 更新Bundle實例', () => {
    it('應該成功更新Bundle實例', async () => {
      // Arrange
      const instanceId = 'bundle-instance-123'
      const brandId = 'brand-id-123'
      const updateData = { notes: 'Updated notes' }
      const mockInstance = TestDataFactory.createBundleInstance()
      
      BundleInstance.findOne.mockResolvedValue(mockInstance)

      // Act
      const result = await bundleInstanceService.updateInstance(instanceId, updateData, brandId)

      // Assert
      expect(BundleInstance.findOne).toHaveBeenCalledWith({
        _id: instanceId,
        brand: brandId
      })
      expect(mockInstance.notes).toBe(updateData.notes)
      expect(mockInstance.save).toHaveBeenCalled()
      expect(result).toBe(mockInstance)
    })

    it('應該在實例不存在時拋出錯誤', async () => {
      // Arrange
      const instanceId = 'non-existent-instance'
      const brandId = 'brand-id-123'
      const updateData = { notes: 'Updated notes' }
      
      BundleInstance.findOne.mockResolvedValue(null)

      // Act & Assert
      await expect(
        bundleInstanceService.updateInstance(instanceId, updateData, brandId)
      ).rejects.toThrow('Bundle 實例不存在或無權訪問')
    })

    it('應該防止更改關鍵欄位', async () => {
      // Arrange
      const instanceId = 'bundle-instance-123'
      const brandId = 'brand-id-123'
      const updateData = {
        brand: 'different-brand',
        templateId: 'different-template',
        finalPrice: 999,
        notes: 'Updated notes'
      }
      const mockInstance = TestDataFactory.createBundleInstance()
      
      BundleInstance.findOne.mockResolvedValue(mockInstance)

      // Act
      await bundleInstanceService.updateInstance(instanceId, updateData, brandId)

      // Assert
      expect(mockInstance.brand).not.toBe('different-brand')
      expect(mockInstance.templateId).not.toBe('different-template')
      expect(mockInstance.finalPrice).not.toBe(999)
      expect(mockInstance.notes).toBe('Updated notes')
    })
  })

  describe('deleteInstance - 刪除Bundle實例', () => {
    it('應該成功刪除Bundle實例', async () => {
      // Arrange
      const instanceId = 'bundle-instance-123'
      const brandId = 'brand-id-123'
      const mockInstance = TestDataFactory.createBundleInstance()
      
      BundleInstance.findOne.mockResolvedValue(mockInstance)
      VoucherInstance.countDocuments.mockResolvedValue(0) // 沒有關聯兌換券

      // Act
      const result = await bundleInstanceService.deleteInstance(instanceId, brandId)

      // Assert
      expect(BundleInstance.findOne).toHaveBeenCalledWith({
        _id: instanceId,
        brand: brandId
      })
      expect(VoucherInstance.countDocuments).toHaveBeenCalledWith({
        createdBy: instanceId
      })
      expect(mockInstance.deleteOne).toHaveBeenCalled()
      expect(result).toEqual({ success: true, message: 'Bundle 實例已刪除' })
    })

    it('應該在實例不存在時拋出錯誤', async () => {
      // Arrange
      const instanceId = 'non-existent-instance'
      const brandId = 'brand-id-123'
      
      BundleInstance.findOne.mockResolvedValue(null)

      // Act & Assert
      await expect(
        bundleInstanceService.deleteInstance(instanceId, brandId)
      ).rejects.toThrow('Bundle 實例不存在或無權訪問')
    })

    it('應該在有關聯兌換券時拒絕刪除', async () => {
      // Arrange
      const instanceId = 'bundle-instance-123'
      const brandId = 'brand-id-123'
      const mockInstance = TestDataFactory.createBundleInstance()
      
      BundleInstance.findOne.mockResolvedValue(mockInstance)
      VoucherInstance.countDocuments.mockResolvedValue(2) // 有2個關聯兌換券

      // Act & Assert
      await expect(
        bundleInstanceService.deleteInstance(instanceId, brandId)
      ).rejects.toThrow('此 Bundle 實例已生成兌換券，無法刪除')
      
      expect(mockInstance.deleteOne).not.toHaveBeenCalled()
    })
  })
})