import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock models
const createMockBundleInstance = (data) => ({
  ...data,
  _id: data._id || 'mocked-bundle-id',
  save: vi.fn().mockResolvedValue({ ...data, _id: data._id || 'mocked-bundle-id' }),
  deleteOne: vi.fn().mockResolvedValue({ acknowledged: true })
})

const createMockBundleInstanceModelInstance = (data) => ({
  ...data,
  _id: data._id || 'mocked-bundle-instance-id'
})

const mockBundleModel = vi.fn().mockImplementation((data) => createMockBundleInstance(data))
const mockBundleInstanceModel = vi.fn().mockImplementation((data) => createMockBundleInstanceModelInstance(data))
const mockVoucherTemplateModel = vi.fn()
const mockOrderModel = vi.fn()

// Mock static methods for Bundle
mockBundleModel.find = vi.fn()
mockBundleModel.findOne = vi.fn()
mockBundleModel.findById = vi.fn()
mockBundleModel.countDocuments = vi.fn()

// Mock static methods for BundleInstance
mockBundleInstanceModel.countDocuments = vi.fn()

// Mock static methods for VoucherTemplate
mockVoucherTemplateModel.find = vi.fn()
mockVoucherTemplateModel.findOne = vi.fn()

// Mock static methods for Order
mockOrderModel.countDocuments = vi.fn()

// Mock imageHelper
const mockImageHelper = {
  uploadAndProcessImage: vi.fn(),
  updateImage: vi.fn(),
  deleteImage: vi.fn()
}

vi.mock('../../../../../server/models/Promotion/Bundle.js', () => ({
  default: mockBundleModel
}))

vi.mock('../../../../../server/models/Promotion/BundleInstance.js', () => ({
  default: mockBundleInstanceModel
}))

vi.mock('../../../../../server/models/Promotion/VoucherTemplate.js', () => ({
  default: mockVoucherTemplateModel
}))

vi.mock('../../../../../server/models/Order/Order.js', () => ({
  default: mockOrderModel
}))

vi.mock('../../../../../server/middlewares/error.js', () => ({
  AppError: class AppError extends Error {
    constructor(message, statusCode) {
      super(message)
      this.statusCode = statusCode
      this.name = 'AppError'
    }
  }
}))

vi.mock('../../../../../server/services/imageHelper.js', () => mockImageHelper)

// 動態導入服務
let bundleService

