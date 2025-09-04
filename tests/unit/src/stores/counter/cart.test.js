import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCounterCartStore } from '@/stores/counter/cart.js'

// Mock API 模組
vi.mock('@/api', () => ({
  default: {
    orderCustomer: {
      createOrder: vi.fn()
    }
  }
}))

// Mock utils 模組
vi.mock('@/stores/counter/utils.js', () => ({
  generateItemKey: vi.fn((templateId, options, note) => `${templateId}:${options?.length || 0}:${note || ''}`),
  generateBundleKey: vi.fn((bundleId, note) => `bundle:${bundleId}:${note || ''}`),
  generateUniqueItemId: vi.fn(() => 'mock_unique_id_123')
}))

// Mock confirm 函數
global.confirm = vi.fn()

describe('Counter Cart Store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useCounterCartStore()
    vi.clearAllMocks()
  })

  describe('初始狀態', () => {
    it('應該有正確的初始狀態', () => {
      expect(store.cart).toEqual([])
      expect(store.currentItem).toBeNull()
      expect(store.currentItemIndex).toBeNull()
      expect(store.manualAdjustment).toBe(0)
      expect(store.totalDiscount).toBe(0)
      expect(store.isCheckingOut).toBe(false)
      expect(store.isEditMode).toBe(false)
    })

    it('初始小計和總計應為 0', () => {
      expect(store.subtotal).toBe(0)
      expect(store.total).toBe(0)
    })
  })

  describe('添加菜品到購物車', () => {
    const mockDishTemplate = {
      _id: 'dish123',
      name: '測試菜品',
      basePrice: 100
    }

    it('應該能添加簡單菜品到購物車', () => {
      store.addDishToCart(mockDishTemplate, [], '測試備註')

      expect(store.cart).toHaveLength(1)
      expect(store.cart[0]).toMatchObject({
        id: 'mock_unique_id_123',
        dishInstance: {
          templateId: 'dish123',
          name: '測試菜品',
          basePrice: 100,
          finalPrice: 100
        },
        quantity: 1,
        note: '測試備註',
        subtotal: 100
      })
    })

    it('應該能添加有選項的菜品到購物車', () => {
      const options = [{
        selections: [{ price: 30 }, { price: 20 }]
      }]

      store.addDishToCart(mockDishTemplate, options, '')

      expect(store.cart[0].dishInstance.finalPrice).toBe(150) // 100 + 30 + 20
      expect(store.cart[0].subtotal).toBe(150)
    })

    it('快速添加菜品應該添加項目到購物車', () => {
      const defaultOptions = [{ selections: [{ price: 10 }] }]

      store.quickAddDishToCart(mockDishTemplate, defaultOptions)

      expect(store.cart).toHaveLength(1)
      expect(store.cart[0].dishInstance.templateId).toBe('dish123')
      expect(store.cart[0].dishInstance.finalPrice).toBe(110) // 100 + 10
    })
  })

  describe('添加套餐到購物車', () => {
    const mockBundle = {
      _id: 'bundle123',
      name: '測試套餐',
      sellingPrice: 200,
      originalPrice: 300,
      sellingPoint: 50,
      originalPoint: 100,
      bundleItems: []
    }

    it('應該能添加套餐到購物車', () => {
      store.addBundleToCart(mockBundle, '套餐備註')

      expect(store.cart).toHaveLength(1)
      expect(store.cart[0]).toMatchObject({
        id: 'mock_unique_id_123',
        bundleInstance: {
          bundleId: 'bundle123',
          name: '測試套餐',
          sellingPrice: 200,
          originalPrice: 300,
          sellingPoint: 50,
          originalPoint: 100
        },
        quantity: 1,
        note: '套餐備註',
        subtotal: 200
      })
    })

    it('套餐價格為 undefined 時應設為 0', () => {
      const bundleWithoutPrice = { ...mockBundle, sellingPrice: undefined }
      store.addBundleToCart(bundleWithoutPrice, '')

      expect(store.cart[0].subtotal).toBe(0)
      expect(store.cart[0].bundleInstance.sellingPrice).toBe(0)
    })
  })

  describe('購物車項目管理', () => {
    beforeEach(() => {
      // 添加測試項目
      const mockDish = { _id: 'dish1', name: '菜品1', basePrice: 100 }
      store.addDishToCart(mockDish, [], '')
      store.addDishToCart(mockDish, [], '')
    })

    it('應該能移除指定索引的項目', () => {
      expect(store.cart).toHaveLength(2)

      store.removeFromCart(0)

      expect(store.cart).toHaveLength(1)
      expect(store.cart[0].dishInstance.name).toBe('菜品1')
    })

    it('移除項目時應處理索引邊界', () => {
      store.removeFromCart(5) // 超出範圍
      expect(store.cart).toHaveLength(2)

      store.removeFromCart(-1) // 負數索引
      expect(store.cart).toHaveLength(2)
    })

    it('移除當前編輯項目時應清空當前項目狀態', () => {
      store.selectCurrentItem(store.cart[0], 0)
      expect(store.currentItemIndex).toBe(0)

      store.removeFromCart(0)

      expect(store.currentItem).toBeNull()
      expect(store.currentItemIndex).toBeNull()
      expect(store.isEditMode).toBe(false)
    })

    it('移除非當前編輯項目時應調整索引', () => {
      store.selectCurrentItem(store.cart[1], 1)
      store.removeFromCart(0)

      expect(store.currentItemIndex).toBe(0) // 應該從 1 調整為 0
    })
  })

  describe('數量更新', () => {
    beforeEach(() => {
      const mockDish = { _id: 'dish1', name: '菜品1', basePrice: 100 }
      store.addDishToCart(mockDish, [], '')
    })

    it('應該能增加數量', () => {
      store.updateQuantity(0, 1)

      expect(store.cart[0].quantity).toBe(2)
      expect(store.cart[0].subtotal).toBe(200) // 100 * 2
    })

    it('應該能減少數量', () => {
      store.cart[0].quantity = 3
      store.cart[0].subtotal = 300

      store.updateQuantity(0, -1)

      expect(store.cart[0].quantity).toBe(2)
      expect(store.cart[0].subtotal).toBe(200)
    })

    it('數量減到 0 或以下時應移除項目', () => {
      store.updateQuantity(0, -1) // 1 - 1 = 0

      expect(store.cart).toHaveLength(0)
    })

    it('應該處理無效索引', () => {
      const originalCart = [...store.cart]

      store.updateQuantity(5, 1) // 無效索引
      store.updateQuantity(-1, 1) // 負索引

      expect(store.cart).toEqual(originalCart)
    })
  })

  describe('當前項目編輯', () => {
    beforeEach(() => {
      const mockDish = { _id: 'dish1', name: '菜品1', basePrice: 100 }
      store.addDishToCart(mockDish, [], '')
    })

    it('應該能選擇當前編輯項目', () => {
      const item = store.cart[0]

      store.selectCurrentItem(item, 0)

      expect(store.currentItem).toEqual(item)
      expect(store.currentItemIndex).toBe(0)
      expect(store.isEditMode).toBe(true)
    })

    it('應該能清空當前項目', () => {
      store.selectCurrentItem(store.cart[0], 0)
      
      store.clearCurrentItem()

      expect(store.currentItem).toBeNull()
      expect(store.currentItemIndex).toBeNull()
      expect(store.isEditMode).toBe(false)
    })

    it('應該能更新當前項目', () => {
      store.selectCurrentItem(store.cart[0], 0)
      const updatedItem = { ...store.cart[0], note: '更新備註' }

      store.updateCurrentItem(updatedItem)

      expect(store.cart[0].note).toBe('更新備註')
      expect(store.currentItem).toBeNull()
      expect(store.currentItemIndex).toBeNull()
    })

    it('當前項目索引為 null 時不應更新', () => {
      const originalCart = [...store.cart]
      const updatedItem = { ...store.cart[0], note: '不應更新' }

      store.updateCurrentItem(updatedItem)

      expect(store.cart).toEqual(originalCart)
    })
  })

  describe('價格調整', () => {
    beforeEach(() => {
      const mockDish = { _id: 'dish1', name: '菜品1', basePrice: 100 }
      store.addDishToCart(mockDish, [], '')
    })

    it('應該能設置手動調帳', () => {
      store.setManualAdjustment(-10)

      expect(store.manualAdjustment).toBe(-10)
      expect(store.total).toBe(90) // 100 - 10
    })

    it('應該能設置總折扣', () => {
      store.setTotalDiscount(20)

      expect(store.totalDiscount).toBe(20)
      expect(store.total).toBe(80) // 100 - 20
    })

    it('總計不應低於 0', () => {
      store.setTotalDiscount(200) // 超過小計

      expect(store.total).toBe(0)
    })

    it('應該結合手動調帳和折扣計算總計', () => {
      store.setManualAdjustment(50)
      store.setTotalDiscount(30)

      expect(store.total).toBe(120) // 100 + 50 - 30
    })
  })

  describe('計算屬性', () => {
    it('應該正確計算小計', () => {
      const dish1 = { _id: 'dish1', name: '菜品1', basePrice: 100 }
      const dish2 = { _id: 'dish2', name: '菜品2', basePrice: 200 }

      store.addDishToCart(dish1, [], '')
      store.addDishToCart(dish2, [], '')

      expect(store.subtotal).toBe(300)
    })

    it('空購物車的小計應為 0', () => {
      expect(store.subtotal).toBe(0)
    })

    it('應該正確計算總計', () => {
      const dish = { _id: 'dish1', name: '菜品1', basePrice: 100 }
      store.addDishToCart(dish, [], '')
      store.setManualAdjustment(20)
      store.setTotalDiscount(30)

      expect(store.total).toBe(90) // 100 + 20 - 30
    })
  })

  describe('購物車清理', () => {
    beforeEach(() => {
      const mockDish = { _id: 'dish1', name: '菜品1', basePrice: 100 }
      store.addDishToCart(mockDish, [], '')
      store.selectCurrentItem(store.cart[0], 0)
      store.setManualAdjustment(50)
      store.setTotalDiscount(20)
    })

    it('應該能清空購物車', () => {
      store.clearCart()

      expect(store.cart).toEqual([])
      expect(store.currentItem).toBeNull()
      expect(store.currentItemIndex).toBeNull()
      expect(store.manualAdjustment).toBe(0)
      expect(store.totalDiscount).toBe(0)
      expect(store.isEditMode).toBe(false)
    })

    it('用戶確認時應該取消訂單', () => {
      global.confirm.mockReturnValue(true)

      store.cancelOrder()

      expect(store.cart).toEqual([])
      expect(global.confirm).toHaveBeenCalledWith('確定要取消當前訂單嗎？')
    })

    it('用戶取消時不應清空購物車', () => {
      global.confirm.mockReturnValue(false)
      const originalCartLength = store.cart.length

      store.cancelOrder()

      expect(store.cart).toHaveLength(originalCartLength)
    })
  })

  describe('項目合併', () => {
    it('應該合併相同配置的菜品項目', () => {
      const mockItems = [
        {
          key: 'dish1:0:',
          dishInstance: {
            templateId: 'dish1',
            name: '菜品1',
            basePrice: 100,
            finalPrice: 100,
            options: []
          },
          quantity: 2,
          subtotal: 200,
          note: ''
        },
        {
          key: 'dish1:0:',
          dishInstance: {
            templateId: 'dish1',
            name: '菜品1',
            basePrice: 100,
            finalPrice: 100,
            options: []
          },
          quantity: 1,
          subtotal: 100,
          note: ''
        }
      ]

      const merged = store.mergeCartItems(mockItems)

      expect(merged).toHaveLength(1)
      expect(merged[0]).toMatchObject({
        itemType: 'dish',
        templateId: 'dish1',
        name: '菜品1',
        quantity: 3,
        subtotal: 300
      })
    })

    it('應該合併相同配置的套餐項目', () => {
      const mockItems = [
        {
          key: 'bundle:bundle1:',
          bundleInstance: {
            bundleId: 'bundle1',
            name: '套餐1',
            sellingPrice: 200
          },
          quantity: 1,
          subtotal: 200,
          note: ''
        },
        {
          key: 'bundle:bundle1:',
          bundleInstance: {
            bundleId: 'bundle1',
            name: '套餐1',
            sellingPrice: 200
          },
          quantity: 2,
          subtotal: 400,
          note: ''
        }
      ]

      const merged = store.mergeCartItems(mockItems)

      expect(merged).toHaveLength(1)
      expect(merged[0]).toMatchObject({
        itemType: 'bundle',
        bundleId: 'bundle1',
        name: '套餐1',
        quantity: 3,
        subtotal: 600
      })
    })

    it('不同配置的項目不應合併', () => {
      const mockItems = [
        {
          key: 'dish1:0:',
          dishInstance: { templateId: 'dish1', name: '菜品1' },
          quantity: 1,
          subtotal: 100
        },
        {
          key: 'dish1:1:備註',
          dishInstance: { templateId: 'dish1', name: '菜品1' },
          quantity: 1,
          subtotal: 100
        }
      ]

      const merged = store.mergeCartItems(mockItems)

      expect(merged).toHaveLength(2)
    })
  })

  describe('結帳功能', () => {
    const mockApi = vi.hoisted(() => ({
      orderCustomer: {
        createOrder: vi.fn()
      }
    }))

    beforeEach(async () => {
      const { default: api } = await import('@/api')
      vi.mocked(api.orderCustomer.createOrder).mockImplementation(mockApi.orderCustomer.createOrder)
    })

    beforeEach(() => {
      const mockDish = { _id: 'dish1', name: '菜品1', basePrice: 100 }
      store.addDishToCart(mockDish, [], '')
    })

    it('應該拒絕空購物車結帳', async () => {
      store.clearCart()

      await expect(store.checkout('dine_in', {}, 'brand1', 'store1'))
        .rejects.toThrow('購物車是空的')
    })

    it('應該成功提交訂單', async () => {
      const mockResponse = {
        success: true,
        order: { id: 'order123', total: 100 }
      }
      mockApi.orderCustomer.createOrder.mockResolvedValue(mockResponse)

      const result = await store.checkout('takeout', { name: '顧客' }, 'brand1', 'store1')

      expect(mockApi.orderCustomer.createOrder).toHaveBeenCalledWith({
        brandId: 'brand1',
        storeId: 'store1',
        orderData: expect.objectContaining({
          orderType: 'takeout',
          paymentType: 'On-site',
          items: expect.any(Array),
          customerInfo: { name: '顧客' }
        })
      })
      expect(result).toEqual(mockResponse.order)
      expect(store.cart).toHaveLength(0) // 購物車應被清空
    })

    it('應該處理內用訂單的桌號資訊', async () => {
      const mockResponse = { success: true, order: {} }
      mockApi.orderCustomer.createOrder.mockResolvedValue(mockResponse)

      await store.checkout('dine_in', { tableNumber: '5' }, 'brand1', 'store1')

      expect(mockApi.orderCustomer.createOrder).toHaveBeenCalledWith({
        brandId: 'brand1',
        storeId: 'store1',
        orderData: expect.objectContaining({
          orderType: 'dine_in',
          dineInInfo: { tableNumber: '5' }
        })
      })
    })

    it('應該包含調帳和折扣資訊', async () => {
      const mockResponse = { success: true, order: {} }
      mockApi.orderCustomer.createOrder.mockResolvedValue(mockResponse)
      
      store.setManualAdjustment(30)
      store.setTotalDiscount(20)

      await store.checkout('takeout', {}, 'brand1', 'store1')

      expect(mockApi.orderCustomer.createOrder).toHaveBeenCalledWith({
        brandId: 'brand1',
        storeId: 'store1',
        orderData: expect.objectContaining({
          manualAdjustment: 30,
          discounts: [{ amount: 20 }]
        })
      })
    })

    it('應該處理 API 錯誤', async () => {
      mockApi.orderCustomer.createOrder.mockRejectedValue(new Error('網路錯誤'))

      await expect(store.checkout('takeout', {}, 'brand1', 'store1'))
        .rejects.toThrow('網路錯誤')
      
      expect(store.isCheckingOut).toBe(false)
    })

    it('應該處理 API 回應失敗', async () => {
      const mockResponse = {
        success: false,
        message: '庫存不足'
      }
      mockApi.orderCustomer.createOrder.mockResolvedValue(mockResponse)

      await expect(store.checkout('takeout', {}, 'brand1', 'store1'))
        .rejects.toThrow('庫存不足')
    })

    it('結帳過程中應設置 loading 狀態', async () => {
      let checkingOutDuringCall = false
      mockApi.orderCustomer.createOrder.mockImplementation(async () => {
        checkingOutDuringCall = store.isCheckingOut
        return { success: true, order: {} }
      })

      expect(store.isCheckingOut).toBe(false)

      await store.checkout('takeout', {}, 'brand1', 'store1')

      expect(checkingOutDuringCall).toBe(true)
      expect(store.isCheckingOut).toBe(false)
    })

    it('應該執行成功回調函數', async () => {
      const mockResponse = { success: true, order: {} }
      const onSuccess = vi.fn()
      mockApi.orderCustomer.createOrder.mockResolvedValue(mockResponse)

      await store.checkout('takeout', {}, 'brand1', 'store1', onSuccess)

      expect(onSuccess).toHaveBeenCalled()
    })
  })
})