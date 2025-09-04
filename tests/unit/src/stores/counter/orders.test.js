import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCounterOrdersStore } from '@/stores/counter/orders.js'

// Mock API 模組
vi.mock('@/api', () => ({
  default: {
    orderAdmin: {
      getStoreOrders: vi.fn()
    }
  }
}))

// Mock utils 模組
vi.mock('@/stores/counter/utils.js', () => ({
  formatTime: vi.fn((dateTime) => {
    const date = new Date(dateTime)
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Taipei'
    })
  }),
  formatDateTime: vi.fn((dateTime) => {
    const date = new Date(dateTime)
    return date.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
  }),
  getPickupMethodClass: vi.fn((method) => {
    const classMap = {
      內用: 'badge bg-primary',
      外帶: 'badge bg-success',
      外送: 'badge bg-warning text-dark'
    }
    return classMap[method] || 'badge bg-secondary'
  }),
  getStatusClass: vi.fn((status) => {
    const classMap = {
      unpaid: 'badge bg-warning text-dark',
      paid: 'badge bg-success',
      cancelled: 'badge bg-danger'
    }
    return classMap[status] || 'badge bg-secondary'
  }),
  formatStatus: vi.fn((status) => {
    const statusMap = {
      unpaid: '未結帳',
      paid: '已完成',
      cancelled: '已取消'
    }
    return statusMap[status] || status
  })
}))

