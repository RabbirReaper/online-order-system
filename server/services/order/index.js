/**
 * 訂單服務入口文件
 * 匯總並導出所有訂單相關服務
 */

// 導入訂單計算服務
import * as calculateService from './calculateOrder.js';
import * as managementService from './orderManagement.js';
import * as statsService from './orderStats.js';

// 導出所有訂單服務
export const calculateOrder = calculateService;
export const orderManagement = managementService;
export const orderStats = statsService;

// 簡單導出，方便直接調用
export const {
  calculateItemSubtotal,
  calculateOrderSubtotal,
  calculateServiceCharge,
  calculateDiscountAmount,
  calculateTotalDiscount,
  calculateOrderTotal,
  calculateAllOrderAmounts,
  updateOrderAmounts
} = calculateService;

export const {
  cancelOrder,
  updateOrderStatus,
  confirmOrder,
  completeOrder
} = managementService;

export const {
  getDailyOrderStats,
  getMonthlyOrderStats,
  getUserOrderHistory
} = statsService;
