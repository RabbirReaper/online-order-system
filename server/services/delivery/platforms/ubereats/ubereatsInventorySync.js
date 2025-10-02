/**
 * Uber Eats 庫存狀態同步服務
 * 處理將內部庫存狀態同步到 Uber Eats 平台
 * 參考前端 MenuOrder.vue 的庫存判斷邏輯
 */

import axios from 'axios'
import { withPlatformToken } from '../../core/tokenManager.js'
import * as inventoryService from '../../../inventory/index.js'
import Menu from '../../../../models/Menu/Menu.js'
import PlatformStore from '../../../../models/DeliverPlatform/platformStore.js'
import { AppError } from '../../../../middlewares/error.js'

const BASE_URL = 'https://api.uber.com/v2/eats/stores'

/**
 * 同步庫存狀態到 Uber Eats
 * @param {String} brandId - 品牌 ID
 * @param {String} storeId - 內部店鋪 ID
 * @returns {Promise<Object>} 同步結果
 */
export const syncInventoryStatusToUberEats = async (brandId, storeId) => {
  // 查詢該店鋪的 UberEats 平台配置
  const platformStore = await PlatformStore.findOne({
    brand: brandId,
    store: storeId,
    platform: 'ubereats',
    isActive: true,
  })

  if (!platformStore) {
    throw new AppError('該店鋪未啟用 UberEats 平台或配置不存在', 404)
  }

  const uberStoreId = platformStore.platformStoreId

  return await withPlatformToken('ubereats', async (token) => {
    try {
      console.log('🔄 開始同步庫存狀態到 Uber Eats...')
      console.log('   UberEats Store ID:', uberStoreId)
      console.log('   Brand ID:', brandId)
      console.log('   Store ID:', storeId)

      // 1. 獲取店鋪庫存資料
      const inventoryData = await getStoreInventoryData(brandId, storeId)

      // 2. 獲取菜單資料（需要知道哪些餐點和選項在 UberEats 上）
      const menuData = await getMenuData(brandId, storeId)
      if (!menuData) {
        throw new AppError('找不到啟用的食品菜單', 404)
      }

      // 3. 檢查並更新餐點狀態
      const dishUpdateResults = await updateDishesStatus(
        token,
        uberStoreId,
        menuData,
        inventoryData,
      )

      // 4. 檢查並更新選項（modifier items）狀態
      const modifierUpdateResults = await updateModifiersStatus(
        token,
        uberStoreId,
        menuData,
        inventoryData,
      )

      const totalDisabled =
        dishUpdateResults.suspended.length + modifierUpdateResults.suspended.length
      const totalEnabled = dishUpdateResults.resumed.length + modifierUpdateResults.resumed.length

      console.log('✅ 庫存狀態同步完成')
      console.log(
        `   餐點: ${dishUpdateResults.suspended.length} 停售, ${dishUpdateResults.resumed.length} 正常販售`,
      )
      console.log(
        `   選項: ${modifierUpdateResults.suspended.length} 停售, ${modifierUpdateResults.resumed.length} 正常販售`,
      )

      return {
        success: true,
        disabledCount: totalDisabled,
        enabledCount: totalEnabled,
        summary: {
          dishes: {
            suspended: dishUpdateResults.suspended.length,
            resumed: dishUpdateResults.resumed.length,
            errors: dishUpdateResults.errors.length,
          },
          modifiers: {
            suspended: modifierUpdateResults.suspended.length,
            resumed: modifierUpdateResults.resumed.length,
            errors: modifierUpdateResults.errors.length,
          },
        },
        details: {
          dishes: dishUpdateResults,
          modifiers: modifierUpdateResults,
        },
      }
    } catch (error) {
      console.error('❌ 同步庫存狀態失敗:', error)
      throw error
    }
  })
}

/**
 * 獲取店鋪庫存資料
 * @param {String} brandId - 品牌 ID
 * @param {String} storeId - 店鋪 ID
 * @returns {Promise<Object>} 庫存資料 Map (dishTemplateId -> inventoryInfo)
 */
const getStoreInventoryData = async (brandId, storeId) => {
  try {
    const inventory = await inventoryService.getStoreInventory(storeId, {
      inventoryType: 'DishTemplate',
    })

    const inventoryMap = {}

    inventory.forEach((item) => {
      if (item.dish && item.dish._id) {
        inventoryMap[item.dish._id.toString()] = {
          inventoryId: item._id,
          enableAvailableStock: item.enableAvailableStock,
          availableStock: item.availableStock,
          totalStock: item.totalStock,
          isSoldOut: item.isSoldOut,
          isInventoryTracked: item.isInventoryTracked,
        }
      }
    })

    return inventoryMap
  } catch (error) {
    console.error('獲取庫存資料失敗:', error)
    throw error
  }
}

