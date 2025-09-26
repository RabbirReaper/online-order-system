/**
 * 外送訂單庫存扣除服務
 * 處理外送平台訂單的庫存扣除邏輯
 * 與一般訂單不同之處：ID可能無對應、失敗不拋出錯誤
 */

import mongoose from 'mongoose'
import * as inventoryService from '../../../../inventory/stockManagement.js'

/**
 * 為外送訂單扣除庫存（容錯版本）
 * @param {Object} order - 訂單對象
 * @param {Map} inventoryMap - 預處理的庫存扣除Map (templateId -> quantity)
 * @returns {Promise<Object>} 扣除結果 { success: boolean, processed: number, skipped: number, errors: Array }
 */
export const reduceDeliveryOrderInventory = async (order, inventoryMap) => {
  if (!inventoryMap || inventoryMap.size === 0) {
    console.log(`📋 [外送訂單] 沒有需要扣除的庫存項目`)
    return {
      success: true,
      processed: 0,
      skipped: 0,
      errors: [],
    }
  }

  console.log(`🔽 [外送訂單] 開始扣除庫存 (訂單: ${order._id})`)
  console.log(`📊 [外送訂單] 共需處理 ${inventoryMap.size} 個餐點模板的庫存`)

  const results = {
    success: true,
    processed: 0,
    skipped: 0,
    errors: [],
  }

  // 遍歷庫存Map，減少對應庫存
  for (const [templateId, quantity] of inventoryMap) {
    try {
      // 驗證模板ID是否有效
      if (!templateId || !mongoose.Types.ObjectId.isValid(templateId)) {
        console.log(`⚠️ [外送訂單] 跳過無效的餐點模板ID: ${templateId}`)
        results.skipped++
        continue
      }

      // 查找對應的庫存項目
      const inventoryItem = await inventoryService.getInventoryItemByDishTemplate(
        order.store,
        templateId,
      )

      if (!inventoryItem) {
        console.warn(
          `⚠️ [外送訂單] 餐點模板 ${templateId} 在店鋪 ${order.store} 沒有庫存記錄，跳過庫存扣除`,
        )
        results.skipped++
        continue
      }

      if (inventoryItem.isSoldOut) {
        console.warn(`⚠️ [外送訂單] 餐點 ${inventoryItem.itemName} 已停售，跳過庫存扣除`)
        results.skipped++
        continue
      }

      // 如果沒有啟用庫存追蹤，跳過
      if (!inventoryItem.isInventoryTracked) {
        console.log(`📊 [外送訂單] 餐點 ${inventoryItem.itemName} 未啟用庫存追蹤，跳過庫存扣除`)
        results.skipped++
        continue
      }

      // 嘗試減少庫存
      console.log(`🔽 [外送訂單] 正在扣除庫存: ${inventoryItem.itemName} (-${quantity})`)

      await inventoryService.reduceStock({
        storeId: order.store,
        inventoryId: inventoryItem._id,
        quantity: quantity,
        reason: `外送訂單消耗: ${order.platformInfo?.platform?.toUpperCase()} #${order.platformOrderId}`,
        orderId: order._id,
      })

      console.log(`✅ [外送訂單] 成功扣除庫存: ${inventoryItem.itemName} (-${quantity})`)
      results.processed++
    } catch (error) {
      console.error(`❌ [外送訂單] 扣除餐點模板 ${templateId} 庫存失敗:`, error)

      // 記錄錯誤但不中斷處理流程
      results.errors.push({
        templateId,
        quantity,
        error: error.message,
        timestamp: new Date(),
      })

      // 如果有任何扣除失敗，將整體成功狀態設為 false
      results.success = false
    }
  }

  // 記錄最終結果
  console.log(`📊 [外送訂單] 庫存扣除完成:`)
  console.log(`   ✅ 成功處理: ${results.processed} 項`)
  console.log(`   ⚠️ 跳過處理: ${results.skipped} 項`)
  console.log(`   ❌ 處理失敗: ${results.errors.length} 項`)

  if (results.errors.length > 0) {
    console.warn(`⚠️ [外送訂單] 庫存扣除過程中出現錯誤:`)
    results.errors.forEach((error, index) => {
      console.warn(`   ${index + 1}. 模板 ${error.templateId}: ${error.error}`)
    })
  }

  return results
}

/**
 * 為已取消的外送訂單還原庫存（容錯版本）
 * @param {Object} order - 訂單對象
 * @returns {Promise<Object>} 還原結果
 */
export const restoreDeliveryOrderInventory = async (order) => {
  try {
    console.log(`🔄 [外送訂單] 開始還原已取消訂單的庫存 (訂單: ${order._id})`)

    // 使用現有的還原庫存函數，但加上錯誤處理
    await inventoryService.restoreInventoryForCancelledOrder(order)

    console.log(`✅ [外送訂單] 成功還原訂單庫存`)

    return {
      success: true,
      message: '庫存還原成功',
    }
  } catch (error) {
    console.error(`❌ [外送訂單] 還原庫存失敗:`, error)

    return {
      success: false,
      error: error.message,
      message: '庫存還原失敗，但不影響訂單取消',
    }
  }
}

/**
 * 檢查外送訂單是否可以進行庫存操作
 * @param {Object} order - 訂單對象
 * @returns {Boolean} 是否可以操作庫存
 */
export const canProcessInventoryForDeliveryOrder = (order) => {
  // 檢查訂單是否來自外送平台
  if (!order.platformInfo || !order.platformInfo.platform) {
    return false
  }

  // 檢查訂單是否有餐點項目
  const dishItems = order.items?.filter((item) => item.itemType === 'dish') || []
  if (dishItems.length === 0) {
    return false
  }

  // 檢查是否為已付款狀態（外送訂單通常已付款）
  if (order.status !== 'paid') {
    return false
  }

  return true
}

/**
 * 為單個餐點扣除庫存（外送訂單專用）
 * @param {String} storeId - 店鋪ID
 * @param {String} templateId - 餐點模板ID
 * @param {Number} quantity - 數量
 * @param {String} orderId - 訂單ID
 * @param {String} platformName - 平台名稱
 * @returns {Promise<Object>} 扣除結果
 */
export const reduceSingleItemForDelivery = async (
  storeId,
  templateId,
  quantity,
  orderId,
  platformName,
) => {
  try {
    if (!templateId || !mongoose.Types.ObjectId.isValid(templateId)) {
      return { success: false, reason: 'invalid_template_id' }
    }

    const inventoryItem = await inventoryService.getInventoryItemByDishTemplate(storeId, templateId)

    if (!inventoryItem) {
      return { success: false, reason: 'no_inventory_record' }
    }

    if (!inventoryItem.isInventoryTracked) {
      return { success: true, reason: 'not_tracked' }
    }

    if (inventoryItem.isSoldOut) {
      return { success: false, reason: 'sold_out' }
    }

    await inventoryService.reduceStock({
      storeId,
      inventoryId: inventoryItem._id,
      quantity,
      reason: `外送訂單消耗: ${platformName?.toUpperCase()} 訂單`,
      orderId,
    })

    return {
      success: true,
      reason: 'reduced',
      itemName: inventoryItem.itemName,
      reducedQuantity: quantity,
    }
  } catch (error) {
    console.error(`扣除單個餐點庫存失敗: ${templateId}`, error)
    return {
      success: false,
      reason: 'reduction_error',
      error: error.message,
    }
  }
}
