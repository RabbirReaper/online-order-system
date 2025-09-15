import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TestDataFactory } from '../../../../setup.js'

// Mock 重構後的模組
vi.mock('@server/services/order/orderPayment.js', () => ({
  processOrderPaymentComplete: vi.fn().mockResolvedValue({
    _id: '507f1f77bcf86cd799439017',
    status: 'paid',
    pointsAwarded: 10
  }),
  processOrderPointsReward: vi.fn().mockResolvedValue({ pointsAwarded: 10 }),
  restoreUsedVouchers: vi.fn(),
  restoreUsedCoupons: vi.fn()
}))

vi.mock('@server/services/order/orderUtils.js', () => ({
  updateOrderAmounts: vi.fn()
}))

vi.mock('@server/services/order/orderQueries.js', () => ({
  getStoreOrders: vi.fn().mockResolvedValue({
    orders: [],
    pagination: {
      total: 0,
      totalPages: 0,
      currentPage: 1,
      limit: 20,
      hasNextPage: false,
      hasPrevPage: false,
    }
  }),
  getUserOrders: vi.fn().mockResolvedValue({
    orders: [],
    pagination: {
      total: 0,
      totalPages: 0,
      currentPage: 1,
      limit: 10,
      hasNextPage: false,
      hasPrevPage: false,
    }
  }),
  getOrderById: vi.fn().mockResolvedValue(null)
}))

vi.mock('@server/models/Order/Order.js', () => ({
  default: {
    findById: vi.fn()
  }
}))

vi.mock('@server/models/Promotion/VoucherInstance.js', () => ({
  default: {
    find: vi.fn(),
  }
}))

vi.mock('@server/middlewares/error.js', () => ({
  AppError: class AppError extends Error {
    constructor(message, statusCode = 500) {
      super(message)
      this.statusCode = statusCode
      this.name = 'AppError'
    }
  }
}))

// 動態導入服務
const orderAdminService = await import('@server/services/order/orderAdmin.js')
const Order = (await import('@server/models/Order/Order.js')).default
const VoucherInstance = (await import('@server/models/Promotion/VoucherInstance.js')).default
const { AppError } = await import('@server/middlewares/error.js')
const orderPaymentService = await import('@server/services/order/orderPayment.js')
const orderUtilsService = await import('@server/services/order/orderUtils.js')
const orderQueriesService = await import('@server/services/order/orderQueries.js')