/**
 * 獲取菜單資料
 * @param {String} brandId - 品牌 ID
 * @param {String} storeId - 店鋪 ID
 * @returns {Promise<Object>} 菜單資料
 */
const getMenuData = async (brandId, storeId) => {
  try {
    const menu = await Menu.findOne({
      brand: brandId,
      store: storeId,
      menuType: 'food',
      isActive: true,
    }).populate([
      {
        path: 'categories.items.dishTemplate',
        model: 'DishTemplate',
        select: 'name description basePrice image tags optionCategories',
        populate: {
          path: 'optionCategories.categoryId',
          model: 'OptionCategory',
          select: 'name inputType options',
          populate: {
            path: 'options.refOption',
            model: 'Option',
            select: 'name price tags refDishTemplate',
          },
        },
      },
      {
        path: 'categories.items.bundle',
        model: 'Bundle',
        select: 'name description image sellingPoint cashPrice pointPrice bundleItems',
        populate: {
          path: 'bundleItems.voucherTemplate',
          select: 'name description voucherType',
        },
      },
    ])

    return menu
  } catch (error) {
    console.error('獲取菜單資料失敗:', error)
    throw error
  }
}

/**
 * 檢查餐點是否應該停售
 * 邏輯參考 MenuOrder.vue 的 isDishSoldOut 方法
 * @param {String} dishTemplateId - 餐點模板 ID
 * @param {Object} inventoryData - 庫存資料
 * @returns {Boolean} 是否應該停售
 */
const shouldSuspendDish = (dishTemplateId, inventoryData) => {
  const inventory = inventoryData[dishTemplateId]
  if (!inventory) return false

  // 最高優先級：手動設為售完
  if (inventory.isSoldOut) {
    return true
  }

  // 次級：如果啟用了可用庫存機制，檢查可用庫存是否為 0
  if (inventory.isInventoryTracked && inventory.enableAvailableStock) {
    return inventory.availableStock <= 0
  }

  return false
}

/**
 * 檢查選項是否應該停售
 * 邏輯參考 MenuOrder.vue 的 isOptionDisabled 方法
 * @param {Object} option - 選項資料
 * @param {Object} inventoryData - 庫存資料
 * @returns {Boolean} 是否應該停售
 */
const shouldSuspendOption = (option, inventoryData) => {
  // 獲取選項的關聯餐點模板 ID
  const refDishTemplateId = option.refOption?.refDishTemplate?._id?.toString()

  // 如果沒有關聯餐點，則不停售
  if (!refDishTemplateId) {
    return false
  }

  // 檢查關聯餐點的庫存狀況
  return shouldSuspendDish(refDishTemplateId, inventoryData)
}

/**
 * 更新餐點狀態
 * @param {String} token - Access Token
 * @param {String} uberStoreId - Uber Eats 店鋪 ID
 * @param {Object} menuData - 菜單資料
 * @param {Object} inventoryData - 庫存資料
 * @returns {Promise<Object>} 更新結果
 */
const updateDishesStatus = async (token, uberStoreId, menuData, inventoryData) => {
  const results = {
    suspended: [],
    resumed: [],
    skipped: [],
    errors: [],
  }

  // 遍歷所有菜單項目
  for (const category of menuData.categories) {
    for (const item of category.items) {
      // 只處理顯示中的餐點項目
      if (!item.isShowing || item.itemType !== 'dish' || !item.dishTemplate) {
        continue
      }

      const dishTemplateId = item.dishTemplate._id.toString()
      const dishName = item.dishTemplate.name

      // 檢查是否有庫存資料
      if (!inventoryData[dishTemplateId]) {
        results.skipped.push({
          itemId: dishTemplateId,
          name: dishName,
          reason: '無庫存記錄',
        })
        continue
      }

      const shouldSuspend = shouldSuspendDish(dishTemplateId, inventoryData)

      try {
        // 使用餐點模板 ID 作為 Uber Eats 的 item ID
        const itemId = dishTemplateId

        if (shouldSuspend) {
          // 停售商品
          await suspendItem(token, uberStoreId, itemId)
          results.suspended.push({
            itemId,
            name: dishName,
            reason: inventoryData[dishTemplateId].isSoldOut ? '手動停售' : '庫存不足（自動停售）',
          })
          console.log(`🔴 已停售: ${dishName}`)
        } else {
          // 恢復供應
          await resumeItem(token, uberStoreId, itemId)
          results.resumed.push({
            itemId,
            name: dishName,
          })
          console.log(`🟢 已恢復供應: ${dishName}`)
        }
      } catch (error) {
        console.error(`更新餐點狀態失敗 (${dishName}):`, error.message)
        results.errors.push({
          itemId: dishTemplateId,
          name: dishName,
          error: error.message,
        })
      }
    }
  }

  return results
}

