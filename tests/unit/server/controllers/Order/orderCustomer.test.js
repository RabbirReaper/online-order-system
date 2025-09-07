import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TestDataFactory, TestHelpers } from '../../../../setup.js'

// Mock orderCustomer service
vi.mock('@server/services/order/orderCustomer.js', () => ({
  createOrder: vi.fn(),
  generateOrderNumber: vi.fn(),
  getUserOrders: vi.fn(),
  getUserOrderById: vi.fn(),
  processPayment: vi.fn(),
  paymentCallback: vi.fn()
}))

// Mock asyncHandler
vi.mock('@server/middlewares/error.js', () => ({
  asyncHandler: vi.fn((fn) => fn)
}))

// 動態導入控制器
const orderController = await import('@server/controllers/Order/orderCustomer.js')
const orderService = await import('@server/services/order/orderCustomer.js')

describe('OrderCustomer Controller', () => {
  let req, res, next

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock Express request object
    req = {
      params: {
        brandId: 'brand123',
        storeId: 'store456',
        orderId: 'order789'
      },
      query: {},
      body: {},
      auth: {
        userId: 'user123'
      }
    }

    // Mock Express response object
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    }

    next = vi.fn()
  })

  describe('createOrder', () => {
    it('應該成功創建訂單並返回正確格式', async () => {
      // Arrange
      const orderData = TestDataFactory.createOrder()
      req.body = orderData

      const mockOrderNumber = {
        orderDateCode: '2024010',
        sequence: 123
      }

      const mockOrderResult = {
        _id: 'order789',
        ...orderData,
        brand: 'brand123',
        store: 'store456',
        user: 'user123',
        pointsAwarded: 10,
        generatedCoupons: ['coupon1', 'coupon2']
      }

      orderService.generateOrderNumber.mockResolvedValue(mockOrderNumber)
      orderService.createOrder.mockResolvedValue(mockOrderResult)

      // Act
      await orderController.createOrder(req, res)

      // Assert
      expect(orderService.generateOrderNumber).toHaveBeenCalledWith('store456')
      
      const expectedOrderData = {
        ...orderData,
        brand: 'brand123',
        store: 'store456',
        user: 'user123',
        orderDateCode: '2024010',
        sequence: 123
      }
      expect(orderService.createOrder).toHaveBeenCalledWith(expectedOrderData)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '訂單創建成功',
        order: mockOrderResult,
        orderNumber: '2024010123',
        pointsAwarded: 10,
        generatedCoupons: ['coupon1', 'coupon2']
      })
    })

    it('應該支援匿名用戶創建訂單', async () => {
      // Arrange
      const orderData = TestDataFactory.createOrder()
      // 移除 user 屬性，模擬匿名訂單資料
      delete orderData.user
      req.body = orderData
      req.auth = null // 匿名用戶

      const mockOrderNumber = {
        orderDateCode: '2024010',
        sequence: 124
      }

      const mockOrderResult = {
        _id: 'order790',
        ...orderData,
        brand: 'brand123',
        store: 'store456',
        pointsAwarded: 0,
        generatedCoupons: []
      }

      orderService.generateOrderNumber.mockResolvedValue(mockOrderNumber)
      orderService.createOrder.mockResolvedValue(mockOrderResult)

      // Act
      await orderController.createOrder(req, res)

      // Assert
      const expectedOrderData = {
        ...orderData,
        brand: 'brand123',
        store: 'store456',
        orderDateCode: '2024010',
        sequence: 124
      }
      // 注意：匿名用戶不應該包含 user 屬性
      expect(expectedOrderData.user).toBeUndefined()
      expect(orderService.createOrder).toHaveBeenCalledWith(expectedOrderData)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '訂單創建成功',
        order: mockOrderResult,
        orderNumber: '2024010124',
        pointsAwarded: 0,
        generatedCoupons: []
      })
    })

    it('應該正確格式化訂單編號', async () => {
      // Arrange
      const orderData = TestDataFactory.createOrder()
      req.body = orderData

      const mockOrderNumber = {
        orderDateCode: '2024010',
        sequence: 5 // 測試 padStart 功能
      }

      const mockOrderResult = { _id: 'order791', ...orderData }

      orderService.generateOrderNumber.mockResolvedValue(mockOrderNumber)
      orderService.createOrder.mockResolvedValue(mockOrderResult)

      // Act
      await orderController.createOrder(req, res)

      // Assert
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          orderNumber: '2024010005' // 應該補零到三位數
        })
      )
    })
  })

  describe('getUserOrders', () => {
    it('應該成功獲取用戶訂單列表', async () => {
      // Arrange
      req.query = {
        page: '2',
        limit: '5',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }

      const mockResult = {
        orders: [TestDataFactory.createOrder(), TestDataFactory.createOrder()],
        pagination: {
          page: 2,
          limit: 5,
          total: 15,
          pages: 3
        }
      }

      orderService.getUserOrders.mockResolvedValue(mockResult)

      // Act
      await orderController.getUserOrders(req, res)

      // Assert
      expect(orderService.getUserOrders).toHaveBeenCalledWith('user123', {
        brandId: 'brand123',
        page: 2,
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        orders: mockResult.orders,
        pagination: mockResult.pagination
      })
    })

    it('應該使用默認分頁參數', async () => {
      // Arrange - 不設置 query 參數
      const mockResult = {
        orders: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        }
      }

      orderService.getUserOrders.mockResolvedValue(mockResult)

      // Act
      await orderController.getUserOrders(req, res)

      // Assert
      expect(orderService.getUserOrders).toHaveBeenCalledWith('user123', {
        brandId: 'brand123',
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })
    })

    it('應該正確處理無效的分頁參數', async () => {
      // Arrange
      req.query = {
        page: 'invalid',
        limit: 'invalid'
      }

      const mockResult = {
        orders: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 }
      }

      orderService.getUserOrders.mockResolvedValue(mockResult)

      // Act
      await orderController.getUserOrders(req, res)

      // Assert
      expect(orderService.getUserOrders).toHaveBeenCalledWith('user123', {
        brandId: 'brand123',
        page: 1, // 應該回到默認值
        limit: 10, // 應該回到默認值
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })
    })
  })

  describe('getUserOrderById', () => {
    it('應該成功獲取訂單詳情', async () => {
      // Arrange
      const mockOrder = TestDataFactory.createOrder()
      orderService.getUserOrderById.mockResolvedValue(mockOrder)

      // Act
      await orderController.getUserOrderById(req, res)

      // Assert
      expect(orderService.getUserOrderById).toHaveBeenCalledWith('order789', 'brand123')

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        order: mockOrder
      })
    })

    it('應該在找不到訂單時返回 404', async () => {
      // Arrange
      orderService.getUserOrderById.mockResolvedValue(null)

      // Act
      await orderController.getUserOrderById(req, res)

      // Assert
      expect(orderService.getUserOrderById).toHaveBeenCalledWith('order789', 'brand123')

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '找不到指定的訂單'
      })
    })
  })

  describe('processPayment', () => {
    it('應該成功處理訂單支付', async () => {
      // Arrange
      const paymentData = {
        paymentMethod: 'linepay',
        amount: 1000
      }
      req.body = paymentData

      const mockResult = {
        paymentId: 'payment123',
        redirectUrl: 'https://payment.url',
        status: 'pending'
      }

      orderService.processPayment.mockResolvedValue(mockResult)

      // Act
      await orderController.processPayment(req, res)

      // Assert
      expect(orderService.processPayment).toHaveBeenCalledWith('order789', 'brand123', paymentData)

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '支付處理成功',
        paymentId: 'payment123',
        redirectUrl: 'https://payment.url',
        status: 'pending'
      })
    })

    it('應該正確傳遞所有支付結果屬性', async () => {
      // Arrange
      const paymentData = { paymentMethod: 'cash', amount: 500 }
      req.body = paymentData

      const mockResult = {
        paymentId: 'payment456',
        redirectUrl: null,
        status: 'completed',
        transactionId: 'tx789'
      }

      orderService.processPayment.mockResolvedValue(mockResult)

      // Act
      await orderController.processPayment(req, res)

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '支付處理成功',
        paymentId: 'payment456',
        redirectUrl: null,
        status: 'completed',
        transactionId: 'tx789'
      })
    })
  })

  describe('paymentCallback', () => {
    it('應該成功處理支付回調', async () => {
      // Arrange
      const callbackData = {
        transactionId: 'tx123',
        status: 'success',
        amount: 1000
      }
      req.body = callbackData

      const mockResult = {
        order: TestDataFactory.createOrder(),
        pointsAwarded: 15,
        generatedCoupons: ['coupon3', 'coupon4']
      }

      orderService.paymentCallback.mockResolvedValue(mockResult)

      // Act
      await orderController.paymentCallback(req, res)

      // Assert
      expect(orderService.paymentCallback).toHaveBeenCalledWith('order789', 'brand123', callbackData)

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '支付回調處理完成',
        order: mockResult.order,
        pointsAwarded: 15,
        generatedCoupons: ['coupon3', 'coupon4']
      })
    })

    it('應該處理沒有混合購買獎勵的情況', async () => {
      // Arrange
      const callbackData = { transactionId: 'tx124', status: 'success' }
      req.body = callbackData

      const mockResult = {
        order: TestDataFactory.createOrder()
        // 不包含 pointsAwarded 和 generatedCoupons
      }

      orderService.paymentCallback.mockResolvedValue(mockResult)

      // Act
      await orderController.paymentCallback(req, res)

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '支付回調處理完成',
        order: mockResult.order,
        pointsAwarded: 0, // 應該有默認值
        generatedCoupons: [] // 應該有默認值
      })
    })
  })

  describe('參數處理', () => {
    it('應該正確提取路由參數', async () => {
      // Arrange
      req.params = {
        brandId: 'brand999',
        storeId: 'store888',
        orderId: 'order777'
      }
      
      orderService.getUserOrderById.mockResolvedValue(TestDataFactory.createOrder())

      // Act
      await orderController.getUserOrderById(req, res)

      // Assert
      expect(orderService.getUserOrderById).toHaveBeenCalledWith('order777', 'brand999')
    })

    it('應該正確處理認證信息', async () => {
      // Arrange
      req.auth = {
        userId: 'differentUser456'
      }
      
      orderService.getUserOrders.mockResolvedValue({
        orders: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 }
      })

      // Act
      await orderController.getUserOrders(req, res)

      // Assert
      expect(orderService.getUserOrders).toHaveBeenCalledWith(
        'differentUser456', 
        expect.any(Object)
      )
    })
  })
})