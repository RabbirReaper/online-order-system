/**
 * 訂單 API 整合測試
 * tests/integration/api/order/orderFlow.test.js
 * 測試完整的訂單流程：創建、查詢、支付、狀態更新
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import cors from 'cors'
import session from 'express-session'
import { TestDataFactory } from '../../../setup.js'

// 模擬 express-session
vi.mock('express-session', () => ({
  default: vi.fn().mockReturnValue((req, res, next) => next())
}))

// 模擬所有依賴
vi.mock('@server/models/Order/Order.js', () => {
  const mockOrder = vi.fn().mockImplementation((data) => ({
    ...data,
    _id: data._id || 'mock-order-id',
    save: vi.fn().mockResolvedValue(),
    populate: vi.fn().mockReturnThis(),
    lean: vi.fn().mockReturnThis(),
    toJSON: vi.fn().mockReturnValue(data)
  }))

  mockOrder.find = vi.fn().mockReturnValue({
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),  
    limit: vi.fn().mockReturnThis(),
    populate: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue([])
  })
  
  mockOrder.findById = vi.fn().mockReturnValue({
    populate: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(null)
  })
  
  mockOrder.findOne = vi.fn().mockReturnValue({
    sort: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(null)
  })
  
  mockOrder.countDocuments = vi.fn().mockResolvedValue(0)

  return { default: mockOrder }
})

vi.mock('@server/models/Dish/DishInstance.js', () => {
  const mockDishInstance = vi.fn().mockImplementation((data) => ({
    ...data,
    _id: data._id || 'mock-dish-instance-id',
    save: vi.fn().mockResolvedValue(),
    toObject: vi.fn().mockReturnValue(data)
  }))
  
  mockDishInstance.find = vi.fn().mockResolvedValue([])
  mockDishInstance.findById = vi.fn().mockResolvedValue(null)
  mockDishInstance.deleteMany = vi.fn().mockResolvedValue({ deletedCount: 0 })
  
  return { default: mockDishInstance }
})

vi.mock('@server/models/Dish/DishTemplate.js', () => ({
  default: {
    findById: vi.fn().mockResolvedValue(TestDataFactory.createDishTemplate())
  }
}))

vi.mock('@server/models/Store/Inventory.js', () => ({
  default: {
    findOne: vi.fn().mockResolvedValue(TestDataFactory.createInventory({ availableStock: 100 }))
  }
}))

vi.mock('@server/middlewares/error.js', () => ({
  AppError: class AppError extends Error {
    constructor(message, statusCode = 500) {
      super(message)
      this.statusCode = statusCode
      this.name = 'AppError'
    }
  },
  asyncHandler: (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}))

// 模擬所有服務
vi.mock('@server/services/inventory/stockManagement.js', () => ({
  getInventoryByDish: vi.fn().mockResolvedValue(TestDataFactory.createInventory({ availableStock: 100 })),
  getInventoryItemByDishTemplate: vi.fn().mockResolvedValue(TestDataFactory.createInventory({ availableStock: 100, isInventoryTracked: false, enableAvailableStock: false, isSoldOut: false })),
  updateStock: vi.fn().mockResolvedValue(true),
  reduceInventoryForOrder: vi.fn().mockResolvedValue(true)
}))

vi.mock('@server/services/order/orderCustomer.js', () => ({
  createOrder: vi.fn(),
  generateOrderNumber: vi.fn().mockResolvedValue({
    orderDateCode: '20240901',
    sequence: 1
  }),
  getUserOrders: vi.fn().mockResolvedValue({
    orders: [],
    pagination: {
      total: 0,
      page: 1,
      pages: 0,
      limit: 10
    }
  }),
  getUserOrderById: vi.fn().mockResolvedValue(null),
  processPayment: vi.fn().mockResolvedValue({
    success: true,
    paymentId: 'payment-123',
    redirectUrl: 'https://payment.example.com/redirect'
  }),
  paymentCallback: vi.fn().mockResolvedValue({
    success: true,
    order: TestDataFactory.createOrder({ status: 'paid' })
  })
}))

vi.mock('@server/services/promotion/pointService.js', () => ({
  calculateOrderPoints: vi.fn().mockResolvedValue(10),
  addUserPoints: vi.fn().mockResolvedValue(true),
  getUserPoints: vi.fn().mockResolvedValue([]),
  addPointsToUser: vi.fn().mockResolvedValue(true)
}))

vi.mock('@server/services/promotion/pointRuleService.js', () => ({
  calculateOrderPoints: vi.fn().mockResolvedValue({
    points: 10,
    rule: {
      _id: 'rule-id',
      name: 'Test Rule',
      conversionRate: 0.1,
      minimumAmount: 100,
      validityDays: 60
    }
  })
}))

vi.mock('@server/services/bundle/bundleService.js', () => ({
  validateBundlePurchase: vi.fn().mockResolvedValue(true)
}))

vi.mock('@server/services/bundle/bundleInstance.js', () => ({
  createInstance: vi.fn().mockResolvedValue({
    _id: 'bundle-instance-id',
    name: 'Test Bundle',
    finalPrice: 100
  }),
  generateVouchersForBundle: vi.fn().mockResolvedValue([])
}))

// 新增缺少的模型模擬
vi.mock('@server/models/Promotion/BundleInstance.js', () => ({
  default: {
    findById: vi.fn().mockResolvedValue(null),
    deleteMany: vi.fn().mockResolvedValue({ deletedCount: 0 })
  }
}))

vi.mock('@server/models/Promotion/Bundle.js', () => ({
  default: {
    findByIdAndUpdate: vi.fn().mockResolvedValue({})
  }
}))

vi.mock('@server/models/Promotion/VoucherInstance.js', () => ({
  default: {
    findOne: vi.fn().mockResolvedValue(null),
    findById: vi.fn().mockResolvedValue(null)
  }
}))

vi.mock('@server/models/Promotion/VoucherTemplate.js', () => ({
  default: {
    findById: vi.fn().mockResolvedValue(null)
  }
}))

vi.mock('@server/models/Promotion/CouponInstance.js', () => ({
  default: {
    findById: vi.fn().mockResolvedValue(null)
  }
}))

vi.mock('@server/utils/date.js', () => ({
  getTaiwanDateTime: vi.fn().mockReturnValue(new Date()),
  formatDateTime: vi.fn().mockReturnValue('2024-09-01 12:00:00'),
  generateDateCode: vi.fn().mockReturnValue('20240901')
}))

// 模擬認證中介軟體
vi.mock('@server/middlewares/auth/index.js', () => ({
  authenticate: vi.fn().mockImplementation((userType) => (req, res, next) => {
    if (userType === 'user') {
      if (req.session?.userId) {
        req.auth = { userId: req.session.userId }
        next()
      } else {
        res.status(401).json({ success: false, message: '請先登入' })
      }
    } else {
      next()
    }
  })
}))

// 動態導入模組
let app
let orderCustomerRoutes
let orderService
let inventoryService

describe('訂單 API 整合測試', () => {
  beforeAll(async () => {
    // 動態導入路由和服務
    const { default: orderCustomerRoutesModule } = await import('@server/routes/orderCustomer.js')
    orderCustomerRoutes = orderCustomerRoutesModule
    
    orderService = await import('@server/services/order/orderCustomer.js')
    inventoryService = await import('@server/services/inventory/stockManagement.js')

    // 設置 Express 應用
    app = express()
    app.use(cors())
    app.use(express.json({ limit: '50mb' }))
    app.use(express.urlencoded({ extended: true, limit: '50mb' }))
    
    // 設置 session
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }
    }))

    // 模擬認證中介軟體
    app.use((req, res, next) => {
      // 模擬用戶登入狀態
      if (req.headers.authorization) {
        req.session.userId = 'test-user-id'
        req.auth = { userId: 'test-user-id' }
      }
      next()
    })

    // 使用訂單路由
    app.use('/api/orderCustomer', orderCustomerRoutes)

    // 全域錯誤處理
    app.use((error, req, res, next) => {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || '伺服器錯誤'
      })
    })
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/orderCustomer/brands/:brandId/stores/:storeId/create', () => {
    const createOrderEndpoint = '/api/orderCustomer/brands/test-brand/stores/test-store/create'

    it('應該成功創建訂單（匿名用戶）', async () => {
      // 模擬訂單創建成功
      const mockOrder = TestDataFactory.createOrder({
        _id: 'order-123',
        orderNumber: 'T20240901001',
        status: 'pending',
        total: 150
      })
      
      orderService.createOrder.mockResolvedValue(mockOrder)

      const orderData = {
        items: [
          {
            itemType: 'dish',
            dishTemplate: 'dish-template-id',
            name: '測試菜品',
            price: 150,
            quantity: 1
          }
        ],
        orderType: 'dine_in',
        tableNumber: 'A1',
        paymentMethod: 'cash',
        customerInfo: {
          name: '測試客戶',
          phone: '0912345678'
        }
      }

      const response = await request(app)
        .post(createOrderEndpoint)
        .send(orderData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('訂單創建成功')
      expect(response.body.order).toBeDefined()
      expect(response.body.orderNumber).toBe('20240901001')
      
      // 驗證服務被正確調用
      expect(orderService.generateOrderNumber).toHaveBeenCalledWith('test-store')
      expect(orderService.createOrder).toHaveBeenCalledWith(expect.objectContaining({
        brand: 'test-brand',
        store: 'test-store',
        items: orderData.items,
        orderType: orderData.orderType,
        orderDateCode: '20240901',
        sequence: 1
      }))
    })

    it('應該成功創建訂單（已登入用戶）', async () => {
      const mockOrder = TestDataFactory.createOrder({
        _id: 'order-124',
        user: 'test-user-id',
        status: 'pending'
      })
      
      orderService.createOrder.mockResolvedValue(mockOrder)

      const orderData = {
        items: [
          {
            itemType: 'dish',
            dishTemplate: 'dish-template-id', 
            name: '測試菜品',
            price: 150,
            quantity: 1
          }
        ],
        orderType: 'takeout',
        paymentMethod: 'credit_card'
      }

      const response = await request(app)
        .post(createOrderEndpoint)
        .set('Authorization', 'Bearer test-token')
        .send(orderData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(orderService.createOrder).toHaveBeenCalledWith(expect.objectContaining({
        user: 'test-user-id',
        brand: 'test-brand',
        store: 'test-store'
      }))
    })

    it('應該處理庫存不足的錯誤', async () => {
      // 模擬庫存不足錯誤
      const { AppError } = await import('@server/middlewares/error.js')
      orderService.createOrder.mockRejectedValue(new AppError('庫存不足', 400))

      const orderData = {
        items: [
          {
            itemType: 'dish',
            dishTemplate: 'dish-template-id',
            name: '測試菜品',
            price: 150,
            quantity: 100 // 過多數量
          }
        ],
        orderType: 'dine_in'
      }

      const response = await request(app)
        .post(createOrderEndpoint)
        .send(orderData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('庫存不足')
    })

    it('應該處理無效訂單資料', async () => {
      const response = await request(app)
        .post(createOrderEndpoint)
        .send({})
        .expect(500)

      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/orderCustomer/brands/:brandId/my-orders', () => {
    const getUserOrdersEndpoint = '/api/orderCustomer/brands/test-brand/my-orders'

    it('應該獲取用戶訂單列表（需要認證）', async () => {
      const mockOrders = {
        orders: [
          TestDataFactory.createOrder({ _id: 'order-1' }),
          TestDataFactory.createOrder({ _id: 'order-2' })
        ],
        pagination: {
          total: 2,
          page: 1,
          pages: 1,
          limit: 10
        }
      }
      
      orderService.getUserOrders.mockResolvedValue(mockOrders)

      const response = await request(app)
        .get(getUserOrdersEndpoint)
        .set('Authorization', 'Bearer test-token')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.orders).toHaveLength(2)
      expect(response.body.pagination).toBeDefined()
      
      expect(orderService.getUserOrders).toHaveBeenCalledWith(
        'test-user-id',
        expect.objectContaining({
          brandId: 'test-brand',
          page: 1,
          limit: 10
        })
      )
    })

    it('應該支援分頁查詢', async () => {
      orderService.getUserOrders.mockResolvedValue({
        orders: [],
        pagination: { total: 0, page: 2, pages: 1, limit: 5 }
      })

      const response = await request(app)
        .get(getUserOrdersEndpoint + '?page=2&limit=5')
        .set('Authorization', 'Bearer test-token')
        .expect(200)

      expect(orderService.getUserOrders).toHaveBeenCalledWith(
        'test-user-id',
        expect.objectContaining({
          page: 2,
          limit: 5
        })
      )
    })

    it('未認證時應該返回錯誤', async () => {
      const response = await request(app)
        .get(getUserOrdersEndpoint)
        .expect(401) // 正確的認證錯誤狀態碼

      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/orderCustomer/brands/:brandId/order/:orderId', () => {
    const getOrderEndpoint = '/api/orderCustomer/brands/test-brand/order/order-123'

    it('應該獲取訂單詳情', async () => {
      const mockOrder = TestDataFactory.createOrder({ _id: 'order-123' })
      orderService.getUserOrderById.mockResolvedValue(mockOrder)

      const response = await request(app)
        .get(getOrderEndpoint)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.order).toBeDefined()
      expect(response.body.order._id).toBe('order-123')
      
      expect(orderService.getUserOrderById).toHaveBeenCalledWith('order-123', 'test-brand')
    })

    it('應該處理訂單不存在', async () => {
      orderService.getUserOrderById.mockResolvedValue(null)

      const response = await request(app)
        .get(getOrderEndpoint)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('找不到指定的訂單')
    })
  })

  describe('POST /api/orderCustomer/brands/:brandId/orders/:orderId/payment', () => {
    const paymentEndpoint = '/api/orderCustomer/brands/test-brand/orders/order-123/payment'

    it('應該處理支付請求', async () => {
      const mockPaymentResult = {
        success: true,
        paymentId: 'payment-123',
        redirectUrl: 'https://payment.example.com/redirect'
      }
      
      orderService.processPayment.mockResolvedValue(mockPaymentResult)

      const paymentData = {
        paymentMethod: 'line_pay',
        amount: 150
      }

      const response = await request(app)
        .post(paymentEndpoint)
        .send(paymentData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.paymentId).toBe('payment-123')
      expect(response.body.redirectUrl).toBeDefined()
      
      expect(orderService.processPayment).toHaveBeenCalledWith(
        'order-123',
        'test-brand',
        paymentData
      )
    })

    it('應該處理支付失敗', async () => {
      const { AppError } = await import('@server/middlewares/error.js')
      orderService.processPayment.mockRejectedValue(new AppError('支付處理失敗', 400))

      const response = await request(app)
        .post(paymentEndpoint)
        .send({ paymentMethod: 'credit_card', amount: 150 })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('支付處理失敗')
    })
  })

  describe('POST /api/orderCustomer/brands/:brandId/orders/:orderId/payment/callback', () => {
    const callbackEndpoint = '/api/orderCustomer/brands/test-brand/orders/order-123/payment/callback'

    it('應該處理支付回調', async () => {
      const mockCallbackResult = {
        success: true,
        order: TestDataFactory.createOrder({ 
          _id: 'order-123',
          status: 'paid' 
        })
      }
      
      orderService.paymentCallback.mockResolvedValue(mockCallbackResult)

      const callbackData = {
        paymentId: 'payment-123',
        status: 'success',
        transactionId: 'txn-456'
      }

      const response = await request(app)
        .post(callbackEndpoint)
        .send(callbackData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.order.status).toBe('paid')
      
      expect(orderService.paymentCallback).toHaveBeenCalledWith(
        'order-123',
        'test-brand',
        callbackData
      )
    })

    it('應該處理支付回調失敗', async () => {
      const { AppError } = await import('@server/middlewares/error.js')
      orderService.paymentCallback.mockRejectedValue(new AppError('支付回調處理失敗', 400))

      const response = await request(app)
        .post(callbackEndpoint)
        .send({ paymentId: 'invalid-payment' })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('支付回調處理失敗')
    })
  })

  describe('完整訂單流程整合測試', () => {
    it('應該完成完整的下單到支付流程', async () => {
      // Step 1: 創建訂單
      const mockOrder = TestDataFactory.createOrder({
        _id: 'flow-order-123',
        status: 'pending',
        total: 150
      })
      
      orderService.createOrder.mockResolvedValue(mockOrder)

      const orderData = {
        items: [
          {
            itemType: 'dish',
            dishTemplate: 'dish-template-id',
            name: '測試菜品',
            price: 150,
            quantity: 1
          }
        ],
        orderType: 'dine_in',
        paymentMethod: 'line_pay',
        customerInfo: {
          name: '測試客戶',
          phone: '0912345678'
        }
      }

      const createResponse = await request(app)
        .post('/api/orderCustomer/brands/test-brand/stores/test-store/create')
        .send(orderData)
        .expect(201)

      expect(createResponse.body.success).toBe(true)
      const orderId = createResponse.body.order._id

      // Step 2: 查詢訂單詳情
      orderService.getUserOrderById.mockResolvedValue(mockOrder)
      
      const getResponse = await request(app)
        .get(`/api/orderCustomer/brands/test-brand/order/${orderId}`)
        .expect(200)

      expect(getResponse.body.success).toBe(true)
      expect(getResponse.body.order._id).toBe(orderId)

      // Step 3: 處理支付
      const mockPaymentResult = {
        success: true,
        paymentId: 'payment-123'
      }
      orderService.processPayment.mockResolvedValue(mockPaymentResult)

      const paymentResponse = await request(app)
        .post(`/api/orderCustomer/brands/test-brand/orders/${orderId}/payment`)
        .send({ paymentMethod: 'line_pay', amount: 150 })
        .expect(200)

      expect(paymentResponse.body.success).toBe(true)
      expect(paymentResponse.body.paymentId).toBe('payment-123')

      // Step 4: 支付回調
      const mockCallbackResult = {
        success: true,
        order: { ...mockOrder, status: 'paid' }
      }
      orderService.paymentCallback.mockResolvedValue(mockCallbackResult)

      const callbackResponse = await request(app)
        .post(`/api/orderCustomer/brands/test-brand/orders/${orderId}/payment/callback`)
        .send({ paymentId: 'payment-123', status: 'success' })
        .expect(200)

      expect(callbackResponse.body.success).toBe(true)
      expect(callbackResponse.body.order.status).toBe('paid')

      // 驗證所有服務都被正確調用
      expect(orderService.createOrder).toHaveBeenCalled()
      expect(orderService.getUserOrderById).toHaveBeenCalled()
      expect(orderService.processPayment).toHaveBeenCalled()
      expect(orderService.paymentCallback).toHaveBeenCalled()
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  afterAll(() => {
    vi.restoreAllMocks()
  })
})