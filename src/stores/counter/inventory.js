import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api'

export const useCounterInventoryStore = defineStore('counterInventory', () => {
  // 狀態
  const inventoryData = ref({})
  const isLoadingInventory = ref(false)

  // 獲取庫存資訊
  const getInventoryInfo = (dishTemplateId) => {
    return inventoryData.value[dishTemplateId] || null
  }

  // 檢查餐點是否售完
  const isDishSoldOut = (dishTemplateId) => {
    const inventory = getInventoryInfo(dishTemplateId)
    if (!inventory) return false

    // 最高優先級：手動設為售完
    if (inventory.isSoldOut) {
      return true
    }

    // 次級：如果啟用了可用庫存機制，檢查可用庫存是否為 0
    if (inventory.enableAvailableStock) {
      return inventory.availableStock <= 0
    }

    return false
  }

  // 獲取庫存徽章樣式
  const getStockBadgeClass = (dishTemplateId) => {
    const inventory = getInventoryInfo(dishTemplateId)
    if (!inventory) return ''

    // 如果手動售完，直接返回紅色
    if (inventory.isSoldOut) {
      return 'bg-danger text-white'
    }

    // 如果沒有啟用可用庫存，不顯示badge
    if (!inventory.enableAvailableStock) return ''

    if (inventory.availableStock <= 0) {
      return 'bg-danger text-white'
    } else if (inventory.availableStock <= 5) {
      return 'bg-warning text-dark'
    } else {
      return 'bg-success text-white'
    }
  }

  // 載入庫存資料
  const loadInventoryData = async (brandId, storeId) => {
    if (!brandId || !storeId) return

    isLoadingInventory.value = true

    try {
      // 獲取店鋪所有餐點庫存
      const response = await api.inventory.getStoreInventory({
        brandId,
        storeId,
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
      }
    } catch (error) {
      console.error('載入庫存資料失敗:', error)
    } finally {
      isLoadingInventory.value = false
    }
  }

  // 清空庫存資料
  const clearInventoryData = () => {
    inventoryData.value = {}
  }

  return {
    // 狀態
    inventoryData,
    isLoadingInventory,

    // 方法
    getInventoryInfo,
    isDishSoldOut,
    getStockBadgeClass,
    loadInventoryData,
    clearInventoryData,
  }
})
