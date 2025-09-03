/**
 * 店鋪管理服務測試
 * 測試店鋪相關業務邏輯功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock 所有外部依賴
vi.mock('@server/models/Store/Store.js', () => ({ default: vi.fn() }))
vi.mock('@server/models/Brand/Brand.js', () => ({ default: vi.fn() }))
vi.mock('@server/models/Menu/Menu.js', () => ({ default: vi.fn() }))

vi.mock('@server/middlewares/error.js', () => ({
  AppError: class AppError extends Error {
    constructor(message, statusCode = 500) {
      super(message)
      this.statusCode = statusCode
      this.name = 'AppError'
    }
  }
}))

vi.mock('@server/services/imageHelper.js', () => ({
  uploadAndProcessImage: vi.fn(),
  updateImage: vi.fn(),
  deleteImage: vi.fn()
}))

vi.mock('luxon', () => ({
  DateTime: {
    now: vi.fn()
  }
}))

// 動態導入服務和依賴
const storeService = await import('@server/services/store/storeManagement.js')
const Store = (await import('@server/models/Store/Store.js')).default
const Brand = (await import('@server/models/Brand/Brand.js')).default
const Menu = (await import('@server/models/Menu/Menu.js')).default
const { AppError } = await import('@server/middlewares/error.js')
const imageHelper = await import('@server/services/imageHelper.js')
const { DateTime } = await import('luxon')

// 測試資料工廠
const TestDataFactory = {
  createStoreData: (overrides = {}) => ({
    name: 'Test Store',
    brand: 'brand-id-123',
    address: '台北市大安區測試路123號',
    phone: '02-1234-5678',
    image: {
      url: 'https://example.com/store.jpg',
      key: 'stores/brand-id-123/store.jpg',
      alt: 'Test Store'
    },
    isActive: true,
    ...overrides
  }),

  createBrandData: (overrides = {}) => ({
    _id: 'brand-id-123',
    name: 'Test Brand',
    ...overrides
  }),

  createMenuData: (overrides = {}) => ({
    _id: 'menu-id-123',
    name: 'Test Menu',
    ...overrides
  }),

  createBusinessHours: () => [
    {
      day: 1, // 星期一
      periods: [
        { open: '09:00', close: '21:00' }
      ],
      isClosed: false
    },
    {
      day: 2, // 星期二
      periods: [
        { open: '09:00', close: '21:00' }
      ],
      isClosed: false
    }
  ],

  createAdminInfo: (role = 'primary_system_admin', overrides = {}) => ({
    role,
    brand: 'brand-id-123',
    store: 'store-id-123',
    ...overrides
  }),

  createAnnouncements: () => [
    {
      title: '營業公告',
      content: '本店將於下週一進行裝修'
    }
  ]
}

describe('店鋪管理服務測試', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // 設定 Store mock 作為構造函數和靜態方法
    Store.mockImplementation(function(data) {
      return {
        ...data,
        _id: data._id || 'store-id-123',
        save: vi.fn().mockResolvedValue(),
        deleteOne: vi.fn().mockResolvedValue()
      }
    })
    
    Store.find = vi.fn().mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockResolvedValue([]), // 這裡設置實際的返回值
      lean: vi.fn().mockResolvedValue([])
    })
    Store.findById = vi.fn()
    Store.findOne = vi.fn()
    
    // 設定 Brand mock
    Brand.findById = vi.fn()
    
    // 設定 Menu mock
    Menu.findById = vi.fn()
    
    // 設定 DateTime mock
    DateTime.now.mockReturnValue({
      setZone: vi.fn().mockReturnValue({
        toFormat: vi.fn().mockReturnValue('14:30'),
        weekday: 1 // 星期一
      })
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getAllStores - 獲取所有店鋪', () => {
    it('應該成功獲取所有店鋪（無權限過濾）', async () => {
      // Arrange
      const mockStores = [
        { _id: 'store1', name: 'Store 1' },
        { _id: 'store2', name: 'Store 2' }
      ]

      Store.find().sort.mockResolvedValue(mockStores)

      // Act
      const result = await storeService.getAllStores()

      // Assert
      expect(Store.find).toHaveBeenCalledWith({})
      expect(result).toEqual(mockStores)
    })

    it('應該支援品牌ID過濾', async () => {
      // Arrange
      const brandId = 'brand-123'
      const mockStores = [{ _id: 'store1', name: 'Store 1', brand: brandId }]
      Store.find().sort.mockResolvedValue(mockStores)

      // Act
      await storeService.getAllStores({ brandId })

      // Assert
      expect(Store.find).toHaveBeenCalledWith({ brand: brandId })
    })

    it('應該支援只顯示啟用店鋪', async () => {
      // Arrange
      const mockStores = [{ _id: 'store1', name: 'Store 1', isActive: true }]
      Store.find().sort.mockResolvedValue(mockStores)

      // Act
      await storeService.getAllStores({ activeOnly: true })

      // Assert
      expect(Store.find).toHaveBeenCalledWith({ isActive: true })
    })

    it('應該支援搜尋功能', async () => {
      // Arrange
      const search = 'test'
      const mockStores = [{ _id: 'store1', name: 'Test Store' }]
      Store.find().sort.mockResolvedValue(mockStores)

      // Act
      await storeService.getAllStores({ search })

      // Assert
      expect(Store.find).toHaveBeenCalledWith({
        name: { $regex: search, $options: 'i' }
      })
    })

    it('應該正確處理系統管理員權限', async () => {
      // Arrange
      const adminInfo = TestDataFactory.createAdminInfo('primary_system_admin')
      const brandId = 'brand-123'
      const mockStores = [{ _id: 'store1', name: 'Store 1' }]
      Store.find().sort.mockResolvedValue(mockStores)

      // Act
      await storeService.getAllStores({ brandId }, adminInfo)

      // Assert
      expect(Store.find).toHaveBeenCalledWith({ brand: brandId })
    })

    it('應該正確處理品牌管理員權限', async () => {
      // Arrange
      const adminInfo = TestDataFactory.createAdminInfo('brand_admin')
      const brandId = 'brand-id-123' // 與管理員品牌相同
      const mockStores = [{ _id: 'store1', name: 'Store 1' }]
      Store.find().sort.mockResolvedValue(mockStores)

      // Act
      await storeService.getAllStores({ brandId }, adminInfo)

      // Assert
      expect(Store.find).toHaveBeenCalledWith({ brand: adminInfo.brand })
    })

    it('應該拒絕品牌管理員查看其他品牌店鋪', async () => {
      // Arrange
      const adminInfo = TestDataFactory.createAdminInfo('brand_admin')
      const otherBrandId = 'other-brand-123'

      // Act & Assert
      await expect(
        storeService.getAllStores({ brandId: otherBrandId }, adminInfo)
      ).rejects.toThrow('沒有權限查看店鋪資料')
    })

    it('應該正確處理店鋪管理員權限', async () => {
      // Arrange
      const adminInfo = TestDataFactory.createAdminInfo('store_admin')
      const brandId = 'brand-id-123'
      const mockStores = [{ _id: 'store-id-123', name: 'Store 1' }]
      Store.find().sort.mockResolvedValue(mockStores)

      // Act
      await storeService.getAllStores({ brandId }, adminInfo)

      // Assert
      expect(Store.find).toHaveBeenCalledWith({
        brand: adminInfo.brand,
        _id: adminInfo.store
      })
    })
  })

  describe('getStoreById - 根據ID獲取店鋪', () => {
    it('應該成功獲取店鋪', async () => {
      // Arrange
      const storeId = 'store-id-123'
      const mockStore = { _id: storeId, name: 'Test Store' }

      Store.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockStore)
      })

      // Act
      const result = await storeService.getStoreById(storeId)

      // Assert
      expect(Store.findById).toHaveBeenCalledWith(storeId)
      expect(result).toEqual(mockStore)
    })

    it('應該在店鋪不存在時拋出錯誤', async () => {
      // Arrange
      const storeId = 'non-existent-store'

      Store.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(null)
      })

      // Act & Assert
      await expect(
        storeService.getStoreById(storeId)
      ).rejects.toThrow('店鋪不存在')
    })
  })

  describe('createStore - 創建店鋪', () => {
    it('應該成功創建店鋪', async () => {
      // Arrange
      const storeData = TestDataFactory.createStoreData()
      const mockBrandData = TestDataFactory.createBrandData()
      
      Brand.findById.mockResolvedValue(mockBrandData)

      // Act
      const result = await storeService.createStore(storeData)

      // Assert
      expect(Brand.findById).toHaveBeenCalledWith(storeData.brand)
      expect(Store).toHaveBeenCalledWith(expect.objectContaining({
        name: storeData.name,
        brand: storeData.brand,
        address: storeData.address,
        phone: storeData.phone,
        image: storeData.image
      }))
    })

    it('應該設置預設服務設定', async () => {
      // Arrange
      const storeData = TestDataFactory.createStoreData()
      const mockBrandData = TestDataFactory.createBrandData()
      
      Brand.findById.mockResolvedValue(mockBrandData)

      // Act
      await storeService.createStore(storeData)

      // Assert
      expect(Store).toHaveBeenCalledWith(expect.objectContaining({
        enableLineOrdering: false,
        showTaxId: false,
        provideReceipt: true,
        enableDineIn: true,
        enableTakeOut: true,
        enableDelivery: false,
        dineInPrepTime: 15,
        takeOutPrepTime: 10,
        deliveryPrepTime: 30,
        minDeliveryAmount: 0,
        minDeliveryQuantity: 1,
        maxDeliveryDistance: 5,
        advanceOrderDays: 0
      }))
    })

    it('應該在缺少必填欄位時拋出錯誤', async () => {
      // Arrange
      const incompleteData = { name: 'Test Store' }

      // Act & Assert
      await expect(
        storeService.createStore(incompleteData)
      ).rejects.toThrow('店鋪名稱和品牌為必填欄位')
    })

    it('應該在品牌不存在時拋出錯誤', async () => {
      // Arrange
      const storeData = TestDataFactory.createStoreData()
      Brand.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(
        storeService.createStore(storeData)
      ).rejects.toThrow('品牌不存在')
    })

    it('應該處理圖片上傳', async () => {
      // Arrange
      const storeData = TestDataFactory.createStoreData({
        imageData: 'base64-image-data'
      })
      const mockBrandData = TestDataFactory.createBrandData()
      const mockImageInfo = {
        url: 'https://example.com/uploaded.jpg',
        key: 'stores/brand-id-123/uploaded.jpg'
      }

      Brand.findById.mockResolvedValue(mockBrandData)
      imageHelper.uploadAndProcessImage.mockResolvedValue(mockImageInfo)

      // Act
      await storeService.createStore(storeData)

      // Assert
      expect(imageHelper.uploadAndProcessImage).toHaveBeenCalledWith(
        'base64-image-data',
        `stores/${storeData.brand}`
      )
      expect(Store).toHaveBeenCalledWith(expect.objectContaining({
        image: mockImageInfo
      }))
    })

    it('應該在圖片處理失敗時拋出錯誤', async () => {
      // Arrange
      const storeData = TestDataFactory.createStoreData({
        imageData: 'invalid-image-data'
      })
      const mockBrandData = TestDataFactory.createBrandData()

      Brand.findById.mockResolvedValue(mockBrandData)
      imageHelper.uploadAndProcessImage.mockRejectedValue(new Error('Upload failed'))

      // Act & Assert
      await expect(
        storeService.createStore(storeData)
      ).rejects.toThrow('圖片處理失敗: Upload failed')
    })

    it('應該驗證菜單存在性', async () => {
      // Arrange
      const storeData = TestDataFactory.createStoreData({
        menuId: 'menu-id-123'
      })
      const mockBrandData = TestDataFactory.createBrandData()
      const mockMenuData = TestDataFactory.createMenuData()

      Brand.findById.mockResolvedValue(mockBrandData)
      Menu.findById.mockResolvedValue(mockMenuData)

      // Act
      await storeService.createStore(storeData)

      // Assert
      expect(Menu.findById).toHaveBeenCalledWith(storeData.menuId)
    })
  })

  describe('updateStore - 更新店鋪', () => {
    it('應該成功更新店鋪', async () => {
      // Arrange
      const storeId = 'store-id-123'
      const updateData = { name: 'Updated Store' }
      const mockStore = {
        _id: storeId,
        name: 'Original Store',
        save: vi.fn().mockResolvedValue()
      }

      Store.findById.mockResolvedValue(mockStore)

      // Act
      const result = await storeService.updateStore(storeId, updateData)

      // Assert
      expect(Store.findById).toHaveBeenCalledWith(storeId)
      expect(mockStore.name).toBe(updateData.name)
      expect(mockStore.save).toHaveBeenCalled()
      expect(result).toBe(mockStore)
    })

    it('應該在店鋪不存在時拋出錯誤', async () => {
      // Arrange
      const storeId = 'non-existent-store'
      const updateData = { name: 'Updated Store' }

      Store.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(
        storeService.updateStore(storeId, updateData)
      ).rejects.toThrow('店鋪不存在')
    })

    it('應該驗證準備時間不能小於0', async () => {
      // Arrange
      const storeId = 'store-id-123'
      const updateData = { dineInPrepTime: -5 }
      const mockStore = {
        _id: storeId,
        save: vi.fn()
      }

      Store.findById.mockResolvedValue(mockStore)

      // Act & Assert
      await expect(
        storeService.updateStore(storeId, updateData)
      ).rejects.toThrow('內用準備時間不能小於0')
    })

    it('應該驗證外送相關設定', async () => {
      // Arrange
      const storeId = 'store-id-123'
      const updateData = { minDeliveryQuantity: 0 }
      const mockStore = {
        _id: storeId,
        save: vi.fn()
      }

      Store.findById.mockResolvedValue(mockStore)

      // Act & Assert
      await expect(
        storeService.updateStore(storeId, updateData)
      ).rejects.toThrow('最少外送數量不能小於1')
    })

    it('應該處理圖片更新', async () => {
      // Arrange
      const storeId = 'store-id-123'
      const updateData = { imageData: 'new-image-data' }
      const mockStore = {
        _id: storeId,
        brand: 'brand-id-123',
        image: { key: 'old-image-key' },
        save: vi.fn().mockResolvedValue()
      }
      const mockImageInfo = {
        url: 'https://example.com/updated.jpg',
        key: 'stores/brand-id-123/updated.jpg'
      }

      Store.findById.mockResolvedValue(mockStore)
      imageHelper.updateImage.mockResolvedValue(mockImageInfo)

      // Act
      await storeService.updateStore(storeId, updateData)

      // Assert
      expect(imageHelper.updateImage).toHaveBeenCalledWith(
        'new-image-data',
        'old-image-key',
        'stores/brand-id-123'
      )
      expect(mockStore.image).toBe(mockImageInfo)
    })
  })

  describe('deleteStore - 刪除店鋪', () => {
    it('應該成功刪除店鋪', async () => {
      // Arrange
      const storeId = 'store-id-123'
      const mockStore = {
        _id: storeId,
        name: 'Test Store',
        image: { key: 'store-image-key' },
        deleteOne: vi.fn().mockResolvedValue()
      }

      Store.findById.mockResolvedValue(mockStore)
      imageHelper.deleteImage.mockResolvedValue()

      // Act
      const result = await storeService.deleteStore(storeId)

      // Assert
      expect(Store.findById).toHaveBeenCalledWith(storeId)
      expect(imageHelper.deleteImage).toHaveBeenCalledWith('store-image-key')
      expect(mockStore.deleteOne).toHaveBeenCalled()
      expect(result).toEqual({ success: true, message: '店鋪已刪除' })
    })

    it('應該在店鋪不存在時拋出錯誤', async () => {
      // Arrange
      const storeId = 'non-existent-store'

      Store.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(
        storeService.deleteStore(storeId)
      ).rejects.toThrow('店鋪不存在')
    })

    it('應該繼續刪除即使圖片刪除失敗', async () => {
      // Arrange
      const storeId = 'store-id-123'
      const mockStore = {
        _id: storeId,
        name: 'Test Store',
        image: { key: 'store-image-key' },
        deleteOne: vi.fn().mockResolvedValue()
      }

      Store.findById.mockResolvedValue(mockStore)
      imageHelper.deleteImage.mockRejectedValue(new Error('Delete image failed'))

      // Act
      const result = await storeService.deleteStore(storeId)

      // Assert
      expect(mockStore.deleteOne).toHaveBeenCalled()
      expect(result).toEqual({ success: true, message: '店鋪已刪除' })
    })
  })

  describe('toggleStoreActive - 切換店鋪啟用狀態', () => {
    it('應該成功切換店鋪狀態', async () => {
      // Arrange
      const storeId = 'store-id-123'
      const isActive = false
      const mockStore = {
        _id: storeId,
        isActive: true,
        save: vi.fn().mockResolvedValue()
      }

      Store.findById.mockResolvedValue(mockStore)

      // Act
      const result = await storeService.toggleStoreActive(storeId, isActive)

      // Assert
      expect(Store.findById).toHaveBeenCalledWith(storeId)
      expect(mockStore.isActive).toBe(isActive)
      expect(mockStore.save).toHaveBeenCalled()
      expect(result).toBe(mockStore)
    })

    it('應該在店鋪不存在時拋出錯誤', async () => {
      // Arrange
      const storeId = 'non-existent-store'
      const isActive = false

      Store.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(
        storeService.toggleStoreActive(storeId, isActive)
      ).rejects.toThrow('店鋪不存在')
    })
  })

  describe('getStoreBusinessHours - 獲取店鋪營業時間', () => {
    it('應該成功獲取營業時間', async () => {
      // Arrange
      const storeId = 'store-id-123'
      const businessHours = TestDataFactory.createBusinessHours()
      const mockStore = {
        _id: storeId,
        businessHours
      }

      Store.findById.mockResolvedValue(mockStore)

      // Act
      const result = await storeService.getStoreBusinessHours(storeId)

      // Assert
      expect(Store.findById).toHaveBeenCalledWith(storeId)
      expect(result).toEqual(businessHours)
    })

    it('應該在店鋪不存在時拋出錯誤', async () => {
      // Arrange
      const storeId = 'non-existent-store'

      Store.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(
        storeService.getStoreBusinessHours(storeId)
      ).rejects.toThrow('店鋪不存在')
    })

    it('應該返回空陣列當營業時間未設定', async () => {
      // Arrange
      const storeId = 'store-id-123'
      const mockStore = {
        _id: storeId
        // businessHours 未設定
      }

      Store.findById.mockResolvedValue(mockStore)

      // Act
      const result = await storeService.getStoreBusinessHours(storeId)

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('updateStoreBusinessHours - 更新店鋪營業時間', () => {
    it('應該成功更新營業時間', async () => {
      // Arrange
      const storeId = 'store-id-123'
      const businessHours = TestDataFactory.createBusinessHours()
      const mockStore = {
        _id: storeId,
        businessHours: [],
        save: vi.fn().mockResolvedValue()
      }

      Store.findById.mockResolvedValue(mockStore)

      // Act
      const result = await storeService.updateStoreBusinessHours(storeId, businessHours)

      // Assert
      expect(Store.findById).toHaveBeenCalledWith(storeId)
      expect(mockStore.businessHours).toEqual(businessHours)
      expect(mockStore.save).toHaveBeenCalled()
      expect(result).toBe(mockStore)
    })

    it('應該驗證營業時間格式', async () => {
      // Arrange
      const storeId = 'store-id-123'
      const invalidBusinessHours = 'not-an-array'
      const mockStore = { _id: storeId }

      Store.findById.mockResolvedValue(mockStore)

      // Act & Assert
      await expect(
        storeService.updateStoreBusinessHours(storeId, invalidBusinessHours)
      ).rejects.toThrow('營業時間必須是陣列')
    })

    it('應該驗證日期範圍', async () => {
      // Arrange
      const storeId = 'store-id-123'
      const invalidBusinessHours = [{ day: 8 }] // 無效的日期
      const mockStore = { _id: storeId }

      Store.findById.mockResolvedValue(mockStore)

      // Act & Assert
      await expect(
        storeService.updateStoreBusinessHours(storeId, invalidBusinessHours)
      ).rejects.toThrow('日期必須在 0-6 之間')
    })

    it('應該驗證時間格式', async () => {
      // Arrange
      const storeId = 'store-id-123'
      const invalidBusinessHours = [{
        day: 1,
        isClosed: false,
        periods: [{ open: '25:00', close: '21:00' }] // 無效的時間格式
      }]
      const mockStore = { _id: storeId }

      Store.findById.mockResolvedValue(mockStore)

      // Act & Assert
      await expect(
        storeService.updateStoreBusinessHours(storeId, invalidBusinessHours)
      ).rejects.toThrow('時間必須是 HH:MM 格式')
    })
  })

  describe('getStoreCurrentStatus - 獲取店鋪當前狀態', () => {
    it('應該返回營業中狀態', async () => {
      // Arrange
      const storeId = 'store-id-123'
      const businessHours = [{
        day: 1, // 星期一，對應 DateTime mock 的設定
        periods: [{ open: '09:00', close: '21:00' }],
        isClosed: false
      }]
      const mockStore = {
        _id: storeId,
        isActive: true,
        businessHours
      }

      Store.findById.mockResolvedValue(mockStore)

      // Act
      const result = await storeService.getStoreCurrentStatus(storeId)

      // Assert
      expect(result).toEqual({
        isOpen: true,
        status: 'open',
        message: '營業中'
      })
    })

    it('應該返回店鋪已停業', async () => {
      // Arrange
      const storeId = 'store-id-123'
      const mockStore = {
        _id: storeId,
        isActive: false
      }

      Store.findById.mockResolvedValue(mockStore)

      // Act
      const result = await storeService.getStoreCurrentStatus(storeId)

      // Assert
      expect(result).toEqual({
        isOpen: false,
        status: 'closed',
        message: '店鋪已停業'
      })
    })

    it('應該返回今日休息', async () => {
      // Arrange
      const storeId = 'store-id-123'
      const businessHours = [{
        day: 1,
        isClosed: true
      }]
      const mockStore = {
        _id: storeId,
        isActive: true,
        businessHours
      }

      Store.findById.mockResolvedValue(mockStore)

      // Act
      const result = await storeService.getStoreCurrentStatus(storeId)

      // Assert
      expect(result).toEqual({
        isOpen: false,
        status: 'dayOff',
        message: '今日休息'
      })
    })

    it('應該返回非營業時間', async () => {
      // Arrange
      const storeId = 'store-id-123'
      const businessHours = [{
        day: 1,
        periods: [{ open: '09:00', close: '12:00' }], // 14:30 不在營業時間內
        isClosed: false
      }]
      const mockStore = {
        _id: storeId,
        isActive: true,
        businessHours
      }

      Store.findById.mockResolvedValue(mockStore)

      // Act
      const result = await storeService.getStoreCurrentStatus(storeId)

      // Assert
      expect(result).toEqual({
        isOpen: false,
        status: 'closed',
        message: '非營業時間'
      })
    })
  })

  describe('updateStoreAnnouncements - 更新店鋪公告', () => {
    it('應該成功更新公告', async () => {
      // Arrange
      const storeId = 'store-id-123'
      const announcements = TestDataFactory.createAnnouncements()
      const mockStore = {
        _id: storeId,
        announcements: [],
        save: vi.fn().mockResolvedValue()
      }

      Store.findById.mockResolvedValue(mockStore)

      // Act
      const result = await storeService.updateStoreAnnouncements(storeId, announcements)

      // Assert
      expect(Store.findById).toHaveBeenCalledWith(storeId)
      expect(mockStore.announcements).toEqual(announcements)
      expect(mockStore.save).toHaveBeenCalled()
      expect(result).toBe(mockStore)
    })

    it('應該驗證公告格式', async () => {
      // Arrange
      const storeId = 'store-id-123'
      const invalidAnnouncements = 'not-an-array'
      const mockStore = { _id: storeId }

      Store.findById.mockResolvedValue(mockStore)

      // Act & Assert
      await expect(
        storeService.updateStoreAnnouncements(storeId, invalidAnnouncements)
      ).rejects.toThrow('公告必須是陣列')
    })

    it('應該驗證公告內容', async () => {
      // Arrange
      const storeId = 'store-id-123'
      const invalidAnnouncements = [{ title: 'Title' }] // 缺少 content
      const mockStore = { _id: storeId }

      Store.findById.mockResolvedValue(mockStore)

      // Act & Assert
      await expect(
        storeService.updateStoreAnnouncements(storeId, invalidAnnouncements)
      ).rejects.toThrow('每個公告必須包含標題和內容')
    })
  })

  describe('updateStoreServiceSettings - 更新店鋪服務設定', () => {
    it('應該成功更新服務設定', async () => {
      // Arrange
      const storeId = 'store-id-123'
      const serviceSettings = {
        enableLineOrdering: true,
        enableDelivery: true,
        dineInPrepTime: 20
      }
      const mockStore = {
        _id: storeId,
        enableLineOrdering: false,
        enableDelivery: false,
        dineInPrepTime: 15,
        save: vi.fn().mockResolvedValue()
      }

      Store.findById.mockResolvedValue(mockStore)

      // Act
      const result = await storeService.updateStoreServiceSettings(storeId, serviceSettings)

      // Assert
      expect(Store.findById).toHaveBeenCalledWith(storeId)
      expect(mockStore.enableLineOrdering).toBe(true)
      expect(mockStore.enableDelivery).toBe(true)
      expect(mockStore.dineInPrepTime).toBe(20)
      expect(mockStore.save).toHaveBeenCalled()
      expect(result).toBe(mockStore)
    })

    it('應該忽略不允許的欄位', async () => {
      // Arrange
      const storeId = 'store-id-123'
      const serviceSettings = {
        enableLineOrdering: true,
        unauthorizedField: 'should be ignored' // 不在允許清單中的欄位
      }
      const mockStore = {
        _id: storeId,
        enableLineOrdering: false,
        save: vi.fn().mockResolvedValue()
      }

      Store.findById.mockResolvedValue(mockStore)

      // Act
      const result = await storeService.updateStoreServiceSettings(storeId, serviceSettings)

      // Assert
      expect(mockStore.enableLineOrdering).toBe(true)
      expect(mockStore.unauthorizedField).toBeUndefined()
      expect(result).toBe(mockStore)
    })

    it('應該在店鋪不存在時拋出錯誤', async () => {
      // Arrange
      const storeId = 'non-existent-store'
      const serviceSettings = { enableLineOrdering: true }

      Store.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(
        storeService.updateStoreServiceSettings(storeId, serviceSettings)
      ).rejects.toThrow('店鋪不存在')
    })
  })
})