describe('BundleService', () => {
  beforeEach(async () => {
    // 清理所有 mock
    vi.clearAllMocks()
    
    // 重置 mock implementations
    mockBundleModel.mockImplementation((data) => createMockBundleInstance(data))
    mockBundleInstanceModel.mockImplementation((data) => createMockBundleInstanceModelInstance(data))

    // 設置常見的查詢方法鍊
    const setupQueryChain = (result = []) => ({
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnValue(Promise.resolve(result)),
      select: vi.fn().mockResolvedValue(result) // select 返回 Promise
    })

    mockBundleModel.find.mockReturnValue(setupQueryChain())
    mockBundleModel.findOne.mockReturnValue(setupQueryChain())
    mockBundleModel.findById.mockReturnValue(setupQueryChain())
    
    mockVoucherTemplateModel.find.mockReturnValue(setupQueryChain())
    // VoucherTemplate.findOne() 使用鏈式調用，需要特別設置
    mockVoucherTemplateModel.findOne.mockReturnValue({
      populate: vi.fn().mockResolvedValue(null)
    })

    // 動態導入服務，確保 mock 生效
    bundleService = await import('../../../../../server/services/bundle/bundleService.js')
  })

  describe('getAllBundles', () => {
    it('should get all bundles with pagination', async () => {
      const mockBundles = [
        { _id: 'bundle1', name: 'Bundle 1', isActive: true },
        { _id: 'bundle2', name: 'Bundle 2', isActive: true }
      ]

      mockBundleModel.countDocuments.mockResolvedValue(2)
      mockBundleModel.find.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockBundles)
      })

      const result = await bundleService.getAllBundles('brand123', { page: 1, limit: 10 })

      expect(mockBundleModel.countDocuments).toHaveBeenCalledWith({ brand: 'brand123', isActive: true })
      expect(mockBundleModel.find).toHaveBeenCalledWith({ brand: 'brand123', isActive: true })
      expect(result.bundles).toEqual(mockBundles)
      expect(result.pagination.total).toBe(2)
      expect(result.pagination.currentPage).toBe(1)
    })

    it('should include inactive bundles when requested', async () => {
      mockBundleModel.countDocuments.mockResolvedValue(3)
      mockBundleModel.find.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([])
      })

      await bundleService.getAllBundles('brand123', { includeInactive: true })

      expect(mockBundleModel.countDocuments).toHaveBeenCalledWith({ brand: 'brand123' })
      expect(mockBundleModel.find).toHaveBeenCalledWith({ brand: 'brand123' })
    })

    it('should handle pagination correctly', async () => {
      mockBundleModel.countDocuments.mockResolvedValue(25)
      mockBundleModel.find.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([])
      })

      const result = await bundleService.getAllBundles('brand123', { page: 2, limit: 10 })

      expect(result.pagination.totalPages).toBe(3)
      expect(result.pagination.hasNextPage).toBe(true)
      expect(result.pagination.hasPrevPage).toBe(true)
    })
  })

  describe('getBundleById', () => {
    it('should get bundle by ID successfully', async () => {
      const mockBundle = {
        _id: 'bundle123',
        name: 'Test Bundle',
        brand: 'brand123'
      }

      mockBundleModel.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockBundle)
      })

      const result = await bundleService.getBundleById('bundle123', 'brand123')

      expect(mockBundleModel.findOne).toHaveBeenCalledWith({
        _id: 'bundle123',
        brand: 'brand123'
      })
      expect(result).toEqual(mockBundle)
    })

    it('should throw error when bundle not found', async () => {
      mockBundleModel.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue(null)
      })

      await expect(bundleService.getBundleById('invalid', 'brand123')).rejects.toThrow('Bundle 不存在或無權訪問')
    })
  })

  describe('createBundle', () => {
    const validBundleData = {
      name: 'Test Bundle',
      description: 'Test Description',
      brand: 'brand123',
      bundleItems: [
        {
          voucherTemplate: 'voucher123',
          quantity: 1
        }
      ],
      cashPrice: {
        selling: 100,
        original: 120
      },
      imageData: 'base64imagedata'
    }

    beforeEach(() => {
      mockVoucherTemplateModel.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue({
          _id: 'voucher123',
          name: 'Test Voucher',
          brand: 'brand123',
          isActive: true,
          exchangeDishTemplate: { name: 'Test Dish', basePrice: 100 }
        })
      })

      mockImageHelper.uploadAndProcessImage.mockResolvedValue({
        url: 'https://example.com/image.jpg',
        key: 'image-key-123'
      })

      mockBundleModel.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue({
          _id: 'new-bundle-id',
          ...validBundleData
        })
      })
    })

    it('should create bundle successfully', async () => {
      const result = await bundleService.createBundle(validBundleData)

      expect(mockVoucherTemplateModel.findOne).toHaveBeenCalledWith({
        _id: 'voucher123',
        brand: 'brand123'
      })
      expect(mockImageHelper.uploadAndProcessImage).toHaveBeenCalledWith(
        'base64imagedata',
        'bundles/brand123'
      )
      expect(mockBundleModel).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('should throw error when name is missing', async () => {
      const invalidData = { ...validBundleData, name: undefined }

      await expect(bundleService.createBundle(invalidData)).rejects.toThrow('名稱和描述為必填欄位')
    })

    it('should throw error when no bundle items', async () => {
      const invalidData = { ...validBundleData, bundleItems: [] }

      await expect(bundleService.createBundle(invalidData)).rejects.toThrow('至少需要一個兌換券項目')
    })

    it('should throw error when no price is set', async () => {
      const invalidData = { ...validBundleData, cashPrice: undefined }

      await expect(bundleService.createBundle(invalidData)).rejects.toThrow('至少需要設定現金價格或點數價格其中一種')
    })

    it('should allow creating bundle without image', async () => {
      const dataWithoutImage = {
        ...validBundleData,
        imageData: undefined,
        image: undefined // 無圖片
      }

      const result = await bundleService.createBundle(dataWithoutImage)

      expect(mockImageHelper.uploadAndProcessImage).not.toHaveBeenCalled()
      expect(mockBundleModel).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('should throw error when voucher template not found', async () => {
      mockVoucherTemplateModel.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue(null)
      })

      await expect(bundleService.createBundle(validBundleData)).rejects.toThrow('兌換券模板 voucher123 不存在或不屬於此品牌')
    })

    it('should throw error when voucher template is inactive', async () => {
      mockVoucherTemplateModel.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue({
          _id: 'voucher123',
          name: 'Test Voucher',
          brand: 'brand123',
          isActive: false
        })
      })

      await expect(bundleService.createBundle(validBundleData)).rejects.toThrow('兌換券模板 Test Voucher 已停用，無法使用')
    })

    it('should validate voucher quantity', async () => {
      const invalidData = {
        ...validBundleData,
        bundleItems: [{
          voucherTemplate: 'voucher123',
          quantity: 0
        }]
      }

      // 這個測試使用默認的 beforeEach 設置，有效的 voucher template
      await expect(bundleService.createBundle(invalidData)).rejects.toThrow('兌換券 Test Voucher 的數量必須大於 0')
    })
  })

  describe('updateBundle', () => {
    const mockExistingBundle = {
      _id: 'bundle123',
      name: 'Existing Bundle',
      brand: 'brand123',
      save: vi.fn().mockResolvedValue(true),
      image: { key: 'old-image-key' },
      bundleItems: []
    }

    beforeEach(() => {
      mockBundleModel.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockExistingBundle)
      })
    })

    it('should update bundle successfully', async () => {
      const updateData = {
        name: 'Updated Bundle',
        description: 'Updated Description'
      }

      const result = await bundleService.updateBundle('bundle123', updateData, 'brand123')

      expect(mockBundleModel.findOne).toHaveBeenCalledWith({
        _id: 'bundle123',
        brand: 'brand123'
      })
      expect(mockExistingBundle.save).toHaveBeenCalled()
      expect(result).toEqual(mockExistingBundle)
    })

    it('should throw error when bundle not found', async () => {
      mockBundleModel.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue(null)
      })

      await expect(bundleService.updateBundle('invalid', {}, 'brand123')).rejects.toThrow('Bundle 不存在或無權訪問')
    })

    it('should handle image update', async () => {
      const updateData = {
        imageData: 'new-base64-image'
      }

      mockImageHelper.updateImage.mockResolvedValue({
        url: 'https://example.com/new-image.jpg',
        key: 'new-image-key'
      })

      await bundleService.updateBundle('bundle123', updateData, 'brand123')

      expect(mockImageHelper.updateImage).toHaveBeenCalledWith(
        'new-base64-image',
        'old-image-key',
        'bundles/brand123'
      )
    })

    it('should validate price when updating with new prices', async () => {
      // 測試情境：提供新的價格，但都是無效的（沒有selling和original）
      const updateData = {
        cashPrice: {}, // 空的價格對象，沒有selling或original
        pointPrice: {}, // 空的價格對象，沒有selling或original
        name: 'Updated Name'
      }

      // 模擬現有bundle沒有價格
      const bundleWithoutPrice = {
        ...mockExistingBundle,
        cashPrice: undefined,
        pointPrice: undefined
      }

      mockBundleModel.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue(bundleWithoutPrice)
      })

      await expect(bundleService.updateBundle('bundle123', updateData, 'brand123')).rejects.toThrow('至少需要設定現金價格或點數價格其中一種')
    })

    it('should allow clearing prices when requested explicitly', async () => {
      // 測試情境：明確要求清除所有價格（這是允許的行為）
      const updateData = {
        cashPrice: null,
        pointPrice: null,
        name: 'Updated Name'
      }

      const result = await bundleService.updateBundle('bundle123', updateData, 'brand123')

      expect(mockExistingBundle.cashPrice).toBe(undefined)
      expect(mockExistingBundle.pointPrice).toBe(undefined)
      expect(result).toEqual(mockExistingBundle)
    })

    it('should validate voucher templates when updating bundle items', async () => {
      const updateData = {
        bundleItems: [{
          voucherTemplate: 'voucher123',
          quantity: 1
        }]
      }

      // 注意：updateBundle 中的 VoucherTemplate.findOne 沒有使用 .populate()
      mockVoucherTemplateModel.findOne.mockResolvedValue({
        _id: 'voucher123',
        name: 'Test Voucher',
        brand: 'brand123'
      })

      await bundleService.updateBundle('bundle123', updateData, 'brand123')

      expect(mockVoucherTemplateModel.findOne).toHaveBeenCalledWith({
        _id: 'voucher123',
        brand: 'brand123'
      })
    })
  })

  describe('deleteBundle', () => {
    const mockBundle = {
      _id: 'bundle123',
      name: 'Test Bundle',
      brand: 'brand123',
      deleteOne: vi.fn().mockResolvedValue({ acknowledged: true }),
      image: { key: 'image-key-123' },
      bundleItems: []
    }

    beforeEach(() => {
      mockBundleModel.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockBundle)
      })
      mockOrderModel.countDocuments.mockResolvedValue(0)
    })

    it('should delete bundle successfully', async () => {
      const result = await bundleService.deleteBundle('bundle123', 'brand123')

      expect(mockBundleModel.findOne).toHaveBeenCalledWith({
        _id: 'bundle123',
        brand: 'brand123'
      })
      expect(mockOrderModel.countDocuments).toHaveBeenCalledWith({
        'items.bundle': 'bundle123'
      })
      expect(mockImageHelper.deleteImage).toHaveBeenCalledWith('image-key-123')
      expect(mockBundle.deleteOne).toHaveBeenCalled()
      expect(result).toEqual({ success: true, message: 'Bundle已刪除' })
    })

    it('should throw error when bundle not found', async () => {
      mockBundleModel.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue(null)
      })

      await expect(bundleService.deleteBundle('invalid', 'brand123')).rejects.toThrow('Bundle 不存在或無權訪問')
    })

    it('should throw error when bundle has related orders', async () => {
      mockOrderModel.countDocuments.mockResolvedValue(1)

      await expect(bundleService.deleteBundle('bundle123', 'brand123')).rejects.toThrow('此Bundle已有相關訂單，無法刪除')
    })

    it('should not delete shared image with dish', async () => {
      const bundleWithSharedImage = {
        ...mockBundle,
        bundleItems: [{
          voucherTemplate: {
            exchangeDishTemplate: {
              image: { key: 'image-key-123' }
            }
          }
        }]
      }

      mockBundleModel.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue(bundleWithSharedImage)
      })

      await bundleService.deleteBundle('bundle123', 'brand123')

      expect(mockImageHelper.deleteImage).not.toHaveBeenCalled()
    })
  })

  describe('checkPurchaseLimit', () => {
    it('should allow purchase when no limit is set', async () => {
      mockBundleModel.findById.mockResolvedValue({
        _id: 'bundle123',
        name: 'Test Bundle',
        purchaseLimitPerUser: null
      })

      const result = await bundleService.checkPurchaseLimit('bundle123', 'user123')

      expect(result.canPurchase).toBe(true)
      expect(result.remainingLimit).toBe(null)
      expect(result.message).toBe('無購買限制')
    })

    it('should calculate remaining limit correctly', async () => {
      mockBundleModel.findById.mockResolvedValue({
        _id: 'bundle123',
        name: 'Test Bundle',
        purchaseLimitPerUser: 5
      })
      mockBundleInstanceModel.countDocuments.mockResolvedValue(2)

      const result = await bundleService.checkPurchaseLimit('bundle123', 'user123')

      expect(mockBundleInstanceModel.countDocuments).toHaveBeenCalledWith({
        templateId: 'bundle123',
        user: 'user123'
      })
      expect(result.canPurchase).toBe(true)
      expect(result.remainingLimit).toBe(3)
      expect(result.purchasedCount).toBe(2)
      expect(result.totalLimit).toBe(5)
    })

    it('should prevent purchase when limit exceeded', async () => {
      mockBundleModel.findById.mockResolvedValue({
        _id: 'bundle123',
        name: 'Test Bundle',
        purchaseLimitPerUser: 3
      })
      mockBundleInstanceModel.countDocuments.mockResolvedValue(3)

      const result = await bundleService.checkPurchaseLimit('bundle123', 'user123')

      expect(result.canPurchase).toBe(false)
      expect(result.remainingLimit).toBe(0)
    })

    it('should throw error when bundle not found', async () => {
      mockBundleModel.findById.mockResolvedValue(null)

      await expect(bundleService.checkPurchaseLimit('invalid', 'user123')).rejects.toThrow('包裝商品不存在')
    })
  })

  describe('autoCreateBundlesForVouchers', () => {
    it('should create bundles for vouchers without bundles', async () => {
      const mockVouchers = [
        {
          _id: 'voucher1',
          name: 'Voucher 1',
          exchangeDishTemplate: {
            name: 'Dish 1',
            basePrice: 100,
            image: { url: 'http://example.com/image1.jpg', key: 'key1' }
          }
        },
        {
          _id: 'voucher2',
          name: 'Voucher 2',
          exchangeDishTemplate: {
            name: 'Dish 2',
            basePrice: 200,
            image: { url: 'http://example.com/image2.jpg', key: 'key2' }
          }
        }
      ]

      mockVoucherTemplateModel.find.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockVouchers)
      })
      
      // 為這個特定的測試設置 Bundle.find().select() mock
      mockBundleModel.find.mockReturnValue({
        select: vi.fn().mockResolvedValue([])
      })

      const result = await bundleService.autoCreateBundlesForVouchers('brand123')

      expect(mockVoucherTemplateModel.find).toHaveBeenCalledWith({
        brand: 'brand123',
        isActive: true
      })
      expect(mockBundleModel).toHaveBeenCalledTimes(2)
      expect(result.statistics.createdCount).toBe(2)
      expect(result.statistics.skippedCount).toBe(0)
      expect(result.createdBundles).toHaveLength(2)
    })

    it('should skip vouchers without associated dishes', async () => {
      const mockVouchers = [
        {
          _id: 'voucher1',
          name: 'Voucher 1',
          exchangeDishTemplate: null
        }
      ]

      mockVoucherTemplateModel.find.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockVouchers)
      })
      mockBundleModel.find.mockReturnValue({
        select: vi.fn().mockResolvedValue([])
      })

      const result = await bundleService.autoCreateBundlesForVouchers('brand123')

      expect(result.statistics.createdCount).toBe(0)
      expect(result.statistics.skippedCount).toBe(1)
      expect(result.skippedVouchers[0].reason).toBe('沒有關聯的餐點模板')
    })

    it('should allow creating bundles for vouchers with dishes without images', async () => {
      const mockVouchers = [
        {
          _id: 'voucher1',
          name: 'Voucher 1',
          exchangeDishTemplate: {
            name: 'Dish 1',
            basePrice: 100,
            image: null
          }
        }
      ]

      mockVoucherTemplateModel.find.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockVouchers)
      })
      mockBundleModel.find.mockReturnValue({
        select: vi.fn().mockResolvedValue([])
      })

      const result = await bundleService.autoCreateBundlesForVouchers('brand123')

      expect(result.statistics.createdCount).toBe(1)
      expect(result.statistics.skippedCount).toBe(0)
      // 驗證 Bundle 構造函數被調用，且創建的 Bundle 沒有 image 欄位
      expect(mockBundleModel).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Voucher 1',
          brand: 'brand123'
        })
      )
      // 驗證創建的 Bundle 資料不包含 image 欄位（因為使用條件式設置）
      const bundleData = mockBundleModel.mock.calls[0][0]
      expect(bundleData.image).toBeUndefined()
    })

    it('should exclude existing vouchers with bundles', async () => {
      const mockVouchers = [
        { _id: 'voucher1', name: 'Voucher 1' },
        { _id: 'voucher2', name: 'Voucher 2' }
      ]

      const mockExistingBundles = [
        {
          bundleItems: [{ voucherTemplate: 'voucher1' }]
        }
      ]

      mockVoucherTemplateModel.find.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockVouchers)
      })
      mockBundleModel.find.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockExistingBundles)
      })

      const result = await bundleService.autoCreateBundlesForVouchers('brand123')

      expect(result.statistics.existingCount).toBe(1)
    })
  })

  describe('validateBundlePurchase', () => {
    it('should validate bundle purchase successfully', async () => {
      mockBundleModel.findById.mockResolvedValue({
        _id: 'bundle123',
        isActive: true,
        purchaseLimitPerUser: 5
      })
      mockBundleInstanceModel.countDocuments.mockResolvedValue(2)

      const result = await bundleService.validateBundlePurchase('bundle123', 'user123', 1, 'store123')

      expect(result).toBe(true)
      expect(mockBundleModel.findById).toHaveBeenCalledWith('bundle123')
      expect(mockBundleInstanceModel.countDocuments).toHaveBeenCalledWith({
        templateId: 'bundle123',
        user: 'user123'
      })
    })

    it('should throw error when bundle not found', async () => {
      mockBundleModel.findById.mockResolvedValue(null)

      await expect(bundleService.validateBundlePurchase('invalid', 'user123', 1, 'store123')).rejects.toThrow('Bundle 不存在')
    })

    it('should throw error when bundle is inactive', async () => {
      mockBundleModel.findById.mockResolvedValue({
        _id: 'bundle123',
        isActive: false
      })

      await expect(bundleService.validateBundlePurchase('bundle123', 'user123', 1, 'store123')).rejects.toThrow('Bundle 已停用')
    })

    it('should throw error when quantity exceeds purchase limit', async () => {
      mockBundleModel.findById.mockResolvedValue({
        _id: 'bundle123',
        isActive: true,
        purchaseLimitPerUser: 3
      })
      mockBundleInstanceModel.countDocuments.mockResolvedValue(2)

      await expect(bundleService.validateBundlePurchase('bundle123', 'user123', 2, 'store123')).rejects.toThrow('購買數量超過限制，您還可以購買 1 個')
    })

    it('should allow purchase when no user ID provided (guest)', async () => {
      mockBundleModel.findById.mockResolvedValue({
        _id: 'bundle123',
        isActive: true,
        purchaseLimitPerUser: 5
      })

      const result = await bundleService.validateBundlePurchase('bundle123', null, 1, 'store123')

      expect(result).toBe(true)
      expect(mockBundleInstanceModel.countDocuments).not.toHaveBeenCalled()
    })
  })
})