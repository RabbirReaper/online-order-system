import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TestDataFactory } from '../../../../setup.js'

// 擴展 TestDataFactory 以支援 StockLog
TestDataFactory.createStockLog = (overrides = {}) => {
  const baseLog = {
    _id: '507f1f77bcf86cd799439020',
    brand: '6818d68ab0d9e9f313335aa3',
    store: {
      _id: '507f1f77bcf86cd799439014',
      name: '測試店鋪'
    },
    inventoryType: 'DishTemplate',
    dish: {
      _id: '507f1f77bcf86cd799439016', 
      name: '測試餐點'
    },
    itemName: '測試餐點',
    previousStock: 10,
    newStock: 9,
    changeAmount: -1,
    changeType: 'order',
    reason: '訂單消耗: #250902001',
    order: {
      _id: '507f1f77bcf86cd799439018',
      orderDateCode: '250902',
      sequence: 1
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0,
    ...overrides
  }

  // 根據 changeType 調整 admin 欄位
  if (overrides.changeType === 'system_adjustment' || (!overrides.changeType && baseLog.changeType === 'system_adjustment')) {
    baseLog.admin = overrides.admin || {
      _id: '507f1f77bcf86cd799439012',
      name: 'admin'
    }
    baseLog.order = null
  } else if (!overrides.hasOwnProperty('admin')) {
    delete baseLog.admin
  }

  return baseLog
}

// Mock 外部依賴
const mockInventoryQueryChain = (resolveValue = []) => ({
  sort: vi.fn().mockReturnThis(),
  populate: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  skip: vi.fn().mockReturnThis(),
  lean: vi.fn().mockResolvedValue(resolveValue)
})

const mockInventory = {
  find: vi.fn().mockImplementation((query) => {
    // 創建支援多種調用方式的 Inventory mock
    const chainMock = {
      sort: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
      // 直接 await find() 的情況
      then: vi.fn().mockImplementation((resolve) => resolve([])),
      catch: vi.fn().mockReturnThis()
    }
    
    // 讓 populate 可以返回實際結果（支援多個 populate 調用）
    let populateCallCount = 0
    chainMock.populate = vi.fn().mockImplementation(() => {
      populateCallCount++
      // 第2個 populate 調用返回結果，第1個返回 this
      if (populateCallCount >= 2) {
        return Promise.resolve([])
      }
      return chainMock
    })
    
    return chainMock
  }),
  findOne: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  findByIdAndUpdate: vi.fn(),
  aggregate: vi.fn(),
  countDocuments: vi.fn()
}

// Mock StockLog with proper chaining
const createStockLogQueryChain = (resolveValue = []) => ({
  sort: vi.fn().mockReturnThis(),
  skip: vi.fn().mockReturnThis(), 
  limit: vi.fn().mockReturnThis(),
  populate: vi.fn().mockReturnThis(),
  lean: vi.fn().mockResolvedValue(resolveValue),
  exec: vi.fn().mockResolvedValue(resolveValue)
})

const mockStockLog = {
  countDocuments: vi.fn(),
  find: vi.fn().mockImplementation((query) => {
    // 創建支援多種調用方式的 mock
    const chainMock = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(), 
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
      // 直接 await find() 的情況，返回空陣列
      then: vi.fn().mockImplementation((resolve) => resolve([])),
      catch: vi.fn().mockReturnThis()
    }
    
    // 讓 populate 可以返回實際結果（用於 getInventoryLogs）
    chainMock.populate = vi.fn().mockResolvedValue([])
    
    return chainMock
  }),
  findOne: vi.fn().mockImplementation((query) => {
    return createStockLogQueryChain(null)
  }),
  aggregate: vi.fn()
}

