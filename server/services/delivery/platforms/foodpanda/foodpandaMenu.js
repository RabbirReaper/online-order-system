/**
 * Foodpanda Menu Sync Service
 * Handles converting local menu to Foodpanda format and syncing
 */

import axios from 'axios'
import { AppError } from '../../../../middlewares/error.js'
import Menu from '../../../../models/Menu/Menu.js'
import { withPlatformToken } from '../../core/tokenManager.js'

const BASE_URL = 'https://integration-middleware.as.restaurant-partners.com'

// ========================================
// Helper Functions: Data Conversion
// ========================================

/**
 * Convert business hours to Foodpanda Schedule format
 */
const convertBusinessHoursToSchedule = (businessHours) => {
  const schedule = {}

  if (!businessHours || businessHours.length === 0) {
    // 預設全天營業
    schedule['schedule00001'] = {
      id: 'schedule00001',
      type: 'ScheduleEntry',
      startTime: '00:00:00',
      endTime: '23:59:59',
    }
    return schedule
  }

  // 取第一個營業日的第一個時段作為主要營業時間
  const firstOpenDay = businessHours.find((day) => !day.isClosed && day.periods?.length > 0)

  if (firstOpenDay && firstOpenDay.periods.length > 0) {
    const firstPeriod = firstOpenDay.periods[0]
    schedule['schedule00001'] = {
      id: 'schedule00001',
      type: 'ScheduleEntry',
      startTime: `${firstPeriod.open}:00`,
      endTime: `${firstPeriod.close}:00`,
    }
  } else {
    // 如果找不到營業時間，使用預設
    schedule['schedule00001'] = {
      id: 'schedule00001',
      type: 'ScheduleEntry',
      startTime: '10:00:00',
      endTime: '22:00:00',
    }
  }

  return schedule
}

/**
 * Convert local menu to Foodpanda Catalog format
 */
