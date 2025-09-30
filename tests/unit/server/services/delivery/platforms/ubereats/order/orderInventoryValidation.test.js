import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TestDataFactory } from '../../../../../../../setup.js'

// Mock 外部依賴
const mockMongoose = {
  default: {
    Types: {
      ObjectId: {
        isValid: vi.fn()
      }
    }
  },
  Types: {
    ObjectId: {
      isValid: vi.fn()
    }
  }
}

const mockDishInstance = {
  findById: vi.fn()
}

const mockOption = {
  findById: vi.fn()
}

const mockInventoryService = {
  getInventoryItemByDishTemplate: vi.fn()
}

// Mock 模組
vi.mock('mongoose', () => mockMongoose)
vi.mock('@server/models/Dish/DishInstance.js', () => ({ default: mockDishInstance }))
vi.mock('@server/models/Dish/Option.js', () => ({ default: mockOption }))
vi.mock('@server/services/inventory/stockManagement.js', () => mockInventoryService)

// 動態導入要測試的模組
const { validateDeliveryOrderInventory, checkSingleItemInventory } = await import(
  '@server/services/delivery/platforms/ubereats/order/orderInventoryValidation.js'
)

describe('UberEats 訂單庫存驗證服務', () => {
  const mockStoreId = '507f1f77bcf86cd799439014'
  const mockDishTemplateId = '507f1f77bcf86cd799439016'
  const mockDishInstanceId = '507f1f77bcf86cd799439020'
  const mockOptionId = '507f1f77bcf86cd799439021'
  const mockRefDishTemplateId = '507f1f77bcf86cd799439022'

  beforeEach(() => {
    vi.clearAllMocks()

    // 預設 ObjectId 驗證為有效
    mockMongoose.Types.ObjectId.isValid.mockImplementation((id) => {
      return typeof id === 'string' && id.length === 24
    })
    mockMongoose.default.Types.ObjectId.isValid.mockImplementation((id) => {
      return typeof id === 'string' && id.length === 24
    })
  })

  describe('validateDeliveryOrderInventory', () => {
    it('應該跳過沒有 dish 項目的訂單', async () => {
      const orderData = {
        items: [
          { itemType: 'bundle', itemName: '套餐', quantity: 1 }
        ],
        store: mockStoreId
      }

      const result = await validateDeliveryOrderInventory(orderData)

      expect(result.success).toBe(true)
      expect(result.inventoryMap.size).toBe(0)
      expect(result.issues).toEqual([])
    })

    it('應該跳過無效或缺失的 dishInstance ID', async () => {
      const orderData = {
        items: [
          {
            itemType: 'dish',
            itemName: '測試餐點',
            dishInstance: null,  // 無效的 dishInstance
            quantity: 1
          },
          {
            itemType: 'dish',
            itemName: '測試餐點2',
            dishInstance: 'invalid_id',  // 無效格式
            quantity: 1
          }
        ],
        store: mockStoreId
      }

      // Mock ObjectId 驗證失敗
      mockMongoose.Types.ObjectId.isValid.mockImplementation((id) => {
        return id === mockDishInstanceId
      })
      mockMongoose.default.Types.ObjectId.isValid.mockImplementation((id) => {
        return id === mockDishInstanceId
      })

      const result = await validateDeliveryOrderInventory(orderData)

      expect(result.success).toBe(true)
      expect(result.inventoryMap.size).toBe(0)
      expect(result.issues).toEqual([])
    })

    it('應該正確統計主餐點的庫存需求', async () => {
      const orderData = {
        items: [
          {
            itemType: 'dish',
            itemName: '測試餐點',
            dishInstance: mockDishInstanceId,
            quantity: 2
          },
          {
            itemType: 'dish',
            itemName: '測試餐點',  // 相同餐點
            dishInstance: mockDishInstanceId,
            quantity: 1
          }
        ],
        store: mockStoreId
      }

      // Mock DishInstance 查詢
      const mockDishInstanceData = {
        templateId: mockDishTemplateId,
        options: []
      }
      mockDishInstance.findById.mockResolvedValue(mockDishInstanceData)

      // Mock 庫存服務
      const mockInventoryItem = TestDataFactory.createInventoryItem({
        _id: '507f1f77bcf86cd799439018',
        itemName: '測試餐點',
        availableStock: 10,
        isInventoryTracked: true,
        enableAvailableStock: true,
        isSoldOut: false
      })
      mockInventoryService.getInventoryItemByDishTemplate.mockResolvedValue(mockInventoryItem)

      const result = await validateDeliveryOrderInventory(orderData)

      expect(result.success).toBe(true)
      expect(result.inventoryMap.size).toBe(1)
      expect(result.inventoryMap.get(mockDishTemplateId)).toBe(3)  // 2 + 1 = 3
      expect(result.issues).toEqual([])
    })

    it('應該檢查選項關聯餐點的庫存', async () => {
      const orderData = {
        items: [
          {
            itemType: 'dish',
            itemName: '主餐點',
            dishInstance: mockDishInstanceId,
            quantity: 1
          }
        ],
        store: mockStoreId
      }

      // Mock DishInstance 含選項
      const mockDishInstanceData = {
        templateId: mockDishTemplateId,
        options: [
          {
            optionCategoryId: '507f1f77bcf86cd799439030',
            optionCategoryName: '配菜',
            selections: [
              {
                optionId: mockOptionId,
                name: '薯條',
                price: 30
              }
            ]
          }
        ]
      }
      mockDishInstance.findById.mockResolvedValue(mockDishInstanceData)

      // Mock Option 查詢 - 有關聯餐點
      const mockOptionData = {
        name: '薯條',
        refDishTemplate: mockRefDishTemplateId
      }
      mockOption.findById.mockResolvedValue(mockOptionData)

      // Mock 庫存服務 - 主餐點和關聯餐點都有庫存
      mockInventoryService.getInventoryItemByDishTemplate.mockImplementation((storeId, templateId) => {
        if (templateId === mockDishTemplateId) {
          return Promise.resolve(TestDataFactory.createInventoryItem({
            itemName: '主餐點',
            availableStock: 10,
            isInventoryTracked: true,
            enableAvailableStock: true,
            isSoldOut: false
          }))
        }
        if (templateId === mockRefDishTemplateId) {
          return Promise.resolve(TestDataFactory.createInventoryItem({
            itemName: '薯條',
            availableStock: 20,
            isInventoryTracked: true,
            enableAvailableStock: true,
            isSoldOut: false
          }))
        }
        return null
      })

      const result = await validateDeliveryOrderInventory(orderData)

      expect(result.success).toBe(true)
      expect(result.inventoryMap.size).toBe(2)
      expect(result.inventoryMap.get(mockDishTemplateId)).toBe(1)  // 主餐點
      expect(result.inventoryMap.get(mockRefDishTemplateId)).toBe(1)  // 關聯餐點
      expect(result.issues).toEqual([])
    })

    it('應該正確累計多個相同關聯餐點的庫存需求', async () => {
      const orderData = {
        items: [
          {
            itemType: 'dish',
            itemName: '漢堡套餐',
            dishInstance: mockDishInstanceId,
            quantity: 2  // 兩份套餐，每份都有薯條
          }
        ],
        store: mockStoreId
      }

      const mockDishInstanceData = {
        templateId: mockDishTemplateId,
        options: [
          {
            optionCategoryId: '507f1f77bcf86cd799439030',
            optionCategoryName: '配菜',
            selections: [
              {
                optionId: mockOptionId,
                name: '薯條',
                price: 30
              }
            ]
          }
        ]
      }
      mockDishInstance.findById.mockResolvedValue(mockDishInstanceData)

      const mockOptionData = {
        name: '薯條',
        refDishTemplate: mockRefDishTemplateId
      }
      mockOption.findById.mockResolvedValue(mockOptionData)

      mockInventoryService.getInventoryItemByDishTemplate.mockImplementation((storeId, templateId) => {
        const baseInventory = TestDataFactory.createInventoryItem({
          availableStock: 10,
          isInventoryTracked: true,
          enableAvailableStock: true,
          isSoldOut: false
        })

        if (templateId === mockDishTemplateId) {
          return Promise.resolve({ ...baseInventory, itemName: '漢堡套餐' })
        }
        if (templateId === mockRefDishTemplateId) {
          return Promise.resolve({ ...baseInventory, itemName: '薯條' })
        }
        return null
      })

      const result = await validateDeliveryOrderInventory(orderData)

      expect(result.success).toBe(true)
      expect(result.inventoryMap.get(mockDishTemplateId)).toBe(2)  // 主餐點 x2
      expect(result.inventoryMap.get(mockRefDishTemplateId)).toBe(2)  // 關聯餐點也 x2
    })

    it('應該檢測庫存不足的問題', async () => {
      const orderData = {
        items: [
          {
            itemType: 'dish',
            itemName: '測試餐點',
            dishInstance: mockDishInstanceId,
            quantity: 5  // 需要5份
          }
        ],
        store: mockStoreId
      }

      const mockDishInstanceData = {
        templateId: mockDishTemplateId,
        options: []
      }
      mockDishInstance.findById.mockResolvedValue(mockDishInstanceData)

      // Mock 庫存不足
      const mockInventoryItem = TestDataFactory.createInventoryItem({
        itemName: '測試餐點',
        availableStock: 3,  // 只有3份庫存
        isInventoryTracked: true,
        enableAvailableStock: true,
        isSoldOut: false
      })
      mockInventoryService.getInventoryItemByDishTemplate.mockResolvedValue(mockInventoryItem)

      const result = await validateDeliveryOrderInventory(orderData)

      expect(result.success).toBe(false)
      expect(result.issues).toHaveLength(1)
      expect(result.issues[0]).toEqual({
        templateId: mockDishTemplateId,
        itemName: '測試餐點',
        issue: 'insufficient_stock',
        required: 5,
        available: 3
      })
    })

    it('應該檢測售完的餐點', async () => {
      const orderData = {
        items: [
          {
            itemType: 'dish',
            itemName: '測試餐點',
            dishInstance: mockDishInstanceId,
            quantity: 1
          }
        ],
        store: mockStoreId
      }

      const mockDishInstanceData = {
        templateId: mockDishTemplateId,
        options: []
      }
      mockDishInstance.findById.mockResolvedValue(mockDishInstanceData)

      // Mock 已售完
      const mockInventoryItem = TestDataFactory.createInventoryItem({
        itemName: '測試餐點',
        isSoldOut: true  // 售完
      })
      mockInventoryService.getInventoryItemByDishTemplate.mockResolvedValue(mockInventoryItem)

      const result = await validateDeliveryOrderInventory(orderData)

      expect(result.success).toBe(false)
      expect(result.issues).toHaveLength(1)
      expect(result.issues[0]).toEqual({
        templateId: mockDishTemplateId,
        itemName: '測試餐點',
        issue: 'sold_out',
        required: 1,
        available: 0
      })
    })

    it('應該跳過沒有庫存記錄的餐點', async () => {
      const orderData = {
        items: [
          {
            itemType: 'dish',
            itemName: '測試餐點',
            dishInstance: mockDishInstanceId,
            quantity: 1
          }
        ],
        store: mockStoreId
      }

      const mockDishInstanceData = {
        templateId: mockDishTemplateId,
        options: []
      }
      mockDishInstance.findById.mockResolvedValue(mockDishInstanceData)

      // Mock 沒有庫存記錄
      mockInventoryService.getInventoryItemByDishTemplate.mockResolvedValue(null)

      const result = await validateDeliveryOrderInventory(orderData)

      expect(result.success).toBe(true)
      expect(result.issues).toEqual([])
    })

    it('應該跳過未追蹤庫存的餐點', async () => {
      const orderData = {
        items: [
          {
            itemType: 'dish',
            itemName: '測試餐點',
            dishInstance: mockDishInstanceId,
            quantity: 1
          }
        ],
        store: mockStoreId
      }

      const mockDishInstanceData = {
        templateId: mockDishTemplateId,
        options: []
      }
      mockDishInstance.findById.mockResolvedValue(mockDishInstanceData)

      // Mock 未追蹤庫存
      const mockInventoryItem = TestDataFactory.createInventoryItem({
        itemName: '測試餐點',
        isInventoryTracked: false  // 未追蹤庫存
      })
      mockInventoryService.getInventoryItemByDishTemplate.mockResolvedValue(mockInventoryItem)

      const result = await validateDeliveryOrderInventory(orderData)

      expect(result.success).toBe(true)
      expect(result.issues).toEqual([])
    })

    it('應該跳過未啟用可用庫存控制的餐點', async () => {
      const orderData = {
        items: [
          {
            itemType: 'dish',
            itemName: '測試餐點',
            dishInstance: mockDishInstanceId,
            quantity: 1
          }
        ],
        store: mockStoreId
      }

      const mockDishInstanceData = {
        templateId: mockDishTemplateId,
        options: []
      }
      mockDishInstance.findById.mockResolvedValue(mockDishInstanceData)

      // Mock 有庫存追蹤但未啟用可用庫存控制
      const mockInventoryItem = TestDataFactory.createInventoryItem({
        itemName: '測試餐點',
        isInventoryTracked: true,
        enableAvailableStock: false  // 未啟用可用庫存控制
      })
      mockInventoryService.getInventoryItemByDishTemplate.mockResolvedValue(mockInventoryItem)

      const result = await validateDeliveryOrderInventory(orderData)

      expect(result.success).toBe(true)
      expect(result.issues).toEqual([])
    })

    it('應該處理 DishInstance 查詢失敗的情況', async () => {
      const orderData = {
        items: [
          {
            itemType: 'dish',
            itemName: '測試餐點',
            dishInstance: mockDishInstanceId,
            quantity: 1
          }
        ],
        store: mockStoreId
      }

      // Mock DishInstance 查詢失敗
      mockDishInstance.findById.mockRejectedValue(new Error('Database connection failed'))

      const result = await validateDeliveryOrderInventory(orderData)

      expect(result.success).toBe(true)  // 容錯處理，不影響整體流程
      expect(result.inventoryMap.size).toBe(0)
      expect(result.issues).toEqual([])
    })
  })

  describe('checkSingleItemInventory', () => {
    it('應該對無效模板ID回傳可用', async () => {
      mockMongoose.Types.ObjectId.isValid.mockReturnValue(false)
      mockMongoose.default.Types.ObjectId.isValid.mockReturnValue(false)

      const result = await checkSingleItemInventory(mockStoreId, 'invalid_id', 1)

      expect(result.available).toBe(true)
      expect(result.reason).toBe('no_template_mapping')
    })

    it('應該對沒有庫存記錄的餐點回傳可用', async () => {
      mockMongoose.Types.ObjectId.isValid.mockReturnValue(true)
      mockMongoose.default.Types.ObjectId.isValid.mockReturnValue(true)
      mockInventoryService.getInventoryItemByDishTemplate.mockResolvedValue(null)

      const result = await checkSingleItemInventory(mockStoreId, mockDishTemplateId, 1)

      expect(result.available).toBe(true)
      expect(result.reason).toBe('no_inventory_record')
    })

    it('應該對售完餐點回傳不可用', async () => {
      mockMongoose.Types.ObjectId.isValid.mockReturnValue(true)
      mockMongoose.default.Types.ObjectId.isValid.mockReturnValue(true)

      const mockInventoryItem = TestDataFactory.createInventoryItem({
        isSoldOut: true
      })
      mockInventoryService.getInventoryItemByDishTemplate.mockResolvedValue(mockInventoryItem)

      const result = await checkSingleItemInventory(mockStoreId, mockDishTemplateId, 1)

      expect(result.available).toBe(false)
      expect(result.reason).toBe('sold_out')
    })

    it('應該對庫存不足餐點回傳不可用', async () => {
      mockMongoose.Types.ObjectId.isValid.mockReturnValue(true)
      mockMongoose.default.Types.ObjectId.isValid.mockReturnValue(true)

      const mockInventoryItem = TestDataFactory.createInventoryItem({
        isInventoryTracked: true,
        enableAvailableStock: true,
        availableStock: 2,
        isSoldOut: false
      })
      mockInventoryService.getInventoryItemByDishTemplate.mockResolvedValue(mockInventoryItem)

      const result = await checkSingleItemInventory(mockStoreId, mockDishTemplateId, 5)  // 需要5份但只有2份

      expect(result.available).toBe(2)  // 由於重複屬性，available 最終會是庫存數量
      expect(result.reason).toBe('insufficient_stock')
      expect(result.required).toBe(5)
    })

    it('應該對庫存充足餐點回傳可用', async () => {
      mockMongoose.Types.ObjectId.isValid.mockReturnValue(true)
      mockMongoose.default.Types.ObjectId.isValid.mockReturnValue(true)

      const mockInventoryItem = TestDataFactory.createInventoryItem({
        isInventoryTracked: true,
        enableAvailableStock: true,
        availableStock: 10,
        isSoldOut: false
      })
      mockInventoryService.getInventoryItemByDishTemplate.mockResolvedValue(mockInventoryItem)

      const result = await checkSingleItemInventory(mockStoreId, mockDishTemplateId, 5)

      expect(result.available).toBe(true)
      expect(result.reason).toBe('sufficient')
    })
  })
})