/**
 * Uber Eats 菜單服務
 * 處理 Uber Eats 菜單同步
 */

import axios from 'axios'
import { withPlatformToken } from '../../core/tokenManager.js'

const BASE_URL = 'https://api.uber.com/v2/eats/stores'

/**
 * 同步菜單到 Uber Eats
 * @param {String} storeId - Uber Eats 店鋪ID
 * @param {Object} menuData - 菜單資料
 * @param {Array} businessHours - 店鋪營業時間
 * @returns {Promise<Object>} 同步結果
 */
export const syncMenuToUberEats = async (storeId, menuData, businessHours) => {
  return await withPlatformToken('ubereats', async (token) => {
    const uberMenuData = convertToUberEatsFormat(menuData, businessHours)

    const response = await axios.put(`${BASE_URL}/${storeId}/menus`, uberMenuData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })

    return response.data
  })
}

/**
 * 轉換菜單格式為 Uber Eats 格式
 */
function convertToUberEatsFormat(menuData, businessHours) {
  const result = {
    menus: [],
    categories: [],
    items: [],
    modifier_groups: [],
  }

  const processedModifierGroups = new Set()

  // 建立主菜單
  const mainMenu = {
    id: menuData._id,
    title: {
      translations: {
        en_us: menuData.name,
        zh_tw: menuData.name,
      },
    },
    service_availability: convertBusinessHoursToServiceAvailability(businessHours),
    category_ids: [],
  }

  // 處理分類和商品
  menuData.categories.forEach((category) => {
    const uberCategory = {
      id: category._id,
      title: {
        translations: {
          en_us: category.name,
          zh_tw: category.name,
        },
      },
      entities: [],
    }

    category.items.forEach((item) => {
      if (!item.isShowing || !item.dishTemplate) return

      const dish = item.dishTemplate
      const uberItem = {
        id: dish._id,
        title: {
          translations: {
            en_us: dish.name,
            zh_tw: dish.name,
          },
        },
        description: {
          translations: {
            en_us: dish.description || '',
            zh_tw: dish.description || '',
          },
        },
        price_info: {
          price: dish.basePrice * 100,
        },
        tax_info: {},
        external_data: `External data for ${dish.name}`,
        quantity_info: {},
      }

      if (dish.image?.url) {
        uberItem.image_url = dish.image.url
      }

      // 處理選項群組
      if (dish.optionCategories && dish.optionCategories.length > 0) {
        const modifierGroupIds = []

        dish.optionCategories.forEach((optionCategory) => {
          const modifierGroupId = optionCategory.categoryId._id
          modifierGroupIds.push(modifierGroupId)

          if (!processedModifierGroups.has(modifierGroupId)) {
            const modifierGroup = convertToModifierGroup(optionCategory.categoryId)
            result.modifier_groups.push(modifierGroup)
            processedModifierGroups.add(modifierGroupId)
          }
        })

        if (modifierGroupIds.length > 0) {
          uberItem.modifier_group_ids = { ids: modifierGroupIds }
        }
      }

      result.items.push(uberItem)
      uberCategory.entities.push({
        id: dish._id,
        type: 'ITEM',
      })
    })

    result.categories.push(uberCategory)
    mainMenu.category_ids.push(category._id)
  })

  result.menus.push(mainMenu)

  // 添加 modifier items
  const modifierItems = createModifierItems(menuData)
  result.items.push(...modifierItems)

  return result
}

/**
 * 轉換選項群組為 Uber Eats modifier_group 格式
 */
function convertToModifierGroup(optionCategory) {
  const modifierGroup = {
    id: optionCategory._id,
    title: {
      translations: {
        en_us: optionCategory.name,
        zh_tw: optionCategory.name,
      },
    },
    external_data: `External data for ${optionCategory.name}`,
    modifier_options: [],
    display_type: null,
  }

  if (optionCategory.inputType === 'single') {
    modifierGroup.quantity_info = {
      quantity: {
        min_permitted: 1,
        max_permitted: 1,
      },
    }
  } else if (optionCategory.inputType === 'multiple') {
    modifierGroup.quantity_info = {
      quantity: {
        min_permitted: 0,
        max_permitted: optionCategory.options.length,
      },
    }
  }

  optionCategory.options.forEach((option) => {
    modifierGroup.modifier_options.push({
      type: 'ITEM',
      id: option.refOption._id,
    })
  })

  return modifierGroup
}

/**
 * 創建選項商品
 */
function createModifierItems(menuData) {
  const modifierItems = []
  const processedOptionIds = new Set()

  menuData.categories.forEach((category) => {
    category.items.forEach((item) => {
      if (!item.isShowing || !item.dishTemplate?.optionCategories) return

      item.dishTemplate.optionCategories.forEach((optionCategory) => {
        optionCategory.categoryId.options.forEach((option) => {
          const optionId = option.refOption._id

          if (processedOptionIds.has(optionId)) return
          processedOptionIds.add(optionId)

          const modifierItem = {
            id: optionId,
            title: {
              translations: {
                en_us: option.refOption.name,
                zh_tw: option.refOption.name,
              },
            },
            external_data: `External data for ${option.refOption.name}`,
            price_info: {
              price: (option.refOption.price || 0) * 100,
            },
            tax_info: {},
            quantity_info: {},
          }

          if (option.refOption.tags && option.refOption.tags.length > 0) {
            modifierItem.tags = option.refOption.tags
          }

          modifierItems.push(modifierItem)
        })
      })
    })
  })

  return modifierItems
}

/**
 * 轉換營業時間為 Uber Eats service_availability 格式
 * @param {Array} businessHours - Store 的營業時間
 * @returns {Array} Uber Eats 格式的營業時間
 */
function convertBusinessHoursToServiceAvailability(businessHours) {
  const dayMapping = {
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
    0: 'sunday',
  }

  const serviceAvailability = []
  // console.log(businessHours)
  // 如果沒有營業時間資料，預設全天營業
  if (!businessHours || businessHours.length === 0) {
    return [
      { day_of_week: 'monday', time_periods: [{ start_time: '00:00', end_time: '23:59' }] },
      { day_of_week: 'tuesday', time_periods: [{ start_time: '00:00', end_time: '23:59' }] },
      { day_of_week: 'wednesday', time_periods: [{ start_time: '00:00', end_time: '23:59' }] },
      { day_of_week: 'thursday', time_periods: [{ start_time: '00:00', end_time: '23:59' }] },
      { day_of_week: 'friday', time_periods: [{ start_time: '00:00', end_time: '23:59' }] },
      { day_of_week: 'saturday', time_periods: [{ start_time: '00:00', end_time: '23:59' }] },
      { day_of_week: 'sunday', time_periods: [{ start_time: '00:00', end_time: '23:59' }] },
    ]
  }

  businessHours.forEach((dayInfo) => {
    const dayOfWeek = dayMapping[dayInfo.day]

    if (!dayOfWeek) return

    // 如果該天休息，可以選擇不加入或加入空的 time_periods
    if (dayInfo.isClosed) {
      // 不加入該天到 service_availability，表示該天不營業
      return
    }

    // 轉換時段格式
    const timePeriods = dayInfo.periods.map((period) => ({
      start_time: period.open,
      end_time: period.close,
    }))

    serviceAvailability.push({
      day_of_week: dayOfWeek,
      time_periods: timePeriods,
    })
  })

  return serviceAvailability
}
