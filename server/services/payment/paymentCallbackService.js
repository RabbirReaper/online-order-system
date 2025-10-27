/**
 * 付款回調處理服務
 * server/services/payment/paymentCallbackService.js
 */

import Order from '../../models/Order/Order.js'
import Transaction from '../../models/Payment/Transaction.js'
import * as newebpayService from './newebpayService.js'
import { finalizeOnlinePaymentOrder } from '../order/orderCreation.js'
import { AppError } from '../../middlewares/error.js'

/**
 * 處理 NewebPay 回調通知 (NotifyURL)
 * @param {Object} callbackData - NewebPay 回調資料
 * @returns {Promise<Object>} 處理結果
 */
export const handleNewebpayNotify = async (callbackData) => {
  try {
    console.log('📥 收到 NewebPay 回調通知')

    // Step 1: 解析並驗證回調資料
    const paymentResult = newebpayService.parseAndVerifyCallback(callbackData)

    console.log('✅ 回調資料驗證成功:', {
      merchantOrderNo: paymentResult.merchantOrderNo,
      success: paymentResult.success,
      amount: paymentResult.amount,
    })

    // Step 2: 根據商店訂單編號查找 Transaction
    const transaction = await Transaction.findOne({
      platformOrderNo: paymentResult.merchantOrderNo,
    }).populate('orderId')

    if (!transaction) {
      console.error('❌ 找不到對應的 Transaction:', paymentResult.merchantOrderNo)
      throw new AppError('找不到對應的交易記錄', 404, 'TRANSACTION_NOT_FOUND')
    }

    console.log('📦 找到對應的 Transaction:', transaction._id)

    // Step 3: 獲取訂單
    const order = await Order.findById(transaction.orderId)

    if (!order) {
      console.error('❌ 找不到對應的訂單:', transaction.orderId)
      throw new AppError('找不到對應的訂單', 404, 'ORDER_NOT_FOUND')
    }

    console.log('📋 找到對應的訂單:', order._id)

    // Step 4: 檢查訂單是否已處理（防止重複處理）
    if (order.isFinalized) {
      console.log('⚠️ 訂單已處理完成，略過重複通知')
      return {
        success: true,
        message: '訂單已處理',
        order,
        duplicate: true,
      }
    }

    // Step 5: 處理付款結果
    if (paymentResult.success) {
      // === 付款成功 ===
      console.log('💰 付款成功，開始完成訂單流程')

      // 更新 Transaction 狀態
      transaction.status = 'completed'
      transaction.completedAt = new Date()
      transaction.platformTransactionId = paymentResult.tradeNo
      transaction.processorResponse = {
        status: paymentResult.respondCode,
        message: paymentResult.message,
        paymentId: paymentResult.tradeNo,
      }
      await transaction.save()

      console.log('✅ Transaction 狀態已更新為 completed')

      // 完成訂單（扣庫存、標記優惠券、發放點數等）
      const finalizedOrder = await finalizeOnlinePaymentOrder(order._id, paymentResult)

      console.log('🎉 訂單完成:', finalizedOrder._id)

      return {
        success: true,
        message: '付款成功，訂單已完成',
        order: finalizedOrder,
        duplicate: false,
      }
    } else {
      // === 付款失敗 ===
      console.log('❌ 付款失敗，取消訂單')

      // 更新 Transaction 狀態
      transaction.status = 'failed'
      transaction.failureReason = paymentResult.message
      transaction.processorResponse = {
        status: paymentResult.respondCode,
        message: paymentResult.message,
      }
      await transaction.save()

      console.log('✅ Transaction 狀態已更新為 failed')

      // 取消訂單
      order.status = 'cancelled'
      order.cancelReason = `線上付款失敗: ${paymentResult.message}`
      order.cancelledAt = new Date()
      await order.save()

      console.log('✅ 訂單已取消:', order._id)

      return {
        success: false,
        message: '付款失敗，訂單已取消',
        order,
        duplicate: false,
      }
    }
  } catch (error) {
    console.error('❌ 處理 NewebPay 回調失敗:', error)
    throw error
  }
}

/**
 * 處理前景返回 (ReturnURL)
 * @param {Object} returnData - NewebPay 返回資料
 * @returns {Promise<Object>} 處理結果
 */
export const handleNewebpayReturn = async (returnData) => {
  try {
    console.log('🔙 收到 NewebPay 前景返回')

    // 解析返回資料
    const paymentResult = newebpayService.parseAndVerifyCallback(returnData)

    console.log('✅ 返回資料驗證成功:', {
      merchantOrderNo: paymentResult.merchantOrderNo,
      success: paymentResult.success,
    })

    // 查找訂單
    const transaction = await Transaction.findOne({
      platformOrderNo: paymentResult.merchantOrderNo,
    }).populate('orderId')

    if (!transaction) {
      console.error('❌ 找不到對應的 Transaction')
      throw new AppError('找不到對應的交易記錄', 404, 'TRANSACTION_NOT_FOUND')
    }

    const order = await Order.findById(transaction.orderId)

    if (!order) {
      console.error('❌ 找不到對應的訂單')
      throw new AppError('找不到對應的訂單', 404, 'ORDER_NOT_FOUND')
    }

    console.log('📋 找到訂單:', order._id, '狀態:', order.status)

    return {
      success: true,
      orderId: order._id,
      brandId: order.brand,
      storeId: order.store,
      orderStatus: order.status,
      isFinalized: order.isFinalized,
      paymentSuccess: paymentResult.success,
    }
  } catch (error) {
    console.error('❌ 處理前景返回失敗:', error)
    throw error
  }
}

/**
 * 映射 NewebPay 付款方式到系統付款方式
 * @param {string} newebpayType - NewebPay 付款方式
 * @returns {string} 系統付款方式
 */
export const mapNewebpayPaymentType = (newebpayType) => {
  const mapping = {
    CREDIT: 'credit_card', // 信用卡
    WEBATM: 'other', // 網路 ATM
    VACC: 'other', // ATM 轉帳
    CVS: 'other', // 超商代碼
    BARCODE: 'other', // 超商條碼
    LINEPAY: 'line_pay', // LINE Pay
    ESUNWALLET: 'other', // 玉山 Wallet
    TAIWANPAY: 'other', // 台灣 Pay
  }

  return mapping[newebpayType] || 'other'
}

export default {
  handleNewebpayNotify,
  handleNewebpayReturn,
  mapNewebpayPaymentType,
}
