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
import {
  initializeOrderDefaults,
  updateOrderAmounts,
  cleanupFailedOrder,
  generateOrderNumber,
} from './orderUtils.js'
import { processOrderPaymentComplete } from './orderPayment.js'
import Store from '../../models/Store/Store.js'
import { sendLineMessage, buildOrderConfirmationMessage } from '../notification/lineService.js'
import { markUsedPromotions } from './orderPayment.js'
import { printOrder } from '../printer/printer.js'

/**
 * 創建訂單 - 支援 Bundle 購買 + 預先庫存檢查 + Voucher 折扣 + 線上付款
 */
export const createOrder = async (orderData) => {
  try {
    // 判斷是否為線上付款
    const isOnlinePayment = orderData.paymentType === 'Online'

    // Step 1: 初始化訂單預設值
    initializeOrderDefaults(orderData)

    // Step 2: 如果是線上付款，設定為臨時訂單
    if (isOnlinePayment) {
      orderData.status = 'pending_payment'
      orderData.isFinalized = false
      // 暫時不生成 orderDateCode 和 sequence（付款成功後才生成）
      orderData.orderDateCode = 'PENDING'
      orderData.sequence = 0
    }

    // Step 3: 執行所有預檢查驗證並獲得庫存扣除Map
    const inventoryMap = await validateOrderBeforeCreation(orderData)

    // Step 4: 處理訂單項目
    const { items, dishSubtotal, bundleSubtotal } = await processOrderItems(
      orderData.items,
      orderData,
    )

    // Step 5: 更新訂單數據
    orderData.items = items
    orderData.dishSubtotal = dishSubtotal
    orderData.bundleSubtotal = bundleSubtotal

    // Step 6: 創建並保存訂單
    const order = new Order(orderData)
    updateOrderAmounts(order)
    await order.save()

    // Step 7: 如果是現場付款，才扣除庫存
    if (!isOnlinePayment) {
      try {
        await inventoryService.reduceInventoryForOrder(order, inventoryMap)
      } catch (inventoryError) {
        console.error('Inventory reduction failed after pre-validation:', inventoryError)
        await cleanupFailedOrder(order._id, items)
        throw new AppError('庫存扣除失敗，請重新下單', 400)
      }

      // 現場付款立即標記優惠券為已使用
      try {
        await markUsedPromotions(order)
      } catch (promotionError) {
        console.error('Failed to mark promotions as used:', promotionError)
      }

      // 現場付款的後續處理
      if (order.status === 'paid') {
        await processOrderPaymentComplete(order)
      }

      // 發送 LINE 訊息和列印
      try {
        await sendOrderConfirmationLineMessage(order)
      } catch (lineError) {
        console.error('LINE訊息發送失敗，但訂單創建成功:', lineError)
      }

      try {
        await printOrder(orderData.brand, orderData.store, order._id)
        console.log('🖨️ 訂單列印成功:', order._id)
      } catch (printError) {
        console.error('訂單自動列印失敗，但訂單創建成功:', printError)
      }
    }

    return {
      ...order.toObject(),
      isOnlinePayment,
    }
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
    // TODO: 根據實際前端網址調整
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

/**
 * 完成線上付款訂單
 * @param {string} orderId - 訂單ID
 * @param {Object} paymentResult - 付款結果
 * @returns {Promise<Object>} 完成後的訂單
 */
export const finalizeOnlinePaymentOrder = async (orderId, paymentResult) => {
  try {
    console.log('完成線上付款訂單:', orderId)

    const order = await Order.findById(orderId)

    if (!order) {
      throw new AppError('訂單不存在', 404, 'ORDER_NOT_FOUND')
    }

    if (order.isFinalized) {
      console.log('訂單已完成，略過重複處理')
      return order
    }

    // 生成正式訂單編號
    const { orderDateCode, sequence } = await generateOrderNumber(order.store)
    order.orderDateCode = orderDateCode
    order.sequence = sequence

    // 更新訂單狀態
    order.status = 'paid'
    order.isFinalized = true

    // 記錄線上付款資訊
    order.onlinePayment = {
      platform: 'newebpay',
      merchantOrderNo: paymentResult.merchantOrderNo,
      tradeNo: paymentResult.tradeNo,
      paymentType: paymentResult.paymentType,
      respondCode: paymentResult.respondCode,
      respondMessage: paymentResult.message,
      payTime: paymentResult.payTime,
    }

    // 更新付款方式(根據 NewebPay 回傳的實際付款方式)
    if (paymentResult.paymentType) {
      const { mapNewebpayPaymentType } = await import('../payment/paymentCallbackService.js')
      const mappedPaymentMethod = mapNewebpayPaymentType(paymentResult.paymentType)
      order.paymentMethod = mappedPaymentMethod
      console.log(
        `付款方式已更新: ${paymentResult.paymentType} -> ${mappedPaymentMethod}`,
      )
    }

    await order.save()

    console.log('訂單編號已生成:', { orderDateCode, sequence })

    // 扣除庫存
    try {
      const inventoryMap = await buildInventoryMapForOrder(order)
      await inventoryService.reduceInventoryForOrder(order, inventoryMap)
      console.log('庫存扣除成功')
    } catch (inventoryError) {
      console.error('線上付款訂單庫存扣除失敗:', inventoryError)
      // 記錄錯誤但不回滾訂單，需要人工處理
    }

    // 標記優惠券為已使用
    try {
      await markUsedPromotions(order)
      console.log('優惠券標記成功')
    } catch (promotionError) {
      console.error('標記優惠券失敗:', promotionError)
    }

    // 執行付款完成流程（發放點數等）
    try {
      await processOrderPaymentComplete(order)
      console.log('付款完成流程處理成功')
    } catch (paymentError) {
      console.error('付款完成流程處理失敗:', paymentError)
    }

    // 發送通知
    try {
      await sendOrderConfirmationLineMessage(order)
    } catch (lineError) {
      console.error('LINE訊息發送失敗:', lineError)
    }

    try {
      await printOrder(order.brand, order.store, order._id)
      console.log('🖨️ 訂單列印成功')
    } catch (printError) {
      console.error('訂單列印失敗:', printError)
    }

    console.log('線上付款訂單完成:', order._id)

    return order
  } catch (error) {
    console.error('完成線上付款訂單失敗:', error)
    throw error
  }
}

/**
 * 從已創建的訂單建立庫存扣除 Map
 * @param {Object} order - 訂單物件
 * @returns {Promise<Map>} 庫存扣除 Map
 */
export const buildInventoryMapForOrder = async (order) => {
  try {
    const inventoryMap = new Map()

    for (const item of order.items) {
      if (item.itemType === 'dish') {
        // 獲取餐點實例
        const dishInstance = await DishInstance.findById(item.dishInstance).lean()
        if (!dishInstance) {
          console.warn(`找不到餐點實例: ${item.dishInstance}`)
          continue
        }

        // 加入基礎餐點庫存
        const templateId = dishInstance.templateId.toString()
        const currentQty = inventoryMap.get(templateId) || 0
        inventoryMap.set(templateId, currentQty + item.quantity)

        // 加入選項庫存
        if (dishInstance.options && dishInstance.options.length > 0) {
          dishInstance.options.forEach((option) => {
            if (option.optionId) {
              const optionKey = option.optionId.toString()
              const currentOptionQty = inventoryMap.get(optionKey) || 0
              inventoryMap.set(optionKey, currentOptionQty + item.quantity)
            }
          })
        }
      }
    }

    return inventoryMap
  } catch (error) {
    console.error('建立庫存 Map 失敗:', error)
    throw error
  }
}
