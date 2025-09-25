/**
 * 訂單驗證服務
 * 處理訂單創建前的各種驗證邏輯
 */

import VoucherInstance from '../../models/Promotion/VoucherInstance.js'
import Option from '../../models/Dish/Option.js'
import { AppError } from '../../middlewares/error.js'
import * as inventoryService from '../inventory/stockManagement.js'
import * as bundleService from '../bundle/bundleService.js'

/**
 * 🔍 預先驗證並處理 Voucher 折扣
 */
export const validateAndProcessVouchersBeforeOrder = async (orderData) => {
  if (!orderData.discounts || orderData.discounts.length === 0) {
    return // 沒有折扣，跳過檢查
  }

  const voucherDiscounts = orderData.discounts.filter(
    (discount) => discount.discountModel === 'VoucherInstance',
  )

  if (voucherDiscounts.length === 0) {
    return // 沒有 voucher 折扣，跳過檢查
  }

  // console.log(`Validating ${voucherDiscounts.length} voucher discounts...`)

  for (const voucherDiscount of voucherDiscounts) {
    try {
      // 驗證 voucher 是否存在且可用
      const voucher = await VoucherInstance.findOne({
        _id: voucherDiscount.refId,
        brand: orderData.brand,
        user: orderData.user,
        isUsed: false,
      }).populate('exchangeDishTemplate', 'name basePrice')

      if (!voucher) {
        throw new AppError(`兌換券不存在或已被使用`, 404)
      }

      // 檢查 voucher 是否已過期
      if (voucher.expiryDate < new Date()) {
        throw new AppError(`兌換券 ${voucher.voucherName} 已過期`, 400)
      }

      // 驗證訂單中是否有對應的餐點
      const targetDish = voucher.exchangeDishTemplate
      const matchingOrderItem = orderData.items.find(
        (item) => item.itemType === 'dish' && item.templateId === targetDish._id.toString(),
      )

      if (!matchingOrderItem) {
        throw new AppError(`訂單中沒有 ${targetDish.name}，無法使用此兌換券`, 400)
      }

      // 計算並驗證折扣金額（應該等於餐點基礎價格）
      const expectedDiscountAmount = targetDish.basePrice
      if (voucherDiscount.amount !== expectedDiscountAmount) {
        // console.log(
        //   `Auto-correcting voucher discount amount: ${voucherDiscount.amount} -> ${expectedDiscountAmount}`,
        // )
        voucherDiscount.amount = expectedDiscountAmount
      }

      // console.log(
      //   `✅ Voucher ${voucher.voucherName} validation passed (discount: $${voucherDiscount.amount})`,
      // )
    } catch (error) {
      console.error(`Voucher validation failed:`, error)
      throw error
    }
  }

  // console.log('✅ All voucher validations passed')
}

/**
 * 🔍 預先檢查所有餐點庫存（包含關聯餐點）
 */
