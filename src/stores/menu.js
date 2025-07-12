// src/stores/menu.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useMenuStore = defineStore('menu', () => {
  // 狀態
  const currentMenuType = ref('food') // 'food', 'cash_coupon', 'point_exchange'
  const brandId = ref(null)
  const storeId = ref(null)

  // 計算屬性
  const menuTypeText = computed(() => {
    const typeMap = {
      'food': '餐點菜單',
      'cash_coupon': '預購券',
      'point_exchange': '點數兌換'
    }
    return typeMap[currentMenuType.value] || currentMenuType.value
  })

  // 檢查是否需要登入
  const requiresAuth = computed(() => {
    return currentMenuType.value === 'point_exchange' || currentMenuType.value === 'cash_coupon'
  })

  // 方法
  const setMenuType = (type) => {
    currentMenuType.value = type
    persistState()
  }

  const setBrandAndStore = (newBrandId, newStoreId) => {
    brandId.value = newBrandId
    storeId.value = newStoreId
    persistState()
  }

  const persistState = () => {
    try {
      const state = {
        currentMenuType: currentMenuType.value,
        brandId: brandId.value,
        storeId: storeId.value
      }
      sessionStorage.setItem('menuState', JSON.stringify(state))
    } catch (error) {
      console.error('持久化菜單狀態失敗:', error)
    }
  }

  const restoreState = () => {
    try {
      const saved = sessionStorage.getItem('menuState')
      if (saved) {
        const state = JSON.parse(saved)
        currentMenuType.value = state.currentMenuType || 'food'
        brandId.value = state.brandId
        storeId.value = state.storeId
      }
    } catch (error) {
      console.error('恢復菜單狀態失敗:', error)
    }
  }

  const clearState = () => {
    currentMenuType.value = 'food'
    brandId.value = null
    storeId.value = null
    try {
      sessionStorage.removeItem('menuState')
    } catch (error) {
      console.error('清除菜單狀態失敗:', error)
    }
  }

  return {
    // 狀態
    currentMenuType,
    brandId,
    storeId,

    // 計算屬性
    menuTypeText,
    requiresAuth,

    // 方法
    setMenuType,
    setBrandAndStore,
    persistState,
    restoreState,
    clearState
  }
})
