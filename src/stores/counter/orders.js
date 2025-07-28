import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'
import {
  formatTime,
  formatDateTime,
  getPickupMethodClass,
  getStatusClass,
  formatStatus,
} from './utils.js'

export const useCounterOrdersStore = defineStore('counterOrders', () => {
  // 狀態
  const todayOrders = ref([])
  const selectedOrder = ref(null)
  const currentDate = ref('')

  // 計算屬性 - 訂單相關（與 schema 命名一致）
  const calculateOrderSubtotal = (order) => {
    if (!order || !order.items) return 0
    return order.items.reduce((total, item) => total + (item.subtotal || 0), 0)
  }

  const calculateOrderTotalDiscount = (order) => {
    if (!order || !order.discounts) return 0
    return order.discounts.reduce((total, discount) => total + (discount.amount || 0), 0)
  }

  const calculateOrderTotal = (order) => {
    if (!order) return 0
    const itemsSubtotal = calculateOrderSubtotal(order)
    const adjustment = order.manualAdjustment || 0
    const discounts = calculateOrderTotalDiscount(order)
    return Math.max(0, itemsSubtotal + adjustment - discounts)
  }

  // 載入當日訂單
  const fetchTodayOrders = async (brandId, storeId) => {
    const today = new Date() // 直接使用當前時間
    return await fetchOrdersByDate(brandId, storeId, today)
  }

  // 按日期載入訂單
  const fetchOrdersByDate = async (brandId, storeId, date) => {
    try {
      // 確保 date 是 Date 對象
      const targetDate = date instanceof Date ? date : new Date(date)

      const response = await api.orderAdmin.getStoreOrders({
        brandId,
        storeId,
        fromDate: targetDate,
        toDate: targetDate,
      })

      if (response.success) {
        todayOrders.value = response.orders
        currentDate.value = targetDate.toLocaleDateString('zh-TW')

        return response
      } else {
        console.error('❌ API 回應失敗:', response)
        throw new Error(response.message || '獲取訂單失敗')
      }
    } catch (error) {
      console.error('💥 載入訂單失敗:', {
        錯誤: error.message,
        參數: { brandId, storeId, date },
      })
      throw error
    }
  }

  // 選擇訂單
  const selectOrder = (order) => {
    selectedOrder.value = order
  }

  // 清空訂單狀態
  const clearOrdersState = () => {
    todayOrders.value = []
    selectedOrder.value = null
    currentDate.value = ''
  }

  return {
    // 狀態
    todayOrders,
    selectedOrder,
    currentDate,

    // 計算方法
    calculateOrderSubtotal,
    calculateOrderTotalDiscount,
    calculateOrderTotal,

    // 訂單操作方法
    fetchTodayOrders,
    fetchOrdersByDate,
    selectOrder,
    clearOrdersState,

    // 格式化方法（重新導出）
    formatTime,
    formatDateTime,
    getPickupMethodClass,
    getStatusClass,
    formatStatus,
  }
})
