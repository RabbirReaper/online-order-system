/**
 * 外送訂單庫存驗證服務
 * 處理外送平台訂單的庫存檢查邏輯
 * 與一般訂單不同之處：ID可能無對應、缺庫存不拋出錯誤
 */

import mongoose from 'mongoose'
import Option from '../../../../../models/Dish/Option.js'
import * as inventoryService from '../../../../inventory/stockManagement.js'

/**
 * 驗證外送訂單庫存
 * @param {Object} orderData - 訂單數據
 * @returns {Promise<Object>} 驗證結果 { success: boolean, inventoryMap: Map, issues: Array }
 */
export const validateDeliveryOrderInventory = async (orderData) => {
  const dishItems = orderData.items.filter((item) => item.itemType === 'dish')

  if (dishItems.length === 0) {
    return {
      success: true,
      inventoryMap: new Map(),
      issues: [],
    }
  }

  console.log(`🔍 [外送訂單] 開始驗證 ${dishItems.length} 個餐點項目的庫存...`)

  // 預處理所有需要扣除庫存的餐點（包含主餐點和關聯餐點）
  const inventoryMap = new Map()
  const issues = []

  // Step 1: 收集所有需要檢查的餐點模板ID
  for (const item of dishItems) {
    try {
      // 檢查主餐點的模板ID
      if (item.templateId && mongoose.Types.ObjectId.isValid(item.templateId)) {
        const mainTemplateId = item.templateId.toString()
        inventoryMap.set(mainTemplateId, (inventoryMap.get(mainTemplateId) || 0) + item.quantity)
        console.log(
          `📋 [外送訂單] 主餐點已加入檢查清單: ${item.itemName} (模板ID: ${mainTemplateId})`,
        )
      } else {
        console.log(`⚠️ [外送訂單] 跳過無效或缺失的餐點模板ID: ${item.itemName}`)
        continue // 跳過沒有有效模板ID的項目
      }

      // 檢查 Option 關聯餐點
      if (item.options && item.options.length > 0) {
        for (const optionCategory of item.options) {
          if (optionCategory.selections && optionCategory.selections.length > 0) {
            for (const selection of optionCategory.selections) {
              if (selection.optionId && mongoose.Types.ObjectId.isValid(selection.optionId)) {
                try {
                  const option = await Option.findById(selection.optionId)
                  if (
                    option &&
                    option.refDishTemplate &&
                    mongoose.Types.ObjectId.isValid(option.refDishTemplate)
                  ) {
                    const refTemplateId = option.refDishTemplate.toString()
                    inventoryMap.set(
                      refTemplateId,
                      (inventoryMap.get(refTemplateId) || 0) + item.quantity,
                    )
                    console.log(
                      `🔗 [外送訂單] 關聯餐點已加入檢查清單: ${option.name} -> ${refTemplateId}`,
                    )
                  }
                } catch (error) {
                  console.warn(
                    `⚠️ [外送訂單] 檢查選項關聯餐點時發生錯誤: ${selection.optionId}`,
                    error.message,
                  )
                  // 繼續處理其他選項，不中斷流程
                }
              } else {
                console.log(`⚠️ [外送訂單] 跳過無效的選項ID: ${selection.name}`)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`❌ [外送訂單] 處理餐點項目時發生錯誤: ${item.itemName}`, error)
      issues.push({
        itemName: item.itemName,
        issue: '處理餐點時發生錯誤',
        error: error.message,
      })
    }
  }

  console.log(`📊 [外送訂單] 共需檢查 ${inventoryMap.size} 個餐點模板的庫存`)

  // Step 2: 檢查所有需要扣除庫存的餐點
  for (const [templateId, requiredQuantity] of inventoryMap) {
    try {
      // 根據餐點模板ID查找庫存
      const inventoryItem = await inventoryService.getInventoryItemByDishTemplate(
        orderData.store,
        templateId,
      )

      // 如果沒有庫存記錄，記錄問題但繼續處理
      if (!inventoryItem) {
        console.log(`⚠️ [外送訂單] 餐點模板 ${templateId} 沒有庫存記錄，跳過檢查`)
        continue
      }

      console.log(`🔍 [外送訂單] 檢查庫存: ${inventoryItem.itemName}`)

      // 檢查是否手動設為售完
      if (inventoryItem.isSoldOut) {
        console.warn(`❌ [外送訂單] ${inventoryItem.itemName} 目前已售完`)
        issues.push({
          templateId,
          itemName: inventoryItem.itemName,
          issue: 'sold_out',
          required: requiredQuantity,
          available: 0,
        })
        continue // 不要直接拋出錯誤，記錄問題後繼續
      }

      // 庫存追蹤檢查
      if (inventoryItem.isInventoryTracked) {
        console.log(`📊 [外送訂單] ${inventoryItem.itemName} 已啟用庫存追蹤`)

        // 只有在追蹤庫存 + 啟用可用庫存控制時，才檢查庫存限制
        if (inventoryItem.enableAvailableStock) {
          if (inventoryItem.availableStock < requiredQuantity) {
            console.warn(
              `❌ [外送訂單] ${inventoryItem.itemName} 庫存不足。需要：${requiredQuantity}，剩餘：${inventoryItem.availableStock}`,
            )
            issues.push({
              templateId,
              itemName: inventoryItem.itemName,
              issue: 'insufficient_stock',
              required: requiredQuantity,
              available: inventoryItem.availableStock,
            })
            continue // 記錄問題但不拋出錯誤
          }
          console.log(
            `✅ [外送訂單] ${inventoryItem.itemName} 庫存檢查通過 (需要: ${requiredQuantity}, 可用: ${inventoryItem.availableStock})`,
          )
        } else {
          console.log(`✅ [外送訂單] ${inventoryItem.itemName} 有庫存追蹤但無購買限制`)
        }
      } else {
        console.log(`📊 [外送訂單] ${inventoryItem.itemName} 未啟用庫存追蹤，跳過庫存檢查`)
      }
    } catch (error) {
      console.error(`❌ [外送訂單] 檢查餐點模板 ${templateId} 庫存時發生錯誤:`, error)
      issues.push({
        templateId,
        itemName: `未知餐點 (${templateId})`,
        issue: 'validation_error',
        error: error.message,
      })
    }
  }

  const hasIssues = issues.length > 0

  if (hasIssues) {
    console.warn(`⚠️ [外送訂單] 庫存驗證發現 ${issues.length} 個問題:`)
    issues.forEach((issue) => {
      console.warn(`   - ${issue.itemName}: ${issue.issue}`)
    })
  } else {
    console.log(`✅ [外送訂單] 所有餐點庫存驗證通過`)
  }

  return {
    success: !hasIssues,
    inventoryMap,
    issues,
  }
}

/**
 * 檢查單個餐點的庫存狀態
 * @param {String} storeId - 店鋪ID
 * @param {String} templateId - 餐點模板ID
 * @param {Number} requiredQuantity - 需求數量
 * @returns {Promise<Object>} 檢查結果
 */
export const checkSingleItemInventory = async (storeId, templateId, requiredQuantity) => {
  try {
    if (!templateId || !mongoose.Types.ObjectId.isValid(templateId)) {
      return { available: true, reason: 'no_template_mapping' }
    }

    const inventoryItem = await inventoryService.getInventoryItemByDishTemplate(storeId, templateId)

    if (!inventoryItem) {
      return { available: true, reason: 'no_inventory_record' }
    }

    if (inventoryItem.isSoldOut) {
      return { available: false, reason: 'sold_out' }
    }

    if (inventoryItem.isInventoryTracked && inventoryItem.enableAvailableStock) {
      if (inventoryItem.availableStock < requiredQuantity) {
        return {
          available: false,
          reason: 'insufficient_stock',
          required: requiredQuantity,
          available: inventoryItem.availableStock,
        }
      }
    }

    return { available: true, reason: 'sufficient' }
  } catch (error) {
    console.error(`檢查單個餐點庫存時發生錯誤: ${templateId}`, error)
    return { available: true, reason: 'check_error' }
  }
}
