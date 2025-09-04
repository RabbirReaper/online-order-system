import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useMenuStore } from '@/stores/menu'

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

describe('menu Store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useMenuStore()
    vi.clearAllMocks()
    window.sessionStorage.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('初始狀態', () => {
    it('should have correct initial state', () => {
      expect(store.currentMenuType).toBe('food')
      expect(store.brandId).toBe(null)
      expect(store.storeId).toBe(null)
    })

    it('should have correct initial computed values', () => {
      expect(store.menuTypeText).toBe('餐點菜單')
      expect(store.requiresAuth).toBe(false)
    })
  })

  describe('setMenuType', () => {
    it('should set menu type correctly', () => {
      store.setMenuType('cash_coupon')
      
      expect(store.currentMenuType).toBe('cash_coupon')
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
        'menuState',
        JSON.stringify({
          currentMenuType: 'cash_coupon',
          brandId: null,
          storeId: null
        })
      )
    })

    it('should update menuTypeText when changing menu type', () => {
      store.setMenuType('cash_coupon')
      expect(store.menuTypeText).toBe('預購券')

      store.setMenuType('point_exchange')
      expect(store.menuTypeText).toBe('點數兌換')

      store.setMenuType('food')
      expect(store.menuTypeText).toBe('餐點菜單')
    })

    it('should return original value for unknown menu type', () => {
      store.setMenuType('unknown_type')
      expect(store.menuTypeText).toBe('unknown_type')
    })

    it('should update requiresAuth when changing menu type', () => {
      // food type should not require auth
      store.setMenuType('food')
      expect(store.requiresAuth).toBe(false)

      // cash_coupon should require auth
      store.setMenuType('cash_coupon')
      expect(store.requiresAuth).toBe(true)

      // point_exchange should require auth
      store.setMenuType('point_exchange')
      expect(store.requiresAuth).toBe(true)
    })
  })

  describe('setBrandAndStore', () => {
    it('should set brand and store correctly', () => {
      const brandId = 'brand123'
      const storeId = 'store456'

      store.setBrandAndStore(brandId, storeId)

      expect(store.brandId).toBe(brandId)
      expect(store.storeId).toBe(storeId)
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
        'menuState',
        JSON.stringify({
          currentMenuType: 'food',
          brandId: brandId,
          storeId: storeId
        })
      )
    })

    it('should handle null values', () => {
      store.setBrandAndStore(null, null)

      expect(store.brandId).toBe(null)
      expect(store.storeId).toBe(null)
    })

    it('should update existing brand and store', () => {
      // Set initial values
      store.setBrandAndStore('brand1', 'store1')
      expect(store.brandId).toBe('brand1')
      expect(store.storeId).toBe('store1')

      // Update values
      store.setBrandAndStore('brand2', 'store2')
      expect(store.brandId).toBe('brand2')
      expect(store.storeId).toBe('store2')
    })
  })

  describe('persistState', () => {
    it('should persist current state to sessionStorage', () => {
      store.setMenuType('cash_coupon')
      store.setBrandAndStore('brand123', 'store456')

      // Clear previous calls
      vi.clearAllMocks()
      
      store.persistState()

      expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
        'menuState',
        JSON.stringify({
          currentMenuType: 'cash_coupon',
          brandId: 'brand123',
          storeId: 'store456'
        })
      )
    })

    it('should handle sessionStorage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      window.sessionStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      expect(() => store.persistState()).not.toThrow()
      expect(consoleSpy).toHaveBeenCalledWith('持久化菜單狀態失敗:', expect.any(Error))

      consoleSpy.mockRestore()
    })
  })

  describe('restoreState', () => {
    it('should restore state from sessionStorage', () => {
      const savedState = {
        currentMenuType: 'point_exchange',
        brandId: 'brand789',
        storeId: 'store012'
      }

      window.sessionStorage.getItem.mockReturnValue(JSON.stringify(savedState))

      store.restoreState()

      expect(store.currentMenuType).toBe('point_exchange')
      expect(store.brandId).toBe('brand789')
      expect(store.storeId).toBe('store012')
      expect(window.sessionStorage.getItem).toHaveBeenCalledWith('menuState')
    })

    it('should handle missing sessionStorage data', () => {
      window.sessionStorage.getItem.mockReturnValue(null)

      store.restoreState()

      // Should maintain default values
      expect(store.currentMenuType).toBe('food')
      expect(store.brandId).toBe(null)
      expect(store.storeId).toBe(null)
    })

    it('should handle partial state restoration', () => {
      const partialState = {
        currentMenuType: 'cash_coupon'
        // Missing brandId and storeId
      }

      window.sessionStorage.getItem.mockReturnValue(JSON.stringify(partialState))

      store.restoreState()

      expect(store.currentMenuType).toBe('cash_coupon')
      expect(store.brandId).toBe(undefined) // Will be undefined from JSON
      expect(store.storeId).toBe(undefined)
    })

    it('should handle invalid JSON gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      window.sessionStorage.getItem.mockReturnValue('invalid json')

      expect(() => store.restoreState()).not.toThrow()
      expect(consoleSpy).toHaveBeenCalledWith('恢復菜單狀態失敗:', expect.any(Error))

      consoleSpy.mockRestore()
    })

    it('should use default menuType when restored value is invalid', () => {
      const savedState = {
        currentMenuType: null,
        brandId: 'brand123',
        storeId: 'store456'
      }

      window.sessionStorage.getItem.mockReturnValue(JSON.stringify(savedState))

      store.restoreState()

      expect(store.currentMenuType).toBe('food') // Default fallback
      expect(store.brandId).toBe('brand123')
      expect(store.storeId).toBe('store456')
    })

    it('should handle sessionStorage access errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      window.sessionStorage.getItem.mockImplementation(() => {
        throw new Error('Storage access error')
      })

      expect(() => store.restoreState()).not.toThrow()
      expect(consoleSpy).toHaveBeenCalledWith('恢復菜單狀態失敗:', expect.any(Error))

      consoleSpy.mockRestore()
    })
  })

  describe('clearState', () => {
    it('should clear all state to default values', () => {
      // Set some values first
      store.setMenuType('cash_coupon')
      store.setBrandAndStore('brand123', 'store456')

      store.clearState()

      expect(store.currentMenuType).toBe('food')
      expect(store.brandId).toBe(null)
      expect(store.storeId).toBe(null)
      expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('menuState')
    })

    it('should handle sessionStorage removal errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      window.sessionStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage removal error')
      })

      expect(() => store.clearState()).not.toThrow()
      expect(consoleSpy).toHaveBeenCalledWith('清除菜單狀態失敗:', expect.any(Error))

      // State should still be cleared even if storage fails
      expect(store.currentMenuType).toBe('food')
      expect(store.brandId).toBe(null)
      expect(store.storeId).toBe(null)

      consoleSpy.mockRestore()
    })
  })

  describe('computed properties integration', () => {
    it('should correctly compute menuTypeText for all valid types', () => {
      const typeTests = [
        { type: 'food', expected: '餐點菜單' },
        { type: 'cash_coupon', expected: '預購券' },
        { type: 'point_exchange', expected: '點數兌換' }
      ]

      typeTests.forEach(({ type, expected }) => {
        store.setMenuType(type)
        expect(store.menuTypeText).toBe(expected)
      })
    })

    it('should correctly compute requiresAuth for all types', () => {
      const authTests = [
        { type: 'food', requiresAuth: false },
        { type: 'cash_coupon', requiresAuth: true },
        { type: 'point_exchange', requiresAuth: true }
      ]

      authTests.forEach(({ type, requiresAuth }) => {
        store.setMenuType(type)
        expect(store.requiresAuth).toBe(requiresAuth)
      })
    })
  })

  describe('複合操作測試', () => {
    it('should handle complex state changes correctly', () => {
      // Initial state
      expect(store.currentMenuType).toBe('food')
      expect(store.requiresAuth).toBe(false)

      // Change to auth-required type
      store.setMenuType('cash_coupon')
      store.setBrandAndStore('brand123', 'store456')

      expect(store.currentMenuType).toBe('cash_coupon')
      expect(store.requiresAuth).toBe(true)
      expect(store.menuTypeText).toBe('預購券')
      expect(store.brandId).toBe('brand123')
      expect(store.storeId).toBe('store456')

      // Clear and verify
      store.clearState()
      expect(store.currentMenuType).toBe('food')
      expect(store.requiresAuth).toBe(false)
      expect(store.menuTypeText).toBe('餐點菜單')
      expect(store.brandId).toBe(null)
      expect(store.storeId).toBe(null)
    })

    it('should maintain data consistency across operations', () => {
      // Set complex state
      store.setMenuType('point_exchange')
      store.setBrandAndStore('brand999', 'store888')

      // Verify state persistence calls
      expect(window.sessionStorage.setItem).toHaveBeenCalledTimes(2)
      
      // Change only menu type
      store.setMenuType('food')
      
      // Brand and store should remain unchanged
      expect(store.brandId).toBe('brand999')
      expect(store.storeId).toBe('store888')
      expect(store.requiresAuth).toBe(false) // But auth requirement should change
    })
  })
})