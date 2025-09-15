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

/**
 * 創建訂單 - 支援 Bundle 購買 + 預先庫存檢查 + Voucher 折扣
 */
export const createOrder = async (orderData) => {
  try {
    console.log('Creating order with voucher support...')

    // Step 1: 初始化訂單預設值
    initializeOrderDefaults(orderData)

    // Step 2: 執行所有預檢查驗證
    await validateOrderBeforeCreation(orderData)

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

    console.log(
      `Order created: dishes $${dishSubtotal} + bundles $${bundleSubtotal} = total $${order.total}`,
    )

    // Step 6: 實際扣除庫存 (這時應該不會失敗，因為已經預檢查過)
    try {
      await inventoryService.reduceInventoryForOrder(order)
    } catch (inventoryError) {
      console.error('Inventory reduction failed after pre-validation:', inventoryError)
      await cleanupFailedOrder(order._id, items)
      throw new AppError('庫存扣除失敗，請重新下單', 400)
    }

    // Step 7: 如果是即時付款，處理後續流程
    let result = { ...order.toObject(), pointsAwarded: 0 }

    if (order.status === 'paid') {
      console.log('Processing immediate payment completion...')
      result = await processOrderPaymentComplete(order)
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
      console.log(`Processing dish: ${item.name}`)
      const dishItem = await createDishItem(item, orderData.brand)
      processedItems.push(dishItem)
      dishSubtotal += dishItem.subtotal
    } else if (item.itemType === 'bundle') {
      console.log(`Processing bundle: ${item.name}`)
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