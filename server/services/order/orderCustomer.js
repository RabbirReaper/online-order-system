/**
 * 訂單客戶服務 - 重構版
 * 處理客戶相關的訂單操作（支援 Bundle 購買 + 混合購買 + Voucher 折扣）
 */

import VoucherTemplate from '../../models/Promotion/VoucherTemplate.js'
import VoucherInstance from '../../models/Promotion/VoucherInstance.js'
import { AppError } from '../../middlewares/error.js'

// 導入重構後的模組
import { createOrder as createOrderCore } from './orderCreation.js'
import {
  processPayment as processPaymentCore,
  paymentCallback as paymentCallbackCore,
  processOrderPaymentComplete,
  processOrderPointsReward
} from './orderPayment.js'
import {
  getUserOrders as getUserOrdersCore,
  getUserOrderById as getUserOrderByIdCore
} from './orderQueries.js'
import {
  generateOrderNumber as generateOrderNumberCore,
  calculateOrderAmounts as calculateOrderAmountsCore,
  updateOrderAmounts
} from './orderUtils.js'

/**
 * 創建訂單 - 支援 Bundle 購買 + 預先庫存檢查 + Voucher 折扣
 */
export const createOrder = async (orderData) => {
  return await createOrderCore(orderData)
}


// 重新導出支付完成處理函數，保持向後兼容
export { processOrderPaymentComplete } from './orderPayment.js'

// 重新導出點數獎勵處理函數，保持向後兼容
export { processOrderPointsReward } from './orderPayment.js'

// 重新導出訂單金額更新函數，保持向後兼容
export { updateOrderAmounts } from './orderUtils.js'

/**
 * 獲取用戶訂單
 */
export const getUserOrders = async (userId, options = {}) => {
  return await getUserOrdersCore(userId, options)
}

/**
 * 根據ID獲取訂單詳情
 */
export const getUserOrderById = async (orderId, brandId) => {
  return await getUserOrderByIdCore(orderId, brandId)
}

/**
 * 生成訂單編號
 */
export const generateOrderNumber = async (storeId) => {
  return await generateOrderNumberCore(storeId)
}

/**
 * 🧮 計算訂單金額 (工具函數)
 */
export const calculateOrderAmounts = (items) => {
  return calculateOrderAmountsCore(items)
}

/**
 * 處理支付
 */
export const processPayment = async (orderId, brandId, paymentData) => {
  return await processPaymentCore(orderId, brandId, paymentData)
}

/**
 * 處理支付回調
 */
export const paymentCallback = async (orderId, brandId, callbackData) => {
  return await paymentCallbackCore(orderId, brandId, callbackData)
}

/**
 * 發放兌換券給用戶（管理員功能）
 */
export const issueVoucherToUser = async (userId, templateId, adminId, reason = '管理員發放') => {
  const template = await VoucherTemplate.findById(templateId).populate(
    'exchangeDishTemplate',
    'name basePrice',
  )

  if (!template) {
    throw new AppError('兌換券模板不存在', 404)
  }

  if (!template.isActive) {
    throw new AppError('兌換券模板已停用', 400)
  }

  // 計算過期日期（使用預設30天，或可以從模板中讀取）
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + 30) // 預設30天有效期

  const voucherInstance = new VoucherInstance({
    brand: template.brand,
    template: templateId,
    user: userId,
    voucherName: template.name,
    exchangeDishTemplate: template.exchangeDishTemplate,
    acquiredAt: new Date(),
    expiryDate,
    // 管理員發放的 voucher 不設定 createdBy
  })

  await voucherInstance.save()

  // 🔧 重要：更新模板發放數量
  template.totalIssued += 1
  await template.save()

  return {
    success: true,
    message: '兌換券發放成功',
    voucher: voucherInstance,
  }
}
