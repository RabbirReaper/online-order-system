/**
 * 訂單支付服務
 * 處理訂單支付相關的所有邏輯
 */

import Order from '../../models/Order/Order.js'
import Bundle from '../../models/Promotion/Bundle.js'
import BundleInstance from '../../models/Promotion/BundleInstance.js'
import VoucherInstance from '../../models/Promotion/VoucherInstance.js'
import CouponInstance from '../../models/Promotion/CouponInstance.js'
import { AppError } from '../../middlewares/error.js'
import * as bundleInstanceService from '../bundle/bundleInstance.js'
import * as pointService from '../promotion/pointService.js'
import * as pointRuleService from '../promotion/pointRuleService.js'

/**
 * 處理訂單付款完成後的流程 - 支援 Voucher 標記
 */
export const processOrderPaymentComplete = async (order) => {
  let pointsReward = { pointsAwarded: 0 }

  console.log(`Processing payment completion for order ${order._id}...`)

  try {
    // 1. 拆解 Bundle 生成 VoucherInstance 給用戶
    for (const item of order.items) {
      if (item.itemType === 'bundle') {
        console.log(`Generating vouchers for bundle: ${item.itemName}`)
        await bundleInstanceService.generateVouchersForBundle(
          item.bundleInstance,
          order.brand,
          order.user,
        )
      }
    }

    // 2. 標記使用的 Voucher 為已使用
    await markUsedVouchers(order)

    // 3. 標記使用的 Coupon 為已使用
    await markUsedCoupons(order)

    // 4. 更新 Bundle 銷售統計
    await updateBundleSalesStats(order)

    // 5. 處理點數給予
    if (order.user) {
      console.log('Processing points reward...')
      pointsReward = await processOrderPointsReward(order)
    }

    // 6. 保存訂單更新
    await order.save()

    console.log(`✅ Payment completion processed:`)
    console.log(`   - Points awarded: ${pointsReward.pointsAwarded}`)

    return {
      ...order.toObject(),
      pointsAwarded: pointsReward.pointsAwarded,
    }
  } catch (error) {
    console.error('Failed to process payment completion:', error)
    throw error
  }
}

/**
 * 標記使用的 Voucher 為已使用
 */
export const markUsedVouchers = async (order) => {
  const voucherDiscounts = order.discounts.filter(
    (discount) => discount.discountModel === 'VoucherInstance',
  )

  if (voucherDiscounts.length === 0) {
    return
  }

  console.log(`Marking ${voucherDiscounts.length} vouchers as used...`)

  for (const voucherDiscount of voucherDiscounts) {
    try {
      const voucher = await VoucherInstance.findById(voucherDiscount.refId)

      if (voucher && !voucher.isUsed) {
        voucher.isUsed = true
        voucher.usedAt = new Date()
        voucher.orderId = order._id // 記錄在哪個訂單中使用
        await voucher.save()

        console.log(`✅ Marked voucher ${voucher.voucherName} as used`)
      }
    } catch (error) {
      console.error(`Failed to mark voucher ${voucherDiscount.refId} as used:`, error)
      // 不拋出錯誤，避免影響主要流程
    }
  }
}

/**
 * 標記使用的 Coupon 為已使用
 */
export const markUsedCoupons = async (order) => {
  const couponDiscounts = order.discounts.filter(
    (discount) => discount.discountModel === 'CouponInstance',
  )

  if (couponDiscounts.length === 0) {
    return
  }

  console.log(`Marking ${couponDiscounts.length} coupons as used...`)

  for (const couponDiscount of couponDiscounts) {
    try {
      const coupon = await CouponInstance.findById(couponDiscount.refId)

      if (coupon && !coupon.isUsed) {
        coupon.isUsed = true
        coupon.usedAt = new Date()
        coupon.order = order._id
        await coupon.save()

        console.log(`✅ Marked coupon as used`)
      }
    } catch (error) {
      console.error(`Failed to mark coupon ${couponDiscount.refId} as used:`, error)
      // 不拋出錯誤，避免影響主要流程
    }
  }
}

/**
 * 更新 Bundle 銷售統計
 */
export const updateBundleSalesStats = async (order) => {
  for (const item of order.items) {
    if (item.itemType === 'bundle') {
      const bundleInstance = await BundleInstance.findById(item.bundleInstance)
      if (bundleInstance) {
        await Bundle.findByIdAndUpdate(bundleInstance.templateId, {
          $inc: { totalSold: item.quantity },
        })
        console.log(`Updated sales stats for bundle: ${bundleInstance.name} (+${item.quantity})`)
      }
    }
  }
}

