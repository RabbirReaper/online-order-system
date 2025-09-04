import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCounterModalsStore } from '@/stores/counter/modals.js'

describe('Counter Modals Store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useCounterModalsStore()
    vi.clearAllMocks()
  })

  describe('初始狀態', () => {
    it('應該有正確的初始狀態', () => {
      expect(store.modals).toBeDefined()
      expect(store.modals.adjustment).toBeDefined()
      expect(store.modals.checkout).toBeDefined()
      expect(store.modals.cashCalculator).toBeDefined()
      expect(store.modals.tableNumber).toBeDefined()
    })

    it('所有模態框初始應該是關閉狀態', () => {
      expect(store.modals.adjustment.show).toBe(false)
      expect(store.modals.checkout.show).toBe(false)
      expect(store.modals.cashCalculator.show).toBe(false)
      expect(store.modals.tableNumber.show).toBe(false)
    })

    it('調帳模態框應該有正確的初始狀態', () => {
      expect(store.modals.adjustment.tempAdjustment).toBe(0)
      expect(store.modals.adjustment.adjustmentType).toBe('add')
      expect(store.modals.adjustment.editingOrder).toBeNull()
    })

    it('結帳模態框應該有正確的初始狀態', () => {
      expect(store.modals.checkout.total).toBe(0)
      expect(store.modals.checkout.orderId).toBeNull()
    })

    it('現金計算器模態框應該有正確的初始狀態', () => {
      expect(store.modals.cashCalculator.total).toBe(0)
    })
  })

  describe('調帳模態框管理', () => {
    it('應該能開啟調帳模態框（新增調帳）', () => {
      store.openAdjustmentModal()

      expect(store.modals.adjustment.show).toBe(true)
      expect(store.modals.adjustment.editingOrder).toBeNull()
      expect(store.modals.adjustment.tempAdjustment).toBe(0)
      expect(store.modals.adjustment.adjustmentType).toBe('add')
    })

    it('應該能開啟調帳模態框（有現有調帳）', () => {
      store.openAdjustmentModal(null, -50)

      expect(store.modals.adjustment.show).toBe(true)
      expect(store.modals.adjustment.tempAdjustment).toBe(50)
      expect(store.modals.adjustment.adjustmentType).toBe('subtract')
    })

    it('應該能開啟調帳模態框（編輯訂單調帳）', () => {
      const mockOrder = {
        id: 'order-123',
        manualAdjustment: -30
      }

      store.openAdjustmentModal(mockOrder)

      expect(store.modals.adjustment.show).toBe(true)
      expect(store.modals.adjustment.editingOrder).toEqual(mockOrder)
      expect(store.modals.adjustment.tempAdjustment).toBe(30)
      expect(store.modals.adjustment.adjustmentType).toBe('subtract')
    })

    it('應該能處理訂單調帳為正數', () => {
      const mockOrder = {
        id: 'order-456',
        manualAdjustment: 25
      }

      store.openAdjustmentModal(mockOrder)

      expect(store.modals.adjustment.tempAdjustment).toBe(25)
      expect(store.modals.adjustment.adjustmentType).toBe('add')
    })

    it('應該能處理訂單沒有調帳的情況', () => {
      const mockOrder = {
        id: 'order-789'
      }

      store.openAdjustmentModal(mockOrder)

      expect(store.modals.adjustment.tempAdjustment).toBe(0)
      expect(store.modals.adjustment.adjustmentType).toBe('add')
    })

    it('應該能關閉調帳模態框並重置狀態', () => {
      const mockOrder = { id: 'order-123', manualAdjustment: 10 }
      store.openAdjustmentModal(mockOrder)
      
      store.closeModal('adjustment')

      expect(store.modals.adjustment.show).toBe(false)
      expect(store.modals.adjustment.editingOrder).toBeNull()
      expect(store.modals.adjustment.tempAdjustment).toBe(0)
    })
  })

  describe('調帳計算功能', () => {
    it('應該能設定調帳類型', () => {
      store.setAdjustmentType('subtract')

      expect(store.modals.adjustment.adjustmentType).toBe('subtract')
      expect(store.modals.adjustment.tempAdjustment).toBe(0)
    })

    it('應該能輸入數字到調帳金額', () => {
      store.modals.adjustment.tempAdjustment = 12
      
      store.appendToAdjustment('3')

      expect(store.modals.adjustment.tempAdjustment).toBe(123)
    })

    it('應該能處理從0開始輸入數字', () => {
      store.appendToAdjustment('5')

      expect(store.modals.adjustment.tempAdjustment).toBe(5)
    })

    it('應該能連續輸入多個數字', () => {
      store.appendToAdjustment('1')
      store.appendToAdjustment('2')
      store.appendToAdjustment('3')

      expect(store.modals.adjustment.tempAdjustment).toBe(123)
    })

    it('應該能清除調帳金額', () => {
      store.modals.adjustment.tempAdjustment = 100
      
      store.clearAdjustment()

      expect(store.modals.adjustment.tempAdjustment).toBe(0)
    })

    it('輸入數字應該轉換為整數', () => {
      store.appendToAdjustment('7')
      store.appendToAdjustment('8')

      expect(store.modals.adjustment.tempAdjustment).toBe(78)
      expect(typeof store.modals.adjustment.tempAdjustment).toBe('number')
    })
  })

  describe('結帳模態框管理', () => {
    it('應該能開啟結帳模態框', () => {
      const orderId = 'order-123'
      const total = 150

      store.openCheckoutModal(orderId, total)

      expect(store.modals.checkout.show).toBe(true)
      expect(store.modals.checkout.orderId).toBe(orderId)
      expect(store.modals.checkout.total).toBe(total)
    })

    it('應該能關閉結帳模態框並重置狀態', () => {
      store.openCheckoutModal('order-456', 200)
      
      store.closeModal('checkout')

      expect(store.modals.checkout.show).toBe(false)
      expect(store.modals.checkout.orderId).toBeNull()
      expect(store.modals.checkout.total).toBe(0)
    })
  })

  describe('現金計算器模態框管理', () => {
    it('應該能開啟現金計算器模態框', () => {
      const total = 350

      store.openCashCalculatorModal(total)

      expect(store.modals.cashCalculator.show).toBe(true)
      expect(store.modals.cashCalculator.total).toBe(total)
    })

    it('應該能關閉現金計算器模態框', () => {
      store.openCashCalculatorModal(100)
      
      store.closeModal('cashCalculator')

      expect(store.modals.cashCalculator.show).toBe(false)
    })
  })

  describe('桌號模態框管理', () => {
    it('應該能開啟桌號模態框', () => {
      store.openTableNumberModal()

      expect(store.modals.tableNumber.show).toBe(true)
    })

    it('應該能關閉桌號模態框', () => {
      store.openTableNumberModal()
      
      store.closeModal('tableNumber')

      expect(store.modals.tableNumber.show).toBe(false)
    })
  })

  describe('通用模態框關閉', () => {
    it('應該能處理不存在的模態框名稱', () => {
      // 不應該拋出錯誤
      expect(() => {
        store.closeModal('nonExistent')
      }).not.toThrow()
    })

    it('應該只重置有特定重置邏輯的模態框', () => {
      // 設置一些狀態
      store.openAdjustmentModal()
      store.openCheckoutModal('order-123', 100)
      store.openCashCalculatorModal(50)
      store.openTableNumberModal()

      // 關閉沒有特殊重置邏輯的模態框
      store.closeModal('cashCalculator')
      store.closeModal('tableNumber')

      // 這些模態框應該只是關閉，不會重置其他狀態
      expect(store.modals.cashCalculator.show).toBe(false)
      expect(store.modals.tableNumber.show).toBe(false)
      
      // 總金額應該保持（cashCalculator沒有重置邏輯）
      expect(store.modals.cashCalculator.total).toBe(50)
    })
  })

  describe('狀態管理完整性', () => {
    it('所有方法都應該存在', () => {
      expect(typeof store.openAdjustmentModal).toBe('function')
      expect(typeof store.openCheckoutModal).toBe('function')
      expect(typeof store.openCashCalculatorModal).toBe('function')
      expect(typeof store.openTableNumberModal).toBe('function')
      expect(typeof store.closeModal).toBe('function')
      expect(typeof store.setAdjustmentType).toBe('function')
      expect(typeof store.appendToAdjustment).toBe('function')
      expect(typeof store.clearAdjustment).toBe('function')
    })

    it('modals狀態應該是響應式的', () => {
      const initialShow = store.modals.adjustment.show
      
      store.openAdjustmentModal()
      
      expect(store.modals.adjustment.show).not.toBe(initialShow)
      expect(store.modals.adjustment.show).toBe(true)
    })
  })
})