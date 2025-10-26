/**
 * 交易服務 - 處理支付交易業務邏輯
 * server/services/payment/transactionService.js
 */

import Transaction from '../../models/Payment/Transaction.js'
import Order from '../../models/Order/Order.js'
import { AppError } from '../../middlewares/error.js'

/**
 * 創建新交易 (付款前,包含臨時訂單資訊)
 * @param {Object} transactionData - 交易資料
 * @returns {Promise<Object>} 創建的交易
 */
export const createTransaction = async (transactionData) => {
  try {
    const transaction = new Transaction({
      brand: transactionData.brand,
      store: transactionData.store,
      orderId: transactionData.orderId || null, // 可選
      tempOrderData: transactionData.tempOrderData, // 臨時訂單資訊
      transactionId: transactionData.transactionId,
      amount: transactionData.amount,
      paymentMethod: transactionData.paymentMethod,
      status: 'pending',
      initiatedAt: new Date(),
    })

    await transaction.save()
    return transaction
  } catch (error) {
    throw new AppError('創建交易記錄失敗', 500, 'CREATE_TRANSACTION_FAILED', error)
  }
}

/**
 * 付款成功後關聯訂單
 * @param {string} transactionId - 交易ID
 * @param {string} orderId - 訂單ID
 * @returns {Promise<Object>} 更新後的交易
 */
export const linkOrder = async (transactionId, orderId) => {
  try {
    const transaction = await findByTransactionId(transactionId)

    transaction.orderId = orderId
    // 清除臨時訂單資訊 (已轉為正式訂單)
    transaction.tempOrderData = undefined

    await transaction.save()
    return transaction
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('關聯訂單失敗', 500, 'LINK_ORDER_FAILED', error)
  }
}

/**
 * 根據訂單ID查詢交易
 * @param {string} orderId - 訂單ID
 * @returns {Promise<Array>} 交易列表
 */
export const findByOrderId = async (orderId) => {
  try {
    return await Transaction.find({ orderId }).sort({ createdAt: -1 })
  } catch (error) {
    throw new AppError('查詢交易記錄失敗', 500, 'QUERY_TRANSACTION_FAILED', error)
  }
}

/**
 * 根據交易ID查詢交易
 * @param {string} transactionId - 交易ID
 * @returns {Promise<Object>} 交易記錄
 */
export const findByTransactionId = async (transactionId) => {
  try {
    const transaction = await Transaction.findOne({ transactionId })
    if (!transaction) {
      throw new AppError('找不到交易記錄', 404, 'TRANSACTION_NOT_FOUND')
    }
    return transaction
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('查詢交易記錄失敗', 500, 'QUERY_TRANSACTION_FAILED', error)
  }
}

/**
 * 標記交易為處理中
 * @param {string} transactionId - 交易ID
 * @param {Object} processorResponse - 支付閘道回應
 * @returns {Promise<Object>} 更新後的交易
 */
export const markAsProcessing = async (transactionId, processorResponse = null) => {
  try {
    const transaction = await findByTransactionId(transactionId)

    transaction.status = 'processing'
    if (processorResponse) {
      transaction.processorResponse = {
        status: processorResponse.status,
        message: processorResponse.message,
        paymentId: processorResponse.paymentId,
      }
    }

    await transaction.save()
    return transaction
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('更新交易狀態失敗', 500, 'UPDATE_TRANSACTION_FAILED', error)
  }
}

/**
 * 標記交易為完成
 * @param {string} transactionId - 交易ID
 * @param {Object} processorResponse - 支付閘道回應
 * @returns {Promise<Object>} 更新後的交易
 */
export const markAsCompleted = async (transactionId, processorResponse = null) => {
  try {
    const transaction = await findByTransactionId(transactionId)

    transaction.status = 'completed'
    transaction.completedAt = new Date()

    if (processorResponse) {
      transaction.processorResponse = {
        status: processorResponse.status,
        message: processorResponse.message,
        paymentId: processorResponse.paymentId,
      }
    }

    await transaction.save()
    return transaction
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('更新交易狀態失敗', 500, 'UPDATE_TRANSACTION_FAILED', error)
  }
}