// Mock date utilities
vi.mock('@server/utils/date.js', () => ({
  parseDateString: vi.fn((date) => new Date(date)),
  getStartOfDay: vi.fn((date) => ({ toJSDate: () => new Date(date) })),
  getEndOfDay: vi.fn((date) => ({ toJSDate: () => new Date(date) })),
  createDateRange: vi.fn((period) => ({
    start: { toJSDate: () => new Date('2024-08-01') },
    end: { toJSDate: () => new Date('2024-08-31') }
  })),
  getTaiwanDateTime: vi.fn(() => ({
    minus: vi.fn((duration) => ({ 
      startOf: vi.fn(() => ({ 
        toJSDate: () => {
          // 根據 duration 參數返回對應的開始日期
          if (duration && duration.days === 1) {
            return new Date('2024-08-15') // 測試日期
          }
          return new Date('2024-08-01')
        }
      })) 
    })),
    endOf: vi.fn(() => ({ 
      toJSDate: () => {
        // 如果是 1 天測試，返回同一天的結束時間
        return new Date('2024-08-15T23:59:59')
      }
    }))
  })),
  dateDifference: vi.fn()
}))

vi.mock('@server/models/Store/Inventory.js', () => ({ default: mockInventory }))
vi.mock('@server/models/Store/StockLog.js', () => ({ default: mockStockLog }))

// 動態導入服務
const stockStatsService = await import('@server/services/inventory/stockStats.js')