/**
 * 更新選項（modifier items）狀態
 * @param {String} token - Access Token
 * @param {String} uberStoreId - Uber Eats 店鋪 ID
 * @param {Object} menuData - 菜單資料
 * @param {Object} inventoryData - 庫存資料
 * @returns {Promise<Object>} 更新結果
 */
const updateModifiersStatus = async (token, uberStoreId, menuData, inventoryData) => {
  const results = {
    suspended: [],
    resumed: [],
    skipped: [],
    errors: [],
  }

  const processedOptionIds = new Set()

  // 遍歷所有菜單項目，收集選項
  for (const category of menuData.categories) {
    for (const item of category.items) {
      if (!item.isShowing || item.itemType !== 'dish' || !item.dishTemplate?.optionCategories) {
        continue
      }

      // 遍歷餐點的選項類別
      for (const optionCategory of item.dishTemplate.optionCategories) {
        if (!optionCategory.categoryId?.options) continue

        // 遍歷選項
        for (const option of optionCategory.categoryId.options) {
          const optionId = option.refOption?._id?.toString()
          const optionName = option.refOption?.name

          // 避免重複處理同一個選項
          if (!optionId || processedOptionIds.has(optionId)) continue
          processedOptionIds.add(optionId)

          // 檢查選項是否有關聯餐點
          const refDishTemplateId = option.refOption?.refDishTemplate?._id?.toString()
          if (!refDishTemplateId) {
            results.skipped.push({
              itemId: optionId,
              name: optionName,
              reason: '無關聯餐點',
            })
            continue
          }

          // 檢查關聯餐點是否有庫存資料
          if (!inventoryData[refDishTemplateId]) {
            results.skipped.push({
              itemId: optionId,
              name: optionName,
              reason: '關聯餐點無庫存記錄',
            })
            continue
          }

          // 檢查是否應該停售
          const shouldSuspend = shouldSuspendOption(option, inventoryData)

          try {
            if (shouldSuspend) {
              // 停售選項
              await suspendItem(token, uberStoreId, optionId)
              results.suspended.push({
                itemId: optionId,
                name: optionName,
                refDishTemplateId,
                reason: inventoryData[refDishTemplateId].isSoldOut
                  ? '關聯餐點手動停售'
                  : '關聯餐點庫存不足',
              })
              console.log(`🔴 已停售選項: ${optionName} (關聯餐點庫存問題)`)
            } else {
              // 恢復供應
              await resumeItem(token, uberStoreId, optionId)
              results.resumed.push({
                itemId: optionId,
                name: optionName,
                refDishTemplateId,
              })
              console.log(`🟢 已恢復供應選項: ${optionName}`)
            }
          } catch (error) {
            console.error(`更新選項狀態失敗 (${optionName}):`, error.message)
            results.errors.push({
              itemId: optionId,
              name: optionName,
              error: error.message,
            })
          }
        }
      }
    }
  }

  return results
}

/**
 * 停售商品
 * @param {String} token - Access Token
 * @param {String} storeId - Uber Eats 店鋪 ID
 * @param {String} itemId - 商品 ID
 */
const suspendItem = async (token, storeId, itemId) => {
  try {
    // 使用 suspension_info 物件格式，設定 suspend_until 為很遠的未來時間表示無限期停售
    const futureTimestamp = 8640000000000 // 設定為一個很遠的未來時間（約273年後）

    await axios.post(
      `${BASE_URL}/${storeId}/menus/items/${itemId}`,
      {
        suspension_info: {
          suspension: {
            suspend_until: futureTimestamp,
            reason: null,
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      },
    )
  } catch (error) {
    console.error('停售商品 API 錯誤:', error.response?.data || error.message)
    throw new AppError(`停售商品失敗: ${error.message}`, 500)
  }
}

/**
 * 恢復商品供應
 * @param {String} token - Access Token
 * @param {String} storeId - Uber Eats 店鋪 ID
 * @param {String} itemId - 商品 ID
 */
const resumeItem = async (token, storeId, itemId) => {
  try {
    // 使用 suspension_info 物件格式，設定 suspend_until 為 null 表示恢復供應
    await axios.post(
      `${BASE_URL}/${storeId}/menus/items/${itemId}`,
      {
        suspension_info: {
          suspension: {
            suspend_until: null,
            reason: null,
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      },
    )
  } catch (error) {
    console.error('恢復商品供應 API 錯誤:', error.response?.data || error.message)
    throw new AppError(`恢復商品供應失敗: ${error.message}`, 500)
  }
}
