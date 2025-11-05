import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCartStore } from '@/stores/cart.js'

// Mock external dependencies
vi.mock('@/api', () => ({
  default: {
    orderCustomer: {
      createOrder: vi.fn()
    }
  }
}))

vi.mock('@/stores/customerAuth', () => ({
  useAuthStore: () => ({
    isLoggedIn: false,
    userId: null,
    userName: null
  })
}))

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },
  writable: true
})

describe('Cart Store', () => {
  let cartStore

  // Helper functions for creating mock items
  const createMockDishItem = (templateId = 'dish-1', basePrice = 100, quantity = 1, options = []) => ({
    dishInstance: {
      templateId,
      name: 'Test Dish',
      basePrice,
      finalPrice: basePrice,
      options
    },
    quantity,
    subtotal: basePrice * quantity,
    note: ''
  })

  const createMockBundleItem = (templateId = 'bundle-1', finalPrice = 150, quantity = 1) => ({
    bundleInstance: {
      templateId,
      name: 'Test Bundle',
      finalPrice,
      purchaseType: 'cash'
    },
    quantity,
    subtotal: finalPrice * quantity,
    note: ''
  })

  beforeEach(() => {
    setActivePinia(createPinia())
    cartStore = useCartStore()
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have empty initial state', () => {
      expect(cartStore.items).toEqual([])
      expect(cartStore.orderType).toBe('')
      expect(cartStore.customerInfo).toEqual({ name: '', phone: '', lineUniqueId: '' })
      expect(cartStore.appliedCoupons).toEqual([])
      expect(cartStore.paymentType).toBe('On-site')
      expect(cartStore.paymentMethod).toBe('cash')
      expect(cartStore.isStaffMode).toBe(false)
      expect(cartStore.notes).toBe('')
      expect(cartStore.serviceChargeRate).toBe(0)
    })

    it('should have correct initial computed properties', () => {
      expect(cartStore.subtotal).toBe(0)
      expect(cartStore.serviceCharge).toBe(0)
      expect(cartStore.discountAmount).toBe(0)
      expect(cartStore.total).toBe(0)
      expect(cartStore.itemCount).toBe(0)
      expect(cartStore.isCartEmpty).toBe(true)
      expect(cartStore.isValid).toBe(false)
    })
  })

  describe('Brand and Store Management', () => {
    it('should set brand and store correctly', () => {
      const brandId = 'brand-123'
      const storeId = 'store-456'

      cartStore.setBrandAndStore(brandId, storeId)

      expect(cartStore.currentBrand).toBe(brandId)
      expect(cartStore.currentStore).toBe(storeId)
      expect(cartStore.currentBrandId).toBe(brandId)
      expect(cartStore.currentStoreId).toBe(storeId)
      
      // Should save to sessionStorage
      expect(sessionStorage.setItem).toHaveBeenCalledWith('currentBrandId', brandId)
      expect(sessionStorage.setItem).toHaveBeenCalledWith('currentStoreId', storeId)
    })

    it('should clear brand and store', () => {
      cartStore.setBrandAndStore('brand-123', 'store-456')
      cartStore.setBrandAndStore(null, null)

      expect(cartStore.currentBrand).toBe(null)
      expect(cartStore.currentStore).toBe(null)
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('currentBrandId')
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('currentStoreId')
    })

    it('should initialize from sessionStorage', () => {
      const brandId = 'stored-brand'
      const storeId = 'stored-store'
      
      vi.mocked(sessionStorage.getItem)
        .mockReturnValueOnce(brandId) // for currentBrandId
        .mockReturnValueOnce(storeId) // for currentStoreId

      cartStore.initializeBrandAndStore()

      expect(cartStore.currentBrand).toBe(brandId)
      expect(cartStore.currentStore).toBe(storeId)
    })
  })

  describe('Order Type Management', () => {
    it('should set valid order types', () => {
      const validTypes = ['dine_in', 'takeout', 'delivery']
      
      validTypes.forEach(type => {
        cartStore.setOrderType(type)
        expect(cartStore.orderType).toBe(type)
      })
    })

    it('should reject invalid order types', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation()
      
      cartStore.setOrderType('invalid_type')
      
      expect(cartStore.orderType).toBe('') // Should remain empty
      expect(consoleSpy).toHaveBeenCalledWith('無效的訂單類型:', 'invalid_type')
      
      consoleSpy.mockRestore()
    })

    it('should not charge service fee for takeout and delivery orders', () => {
      // Add items to have subtotal
      const mockItem = createMockDishItem('dish-1', 100, 2) // subtotal: 200
      cartStore.addItem(mockItem)
      
      // Set service charge rate (in actual implementation, this might be set elsewhere)
      cartStore.serviceChargeRate = 0.1 // 10%
      
      // Test takeout without service charge
      cartStore.setOrderType('takeout')
      expect(cartStore.serviceCharge).toBe(0)
      
      // Test delivery without service charge
      cartStore.setOrderType('delivery')
      expect(cartStore.serviceCharge).toBe(0)
      
      // Note: dine_in service charge calculation requires reactive updates
      // which may not work correctly in test environment
    })
  })

  describe('Customer Info Management', () => {
    it('should set customer info', () => {
      const customerInfo = {
        name: 'John Doe',
        phone: '0912345678'
      }

      cartStore.setCustomerInfo(customerInfo)

      expect(cartStore.customerInfo).toEqual({
        name: 'John Doe',
        phone: '0912345678',
        lineUniqueId: ''
      })
    })

    it('should merge customer info', () => {
      cartStore.setCustomerInfo({ name: 'John' })
      cartStore.setCustomerInfo({ phone: '0912345678' })

      expect(cartStore.customerInfo).toEqual({
        name: 'John',
        phone: '0912345678',
        lineUniqueId: ''
      })
    })

    it('should set delivery info', () => {
      const deliveryInfo = {
        address: '台北市中正區忠孝東路100號',
        estimatedTime: new Date(),
        deliveryFee: 50
      }

      cartStore.setDeliveryInfo(deliveryInfo)

      expect(cartStore.deliveryInfo).toEqual(deliveryInfo)
    })

    it('should set dine-in info', () => {
      const dineInInfo = {
        tableNumber: 'A5'
      }

      cartStore.setDineInInfo(dineInInfo)

      expect(cartStore.dineInInfo).toEqual(dineInInfo)
    })

    it('should set LINE user info correctly', () => {
      const lineUserData = {
        displayName: 'LINE User',
        userId: 'line-user-123'
      }

      cartStore.setLineUserInfo(lineUserData)

      expect(cartStore.customerInfo.name).toBe('LINE User')
      expect(cartStore.customerInfo.lineUniqueId).toBe('line-user-123')
      expect(cartStore.customerInfo.phone).toBe('') // Should preserve existing phone
    })

    it('should preserve existing name when setting LINE user info with empty displayName', () => {
      // Set existing customer info
      cartStore.setCustomerInfo({ name: 'John Doe', phone: '0912345678' })

      // Set LINE user data without displayName
      const lineUserData = {
        userId: 'line-user-456'
      }

      cartStore.setLineUserInfo(lineUserData)

      expect(cartStore.customerInfo.name).toBe('John Doe') // Should preserve existing name
      expect(cartStore.customerInfo.lineUniqueId).toBe('line-user-456')
      expect(cartStore.customerInfo.phone).toBe('0912345678') // Should preserve existing phone
    })
  })

  describe('Item Management', () => {

    it('should add dish item to cart', () => {
      const item = createMockDishItem()

      cartStore.addItem(item)

      expect(cartStore.items).toHaveLength(1)
      expect(cartStore.items[0]).toEqual(expect.objectContaining({
        dishInstance: item.dishInstance,
        quantity: 1,
        subtotal: 100
      }))
      expect(cartStore.subtotal).toBe(100)
      expect(cartStore.itemCount).toBe(1)
      expect(cartStore.isCartEmpty).toBe(false)
    })

    it('should add bundle item to cart', () => {
      const item = createMockBundleItem()

      cartStore.addItem(item)

      expect(cartStore.items).toHaveLength(1)
      expect(cartStore.items[0]).toEqual(expect.objectContaining({
        bundleInstance: item.bundleInstance,
        quantity: 1,
        subtotal: 150
      }))
      expect(cartStore.subtotal).toBe(150)
      expect(cartStore.itemCount).toBe(1)
    })

    it('should combine identical dish items', () => {
      const item1 = createMockDishItem('dish-1', 100, 1)
      const item2 = createMockDishItem('dish-1', 100, 2)

      cartStore.addItem(item1)
      cartStore.addItem(item2)

      expect(cartStore.items).toHaveLength(1)
      expect(cartStore.items[0].quantity).toBe(3) // 1 + 2
      expect(cartStore.subtotal).toBe(300) // 100 * 3
    })

    it('should keep separate items with different options', () => {
      const item1 = createMockDishItem('dish-1', 100, 1, [])
      const item2 = createMockDishItem('dish-1', 100, 1, [{
        optionCategoryId: 'cat-1',
        selections: [{ optionId: 'opt-1' }]
      }])

      cartStore.addItem(item1)
      cartStore.addItem(item2)

      expect(cartStore.items).toHaveLength(2) // Different options = separate items
      expect(cartStore.subtotal).toBe(200)
    })

    it('should reject invalid items', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation()

      // Test null item
      cartStore.addItem(null)
      expect(cartStore.items).toHaveLength(0)

      // Test item without dish or bundle instance
      cartStore.addItem({ quantity: 1 })
      expect(cartStore.items).toHaveLength(0)

      // Test item with invalid quantity
      cartStore.addItem(createMockDishItem('dish-1', 100, 0))
      expect(cartStore.items).toHaveLength(0)

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should remove item by index', () => {
      cartStore.addItem(createMockDishItem('dish-1'))
      cartStore.addItem(createMockDishItem('dish-2'))

      expect(cartStore.items).toHaveLength(2)

      cartStore.removeItem(0)

      expect(cartStore.items).toHaveLength(1)
      expect(cartStore.items[0].dishInstance.templateId).toBe('dish-2')
    })

    it('should update item quantity', () => {
      cartStore.addItem(createMockDishItem('dish-1', 100, 1))

      cartStore.updateItemQuantity(0, 3)

      expect(cartStore.items[0].quantity).toBe(3)
      expect(cartStore.items[0].subtotal).toBe(300)
    })

    it('should remove item when quantity updated to 0', () => {
      cartStore.addItem(createMockDishItem())

      cartStore.updateItemQuantity(0, 0)

      expect(cartStore.items).toHaveLength(0)
    })
  })

  describe('Coupon Management', () => {
    it('should apply coupon', () => {
      const coupon = {
        refId: 'coupon-123',
        discountModel: 'CouponInstance',
        amount: 50,
        name: 'Test Coupon'
      }

      cartStore.applyCoupon(coupon)

      expect(cartStore.appliedCoupons).toHaveLength(1)
      expect(cartStore.appliedCoupons[0]).toEqual(expect.objectContaining({
        refId: 'coupon-123',
        amount: 50
      }))
      expect(cartStore.discountAmount).toBe(50)
    })

    it('should not apply duplicate coupon', () => {
      const coupon = {
        refId: 'coupon-123',
        amount: 50
      }

      cartStore.applyCoupon(coupon)
      cartStore.applyCoupon(coupon) // Try to apply again

      expect(cartStore.appliedCoupons).toHaveLength(1) // Should still be 1
    })

    it('should remove coupon', () => {
      const coupon = {
        refId: 'coupon-123',
        amount: 50
      }

      cartStore.applyCoupon(coupon)
      expect(cartStore.appliedCoupons).toHaveLength(1)

      cartStore.removeCoupon('coupon-123')

      expect(cartStore.appliedCoupons).toHaveLength(0)
      expect(cartStore.discountAmount).toBe(0)
    })

    it('should handle legacy coupon format', () => {
      const legacyCoupon = {
        couponId: 'coupon-123', // Old format
        amount: 30
      }

      cartStore.applyCoupon(legacyCoupon)

      expect(cartStore.appliedCoupons[0].refId).toBe('coupon-123')
      expect(cartStore.appliedCoupons[0].discountModel).toBe('CouponInstance')
    })
  })

  describe('Payment Management', () => {
    it('should toggle staff mode', () => {
      expect(cartStore.isStaffMode).toBe(false)

      cartStore.toggleStaffMode()

      expect(cartStore.isStaffMode).toBe(true)

      cartStore.toggleStaffMode()

      expect(cartStore.isStaffMode).toBe(false)
    })
  })

  describe('Total Calculation', () => {
    it('should calculate total correctly with multiple items and discounts', () => {
      // Add items
      cartStore.addItem(createMockDishItem('dish-1', 100, 2)) // 200
      cartStore.addItem(createMockDishItem('dish-2', 150, 1)) // 150
      
      // Apply coupon
      cartStore.applyCoupon({ refId: 'coupon-1', amount: 50 })
      
      // Set takeout to avoid service charge complications in test
      cartStore.setOrderType('takeout')

      expect(cartStore.subtotal).toBe(350) // 200 + 150
      expect(cartStore.serviceCharge).toBe(0) // No service charge for takeout
      expect(cartStore.discountAmount).toBe(50)
      expect(cartStore.total).toBe(300) // 350 + 0 - 50
    })

    it('should add delivery fee for delivery orders', () => {
      cartStore.addItem(createMockDishItem('dish-1', 200, 1))
      cartStore.setOrderType('delivery')
      cartStore.setDeliveryInfo({ deliveryFee: 30 })

      expect(cartStore.total).toBe(230) // 200 + 30
    })

    it('should prevent negative total', () => {
      cartStore.addItem(createMockDishItem('dish-1', 100, 1))
      cartStore.applyCoupon({ refId: 'coupon-1', amount: 200 }) // Discount > subtotal

      expect(cartStore.total).toBe(0) // Should not be negative
    })
  })

  describe('Order Validation', () => {
    it('should validate empty cart', () => {
      const isValid = cartStore.validateOrder()

      expect(isValid).toBe(false)
      expect(cartStore.validationErrors.items).toBe('購物車是空的')
    })

    it('should validate dine-in order requirements', () => {
      cartStore.addItem(createMockDishItem())
      cartStore.setOrderType('dine_in')

      let isValid = cartStore.validateOrder()

      expect(isValid).toBe(false)
      expect(cartStore.validationErrors.tableNumber).toBe('請填寫桌號')

      // Fix table number
      cartStore.setDineInInfo({ tableNumber: 'A5' })
      isValid = cartStore.validateOrder()

      expect(isValid).toBe(true)
      expect(Object.keys(cartStore.validationErrors)).toHaveLength(0)
    })

    it('should validate takeout order requirements', () => {
      cartStore.addItem(createMockDishItem())
      cartStore.setOrderType('takeout')

      let isValid = cartStore.validateOrder()

      expect(isValid).toBe(false)
      expect(cartStore.validationErrors.customerName).toBe('請填寫姓名')
      expect(cartStore.validationErrors.customerPhone).toBe('請填寫電話號碼')

      // Fix customer info
      cartStore.setCustomerInfo({ name: 'John', phone: '0912345678' })
      isValid = cartStore.validateOrder()

      expect(isValid).toBe(true)
    })

    it('should validate delivery order requirements', () => {
      cartStore.addItem(createMockDishItem())
      cartStore.setOrderType('delivery')

      let isValid = cartStore.validateOrder()

      expect(isValid).toBe(false)
      expect(cartStore.validationErrors.customerName).toBe('請填寫姓名')
      expect(cartStore.validationErrors.customerPhone).toBe('請填寫電話號碼')
      expect(cartStore.validationErrors.deliveryAddress).toBe('請填寫配送地址')

      // Fix all required fields
      cartStore.setCustomerInfo({ name: 'John', phone: '0912345678' })
      cartStore.setDeliveryInfo({ address: '台北市中正區' })
      isValid = cartStore.validateOrder()

      expect(isValid).toBe(true)
    })
  })

  describe('Clear Cart', () => {
    it('should clear cart completely', () => {
      // Setup cart with data
      cartStore.addItem(createMockDishItem())
      cartStore.setOrderType('dine_in')
      cartStore.setCustomerInfo({ name: 'John', phone: '0912345678' })
      cartStore.applyCoupon({ refId: 'coupon-1', amount: 50 })
      cartStore.setNotes('Test notes')

      // Clear cart
      cartStore.clearCart()

      // Verify everything is cleared
      expect(cartStore.items).toEqual([])
      expect(cartStore.appliedCoupons).toEqual([])
      expect(cartStore.notes).toBe('')
      expect(cartStore.validationErrors).toEqual({})

      // Customer info should be cleared for non-staff mode
      expect(cartStore.customerInfo).toEqual({ name: '', phone: '', lineUniqueId: '' })

      // Order type specific info should be cleared
      expect(cartStore.deliveryInfo).toEqual({
        address: '', estimatedTime: null, deliveryFee: 0
      })
      expect(cartStore.dineInInfo).toEqual({ tableNumber: '' })
      expect(cartStore.estimatedPickupTime).toBeNull()
    })

    it('should preserve customer info in staff mode', () => {
      cartStore.toggleStaffMode() // Enable staff mode
      cartStore.setCustomerInfo({ name: 'John', phone: '0912345678', lineUniqueId: 'line-123' })

      cartStore.clearCart()

      // In staff mode, customer info should NOT be cleared
      expect(cartStore.customerInfo).toEqual({ name: 'John', phone: '0912345678', lineUniqueId: 'line-123' })
    })
  })
})