/**
 * 標記交易為失敗
 * @param {string} transactionId - 交易ID
 * @param {string} reason - 失敗原因
 * @param {Object} processorResponse - 支付閘道回應
 * @returns {Promise<Object>} 更新後的交易
 */
export const markAsFailed = async (transactionId, reason, processorResponse = null) => {
  try {
    const transaction = await findByTransactionId(transactionId)

    transaction.status = 'failed'
    transaction.failureReason = reason

    if (processorResponse) {
      transaction.processorResponse = {
        status: processorResponse.status,
        message: processorResponse.message,
        paymentId: processorResponse.paymentId,
      }
    }

    await transaction.save()
    return transaction
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('更新交易狀態失敗', 500, 'UPDATE_TRANSACTION_FAILED', error)
  }
}

/**
 * 標記交易為取消
 * @param {string} transactionId - 交易ID
 * @returns {Promise<Object>} 更新後的交易
 */
export const markAsCancelled = async (transactionId) => {
  try {
    const transaction = await findByTransactionId(transactionId)

    transaction.status = 'cancelled'
    await transaction.save()
    return transaction
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('更新交易狀態失敗', 500, 'UPDATE_TRANSACTION_FAILED', error)
  }
}

/**
 * 獲取交易統計
 * @param {Date} startDate - 開始日期
 * @param {Date} endDate - 結束日期
 * @returns {Promise<Array>} 統計結果
 */
export const getTransactionStats = async (startDate, endDate) => {
  try {
    return await Transaction.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $sort: { totalAmount: -1 },
      },
    ])
  } catch (error) {
    throw new AppError('獲取交易統計失敗', 500, 'STATS_QUERY_FAILED', error)
  }
}

/**
 * 獲取支付方式統計
 * @param {Date} startDate - 開始日期
 * @param {Date} endDate - 結束日期
 * @returns {Promise<Array>} 支付方式統計
 */
export const getPaymentMethodStats = async (startDate, endDate) => {
  try {
    return await Transaction.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
          status: 'completed',
        },
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $sort: { totalAmount: -1 },
      },
    ])
  } catch (error) {
    throw new AppError('獲取支付方式統計失敗', 500, 'PAYMENT_STATS_FAILED', error)
  }
}

/**
 * 獲取成功交易的總金額
 * @param {Date} startDate - 開始日期
 * @param {Date} endDate - 結束日期
 * @returns {Promise<number>} 總金額
 */
export const getSuccessfulTransactionTotal = async (startDate, endDate) => {
  try {
    const result = await Transaction.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ])

    return result.length > 0 ? result[0] : { totalAmount: 0, count: 0 }
  } catch (error) {
    throw new AppError('獲取成功交易總額失敗', 500, 'TOTAL_CALCULATION_FAILED', error)
  }
}

/**
 * 驗證交易資料
 * @param {Object} transactionData - 交易資料
 * @returns {boolean} 是否有效
 */
export const validateTransactionData = (transactionData) => {
  const basicValidation =
    transactionData &&
    transactionData.brand &&
    transactionData.store &&
    transactionData.transactionId &&
    typeof transactionData.amount === 'number' &&
    transactionData.amount > 0 &&
    transactionData.paymentMethod &&
    ['credit_card', 'line_pay', 'apple_pay', 'google_pay', 'cash'].includes(
      transactionData.paymentMethod,
    )

  // 如果沒有 orderId,則需要有 tempOrderData
  if (!transactionData.orderId && !transactionData.tempOrderData) {
    return false
  }

  // 如果有 tempOrderData,驗證其必要欄位
  if (transactionData.tempOrderData) {
    const tempData = transactionData.tempOrderData
    return (
      basicValidation &&
      tempData.totalAmount &&
      tempData.items &&
      Array.isArray(tempData.items) &&
      tempData.items.length > 0
    )
  }

  return basicValidation
}

/**
 * 獲取待處理的交易 (有 tempOrderData 但無 orderId)
 * @returns {Promise<Array>} 待處理交易列表
 */
export const getPendingOrderTransactions = async () => {
  try {
    return await Transaction.find({
      tempOrderData: { $exists: true },
      orderId: { $exists: false },
      status: 'completed',
    }).sort({ completedAt: -1 })
  } catch (error) {
    throw new AppError('查詢待處理交易失敗', 500, 'QUERY_PENDING_FAILED', error)
  }
}