export const validateInventoryBeforeOrder = async (orderData) => {
  const dishItems = orderData.items.filter((item) => item.itemType === 'dish')

  if (dishItems.length === 0) {
    return new Map() // 沒有餐點項目，返回空Map
  }

  // console.log(`Validating inventory for ${dishItems.length} dish items...`)

  // Step 1: 預處理所有需要扣除庫存的餐點（包含主餐點和關聯餐點）
  const inventoryMap = new Map()

  for (const item of dishItems) {
    // 添加主餐點
    const mainTemplateId = item.templateId.toString()
    inventoryMap.set(mainTemplateId, (inventoryMap.get(mainTemplateId) || 0) + item.quantity)

    // 檢查 Option 關聯餐點
    if (item.options && item.options.length > 0) {
      for (const optionCategory of item.options) {
        if (optionCategory.selections && optionCategory.selections.length > 0) {
          for (const selection of optionCategory.selections) {
            if (selection.optionId) {
              try {
                const option = await Option.findById(selection.optionId)
                if (option && option.refDishTemplate) {
                  const refTemplateId = option.refDishTemplate.toString()
                  // 每個餐點項目的每個選項只扣除1個關聯餐點庫存
                  inventoryMap.set(
                    refTemplateId,
                    (inventoryMap.get(refTemplateId) || 0) + item.quantity,
                  )
                  // console.log(
                  //   `Found option ${option.name} linked to dish template ${refTemplateId}`,
                  // )
                }
              } catch (error) {
                console.error(`Error checking option ${selection.optionId}:`, error)
                // 繼續處理其他選項，不中斷流程
              }
            }
          }
        }
      }
    }
  }

  // console.log(`Total templates to check inventory: ${inventoryMap.size}`)

  // Step 2: 檢查所有需要扣除庫存的餐點
  for (const [templateId, requiredQuantity] of inventoryMap) {
    try {
      // 根據餐點模板ID查找庫存
      const inventoryItem = await inventoryService.getInventoryItemByDishTemplate(
        orderData.store,
        templateId,
      )

      // 如果沒有庫存記錄，跳過檢查
      if (!inventoryItem) {
        // console.log(`Template ${templateId} has no inventory record, skipping check`)
        continue
      }

      // 檢查是否手動設為售完（這個總是要檢查）
      if (inventoryItem.isSoldOut) {
        throw new AppError(`很抱歉，${inventoryItem.itemName} 目前已售完`, 400)
      }

      // 🔥 核心邏輯：enableAvailableStock 只有在 isInventoryTracked = true 時才有效
      if (inventoryItem.isInventoryTracked) {
        // console.log(
        //   `📊 ${inventoryItem.itemName} inventory tracking enabled - will record stock changes`,
        // )

        // 只有在追蹤庫存 + 啟用可用庫存控制時，才檢查庫存限制
        if (inventoryItem.enableAvailableStock) {
          if (inventoryItem.availableStock < requiredQuantity) {
            throw new AppError(
              `很抱歉，${inventoryItem.itemName} 庫存不足。需要：${requiredQuantity}，剩餘：${inventoryItem.availableStock}`,
              400,
            )
          }
          // console.log(
          //   `✅ ${inventoryItem.itemName} stock limit check passed (need: ${requiredQuantity}, available: ${inventoryItem.availableStock})`,
          // )
        } else {
          // console.log(`✅ ${inventoryItem.itemName} inventory tracked but no purchase limit`)
        }
      } else {
        // console.log(
        //   `📊 ${inventoryItem.itemName} inventory tracking disabled - no stock recording or limits`,
        // )
        // isInventoryTracked = false 時，enableAvailableStock 應該也是 false
        if (inventoryItem.enableAvailableStock) {
          console.warn(
            `⚠️  ${inventoryItem.itemName} has enableAvailableStock=true but isInventoryTracked=false - logical inconsistency!`,
          )
        }
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error // 重新拋出業務邏輯錯誤
      } else {
        console.error(`Error checking inventory for template ${templateId}:`, error)
        throw new AppError(`檢查庫存時發生錯誤`, 500)
      }
    }
  }

  // console.log('✅ All dish inventory validation passed')
  return inventoryMap
}

/**
 * 🔍 預先檢查 Bundle 購買資格
 */
export const validateBundlesBeforeOrder = async (orderData) => {
  const bundleItems = orderData.items.filter((item) => item.itemType === 'bundle')

  if (bundleItems.length === 0) {
    return // 沒有Bundle項目，跳過檢查
  }

  console.log(`Validating bundle purchase eligibility for ${bundleItems.length} bundle items...`)

  for (const item of bundleItems) {
    try {
      await bundleService.validateBundlePurchase(
        item.bundleId || item.templateId,
        orderData.user,
        item.quantity,
        orderData.store,
      )

      console.log(`✅ Bundle ${item.name} purchase eligibility check passed`)
    } catch (error) {
      console.error(`Bundle ${item.name} purchase eligibility check failed:`, error)
      throw error // 直接拋出，因為 bundleService 已經包裝了適當的錯誤訊息
    }
  }

  console.log('✅ All bundle purchase eligibility validation passed')
}

/**
 * 綜合驗證函數 - 執行所有預檢查
 */
export const validateOrderBeforeCreation = async (orderData) => {
  // console.log('Starting comprehensive order validation...')

  // Step 1: 預先檢查所有餐點庫存（包含關聯餐點）
  const inventoryMap = await validateInventoryBeforeOrder(orderData)

  // Step 2: 預先檢查 Bundle 購買資格
  await validateBundlesBeforeOrder(orderData)

  // Step 3: 預先驗證並處理 Voucher 折扣
  await validateAndProcessVouchersBeforeOrder(orderData)

  // console.log('✅ All order validations completed successfully')

  return inventoryMap
}
