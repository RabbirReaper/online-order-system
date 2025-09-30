/**
 * 訂單創建服務
 * 處理訂單創建的核心邏輯
 */

import Order from '../../models/Order/Order.js'
import DishInstance from '../../models/Dish/DishInstance.js'
import { AppError } from '../../middlewares/error.js'
import * as inventoryService from '../inventory/stockManagement.js'
import * as bundleInstanceService from '../bundle/bundleInstance.js'
import { validateOrderBeforeCreation } from './orderValidation.js'
import { initializeOrderDefaults, updateOrderAmounts, cleanupFailedOrder } from './orderUtils.js'
import { processOrderPaymentComplete } from './orderPayment.js'
import Store from '../../models/Store/Store.js'
import { sendLineMessage, buildOrderConfirmationMessage } from '../notification/lineService.js'
import { markUsedPromotions } from './orderPayment.js'

/**
 * 創建訂單 - 支援 Bundle 購買 + 預先庫存檢查 + Voucher 折扣
 */
export const createOrder = async (orderData) => {
  try {
    // Step 1: 初始化訂單預設值
    initializeOrderDefaults(orderData)

    // Step 2: 執行所有預檢查驗證並獲得庫存扣除Map
    const inventoryMap = await validateOrderBeforeCreation(orderData)

    // Step 3: 處理訂單項目
    const { items, dishSubtotal, bundleSubtotal } = await processOrderItems(
      orderData.items,
      orderData,
    )

    // Step 4: 更新訂單數據
    orderData.items = items
    orderData.dishSubtotal = dishSubtotal
    orderData.bundleSubtotal = bundleSubtotal

    // Step 5: 創建並保存訂單
    const order = new Order(orderData)
    updateOrderAmounts(order)
    await order.save()

    // Step 6: 實際扣除庫存 (使用預處理的inventoryMap)
    try {
      await inventoryService.reduceInventoryForOrder(order, inventoryMap)
    } catch (inventoryError) {
      console.error('Inventory reduction failed after pre-validation:', inventoryError)
      await cleanupFailedOrder(order._id, items)
      throw new AppError('庫存扣除失敗，請重新下單', 400)
    }

    // Step 7: 立即標記所有使用的優惠券為已使用（Voucher + Coupon）
    // 在訂單創建時統一標記，避免重複使用和邏輯不一致問題
    try {
      await markUsedPromotions(order)
    } catch (promotionError) {
      console.error('Failed to mark promotions as used:', promotionError)
      // 不拋出錯誤，避免影響主要流程，但記錄錯誤
    }

    // Step 8: 如果是即時付款，處理後續流程
    let result = { ...order.toObject(), pointsAwarded: 0 }

    if (order.status === 'paid') {
      result = await processOrderPaymentComplete(order)
    }

    // Step 9: 發送LINE確認訊息（自取或外送訂單）
    try {
      await sendOrderConfirmationLineMessage(order)
    } catch (lineError) {
      // LINE訊息發送失敗不影響訂單創建
      console.error('LINE訊息發送失敗，但訂單創建成功:', lineError)
    }

    return result
  } catch (error) {
    console.error('Failed to create order:', error)
    throw error
  }
}

/**
 * 處理訂單項目 - 創建餐點和 Bundle 項目
 */
const processOrderItems = async (items, orderData) => {
  const processedItems = []
  let dishSubtotal = 0
  let bundleSubtotal = 0

  for (const item of items) {
    if (item.itemType === 'dish') {
      const dishItem = await createDishItem(item, orderData.brand)
      processedItems.push(dishItem)
      dishSubtotal += dishItem.subtotal
    } else if (item.itemType === 'bundle') {
      const bundleItem = await createBundleItem(
        item,
        orderData.user,
        orderData.store,
        orderData.brand,
      )
      processedItems.push(bundleItem)
      bundleSubtotal += bundleItem.subtotal
    }
  }

  return {
    items: processedItems,
    dishSubtotal,
    bundleSubtotal,
  }
}

/**
 * 創建餐點項目
 */
export const createDishItem = async (item, brandId) => {
  // 建立餐點實例
  const dishInstance = new DishInstance({
    brand: brandId,
    templateId: item.templateId,
    name: item.name,
    basePrice: item.basePrice,
    options: item.options || [],
    finalPrice: item.finalPrice || item.subtotal || item.basePrice * item.quantity,
  })

  await dishInstance.save()

  return {
    itemType: 'dish',
    itemName: item.name,
    dishInstance: dishInstance._id,
    quantity: item.quantity,
    subtotal: item.subtotal || dishInstance.finalPrice * item.quantity,
    note: item.note || '',
  }
}

/**
 * 創建 Bundle 項目
 */
export const createBundleItem = async (item, userId, storeId, brandId) => {
  // 創建 Bundle 實例 - 記錄購買的 Bundle
  const bundleInstanceData = {
    templateId: item.bundleId || item.templateId,
    brand: brandId,
    user: userId,
    purchasedAt: new Date(),
  }

  const bundleInstance = await bundleInstanceService.createInstance(bundleInstanceData)

  return {
    itemType: 'bundle',
    itemName: item.name || bundleInstance.name,
    bundleInstance: bundleInstance._id, // 記錄購買的 Bundle 實例
    quantity: item.quantity,
    subtotal: item.subtotal || bundleInstance.finalPrice * item.quantity,
    note: item.note || '',
  }
}

/**
 * 發送LINE訂單確認訊息
 * @param {Object} order - 訂單物件
 * @returns {Promise<boolean>} 是否發送成功
 */
export const sendOrderConfirmationLineMessage = async (order) => {
  try {
    // 檢查訂單類型是否為自取或外送
    if (!['takeout', 'delivery'].includes(order.orderType)) {
      console.log(`訂單類型 ${order.orderType} 不需要發送LINE訊息`)
      return false
    }

    // 檢查是否有LINE用戶ID
    if (!order.customerInfo?.lineUniqueId) {
      console.log('訂單沒有LINE用戶ID，無法發送LINE訊息')
      return false
    }

    // 獲取店家資訊
    const store = await Store.findById(order.store).lean()
    if (!store) {
      console.error('找不到店家資訊')
      return false
    }

    // 檢查店家是否啟用LINE點餐功能
    if (!store.enableLineOrdering) {
      console.log('店家未啟用LINE點餐功能')
      return false
    }

    // 檢查店家是否有LINE Channel Access Token
    if (!store.lineChannelAccessToken || store.lineChannelAccessToken.trim() === '') {
      console.log('店家未設定LINE Channel Access Token')
      return false
    }

    // 建立確認訂單的網址
    const confirmUrl = `${'https://rabbirorder.com' || 'http://localhost:5173'}/stores/${order.brand}/${order.store}/order-confirm/${order._id}`

    // 建立訊息內容
    const message = buildOrderConfirmationMessage(order, confirmUrl)

    // 發送LINE訊息
    const success = await sendLineMessage(
      store.lineChannelAccessToken,
      order.customerInfo.lineUniqueId,
      message,
    )

    if (success) {
      console.log(`訂單 ${order._id} LINE確認訊息發送成功`)
    } else {
      console.error(`訂單 ${order._id} LINE確認訊息發送失敗`)
    }

    return success
  } catch (error) {
    console.error('發送LINE訂單確認訊息時發生錯誤:', error)
    return false
  }
}