describe('OrderAdmin Service - Refactored', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getStoreOrders', () => {
    const storeId = '507f1f77bcf86cd799439014'

    it('應該委託給 orderQueries.getStoreOrders', async () => {
      const options = { page: 1, limit: 20 }
      const mockResult = {
        orders: [TestDataFactory.createOrder({ store: storeId })],
        pagination: { total: 1, totalPages: 1, currentPage: 1, limit: 20 }
      }

      orderQueriesService.getStoreOrders.mockResolvedValue(mockResult)

      const result = await orderAdminService.getStoreOrders(storeId, options)

      expect(orderQueriesService.getStoreOrders).toHaveBeenCalledWith(storeId, options)
      expect(result).toEqual(mockResult)
    })
  })

  describe('getUserOrders', () => {
    const userId = '507f1f77bcf86cd799439015'

    it('應該委託給 orderQueries.getUserOrders', async () => {
      const options = { brandId: '507f1f77bcf86cd799439016', page: 1, limit: 10 }
      const mockResult = {
        orders: [TestDataFactory.createOrder({ user: userId })],
        pagination: { total: 1, totalPages: 1, currentPage: 1, limit: 10 }
      }

      orderQueriesService.getUserOrders.mockResolvedValue(mockResult)

      const result = await orderAdminService.getUserOrders(userId, options)

      expect(orderQueriesService.getUserOrders).toHaveBeenCalledWith(userId, options)
      expect(result).toEqual(mockResult)
    })
  })

  describe('getOrderById', () => {
    const orderId = '507f1f77bcf86cd799439017'
    const storeId = '507f1f77bcf86cd799439014'

    it('應該委託給 orderQueries.getOrderById', async () => {
      const mockOrder = TestDataFactory.createOrder({ _id: orderId, store: storeId })
      orderQueriesService.getOrderById.mockResolvedValue(mockOrder)

      const result = await orderAdminService.getOrderById(orderId, storeId)

      expect(orderQueriesService.getOrderById).toHaveBeenCalledWith(orderId, storeId)
      expect(result).toEqual(mockOrder)
    })
  })

  describe('updateOrder', () => {
    const orderId = '507f1f77bcf86cd799439017'
    const adminId = '507f1f77bcf86cd799439018'

    let mockOrder

    beforeEach(() => {
      mockOrder = {
        _id: orderId,
        status: 'unpaid',
        items: [],
        user: '507f1f77bcf86cd799439015',
        save: vi.fn(),
        toObject: vi.fn().mockReturnValue({ _id: orderId, status: 'paid' })
      }
      Order.findById.mockResolvedValue(mockOrder)
    })

    it('應該成功更新訂單基本資訊', async () => {
      const updateData = {
        status: 'paid',
        notes: '測試備註',
        paymentMethod: 'credit_card'
      }

      orderPaymentService.processOrderPaymentComplete.mockResolvedValue({
        _id: orderId,
        status: 'paid',
        pointsAwarded: 10,
        toObject: () => ({ _id: orderId, status: 'paid', pointsAwarded: 10 })
      })

      const result = await orderAdminService.updateOrder(orderId, updateData, adminId)

      expect(mockOrder.status).toBe('paid')
      expect(mockOrder.notes).toBe('測試備註')
      expect(mockOrder.paymentMethod).toBe('credit_card')
      expect(mockOrder.save).toHaveBeenCalled()
      expect(result.pointsAwarded).toBe(10)
    })

    it('當訂單不存在時應該拋出404錯誤', async () => {
      Order.findById.mockResolvedValue(null)

      await expect(
        orderAdminService.updateOrder(orderId, {}, adminId)
      ).rejects.toThrow('訂單不存在')
    })

    it('更新手動調整金額時應該重新計算總額', async () => {
      const updateData = { manualAdjustment: -50 }

      await orderAdminService.updateOrder(orderId, updateData, adminId)

      expect(orderUtilsService.updateOrderAmounts).toHaveBeenCalledWith(mockOrder)
      expect(mockOrder.manualAdjustment).toBe(-50)
    })

    it('狀態變為paid時應該處理Bundle券生成和點數給予', async () => {
      mockOrder.status = 'unpaid'
      mockOrder.items = [
        { itemType: 'bundle', bundleInstance: '507f1f77bcf86cd799439022' }
      ]

      orderPaymentService.processOrderPaymentComplete.mockResolvedValue({
        _id: orderId,
        status: 'paid',
        pointsAwarded: 10,
        ...mockOrder.toObject()
      })

      const updateData = { status: 'paid' }
      const result = await orderAdminService.updateOrder(orderId, updateData, adminId)

      expect(orderPaymentService.processOrderPaymentComplete).toHaveBeenCalledWith(mockOrder)
      expect(result.pointsAwarded).toBe(10)
    })
  })

  describe('cancelOrder', () => {
    const orderId = '507f1f77bcf86cd799439017'
    const adminId = '507f1f77bcf86cd799439018'
    const reason = '管理員取消'

    let mockOrder

    beforeEach(() => {
      mockOrder = {
        _id: orderId,
        status: 'paid',
        items: [],
        discounts: [],
        save: vi.fn()
      }
      Order.findById.mockResolvedValue(mockOrder)
    })

    it('應該成功取消訂單', async () => {
      const result = await orderAdminService.cancelOrder(orderId, reason, adminId)

      expect(mockOrder.status).toBe('cancelled')
      expect(mockOrder.cancelReason).toBe(reason)
      expect(mockOrder.cancelledBy).toBe(adminId)
      expect(mockOrder.save).toHaveBeenCalled()
      expect(result).toBe(mockOrder)
    })

    it('當訂單不存在時應該拋出404錯誤', async () => {
      Order.findById.mockResolvedValue(null)

      await expect(
        orderAdminService.cancelOrder(orderId, reason, adminId)
      ).rejects.toThrow('訂單不存在')
    })

    it('當訂單已被取消時應該拋出400錯誤', async () => {
      mockOrder.status = 'cancelled'

      await expect(
        orderAdminService.cancelOrder(orderId, reason, adminId)
      ).rejects.toThrow('訂單已被取消')
    })

    it('應該恢復使用的Voucher和Coupon狀態', async () => {
      mockOrder.discounts = [
        { discountModel: 'VoucherInstance', refId: 'voucher1' },
        { discountModel: 'CouponInstance', refId: 'coupon1' }
      ]

      await orderAdminService.cancelOrder(orderId, reason, adminId)

      expect(orderPaymentService.restoreUsedVouchers).toHaveBeenCalledWith(mockOrder)
      expect(orderPaymentService.restoreUsedCoupons).toHaveBeenCalledWith(mockOrder)
    })

    it('應該處理包含Bundle實例的訂單取消', async () => {
      mockOrder.items = [
        { itemType: 'bundle', bundleInstance: '507f1f77bcf86cd799439022' }
      ]

      VoucherInstance.find.mockResolvedValue([
        { _id: 'voucher1', isUsed: false, save: vi.fn() }
      ])

      await orderAdminService.cancelOrder(orderId, reason, adminId)

      expect(VoucherInstance.find).toHaveBeenCalledWith({
        createdBy: { $in: ['507f1f77bcf86cd799439022'] },
        isUsed: false
      })
    })
  })
})