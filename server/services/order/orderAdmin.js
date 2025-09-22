/**
 * 訂單管理員服務 - 重構版
 * 處理管理員相關的訂單操作（支援 Bundle 訂單 + Voucher 恢復）
 */

import Order from '../../models/Order/Order.js'
import VoucherInstance from '../../models/Promotion/VoucherInstance.js'
import CouponInstance from '../../models/Promotion/CouponInstance.js'
import { AppError } from '../../middlewares/error.js'

// 導入重構後的模組
import {
  getStoreOrders as getStoreOrdersCore,
  getUserOrders as getUserOrdersCore,
  getOrderById as getOrderByIdCore,
} from './orderQueries.js'
import {
  processOrderPaymentComplete,
  processOrderPointsReward,
  restoreUsedVouchers,
  restoreUsedCoupons,
} from './orderPayment.js'
import { updateOrderAmounts } from './orderUtils.js'

/**
 * 獲取店鋪訂單列表
 */
export const getStoreOrders = async (storeId, options = {}) => {
  return await getStoreOrdersCore(storeId, options)
}

/**
 * 🆕 獲取特定用戶的訂單列表（管理員功能）
 * 功能與客戶版本相同，但允許管理員查看任何用戶的訂單
 */
export const getUserOrders = async (userId, options = {}) => {
  return await getUserOrdersCore(userId, options)
}

/**
 * 獲取訂單詳情（管理員）
 */
export const getOrderById = async (orderId, storeId) => {
  return await getOrderByIdCore(orderId, storeId)
}

/**
 * 更新訂單（統一接口）- 支援 Bundle 和點數給予
 */
export const updateOrder = async (orderId, updateData, adminId) => {
  const order = await Order.findById(orderId)

  if (!order) {
    throw new AppError('訂單不存在', 404)
  }

  const previousStatus = order.status

  // 可更新的欄位
  const allowedFields = [
    'status',
    'manualAdjustment',
    'notes',
    'estimatedPickupTime',
    'deliveryInfo',
    'dineInInfo',
    'paymentMethod',
    'paymentType',
    'discounts',
  ]

  // 更新允許的欄位
  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      if (field === 'deliveryInfo' || field === 'dineInInfo') {
        order[field] = { ...order[field], ...updateData[field] }
      } else {
        order[field] = updateData[field]
      }
    }
  })

  // 如果更新了手動調整金額，重新計算總額
  if (updateData.manualAdjustment !== undefined) {
    updateOrderAmounts(order)
  }

  order.updatedAt = new Date()
  await order.save()

  // 處理狀態變為 paid 的後續流程
  let result = { ...order.toObject(), pointsAwarded: 0 }

  if (previousStatus !== 'paid' && order.status === 'paid') {
    try {
      // 檢查是否有 Bundle 項目需要生成券
      const hasBundleItems = order.items.some(
        (item) => item.itemType === 'bundle' && item.bundleInstance,
      )

      if (hasBundleItems || order.user) {
        // 處理 Bundle 券生成和點數給予
        result = await processOrderPaymentComplete(order)
      } else if (order.user) {
        // 只處理點數給予
        const pointsReward = await processOrderPointsReward(order)
        result.pointsAwarded = pointsReward.pointsAwarded
      }
    } catch (error) {
      console.error('管理員更新訂單時處理付款完成流程失敗:', error)
      // 不影響主要的訂單更新流程
    }
  }

  return result
}

/**
 * 管理員取消訂單 - 支援 Bundle 訂單 + Voucher/Coupon 恢復
 */
export const cancelOrder = async (orderId, reason, adminId) => {
  const order = await Order.findById(orderId)

  if (!order) {
    throw new AppError('訂單不存在', 404)
  }

  if (order.status === 'cancelled') {
    throw new AppError('訂單已被取消', 400)
  }

  console.log(`Cancelling order ${orderId} - restoring vouchers and coupons...`)

  // 🔧 恢復使用的 Voucher 狀態
  await restoreUsedVouchers(order)

  // 🔧 恢復使用的 Coupon 狀態
  await restoreUsedCoupons(order)

  // 如果訂單包含已生成的兌換券，需要處理券的狀態
  const bundleInstances = order.items
    .filter((item) => item.itemType === 'bundle' && item.bundleInstance)
    .map((item) => item.bundleInstance)

  if (bundleInstances.length > 0) {
    // 將未使用的兌換券標記為無效
    const relatedVouchers = await VoucherInstance.find({
      createdBy: { $in: bundleInstances },
      isUsed: false,
    })

    for (const voucher of relatedVouchers) {
      voucher.isUsed = true
      voucher.usedAt = new Date()
      voucher.invalidReason = 'ORDER_CANCELLED'
      await voucher.save()
    }

    console.log(`Invalidated ${relatedVouchers.length} vouchers from cancelled bundles`)
  }

  // 還原庫存（如果有餐點項目）
  try {
    // 這裡可以添加庫存還原邏輯，暫時註解
    // const { restoreInventoryForCancelledOrder } = await import('../inventory/stockManagement.js');
    // await restoreInventoryForCancelledOrder(order);//注意adminId 參數
    console.log('訂單取消 - 庫存還原功能待實現')
  } catch (error) {
    console.error('還原庫存失敗:', error)
    // 繼續執行取消流程
  }

  // 退還點數（如果有使用點數）
  if (order.user && order.pointsEarned > 0) {
    try {
      // 這裡可以添加點數退還邏輯，暫時註解
      // const { refundPointsForOrder } = await import('../promotion/pointService.js');
      // await refundPointsForOrder(orderId);
      console.log('訂單取消 - 點數退還功能待實現')
    } catch (error) {
      console.error('退還點數失敗:', error)
      // 繼續執行取消流程
    }
  }

  // 更新訂單狀態
  order.status = 'cancelled'
  order.cancelReason = reason
  order.cancelledBy = adminId
  order.cancelledByModel = 'Admin'
  order.cancelledAt = new Date()

  await order.save()

  console.log(`✅ Order ${orderId} cancelled and vouchers/coupons restored`)

  return order
}