describe('Counter Orders Store', () => {
  let store
  let mockOrderAdmin

  beforeEach(async () => {
    setActivePinia(createPinia())
    store = useCounterOrdersStore()
    
    // 獲取 mock 對象
    const api = await import('@/api')
    mockOrderAdmin = api.default.orderAdmin
    
    vi.clearAllMocks()
  })

  describe('初始狀態', () => {
    it('應該有正確的初始狀態', () => {
      expect(store.todayOrders).toEqual([])
      expect(store.selectedOrder).toBeNull()
      expect(store.currentDate).toBe('')
    })
  })

  describe('計算方法', () => {
    describe('calculateOrderSubtotal', () => {
      it('應該正確計算訂單項目小計', () => {
        const order = {
          items: [
            { subtotal: 100 },
            { subtotal: 200 },
            { subtotal: 50 }
          ]
        }

        const result = store.calculateOrderSubtotal(order)
        expect(result).toBe(350)
      })

      it('處理空訂單應返回 0', () => {
        expect(store.calculateOrderSubtotal(null)).toBe(0)
        expect(store.calculateOrderSubtotal({})).toBe(0)
        expect(store.calculateOrderSubtotal({ items: null })).toBe(0)
      })

      it('處理缺少 subtotal 的項目', () => {
        const order = {
          items: [
            { subtotal: 100 },
            { name: 'item without subtotal' },
            { subtotal: 200 }
          ]
        }

        const result = store.calculateOrderSubtotal(order)
        expect(result).toBe(300) // 0 + 100 + 0 + 200
      })
    })

    describe('calculateOrderTotalDiscount', () => {
      it('應該正確計算訂單總折扣', () => {
        const order = {
          discounts: [
            { amount: 50 },
            { amount: 30 },
            { amount: 20 }
          ]
        }

        const result = store.calculateOrderTotalDiscount(order)
        expect(result).toBe(100)
      })

      it('處理空訂單應返回 0', () => {
        expect(store.calculateOrderTotalDiscount(null)).toBe(0)
        expect(store.calculateOrderTotalDiscount({})).toBe(0)
        expect(store.calculateOrderTotalDiscount({ discounts: null })).toBe(0)
      })

      it('處理缺少 amount 的折扣項目', () => {
        const order = {
          discounts: [
            { amount: 50 },
            { type: 'discount without amount' },
            { amount: 30 }
          ]
        }

        const result = store.calculateOrderTotalDiscount(order)
        expect(result).toBe(80) // 50 + 0 + 30
      })
    })

    describe('calculateOrderTotal', () => {
      it('應該正確計算訂單總金額', () => {
        const order = {
          items: [
            { subtotal: 200 },
            { subtotal: 100 }
          ],
          discounts: [
            { amount: 50 }
          ],
          manualAdjustment: 20
        }

        const result = store.calculateOrderTotal(order)
        expect(result).toBe(270) // (200 + 100) + 20 - 50
      })

      it('處理無手動調整的訂單', () => {
        const order = {
          items: [{ subtotal: 300 }],
          discounts: [{ amount: 50 }]
        }

        const result = store.calculateOrderTotal(order)
        expect(result).toBe(250) // 300 + 0 - 50
      })

      it('總金額不應為負數', () => {
        const order = {
          items: [{ subtotal: 100 }],
          discounts: [{ amount: 150 }], // 折扣大於小計
          manualAdjustment: 0
        }

        const result = store.calculateOrderTotal(order)
        expect(result).toBe(0) // Math.max(0, 100 + 0 - 150)
      })

      it('處理空訂單應返回 0', () => {
        expect(store.calculateOrderTotal(null)).toBe(0)
      })
    })
  })

  describe('API 操作', () => {
    describe('fetchTodayOrders', () => {
      it('應該載入當日訂單', async () => {
        const mockOrders = [
          { orderId: '1', items: [], total: 100 },
          { orderId: '2', items: [], total: 200 }
        ]

        mockOrderAdmin.getStoreOrders.mockResolvedValue({
          success: true,
          orders: mockOrders
        })

        const result = await store.fetchTodayOrders('brand123', 'store456')

        expect(mockOrderAdmin.getStoreOrders).toHaveBeenCalledWith({
          brandId: 'brand123',
          storeId: 'store456',
          fromDate: expect.any(Date),
          toDate: expect.any(Date)
        })

        expect(result.success).toBe(true)
        expect(store.todayOrders).toEqual(mockOrders)
        expect(store.currentDate).toMatch(/^\d{4}\/\d{1,2}\/\d{1,2}$/)
      })
    })

    describe('fetchOrdersByDate', () => {
      it('應該按指定日期載入訂單', async () => {
        const mockOrders = [{ orderId: '1' }]
        const testDate = new Date('2024-01-15')

        mockOrderAdmin.getStoreOrders.mockResolvedValue({
          success: true,
          orders: mockOrders
        })

        const result = await store.fetchOrdersByDate('brand123', 'store456', testDate)

        expect(mockOrderAdmin.getStoreOrders).toHaveBeenCalledWith({
          brandId: 'brand123',
          storeId: 'store456',
          fromDate: testDate,
          toDate: testDate
        })

        expect(result.success).toBe(true)
        expect(store.todayOrders).toEqual(mockOrders)
        expect(store.currentDate).toBe('2024/1/15')
      })

      it('應該處理字串格式的日期', async () => {
        const mockOrders = [{ orderId: '1' }]
        const testDateString = '2024-01-15'

        mockOrderAdmin.getStoreOrders.mockResolvedValue({
          success: true,
          orders: mockOrders
        })

        const result = await store.fetchOrdersByDate('brand123', 'store456', testDateString)

        expect(mockOrderAdmin.getStoreOrders).toHaveBeenCalledWith({
          brandId: 'brand123',
          storeId: 'store456',
          fromDate: new Date(testDateString),
          toDate: new Date(testDateString)
        })

        expect(result.success).toBe(true)
        expect(store.todayOrders).toEqual(mockOrders)
      })

      it('應該處理 API 回應失敗', async () => {
        mockOrderAdmin.getStoreOrders.mockResolvedValue({
          success: false,
          message: '獲取訂單失敗'
        })

        await expect(
          store.fetchOrdersByDate('brand123', 'store456', new Date())
        ).rejects.toThrow('獲取訂單失敗')

        expect(store.todayOrders).toEqual([]) // 狀態應保持不變
      })

      it('應該處理 API 請求錯誤', async () => {
        const error = new Error('網路錯誤')
        mockOrderAdmin.getStoreOrders.mockRejectedValue(error)

        await expect(
          store.fetchOrdersByDate('brand123', 'store456', new Date())
        ).rejects.toThrow('網路錯誤')
      })
    })
  })

  describe('訂單操作', () => {
    describe('selectOrder', () => {
      it('應該選擇指定的訂單', () => {
        const order = { orderId: '123', items: [] }

        store.selectOrder(order)

        expect(store.selectedOrder).toEqual(order)
      })

      it('應該能夠選擇 null（取消選擇）', () => {
        const order = { orderId: '123', items: [] }
        store.selectOrder(order)
        expect(store.selectedOrder).toEqual(order)

        store.selectOrder(null)
        expect(store.selectedOrder).toBeNull()
      })
    })

    describe('clearOrdersState', () => {
      it('應該清空所有訂單狀態', () => {
        // 先設置一些狀態
        store.todayOrders = [{ orderId: '1' }]
        store.selectedOrder = { orderId: '2' }
        store.currentDate = '2024/1/15'

        store.clearOrdersState()

        expect(store.todayOrders).toEqual([])
        expect(store.selectedOrder).toBeNull()
        expect(store.currentDate).toBe('')
      })
    })
  })

  describe('格式化方法', () => {
    it('應該正確重新導出格式化方法', () => {
      const testDate = new Date('2024-01-15T10:30:00')

      // 測試方法存在並可調用
      expect(typeof store.formatTime).toBe('function')
      expect(typeof store.formatDateTime).toBe('function')
      expect(typeof store.getPickupMethodClass).toBe('function')
      expect(typeof store.getStatusClass).toBe('function')
      expect(typeof store.formatStatus).toBe('function')

      // 測試方法調用
      const timeResult = store.formatTime(testDate)
      const dateTimeResult = store.formatDateTime(testDate)
      const pickupClassResult = store.getPickupMethodClass('內用')
      const statusClassResult = store.getStatusClass('paid')
      const statusResult = store.formatStatus('unpaid')

      // 驗證返回結果不為 undefined（表示方法正常執行）
      expect(timeResult).toBeDefined()
      expect(dateTimeResult).toBeDefined()
      expect(pickupClassResult).toBeDefined()
      expect(statusClassResult).toBeDefined()
      expect(statusResult).toBeDefined()
    })
  })

  describe('錯誤處理', () => {
    it('應該在控制台記錄錯誤資訊', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('測試錯誤')
      mockOrderAdmin.getStoreOrders.mockRejectedValue(error)

      try {
        await store.fetchOrdersByDate('brand123', 'store456', new Date())
      } catch (e) {
        // 預期會拋出錯誤
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('💥 載入訂單失敗:'),
        expect.objectContaining({
          錯誤: '測試錯誤'
        })
      )

      consoleSpy.mockRestore()
    })

    it('應該在 API 回應失敗時記錄錯誤', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockOrderAdmin.getStoreOrders.mockResolvedValue({
        success: false,
        message: 'API 錯誤'
      })

      try {
        await store.fetchOrdersByDate('brand123', 'store456', new Date())
      } catch (e) {
        // 預期會拋出錯誤
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ API 回應失敗:'),
        expect.objectContaining({
          success: false,
          message: 'API 錯誤'
        })
      )

      consoleSpy.mockRestore()
    })
  })
})