const convertToFoodpandaCatalog = (menuData, businessHours) => {
  const catalogItems = {}

  // 追蹤已處理的選項類別
  const processedOptionCategories = new Map() // categoryId -> toppingId
  const toppingCounter = { count: 0 }
  const allToppingProductIds = [] // 記錄所有 Topping Product IDs

  // ========================================
  // Step 1: 收集並創建所有 Topping 和 Topping Products
  // ========================================

  menuData.categories.forEach((category) => {
    category.items.forEach((item) => {
      if (!item.isShowing || !item.dishTemplate) return

      const dish = item.dishTemplate

      if (dish.optionCategories && dish.optionCategories.length > 0) {
        dish.optionCategories.forEach((optionCategory) => {
          const categoryId = optionCategory.categoryId._id.toString()

          // 如果這個選項類別還沒處理過
          if (!processedOptionCategories.has(categoryId)) {
            toppingCounter.count++
            const toppingId = `tt${String(toppingCounter.count).padStart(4, '0')}`

            // 創建 Topping Products
            const toppingProducts = {}

            optionCategory.categoryId.options.forEach((option) => {
              const optionId = option.refOption._id.toString()
              const optionPrice = (option.refOption.price || 0).toFixed(2)

              // 添加到 Topping 的 products
              toppingProducts[optionId] = {
                id: optionId,
                type: 'Product',
                price: optionPrice,
              }

              // 記錄這個 Topping Product ID
              allToppingProductIds.push(optionId)

              // 創建選項商品實體（如果還沒創建）
              if (!catalogItems[optionId]) {
                catalogItems[optionId] = {
                  id: optionId,
                  type: 'Product',
                  title: {
                    default: option.refOption.name,
                  },
                  description: {
                    default: option.refOption.name,
                  },
                  price: optionPrice,
                  active: true,
                  isPrepackedItem: false,
                  isExpressItem: false,
                  excludeDishInformation: false,
                }
              }
            })

            // 創建 Topping
            catalogItems[toppingId] = {
              id: toppingId,
              type: 'Topping',
              order: toppingCounter.count,
              title: {
                default: optionCategory.categoryId.name,
              },
              quantity: {
                minimum: optionCategory.categoryId.inputType === 'single' ? 1 : 0,
                maximum:
                  optionCategory.categoryId.inputType === 'single'
                    ? 1
                    : optionCategory.categoryId.options.length,
              },
              products: toppingProducts,
            }

            processedOptionCategories.set(categoryId, toppingId)
          }
        })
      }
    })
  })

  // ========================================
  // Step 2: 創建主餐點 Products
  // ========================================

  const allDishIds = []

  menuData.categories.forEach((category) => {
    category.items.forEach((item) => {
      if (!item.isShowing || item.itemType !== 'dish' || !item.dishTemplate) return

      const dish = item.dishTemplate
      const dishId = dish._id.toString()

      // 避免重複創建
      if (!catalogItems[dishId]) {
        const product = {
          id: dishId,
          type: 'Product',
          title: {
            default: dish.name,
          },
          description: {
            default: dish.description || dish.name,
          },
          price: ((item.priceOverride || dish.basePrice) * 100).toFixed(2),
          active: item.isShowing !== false,
          isPrepackedItem: false,
          isExpressItem: false,
          excludeDishInformation: false,
        }

        // 添加 toppings 引用
        if (dish.optionCategories && dish.optionCategories.length > 0) {
          product.toppings = {}

          dish.optionCategories.forEach((optionCategory) => {
            const categoryId = optionCategory.categoryId._id.toString()
            const toppingId = processedOptionCategories.get(categoryId)

            if (toppingId) {
              product.toppings[toppingId] = {
                id: toppingId,
                type: 'Topping',
              }
            }
          })
        }

        catalogItems[dishId] = product
        allDishIds.push(dishId)
      }
    })
  })

  // ========================================
  // Step 3: 創建餐點分類 Categories
  // ========================================

  menuData.categories.forEach((category) => {
    const categoryId = `Category#${category._id.toString()}`
    const categoryProducts = {}

    category.items.forEach((item) => {
      if (!item.isShowing || item.itemType !== 'dish' || !item.dishTemplate) return

      const dishId = item.dishTemplate._id.toString()
      categoryProducts[dishId] = {
        id: dishId,
        type: 'Product',
      }
    })

    // 只有當分類有商品時才創建
    if (Object.keys(categoryProducts).length > 0) {
      catalogItems[categoryId] = {
        id: categoryId,
        type: 'Category',
        title: {
          default: category.name,
        },
        description: {
          default: category.description || category.name,
        },
        products: categoryProducts,
      }
    }
  })

  // ========================================
  // Step 3.5: 創建 Toppings Category（關鍵修復）
  // ========================================

  if (allToppingProductIds.length > 0) {
    const toppingsCategoryId = 'Category#Toppings'
    const toppingCategoryProducts = {}

    allToppingProductIds.forEach((toppingProductId) => {
      toppingCategoryProducts[toppingProductId] = {
        id: toppingProductId,
        type: 'Product',
      }
    })

    catalogItems[toppingsCategoryId] = {
      id: toppingsCategoryId,
      type: 'Category',
      title: {
        default: '加料選項',
      },
      description: {
        default: '所有可選擇的加料選項',
      },
      products: toppingCategoryProducts,
    }

    console.log(
      `[INFO] Created Toppings Category with ${allToppingProductIds.length} topping products`,
    )
  }

  // ========================================
  // Step 4: 創建營業時間 Schedule
  // ========================================

  const schedule = convertBusinessHoursToSchedule(businessHours)

  // 將 schedule 加入 catalogItems
  Object.keys(schedule).forEach((scheduleId) => {
    catalogItems[scheduleId] = schedule[scheduleId]
  })

  // ========================================
  // Step 5: 創建主菜單 Menu
  // ========================================

  const menuId = `menu_${menuData._id.toString()}`
  const menuProducts = {}

  allDishIds.forEach((dishId) => {
    menuProducts[dishId] = {
      id: dishId,
      type: 'Product',
    }
  })

  catalogItems[menuId] = {
    id: menuId,
    title: {
      default: menuData.name || 'Regular Menu',
    },
    description: {
      default: menuData.name || 'Regular Menu',
    },
    type: 'Menu',
    menuType: 'DELIVERY',
    schedule: {
      schedule00001: {
        id: 'schedule00001',
        type: 'ScheduleEntry',
      },
    },
    products: menuProducts,
  }

  return {
    items: catalogItems,
  }
}

// ========================================
// Core Sync Functions
// ========================================

