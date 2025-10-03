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
 * Convert local option to Foodpanda modifier format
 */
const convertOptionToModifier = (option) => {
  return {
    id: option.refOption._id.toString(),
    name: option.refOption.name,
    price: (option.refOption.price || 0) * 100, // Convert to cents
    available: true,
  }
}

/**
 * Convert local option category to Foodpanda modifier group format
 */
const convertOptionCategoryToModifierGroup = (optionCategory) => {
  const modifiers = optionCategory.categoryId.options.map(convertOptionToModifier)

  return {
    id: optionCategory.categoryId._id.toString(),
    name: optionCategory.categoryId.name,
    min_selections: optionCategory.categoryId.inputType === 'single' ? 1 : 0,
    max_selections: optionCategory.categoryId.inputType === 'single' ? 1 : modifiers.length,
    modifiers: modifiers,
  }
}

/**
 * Convert local dish to Foodpanda product format
 */
const convertDishToProduct = (item) => {
  const dish = item.dishTemplate

  const product = {
    id: dish._id.toString(),
    name: dish.name,
    description: dish.description || '',
    price: (item.priceOverride || dish.basePrice) * 100, // Use priceOverride if exists
    available: item.isShowing !== false,
    modifier_groups: [],
  }

  // Add image if exists
  if (dish.image?.url) {
    product.image_url = dish.image.url
  }

  // Process option categories (modifier groups)
  if (dish.optionCategories && dish.optionCategories.length > 0) {
    product.modifier_groups = dish.optionCategories.map(convertOptionCategoryToModifierGroup)
  }

  return product
}

/**
 * Convert local category to Foodpanda category format
 */
const convertCategoryToFoodpandaCategory = (category) => {
  // Filter only dish items that are showing
  const dishItems = category.items.filter(
    (item) => item.itemType === 'dish' && item.isShowing && item.dishTemplate,
  )

  const products = dishItems.map(convertDishToProduct)

  return {
    id: category._id.toString(),
    name: category.name,
    description: category.description || '',
    available: true,
    products: products,
  }
}

// ========================================
// Core Sync Functions
// ========================================

/**
 * Sync menu to Foodpanda
 * @param {String} menuId - Local menu ID (or pass menuData directly)
 * @param {String} foodpandaVendorId - Foodpanda vendor ID
 * @param {Object} menuData - Optional: pre-populated menu data
 */
export const syncMenuToFoodpanda = async (menuId, foodpandaVendorId, menuData = null) => {
  try {
    console.log(
      `[INFO] Starting menu sync to Foodpanda - Menu: ${menuId}, Vendor: ${foodpandaVendorId}`,
    )

    // Get menu data if not provided
    let menu = menuData
    if (!menu) {
      menu = await Menu.findById(menuId)
        .populate({
          path: 'categories.items.dishTemplate',
          populate: {
            path: 'optionCategories.categoryId',
            populate: {
              path: 'options.refOption',
            },
          },
        })
        .lean()
    }

    if (!menu) {
      throw new AppError('Menu not found', 404)
    }

    // Convert categories to Foodpanda format
    const foodpandaCategories = menu.categories
      .filter((cat) => cat.items && cat.items.length > 0)
      .map(convertCategoryToFoodpandaCategory)
      .filter((cat) => cat.products && cat.products.length > 0) // Only include categories with products

    if (foodpandaCategories.length === 0) {
      throw new AppError('No valid products found in menu', 400)
    }

    const requestData = {
      vendor_id: foodpandaVendorId,
      categories: foodpandaCategories,
    }

    // Use token manager for automatic authentication
    const result = await withPlatformToken('foodpanda', async (token) => {
      const response = await axios.put(
        `${BASE_URL}/v2/vendors/${foodpandaVendorId}/menu`,
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
