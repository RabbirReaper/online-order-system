/**
 * UberEats API 串接服務 - 重構版（使用 axios）
 * 基於實際的 Store schema 處理與 UberEats 平台的核心 API 交互
 */

import Store from '../../models/Store/Store.js'
import { AppError } from '../../middlewares/error.js'
import { getAccessToken } from './tokenManager.js'
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

// 🔧 UberEats API 設定
const UBEREATS_CONFIG = {
  apiUrl: 'https://api.uber.com/v1/eats',
  storeApiUrl: 'https://api.uber.com/v1/delivery/store',
  menuApiUrl: 'https://api.uber.com/v2/eats/stores',
}

// 啟動時記錄配置狀態
// console.log(`🔧 UberEats Service initialized`)
// console.log(`📡 API URL: ${UBEREATS_CONFIG.apiUrl}`)

/**
 * 創建通用的 axios 請求配置
 * 這個輔助函數會自動添加認證標頭，避免重複程式碼
 */
const createRequestConfig = async (additionalConfig = {}) => {
  const accessToken = await getAccessToken()

  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...additionalConfig.headers, // 允許覆蓋或添加額外的標頭
    },
    timeout: 30000, // 30 秒超時，避免請求卡住
    ...additionalConfig, // 允許覆蓋其他設定
  }
}

/**
 * 統一的錯誤處理函數
 * axios 的錯誤結構與 fetch 不同，這裡統一處理
 */
const handleApiError = (error, operation) => {
  console.error(`❌ ${operation}失敗:`, error.response?.data || error.message)

  if (error.response) {
    // 有回應，但狀態碼表示錯誤
    const status = error.response.status
    const data = error.response.data
    throw new AppError(
      `${operation}失敗: ${status} ${error.response.statusText} - ${JSON.stringify(data)}`,
      status >= 500 ? 500 : 400,
    )
  } else if (error.request) {
    // 請求已發送但沒有回應
    throw new AppError(`${operation}失敗: 網路連接問題`, 500)
  } else {
    // 其他錯誤
    throw new AppError(`${operation}失敗: ${error.message}`, 500)
  }
}

/**
 * 獲取店鋪詳細資訊
 * @param {String} storeId - UberEats 店鋪ID
 * @returns {Promise<Object>} 店鋪詳細資訊
 */
export const getStoreDetails = async (storeId) => {
  try {
    const config = await createRequestConfig()

    const response = await axios.get(`${UBEREATS_CONFIG.storeApiUrl}/${storeId}`, config)

    // console.log('✅ 成功取得商店詳細資訊')
    return response.data // axios 自動解析 JSON，直接返回 data
  } catch (error) {
    handleApiError(error, '取得商店詳細資訊')
  }
}

/**
 * 設定店鋪詳細資訊
 * @param {String} storeId - UberEats 店鋪ID
 * @param {Object} details - 店鋪詳細資訊
 * @returns {Promise<Object>} 更新結果
 */
export const setStoreDetails = async (storeId, details) => {
  try {
    const config = await createRequestConfig()

    // axios.post 的第二個參數是請求體，第三個參數是配置
    const response = await axios.post(`${UBEREATS_CONFIG.storeApiUrl}/${storeId}`, details, config)

    // console.log('✅ 成功更新商店詳細資訊')
    return response.data
  } catch (error) {
    handleApiError(error, '更新商店詳細資訊')
  }
}

/**
 * 獲取店鋪營業狀態
 * @param {String} storeId - UberEats 店鋪ID
 * @returns {Promise<Object>} 店鋪狀態
 */
export const getStoreStatus = async (storeId) => {
  try {
    const config = await createRequestConfig()

    const response = await axios.get(`${UBEREATS_CONFIG.storeApiUrl}/${storeId}/status`, config)

    // console.log('✅ 成功取得商店狀態')
    return response.data
  } catch (error) {
    handleApiError(error, '取得商店狀態')
  }
}

/**
 * 設定店鋪營業狀態
 * @param {String} storeId - UberEats 店鋪ID
 * @param {Object} status - 狀態設定 { status: 'ONLINE'|'OFFLINE', reason?: string, is_offline_until?: string }
 * @returns {Promise<Object>} 更新結果
 */