/**
 * Sync menu to Foodpanda
 * @param {String} foodpandaVendorId - Foodpanda vendor ID (posVendorId)
 * @param {Object} menuData - Menu data
 * @param {Array} businessHours - Business hours
 */
export const syncMenuToFoodpanda = async (foodpandaVendorId, menuData, businessHours) => {
  try {
    console.log(`[INFO] Starting menu sync to Foodpanda - Vendor: ${foodpandaVendorId}`)

    if (!menuData) {
      throw new AppError('Menu data is required', 400)
    }

    // 需要從 PlatformStore 中獲取 Chain ID
    // 這裡假設已經在 menuData 或其他地方提供了
    const foodpandaChainId = process.env.FOODPANDA_CHAIN_CODE || 'RabbirOrder_UAT_TW'

    // Convert menu to Foodpanda Catalog format
    const foodpandaCatalog = convertToFoodpandaCatalog(menuData, businessHours)

    console.log(`[INFO] Converted ${Object.keys(foodpandaCatalog.items).length} catalog items`)

    const requestData = {
      callbackUrl:
        process.env.FOODPANDA_CALLBACK_URL ||
        'https://biweekly-nonfamiliar-cheryle.ngrok-free.dev/api/delivery/webhooks/foodpanda/catalog-callback',
      catalog: foodpandaCatalog,
      vendors: [foodpandaVendorId],
    }

    // Use token manager for automatic authentication
    const result = await withPlatformToken('foodpanda', async (token) => {
      const response = await axios.put(
        `${BASE_URL}/v2/chains/${foodpandaChainId}/catalog`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      )
      return response.data
    })

    console.log(`[SUCCESS] Menu synced to Foodpanda - Vendor: ${foodpandaVendorId}`)
    return result
  } catch (error) {
    console.error(
      '[ERROR] Failed to sync menu to Foodpanda:',
      error.response?.data || error.message,
    )

    // 如果有詳細的驗證錯誤，記錄下來
    if (error.response?.data?.errors) {
      console.error('[ERROR] Validation errors:')
      error.response.data.errors.forEach((err, index) => {
        console.error(`  ${index + 1}. ${err.message || err}`)
      })
    }

    throw new AppError(
      `Failed to sync menu to Foodpanda: ${error.response?.data?.message || error.message}`,
      error.response?.status || 500,
    )
  }
}

/**
 * Update single dish availability to Foodpanda
 * @param {String} dishId - Dish ID
 * @param {String} foodpandaVendorId - Foodpanda vendor ID
 * @param {Boolean} available - Availability status
 */
export const updateDishAvailability = async (dishId, foodpandaVendorId, available) => {
  try {
    console.log(`[INFO] Updating dish availability - Dish: ${dishId}, Available: ${available}`)

    const result = await withPlatformToken('foodpanda', async (token) => {
      const response = await axios.patch(
        `${BASE_URL}/v2/vendors/${foodpandaVendorId}/products/${dishId}/availability`,
        { available },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      )
      return response.data
    })

    console.log(`[SUCCESS] Dish availability updated - Dish: ${dishId}`)
    return result
  } catch (error) {
    console.error(
      '[ERROR] Failed to update dish availability:',
      error.response?.data || error.message,
    )
    throw new AppError(
      `Failed to update dish availability: ${error.response?.data?.message || error.message}`,
      error.response?.status || 500,
    )
  }
}

/**
 * Get Foodpanda menu
 * @param {String} foodpandaVendorId - Foodpanda vendor ID
 */
export const getFoodpandaMenu = async (foodpandaVendorId) => {
  try {
    console.log(`[INFO] Getting Foodpanda menu - Vendor: ${foodpandaVendorId}`)

    const result = await withPlatformToken('foodpanda', async (token) => {
      const response = await axios.get(`${BASE_URL}/v2/vendors/${foodpandaVendorId}/menu`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 30000,
      })
      return response.data
    })

    console.log(`[SUCCESS] Foodpanda menu retrieved - Vendor: ${foodpandaVendorId}`)
    return result
  } catch (error) {
    console.error('[ERROR] Failed to get Foodpanda menu:', error.response?.data || error.message)
    throw new AppError(
      `Failed to get Foodpanda menu: ${error.response?.data?.message || error.message}`,
      error.response?.status || 500,
    )
  }
}
