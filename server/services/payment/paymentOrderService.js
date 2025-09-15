/**
 * 付款與訂單處理服務 - 整合 TapPay + Transaction + Order 流程
 * server/services/payment/paymentOrderService.js
 */

import tapPayService from './tapPayService.js'
import transactionService from './transactionService.js'
import Order from '../../models/Order/Order.js'
import { AppError } from '../../middlewares/error.js'

// 簡單的 UUID 生成器 (替代 uuid 包)
function generateUUID() {
  return 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

class PaymentOrderService {
  /**
   * 完整付款流程：先付款，成功後創建訂單
   * @param {Object} orderData - 訂單資料
   * @param {string} primeToken - TapPay Prime Token
   * @param {string} paymentMethod - 支付方式
   * @returns {Promise<Object>} 處理結果
   */
  async processPaymentAndCreateOrder(orderData, primeToken, paymentMethod = 'credit_card') {
    let transaction = null

    try {
      // 1. 生成唯一交易ID
      const transactionId = generateUUID()

      // 2. 創建交易記錄 (包含臨時訂單資訊，尚無 orderId)
      const transactionData = {
        brand: orderData.brand,
        store: orderData.store,
        transactionId,
        amount: orderData.totalAmount,
        paymentMethod,
        tempOrderData: {
          customerId: orderData.customerId,
          customerInfo: {
            name: orderData.customerName,
            phone: orderData.customerPhone,
            email: orderData.customerEmail,
          },
          items: orderData.items,
          totalAmount: orderData.totalAmount,
          orderType: orderData.orderType || 'takeout',
        },
      }

      if (!transactionService.validateTransactionData(transactionData)) {
        throw new AppError('交易資料驗證失敗', 400, 'INVALID_TRANSACTION_DATA')
      }

      transaction = await transactionService.createTransaction(transactionData)

      // 3. 標記交易為處理中
      await transactionService.markAsProcessing(transactionId)

      // 4. 呼叫 TapPay 進行付款
      const tapPayOrderDetails = {
        orderNumber: transactionId, // 使用 transactionId 作為臨時訂單號
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        customerEmail: orderData.customerEmail,
        description: this.generateOrderDescription(orderData.items),
      }

      const paymentResult = await tapPayService.payByPrime(
        primeToken,
        orderData.totalAmount,
        tapPayOrderDetails
      )

      if (!paymentResult.success) {
        await transactionService.markAsFailed(
          transactionId,
          '支付失敗',
          paymentResult
        )
        throw new AppError('支付失敗', 400, 'PAYMENT_FAILED')
      }

      // 5. 付款成功，標記交易完成
      await transactionService.markAsCompleted(transactionId, {
        status: 'success',
        message: '支付成功',
        paymentId: paymentResult.transactionId,
      })

      // 6. 創建正式訂單
      const order = await this.createOrderFromTransaction(transaction)

      // 7. 關聯交易與訂單
      await transactionService.linkOrder(transactionId, order._id)

      return {
        success: true,
        order,
        transaction: await transactionService.findByTransactionId(transactionId),
        paymentResult,
      }

    } catch (error) {
      // 錯誤處理：如果交易已創建，標記為失敗
      if (transaction) {
        await transactionService.markAsFailed(
          transaction.transactionId,
          error.message || '處理失敗'
        )
      }

      if (error instanceof AppError) {
        throw error
      }

      throw new AppError('付款處理失敗', 500, 'PAYMENT_PROCESS_FAILED', error)
    }
  }

  /**
   * 從交易記錄創建正式訂單
   * @param {Object} transaction - 交易記錄
   * @returns {Promise<Object>} 創建的訂單
   */
  async createOrderFromTransaction(transaction) {
    try {
      const tempData = transaction.tempOrderData

      const orderData = {
        brand: transaction.brand,
        store: transaction.store,
        customerId: tempData.customerId,
        customerInfo: tempData.customerInfo,
        items: tempData.items,
        totalAmount: tempData.totalAmount,
        orderType: tempData.orderType,
        status: 'confirmed', // 付款成功直接確認
        paymentStatus: 'paid',
        paymentMethod: transaction.paymentMethod,
        transactionId: transaction.transactionId,
      }

      const order = new Order(orderData)
      await order.save()

      return order
    } catch (error) {
      throw new AppError('創建訂單失敗', 500, 'CREATE_ORDER_FAILED', error)
    }
  }

  /**
   * 生成訂單描述
   * @param {Array} items - 訂單項目
   * @returns {string} 訂單描述
   */
  generateOrderDescription(items) {
    if (!items || items.length === 0) {
      return '線上點餐'
    }

    const itemNames = items.map(item => `${item.name} x${item.quantity}`).join(', ')
    return `線上點餐: ${itemNames}`
  }

  /**
   * 查詢訂單付款狀態
   * @param {string} orderId - 訂單ID
   * @returns {Promise<Object>} 付款狀態
   */
  async getOrderPaymentStatus(orderId) {
    try {
      const transactions = await transactionService.findByOrderId(orderId)

      if (transactions.length === 0) {
        throw new AppError('找不到付款記錄', 404, 'PAYMENT_NOT_FOUND')
      }

      const latestTransaction = transactions[0]

      // 如果是線上支付且已完成，查詢最新狀態
      if (latestTransaction.paymentMethod !== 'cash' &&
          latestTransaction.status === 'completed') {
        try {
          const tapPayStatus = await tapPayService.getTransactionStatus(
            latestTransaction.transactionId
          )
          return {
            status: latestTransaction.status,
            paymentMethod: latestTransaction.paymentMethod,
            amount: latestTransaction.amount,
            tapPayStatus,
          }
        } catch (tapPayError) {
          console.warn('查詢 TapPay 狀態失敗:', tapPayError)
        }
      }

      return {
        status: latestTransaction.status,
        paymentMethod: latestTransaction.paymentMethod,
        amount: latestTransaction.amount,
      }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('查詢付款狀態失敗', 500, 'QUERY_PAYMENT_STATUS_FAILED', error)
    }
  }

  /**
   * 處理退款
   * @param {string} orderId - 訂單ID
   * @param {number} refundAmount - 退款金額
   * @param {string} reason - 退款原因
   * @returns {Promise<Object>} 退款結果
   */
  async processRefund(orderId, refundAmount, reason = '訂單取消') {
    try {
      const transactions = await transactionService.findByOrderId(orderId)
      const transaction = transactions.find(t => t.status === 'completed')

      if (!transaction) {
        throw new AppError('找不到可退款的交易', 404, 'NO_REFUNDABLE_TRANSACTION')
      }

      if (transaction.paymentMethod === 'cash') {
        throw new AppError('現金付款無法線上退款', 400, 'CASH_REFUND_NOT_SUPPORTED')
      }

      // 呼叫 TapPay 退款
      const refundResult = await tapPayService.refund(
        transaction.transactionId,
        refundAmount,
        reason
      )

      if (refundResult.success) {
        // 更新訂單狀態為已退款
        await Order.findByIdAndUpdate(orderId, {
          status: 'refunded',
          paymentStatus: 'refunded',
        })

        return {
          success: true,
          refundId: refundResult.refundId,
          amount: refundAmount,
          reason,
        }
      }

      throw new AppError('退款處理失敗', 400, 'REFUND_FAILED')
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('退款處理失敗', 500, 'REFUND_PROCESS_FAILED', error)
    }
  }
}

// 導出單例
export default new PaymentOrderService()