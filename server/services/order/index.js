/**
 * 訂單服務入口文件
 * 匯總並導出所有訂單相關服務
 */

// 導入各模組
import * as orderCore from './orderCore.js';
import * as orderManagement from './orderManagement.js';
import * as orderPayment from './orderPayment.js';
import * as orderStats from './orderStats.js';

// 導出所有服務
export {
  orderCore,
  orderManagement,
  orderPayment,
  orderStats
};

// 簡單導出核心功能，方便直接調用
export const {
  createOrder,
  getOrderById,
  getStoreOrders,
  verifyOrderOwnership,
  getUserOrderById,
  getGuestOrderById,
  calculateOrderAmounts,
  updateOrderAmounts
} = orderCore;

export const {
  generateOrderNumber,
  updateOrderStatus,
  updateOrderManualAdjustment,
  cancelOrder,
  confirmOrder,
  completeOrder
} = orderManagement;

export const {
  processPayment,
  handlePaymentCallback
} = orderPayment;

export const {
  getDailyOrderStats,
  getMonthlyOrderStats,
  getUserOrderHistory,
  getPopularDishes
} = orderStats;
