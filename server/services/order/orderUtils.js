/**
 * 訂單工具函數
 * 共用的訂單處理工具函數
 */

import Order from '../../models/Order/Order.js'
import DishInstance from '../../models/Dish/DishInstance.js'
import BundleInstance from '../../models/Promotion/BundleInstance.js'
import { generateDateCode } from '../../utils/date.js'

/**
 * 🧮 更新訂單金額 (支援混合購買)
 */
export const updateOrderAmounts = (order) => {
  console.log('Updating order amounts...')

  // Step 1: 計算小計 (dishes + bundles)
  order.subtotal = order.dishSubtotal + order.bundleSubtotal

  // Step 2: 確保服務費存在
  if (!order.serviceCharge) {
    order.serviceCharge = 0
  }

  // Step 3: 計算總折扣
  order.totalDiscount = order.discounts.reduce((sum, discount) => sum + discount.amount, 0)

  // Step 4: 計算最終總額
  order.total = order.subtotal + order.serviceCharge - order.totalDiscount + order.manualAdjustment

  // 確保金額不為負數
  if (order.total < 0) {
    order.total = 0
  }

  console.log(`Order amounts updated:`)
  console.log(`   - Dish subtotal: $${order.dishSubtotal}`)
  console.log(`   - Bundle subtotal: $${order.bundleSubtotal}`)
  console.log(`   - Subtotal: $${order.subtotal}`)
  console.log(`   - Service charge: $${order.serviceCharge}`)
  console.log(`   - Total discount: $${order.totalDiscount}`)
  console.log(`   - Manual adjustment: $${order.manualAdjustment}`)
  console.log(`   - Final total: $${order.total}`)

  return order
}

/**
 * 🧮 計算訂單金額 (工具函數)
 */
export const calculateOrderAmounts = (items) => {
  let dishSubtotal = 0
  let bundleSubtotal = 0

  items.forEach((item) => {
    if (item.itemType === 'dish') {
      dishSubtotal += item.subtotal || 0
    } else if (item.itemType === 'bundle') {
      bundleSubtotal += item.subtotal || 0
    }
  })

  return {
    dishSubtotal,
    bundleSubtotal,
    totalAmount: dishSubtotal + bundleSubtotal,
  }
}

/**
 * 生成訂單編號
 * @param {String} storeId - 店鋪ID，用於查詢當天訂單數量
 * @returns {Promise<Object>} 包含 orderDateCode 和 sequence 的物件
 */
export const generateOrderNumber = async (storeId) => {
  const dateCode = generateDateCode() // 例如 '250109'

  // 查詢當天已有的訂單數量
  const todayOrderCount = await Order.countDocuments({
    store: storeId,
    orderDateCode: dateCode,
  })

  // 序號 = 當天訂單數 + 1
  const sequence = todayOrderCount + 1

  return {
    orderDateCode: dateCode,
    sequence: sequence,
  }
}

/**
 * 🧹 清理失敗訂單 (當預檢查通過但後續步驟失敗時)
 */
export const cleanupFailedOrder = async (orderId, items) => {
  try {
    console.log('Cleaning up failed order data...')

    // 刪除已創建的實例
    const dishInstanceIds = items
      .filter((item) => item.itemType === 'dish')
      .map((item) => item.dishInstance)

    const bundleInstanceIds = items
      .filter((item) => item.itemType === 'bundle')
      .map((item) => item.bundleInstance)

    if (dishInstanceIds.length > 0) {
      await DishInstance.deleteMany({ _id: { $in: dishInstanceIds } })
      console.log(`Cleaned up ${dishInstanceIds.length} dish instances`)
    }

    if (bundleInstanceIds.length > 0) {
      await BundleInstance.deleteMany({ _id: { $in: bundleInstanceIds } })
      console.log(`Cleaned up ${bundleInstanceIds.length} bundle instances`)
    }

    // 刪除訂單
    if (orderId) {
      await Order.findByIdAndDelete(orderId)
      console.log('Cleaned up failed order')
    }

    console.log('✅ Failed order cleanup completed')
  } catch (cleanupError) {
    console.error('❌ Error cleaning up failed order data:', cleanupError)
    // 不拋出錯誤，避免影響主要的錯誤處理
  }
}

/**
 * 初始化訂單數據的預設值
 */
export const initializeOrderDefaults = (orderData) => {
  // 設置預設手動調整金額
  orderData.manualAdjustment = orderData.manualAdjustment || 0
  orderData.serviceCharge = orderData.serviceCharge || 0
  orderData.discounts = orderData.discounts || []

  return orderData
}