/**
 * 🎊 處理訂單點數獎勵 (改進版 - 支援混合購買)
 */
export const processOrderPointsReward = async (order) => {
  try {
    console.log(`Processing points reward for order ${order._id}`)

    if (!order.user) {
      console.log('No user found, skipping points reward')
      return { pointsAwarded: 0 }
    }

    // 🎯 使用本地導入的 pointRuleService 計算點數
    const pointsCalculation = await pointRuleService.calculateOrderPoints(
      order.brand,
      order.total, // 使用訂單總額，包含 dishSubtotal + bundleSubtotal
    )

    if (!pointsCalculation || pointsCalculation.points === 0) {
      console.log('No points awarded - rule not met or no active rules')
      return { pointsAwarded: 0 }
    }

    // 檢查是否已經給予過點數
    const existingPoints = await pointService.getUserPoints(order.user, order.brand)
    const alreadyRewarded = existingPoints.some(
      (point) =>
        point.sourceModel === 'Order' &&
        point.sourceId &&
        point.sourceId.toString() === order._id.toString(),
    )

    if (alreadyRewarded) {
      console.log('Points already awarded, skipping duplicate reward')
      return { pointsAwarded: 0 }
    }

    // 更新訂單中的點數相關資訊
    order.pointsEarned = pointsCalculation.points
    order.pointsCalculationBase = order.total // 🔥 記錄用於計算的金額
    order.pointsRule = {
      ruleId: pointsCalculation.rule._id,
      ruleName: pointsCalculation.rule.name,
      conversionRate: pointsCalculation.rule.conversionRate,
      minimumAmount: pointsCalculation.rule.minimumAmount,
    }

    // 給用戶發放點數 - 使用正確的枚舉值和參數順序
    const sourceInfo = {
      model: 'Order',
      id: order._id,
    }

    await pointService.addPointsToUser(
      order.user, // userId
      order.brand, // brandId
      pointsCalculation.points, // amount
      '滿額贈送', // source - 使用 PointInstance 模型中的有效枚舉值
      sourceInfo, // sourceInfo
      pointsCalculation.rule.validityDays || 60, // validityDays，預設60天
    )

    console.log(`✅ Awarded ${pointsCalculation.points} points to user ${order.user}`)
    console.log(
      `💰 Calculation base: ${order.total} (dishes: ${order.dishSubtotal}, bundles: ${order.bundleSubtotal})`,
    )

    return {
      pointsAwarded: pointsCalculation.points,
      calculationBase: order.total,
      rule: pointsCalculation.rule,
    }
  } catch (error) {
    console.error('Failed to process order points reward:', error)
    // 不拋出錯誤，避免影響訂單主流程
    return { pointsAwarded: 0 }
  }
}

/**
 * 處理支付
 */
export const processPayment = async (orderId, brandId, paymentData) => {
  const query = { _id: orderId }
  if (brandId) {
    query.brand = brandId
  }

  const order = await Order.findOne(query)

  if (!order) {
    throw new AppError('訂單不存在', 404)
  }

  if (order.status === 'paid') {
    throw new AppError('訂單已付款', 400)
  }

  // 模擬支付處理 - 返回模擬的支付ID和重定向URL
  const paymentId = `payment-${Date.now()}`
  const redirectUrl = `https://payment.example.com/redirect?paymentId=${paymentId}`

  // 更新支付資訊但不立即標記為已付款（等待回調）
  order.paymentMethod = paymentData.paymentMethod
  order.paymentType = paymentData.paymentType
  await order.save()

  return {
    success: true,
    paymentId,
    redirectUrl,
    order: order.toObject(),
  }
}

/**
 * 處理支付回調
 */
export const paymentCallback = async (orderId, brandId, callbackData) => {
  const query = { _id: orderId }
  if (brandId) {
    query.brand = brandId
  }

  const order = await Order.findOne(query)

  if (!order) {
    throw new AppError('訂單不存在', 404)
  }

  if (callbackData.status === 'success') {
    order.status = 'paid'
    order.transactionId = callbackData.transactionId
    await order.save()

    // 處理付款完成後的流程
    const result = await processOrderPaymentComplete(order)
    return {
      success: true,
      order: result,
      pointsAwarded: result.pointsAwarded || 0,
    }
  } else {
    order.status = 'cancelled'
    await order.save()
    return {
      success: false,
      order: order.toObject(),
    }
  }
}

/**
 * 恢復使用的 Voucher 狀態（用於訂單取消）
 */
export const restoreUsedVouchers = async (order) => {
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
 * 恢復使用的 Coupon 狀態（用於訂單取消）
 */
export const restoreUsedCoupons = async (order) => {
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
