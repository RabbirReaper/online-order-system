/**
 * 平台管理服務
 * 處理多平台同步邏輯
 */

import PlatformStore from '../../../models/DeliverPlatform/platformStore.js'
import Menu from '../../../models/Menu/Menu.js'
import Store from '../../../models/Store/Store.js'
import { AppError } from '../../../middlewares/error.js'
import * as ubereatsMenu from '../platforms/ubereats/ubereatsMenu.js'
import * as foodpandaMenu from '../platforms/foodpanda/foodpandaMenu.js'

/**
 * 同步菜單到所有啟用的平台
 * @param {String} brandId - 品牌ID
 * @param {String} storeId - 店鋪ID
 * @returns {Promise<Object>} 同步結果
 */
export const syncMenu = async (brandId, storeId) => {
  // 查詢該店鋪啟用的平台
  const platformStores = await PlatformStore.find({
    brand: brandId,
    store: storeId,
    isActive: true,
  })

  if (!platformStores || platformStores.length === 0) {
    throw new AppError('該店鋪未啟用任何外送平台', 400)
  }

  // 獲取菜單
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

  if (!menu) {
    throw new AppError('找不到啟用的食品菜單', 404)
  }

  // 獲取營業時間
  const store = await Store.findById(storeId).select('businessHours')
  // console.log(store.businessHours)

  // 同步到各平台
  const results = []

  for (const platformStore of platformStores) {
    try {
      let result

      switch (platformStore.platform) {
        case 'ubereats':
          result = await ubereatsMenu.syncMenuToUberEats(
            platformStore.platformStoreId,
            menu.toObject(),
            store.businessHours,
          )
          break

        case 'foodpanda':
          result = await foodpandaMenu.syncMenuToFoodpanda(
            platformStore.platformStoreId,
            menu.toObject(),
            store.businessHours,
          )
          break

        default:
          throw new AppError(`不支援的平台: ${platformStore.platform}`, 400)
      }

      // 更新同步時間
      platformStore.menuLastSync = new Date()
      await platformStore.save()

      results.push({
        platform: platformStore.platform,
        success: true,
        syncTime: platformStore.menuLastSync,
      })
    } catch (error) {
      console.error(`${platformStore.platform} 菜單同步失敗:`, error.message)
      results.push({
        platform: platformStore.platform,
        success: false,
        error: error.message,
      })
    }
  }

  return {
    storeId,
    syncResults: results,
  }
}
