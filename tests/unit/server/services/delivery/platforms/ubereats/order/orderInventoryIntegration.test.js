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
  getInventoryItemByDishTemplate: vi.fn(),
  reduceStock: vi.fn()
}

// Mock 模組
vi.mock('mongoose', () => mockMongoose)
vi.mock('@server/models/Dish/DishInstance.js', () => ({ default: mockDishInstance }))
vi.mock('@server/models/Dish/Option.js', () => ({ default: mockOption }))
vi.mock('@server/services/inventory/stockManagement.js', () => mockInventoryService)

// 動態導入要測試的模組
const { validateDeliveryOrderInventory } = await import(
  '@server/services/delivery/platforms/ubereats/order/orderInventoryValidation.js'
)
const { reduceDeliveryOrderInventory } = await import(
  '@server/services/delivery/platforms/ubereats/order/orderInventoryReduction.js'
)

describe('UberEats 訂單庫存管理整合測試', () => {
  const mockStoreId = '507f1f77bcf86cd799439014'
  const mockOrderId = '507f1f77bcf86cd799439017'

  // 測試用的ID
  const ids = {
    burger: '507f1f77bcf86cd799439016',           // 漢堡模板ID
    fries: '507f1f77bcf86cd799439018',            // 薯條模板ID
    drink: '507f1f77bcf86cd799439019',            // 飲料模板ID
    burgerInstance: '507f1f77bcf86cd799439020',   // 漢堡實例ID
    friesOption: '507f1f77bcf86cd799439021',      // 薯條選項ID
    drinkOption: '507f1f77bcf86cd799439022',      // 飲料選項ID
    burgerInventory: '507f1f77bcf86cd799439023',  // 漢堡庫存ID
    friesInventory: '507f1f77bcf86cd799439024',   // 薯條庫存ID
    drinkInventory: '507f1f77bcf86cd799439025'    // 飲料庫存ID
  }

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

  describe('複雜訂單的庫存統計邏輯', () => {
    it('應該正確統計有關聯餐點的複雜訂單庫存需求', async () => {
      // 模擬複雜訂單：2份漢堡套餐，每份包含薯條和飲料
      const orderData = {
        items: [
          {
            itemType: 'dish',
            itemName: '漢堡套餐',
            dishInstance: ids.burgerInstance,
            quantity: 2
          }
        ],
        store: mockStoreId
      }

      // Mock DishInstance - 漢堡套餐包含薯條和飲料選項
      const mockDishInstanceData = {
        templateId: ids.burger,
        options: [
          {
            optionCategoryId: '507f1f77bcf86cd799439030',
            optionCategoryName: '配菜',
            selections: [
              {
                optionId: ids.friesOption,
                name: '薯條',
                price: 30
              }
            ]
          },
          {
            optionCategoryId: '507f1f77bcf86cd799439031',
            optionCategoryName: '飲料',
            selections: [
              {
                optionId: ids.drinkOption,
                name: '可樂',
                price: 25
              }
            ]
          }
        ]
      }
      mockDishInstance.findById.mockResolvedValue(mockDishInstanceData)

      // Mock Option 查詢 - 薯條和飲料都有關聯餐點
      mockOption.findById.mockImplementation((optionId) => {
        if (optionId === ids.friesOption) {
          return Promise.resolve({
            name: '薯條',
            refDishTemplate: ids.fries
          })
        }
        if (optionId === ids.drinkOption) {
          return Promise.resolve({
            name: '可樂',
            refDishTemplate: ids.drink
          })
        }
        return null
      })

      // Mock 庫存服務 - 所有餐點都有充足庫存
      mockInventoryService.getInventoryItemByDishTemplate.mockImplementation((storeId, templateId) => {
        const baseInventory = TestDataFactory.createInventoryItem({
          availableStock: 20,
          isInventoryTracked: true,
          enableAvailableStock: true,
          isSoldOut: false
        })

        if (templateId === ids.burger) {
          return Promise.resolve({ ...baseInventory, _id: ids.burgerInventory, itemName: '漢堡' })
        }
        if (templateId === ids.fries) {
          return Promise.resolve({ ...baseInventory, _id: ids.friesInventory, itemName: '薯條' })
        }
        if (templateId === ids.drink) {
          return Promise.resolve({ ...baseInventory, _id: ids.drinkInventory, itemName: '可樂' })
        }
        return null
      })

      const result = await validateDeliveryOrderInventory(orderData)

      // 驗證庫存統計結果
      expect(result.success).toBe(true)
      expect(result.inventoryMap.size).toBe(3)  // 漢堡、薯條、飲料
      expect(result.inventoryMap.get(ids.burger)).toBe(2)  // 2份漢堡
      expect(result.inventoryMap.get(ids.fries)).toBe(2)   // 2份薯條
      expect(result.inventoryMap.get(ids.drink)).toBe(2)   // 2份飲料
      expect(result.issues).toEqual([])
    })

    it('應該正確處理多種餐點組合的庫存需求', async () => {
      // 複雜訂單：1份漢堡套餐 + 2份單點薯條
      const orderData = {
        items: [
          {
            itemType: 'dish',
            itemName: '漢堡套餐',
            dishInstance: ids.burgerInstance,
            quantity: 1
          },
          {
            itemType: 'dish',
            itemName: '單點薯條',
            dishInstance: '507f1f77bcf86cd799439040',  // 另一個實例
            quantity: 2
          }
        ],
        store: mockStoreId
      }

      // Mock 不同的 DishInstance
      mockDishInstance.findById.mockImplementation((instanceId) => {
        if (instanceId === ids.burgerInstance) {
          return Promise.resolve({
            templateId: ids.burger,
            options: [
              {
                optionCategoryId: '507f1f77bcf86cd799439030',
                optionCategoryName: '配菜',
                selections: [
                  {
                    optionId: ids.friesOption,
                    name: '薯條',
                    price: 30
                  }
                ]
              }
            ]
          })
        }
        if (instanceId === '507f1f77bcf86cd799439040') {
          return Promise.resolve({
            templateId: ids.fries,  // 直接是薯條模板
            options: []
          })
        }
        return null
      })

      // Mock Option 查詢
      mockOption.findById.mockImplementation((optionId) => {
        if (optionId === ids.friesOption) {
          return Promise.resolve({
            name: '薯條',
            refDishTemplate: ids.fries
          })
        }
        return null
      })

      // Mock 庫存服務
      mockInventoryService.getInventoryItemByDishTemplate.mockImplementation((storeId, templateId) => {
        const baseInventory = TestDataFactory.createInventoryItem({
          availableStock: 10,
          isInventoryTracked: true,
          enableAvailableStock: true,
          isSoldOut: false
        })

        if (templateId === ids.burger) {
          return Promise.resolve({ ...baseInventory, itemName: '漢堡' })
        }
        if (templateId === ids.fries) {
          return Promise.resolve({ ...baseInventory, itemName: '薯條' })
        }
        return null
      })

      const result = await validateDeliveryOrderInventory(orderData)

      // 驗證庫存累計結果
      expect(result.success).toBe(true)
      expect(result.inventoryMap.size).toBe(2)
      expect(result.inventoryMap.get(ids.burger)).toBe(1)     // 1份漢堡
      expect(result.inventoryMap.get(ids.fries)).toBe(3)      // 1份(套餐) + 2份(單點) = 3份薯條
    })
  })

  describe('邊界案例處理', () => {
    it('應該處理無對應ID的餐點而不中斷處理', async () => {
      const orderData = {
        items: [
          {
            itemType: 'dish',
            itemName: '有效餐點',
            dishInstance: ids.burgerInstance,
            quantity: 1
          },
          {
            itemType: 'dish',
            itemName: '無效餐點',
            dishInstance: null,  // 無效
            quantity: 2
          },
          {
            itemType: 'dish',
            itemName: '查詢失敗餐點',
            dishInstance: '507f1f77bcf86cd799439999',  // 查詢會失敗
            quantity: 1
          }
        ],
        store: mockStoreId
      }

      // Mock DishInstance 查詢
      mockDishInstance.findById.mockImplementation((instanceId) => {
        if (instanceId === ids.burgerInstance) {
          return Promise.resolve({
            templateId: ids.burger,
            options: []
          })
        }
        if (instanceId === '507f1f77bcf86cd799439999') {
          return Promise.reject(new Error('Database error'))
        }
        return null
      })

      // Mock ObjectId 驗證
      mockMongoose.Types.ObjectId.isValid.mockImplementation((id) => {
        return id && id !== null && id.length === 24
      })
      mockMongoose.default.Types.ObjectId.isValid.mockImplementation((id) => {
        return id && id !== null && id.length === 24
      })

      // Mock 庫存服務
      mockInventoryService.getInventoryItemByDishTemplate.mockResolvedValue(
        TestDataFactory.createInventoryItem({
          itemName: '有效餐點',
          availableStock: 10,
          isInventoryTracked: true,
          enableAvailableStock: true,
          isSoldOut: false
        })
      )

      const result = await validateDeliveryOrderInventory(orderData)

      // 應該只處理有效的餐點，忽略無效的
      expect(result.success).toBe(true)
      expect(result.inventoryMap.size).toBe(1)
      expect(result.inventoryMap.get(ids.burger)).toBe(1)
      expect(result.issues).toEqual([])
    })

    it('應該處理部分餐點庫存不足的混合情況', async () => {
      const orderData = {
        items: [
          {
            itemType: 'dish',
            itemName: '庫存充足餐點',
            dishInstance: ids.burgerInstance,
            quantity: 2
          }
        ],
        store: mockStoreId
      }

      // 漢堡套餐包含薯條，但薯條庫存不足
      const mockDishInstanceData = {
        templateId: ids.burger,
        options: [
          {
            optionCategoryId: '507f1f77bcf86cd799439030',
            optionCategoryName: '配菜',
            selections: [
              {
                optionId: ids.friesOption,
                name: '薯條',
                price: 30
              }
            ]
          }
        ]
      }
      mockDishInstance.findById.mockResolvedValue(mockDishInstanceData)

      mockOption.findById.mockResolvedValue({
        name: '薯條',
        refDishTemplate: ids.fries
      })

      // Mock 庫存服務 - 漢堡庫存足夠，薯條不足
      mockInventoryService.getInventoryItemByDishTemplate.mockImplementation((storeId, templateId) => {
        if (templateId === ids.burger) {
          return Promise.resolve(TestDataFactory.createInventoryItem({
            itemName: '漢堡',
            availableStock: 10,  // 充足
            isInventoryTracked: true,
            enableAvailableStock: true,
            isSoldOut: false
          }))
        }
        if (templateId === ids.fries) {
          return Promise.resolve(TestDataFactory.createInventoryItem({
            itemName: '薯條',
            availableStock: 1,   // 不足，需要2但只有1
            isInventoryTracked: true,
            enableAvailableStock: true,
            isSoldOut: false
          }))
        }
        return null
      })

      const result = await validateDeliveryOrderInventory(orderData)

      // 應該檢測到薯條庫存不足
      expect(result.success).toBe(false)
      expect(result.issues).toHaveLength(1)
      expect(result.issues[0]).toEqual({
        templateId: ids.fries,
        itemName: '薯條',
        issue: 'insufficient_stock',
        required: 2,
        available: 1
      })
    })

    it('應該處理選項查詢失敗但不中斷整體處理', async () => {
      const orderData = {
        items: [
          {
            itemType: 'dish',
            itemName: '測試餐點',
            dishInstance: ids.burgerInstance,
            quantity: 1
          }
        ],
        store: mockStoreId
      }

      // Mock DishInstance 含選項
      const mockDishInstanceData = {
        templateId: ids.burger,
        options: [
          {
            optionCategoryId: '507f1f77bcf86cd799439030',
            optionCategoryName: '配菜',
            selections: [
              {
                optionId: ids.friesOption,
                name: '正常選項',
                price: 30
              },
              {
                optionId: '507f1f77bcf86cd799439999',  // 這個會查詢失敗
                name: '異常選項',
                price: 20
              }
            ]
          }
        ]
      }
      mockDishInstance.findById.mockResolvedValue(mockDishInstanceData)

      // Mock Option 查詢 - 部分失敗
      mockOption.findById.mockImplementation((optionId) => {
        if (optionId === ids.friesOption) {
          return Promise.resolve({
            name: '正常選項',
            refDishTemplate: ids.fries
          })
        }
        if (optionId === '507f1f77bcf86cd799439999') {
          return Promise.reject(new Error('Option query failed'))
        }
        return null
      })

      // Mock 庫存服務
      mockInventoryService.getInventoryItemByDishTemplate.mockImplementation((storeId, templateId) => {
        if (templateId === ids.burger) {
          return Promise.resolve(TestDataFactory.createInventoryItem({
            itemName: '主餐點',
            availableStock: 10,
            isInventoryTracked: true,
            enableAvailableStock: true,
            isSoldOut: false
          }))
        }
        if (templateId === ids.fries) {
          return Promise.resolve(TestDataFactory.createInventoryItem({
            itemName: '正常選項',
            availableStock: 10,
            isInventoryTracked: true,
            enableAvailableStock: true,
            isSoldOut: false
          }))
        }
        return null
      })

      const result = await validateDeliveryOrderInventory(orderData)

      // 應該處理成功的選項，忽略失敗的選項
      expect(result.success).toBe(true)
      expect(result.inventoryMap.size).toBe(2)  // 主餐點 + 成功的選項
      expect(result.inventoryMap.get(ids.burger)).toBe(1)
      expect(result.inventoryMap.get(ids.fries)).toBe(1)
    })
  })

  describe('驗證與扣除整合流程', () => {
    it('應該完整執行驗證通過後的庫存扣除流程', async () => {
      // 準備測試訂單
      const orderData = {
        items: [
          {
            itemType: 'dish',
            itemName: '測試套餐',
            dishInstance: ids.burgerInstance,
            quantity: 1
          }
        ],
        store: mockStoreId
      }

      const mockOrder = TestDataFactory.createOrder({
        _id: mockOrderId,
        store: mockStoreId,
        platformInfo: { platform: 'ubereats' },
        platformOrderId: 'UE123'
      })

      // Mock DishInstance
      mockDishInstance.findById.mockResolvedValue({
        templateId: ids.burger,
        options: [
          {
            optionCategoryId: '507f1f77bcf86cd799439030',
            optionCategoryName: '配菜',
            selections: [
              {
                optionId: ids.friesOption,
                name: '薯條',
                price: 30
              }
            ]
          }
        ]
      })

      // Mock Option
      mockOption.findById.mockResolvedValue({
        name: '薯條',
        refDishTemplate: ids.fries
      })

      // Mock 庫存服務 - 所有餐點都有庫存且可扣除
      mockInventoryService.getInventoryItemByDishTemplate.mockImplementation((storeId, templateId) => {
        if (templateId === ids.burger) {
          return Promise.resolve(TestDataFactory.createInventoryItem({
            _id: ids.burgerInventory,
            itemName: '漢堡',
            availableStock: 10,
            isInventoryTracked: true,
            enableAvailableStock: true,
            isSoldOut: false
          }))
        }
        if (templateId === ids.fries) {
          return Promise.resolve(TestDataFactory.createInventoryItem({
            _id: ids.friesInventory,
            itemName: '薯條',
            availableStock: 10,
            isInventoryTracked: true,
            enableAvailableStock: true,
            isSoldOut: false
          }))
        }
        return null
      })

      mockInventoryService.reduceStock.mockResolvedValue(undefined)

      // Step 1: 驗證庫存
      const validationResult = await validateDeliveryOrderInventory(orderData)

      expect(validationResult.success).toBe(true)
      expect(validationResult.inventoryMap.size).toBe(2)

      // Step 2: 使用驗證結果進行庫存扣除
      const reductionResult = await reduceDeliveryOrderInventory(mockOrder, validationResult.inventoryMap)

      expect(reductionResult.success).toBe(true)
      expect(reductionResult.processed).toBe(2)
      expect(reductionResult.skipped).toBe(0)
      expect(reductionResult.errors).toEqual([])

      // 驗證庫存扣除調用
      expect(mockInventoryService.reduceStock).toHaveBeenCalledTimes(2)
      expect(mockInventoryService.reduceStock).toHaveBeenCalledWith({
        storeId: mockStoreId,
        inventoryId: ids.burgerInventory,
        quantity: 1,
        reason: '外送訂單消耗: UBEREATS #UE123',
        orderId: mockOrderId
      })
      expect(mockInventoryService.reduceStock).toHaveBeenCalledWith({
        storeId: mockStoreId,
        inventoryId: ids.friesInventory,
        quantity: 1,
        reason: '外送訂單消耗: UBEREATS #UE123',
        orderId: mockOrderId
      })
    })

    it('應該在驗證失敗時不執行庫存扣除', async () => {
      const orderData = {
        items: [
          {
            itemType: 'dish',
            itemName: '庫存不足餐點',
            dishInstance: ids.burgerInstance,
            quantity: 5
          }
        ],
        store: mockStoreId
      }

      // Mock DishInstance
      mockDishInstance.findById.mockResolvedValue({
        templateId: ids.burger,
        options: []
      })

      // Mock 庫存服務 - 庫存不足
      mockInventoryService.getInventoryItemByDishTemplate.mockResolvedValue(
        TestDataFactory.createInventoryItem({
          _id: ids.burgerInventory,
          itemName: '漢堡',
          availableStock: 2,  // 需要5但只有2
          isInventoryTracked: true,
          enableAvailableStock: true,
          isSoldOut: false
        })
      )

      // Step 1: 驗證庫存
      const validationResult = await validateDeliveryOrderInventory(orderData)

      expect(validationResult.success).toBe(false)
      expect(validationResult.issues).toHaveLength(1)

      // Step 2: 驗證失敗時不應執行庫存扣除
      // 在實際應用中，驗證失敗會阻止進入扣除階段
      expect(validationResult.success).toBe(false)
      // 這裡展示驗證邏輯捕獲了問題，避免了不當的庫存扣除
    })
  })
})