import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TestDataFactory } from '../../../../setup.js'

// Mock dependencies
const mockQueryChain = () => ({
  sort: vi.fn().mockReturnThis(),
  skip: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  populate: vi.fn().mockReturnThis(),
  lean: vi.fn()
})

vi.mock('@server/models/Order/Order.js', () => ({
  default: {
    countDocuments: vi.fn(),
    find: vi.fn().mockImplementation(() => mockQueryChain()),
    findOne: vi.fn().mockImplementation(() => mockQueryChain()),
    findById: vi.fn()
  }
}))

vi.mock('@server/models/Promotion/VoucherInstance.js', () => ({
  default: {
    find: vi.fn(),
    findById: vi.fn()
  }
}))

vi.mock('@server/models/Promotion/CouponInstance.js', () => ({
  default: {
    findById: vi.fn()
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

vi.mock('@server/utils/date.js', () => ({
  parseDateString: vi.fn().mockImplementation((dateString) => ({
    toJSDate: vi.fn().mockReturnValue(new Date(dateString))
  })),
  getStartOfDay: vi.fn().mockImplementation((dateTime) => dateTime),
  getEndOfDay: vi.fn().mockImplementation((dateTime) => dateTime)
}))

vi.mock('@server/services/order/orderCustomer.js', () => ({
  processOrderPaymentComplete: vi.fn().mockResolvedValue({
    _id: '507f1f77bcf86cd799439017',
    status: 'paid',
    pointsAwarded: 10
  }),
  processOrderPointsReward: vi.fn().mockResolvedValue({ pointsAwarded: 10 }),
  updateOrderAmounts: vi.fn()
}))

// 動態導入服務
const orderAdminService = await import('@server/services/order/orderAdmin.js')
const Order = (await import('@server/models/Order/Order.js')).default
const VoucherInstance = (await import('@server/models/Promotion/VoucherInstance.js')).default
const CouponInstance = (await import('@server/models/Promotion/CouponInstance.js')).default
const { AppError } = await import('@server/middlewares/error.js')
const dateUtils = await import('@server/utils/date.js')
const orderCustomerService = await import('@server/services/order/orderCustomer.js')

describe('OrderAdmin Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getStoreOrders', () => {
    const storeId = '507f1f77bcf86cd799439014'
    const mockOrders = [
      TestDataFactory.createOrder({ _id: '1', store: storeId }),
      TestDataFactory.createOrder({ _id: '2', store: storeId })
    ]

    beforeEach(() => {
      // 設置預設的鏈式調用行為
      const chainMock = mockQueryChain()
      chainMock.lean.mockResolvedValue(mockOrders)
      Order.find.mockReturnValue(chainMock)
      Order.countDocuments.mockResolvedValue(10)
    })

    it('應該成功取得店鋪訂單列表', async () => {
      const result = await orderAdminService.getStoreOrders(storeId, {
        page: 1,
        limit: 20
      })

      expect(Order.countDocuments).toHaveBeenCalledWith({ store: storeId })
      expect(Order.find).toHaveBeenCalledWith({ store: storeId })
      expect(result.orders).toEqual(mockOrders)
      expect(result.pagination).toMatchObject({
        total: 10,
        totalPages: 1,
        currentPage: 1,
        limit: 20
      })
    })

    it('應該支援狀態篩選', async () => {
      await orderAdminService.getStoreOrders(storeId, {
        status: 'paid',
        page: 1,
        limit: 20
      })

      expect(Order.countDocuments).toHaveBeenCalledWith({ 
        store: storeId, 
        status: 'paid' 
      })
      expect(Order.find).toHaveBeenCalledWith({ 
        store: storeId, 
        status: 'paid' 
      })
    })

    it('應該支援訂單類型篩選', async () => {
      await orderAdminService.getStoreOrders(storeId, {
        orderType: 'dine_in',
        page: 1,
        limit: 20
      })

      expect(Order.countDocuments).toHaveBeenCalledWith({ 
        store: storeId, 
        orderType: 'dine_in' 
      })
    })

    it('應該支援日期範圍篩選', async () => {
      const mockDateTime = { toJSDate: () => new Date('2024-01-01') }
      dateUtils.parseDateString.mockReturnValue(mockDateTime)
      dateUtils.getStartOfDay.mockReturnValue(mockDateTime)
      dateUtils.getEndOfDay.mockReturnValue(mockDateTime)

      await orderAdminService.getStoreOrders(storeId, {
        fromDate: '2024-01-01',
        toDate: '2024-01-02'
      })

      expect(dateUtils.parseDateString).toHaveBeenCalledWith('2024-01-01')
      expect(dateUtils.parseDateString).toHaveBeenCalledWith('2024-01-02')
      expect(Order.countDocuments).toHaveBeenCalledWith({
        store: storeId,
        createdAt: {
          $gte: new Date('2024-01-01'),
          $lte: new Date('2024-01-01')
        }
      })
    })

    it('當日期格式無效時應該拋出錯誤', async () => {
      dateUtils.parseDateString.mockImplementation(() => {
        throw new Error('Invalid date')
      })

      await expect(
        orderAdminService.getStoreOrders(storeId, { fromDate: 'invalid-date' })
      ).rejects.toThrow('無效的開始日期格式')
    })

    it('應該正確計算分頁資訊', async () => {
      Order.countDocuments.mockResolvedValue(25)
      const chainMock = mockQueryChain()
      chainMock.lean.mockResolvedValue(mockOrders)
      Order.find.mockReturnValue(chainMock)

      const result = await orderAdminService.getStoreOrders(storeId, {
        page: 2,
        limit: 10
      })

      expect(chainMock.skip).toHaveBeenCalledWith(10)
      expect(chainMock.limit).toHaveBeenCalledWith(10)
      expect(result.pagination).toMatchObject({
        total: 25,
        totalPages: 3,
        currentPage: 2,
        limit: 10,
        hasNextPage: true,
        hasPrevPage: true
      })
    })
  })

  describe('getUserOrders', () => {
    const userId = '507f1f77bcf86cd799439011'
    const mockOrders = [
      TestDataFactory.createOrder({ user: userId }),
      TestDataFactory.createOrder({ user: userId })
    ]

    it('應該成功取得用戶訂單列表', async () => {
      Order.countDocuments.mockResolvedValue(5)
      Order.find.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockOrders)
      })

      const result = await orderAdminService.getUserOrders(userId, {
        page: 1,
        limit: 10
      })

      expect(Order.countDocuments).toHaveBeenCalledWith({ user: userId })
      expect(result.orders).toEqual(mockOrders)
      expect(result.pagination.total).toBe(5)
    })

    it('應該支援品牌篩選', async () => {
      const brandId = '507f1f77bcf86cd799439013'
      Order.countDocuments.mockResolvedValue(3)
      Order.find.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockOrders[0]])
      })

      await orderAdminService.getUserOrders(userId, {
        brandId,
        page: 1,
        limit: 10
      })

      expect(Order.countDocuments).toHaveBeenCalledWith({ 
        user: userId, 
        brand: brandId 
      })
    })

    it('應該支援排序選項', async () => {
      Order.countDocuments.mockResolvedValue(2)
      const mockChain = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockOrders)
      }
      Order.find.mockReturnValue(mockChain)

      await orderAdminService.getUserOrders(userId, {
        sortBy: 'totalAmount',
        sortOrder: 'asc'
      })

      expect(mockChain.sort).toHaveBeenCalledWith({ totalAmount: 1 })
    })
  })

  describe('getOrderById', () => {
    const orderId = '507f1f77bcf86cd799439017'
    const storeId = '507f1f77bcf86cd799439014'
    const mockOrder = TestDataFactory.createOrder({ _id: orderId })

    it('應該成功取得訂單詳情', async () => {
      const chainMock = mockQueryChain()
      chainMock.lean.mockResolvedValue(mockOrder)
      Order.findOne.mockReturnValue(chainMock)

      const result = await orderAdminService.getOrderById(orderId, storeId)

      expect(Order.findOne).toHaveBeenCalledWith({ 
        _id: orderId, 
        store: storeId 
      })
      expect(result).toEqual(mockOrder)
    })

    it('當訂單不存在時應該拋出404錯誤', async () => {
      const chainMock = mockQueryChain()
      chainMock.lean.mockResolvedValue(null)
      Order.findOne.mockReturnValue(chainMock)

      await expect(
        orderAdminService.getOrderById(orderId, storeId)
      ).rejects.toThrow('訂單不存在')
    })

    it('不指定店鋪ID時應該查詢所有訂單', async () => {
      const chainMock = mockQueryChain()
      chainMock.lean.mockResolvedValue(mockOrder)
      Order.findOne.mockReturnValue(chainMock)

      await orderAdminService.getOrderById(orderId)

      expect(Order.findOne).toHaveBeenCalledWith({ _id: orderId })
    })
  })

  describe('updateOrder', () => {
    const orderId = '507f1f77bcf86cd799439017'
    const adminId = '507f1f77bcf86cd799439012'
    let mockOrder

    beforeEach(() => {
      mockOrder = {
        _id: orderId,
        status: 'unpaid',
        manualAdjustment: 0,
        items: [
          { itemType: 'dish', dishInstance: '507f1f77bcf86cd799439021' }
        ],
        user: '507f1f77bcf86cd799439011',
        save: vi.fn().mockResolvedValue(),
        toObject: vi.fn().mockReturnValue({ 
          _id: orderId, 
          status: 'paid'
          // 不設置 pointsAwarded，讓 processOrderPaymentComplete 的返回值生效
        })
      }
      Order.findById.mockResolvedValue(mockOrder)
    })

    it('應該成功更新訂單基本資訊', async () => {
      const updateData = {
        status: 'paid',
        notes: '測試備註',
        paymentMethod: 'credit_card'
      }

      // Mock processOrderPaymentComplete 返回帶有 pointsAwarded 的結果
      orderCustomerService.processOrderPaymentComplete.mockResolvedValue({
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
        orderAdminService.updateOrder(orderId, { status: 'paid' }, adminId)
      ).rejects.toThrow('訂單不存在')
    })

    it('更新手動調整金額時應該重新計算總額', async () => {
      const updateData = { manualAdjustment: -50 }

      await orderAdminService.updateOrder(orderId, updateData, adminId)

      expect(orderCustomerService.updateOrderAmounts).toHaveBeenCalledWith(mockOrder)
      expect(mockOrder.manualAdjustment).toBe(-50)
    })

    it('狀態變為paid時應該處理Bundle券生成和點數給予', async () => {
      mockOrder.status = 'unpaid'
      mockOrder.items = [
        { itemType: 'bundle', bundleInstance: '507f1f77bcf86cd799439022' }
      ]

      // Mock processOrderPaymentComplete 直接返回結果對象
      orderCustomerService.processOrderPaymentComplete.mockResolvedValue({
        _id: orderId,
        status: 'paid',
        pointsAwarded: 10,
        ...mockOrder.toObject()
      })

      const updateData = { status: 'paid' }
      const result = await orderAdminService.updateOrder(orderId, updateData, adminId)

      expect(orderCustomerService.processOrderPaymentComplete).toHaveBeenCalledWith(mockOrder)
      expect(result.pointsAwarded).toBe(10)
    })

    it('只有用戶訂單時應該正常處理付款完成流程', async () => {
      mockOrder.status = 'unpaid'
      mockOrder.items = [
        { itemType: 'dish', dishInstance: '507f1f77bcf86cd799439021' }
      ]
      
      // 有用戶但無Bundle項目，仍然會調用 processOrderPaymentComplete
      orderCustomerService.processOrderPaymentComplete.mockResolvedValue({
        _id: orderId,
        status: 'paid',
        pointsAwarded: 5,
        ...mockOrder.toObject()
      })

      const updateData = { status: 'paid' }
      const result = await orderAdminService.updateOrder(orderId, updateData, adminId)

      expect(orderCustomerService.processOrderPaymentComplete).toHaveBeenCalledWith(mockOrder)
      expect(result.pointsAwarded).toBe(5)
    })

    it('應該正確處理深度對象合併（deliveryInfo, dineInInfo）', async () => {
      mockOrder.deliveryInfo = { address: '原地址', phone: '原電話' }
      mockOrder.dineInInfo = { tableNumber: 'A1' }

      const updateData = {
        deliveryInfo: { address: '新地址' },
        dineInInfo: { specialRequests: '新要求' }
      }

      await orderAdminService.updateOrder(orderId, updateData, adminId)

      expect(mockOrder.deliveryInfo).toEqual({
        address: '新地址',
        phone: '原電話'
      })
      expect(mockOrder.dineInInfo).toEqual({
        tableNumber: 'A1',
        specialRequests: '新要求'
      })
    })
  })

  describe('cancelOrder', () => {
    const orderId = '507f1f77bcf86cd799439017'
    const adminId = '507f1f77bcf86cd799439012'
    const reason = '客戶要求取消'
    let mockOrder

    beforeEach(() => {
      mockOrder = {
        _id: orderId,
        status: 'paid',
        user: '507f1f77bcf86cd799439011',
        pointsEarned: 10,
        discounts: [],
        items: [],
        save: vi.fn().mockResolvedValue()
      }
      Order.findById.mockResolvedValue(mockOrder)
    })

    it('應該成功取消訂單', async () => {
      const result = await orderAdminService.cancelOrder(orderId, reason, adminId)

      expect(mockOrder.status).toBe('cancelled')
      expect(mockOrder.cancelReason).toBe(reason)
      expect(mockOrder.cancelledBy).toBe(adminId)
      expect(mockOrder.cancelledByModel).toBe('Admin')
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

    it('應該恢復使用的Voucher狀態', async () => {
      const mockVoucher = {
        _id: 'voucher1',
        isUsed: true,
        usedAt: new Date(),
        orderId: orderId,
        voucherName: 'Test Voucher',
        expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        save: vi.fn().mockResolvedValue()
      }
      
      mockOrder.discounts = [{
        discountModel: 'VoucherInstance',
        refId: 'voucher1'
      }]
      
      VoucherInstance.findById.mockResolvedValue(mockVoucher)

      await orderAdminService.cancelOrder(orderId, reason, adminId)

      expect(VoucherInstance.findById).toHaveBeenCalledWith('voucher1')
      expect(mockVoucher.isUsed).toBe(false)
      expect(mockVoucher.usedAt).toBe(null)
      expect(mockVoucher.orderId).toBe(null)
      expect(mockVoucher.save).toHaveBeenCalled()
    })

    it('應該恢復使用的Coupon狀態', async () => {
      const mockCoupon = {
        _id: 'coupon1',
        isUsed: true,
        usedAt: new Date(),
        order: orderId,
        expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        save: vi.fn().mockResolvedValue()
      }
      
      mockOrder.discounts = [{
        discountModel: 'CouponInstance',
        refId: 'coupon1'
      }]
      
      CouponInstance.findById.mockResolvedValue(mockCoupon)

      await orderAdminService.cancelOrder(orderId, reason, adminId)

      expect(CouponInstance.findById).toHaveBeenCalledWith('coupon1')
      expect(mockCoupon.isUsed).toBe(false)
      expect(mockCoupon.usedAt).toBe(null)
      expect(mockCoupon.order).toBe(null)
      expect(mockCoupon.save).toHaveBeenCalled()
    })

    it('應該處理包含Bundle實例的訂單取消', async () => {
      mockOrder.items = [{
        itemType: 'bundle',
        bundleInstance: 'bundle1'
      }]

      const mockVouchers = [{
        _id: 'voucher1',
        isUsed: false,
        createdBy: 'bundle1',
        save: vi.fn().mockResolvedValue()
      }]

      VoucherInstance.find.mockResolvedValue(mockVouchers)

      await orderAdminService.cancelOrder(orderId, reason, adminId)

      expect(VoucherInstance.find).toHaveBeenCalledWith({
        createdBy: { $in: ['bundle1'] },
        isUsed: false
      })
      expect(mockVouchers[0].isUsed).toBe(true)
      expect(mockVouchers[0].invalidReason).toBe('ORDER_CANCELLED')
    })

    it('不應該恢復已過期的Voucher', async () => {
      const expiredVoucher = {
        _id: 'voucher1',
        isUsed: true,
        voucherName: 'Expired Voucher',
        expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 已過期
        save: vi.fn()
      }
      
      mockOrder.discounts = [{
        discountModel: 'VoucherInstance',
        refId: 'voucher1'
      }]
      
      VoucherInstance.findById.mockResolvedValue(expiredVoucher)
      console.log = vi.fn() // Mock console.log

      await orderAdminService.cancelOrder(orderId, reason, adminId)

      expect(expiredVoucher.save).not.toHaveBeenCalled()
      expect(console.log).toHaveBeenCalledWith(
        'Voucher Expired Voucher has expired, cannot restore'
      )
    })

    it('不應該恢復已過期的Coupon', async () => {
      const expiredCoupon = {
        _id: 'coupon1',
        isUsed: true,
        expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 已過期
        save: vi.fn()
      }
      
      mockOrder.discounts = [{
        discountModel: 'CouponInstance',
        refId: 'coupon1'
      }]
      
      CouponInstance.findById.mockResolvedValue(expiredCoupon)
      console.log = vi.fn() // Mock console.log

      await orderAdminService.cancelOrder(orderId, reason, adminId)

      expect(expiredCoupon.save).not.toHaveBeenCalled()
      expect(console.log).toHaveBeenCalledWith(
        'Coupon has expired, cannot restore'
      )
    })
  })
})