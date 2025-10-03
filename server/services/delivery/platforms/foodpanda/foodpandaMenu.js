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
    schedule['schedule00001'] = {
      id: 'schedule00001',
      type: 'ScheduleEntry',
      startTime: '00:00:00',
      endTime: '23:59:59',
    }
    return schedule
  }

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

  const processedOptionCategories = new Map()
  const toppingCounter = { count: 0 }
  const imageCounter = { count: 0 }

  // ========================================
  // Step 1: 收集並創建所有 Topping、Topping Products 和選項類別的 Category
  // ========================================

  menuData.categories.forEach((category) => {
    category.items.forEach((item) => {
      if (!item.isShowing || !item.dishTemplate) return

      const dish = item.dishTemplate

      if (dish.optionCategories && dish.optionCategories.length > 0) {
        dish.optionCategories.forEach((optionCategory) => {
          const categoryId = optionCategory.categoryId._id.toString()

          if (!processedOptionCategories.has(categoryId)) {
            toppingCounter.count++
            const toppingId = `tt${String(toppingCounter.count).padStart(4, '0')}`

            const toppingProducts = {}
            const categoryProducts = {}

            optionCategory.categoryId.options.forEach((option) => {
              const optionId = option.refOption._id.toString()
              const optionPrice = (option.refOption.price || 0).toFixed(2)

              toppingProducts[optionId] = {
                id: optionId,
                type: 'Product',
                price: optionPrice,
              }

              categoryProducts[optionId] = {
                id: optionId,
                type: 'Product',
              }

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

            const optionCategoryId = `Category#${categoryId}`
            catalogItems[optionCategoryId] = {
              id: optionCategoryId,
              type: 'Category',
              title: {
                default: optionCategory.categoryId.name,
              },
              description: {
                default: optionCategory.categoryId.name,
              },
              products: categoryProducts,
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

      const product = {
        id: dishId,
        type: 'Product',
        title: {
          default: dish.name,
        },
        description: {
          default: dish.description || dish.name,
        },
        price: (item.priceOverride || dish.basePrice).toFixed(2),
        active: item.isShowing !== false,
        isPrepackedItem: false,
        isExpressItem: false,
        excludeDishInformation: false,
      }

      // 處理圖片
      if (dish.image && dish.image.url) {
        imageCounter.count++
        const imageId = `img${String(imageCounter.count).padStart(5, '0')}`

        // 創建 Image 物件
        catalogItems[imageId] = {
          id: imageId,
          type: 'Image',
          url: dish.image.url,
          alt: {
            default: dish.name,
          },
        }

        // 在 Product 中引用這個 Image
        product.images = {
          [imageId]: {
            id: imageId,
            type: 'Image',
          },
        }
      }

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
  // Step 4: 創建營業時間 Schedule
  // ========================================

  const schedule = convertBusinessHoursToSchedule(businessHours)

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
 * @param {String} foodpandaChainId - Foodpanda chain ID (chainCode)
 * @param {Object} menuData - Menu data
 * @param {Array} businessHours - Business hours
 */
export const syncMenuToFoodpanda = async (
  foodpandaVendorId,
  foodpandaChainId,
  menuData,
  businessHours,
) => {
  try {
    console.log(
      `[INFO] Starting menu sync to Foodpanda - Vendor: ${foodpandaVendorId}, Chain: ${foodpandaChainId}`,
    )

    if (!menuData) {
      throw new AppError('Menu data is required', 400)
    }

    if (!foodpandaChainId) {
      throw new AppError('Foodpanda Chain ID is required', 400)
    }

    const foodpandaCatalog = convertToFoodpandaCatalog(menuData, businessHours)

    console.log(`[INFO] Converted ${Object.keys(foodpandaCatalog.items).length} catalog items`)

    const requestData = {
      callbackUrl:
        process.env.FOODPANDA_CALLBACK_URL ||
        'https://biweekly-nonfamiliar-cheryle.ngrok-free.dev/api/delivery/webhooks/foodpanda/catalog-callback',
      catalog: foodpandaCatalog,
      vendors: [foodpandaVendorId],
    }

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
