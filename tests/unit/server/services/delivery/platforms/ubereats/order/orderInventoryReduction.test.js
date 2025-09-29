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

const mockInventoryService = {
  getInventoryItemByDishTemplate: vi.fn(),
  reduceStock: vi.fn(),
  restoreInventoryForCancelledOrder: vi.fn()
}

// Mock 模組
vi.mock('mongoose', () => mockMongoose)
vi.mock('@server/services/inventory/stockManagement.js', () => mockInventoryService)

// 動態導入要測試的模組
const {
  reduceDeliveryOrderInventory,
  restoreDeliveryOrderInventory,
  canProcessInventoryForDeliveryOrder,
  reduceSingleItemForDelivery
} = await import('@server/services/delivery/platforms/ubereats/order/orderInventoryReduction.js')

describe('UberEats 訂單庫存扣除服務', () => {
  const mockStoreId = '507f1f77bcf86cd799439014'
  const mockDishTemplateId = '507f1f77bcf86cd799439016'
  const mockOrderId = '507f1f77bcf86cd799439017'
  const mockInventoryId = '507f1f77bcf86cd799439018'

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

  describe('reduceDeliveryOrderInventory', () => {
    const mockOrder = TestDataFactory.createOrder({
      _id: mockOrderId,
      store: mockStoreId,
      platformInfo: {
        platform: 'ubereats'
      },
      platformOrderId: 'UE123456789'
    })

    it('應該處理空的庫存Map', async () => {
      const inventoryMap = new Map()

      const result = await reduceDeliveryOrderInventory(mockOrder, inventoryMap)

      expect(result.success).toBe(true)
      expect(result.processed).toBe(0)
      expect(result.skipped).toBe(0)
      expect(result.errors).toEqual([])
      expect(mockInventoryService.reduceStock).not.toHaveBeenCalled()
    })

    it('應該成功扣除單個餐點的庫存', async () => {
      const inventoryMap = new Map()
      inventoryMap.set(mockDishTemplateId, 2)

      // Mock 庫存項目
      const mockInventoryItem = TestDataFactory.createInventoryItem({
        _id: mockInventoryId,
        itemName: '測試餐點',
        isInventoryTracked: true,
        isSoldOut: false
      })
      mockInventoryService.getInventoryItemByDishTemplate.mockResolvedValue(mockInventoryItem)
      mockInventoryService.reduceStock.mockResolvedValue(undefined)

      const result = await reduceDeliveryOrderInventory(mockOrder, inventoryMap)

      expect(result.success).toBe(true)
      expect(result.processed).toBe(1)
      expect(result.skipped).toBe(0)
      expect(result.errors).toEqual([])

      expect(mockInventoryService.reduceStock).toHaveBeenCalledWith({
        storeId: mockStoreId,
        inventoryId: mockInventoryId,
        quantity: 2,
        reason: '外送訂單消耗: UBEREATS #UE123456789',
        orderId: mockOrderId
      })
    })

    it('應該成功扣除多個餐點的庫存', async () => {
      const mockDishTemplate2 = '507f1f77bcf86cd799439019'
      const mockInventoryId2 = '507f1f77bcf86cd799439020'

      const inventoryMap = new Map()
      inventoryMap.set(mockDishTemplateId, 1)
      inventoryMap.set(mockDishTemplate2, 2)

      // Mock 多個庫存項目
      mockInventoryService.getInventoryItemByDishTemplate.mockImplementation((storeId, templateId) => {
        if (templateId === mockDishTemplateId) {
          return Promise.resolve(TestDataFactory.createInventoryItem({
            _id: mockInventoryId,
            itemName: '測試餐點1',
            isInventoryTracked: true,
            isSoldOut: false
          }))
        }
        if (templateId === mockDishTemplate2) {
          return Promise.resolve(TestDataFactory.createInventoryItem({
            _id: mockInventoryId2,
            itemName: '測試餐點2',
            isInventoryTracked: true,
            isSoldOut: false
          }))
        }
        return null
      })
      mockInventoryService.reduceStock.mockResolvedValue(undefined)

      const result = await reduceDeliveryOrderInventory(mockOrder, inventoryMap)

      expect(result.success).toBe(true)
      expect(result.processed).toBe(2)
      expect(result.skipped).toBe(0)
      expect(result.errors).toEqual([])

      expect(mockInventoryService.reduceStock).toHaveBeenCalledTimes(2)
    })

    it('應該跳過無效的模板ID', async () => {
      const inventoryMap = new Map()
      inventoryMap.set('invalid_id', 1)

      mockMongoose.Types.ObjectId.isValid.mockReturnValue(false)
      mockMongoose.default.Types.ObjectId.isValid.mockReturnValue(false)

      const result = await reduceDeliveryOrderInventory(mockOrder, inventoryMap)

      expect(result.success).toBe(true)
      expect(result.processed).toBe(0)
      expect(result.skipped).toBe(1)
      expect(result.errors).toEqual([])
      expect(mockInventoryService.getInventoryItemByDishTemplate).not.toHaveBeenCalled()
    })

    it('應該跳過沒有庫存記錄的餐點', async () => {
      const inventoryMap = new Map()
      inventoryMap.set(mockDishTemplateId, 1)

      mockInventoryService.getInventoryItemByDishTemplate.mockResolvedValue(null)

      const result = await reduceDeliveryOrderInventory(mockOrder, inventoryMap)

      expect(result.success).toBe(true)
      expect(result.processed).toBe(0)
      expect(result.skipped).toBe(1)
      expect(result.errors).toEqual([])
      expect(mockInventoryService.reduceStock).not.toHaveBeenCalled()
    })

    it('應該跳過已售完的餐點', async () => {
      const inventoryMap = new Map()
      inventoryMap.set(mockDishTemplateId, 1)

      const mockInventoryItem = TestDataFactory.createInventoryItem({
        itemName: '測試餐點',
        isSoldOut: true  // 已售完
      })
      mockInventoryService.getInventoryItemByDishTemplate.mockResolvedValue(mockInventoryItem)

      const result = await reduceDeliveryOrderInventory(mockOrder, inventoryMap)

      expect(result.success).toBe(true)
      expect(result.processed).toBe(0)
      expect(result.skipped).toBe(1)
      expect(result.errors).toEqual([])
      expect(mockInventoryService.reduceStock).not.toHaveBeenCalled()
    })

    it('應該跳過未追蹤庫存的餐點', async () => {
      const inventoryMap = new Map()
      inventoryMap.set(mockDishTemplateId, 1)

      const mockInventoryItem = TestDataFactory.createInventoryItem({
        itemName: '測試餐點',
        isInventoryTracked: false,  // 未追蹤庫存
        isSoldOut: false
      })
      mockInventoryService.getInventoryItemByDishTemplate.mockResolvedValue(mockInventoryItem)

      const result = await reduceDeliveryOrderInventory(mockOrder, inventoryMap)

      expect(result.success).toBe(true)
      expect(result.processed).toBe(0)
      expect(result.skipped).toBe(1)
      expect(result.errors).toEqual([])
      expect(mockInventoryService.reduceStock).not.toHaveBeenCalled()
    })

    it('應該處理庫存扣除失敗的情況', async () => {
      const inventoryMap = new Map()
      inventoryMap.set(mockDishTemplateId, 1)

      const mockInventoryItem = TestDataFactory.createInventoryItem({
        _id: mockInventoryId,
        itemName: '測試餐點',
        isInventoryTracked: true,
        isSoldOut: false
      })
      mockInventoryService.getInventoryItemByDishTemplate.mockResolvedValue(mockInventoryItem)
      mockInventoryService.reduceStock.mockRejectedValue(new Error('庫存扣除失敗'))

      const result = await reduceDeliveryOrderInventory(mockOrder, inventoryMap)

      expect(result.success).toBe(false)  // 有錯誤時success為false
      expect(result.processed).toBe(0)
      expect(result.skipped).toBe(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].templateId).toBe(mockDishTemplateId)
      expect(result.errors[0].error).toBe('庫存扣除失敗')
    })

    it('應該部分成功扣除並記錄錯誤', async () => {
      const mockDishTemplate2 = '507f1f77bcf86cd799439019'
      const mockInventoryId2 = '507f1f77bcf86cd799439020'

      const inventoryMap = new Map()
      inventoryMap.set(mockDishTemplateId, 1)    // 這個會成功
      inventoryMap.set(mockDishTemplate2, 2)     // 這個會失敗

      mockInventoryService.getInventoryItemByDishTemplate.mockImplementation((storeId, templateId) => {
        const baseInventory = TestDataFactory.createInventoryItem({
          isInventoryTracked: true,
          isSoldOut: false
        })

        if (templateId === mockDishTemplateId) {
          return Promise.resolve({ ...baseInventory, _id: mockInventoryId, itemName: '餐點1' })
        }
        if (templateId === mockDishTemplate2) {
          return Promise.resolve({ ...baseInventory, _id: mockInventoryId2, itemName: '餐點2' })
        }
        return null
      })

      mockInventoryService.reduceStock.mockImplementation(({ inventoryId }) => {
        if (inventoryId === mockInventoryId) {
          return Promise.resolve()  // 成功
        }
        if (inventoryId === mockInventoryId2) {
          return Promise.reject(new Error('扣除失敗'))  // 失敗
        }
      })

      const result = await reduceDeliveryOrderInventory(mockOrder, inventoryMap)

      expect(result.success).toBe(false)  // 有部分失敗
      expect(result.processed).toBe(1)    // 成功處理1個
      expect(result.skipped).toBe(0)
      expect(result.errors).toHaveLength(1)  // 失敗1個
      expect(result.errors[0].templateId).toBe(mockDishTemplate2)
    })
  })

  describe('restoreDeliveryOrderInventory', () => {
    it('應該成功還原訂單庫存', async () => {
      const mockOrder = TestDataFactory.createOrder({
        _id: mockOrderId,
        store: mockStoreId
      })

      mockInventoryService.restoreInventoryForCancelledOrder.mockResolvedValue(undefined)

      const result = await restoreDeliveryOrderInventory(mockOrder)

      expect(result.success).toBe(true)
      expect(result.message).toBe('庫存還原成功')
      expect(mockInventoryService.restoreInventoryForCancelledOrder).toHaveBeenCalledWith(mockOrder)
    })

    it('應該處理庫存還原失敗的情況', async () => {
      const mockOrder = TestDataFactory.createOrder({
        _id: mockOrderId,
        store: mockStoreId
      })

      mockInventoryService.restoreInventoryForCancelledOrder.mockRejectedValue(
        new Error('還原失敗')
      )

      const result = await restoreDeliveryOrderInventory(mockOrder)

      expect(result.success).toBe(false)
      expect(result.error).toBe('還原失敗')
      expect(result.message).toBe('庫存還原失敗，但不影響訂單取消')
    })
  })

  describe('canProcessInventoryForDeliveryOrder', () => {
    it('應該對有效的外送訂單回傳true', () => {
      const mockOrder = TestDataFactory.createOrder({
        platformInfo: { platform: 'ubereats' },
        items: [
          {
            itemType: 'dish',
            itemName: '測試餐點',
            quantity: 1
          }
        ],
        status: 'paid'
      })

      const result = canProcessInventoryForDeliveryOrder(mockOrder)

      expect(result).toBe(true)
    })

    it('應該對沒有平台資訊的訂單回傳false', () => {
      const mockOrder = TestDataFactory.createOrder({
        platformInfo: null,
        status: 'paid'
      })

      const result = canProcessInventoryForDeliveryOrder(mockOrder)

      expect(result).toBe(false)
    })

    it('應該對沒有餐點項目的訂單回傳false', () => {
      const mockOrder = TestDataFactory.createOrder({
        platformInfo: { platform: 'ubereats' },
        items: [
          {
            itemType: 'bundle',
            itemName: '套餐',
            quantity: 1
          }
        ],
        status: 'paid'
      })

      const result = canProcessInventoryForDeliveryOrder(mockOrder)

      expect(result).toBe(false)
    })

    it('應該對未付款訂單回傳false', () => {
      const mockOrder = TestDataFactory.createOrder({
        platformInfo: { platform: 'ubereats' },
        items: [
          {
            itemType: 'dish',
            itemName: '測試餐點',
            quantity: 1
          }
        ],
        status: 'unpaid'
      })

      const result = canProcessInventoryForDeliveryOrder(mockOrder)

      expect(result).toBe(false)
    })
  })

  describe('reduceSingleItemForDelivery', () => {
    it('應該成功扣除單個餐點庫存', async () => {
      mockMongoose.Types.ObjectId.isValid.mockReturnValue(true)
      mockMongoose.default.Types.ObjectId.isValid.mockReturnValue(true)

      const mockInventoryItem = TestDataFactory.createInventoryItem({
        _id: mockInventoryId,
        itemName: '測試餐點',
        isInventoryTracked: true,
        isSoldOut: false
      })
      mockInventoryService.getInventoryItemByDishTemplate.mockResolvedValue(mockInventoryItem)
      mockInventoryService.reduceStock.mockResolvedValue(undefined)

      const result = await reduceSingleItemForDelivery(
        mockStoreId,
        mockDishTemplateId,
        2,
        mockOrderId,
        'ubereats'
      )

      expect(result.success).toBe(true)
      expect(result.reason).toBe('reduced')
      expect(result.itemName).toBe('測試餐點')
      expect(result.reducedQuantity).toBe(2)

      expect(mockInventoryService.reduceStock).toHaveBeenCalledWith({
        storeId: mockStoreId,
        inventoryId: mockInventoryId,
        quantity: 2,
        reason: '外送訂單消耗: UBEREATS 訂單',
        orderId: mockOrderId
      })
    })

    it('應該對無效模板ID回傳失敗', async () => {
      mockMongoose.Types.ObjectId.isValid.mockReturnValue(false)
      mockMongoose.default.Types.ObjectId.isValid.mockReturnValue(false)

      const result = await reduceSingleItemForDelivery(
        mockStoreId,
        'invalid_id',
        1,
        mockOrderId,
        'ubereats'
      )

      expect(result.success).toBe(false)
      expect(result.reason).toBe('invalid_template_id')
      expect(mockInventoryService.getInventoryItemByDishTemplate).not.toHaveBeenCalled()
    })

    it('應該對沒有庫存記錄的餐點回傳失敗', async () => {
      mockMongoose.Types.ObjectId.isValid.mockReturnValue(true)
      mockMongoose.default.Types.ObjectId.isValid.mockReturnValue(true)
      mockInventoryService.getInventoryItemByDishTemplate.mockResolvedValue(null)

      const result = await reduceSingleItemForDelivery(
        mockStoreId,
        mockDishTemplateId,
        1,
        mockOrderId,
        'ubereats'
      )

      expect(result.success).toBe(false)
      expect(result.reason).toBe('no_inventory_record')
    })

    it('應該對未追蹤庫存的餐點回傳成功但無扣除', async () => {
      mockMongoose.Types.ObjectId.isValid.mockReturnValue(true)
      mockMongoose.default.Types.ObjectId.isValid.mockReturnValue(true)

      const mockInventoryItem = TestDataFactory.createInventoryItem({
        isInventoryTracked: false
      })
      mockInventoryService.getInventoryItemByDishTemplate.mockResolvedValue(mockInventoryItem)

      const result = await reduceSingleItemForDelivery(
        mockStoreId,
        mockDishTemplateId,
        1,
        mockOrderId,
        'ubereats'
      )

      expect(result.success).toBe(true)
      expect(result.reason).toBe('not_tracked')
      expect(mockInventoryService.reduceStock).not.toHaveBeenCalled()
    })

    it('應該對已售完餐點回傳失敗', async () => {
      mockMongoose.Types.ObjectId.isValid.mockReturnValue(true)
      mockMongoose.default.Types.ObjectId.isValid.mockReturnValue(true)

      const mockInventoryItem = TestDataFactory.createInventoryItem({
        isInventoryTracked: true,
        isSoldOut: true
      })
      mockInventoryService.getInventoryItemByDishTemplate.mockResolvedValue(mockInventoryItem)

      const result = await reduceSingleItemForDelivery(
        mockStoreId,
        mockDishTemplateId,
        1,
        mockOrderId,
        'ubereats'
      )

      expect(result.success).toBe(false)
      expect(result.reason).toBe('sold_out')
    })

    it('應該處理庫存扣除錯誤', async () => {
      mockMongoose.Types.ObjectId.isValid.mockReturnValue(true)
      mockMongoose.default.Types.ObjectId.isValid.mockReturnValue(true)

      const mockInventoryItem = TestDataFactory.createInventoryItem({
        _id: mockInventoryId,
        isInventoryTracked: true,
        isSoldOut: false
      })
      mockInventoryService.getInventoryItemByDishTemplate.mockResolvedValue(mockInventoryItem)
      mockInventoryService.reduceStock.mockRejectedValue(new Error('扣除失敗'))

      const result = await reduceSingleItemForDelivery(
        mockStoreId,
        mockDishTemplateId,
        1,
        mockOrderId,
        'ubereats'
      )

      expect(result.success).toBe(false)
      expect(result.reason).toBe('reduction_error')
      expect(result.error).toBe('扣除失敗')
    })
  })
})