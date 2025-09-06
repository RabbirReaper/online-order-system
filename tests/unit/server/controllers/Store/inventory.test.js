import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TestDataFactory, TestHelpers } from '../../../../setup.js'

// Mock inventory services
vi.mock('@server/services/inventory/index.js', () => ({
  management: {
    getStoreInventory: vi.fn(),
    getInventoryItem: vi.fn(),
    createInventory: vi.fn(),
    updateInventory: vi.fn(),
    setAvailableStock: vi.fn(),
    reduceStock: vi.fn(),
    addStock: vi.fn(),
    processDamage: vi.fn(),
    initializeDishInventory: vi.fn(),
    toggleSoldOut: vi.fn(),
    bulkUpdateInventory: vi.fn()
  },
  stats: {
    getInventoryLogs: vi.fn(),
    getItemInventoryStats: vi.fn(),
    getInventoryHealthReport: vi.fn(),
    getStockChangeSummary: vi.fn()
  }
}))

// Mock asyncHandler
vi.mock('@server/middlewares/error.js', () => ({
  asyncHandler: vi.fn((fn) => fn)
}))

// 動態導入控制器
const inventoryController = await import('@server/controllers/Store/inventory.js')
const inventoryService = await import('@server/services/inventory/index.js')

describe('Inventory Controller', () => {
  let req, res, next

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock Express request object
    req = {
      params: {
        storeId: 'store123',
        inventoryId: 'inventory456'
      },
      query: {},
      body: {},
      auth: {
        id: 'admin123'
      },
      brandId: 'brand123'
    }

    // Mock Express response object  
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    }

    next = vi.fn()
  })

  describe('getStoreInventory', () => {
    it('應該成功獲取店鋪庫存列表並返回正確格式', async () => {
      // Arrange
      req.query = {
        inventoryType: 'DishTemplate',
        onlyAvailable: 'true',
        search: 'pizza'
      }

      const mockInventory = [
        TestDataFactory.createInventoryItem({ name: 'Pizza Margherita' }),
        TestDataFactory.createInventoryItem({ name: 'Pizza Pepperoni' })
      ]

      inventoryService.management.getStoreInventory.mockResolvedValue(mockInventory)

      // Act
      await inventoryController.getStoreInventory(req, res)

      // Assert
      expect(inventoryService.management.getStoreInventory).toHaveBeenCalledWith('store123', {
        inventoryType: 'DishTemplate',
        onlyAvailable: true,
        search: 'pizza'
      })

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        inventory: mockInventory
      })
    })

    it('應該處理查詢參數預設值', async () => {
      // Arrange - 沒有查詢參數
      const mockInventory = []
      inventoryService.management.getStoreInventory.mockResolvedValue(mockInventory)

      // Act
      await inventoryController.getStoreInventory(req, res)

      // Assert
      expect(inventoryService.management.getStoreInventory).toHaveBeenCalledWith('store123', {
        inventoryType: undefined,
        onlyAvailable: false,
        search: ''
      })
    })

    it('應該處理服務錯誤', async () => {
      // Arrange
      const mockError = new Error('Database connection failed')
      mockError.statusCode = 500
      inventoryService.management.getStoreInventory.mockRejectedValue(mockError)

      // Act
      await inventoryController.getStoreInventory(req, res)

      // Assert
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database connection failed'
      })
    })
  })

  describe('getInventoryItem', () => {
    it('應該成功獲取單個庫存項目', async () => {
      // Arrange
      const mockInventoryItem = TestDataFactory.createInventoryItem()
      inventoryService.management.getInventoryItem.mockResolvedValue(mockInventoryItem)

      // Act
      await inventoryController.getInventoryItem(req, res)

      // Assert
      expect(inventoryService.management.getInventoryItem).toHaveBeenCalledWith('store123', 'inventory456')
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        inventoryItem: mockInventoryItem
      })
    })

    it('應該處理找不到庫存項目的錯誤', async () => {
      // Arrange
      const mockError = new Error('Inventory item not found')
      mockError.statusCode = 404
      inventoryService.management.getInventoryItem.mockRejectedValue(mockError)

      // Act
      await inventoryController.getInventoryItem(req, res)

      // Assert
      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Inventory item not found'
      })
    })
  })

  describe('createInventory', () => {
    it('應該成功創建庫存項目', async () => {
      // Arrange
      const inventoryData = TestDataFactory.createInventoryData()
      req.body = inventoryData

      const mockNewInventoryItem = {
        _id: 'inventory789',
        ...inventoryData,
        brandId: 'brand123',
        storeId: 'store123'
      }

      inventoryService.management.createInventory.mockResolvedValue(mockNewInventoryItem)

      // Act
      await inventoryController.createInventory(req, res)

      // Assert
      expect(inventoryService.management.createInventory).toHaveBeenCalledWith(
        {
          ...inventoryData,
          brandId: 'brand123',
          storeId: 'store123'
        },
        'admin123'
      )

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '庫存創建成功',
        inventoryItem: mockNewInventoryItem
      })
    })

    it('應該處理創建失敗的錯誤', async () => {
      // Arrange
      req.body = TestDataFactory.createInventoryData()
      const mockError = new Error('Invalid inventory data')
      mockError.statusCode = 400
      inventoryService.management.createInventory.mockRejectedValue(mockError)

      // Act
      await inventoryController.createInventory(req, res)

      // Assert
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid inventory data'
      })
    })
  })

  describe('updateInventory', () => {
    it('應該成功更新庫存項目', async () => {
      // Arrange
      const updateData = { totalStock: 100, availableStock: 80 }
      req.body = updateData

      const mockUpdatedInventoryItem = {
        _id: 'inventory456',
        ...updateData,
        storeId: 'store123'
      }

      inventoryService.management.updateInventory.mockResolvedValue(mockUpdatedInventoryItem)

      // Act
      await inventoryController.updateInventory(req, res)

      // Assert
      expect(inventoryService.management.updateInventory).toHaveBeenCalledWith(
        {
          ...updateData,
          storeId: 'store123',
          inventoryId: 'inventory456'
        },
        'admin123'
      )

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '庫存更新成功',
        inventoryItem: mockUpdatedInventoryItem
      })
    })
  })

  describe('setAvailableStock', () => {
    it('應該成功設定可用庫存', async () => {
      // Arrange
      req.body = {
        availableStock: 50,
        reason: 'Manual adjustment'
      }

      const mockUpdatedInventoryItem = TestDataFactory.createInventoryItem({ availableStock: 50 })
      inventoryService.management.setAvailableStock.mockResolvedValue(mockUpdatedInventoryItem)

      // Act
      await inventoryController.setAvailableStock(req, res)

      // Assert
      expect(inventoryService.management.setAvailableStock).toHaveBeenCalledWith({
        storeId: 'store123',
        inventoryId: 'inventory456',
        availableStock: 50,
        reason: 'Manual adjustment',
        adminId: 'admin123'
      })

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '可用庫存設定成功',
        inventoryItem: mockUpdatedInventoryItem
      })
    })
  })

  describe('reduceStock', () => {
    it('應該成功減少庫存', async () => {
      // Arrange
      req.body = {
        quantity: 5,
        reason: 'Order consumption',
        orderId: 'order123',
        inventoryType: 'DishTemplate'
      }

      inventoryService.management.reduceStock.mockResolvedValue()

      // Act
      await inventoryController.reduceStock(req, res)

      // Assert
      expect(inventoryService.management.reduceStock).toHaveBeenCalledWith({
        storeId: 'store123',
        inventoryId: 'inventory456',
        quantity: 5,
        reason: 'Order consumption',
        orderId: 'order123',
        adminId: 'admin123',
        inventoryType: 'DishTemplate'
      })

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '庫存減少成功'
      })
    })

    it('應該使用預設庫存類型', async () => {
      // Arrange
      req.body = {
        quantity: 5,
        reason: 'Order consumption'
      }

      inventoryService.management.reduceStock.mockResolvedValue()

      // Act
      await inventoryController.reduceStock(req, res)

      // Assert
      expect(inventoryService.management.reduceStock).toHaveBeenCalledWith({
        storeId: 'store123',
        inventoryId: 'inventory456',
        quantity: 5,
        reason: 'Order consumption',
        orderId: undefined,
        adminId: 'admin123',
        inventoryType: 'DishTemplate'
      })
    })
  })

  describe('addStock', () => {
    it('應該成功增加庫存', async () => {
      // Arrange
      req.body = {
        quantity: 20,
        reason: 'Restock',
        stockType: 'totalStock',
        inventoryType: 'DishTemplate'
      }

      inventoryService.management.addStock.mockResolvedValue()

      // Act
      await inventoryController.addStock(req, res)

      // Assert
      expect(inventoryService.management.addStock).toHaveBeenCalledWith({
        storeId: 'store123',
        inventoryId: 'inventory456',
        quantity: 20,
        reason: 'Restock',
        stockType: 'totalStock',
        adminId: 'admin123',
        inventoryType: 'DishTemplate'
      })

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '庫存增加成功'
      })
    })

    it('應該使用預設值', async () => {
      // Arrange
      req.body = {
        quantity: 20,
        reason: 'Restock'
      }

      inventoryService.management.addStock.mockResolvedValue()

      // Act
      await inventoryController.addStock(req, res)

      // Assert
      expect(inventoryService.management.addStock).toHaveBeenCalledWith({
        storeId: 'store123',
        inventoryId: 'inventory456',
        quantity: 20,
        reason: 'Restock',
        stockType: 'totalStock',
        adminId: 'admin123',
        inventoryType: 'DishTemplate'
      })
    })
  })

  describe('processDamage', () => {
    it('應該成功處理損耗', async () => {
      // Arrange
      req.body = {
        quantity: 3,
        reason: 'Expired items',
        stockType: 'totalStock',
        inventoryType: 'DishTemplate'
      }

      inventoryService.management.processDamage.mockResolvedValue()

      // Act
      await inventoryController.processDamage(req, res)

      // Assert
      expect(inventoryService.management.processDamage).toHaveBeenCalledWith({
        storeId: 'store123',
        inventoryId: 'inventory456',
        quantity: 3,
        reason: 'Expired items',
        stockType: 'totalStock',
        adminId: 'admin123',
        inventoryType: 'DishTemplate'
      })

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '損耗處理成功'
      })
    })
  })

  describe('initializeDishInventory', () => {
    it('應該成功初始化餐點庫存', async () => {
      // Arrange
      const mockResult = {
        created: 5,
        updated: 2,
        skipped: 1
      }

      inventoryService.management.initializeDishInventory.mockResolvedValue(mockResult)

      // Act
      await inventoryController.initializeDishInventory(req, res)

      // Assert
      expect(inventoryService.management.initializeDishInventory).toHaveBeenCalledWith('store123', 'admin123')

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '餐點庫存初始化成功',
        result: mockResult
      })
    })
  })

  describe('toggleSoldOut', () => {
    it('應該成功切換售完狀態 - 設為售完', async () => {
      // Arrange
      req.body = { isSoldOut: true }

      const mockInventoryItem = TestDataFactory.createInventoryItem({ isSoldOut: true })
      inventoryService.management.toggleSoldOut.mockResolvedValue(mockInventoryItem)

      // Act
      await inventoryController.toggleSoldOut(req, res)

      // Assert
      expect(inventoryService.management.toggleSoldOut).toHaveBeenCalledWith(
        'store123',
        'inventory456',
        true,
        'admin123'
      )

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '庫存項目已設為售完',
        inventoryItem: mockInventoryItem
      })
    })

    it('應該成功切換售完狀態 - 取消售完', async () => {
      // Arrange
      req.body = { isSoldOut: false }

      const mockInventoryItem = TestDataFactory.createInventoryItem({ isSoldOut: false })
      inventoryService.management.toggleSoldOut.mockResolvedValue(mockInventoryItem)

      // Act
      await inventoryController.toggleSoldOut(req, res)

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '庫存項目已取消售完',
        inventoryItem: mockInventoryItem
      })
    })

    it('應該處理缺少 isSoldOut 參數的錯誤', async () => {
      // Arrange
      req.body = {}

      // Act
      await inventoryController.toggleSoldOut(req, res)

      // Assert
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '缺少參數 isSoldOut'
      })
    })
  })

  describe('getInventoryLogs', () => {
    it('應該成功獲取庫存變更日誌', async () => {
      // Arrange
      req.query = {
        inventoryId: 'inventory456',
        inventoryType: 'DishTemplate',
        stockType: 'totalStock',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        changeType: 'reduce',
        page: '1',
        limit: '20'
      }

      const mockLogs = {
        logs: [TestDataFactory.createInventoryLog(), TestDataFactory.createInventoryLog()],
        pagination: {
          total: 2,
          page: 1,
          pages: 1,
          limit: 20
        }
      }

      inventoryService.stats.getInventoryLogs.mockResolvedValue(mockLogs)

      // Act
      await inventoryController.getInventoryLogs(req, res)

      // Assert
      expect(inventoryService.stats.getInventoryLogs).toHaveBeenCalledWith({
        storeId: 'store123',
        itemId: 'inventory456',
        inventoryType: 'DishTemplate',
        stockType: 'totalStock',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        changeType: 'reduce',
        page: 1,
        limit: 20
      })

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        logs: mockLogs.logs,
        pagination: mockLogs.pagination
      })
    })

    it('應該處理查詢參數預設值', async () => {
      // Arrange - 沒有查詢參數
      const mockLogs = {
        logs: [],
        pagination: {
          total: 0,
          page: 1,
          pages: 0,
          limit: 20
        }
      }

      inventoryService.stats.getInventoryLogs.mockResolvedValue(mockLogs)

      // Act
      await inventoryController.getInventoryLogs(req, res)

      // Assert
      expect(inventoryService.stats.getInventoryLogs).toHaveBeenCalledWith({
        storeId: 'store123',
        itemId: undefined,
        inventoryType: undefined,
        stockType: undefined,
        startDate: undefined,
        endDate: undefined,
        changeType: undefined,
        page: 1,
        limit: 20
      })
    })
  })

  describe('getItemInventoryStats', () => {
    it('應該成功獲取項目庫存統計', async () => {
      // Arrange
      req.query = { inventoryType: 'DishTemplate' }

      const mockStats = {
        totalStock: 100,
        availableStock: 80,
        reservedStock: 20,
        lastUpdated: new Date()
      }

      inventoryService.stats.getItemInventoryStats.mockResolvedValue(mockStats)

      // Act
      await inventoryController.getItemInventoryStats(req, res)

      // Assert
      expect(inventoryService.stats.getItemInventoryStats).toHaveBeenCalledWith({
        storeId: 'store123',
        itemId: 'inventory456',
        inventoryType: 'DishTemplate'
      })

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        stats: mockStats
      })
    })

    it('應該使用預設庫存類型', async () => {
      // Arrange - 沒有查詢參數
      const mockStats = {}
      inventoryService.stats.getItemInventoryStats.mockResolvedValue(mockStats)

      // Act
      await inventoryController.getItemInventoryStats(req, res)

      // Assert
      expect(inventoryService.stats.getItemInventoryStats).toHaveBeenCalledWith({
        storeId: 'store123',
        itemId: 'inventory456',
        inventoryType: 'DishTemplate'
      })
    })
  })

  describe('getInventoryHealthReport', () => {
    it('應該成功獲取庫存健康狀況報告', async () => {
      // Arrange
      req.query = {
        inventoryType: 'DishTemplate',
        criticalDaysThreshold: '5',
        overStockDaysThreshold: '45'
      }

      const mockReport = {
        critical: 2,
        low: 5,
        normal: 10,
        overStock: 1,
        details: []
      }

      inventoryService.stats.getInventoryHealthReport.mockResolvedValue(mockReport)

      // Act
      await inventoryController.getInventoryHealthReport(req, res)

      // Assert
      expect(inventoryService.stats.getInventoryHealthReport).toHaveBeenCalledWith('store123', {
        inventoryType: 'DishTemplate',
        criticalDaysThreshold: 5,
        overStockDaysThreshold: 45
      })

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        report: mockReport
      })
    })

    it('應該使用預設閾值', async () => {
      // Arrange - 沒有查詢參數
      const mockReport = {}
      inventoryService.stats.getInventoryHealthReport.mockResolvedValue(mockReport)

      // Act
      await inventoryController.getInventoryHealthReport(req, res)

      // Assert
      expect(inventoryService.stats.getInventoryHealthReport).toHaveBeenCalledWith('store123', {
        inventoryType: undefined,
        criticalDaysThreshold: 3,
        overStockDaysThreshold: 30
      })
    })
  })

  describe('bulkUpdateInventory', () => {
    it('應該成功批量更新庫存', async () => {
      // Arrange
      const items = [
        { inventoryId: 'item1', totalStock: 100 },
        { inventoryId: 'item2', availableStock: 50 }
      ]
      req.body = { items }

      const mockResults = {
        successful: 2,
        failed: 0,
        results: items
      }

      inventoryService.management.bulkUpdateInventory.mockResolvedValue(mockResults)

      // Act
      await inventoryController.bulkUpdateInventory(req, res)

      // Assert
      expect(inventoryService.management.bulkUpdateInventory).toHaveBeenCalledWith('store123', items, 'admin123')

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '批量庫存更新成功',
        results: mockResults
      })
    })

    it('應該處理缺少有效庫存數據的錯誤', async () => {
      // Arrange
      req.body = { items: [] }

      // Act
      await inventoryController.bulkUpdateInventory(req, res)

      // Assert
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '缺少有效的庫存數據'
      })
    })

    it('應該處理 items 不是陣列的錯誤', async () => {
      // Arrange
      req.body = { items: 'invalid' }

      // Act
      await inventoryController.bulkUpdateInventory(req, res)

      // Assert
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '缺少有效的庫存數據'
      })
    })

    it('應該處理缺少 items 參數的錯誤', async () => {
      // Arrange
      req.body = {}

      // Act
      await inventoryController.bulkUpdateInventory(req, res)

      // Assert
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '缺少有效的庫存數據'
      })
    })
  })

  describe('getStockChangeSummary', () => {
    it('應該成功獲取庫存變更摘要', async () => {
      // Arrange
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        inventoryType: 'DishTemplate',
        groupBy: 'changeType'
      }

      const mockSummary = {
        totalChanges: 50,
        increaseChanges: 20,
        decreaseChanges: 30,
        groups: []
      }

      inventoryService.stats.getStockChangeSummary.mockResolvedValue(mockSummary)

      // Act
      await inventoryController.getStockChangeSummary(req, res)

      // Assert
      expect(inventoryService.stats.getStockChangeSummary).toHaveBeenCalledWith({
        storeId: 'store123',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        inventoryType: 'DishTemplate',
        groupBy: 'changeType'
      })

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        summary: mockSummary
      })
    })

    it('應該使用預設 groupBy 值', async () => {
      // Arrange - 沒有 groupBy 參數
      const mockSummary = {}
      inventoryService.stats.getStockChangeSummary.mockResolvedValue(mockSummary)

      // Act
      await inventoryController.getStockChangeSummary(req, res)

      // Assert
      expect(inventoryService.stats.getStockChangeSummary).toHaveBeenCalledWith({
        storeId: 'store123',
        startDate: undefined,
        endDate: undefined,
        inventoryType: undefined,
        groupBy: 'changeType'
      })
    })
  })
})