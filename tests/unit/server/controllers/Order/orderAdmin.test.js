import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TestDataFactory } from '../../../../setup.js'

// Mock orderAdmin service
vi.mock('@server/services/order/orderAdmin.js', () => ({
  getStoreOrders: vi.fn(),
  getUserOrders: vi.fn(),
  getOrderById: vi.fn(),
  updateOrder: vi.fn(),
  cancelOrder: vi.fn()
}))

// Mock asyncHandler
vi.mock('@server/middlewares/error.js', () => ({
  asyncHandler: vi.fn((fn) => fn)
}))

// 動態導入控制器
const orderAdminController = await import('@server/controllers/Order/orderAdmin.js')
const orderAdminService = await import('@server/services/order/orderAdmin.js')

describe('OrderAdmin Controller', () => {
  let req, res, next

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock Express request object
    req = {
      params: {
        storeId: 'store456',
        orderId: 'order789',
        userId: 'user123',
        brandId: 'brand123'
      },
      query: {},
      body: {},
      auth: {
        id: 'admin123'
      }
    }

    // Mock Express response object
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    }

    next = vi.fn()
  })

  describe('getStoreOrders', () => {
    it('should get store orders successfully with default pagination', async () => {
      const mockOrders = [
        TestDataFactory.createOrder({ _id: 'order1', status: 'pending' }),
        TestDataFactory.createOrder({ _id: 'order2', status: 'paid' })
      ]
      const mockResult = {
        orders: mockOrders,
        pagination: { currentPage: 1, totalPages: 1, totalItems: 2 }
      }

      orderAdminService.getStoreOrders.mockResolvedValue(mockResult)

      await orderAdminController.getStoreOrders(req, res)

      expect(orderAdminService.getStoreOrders).toHaveBeenCalledWith('store456', {
        status: undefined,
        orderType: undefined,
        fromDate: undefined,
        toDate: undefined,
        page: 1,
        limit: 20
      })

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        orders: mockOrders,
        pagination: mockResult.pagination
      })
    })

    it('should get store orders with query filters', async () => {
      req.query = {
        status: 'paid',
        orderType: 'dineIn',
        fromDate: '2023-01-01',
        toDate: '2023-12-31',
        page: '2',
        limit: '10'
      }

      const mockResult = {
        orders: [],
        pagination: { currentPage: 2, totalPages: 5, totalItems: 50 }
      }

      orderAdminService.getStoreOrders.mockResolvedValue(mockResult)

      await orderAdminController.getStoreOrders(req, res)

      expect(orderAdminService.getStoreOrders).toHaveBeenCalledWith('store456', {
        status: 'paid',
        orderType: 'dineIn',
        fromDate: '2023-01-01',
        toDate: '2023-12-31',
        page: 2,
        limit: 10
      })

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        orders: [],
        pagination: mockResult.pagination
      })
    })

    it('should handle invalid page and limit values', async () => {
      req.query = {
        page: 'invalid',
        limit: 'invalid'
      }

      const mockResult = {
        orders: [],
        pagination: { currentPage: 1, totalPages: 1, totalItems: 0 }
      }

      orderAdminService.getStoreOrders.mockResolvedValue(mockResult)

      await orderAdminController.getStoreOrders(req, res)

      expect(orderAdminService.getStoreOrders).toHaveBeenCalledWith('store456', {
        status: undefined,
        orderType: undefined,
        fromDate: undefined,
        toDate: undefined,
        page: 1,
        limit: 20
      })
    })
  })

  describe('getUserOrders', () => {
    it('should get user orders successfully with default options', async () => {
      const mockOrders = [
        TestDataFactory.createOrder({ _id: 'order1', userId: 'user123' }),
        TestDataFactory.createOrder({ _id: 'order2', userId: 'user123' })
      ]
      const mockResult = {
        orders: mockOrders,
        pagination: { currentPage: 1, totalPages: 1, totalItems: 2 }
      }

      orderAdminService.getUserOrders.mockResolvedValue(mockResult)

      await orderAdminController.getUserOrders(req, res)

      expect(orderAdminService.getUserOrders).toHaveBeenCalledWith('user123', {
        brandId: 'brand123',
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        orders: mockOrders,
        pagination: mockResult.pagination
      })
    })

    it('should get user orders with custom query options', async () => {
      req.query = {
        page: '3',
        limit: '5',
        sortBy: 'totalPrice',
        sortOrder: 'asc'
      }

      const mockResult = {
        orders: [],
        pagination: { currentPage: 3, totalPages: 10, totalItems: 50 }
      }

      orderAdminService.getUserOrders.mockResolvedValue(mockResult)

      await orderAdminController.getUserOrders(req, res)

      expect(orderAdminService.getUserOrders).toHaveBeenCalledWith('user123', {
        brandId: 'brand123',
        page: 3,
        limit: 5,
        sortBy: 'totalPrice',
        sortOrder: 'asc'
      })

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        orders: [],
        pagination: mockResult.pagination
      })
    })
  })

  describe('getOrderById', () => {
    it('should get order by id successfully', async () => {
      const mockOrder = TestDataFactory.createOrder({
        _id: 'order789',
        storeId: 'store456',
        status: 'paid'
      })

      orderAdminService.getOrderById.mockResolvedValue(mockOrder)

      await orderAdminController.getOrderById(req, res)

      expect(orderAdminService.getOrderById).toHaveBeenCalledWith('order789', 'store456')

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        order: mockOrder
      })
    })
  })

  describe('updateOrder', () => {
    it('should update order successfully', async () => {
      req.body = {
        status: 'paid',
        notes: '訂單已付款'
      }

      const mockUpdatedOrder = TestDataFactory.createOrder({
        _id: 'order789',
        status: 'paid',
        notes: '訂單已付款'
      })

      orderAdminService.updateOrder.mockResolvedValue(mockUpdatedOrder)

      await orderAdminController.updateOrder(req, res)

      expect(orderAdminService.updateOrder).toHaveBeenCalledWith(
        'order789',
        req.body,
        'admin123'
      )

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '訂單更新成功',
        order: mockUpdatedOrder,
        pointsAwarded: 0,
        generatedCoupons: []
      })
    })

    it('should update order with mixed purchase rewards', async () => {
      req.body = { status: 'paid' }

      const mockUpdatedOrder = {
        ...TestDataFactory.createOrder({ _id: 'order789', status: 'paid' }),
        pointsAwarded: 50,
        generatedCoupons: [{ _id: 'coupon1', type: 'discount' }]
      }

      orderAdminService.updateOrder.mockResolvedValue(mockUpdatedOrder)

      await orderAdminController.updateOrder(req, res)

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '訂單更新成功',
        order: mockUpdatedOrder,
        pointsAwarded: 50,
        generatedCoupons: [{ _id: 'coupon1', type: 'discount' }]
      })
    })
  })

  describe('cancelOrder', () => {
    it('should cancel order successfully', async () => {
      req.body = {
        reason: '客戶要求取消'
      }

      const mockCancelledOrder = TestDataFactory.createOrder({
        _id: 'order789',
        status: 'cancelled',
        cancellationReason: '客戶要求取消'
      })

      orderAdminService.cancelOrder.mockResolvedValue(mockCancelledOrder)

      await orderAdminController.cancelOrder(req, res)

      expect(orderAdminService.cancelOrder).toHaveBeenCalledWith(
        'order789',
        '客戶要求取消',
        'admin123'
      )

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '訂單取消成功',
        order: mockCancelledOrder
      })
    })

    it('should return error when reason is missing', async () => {
      req.body = {} // 沒有 reason

      await orderAdminController.cancelOrder(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '缺少取消原因'
      })

      expect(orderAdminService.cancelOrder).not.toHaveBeenCalled()
    })

    it('should return error when reason is empty string', async () => {
      req.body = { reason: '' }

      await orderAdminController.cancelOrder(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '缺少取消原因'
      })

      expect(orderAdminService.cancelOrder).not.toHaveBeenCalled()
    })
  })
})