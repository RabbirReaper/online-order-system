// src/stores/menu.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

export const useMenuStore = defineStore('menu', () => {
  // 狀態
  const currentMenuType = ref('food') // 'food', 'cash_coupon', 'point_exchange'
  const brandId = ref(null)
  const storeId = ref(null)

  // 庫存相關狀態
  const inventoryData = ref({}) // { dishTemplateId: inventoryInfo }
  const isLoadingInventory = ref(false)

  // 計算屬性
  const menuTypeText = computed(() => {
    const typeMap = {
      food: '餐點菜單',
      cash_coupon: '預購券',
      point_exchange: '點數兌換',
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
        storeId: storeId.value,
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

  // === 庫存相關方法 ===

  /**
   * 載入店鋪的庫存資料
   * @param {string} newBrandId - 品牌ID
   * @param {string} newStoreId - 店鋪ID
   * @returns {Promise<Object>} 庫存資料
   */
  const loadInventory = async (newBrandId, newStoreId) => {
    if (!newBrandId || !newStoreId) {
      console.warn('缺少 brandId 或 storeId，無法載入庫存資料')
      return inventoryData.value
    }

    // 如果已有資料，直接返回
    if (Object.keys(inventoryData.value).length > 0) {
      return inventoryData.value
    }

    isLoadingInventory.value = true

    try {
      const response = await api.inventory.getStoreInventory({
        brandId: newBrandId,
        storeId: newStoreId,
        inventoryType: 'DishTemplate',
      })

      if (response.success) {
        const inventoryMap = {}

        // 將庫存資料按餐點模板 ID 建立對應關係
        response.inventory.forEach((item) => {
          if (item.dish && item.dish._id) {
            inventoryMap[item.dish._id] = {
              inventoryId: item._id,
              enableAvailableStock: item.enableAvailableStock,
              availableStock: item.availableStock,
              totalStock: item.totalStock,
              isSoldOut: item.isSoldOut,
              isInventoryTracked: item.isInventoryTracked,
            }
          }
        })

        inventoryData.value = inventoryMap
        return inventoryMap
      } else {
        console.warn('庫存資料載入失敗:', response.message)
        return {}
      }
    } catch (error) {
      console.error('載入庫存資料時發生錯誤:', error)
      return {}
    } finally {
      isLoadingInventory.value = false
    }
  }

  /**
   * 獲取特定餐點的庫存資訊
   * @param {string} dishTemplateId - 餐點模板ID
   * @returns {Object|null} 庫存資訊
   */
  const getInventoryInfo = (dishTemplateId) => {
    if (!dishTemplateId) return null
    return inventoryData.value[dishTemplateId] || null
  }

  /**
   * 清除庫存緩存
   */
  const clearInventoryCache = () => {
    inventoryData.value = {}
    isLoadingInventory.value = false
  }

  return {
    // 狀態
    currentMenuType,
    brandId,
    storeId,

    // 庫存狀態
    inventoryData,
    isLoadingInventory,

    // 計算屬性
    menuTypeText,
    requiresAuth,

    // 方法
    setMenuType,
    setBrandAndStore,
    persistState,
    restoreState,
    clearState,

    // 庫存方法
    loadInventory,
    getInventoryInfo,
    clearInventoryCache,
  }
})
