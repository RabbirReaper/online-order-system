/**
 * TapPay 支付服務
 * server/services/payment/tapPayService.js
 */

import axios from 'axios'
import { AppError } from '../../middlewares/error.js'

class TapPayService {
  constructor() {
    // TapPay 設定 - 直接寫在代碼中
    this.config = {
      APP_ID: '160922',
      APP_KEY: 'app_PTXFmsaMgILnDLwCfpQhDmYeVXfKw5sNSi2khZU6ASeL4oyJjVaF0uSDEsgx',
      PARTNER_KEY: 'app_PTXFmsaMgILnDLwCfpQhDmYeVXfKw5sNSi2khZU6ASeL4oyJjVaF0uSDEsgx',
      MERCHANT_ID: 'tppf_RabbirReaper_GP_POS_3',
      API_BASE_URL: 'https://sandbox.tappaysdk.com',
      SANDBOX_MODE: true,
    }
  }

  /**
   * Pay by Prime API - 使用 Prime Token 進行付款
   * @param {string} primeToken - TapPay Prime Token
   * @param {number} amount - 付款金額
   * @param {Object} orderDetails - 訂單詳情
   * @returns {Promise<Object>} 支付結果
   */
  async payByPrime(primeToken, amount, orderDetails) {
    try {
      console.log('TapPay 支付請求:', {
        amount,
        orderNumber: orderDetails.orderNumber,
        customerName: orderDetails.customerName,
      })

      const requestData = {
        prime: primeToken,
        partner_key: this.config.PARTNER_KEY,
        merchant_id: this.config.MERCHANT_ID,
        amount: amount,
        currency: 'TWD',
        details: orderDetails.description,
        cardholder: {
          phone_number: orderDetails.customerPhone,
          name: orderDetails.customerName,
          email: orderDetails.customerEmail || '',
        },
        remember: false,
        order_number: orderDetails.orderNumber,
      }

      const response = await axios.post(
        `${this.config.API_BASE_URL}/tpc/payment/pay-by-prime`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.config.PARTNER_KEY,
          },
          timeout: 30000, // 30秒超時
        },
      )

      console.log('TapPay 支付回應:', response.data)

