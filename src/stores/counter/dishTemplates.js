import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api'

export const useCounterDishTemplatesStore = defineStore('counterDishTemplates', () => {
  // 狀態
  const dishTemplates = ref([])
  const optionCategories = ref([])
  const menuData = ref(null)

  // 載入餐點模板
  const fetchDishTemplates = async (brandId) => {
    try {
      const response = await api.dish.getAllDishTemplates({ brandId })
      if (response.success) {
        dishTemplates.value = response.templates
      }
    } catch (error) {
      console.error('載入餐點模板失敗:', error)
    }
  }

  // 載入選項類別
  const fetchOptionCategoriesWithOptions = async (brandId) => {
    try {
      const response = await api.dish.getAllOptionCategories(brandId)
      if (response.success) {
        optionCategories.value = response.categories
      }
    } catch (error) {
      console.error('載入選項類別失敗:', error)
    }
  }

  // 載入菜單資料
  const fetchMenuData = async (brandId, storeId) => {
    try {
      const response = await api.menu.getAllStoreMenus({
        brandId,
        storeId,
        includeUnpublished: true, // 包含 isShowing === false 的項目，讓 counter 可以看到所有資料
        activeOnly: true,
        menuType: 'food', // counter 主要處理餐點菜單
      })

      if (response.success && response.menus && response.menus.length > 0) {
        // 尋找 food 類型的菜單（現金購買餐點）
        const foodMenu = response.menus.find((menu) => menu.menuType === 'food')
        if (foodMenu) {
          menuData.value = foodMenu

          // 確保分類按順序排列
          if (menuData.value.categories) {
            menuData.value.categories.sort((a, b) => (a.order || 0) - (b.order || 0))

            // 確保每個分類的商品按順序排列
            menuData.value.categories.forEach((category) => {
              if (category.items) {
                category.items.sort((a, b) => (a.order || 0) - (b.order || 0))
              }
            })
          }

          await fetchDishTemplates(brandId)
          await fetchOptionCategoriesWithOptions(brandId)
        } else {
          console.warn('沒有找到現金購買餐點菜單')
          menuData.value = { categories: [] }
        }
      } else {
        console.warn('沒有找到啟用的菜單')
        menuData.value = { categories: [] }
      }
    } catch (error) {
      console.error('載入菜單資料失敗:', error)
      throw error
    }
  }

  // 獲取餐點模板詳細資料
  const getDishTemplate = (templateId) => {
    return dishTemplates.value.find((template) => template._id === templateId)
  }

  // 獲取餐點的預設選項
  const getDefaultOptionsForDish = (dishTemplate) => {
    const defaultOptions = []

    if (dishTemplate.optionCategories && dishTemplate.optionCategories.length > 0) {
      dishTemplate.optionCategories.forEach((categoryRef) => {
        const category = optionCategories.value.find((cat) => cat._id === categoryRef.categoryId)

        if (
          category &&
          category.inputType === 'single' &&
          category.options &&
          category.options.length > 0
        ) {
          const firstOption = category.options[0]
          const optionId = firstOption.refOption ? firstOption.refOption._id : firstOption._id
          const optionName = firstOption.refOption ? firstOption.refOption.name : firstOption.name
          const optionPrice = firstOption.refOption
            ? firstOption.refOption.price || 0
            : firstOption.price || 0

          defaultOptions.push({
            optionCategoryId: category._id,
            optionCategoryName: category.name,
            selections: [
              {
                optionId: optionId,
                name: optionName,
                price: optionPrice,
              },
            ],
          })
        }
      })
    }

    return defaultOptions
  }

  return {
    // 狀態
    dishTemplates,
    optionCategories,
    menuData,

    // 方法
    fetchDishTemplates,
    fetchOptionCategoriesWithOptions,
    fetchMenuData,
    getDishTemplate,
    getDefaultOptionsForDish,
  }
})