describe('StockStats Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getInventoryLogs', () => {
    it('should get inventory logs successfully with default options', async () => {
      const storeId = '507f1f77bcf86cd799439014'
      const mockLogs = [
        TestDataFactory.createStockLog({ changeType: 'restock', changeAmount: 20, previousStock: 40, newStock: 60 }),
        TestDataFactory.createStockLog({ changeType: 'order', changeAmount: -1, previousStock: 11, newStock: 10 })
      ]

      mockStockLog.countDocuments.mockResolvedValue(2)
      // 設定 find 的 mock chain 返回 mockLogs - 支援多個 populate 調用
      let populateCallCount = 0
      const mockQueryChain = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockImplementation(() => {
          populateCallCount++
          // 最後一個 populate 調用（第4個）返回結果，其他返回 this
          if (populateCallCount >= 4) {
            return Promise.resolve(mockLogs)
          }
          return mockQueryChain
        })
      }
      mockStockLog.find.mockReturnValue(mockQueryChain)

      const options = { storeId }
      const result = await stockStatsService.getInventoryLogs(options)

      expect(result).toMatchObject({
        logs: mockLogs,
        pagination: {
          total: 2,
          totalPages: 1,
          currentPage: 1,
          limit: 20,
          hasNextPage: false,
          hasPrevPage: false
        }
      })

      expect(mockStockLog.countDocuments).toHaveBeenCalledWith({ store: storeId })
      expect(mockStockLog.find).toHaveBeenCalledWith({ store: storeId })
    })

    it('should filter by inventory type', async () => {
      const storeId = '507f1f77bcf86cd799439014'
      const mockLogs = [TestDataFactory.createStockLog()]

      mockStockLog.countDocuments.mockResolvedValue(1)
      // 設定 find 的 mock chain - 支援多個 populate 調用
      let populateCallCount = 0
      const mockQueryChain = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockImplementation(() => {
          populateCallCount++
          // 最後一個 populate 調用（第4個）返回結果，其他返回 this
          if (populateCallCount >= 4) {
            return Promise.resolve(mockLogs)
          }
          return mockQueryChain
        })
      }
      mockStockLog.find.mockReturnValue(mockQueryChain)

      const options = { storeId, inventoryType: 'DishTemplate' }
      await stockStatsService.getInventoryLogs(options)

      expect(mockStockLog.find).toHaveBeenCalledWith({
        store: storeId,
        inventoryType: 'DishTemplate'
      })
    })

    it('should filter by specific item', async () => {
      const storeId = '507f1f77bcf86cd799439014'
      const itemId = '507f1f77bcf86cd799439015'
      const mockInventoryItem = TestDataFactory.createInventory({
        _id: itemId,
        inventoryType: 'DishTemplate',
        dish: '507f1f77bcf86cd799439016'
      })
      const mockLogs = [TestDataFactory.createStockLog()]

      mockInventory.findOne.mockResolvedValue(mockInventoryItem)
      mockStockLog.countDocuments.mockResolvedValue(1)
      // 設定 find 的 mock chain - 支援多個 populate 調用
      let populateCallCount = 0
      const mockQueryChain = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockImplementation(() => {
          populateCallCount++
          // 最後一個 populate 調用（第4個）返回結果，其他返回 this
          if (populateCallCount >= 4) {
            return Promise.resolve(mockLogs)
          }
          return mockQueryChain
        })
      }
      mockStockLog.find.mockReturnValue(mockQueryChain)

      const options = { storeId, itemId }
      await stockStatsService.getInventoryLogs(options)

      expect(mockInventory.findOne).toHaveBeenCalledWith({
        _id: itemId,
        store: storeId
      })
    })

    it('should handle date range filtering', async () => {
      const storeId = '507f1f77bcf86cd799439014'
      const startDate = '2024-08-01'
      const endDate = '2024-08-31'
      const mockLogs = [TestDataFactory.createStockLog()]

      mockStockLog.countDocuments.mockResolvedValue(1)
      // 設定 find 的 mock chain - 支援多個 populate 調用
      let populateCallCount = 0
      const mockQueryChain = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockImplementation(() => {
          populateCallCount++
          // 最後一個 populate 調用（第4個）返回結果，其他返回 this
          if (populateCallCount >= 4) {
            return Promise.resolve(mockLogs)
          }
          return mockQueryChain
        })
      }
      mockStockLog.find.mockReturnValue(mockQueryChain)

      const options = { storeId, startDate, endDate }
      await stockStatsService.getInventoryLogs(options)

      expect(mockStockLog.find).toHaveBeenCalledWith(
        expect.objectContaining({
          store: storeId,
          createdAt: expect.objectContaining({
            $gte: expect.any(Date),
            $lte: expect.any(Date)
          })
        })
      )
    })

    it('should handle pagination correctly', async () => {
      const storeId = '507f1f77bcf86cd799439014'
      const mockLogs = [TestDataFactory.createStockLog()]

      mockStockLog.countDocuments.mockResolvedValue(50)
      // 設定 find 的 mock chain - 支援多個 populate 調用
      let populateCallCount = 0
      const mockQueryChain = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockImplementation(() => {
          populateCallCount++
          // 最後一個 populate 調用（第4個）返回結果，其他返回 this
          if (populateCallCount >= 4) {
            return Promise.resolve(mockLogs)
          }
          return mockQueryChain
        })
      }
      mockStockLog.find.mockReturnValue(mockQueryChain)

      const options = { storeId, page: 2, limit: 10 }
      const result = await stockStatsService.getInventoryLogs(options)

      expect(result.pagination).toMatchObject({
        total: 50,
        totalPages: 5,
        currentPage: 2,
        limit: 10,
        hasNextPage: true,
        hasPrevPage: true
      })
    })

    it('should throw error for invalid date format', async () => {
      const storeId = '507f1f77bcf86cd799439014'
      
      const options = { storeId, startDate: 'invalid-date' }

      // Mock parseDateString to throw error for invalid date
      const { parseDateString } = await import('@server/utils/date.js')
      parseDateString.mockImplementation(() => {
        throw new Error('Invalid date')
      })

      await expect(stockStatsService.getInventoryLogs(options))
        .rejects.toThrow('無效的開始日期格式')
    })
  })


  describe('getItemInventoryStats', () => {
    it('should return default stats when inventory not found', async () => {
      const storeId = '507f1f77bcf86cd799439014'
      const itemId = '507f1f77bcf86cd799439015'

      mockInventory.findOne.mockResolvedValue(null)

      const options = { storeId, itemId }
      const result = await stockStatsService.getItemInventoryStats(options)

      expect(result).toMatchObject({
        currentTotalStock: 0,
        currentAvailableStock: 0,
        consumptionRate: 0,
        estimatedDaysLeft: 0,
        needsRestock: false
      })
    })

    it('should calculate stats for existing inventory', async () => {
      const storeId = '507f1f77bcf86cd799439014'
      const itemId = '507f1f77bcf86cd799439015'
      const mockInventoryItem = TestDataFactory.createInventory({
        _id: itemId,
        store: storeId,
        totalStock: 100,
        availableStock: 80,
        minStockAlert: 10,
        enableAvailableStock: true,
        inventoryType: 'DishTemplate',
        dish: '507f1f77bcf86cd799439016'
      })

      const mockLogs = [
        TestDataFactory.createStockLog({
          changeAmount: -1,
          changeType: 'order',
          createdAt: new Date('2024-08-25')
        }),
        TestDataFactory.createStockLog({
          changeAmount: -1,
          changeType: 'order',
          createdAt: new Date('2024-08-24')
        }),
        TestDataFactory.createStockLog({
          changeAmount: 20,
          changeType: 'restock',
          createdAt: new Date('2024-08-23')
        })
      ]

      mockInventory.findOne.mockResolvedValue(mockInventoryItem)
      mockStockLog.find.mockResolvedValue(mockLogs)
      mockStockLog.findOne.mockReturnValue(createStockLogQueryChain(mockLogs[0]))

      const options = { storeId, itemId }
      const result = await stockStatsService.getItemInventoryStats(options)

      expect(result).toMatchObject({
        currentTotalStock: 100,
        currentAvailableStock: 80,
        minStockAlert: 10,
        enableAvailableStock: true,
        consumptionRate: expect.any(Number),
        estimatedDaysLeft: expect.any(Number),
        stats: {
          last7Days: expect.any(Object),
          last30Days: expect.any(Object)
        }
      })
    })

    it('should calculate consumption rate correctly', async () => {
      const storeId = '507f1f77bcf86cd799439014'
      const itemId = '507f1f77bcf86cd799439015'
      const mockInventoryItem = TestDataFactory.createInventory({
        _id: itemId,
        totalStock: 60,
        availableStock: 60,
        enableAvailableStock: true
      })

      const mockLogs = [
        TestDataFactory.createStockLog({ changeAmount: -1, changeType: 'order' }),
        TestDataFactory.createStockLog({ changeAmount: -2, changeType: 'order' })
      ]

      mockInventory.findOne.mockResolvedValue(mockInventoryItem)
      // getItemInventoryStats 直接 await StockLog.find()，需要返回 mockLogs 陣列
      const mockQueryChain = {
        sort: vi.fn().mockResolvedValue(mockLogs),
        then: vi.fn().mockImplementation((resolve) => resolve(mockLogs)),
        catch: vi.fn().mockReturnThis()
      }
      mockStockLog.find.mockReturnValue(mockQueryChain)
      mockStockLog.findOne.mockReturnValue(createStockLogQueryChain(null))

      const options = { storeId, itemId }
      const result = await stockStatsService.getItemInventoryStats(options)

      // Daily consumption rate = 3 / 30 = 0.1 per day
      expect(result.consumptionRate).toBe(0.1)
      
      // Estimated days left = 60 / 0.1 = 600 days
      expect(result.estimatedDaysLeft).toBe(600)
    })
  })

  describe('getInventoryHealthReport', () => {
    it('should generate health report structure', async () => {
      const storeId = '507f1f77bcf86cd799439014'
      const mockInventoryItems = [
        TestDataFactory.createInventory({
          _id: '1',
          totalStock: 100,
          needsRestock: false,
          isSoldOut: false
        }),
        TestDataFactory.createInventory({
          _id: '2',
          totalStock: 5,
          needsRestock: true,
          isSoldOut: false
        }),
        TestDataFactory.createInventory({
          _id: '3',
          totalStock: 0,
          needsRestock: false,
          isSoldOut: true
        })
      ]

      // 設定 Inventory mock chain 返回 mockInventoryItems
      let populateCallCount = 0
      const inventoryQueryChain = {
        populate: vi.fn().mockImplementation(() => {
          populateCallCount++
          // 第2個 populate 調用返回結果
          if (populateCallCount >= 2) {
            return Promise.resolve(mockInventoryItems)
          }
          return inventoryQueryChain
        }),
        lean: vi.fn().mockResolvedValue(mockInventoryItems)
      }
      mockInventory.find.mockReturnValue(inventoryQueryChain)
      
      // Mock the StockLog queries needed by getItemInventoryStats
      const stockLogQueryChain = {
        sort: vi.fn().mockResolvedValue([])
      }
      mockStockLog.find.mockReturnValue(stockLogQueryChain)
      mockStockLog.findOne.mockReturnValue(createStockLogQueryChain(null))

      const result = await stockStatsService.getInventoryHealthReport(storeId)

      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('needsRestock')
      expect(result).toHaveProperty('critical')
      expect(result).toHaveProperty('soldOut')
      expect(result).toHaveProperty('healthy')
      expect(Array.isArray(result.needsRestock)).toBe(true)
      expect(Array.isArray(result.soldOut)).toBe(true)
    })

    it('should filter by inventory type', async () => {
      const storeId = '507f1f77bcf86cd799439014'

      // 設定 Inventory mock chain 返回空陣列
      let populateCallCount = 0
      const inventoryQueryChain = {
        populate: vi.fn().mockImplementation(() => {
          populateCallCount++
          // 第2個 populate 調用返回結果
          if (populateCallCount >= 2) {
            return Promise.resolve([])
          }
          return inventoryQueryChain
        }),
        lean: vi.fn().mockResolvedValue([])
      }
      mockInventory.find.mockReturnValue(inventoryQueryChain)

      await stockStatsService.getInventoryHealthReport(storeId, {
        inventoryType: 'DishTemplate'
      })

      expect(mockInventory.find).toHaveBeenCalledWith({
        store: storeId,
        isInventoryTracked: true,
        inventoryType: 'DishTemplate'
      })
    })
  })

  describe('getStockChangeSummary', () => {
    it('should get stock change summary by change type', async () => {
      const storeId = '507f1f77bcf86cd799439014'
      const mockAggregateResult = [
        {
          _id: 'order',
          totalChanges: 10,
          totalAmount: -50,
          increases: 0,
          decreases: -50
        },
        {
          _id: 'restock',
          totalChanges: 5,
          totalAmount: 100,
          increases: 100,
          decreases: 0
        }
      ]

      mockStockLog.aggregate.mockResolvedValue(mockAggregateResult)

      const options = { storeId }
      const result = await stockStatsService.getStockChangeSummary(options)

      expect(result).toMatchObject({
        order: {
          totalChanges: 10,
          totalAmount: -50,
          increases: 0,
          decreases: 50
        },
        restock: {
          totalChanges: 5,
          totalAmount: 100,
          increases: 100,
          decreases: 0
        }
      })

      expect(mockStockLog.aggregate).toHaveBeenCalled()
    })

    it('should use predefined period for filtering', async () => {
      const storeId = '507f1f77bcf86cd799439014'

      mockStockLog.aggregate.mockResolvedValue([])

      const options = { storeId, period: 'last7Days' }
      await stockStatsService.getStockChangeSummary(options)

      const { createDateRange } = await import('@server/utils/date.js')
      expect(createDateRange).toHaveBeenCalledWith('last7Days')
    })

    it('should handle custom date range', async () => {
      const storeId = '507f1f77bcf86cd799439014'
      const startDate = '2024-08-01'
      const endDate = '2024-08-31'

      mockStockLog.aggregate.mockResolvedValue([])

      const options = { storeId, startDate, endDate }
      await stockStatsService.getStockChangeSummary(options)

      // Should not call createDateRange when custom dates provided
      const { parseDateString, getStartOfDay, getEndOfDay } = await import('@server/utils/date.js')
      expect(parseDateString).toHaveBeenCalledWith(startDate)
      expect(parseDateString).toHaveBeenCalledWith(endDate)
      expect(getStartOfDay).toHaveBeenCalled()
      expect(getEndOfDay).toHaveBeenCalled()
    })

    it('should filter by inventory type', async () => {
      const storeId = '507f1f77bcf86cd799439014'

      mockStockLog.aggregate.mockResolvedValue([])

      const options = { storeId, inventoryType: 'DishTemplate' }
      await stockStatsService.getStockChangeSummary(options)

      const expectedMatchConditions = expect.objectContaining({
        inventoryType: 'DishTemplate'
      })
      
      expect(mockStockLog.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: expectedMatchConditions
          })
        ])
      )
    })
  })
})