      if (response.data.status === 0) {
        // 支付成功
        return {
          success: true,
          transactionId: response.data.rec_trade_id,
          bankTransactionId: response.data.bank_transaction_id,
          amount: response.data.amount,
          currency: response.data.currency,
          orderNumber: response.data.order_number,
          rawResponse: response.data,
        }
      } else {
        // 支付失敗
        throw new AppError(response.data.msg || 'TapPay 支付處理失敗', 400, 'PAYMENT_FAILED', {
          tapPayStatus: response.data.status,
          tapPayMessage: response.data.msg,
        })
      }
    } catch (error) {
      console.error('TapPay payByPrime 錯誤:', error)

      if (error instanceof AppError) {
        throw error
      }

      if (error.code === 'ECONNABORTED') {
        throw new AppError('支付請求超時，請稍後再試', 408, 'PAYMENT_TIMEOUT')
      }

      if (error.response) {
        const errorData = error.response.data
        throw new AppError(
          errorData.msg || 'TapPay 支付服務錯誤',
          error.response.status,
          'TAPPAY_API_ERROR',
          errorData,
        )
      }

      throw new AppError('支付服務暫時無法使用', 503, 'PAYMENT_SERVICE_ERROR')
    }
  }

  /**
   * 查詢交易狀態
   * @param {string} transactionId - TapPay 交易 ID
   * @returns {Promise<Object>} 交易狀態
   */
  async getTransactionStatus(transactionId) {
    try {
      const requestData = {
        partner_key: this.config.PARTNER_KEY,
        rec_trade_id: transactionId,
      }

      const response = await axios.post(
        `${this.config.API_BASE_URL}/tpc/transaction/query`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.config.PARTNER_KEY,
          },
          timeout: 15000,
        },
      )

      if (response.data.status === 0) {
        return {
          success: true,
          transactionId: response.data.rec_trade_id,
          status: response.data.transaction_status,
          amount: response.data.amount,
          currency: response.data.currency,
          orderNumber: response.data.order_number,
          paymentTime: response.data.transaction_time,
          rawResponse: response.data,
        }
      } else {
        throw new AppError(response.data.msg || '查詢交易狀態失敗', 400, 'QUERY_FAILED')
      }
    } catch (error) {
      console.error('TapPay getTransactionStatus 錯誤:', error)

      if (error instanceof AppError) {
        throw error
      }

      if (error.response) {
        const errorData = error.response.data
        throw new AppError(
          errorData.msg || 'TapPay 查詢服務錯誤',
          error.response.status,
          'TAPPAY_QUERY_ERROR',
          errorData,
        )
      }

      throw new AppError('查詢服務暫時無法使用', 503, 'QUERY_SERVICE_ERROR')
    }
  }

  /**
   * 退款
   * @param {string} transactionId - TapPay 交易 ID
   * @param {number} amount - 退款金額
   * @param {string} reason - 退款原因
   * @returns {Promise<Object>} 退款結果
   */
  async refund(transactionId, amount, reason = '訂單取消') {
    try {
      const requestData = {
        partner_key: this.config.PARTNER_KEY,
        rec_trade_id: transactionId,
        amount: amount,
        details: reason,
      }

      const response = await axios.post(
        `${this.config.API_BASE_URL}/tpc/transaction/refund`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.config.PARTNER_KEY,
          },
          timeout: 30000,
        },
      )

      if (response.data.status === 0) {
        return {
          success: true,
          refundId: response.data.rec_trade_id,
          originalTransactionId: transactionId,
          refundAmount: response.data.amount,
          refundTime: new Date().toISOString(),
          rawResponse: response.data,
        }
      } else {
        throw new AppError(response.data.msg || '退款處理失敗', 400, 'REFUND_FAILED')
      }
    } catch (error) {
      console.error('TapPay refund 錯誤:', error)

      if (error instanceof AppError) {
        throw error
      }

      if (error.response) {
        const errorData = error.response.data
        throw new AppError(
          errorData.msg || 'TapPay 退款服務錯誤',
          error.response.status,
          'TAPPAY_REFUND_ERROR',
          errorData,
        )
      }

      throw new AppError('退款服務暫時無法使用', 503, 'REFUND_SERVICE_ERROR')
    }
  }

  /**
   * LINE Pay 支付（透過 TapPay）
   * @param {number} amount - 付款金額
   * @param {Object} orderInfo - 訂單資訊
   * @returns {Promise<Object>} LINE Pay 支付結果
   */
  async processLinePayment(amount, orderInfo) {
    try {
      const requestData = {
        partner_key: this.config.PARTNER_KEY,
        merchant_id: this.config.MERCHANT_ID,
        amount: amount,
        currency: 'TWD',
        order_number: orderInfo.orderNumber,
        product_name: orderInfo.productName || '線上點餐',
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/line-pay/return`,
        notify_url: `${process.env.BACKEND_URL || 'http://localhost:8700'}/api/orders/payment/line-pay/notify`,
      }

      const response = await axios.post(
        `${this.config.API_BASE_URL}/tpc/line-pay/payment`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.config.PARTNER_KEY,
          },
          timeout: 30000,
        },
      )

      if (response.data.status === 0) {
        return {
          success: true,
          paymentUrl: response.data.payment_url,
          transactionId: response.data.rec_trade_id,
          rawResponse: response.data,
        }
      } else {
        throw new AppError(response.data.msg || 'LINE Pay 支付處理失敗', 400, 'LINE_PAY_FAILED')
      }
    } catch (error) {
      console.error('TapPay processLinePayment 錯誤:', error)

      if (error instanceof AppError) {
        throw error
      }

      throw new AppError('LINE Pay 服務暫時無法使用', 503, 'LINE_PAY_SERVICE_ERROR')
    }
  }

  /**
   * 驗證支付金額
   * @param {number} amount - 金額
   * @returns {boolean} 是否有效
   */
  validateAmount(amount) {
    return typeof amount === 'number' && amount > 0 && amount <= 999999
  }

  /**
   * 驗證訂單資訊
   * @param {Object} orderDetails - 訂單詳情
   * @returns {boolean} 是否有效
   */
  validateOrderDetails(orderDetails) {
    return (
      orderDetails &&
      orderDetails.orderNumber &&
      orderDetails.customerName &&
      orderDetails.customerPhone &&
      orderDetails.description
    )
  }
}

// 導出單例
export default new TapPayService()