export const setStoreStatus = async (storeId, status) => {
  try {
    const config = await createRequestConfig()

    const response = await axios.post(
      `${UBEREATS_CONFIG.storeApiUrl}/${storeId}/update-store-status`,
      status,
      config,
    )

    // console.log('✅ 成功更新商店狀態')
    return response.data
  } catch (error) {
    handleApiError(error, '更新商店狀態')
  }
}

/**
 * 設定準備時間
 * @param {String} storeId - UberEats 店鋪ID
 * @param {Number} prepTime - 準備時間（秒），最大值 10800 秒（3小時）
 * @returns {Promise<Object>} 更新結果
 */
export const setPrepTime = async (storeId, prepTime) => {
  try {
    const config = await createRequestConfig()

    const response = await axios.post(
      `${UBEREATS_CONFIG.storeApiUrl}/${storeId}/update-store-prep-time`,
      { default_prep_time: prepTime }, // 請求體
      config,
    )

    // console.log('✅ 成功更新準備時間')
    return response.data
  } catch (error) {
    handleApiError(error, '更新準備時間')
  }
}

/**
 * 轉換菜單為 UberEats 格式
 * @param {Object} fullMenuData - 完整的菜單資料
 * @returns {Object} UberEats 格式的菜單
 */
export const convertMenuToUberEatsFormat = (fullMenuData) => {
  // console.log('開始轉換菜單資料到 UberEats 格式...')

  const result = {
    menus: [],
    categories: [],
    items: [],
    modifier_groups: [],
  }

  // 用於追踪已處理的 modifier groups，避免重複
  const processedModifierGroups = new Set()

  // 建立主菜單
  const mainMenu = {
    id: fullMenuData._id,
    title: {
      translations: {
        en_us: fullMenuData.name,
        zh_tw: fullMenuData.name,
      },
    },
    service_availability: [
      {
        day_of_week: 'monday',
        time_periods: [{ start_time: '00:00', end_time: '23:59' }],
      },
      {
        day_of_week: 'tuesday',
        time_periods: [{ start_time: '00:00', end_time: '23:59' }],
      },
      {
        day_of_week: 'wednesday',
        time_periods: [{ start_time: '00:00', end_time: '23:59' }],
      },
      {
        day_of_week: 'thursday',
        time_periods: [{ start_time: '00:00', end_time: '23:59' }],
      },
      {
        day_of_week: 'friday',
        time_periods: [{ start_time: '00:00', end_time: '23:59' }],
      },
      {
        day_of_week: 'saturday',
        time_periods: [{ start_time: '00:00', end_time: '23:59' }],
      },
      {
        day_of_week: 'sunday',
        time_periods: [{ start_time: '00:00', end_time: '23:59' }],
      },
    ],
    category_ids: [],
  }

  // 處理分類和商品
  fullMenuData.categories.forEach((category) => {
    const categoryId = category._id

    // 轉換分類格式
    const uberCategory = {
      id: categoryId,
      title: {
        translations: {
          en_us: category.name,
          zh_tw: category.name,
        },
      },
      entities: [],
    }

    // 處理該分類下的商品
    category.items.forEach((item) => {
      if (!item.isShowing) return // 跳過不顯示的商品

      const dishTemplate = item.dishTemplate
      const itemId = dishTemplate._id

      // 轉換商品格式
      const uberItem = {
        id: itemId,
        title: {
          translations: {
            en_us: dishTemplate.name,
            zh_tw: dishTemplate.name,
          },
        },
        description: {
          translations: {
            en_us: dishTemplate.description || '',
            zh_tw: dishTemplate.description || '',
          },
        },
        price_info: {
          price: dishTemplate.basePrice * 100, // 轉換為分
        },
        tax_info: {},
        external_data: `External data for ${dishTemplate.name}`,
        quantity_info: {},
      }

      // 添加圖片
      if (dishTemplate.image?.url) {
        uberItem.image_url = dishTemplate.image.url
      }

      // 處理選項群組
      if (dishTemplate.optionCategories && dishTemplate.optionCategories.length > 0) {
        const modifierGroupIds = []

        dishTemplate.optionCategories.forEach((optionCategory) => {
          const modifierGroupId = optionCategory.categoryId._id
          modifierGroupIds.push(modifierGroupId)

          // 如果還未處理過這個 modifier group，則加入到結果中
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
        id: itemId,
        type: 'ITEM',
      })
    })

    result.categories.push(uberCategory)
    mainMenu.category_ids.push(categoryId)
  })

  result.menus.push(mainMenu)

  // 添加 modifier items
  const modifierItems = createModifierItems(fullMenuData)
  result.items.push(...modifierItems)

  // console.log(`轉換完成:`)
  // console.log(`- 菜單: ${result.menus.length} 個`)
  // console.log(`- 分類: ${result.categories.length} 個`)
  // console.log(`- 主要商品: ${result.items.length - modifierItems.length} 個`)
  // console.log(`- 選項商品: ${modifierItems.length} 個`)
  // console.log(`- 總商品數: ${result.items.length} 個`)
  // console.log(`- 選項群組: ${result.modifier_groups.length} 個`)

  return result
}

/**
 * 轉換選項群組為 UberEats modifier_group 格式
 */
const convertToModifierGroup = (optionCategory) => {
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

  // 設定數量限制
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

  // 轉換選項
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
const createModifierItems = (fullMenuData) => {
  const modifierItems = []
  const processedOptionIds = new Set()

  fullMenuData.categories.forEach((category) => {
    category.items.forEach((item) => {
      if (!item.isShowing || !item.dishTemplate.optionCategories) return

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
              price: (option.refOption.price || 0) * 100, // 轉換為分
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
 * 上傳菜單到 UberEats
 * @param {String} storeId - UberEats 店鋪ID
 * @param {String} menuId - 菜單ID（內部系統）
 * @returns {Promise<Object>} 上傳結果
 */
export const uploadMenu = async (storeId, menuId) => {
  try {
    // 使用 getMenuAllPopulateById 獲得完整菜單
    // 注意：這個函數需要從適當的地方導入，或者作為參數傳入
    const { getMenuAllPopulateById } = await import('../store/menuService.js')
    const fullMenuData = await getMenuAllPopulateById(menuId)

    if (!fullMenuData) {
      throw new AppError('菜單不存在', 404)
    }

    // 轉換菜單格式
    const convertedMenuData = convertMenuToUberEatsFormat(fullMenuData)

    // 獲取請求配置
    const config = await createRequestConfig()

    // 使用 axios.put 上傳菜單
    const response = await axios.put(
      `${UBEREATS_CONFIG.menuApiUrl}/${storeId}/menus`,
      convertedMenuData, // 請求體
      config,
    )

    // console.log('✅ 成功上傳菜單到 UberEats')
    return { success: true, data: response.data }
  } catch (error) {
    handleApiError(error, '上傳菜單')
  }
}

/**
 * 檢查 UberEats 配置是否完整
 * @returns {Object} 配置檢查結果
 */
export const checkUberEatsConfig = () => {
  const clientId = process.env.UBEREATS_PRODUCTION_CLIENT_ID
  const clientSecret = process.env.UBEREATS_PRODUCTION_CLIENT_SECRET

  const config = {
    clientId: !!clientId,
    clientSecret: !!clientSecret,
    apiUrl: !!UBEREATS_CONFIG.apiUrl,
  }

  const requiredFields = ['clientId', 'clientSecret', 'apiUrl']
  const isComplete = requiredFields.every((field) => config[field])

  const missing = Object.keys(config).filter((key) => !config[key])

  return {
    isComplete,
    config,
    missing,
    apiUrl: UBEREATS_CONFIG.apiUrl,
    recommendations: isComplete
      ? ['✅ 所有必要配置已完成']
      : [`❌ 缺少配置: ${missing.join(', ')}`],
  }
}

/**
 * 測試 UberEats API 連接
 * @returns {Promise<Boolean>} 連接是否成功
 */
export const testUberEatsConnection = async () => {
  try {
    // console.log('🧪 測試 UberEats API 連接')

    // 嘗試取得商店列表來測試連接
    const config = await createRequestConfig()
    await axios.get('https://api.uber.com/v1/delivery/stores', config)

    // console.log('✅ UberEats API 連接測試通過')
    return true
  } catch (error) {
    console.error('❌ UberEats API 連接測試失敗:', error.response?.data || error.message)
    return false
  }
}
