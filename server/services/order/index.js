/**
 * 訂單服務入口文件
 * server/services/order/index.js
 * 按照權限分離導出客戶和管理員服務
 */

// 導入客戶相關服務
import * as orderCustomer from './orderCustomer.js'

// 導入管理員相關服務
import * as orderAdmin from './orderAdmin.js'

// 分別導出
export { orderCustomer, orderAdmin }

// 為了向後兼容，也可以直接導出常用功能
export const {
  createOrder,
  getUserOrders,
  getUserOrderById,
  processPayment,
  handlePaymentCallback,
  generateOrderNumber,
  calculateOrderAmounts,
  updateOrderAmounts,
  processOrderPaymentComplete,
  processOrderPointsReward,
} = orderCustomer

export const { getStoreOrders, getOrderById, updateOrder, cancelOrder } = orderAdmin
