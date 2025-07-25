/**
 * 訂單管理員服務
 * 處理管理員相關的訂單操作（支援 Bundle 訂單 + Voucher 恢復）
 */

import Order from '../../models/Order/Order.js'
import VoucherInstance from '../../models/Promotion/VoucherInstance.js'
import CouponInstance from '../../models/Promotion/CouponInstance.js'
import { AppError } from '../../middlewares/error.js'
import { parseDateString, getStartOfDay, getEndOfDay } from '../../utils/date.js'
// 直接導入而非動態導入
import {
  processOrderPaymentComplete,
  processOrderPointsReward,
  updateOrderAmounts,
} from './orderCustomer.js'

/**
 * 獲取店鋪訂單列表
 */
export const getStoreOrders = async (storeId, options = {}) => {
  const { status, orderType, fromDate, toDate, page = 1, limit = 20 } = options

  const query = { store: storeId }

  if (status) {
    query.status = status
  }

  if (orderType) {
    query.orderType = orderType
  }

  // 處理日期範圍
  if (fromDate || toDate) {
    query.createdAt = {}

    if (fromDate) {
      try {
        const startDateTime = getStartOfDay(parseDateString(fromDate))
        query.createdAt.$gte = startDateTime.toJSDate()
      } catch (error) {
        console.error('解析開始日期失敗:', error)
        throw new AppError('無效的開始日期格式', 400)
      }
    }

    if (toDate) {
      try {
        const endDateTime = getEndOfDay(parseDateString(toDate))
        query.createdAt.$lte = endDateTime.toJSDate()
      } catch (error) {
        console.error('解析結束日期失敗:', error)
        throw new AppError('無效的結束日期格式', 400)
      }
    }
  }

  const skip = (page - 1) * limit
  const total = await Order.countDocuments(query)

  // 查詢訂單，包含 Bundle 資訊
  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('items.dishInstance', 'name finalPrice options')
    .populate('items.bundleInstance', 'name finalPrice')
    .populate('user', 'name email phone')
    .lean()

  const totalPages = Math.ceil(total / limit)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return {
    orders,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage,
      hasPrevPage,
    },
  }
}

/**
 * 🆕 獲取特定用戶的訂單列表（管理員功能）
 * 功能與客戶版本相同，但允許管理員查看任何用戶的訂單
 */
export const getUserOrders = async (userId, options = {}) => {
  const { brandId, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options

  const query = { user: userId }
  if (brandId) query.brand = brandId

  const skip = (page - 1) * limit
  const sort = {}
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1

  const total = await Order.countDocuments(query)

  const orders = await Order.find(query)
    .populate('store', 'name address')
    .populate('brand', 'name')
    .populate('items.dishInstance', 'name finalPrice options')
    .populate('items.bundleInstance', 'name finalPrice')
    .sort(sort)
    .skip(skip)
    .limit(limit)

  const totalPages = Math.ceil(total / limit)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return {
    orders,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage,
      hasPrevPage,
    },
  }
}

/**
 * 獲取訂單詳情（管理員）
 */
export const getOrderById = async (orderId, storeId) => {
  const query = { _id: orderId }
  if (storeId) query.store = storeId

  const order = await Order.findOne(query)
    .populate('items.dishInstance', 'name finalPrice options')
    .populate({
      path: 'items.bundleInstance',
      select: 'name finalPrice templateId',
      populate: {
        path: 'templateId',
        select: 'bundleItems',
        populate: {
          path: 'bundleItems.voucherTemplate',
          select: 'name exchangeDishTemplate',
          populate: {
            path: 'exchangeDishTemplate',
            select: 'name basePrice',
          },
        },
      },
    })
    .populate('user', 'name email phone')
    .lean()

  if (!order) {
    throw new AppError('訂單不存在', 404)
  }

  return order
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
    // await restoreInventoryForCancelledOrder(order);
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

/**
 * 恢復使用的 Voucher 狀態
 */
const restoreUsedVouchers = async (order) => {
  const voucherDiscounts = order.discounts.filter(
    (discount) => discount.discountModel === 'VoucherInstance',
  )

  if (voucherDiscounts.length === 0) {
    return
  }

  console.log(`Restoring ${voucherDiscounts.length} used vouchers...`)

  for (const voucherDiscount of voucherDiscounts) {
    try {
      const voucher = await VoucherInstance.findById(voucherDiscount.refId)

      if (voucher && voucher.isUsed) {
        // 檢查兌換券是否過期
        const now = new Date()
        if (voucher.expiryDate < now) {
          console.log(`Voucher ${voucher.voucherName} has expired, cannot restore`)
          continue
        }

        // 恢復兌換券狀態
        voucher.isUsed = false
        voucher.usedAt = null
        voucher.orderId = null
        await voucher.save()

        console.log(`✅ Restored voucher ${voucher.voucherName}`)
      }
    } catch (error) {
      console.error(`Failed to restore voucher ${voucherDiscount.refId}:`, error)
      // 不拋出錯誤，繼續處理其他兌換券
    }
  }
}

/**
 * 恢復使用的 Coupon 狀態
 */
const restoreUsedCoupons = async (order) => {
  const couponDiscounts = order.discounts.filter(
    (discount) => discount.discountModel === 'CouponInstance',
  )

  if (couponDiscounts.length === 0) {
    return
  }

  console.log(`Restoring ${couponDiscounts.length} used coupons...`)

  for (const couponDiscount of couponDiscounts) {
    try {
      const coupon = await CouponInstance.findById(couponDiscount.refId)

      if (coupon && coupon.isUsed) {
        // 檢查優惠券是否過期
        const now = new Date()
        if (coupon.expiryDate < now) {
          console.log(`Coupon has expired, cannot restore`)
          continue
        }

        // 恢復優惠券狀態
        coupon.isUsed = false
        coupon.usedAt = null
        coupon.order = null
        await coupon.save()

        console.log(`✅ Restored coupon`)
      }
    } catch (error) {
      console.error(`Failed to restore coupon ${couponDiscount.refId}:`, error)
      // 不拋出錯誤，繼續處理其他優惠券
    }
  }
}
