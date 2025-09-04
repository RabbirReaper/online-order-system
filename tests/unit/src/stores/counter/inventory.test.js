import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCounterInventoryStore } from '@/stores/counter/inventory.js'

// Mock API 模組
vi.mock('@/api', () => ({
  default: {
    inventory: {
      getStoreInventory: vi.fn()
    }
  }
}))

describe('Counter Inventory Store', () => {
  let store
  let mockApi

  beforeEach(async () => {
    setActivePinia(createPinia())
    store = useCounterInventoryStore()
    
    // 取得 mock API
    const api = await import('@/api')
    mockApi = api.default
    
    vi.clearAllMocks()
  })

  describe('初始狀態', () => {
    it('應該有正確的初始狀態', () => {
      expect(store.inventoryData).toEqual({})
      expect(store.isLoadingInventory).toBe(false)
    })
  })

  describe('getInventoryInfo', () => {
    const mockInventoryData = {
      'dish1': {
        inventoryId: 'inv1',
        enableAvailableStock: true,
        availableStock: 10,
        totalStock: 20,
        isSoldOut: false,
        isInventoryTracked: true
      },
      'dish2': {
        inventoryId: 'inv2',
        enableAvailableStock: false,
        availableStock: 0,
        totalStock: 0,
        isSoldOut: false,
        isInventoryTracked: false
      }
    }

    beforeEach(() => {
      store.inventoryData = mockInventoryData
    })

    it('應該返回存在的菜品庫存資訊', () => {
      const result = store.getInventoryInfo('dish1')
      
      expect(result).toEqual({
        inventoryId: 'inv1',
        enableAvailableStock: true,
        availableStock: 10,
        totalStock: 20,
        isSoldOut: false,
        isInventoryTracked: true
      })
    })

    it('應該對不存在的菜品返回 null', () => {
      const result = store.getInventoryInfo('nonexistent')
      
      expect(result).toBeNull()
    })

    it('應該處理空的菜品ID', () => {
      expect(store.getInventoryInfo('')).toBeNull()
      expect(store.getInventoryInfo(null)).toBeNull()
      expect(store.getInventoryInfo(undefined)).toBeNull()
    })
  })

  describe('isDishSoldOut', () => {
    beforeEach(() => {
      store.inventoryData = {
        'manualSoldOut': {
          isSoldOut: true,
          enableAvailableStock: true,
          availableStock: 5
        },
        'zeroStock': {
          isSoldOut: false,
          enableAvailableStock: true,
          availableStock: 0
        },
        'lowStock': {
          isSoldOut: false,
          enableAvailableStock: true,
          availableStock: 3
        },
        'noStockTracking': {
          isSoldOut: false,
          enableAvailableStock: false,
          availableStock: 0
        },
        'availableStock': {
          isSoldOut: false,
          enableAvailableStock: true,
          availableStock: 10
        }
      }
    })

    it('手動設為售完時應該返回 true（最高優先級）', () => {
      expect(store.isDishSoldOut('manualSoldOut')).toBe(true)
    })

    it('啟用庫存追蹤且庫存為 0 時應該返回 true', () => {
      expect(store.isDishSoldOut('zeroStock')).toBe(true)
    })

    it('啟用庫存追蹤且有庫存時應該返回 false', () => {
      expect(store.isDishSoldOut('lowStock')).toBe(false)
      expect(store.isDishSoldOut('availableStock')).toBe(false)
    })

    it('未啟用庫存追蹤時應該返回 false', () => {
      expect(store.isDishSoldOut('noStockTracking')).toBe(false)
    })

    it('菜品不存在時應該返回 false', () => {
      expect(store.isDishSoldOut('nonexistent')).toBe(false)
    })

    it('應該處理無效的菜品ID', () => {
      expect(store.isDishSoldOut('')).toBe(false)
      expect(store.isDishSoldOut(null)).toBe(false)
      expect(store.isDishSoldOut(undefined)).toBe(false)
    })
  })

  describe('getStockBadgeClass', () => {
    beforeEach(() => {
      store.inventoryData = {
        'manualSoldOut': {
          isSoldOut: true,
          enableAvailableStock: true,
          availableStock: 10
        },
        'zeroStock': {
          isSoldOut: false,
          enableAvailableStock: true,
          availableStock: 0
        },
        'lowStock': {
          isSoldOut: false,
          enableAvailableStock: true,
          availableStock: 3
        },
        'mediumStock': {
          isSoldOut: false,
          enableAvailableStock: true,
          availableStock: 10
        },
        'noStockTracking': {
          isSoldOut: false,
          enableAvailableStock: false,
          availableStock: 10
        }
      }
    })

    it('手動售完時應該返回紅色徽章', () => {
      expect(store.getStockBadgeClass('manualSoldOut')).toBe('bg-danger text-white')
    })

    it('庫存為 0 時應該返回紅色徽章', () => {
      expect(store.getStockBadgeClass('zeroStock')).toBe('bg-danger text-white')
    })

    it('庫存 ≤ 5 時應該返回警告徽章', () => {
      expect(store.getStockBadgeClass('lowStock')).toBe('bg-warning text-dark')
    })

    it('庫存 > 5 時應該返回綠色徽章', () => {
      expect(store.getStockBadgeClass('mediumStock')).toBe('bg-success text-white')
    })

    it('未啟用庫存追蹤時應該返回空字串', () => {
      expect(store.getStockBadgeClass('noStockTracking')).toBe('')
    })

    it('菜品不存在時應該返回空字串', () => {
      expect(store.getStockBadgeClass('nonexistent')).toBe('')
    })

    it('應該處理無效的菜品ID', () => {
      expect(store.getStockBadgeClass('')).toBe('')
      expect(store.getStockBadgeClass(null)).toBe('')
      expect(store.getStockBadgeClass(undefined)).toBe('')
    })

    it('應該測試邊界值', () => {
      store.inventoryData['boundary5'] = {
        isSoldOut: false,
        enableAvailableStock: true,
        availableStock: 5
      }
      store.inventoryData['boundary6'] = {
        isSoldOut: false,
        enableAvailableStock: true,
        availableStock: 6
      }

      expect(store.getStockBadgeClass('boundary5')).toBe('bg-warning text-dark')
      expect(store.getStockBadgeClass('boundary6')).toBe('bg-success text-white')
    })
  })

  describe('loadInventoryData', () => {
    const mockInventoryResponse = {
      success: true,
      inventory: [
        {
          _id: 'inv1',
          enableAvailableStock: true,
          availableStock: 10,
          totalStock: 20,
          isSoldOut: false,
          isInventoryTracked: true,
          dish: {
            _id: 'dish1',
            name: '測試菜品1'
          }
        },
        {
          _id: 'inv2',
          enableAvailableStock: false,
          availableStock: 0,
          totalStock: 0,
          isSoldOut: false,
          isInventoryTracked: false,
          dish: {
            _id: 'dish2',
            name: '測試菜品2'
          }
        },
        {
          _id: 'inv3',
          enableAvailableStock: true,
          availableStock: 5,
          totalStock: 15,
          isSoldOut: true,
          isInventoryTracked: true,
          dish: null // 測試異常情況
        }
      ]
    }

    beforeEach(() => {
      mockApi.inventory.getStoreInventory.mockResolvedValue(mockInventoryResponse)
    })

    it('應該成功載入庫存資料', async () => {
      await store.loadInventoryData('brand1', 'store1')

      expect(mockApi.inventory.getStoreInventory).toHaveBeenCalledWith({
        brandId: 'brand1',
        storeId: 'store1',
        inventoryType: 'DishTemplate'
      })

      expect(store.inventoryData).toEqual({
        'dish1': {
          inventoryId: 'inv1',
          enableAvailableStock: true,
          availableStock: 10,
          totalStock: 20,
          isSoldOut: false,
          isInventoryTracked: true
        },
        'dish2': {
          inventoryId: 'inv2',
          enableAvailableStock: false,
          availableStock: 0,
          totalStock: 0,
          isSoldOut: false,
          isInventoryTracked: false
        }
      })

      expect(store.isLoadingInventory).toBe(false)
    })

    it('應該處理無效參數', async () => {
      await store.loadInventoryData('', 'store1')
      expect(mockApi.inventory.getStoreInventory).not.toHaveBeenCalled()

      await store.loadInventoryData('brand1', '')
      expect(mockApi.inventory.getStoreInventory).not.toHaveBeenCalled()

      await store.loadInventoryData(null, 'store1')
      expect(mockApi.inventory.getStoreInventory).not.toHaveBeenCalled()

      await store.loadInventoryData('brand1', null)
      expect(mockApi.inventory.getStoreInventory).not.toHaveBeenCalled()
    })

    it('載入過程中應該設置 loading 狀態', async () => {
      let loadingDuringCall = false
      
      mockApi.inventory.getStoreInventory.mockImplementation(async () => {
        loadingDuringCall = store.isLoadingInventory
        return mockInventoryResponse
      })

      expect(store.isLoadingInventory).toBe(false)

      await store.loadInventoryData('brand1', 'store1')

      expect(loadingDuringCall).toBe(true)
      expect(store.isLoadingInventory).toBe(false)
    })

    it('應該處理 API 錯誤', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockApi.inventory.getStoreInventory.mockRejectedValue(new Error('網路錯誤'))

      await store.loadInventoryData('brand1', 'store1')

      expect(consoleErrorSpy).toHaveBeenCalledWith('載入庫存資料失敗:', expect.any(Error))
      expect(store.isLoadingInventory).toBe(false)
      expect(store.inventoryData).toEqual({})

      consoleErrorSpy.mockRestore()
    })

    it('應該處理 API 失敗回應', async () => {
      mockApi.inventory.getStoreInventory.mockResolvedValue({
        success: false,
        message: '查詢失敗'
      })

      await store.loadInventoryData('brand1', 'store1')

      expect(store.inventoryData).toEqual({})
      expect(store.isLoadingInventory).toBe(false)
    })

    it('應該過濾掉沒有菜品資料的庫存項目', async () => {
      const responseWithInvalidData = {
        success: true,
        inventory: [
          {
            _id: 'inv1',
            dish: { _id: 'dish1' },
            enableAvailableStock: true,
            availableStock: 10
          },
          {
            _id: 'inv2',
            dish: null, // 無效資料
            enableAvailableStock: true,
            availableStock: 5
          },
          {
            _id: 'inv3',
            // 沒有 dish 屬性
            enableAvailableStock: false,
            availableStock: 0
          }
        ]
      }

      mockApi.inventory.getStoreInventory.mockResolvedValue(responseWithInvalidData)

      await store.loadInventoryData('brand1', 'store1')

      expect(Object.keys(store.inventoryData)).toHaveLength(1)
      expect(store.inventoryData['dish1']).toBeDefined()
    })

    it('應該處理空的庫存回應', async () => {
      mockApi.inventory.getStoreInventory.mockResolvedValue({
        success: true,
        inventory: []
      })

      await store.loadInventoryData('brand1', 'store1')

      expect(store.inventoryData).toEqual({})
      expect(store.isLoadingInventory).toBe(false)
    })
  })

  describe('clearInventoryData', () => {
    beforeEach(() => {
      store.inventoryData = {
        'dish1': { inventoryId: 'inv1' },
        'dish2': { inventoryId: 'inv2' }
      }
    })

    it('應該清空所有庫存資料', () => {
      store.clearInventoryData()

      expect(store.inventoryData).toEqual({})
    })

    it('清空後其他方法應該正常運作', () => {
      store.clearInventoryData()

      expect(store.getInventoryInfo('dish1')).toBeNull()
      expect(store.isDishSoldOut('dish1')).toBe(false)
      expect(store.getStockBadgeClass('dish1')).toBe('')
    })
  })

  describe('邊界條件和異常處理', () => {
    it('應該處理庫存數量為負數的情況', () => {
      store.inventoryData = {
        'negativeStock': {
          isSoldOut: false,
          enableAvailableStock: true,
          availableStock: -5
        }
      }

      expect(store.isDishSoldOut('negativeStock')).toBe(true)
      expect(store.getStockBadgeClass('negativeStock')).toBe('bg-danger text-white')
    })

    it('應該處理庫存數量為浮點數的情況', () => {
      store.inventoryData = {
        'floatStock': {
          isSoldOut: false,
          enableAvailableStock: true,
          availableStock: 5.5
        }
      }

      expect(store.isDishSoldOut('floatStock')).toBe(false)
      expect(store.getStockBadgeClass('floatStock')).toBe('bg-success text-white')
    })

    it('應該處理缺少屬性的庫存資料', () => {
      store.inventoryData = {
        'incompleteData': {
          // 缺少必要屬性
        }
      }

      expect(store.isDishSoldOut('incompleteData')).toBe(false)
      expect(store.getStockBadgeClass('incompleteData')).toBe('')
    })
  })
})