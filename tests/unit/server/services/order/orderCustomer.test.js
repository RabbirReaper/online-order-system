import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TestDataFactory } from '../../../../setup.js'

// 設定 mocks
vi.mock('@server/models/Order/Order.js', () => ({ 
  default: vi.fn().mockImplementation((data) => ({
    ...data,
    _id: '507f1f77bcf86cd799439020',
    save: vi.fn().mockResolvedValue(),
    toObject: vi.fn().mockReturnValue(data),
    countDocuments: vi.fn(),
    find: vi.fn(),
    findById: vi.fn()
  }))
}))

vi.mock('@server/models/Dish/DishInstance.js', () => ({ 
  default: vi.fn().mockImplementation((data) => ({
    ...data,
    _id: '507f1f77bcf86cd799439021',
    save: vi.fn().mockResolvedValue()
  }))
}))

vi.mock('@server/models/Promotion/VoucherInstance.js', () => ({ 
  default: vi.fn().mockImplementation((data) => ({
    ...data,
    _id: '507f1f77bcf86cd799439023',
    save: vi.fn().mockResolvedValue()
  }))
}))

vi.mock('@server/models/Promotion/VoucherTemplate.js', () => ({ 
  default: {
    findById: vi.fn()
  }
}))

vi.mock('@server/middlewares/error.js', () => ({
  AppError: vi.fn().mockImplementation((message, code) => {
    const error = new Error(message)
    error.statusCode = code
    error.name = 'AppError'
    return error
  })
}))

vi.mock('@server/services/inventory/stockManagement.js', () => ({
  getInventoryItemByDishTemplate: vi.fn(),
  reduceInventoryForOrder: vi.fn()
}))

vi.mock('@server/services/bundle/bundleService.js', () => ({
  validateBundlePurchase: vi.fn()
}))

vi.mock('@server/services/bundle/bundleInstance.js', () => ({
  createInstance: vi.fn(),
  generateVouchersForBundle: vi.fn()
}))

vi.mock('@server/services/promotion/pointService.js', () => ({
  getUserPoints: vi.fn(),
  addPointsToUser: vi.fn()
}))

vi.mock('@server/services/promotion/pointRuleService.js', () => ({
  calculateOrderPoints: vi.fn()
}))

vi.mock('@server/utils/date.js', () => ({
  getTaiwanDateTime: vi.fn(),
  formatDateTime: vi.fn(),
  generateDateCode: vi.fn()
}))

// 動態導入服務
const orderService = await import('@server/services/order/orderCustomer.js')

describe('OrderCustomer Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('calculateOrderAmounts', () => {
    it('should calculate dish and bundle subtotals correctly', () => {
      const items = [
        { itemType: 'dish', subtotal: 150 },
        { itemType: 'dish', subtotal: 200 },
        { itemType: 'bundle', subtotal: 300 },
        { itemType: 'bundle', subtotal: 100 }
      ]

      const result = orderService.calculateOrderAmounts(items)

      expect(result).toEqual({
        dishSubtotal: 350,
        bundleSubtotal: 400,
        totalAmount: 750
      })
    })

    it('should handle empty items array', () => {
      const result = orderService.calculateOrderAmounts([])

      expect(result).toEqual({
        dishSubtotal: 0,
        bundleSubtotal: 0,
        totalAmount: 0
      })
    })

    it('should handle mixed items with missing subtotal', () => {
      const items = [
        { itemType: 'dish', subtotal: 150 },
        { itemType: 'dish' }, // 沒有 subtotal
        { itemType: 'bundle', subtotal: 300 }
      ]

      const result = orderService.calculateOrderAmounts(items)

      expect(result).toEqual({
        dishSubtotal: 150,
        bundleSubtotal: 300,
        totalAmount: 450
      })
    })

    it('should ignore unknown item types', () => {
      const items = [
        { itemType: 'dish', subtotal: 100 },
        { itemType: 'unknown', subtotal: 200 }, // 未知類型
        { itemType: 'bundle', subtotal: 150 }
      ]

      const result = orderService.calculateOrderAmounts(items)

      expect(result).toEqual({
        dishSubtotal: 100,
        bundleSubtotal: 150,
        totalAmount: 250
      })
    })
  })

  describe('updateOrderAmounts', () => {
    it('should update order amounts correctly', () => {
      const order = {
        dishSubtotal: 300,
        bundleSubtotal: 200,
        serviceCharge: 50,
        discounts: [
          { amount: 30 },
          { amount: 20 }
        ],
        manualAdjustment: 10
      }

      const result = orderService.updateOrderAmounts(order)

      expect(result.subtotal).toBe(500) // 300 + 200
      expect(result.totalDiscount).toBe(50) // 30 + 20
      expect(result.total).toBe(510) // 500 + 50 - 50 + 10
    })

    it('should handle zero service charge', () => {
      const order = {
        dishSubtotal: 200,
        bundleSubtotal: 100,
        discounts: [],
        manualAdjustment: 0
      }

      const result = orderService.updateOrderAmounts(order)

      expect(result.serviceCharge).toBe(0)
      expect(result.subtotal).toBe(300)
      expect(result.totalDiscount).toBe(0)
      expect(result.total).toBe(300)
    })

    it('should prevent negative total amount', () => {
      const order = {
        dishSubtotal: 100,
        bundleSubtotal: 0,
        serviceCharge: 0,
        discounts: [{ amount: 150 }], // 折扣大於小計
        manualAdjustment: 0
      }

      const result = orderService.updateOrderAmounts(order)

      expect(result.total).toBe(0) // 不能為負數
    })

    it('should handle missing discounts array', () => {
      const order = {
        dishSubtotal: 200,
        bundleSubtotal: 100,
        serviceCharge: 25,
        manualAdjustment: 5,
        discounts: [] // 提供空陣列而非未定義
      }

      const result = orderService.updateOrderAmounts(order)

      expect(result.totalDiscount).toBe(0)
      expect(result.total).toBe(330) // 300 + 25 - 0 + 5
    })

    it('should handle negative manual adjustment', () => {
      const order = {
        dishSubtotal: 200,
        bundleSubtotal: 100,
        serviceCharge: 0,
        discounts: [],
        manualAdjustment: -50 // 負的手動調整
      }

      const result = orderService.updateOrderAmounts(order)

      expect(result.total).toBe(250) // 300 + 0 - 0 - 50
    })
  })
})