import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TestDataFactory } from '../../../../setup.js'

// Mock 外部依賴
const mockInventory = {
  find: vi.fn(),
  findOne: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  findByIdAndUpdate: vi.fn(),
  aggregate: vi.fn(),
  countDocuments: vi.fn(),
  sort: vi.fn().mockReturnThis(),
  populate: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  skip: vi.fn().mockReturnThis(),
  lean: vi.fn().mockReturnThis(),
  exec: vi.fn()
}

const mockStockLog = {
  create: vi.fn(),
  find: vi.fn()
}

const mockStore = {
  findById: vi.fn()
}

const mockDishTemplate = {
  findById: vi.fn()
}

vi.mock('@server/models/Store/Inventory.js', () => ({ default: mockInventory }))
vi.mock('@server/models/Store/StockLog.js', () => ({ default: mockStockLog }))
vi.mock('@server/models/Store/Store.js', () => ({ default: mockStore }))
vi.mock('@server/models/Dish/DishTemplate.js', () => ({ default: mockDishTemplate }))

// 動態導入服務
const inventoryService = await import('@server/services/inventory/stockManagement.js')

describe('StockManagement Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getStoreInventory', () => {
    it('should get store inventory successfully', async () => {
      const storeId = '507f1f77bcf86cd799439014'
      const mockInventoryData = [
        TestDataFactory.createInventory({ store: storeId })
      ]

      // 設置 mock 鏈式調用
      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue(mockInventoryData)
      }

      mockInventory.find.mockReturnValue(mockQuery)

      const result = await inventoryService.getStoreInventory(storeId)

      expect(mockInventory.find).toHaveBeenCalledWith(
        expect.objectContaining({
          store: storeId
        })
      )
      expect(result).toEqual(mockInventoryData)
    })

    it('should filter by inventory type when specified', async () => {
      const storeId = '507f1f77bcf86cd799439014'
      const inventoryType = 'dish'
      
      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue([])
      }

      mockInventory.find.mockReturnValue(mockQuery)

      await inventoryService.getStoreInventory(storeId, { inventoryType })

      expect(mockInventory.find).toHaveBeenCalledWith(
        expect.objectContaining({
          store: storeId,
          inventoryType: inventoryType
        })
      )
    })

    it('should filter available stock when onlyAvailable is true', async () => {
      const storeId = '507f1f77bcf86cd799439014'
      
      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue([])
      }

      mockInventory.find.mockReturnValue(mockQuery)

      await inventoryService.getStoreInventory(storeId, { onlyAvailable: true })

      expect(mockInventory.find).toHaveBeenCalledWith(
        expect.objectContaining({
          store: storeId,
          $or: [
            { enableAvailableStock: true, availableStock: { $gt: 0 } },
            { enableAvailableStock: false, totalStock: { $gt: 0 } }
          ]
        })
      )
    })
  })

  describe('getInventoryItem', () => {
    it('should get inventory item successfully', async () => {
      const storeId = '507f1f77bcf86cd799439014'
      const inventoryId = '507f1f77bcf86cd799439018'
      
      const mockInventoryItem = TestDataFactory.createInventory({
        _id: inventoryId,
        store: storeId
      })

      // 創建支援雙重 populate 鏈式調用的 mock
      const mockQuery = {
        populate: vi.fn().mockReturnThis()
      }
      // 設置鏈式調用：第一次返回自身，第二次返回結果
      mockQuery.populate
        .mockReturnValueOnce(mockQuery)
        .mockResolvedValueOnce(mockInventoryItem)
      
      mockInventory.findOne.mockReturnValue(mockQuery)

      const result = await inventoryService.getInventoryItem(storeId, inventoryId)

      expect(mockInventory.findOne).toHaveBeenCalledWith({
        _id: inventoryId,
        store: storeId
      })
      expect(result).toEqual(mockInventoryItem)
    })

    it('should throw error when inventory item not found', async () => {
      const storeId = '507f1f77bcf86cd799439014'
      const inventoryId = 'invalid_id'
      
      const mockQuery = {
        populate: vi.fn().mockReturnThis()
      }
      // 設置鏈式調用返回 null
      mockQuery.populate
        .mockReturnValueOnce(mockQuery)
        .mockResolvedValueOnce(null)
      
      mockInventory.findOne.mockReturnValue(mockQuery)

      await expect(inventoryService.getInventoryItem(storeId, inventoryId))
        .rejects
        .toThrow('找不到此項目的庫存資訊')
    })
  })

  describe('getInventoryItemByDishTemplate', () => {
    it('should get inventory item by dish template successfully', async () => {
      const storeId = '507f1f77bcf86cd799439014'
      const dishTemplateId = '507f1f77bcf86cd799439016'
      
      const mockInventoryItem = TestDataFactory.createInventory({
        store: storeId,
        dishTemplate: dishTemplateId
      })

      const mockQuery = {
        populate: vi.fn().mockReturnThis()
      }
      // 設置雙重 populate 鏈式調用
      mockQuery.populate
        .mockReturnValueOnce(mockQuery)
        .mockResolvedValueOnce(mockInventoryItem)
      
      mockInventory.findOne.mockReturnValue(mockQuery)

      const result = await inventoryService.getInventoryItemByDishTemplate(storeId, dishTemplateId)

      expect(mockInventory.findOne).toHaveBeenCalledWith({
        store: storeId,
        inventoryType: 'DishTemplate',
        dish: dishTemplateId
      })
      expect(result).toEqual(mockInventoryItem)
    })

    it('should return null when inventory item not found', async () => {
      const storeId = '507f1f77bcf86cd799439014'
      const dishTemplateId = '507f1f77bcf86cd799439016'
      
      const mockQuery = {
        populate: vi.fn().mockReturnThis()
      }
      // 設置雙重 populate 鏈式調用返回 null
      mockQuery.populate
        .mockReturnValueOnce(mockQuery)
        .mockResolvedValueOnce(null)
      
      mockInventory.findOne.mockReturnValue(mockQuery)

      const result = await inventoryService.getInventoryItemByDishTemplate(storeId, dishTemplateId)

      expect(result).toBeNull()
    })
  })
})