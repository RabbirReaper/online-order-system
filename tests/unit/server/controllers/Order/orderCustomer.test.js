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

// Mock paymentOrderService
vi.mock('@server/services/payment/paymentOrderService.js', () => ({
  processPaymentAndCreateOrder: vi.fn(),
  getOrderPaymentStatus: vi.fn(),
  processRefund: vi.fn()
}))

// Mock error middleware
vi.mock('@server/middlewares/error.js', () => ({
  asyncHandler: vi.fn((fn) => fn),
  AppError: vi.fn((message, statusCode) => {
    const error = new Error(message)
    error.statusCode = statusCode
    return error
  })
}))

// 動態導入控制器和服務
const orderController = await import('@server/controllers/Order/orderCustomer.js')
const orderService = await import('@server/services/order/orderCustomer.js')
const paymentOrderService = await import('@server/services/payment/paymentOrderService.js')

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
    it('應該成功創建現場付款訂單', async () => {
      // Arrange
      const orderData = TestDataFactory.createOrder()
      req.body = {
        orderData,
        paymentType: 'On-site',
        paymentMethod: 'cash'
      }

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
        paymentType: 'On-site',
        paymentMethod: 'cash'
      }

      orderService.generateOrderNumber.mockResolvedValue(mockOrderNumber)
      orderService.createOrder.mockResolvedValue(mockOrderResult)

      // Act
      await orderController.createOrder(req, res)

      // Assert
      expect(orderService.generateOrderNumber).toHaveBeenCalledWith('store456')

      const expectedOrderData = {
        ...orderData,
        paymentType: 'On-site',
        paymentMethod: 'cash',
        brand: 'brand123',
        store: 'store456',
        user: 'user123',
        orderDateCode: '2024010',
        sequence: 123
      }
      expect(orderService.createOrder).toHaveBeenCalledWith(expectedOrderData)

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        order: mockOrderResult,
        status: 'cash_submitted',
        message: '訂單已送出，請至櫃台付款'
      })
    })

    it('應該支援匿名用戶創建訂單', async () => {
      // Arrange
      const orderData = TestDataFactory.createOrder()
      req.body = {
        orderData,
        paymentType: 'On-site',
        paymentMethod: 'cash'
      }
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
        paymentType: 'On-site',
        paymentMethod: 'cash'
      }

      orderService.generateOrderNumber.mockResolvedValue(mockOrderNumber)
      orderService.createOrder.mockResolvedValue(mockOrderResult)

      // Act
      await orderController.createOrder(req, res)

      // Assert
      const expectedOrderData = {
        ...orderData,
        paymentType: 'On-site',
        paymentMethod: 'cash',
        brand: 'brand123',
        store: 'store456',
        user: undefined, // 匿名用戶
        orderDateCode: '2024010',
        sequence: 124
      }
      expect(orderService.createOrder).toHaveBeenCalledWith(expectedOrderData)

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        order: mockOrderResult,
        status: 'cash_submitted',
        message: '訂單已送出，請至櫃台付款'
      })
    })

    it('應該成功創建線上付款訂單', async () => {
      // Arrange
      const orderData = TestDataFactory.createOrder()
      req.body = {
        orderData: {
          ...orderData,
          customerInfo: { name: 'Test User', phone: '0912345678', email: 'test@example.com' },
          total: 1000
        },
        paymentType: 'Online',
        paymentMethod: 'credit_card',
        primeToken: 'test_prime_token'
      }

      const mockResult = {
        success: true,
        order: { _id: 'order791', ...orderData, status: 'paid' },
        transaction: { transactionId: 'txn_123', status: 'completed' }
      }

      paymentOrderService.processPaymentAndCreateOrder.mockResolvedValue(mockResult)

      // Act
      await orderController.createOrder(req, res)

      // Assert
      expect(paymentOrderService.processPaymentAndCreateOrder).toHaveBeenCalledWith(
        {
          ...orderData,
          customerInfo: { name: 'Test User', phone: '0912345678', email: 'test@example.com' },
          total: 1000,
          brand: 'brand123',
          store: 'store456',
          customerId: 'user123',
          customerName: 'Test User',
          customerPhone: '0912345678',
          customerEmail: 'test@example.com',
          totalAmount: 1000
        },
        'test_prime_token',
        'credit_card'
      )

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        order: mockResult.order,
        status: 'online_success',
        transaction: mockResult.transaction,
        message: '付款成功，訂單已確認'
      })
    })

    it('應該在缺少必要參數時拋出錯誤', async () => {
      // Arrange
      req.body = {} // 缺少必要參數

      // Act & Assert
      await expect(orderController.createOrder(req, res)).rejects.toThrow('缺少必要的訂單資料')
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